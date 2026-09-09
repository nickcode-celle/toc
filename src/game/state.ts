import { MARBLES_PER_PLAYER } from "./constants";
import type { GameState, Marble, PlayerId, PlayerState } from "./types";

function createPlayer(id: PlayerId): PlayerState {
  return { id, team: id % 2 === 0 ? 0 : 1, hand: [], hasDiscardedHand: false };
}

function createMarbles(owner: PlayerId): Marble[] {
  return Array.from({ length: MARBLES_PER_PLAYER }, (_, index) => ({
    id: `${owner}-${index}`,
    owner,
    zone: "HOME" as const,
    trackPosition: null,
    finishPosition: null,
  }));
}

export function randomDealer(random: () => number = Math.random): PlayerId {
  return Math.floor(random() * 4) as PlayerId;
}

export function createInitialGameState(dealer: PlayerId = 0): GameState {
  const players: PlayerState[] = [0, 1, 2, 3].map((id) => createPlayer(id as PlayerId));
  const marbles = ([0, 1, 2, 3] as PlayerId[]).flatMap(createMarbles);
  return {
    players,
    marbles,
    dealer,
    currentPlayer: ((dealer + 1) % 4) as PlayerId,
    dealNumber: 0,
    deck: [],
    discardPile: [],
    winner: null,
  };
}

/** Production entry point: the first dealer is chosen randomly. */
export function createRandomInitialGameState(random: () => number = Math.random): GameState {
  return createInitialGameState(randomDealer(random));
}
