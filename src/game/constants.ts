import type { CardRank, PlayerId } from "./types";

export const TRACK_SIZE = 60;
export const FINISH_SIZE = 4;
export const MARBLES_PER_PLAYER = 4;

/** Physical board: 15 positions per colour sector. The coloured base IS case 15. */
export const BASE_POSITION: Record<PlayerId, number> = {
  0: 0,
  1: 15,
  2: 30,
  3: 45,
};

/**
 * The arrival branch is after the owner's case 13. With the base being case 15,
 * own case 13 is two positions before the base: local position 58 on a 60-hole ring.
 * Thus own 12 +1 reaches 13, and only a move starting from/passing 13 can enter.
 */
export const FINISH_GATE_LOCAL_POSITION = 58;

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
