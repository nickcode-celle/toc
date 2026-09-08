import { BASE_POSITION, TEAMMATE, TRACK_SIZE } from "./constants";
import { forwardDestination } from "./movement";
import { isProtectedBaseOccupied, marbleAtTrackPosition } from "./rules";
import type { GameState, Marble, PlayerId } from "./types";

export interface SpecialMoveResult {
  legal: boolean;
  reason?: string;
  capturedMarbleIds: string[];
}

function backwardPath(start: number, steps: number): number[] {
  return Array.from({ length: steps }, (_, i) =>
    (start - i - 1 + TRACK_SIZE) % TRACK_SIZE,
  );
}

/** Card 4: exactly four positions backwards on the circuit.
 * Every marble passed over or landed on is captured, including teammate marbles.
 * An occupied base remains an absolute blocker/protected position.
 */
export function checkBackwardFour(
  state: GameState,
  marble: Marble,
): SpecialMoveResult {
  if (marble.zone !== "TRACK" || marble.trackPosition === null) {
    return { legal: false, reason: "Four requires a marble on the circuit", capturedMarbleIds: [] };
  }

  const path = backwardPath(marble.trackPosition, 4);
  const captures: string[] = [];

  for (const position of path) {
    if (isProtectedBaseOccupied(state, position, marble.id)) {
      return { legal: false, reason: "Occupied base blocks the four", capturedMarbleIds: [] };
    }
    const target = marbleAtTrackPosition(state, position, marble.id);
    if (target) captures.push(target.id);
  }

  return { legal: true, capturedMarbleIds: [...new Set(captures)] };
}

export interface SevenPart {
  marbleId: string;
  steps: number;
}

/** Returns the player whose marbles are controlled by currentPlayer. */
export function controlledOwner(state: GameState, currentPlayer: PlayerId): PlayerId {
  const ownFinished = state.marbles
    .filter((m) => m.owner === currentPlayer)
    .every((m) => m.zone === "FINISH");
  return ownFinished ? TEAMMATE[currentPlayer] : currentPlayer;
}

/**
 * Structural validation for card 7.
 * - exactly seven points must be consumed;
 * - a marble may appear only once;
 * - only currently controlled marbles may be used;
 * - control may switch to the teammate during the same seven immediately
 *   after the player's fourth marble reaches FINISH.
 *
 * Detailed path/capture application is deliberately performed sequentially
 * by the game executor so later parts see the board produced by earlier parts.
 */
export function validateSevenPlan(
  state: GameState,
  currentPlayer: PlayerId,
  parts: SevenPart[],
): SpecialMoveResult {
  if (parts.length === 0) {
    return { legal: false, reason: "Seven must move at least one marble", capturedMarbleIds: [] };
  }

  if (parts.some((p) => !Number.isInteger(p.steps) || p.steps <= 0)) {
    return { legal: false, reason: "Every seven part must use positive whole steps", capturedMarbleIds: [] };
  }

  if (parts.reduce((sum, p) => sum + p.steps, 0) !== 7) {
    return { legal: false, reason: "All seven points must be used", capturedMarbleIds: [] };
  }

  const ids = parts.map((p) => p.marbleId);
  if (new Set(ids).size !== ids.length) {
    return { legal: false, reason: "A marble can be used only once during a seven", capturedMarbleIds: [] };
  }

  // Simulate only ownership/control transition here. Board legality is checked
  // by the executor after each part.
  let controller: PlayerId = currentPlayer;
  let ownFinishedCount = state.marbles.filter(
    (m) => m.owner === currentPlayer && m.zone === "FINISH",
  ).length;

  if (ownFinishedCount === 4) controller = TEAMMATE[currentPlayer];

  for (const part of parts) {
    const marble = state.marbles.find((m) => m.id === part.marbleId);
    if (!marble) return { legal: false, reason: "Unknown marble", capturedMarbleIds: [] };
    if (marble.owner !== controller) {
      return { legal: false, reason: "Seven uses a marble not currently controlled", capturedMarbleIds: [] };
    }

    if (controller === currentPlayer && marble.zone !== "HOME") {
      const destination = forwardDestination(marble, part.steps);
      if (destination?.zone === "FINISH" && marble.zone !== "FINISH") {
        ownFinishedCount += 1;
        if (ownFinishedCount === 4) controller = TEAMMATE[currentPlayer];
      }
    }
  }

  return { legal: true, capturedMarbleIds: [] };
}

/** Track positions traversed by one forward part of a seven. */
export function sevenTrackPath(marble: Marble, steps: number): number[] {
  if (marble.zone !== "TRACK" || marble.trackPosition === null) return [];
  return Array.from({ length: steps }, (_, i) =>
    (marble.trackPosition! + i + 1) % TRACK_SIZE,
  );
}

export function isOwnBase(marble: Marble): boolean {
  return marble.zone === "TRACK" && marble.trackPosition === BASE_POSITION[marble.owner];
}
