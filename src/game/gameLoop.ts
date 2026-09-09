import { exchangePartnerCards, prepareNextDeal, startDeckCycle } from "./deck";
import { discardWholeHand, executeMove } from "./executor";
import { getLegalMoves, type LegalMove } from "./legalMoves";
import type { GameState, PlayerId } from "./types";

export type MoveSelector = (state: GameState, moves: LegalMove[]) => LegalMove;
export type ExchangeSelector = (state: GameState, player: PlayerId) => string;
export type DiscardTopSelector = (state: GameState, player: PlayerId) => string;

export function randomMoveSelector(_state: GameState, moves: LegalMove[]): LegalMove {
  return moves[Math.floor(Math.random() * moves.length)];
}

export function firstCardExchange(state: GameState, player: PlayerId): string {
  const card = state.players.find((p) => p.id === player)?.hand[0];
  if (!card) throw new Error("No card available for exchange");
  return card.id;
}

export function lastCardVisibleOnDiscard(state: GameState, player: PlayerId): string {
  const hand = state.players.find((p) => p.id === player)?.hand;
  if (!hand?.length) throw new Error("No card available for discard");
  return hand[hand.length - 1].id;
}

/** All four choices are collected from the same pre-exchange state: secret, simultaneous and final. */
export function performExchange(state: GameState, selector: ExchangeSelector = firstCardExchange): GameState {
  const choices = {} as Record<PlayerId, string>;
  for (const player of [0, 1, 2, 3] as PlayerId[]) choices[player] = selector(state, player);
  return exchangePartnerCards(state, choices);
}

export function handIsOver(state: GameState): boolean {
  return state.players.every((p) => p.hand.length === 0 || p.hasDiscardedHand);
}

/** One card = one turn. Players who discarded their whole hand are skipped until the next deal. */
export function playTurn(
  state: GameState,
  selector: MoveSelector = randomMoveSelector,
  discardTopSelector: DiscardTopSelector = lastCardVisibleOnDiscard,
): GameState {
  const moves = getLegalMoves(state);
  if (moves.length === 0) {
    return discardWholeHand(state, discardTopSelector(state, state.currentPlayer));
  }
  return executeMove(state, selector(state, moves));
}

/**
 * Runs a complete game through repeating 5-4-4 cycles.
 * The dealer stays fixed for all three deals, the player after the dealer starts
 * every deal, then the dealer rotates clockwise and all 52 cards are reshuffled.
 */
export function simulateGame(
  initialState: GameState,
  moveSelector: MoveSelector = randomMoveSelector,
  exchangeSelector: ExchangeSelector = firstCardExchange,
  maxTurns = 10000,
  discardTopSelector: DiscardTopSelector = lastCardVisibleOnDiscard,
): GameState {
  let state = performExchange(startDeckCycle(initialState), exchangeSelector);
  let turns = 0;

  while (state.winner === null && turns < maxTurns) {
    if (handIsOver(state)) {
      state = performExchange(prepareNextDeal(state), exchangeSelector);
      continue;
    }
    state = playTurn(state, moveSelector, discardTopSelector);
    turns += 1;
  }

  if (turns >= maxTurns && state.winner === null) throw new Error(`Simulation exceeded ${maxTurns} turns`);
  return state;
}
