import { BASE_POSITION, TRACK_SIZE } from "./constants";
import { forwardDestination } from "./movement";
import type { GameState, Marble, PlayerId } from "./types";

export interface MoveCheck {
  legal: boolean;
  reason?: string;
  capturedMarbleIds: string[];
}

export function marbleAtTrackPosition(state: GameState, position: number, exceptId?: string): Marble | undefined {
  return state.marbles.find((m) => m.id !== exceptId && m.zone === "TRACK" && m.trackPosition === position);
}

export function isBasePosition(position: number): boolean {
  return Object.values(BASE_POSITION).includes(position);
}

export function isProtectedBaseOccupied(state: GameState, position: number, exceptId?: string): boolean {
  if (!isBasePosition(position)) return false;
  return marbleAtTrackPosition(state, position, exceptId) !== undefined;
}

function forwardTrackPath(start: number, steps: number): number[] {
  return Array.from({ length: steps }, (_, i) => (start + i + 1) % TRACK_SIZE);
}

export function checkNormalForwardMove(state: GameState, marble: Marble, steps: number): MoveCheck {
  const destination = forwardDestination(marble, steps);
  if (!destination) return { legal: false, reason: "No valid destination", capturedMarbleIds: [] };

  if (marble.zone === "TRACK" && marble.trackPosition !== null) {
    const path = forwardTrackPath(marble.trackPosition, steps);
    const trackPath = destination.zone === "FINISH"
      ? path.slice(0, Math.max(0, path.length - (destination.finishPosition + 1)))
      : path;
    for (const position of trackPath) {
      if (isProtectedBaseOccupied(state, position, marble.id)) {
        return { legal: false, reason: "Occupied base blocks passage", capturedMarbleIds: [] };
      }
    }
  }

  if (destination.zone === "FINISH") {
    const ownFinishMarbles = state.marbles.filter((m) => m.owner === marble.owner && m.zone === "FINISH" && m.id !== marble.id);
    const start = marble.zone === "FINISH" && marble.finishPosition !== null ? marble.finishPosition : -1;
    if (ownFinishMarbles.some((m) => m.finishPosition !== null && m.finishPosition > start && m.finishPosition <= destination.finishPosition)) {
      return { legal: false, reason: "A marble blocks the arrival lane", capturedMarbleIds: [] };
    }
    return { legal: true, capturedMarbleIds: [] };
  }

  // A base may be crossed when free, but no movement may finish on any base.
  // A/K exit from HOME is handled separately and is the only placement on a base.
  if (isBasePosition(destination.trackPosition)) {
    return { legal: false, reason: "Cannot stop on a base", capturedMarbleIds: [] };
  }

  const target = marbleAtTrackPosition(state, destination.trackPosition, marble.id);
  return target
    ? { legal: true, capturedMarbleIds: [target.id] }
    : { legal: true, capturedMarbleIds: [] };
}

export function baseOwner(position: number): PlayerId | null {
  const entry = (Object.entries(BASE_POSITION) as [string, number][]).find(([, p]) => p === position);
  return entry ? (Number(entry[0]) as PlayerId) : null;
}
