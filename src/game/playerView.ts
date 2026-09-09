import { TEAMMATE } from "./constants";
import { visibleDiscardCard } from "./executor";
import type { Card, GameState, Marble, PlayerId, TeamId } from "./types";

export interface PublicPlayerState {
  id: PlayerId;
  team: TeamId;
  handSize: number;
  hasDiscardedHand: boolean;
}

export interface PlayerView {
  viewer: PlayerId;
  players: PublicPlayerState[];
  marbles: Marble[];
  ownHand: Card[];
  teammate: PlayerId;
  dealer: PlayerId;
  currentPlayer: PlayerId;
  dealNumber: 0 | 1 | 2;
  deckSize: number;
  visibleDiscard: Card | null;
  winner: TeamId | null;
}

/**
 * Information set exposed to a human or AI player.
 * Opponent/partner hands, buried discard cards and deck identities are never exposed.
 */
export function playerView(state: GameState, viewer: PlayerId): PlayerView {
  const own = state.players.find((p) => p.id === viewer);
  if (!own) throw new Error("Unknown viewer");
  return {
    viewer,
    players: state.players.map((p) => ({ id: p.id, team: p.team, handSize: p.hand.length, hasDiscardedHand: p.hasDiscardedHand })),
    marbles: state.marbles.map((m) => ({ ...m })),
    ownHand: own.hand.map((c) => ({ ...c })),
    teammate: TEAMMATE[viewer],
    dealer: state.dealer,
    currentPlayer: state.currentPlayer,
    dealNumber: state.dealNumber,
    deckSize: state.deck.length,
    visibleDiscard: visibleDiscardCard(state),
    winner: state.winner,
  };
}
