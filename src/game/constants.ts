import type { CardRank, PlayerId } from "./types";

export const TRACK_SIZE = 64;
export const FINISH_SIZE = 4;
export const MARBLES_PER_PLAYER = 4;

/**
 * Global base positions in clockwise order.
 * Player 0 = red, 1 = green, 2 = blue, 3 = yellow.
 */
export const BASE_POSITION: Record<PlayerId, number> = {
  0: 0,
  1: 16,
  2: 32,
  3: 48,
};

/**
 * Local sector positions 1..15 follow each base clockwise.
 * Local position 13 is the arrival decision point for that colour.
 */
export const FINISH_GATE_LOCAL_POSITION = 13;

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
