import { TRACK_SIZE } from "./constants";
import { forwardDestination } from "./movement";
import { isBasePosition, isProtectedBaseOccupied, marbleAtTrackPosition } from "./rules";
import { controlledOwner, type SevenPart } from "./specialMoves";
import type { GameState, Marble, PlayerId } from "./types";

function cloneState(state: GameState): GameState { return { ...state, players: state.players.map((p) => ({ ...p, hand: [...p.hand] })), marbles: state.marbles.map((m) => ({ ...m })), deck: [...state.deck], discardPile: [...state.discardPile] }; }
function sendHome(m: Marble): void { m.zone = "HOME"; m.trackPosition = null; m.finishPosition = null; }

function applyPart(state: GameState, marble: Marble, steps: number): boolean {
  const destination = forwardDestination(marble, steps);
  if (!destination) return false;
  if (destination.zone === "TRACK" && isBasePosition(destination.trackPosition)) return false;

  if (marble.zone === "TRACK" && marble.trackPosition !== null) {
    const start = marble.trackPosition;
    const trackSteps = destination.zone === "FINISH" ? steps - (destination.finishPosition + 1) : steps;
    for (let i = 1; i <= trackSteps; i += 1) {
      const position = (start + i) % TRACK_SIZE;
      if (isProtectedBaseOccupied(state, position, marble.id)) return false;
      const target = marbleAtTrackPosition(state, position, marble.id);
      if (target) sendHome(target);
    }
  }

  if (destination.zone === "FINISH") {
    const startFinish = marble.zone === "FINISH" && marble.finishPosition !== null ? marble.finishPosition : -1;
    const blocked = state.marbles.some((m) => m.id !== marble.id && m.owner === marble.owner && m.zone === "FINISH" && m.finishPosition !== null && m.finishPosition > startFinish && m.finishPosition <= destination.finishPosition);
    if (blocked) return false;
    marble.zone = "FINISH"; marble.trackPosition = null; marble.finishPosition = destination.finishPosition;
  } else {
    marble.zone = "TRACK"; marble.trackPosition = destination.trackPosition; marble.finishPosition = null;
  }
  return true;
}

/** Atomic simulation: null means the entire seven is rejected and the input state is untouched. */
export function simulateSevenPlan(state: GameState, player: PlayerId, parts: SevenPart[]): GameState | null {
  if (parts.length === 0 || parts.some((p) => !Number.isInteger(p.steps) || p.steps <= 0)) return null;
  if (parts.reduce((sum, p) => sum + p.steps, 0) !== 7) return null;
  const used = new Set<string>();
  const next = cloneState(state);

  for (const part of parts) {
    if (used.has(part.marbleId)) return null;
    used.add(part.marbleId);
    const controller = controlledOwner(next, player);
    const marble = next.marbles.find((m) => m.id === part.marbleId);
    if (!marble || marble.owner !== controller || marble.zone === "HOME") return null;
    if (!applyPart(next, marble, part.steps)) return null;
  }
  return next;
}
