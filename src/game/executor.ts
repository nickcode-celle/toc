import { BASE_POSITION, TRACK_SIZE } from "./constants";
import { applyJackSwap } from "./aceKingJack";
import { getLegalMoves, type LegalMove } from "./legalMoves";
import { forwardDestination } from "./movement";
import { isProtectedBaseOccupied, marbleAtTrackPosition } from "./rules";
import { checkBackwardFour } from "./specialMoves";
import type { GameState, Marble, PlayerId, TeamId } from "./types";

function cloneState(state: GameState): GameState {
  return { ...state, players: state.players.map((p) => ({ ...p, hand: [...p.hand] })), marbles: state.marbles.map((m) => ({ ...m })), deck: [...state.deck], discardPile: [...state.discardPile] };
}

function sendHome(marble: Marble): void {
  marble.zone = "HOME"; marble.trackPosition = null; marble.finishPosition = null; marble.qualifiedForFinish = false;
}

function applyCaptures(state: GameState, ids: string[]): void {
  for (const id of ids) { const m = state.marbles.find((x) => x.id === id); if (m) sendHome(m); }
}

function removePlayedCard(state: GameState, player: PlayerId, cardId: string): void {
  const p = state.players.find((x) => x.id === player); if (!p) return;
  const index = p.hand.findIndex((c) => c.id === cardId); if (index < 0) return;
  const [card] = p.hand.splice(index, 1); state.discardPile.push(card);
}

function sameMove(a: LegalMove, b: LegalMove): boolean { return JSON.stringify(a) === JSON.stringify(b); }

function detectWinner(state: GameState): TeamId | null {
  for (const team of [0, 1] as TeamId[]) {
    const owners = state.players.filter((p) => p.team === team).map((p) => p.id);
    if (state.marbles.filter((m) => owners.includes(m.owner)).every((m) => m.zone === "FINISH")) return team;
  }
  return null;
}

export function nextPlayer(player: PlayerId): PlayerId { return ((player + 1) % 4) as PlayerId; }

export function advanceTurn(state: GameState): void {
  let candidate = nextPlayer(state.currentPlayer);
  for (let i = 0; i < 4; i += 1) {
    const p = state.players.find((x) => x.id === candidate)!;
    if (!p.hasDiscardedHand && p.hand.length > 0) { state.currentPlayer = candidate; return; }
    candidate = nextPlayer(candidate);
  }
  state.currentPlayer = candidate;
}

/** Executes one part of a 7 on the current intermediate board. The 7 eats every
 * ordinary circuit marble it passes or lands on, including teammate marbles.
 * Occupied bases remain absolute blockers. Arrival marbles block passage. */
function executeSevenPart(state: GameState, marble: Marble, steps: number): void {
  const destination = forwardDestination(marble, steps);
  if (!destination) throw new Error("Illegal seven part");

  if (marble.zone === "TRACK" && marble.trackPosition !== null) {
    const start = marble.trackPosition;
    for (let i = 1; i <= steps; i += 1) {
      const pos = (start + i) % TRACK_SIZE;
      if (isProtectedBaseOccupied(state, pos, marble.id)) throw new Error("Seven blocked by occupied base");
      const target = marbleAtTrackPosition(state, pos, marble.id);
      if (target) sendHome(target);
      if (destination.zone === "FINISH" && i === steps - destination.finishPosition) break;
    }
  }

  if (destination.zone === "FINISH") {
    const startFinish = marble.zone === "FINISH" && marble.finishPosition !== null ? marble.finishPosition : -1;
    const blocked = state.marbles.some((m) => m.id !== marble.id && m.owner === marble.owner && m.zone === "FINISH" && m.finishPosition !== null && m.finishPosition > startFinish && m.finishPosition <= destination.finishPosition);
    if (blocked) throw new Error("Seven blocked in arrival lane");
    marble.zone = "FINISH"; marble.trackPosition = null; marble.finishPosition = destination.finishPosition;
  } else {
    marble.zone = "TRACK"; marble.trackPosition = destination.trackPosition; marble.finishPosition = null;
  }
}

export function executeMove(state: GameState, move: LegalMove): GameState {
  const legal = getLegalMoves(state, state.currentPlayer);
  if (!legal.some((candidate) => sameMove(candidate, move))) throw new Error("Illegal move");

  const next = cloneState(state); const player = next.currentPlayer;
  const marble = "marbleId" in move ? next.marbles.find((m) => m.id === move.marbleId) : undefined;

  if (move.type === "EXIT" && marble) { marble.zone = "TRACK"; marble.trackPosition = BASE_POSITION[marble.owner]; marble.finishPosition = null; }

  if (move.type === "MOVE" && marble) {
    const destination = forwardDestination(marble, move.steps); if (!destination) throw new Error("Invalid destination");
    if (destination.zone === "TRACK") {
      const victim = next.marbles.find((m) => m.id !== marble.id && m.zone === "TRACK" && m.trackPosition === destination.trackPosition); if (victim) sendHome(victim);
      marble.trackPosition = destination.trackPosition;
    } else { marble.zone = "FINISH"; marble.trackPosition = null; marble.finishPosition = destination.finishPosition; }
  }

  if (move.type === "FOUR" && marble && marble.trackPosition !== null) {
    const check = checkBackwardFour(next, marble); applyCaptures(next, check.capturedMarbleIds);
    marble.trackPosition = (marble.trackPosition - 4 + TRACK_SIZE) % TRACK_SIZE;
    if (state.marbles.find((m) => m.id === marble.id)?.trackPosition === BASE_POSITION[marble.owner]) marble.qualifiedForFinish = true;
  }

  if (move.type === "JACK") {
    const a = next.marbles.find((m) => m.id === move.marbleId)!; const b = next.marbles.find((m) => m.id === move.targetMarbleId)!;
    const [newA, newB] = applyJackSwap(a, b); Object.assign(a, newA); Object.assign(b, newB);
  }

  if (move.type === "SEVEN") {
    for (const part of move.parts) {
      const m = next.marbles.find((x) => x.id === part.marbleId); if (!m) throw new Error("Unknown seven marble");
      executeSevenPart(next, m, part.steps);
    }
  }

  removePlayedCard(next, player, move.cardId); next.winner = detectWinner(next); if (next.winner === null) advanceTurn(next); return next;
}

export function discardWholeHand(state: GameState): GameState {
  const next = cloneState(state); const p = next.players.find((x) => x.id === next.currentPlayer)!;
  if (getLegalMoves(next, next.currentPlayer).length > 0) throw new Error("Cannot discard: at least one legal move exists");
  next.discardPile.push(...p.hand); p.hand = []; p.hasDiscardedHand = true; advanceTurn(next); return next;
}
