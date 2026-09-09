import type { CardRank, PlayerId } from "./types";

export const TRACK_SIZE = 64;
export const FINISH_SIZE = 4;
export const MARBLES_PER_PLAYER = 4;

/**
 * The physical board has 4 bases plus 15 numbered holes between each base.
 * Positions increase in the direction of play.
 */
export const BASE_POSITION: Record<PlayerId, number> = {
  0: 0,
  1: 16,
  2: 32,
  3: 48,
};

/**
 * A player's own numbered sector is the 15-hole sector immediately BEFORE
 * their base. Therefore own case 13 is three track positions before the base:
 * relative position 61 on the 64-position circuit. From own 13, +1 enters
 * arrival position 1; own 12 +2 does the same. Cases 14/15 have passed the
 * arrival branch and continue around the circuit.
 */
export const FINISH_GATE_LOCAL_POSITION = 61;

export const CARD_FORWARD_VALUE: Partial<Record<CardRank, number>> = {
  A: 1,
  "2": 2,
  "3": 3,
  "5": 5,
  "6": 6,
  "8": 8,
  "9": 9,
  "10": 10,
  Q: 12,
  K: 13,
};

export const TEAMMATE: Record<PlayerId, PlayerId> = {
  0: 2,
  1: 3,
  2: 0,
  3: 1,
};
