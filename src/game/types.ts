export type PlayerId = 0 | 1 | 2 | 3;
export type TeamId = 0 | 1;

export type MarbleZone = "HOME" | "TRACK" | "FINISH";

export interface Marble {
  id: string;
  owner: PlayerId;
  zone: MarbleZone;
  /** Global circuit position, 0..63, when zone === TRACK. */
  trackPosition: number | null;
  /** Arrival slot, 0..3, when zone === FINISH. */
  finishPosition: number | null;
  /**
   * True once the marble has reached the part of its own sector from which
   * it is allowed to enter its arrival lane on a forward move.
   */
  qualifiedForFinish: boolean;
}

export type CardRank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export interface Card {
  id: string;
  rank: CardRank;
  suit: "clubs" | "diamonds" | "hearts" | "spades";
}

export interface PlayerState {
  id: PlayerId;
  team: TeamId;
  hand: Card[];
  hasDiscardedHand: boolean;
}

export interface GameState {
  players: PlayerState[];
  marbles: Marble[];
  dealer: PlayerId;
  currentPlayer: PlayerId;
  dealNumber: 0 | 1 | 2;
  deck: Card[];
  discardPile: Card[];
  winner: TeamId | null;
}
