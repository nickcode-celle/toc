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

export function localPosition(owner: PlayerId, trackPosition: number): number {
  return clockwiseDistance(BASE_POSITION[owner], trackPosition);
}

export function forwardDestination(marble: Marble, steps: number): Destination | null {
  if (!Number.isInteger(steps) || steps <= 0) return null;
  if (marble.zone === "HOME") return null;

  if (marble.zone === "FINISH") {
    if (marble.finishPosition === null) return null;
    const destination = marble.finishPosition + steps;
    return destination < FINISH_SIZE ? { zone: "FINISH", finishPosition: destination } : null;
  }

  if (marble.trackPosition === null) return null;
  const local = localPosition(marble.owner, marble.trackPosition);

  if (marble.qualifiedForFinish && local <= FINISH_GATE_LOCAL_POSITION) {
    const stepsToFirstFinish = FINISH_GATE_LOCAL_POSITION - local + 1;
    const finishIndex = steps - stepsToFirstFinish;
    if (finishIndex >= 0 && finishIndex < FINISH_SIZE) {
      return { zone: "FINISH", finishPosition: finishIndex };
    }
  }

  return { zone: "TRACK", trackPosition: (marble.trackPosition + steps) % TRACK_SIZE };
}

/**
 * Qualification is gained when a forward move crosses the marble owner's
 * base after having left it. This records actual path crossing instead of
 * trying to infer a completed lap from the destination alone.
 *
 * Backward-4 from the owner's base is the other qualification route and is
 * set explicitly by the executor.
 */
export function becomesQualifiedAfterForwardMove(marble: Marble, steps: number): boolean {
  if (marble.qualifiedForFinish) return true;
  if (marble.zone !== "TRACK" || marble.trackPosition === null || steps <= 0) return false;

  const base = BASE_POSITION[marble.owner];
  const distanceToBase = clockwiseDistance(marble.trackPosition, base);

  // distanceToBase === 0 means the marble currently sits on its own base;
  // merely leaving the base does not constitute a completed circuit.
  return distanceToBase > 0 && distanceToBase <= steps;
}
