import {
  BASE_POSITION,
  FINISH_GATE_LOCAL_POSITION,
  FINISH_SIZE,
  TRACK_SIZE,
} from "./constants";
import type { Marble, PlayerId } from "./types";

export type Destination =
  | { zone: "TRACK"; trackPosition: number }
  | { zone: "FINISH"; finishPosition: number };

export function clockwiseDistance(from: number, to: number): number {
  return (to - from + TRACK_SIZE) % TRACK_SIZE;
}

/** Converts a global track position to the owner's local circuit coordinate.
 * base = 0, then the following holes clockwise are 1..63.
 */
export function localPosition(owner: PlayerId, trackPosition: number): number {
  return clockwiseDistance(BASE_POSITION[owner], trackPosition);
}

/**
 * Returns the destination for a normal forward move.
 *
 * Arrival rule currently encoded from the validated table rule:
 * - the marble must have qualified to enter its own arrival;
 * - if the forward card can enter the arrival legally, entry is mandatory;
 * - if its value is too large for the 4 arrival slots, the marble stays on
 *   the circuit and continues clockwise (14, 15, base, etc.).
 *
 * Occupancy/blocking inside the arrival lane is checked separately because
 * it depends on the complete game state.
 */
export function forwardDestination(
  marble: Marble,
  steps: number,
): Destination | null {
  if (!Number.isInteger(steps) || steps <= 0) return null;

  if (marble.zone === "HOME") return null;

  if (marble.zone === "FINISH") {
    if (marble.finishPosition === null) return null;
    const destination = marble.finishPosition + steps;
    return destination < FINISH_SIZE
      ? { zone: "FINISH", finishPosition: destination }
      : null;
  }

  if (marble.trackPosition === null) return null;

  const local = localPosition(marble.owner, marble.trackPosition);

  // Number of forward steps needed to leave local case 13 and enter slot 0.
  // A marble before 13 can therefore enter with the exact remaining count.
  if (marble.qualifiedForFinish && local <= FINISH_GATE_LOCAL_POSITION) {
    const stepsToFirstFinish = FINISH_GATE_LOCAL_POSITION - local + 1;
    const finishIndex = steps - stepsToFirstFinish;

    if (finishIndex >= 0 && finishIndex < FINISH_SIZE) {
      return { zone: "FINISH", finishPosition: finishIndex };
    }
  }

  return {
    zone: "TRACK",
    trackPosition: (marble.trackPosition + steps) % TRACK_SIZE,
  };
}

/**
 * Marks a marble as qualified after it has completed the required circuit.
 * This helper is intentionally independent from rendering/UI.
 */
export function updateFinishQualification(
  marble: Marble,
  stepsMoved: number,
): boolean {
  if (marble.zone !== "TRACK" || marble.trackPosition === null) {
    return marble.qualifiedForFinish;
  }
  if (marble.qualifiedForFinish) return true;

  const distanceFromBase = localPosition(marble.owner, marble.trackPosition);
  return distanceFromBase + stepsMoved >= TRACK_SIZE + FINISH_GATE_LOCAL_POSITION;
}
