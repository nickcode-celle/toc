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

/**
 * Forward arrival rule: no lap/qualification flag is required.
 * Whenever a forward move reaches/passes the owner's case 13 toward the
 * arrival lane, it enters if the complete value fits in the four arrival
 * positions. If the value is too large, the full move continues on circuit.
 */
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

  if (local <= FINISH_GATE_LOCAL_POSITION) {
    const stepsToFirstFinish = FINISH_GATE_LOCAL_POSITION - local + 1;
    const finishIndex = steps - stepsToFirstFinish;
    if (finishIndex >= 0 && finishIndex < FINISH_SIZE) {
      return { zone: "FINISH", finishPosition: finishIndex };
    }
  }

  return { zone: "TRACK", trackPosition: (marble.trackPosition + steps) % TRACK_SIZE };
}

/** Legacy compatibility: arrival no longer depends on qualification. */
export function becomesQualifiedAfterForwardMove(marble: Marble, _steps: number): boolean {
  return marble.qualifiedForFinish;
}
