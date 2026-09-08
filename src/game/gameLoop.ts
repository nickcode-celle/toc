import { exchangePartnerCards, prepareNextDeal, startDeckCycle } from "./deck";
import { discardWholeHand, executeMove } from "./executor";
import { getLegalMoves, type LegalMove } from "./legalMoves";
import type { GameState, PlayerId } from "./types";

export type MoveSelector = (state: GameState, moves: LegalMove[]) => LegalMove;
export type ExchangeSelector = (state: GameState, player: PlayerId) => string;

export function randomMoveSelector(_state: GameState, moves: LegalMove[]): LegalMove {
  return moves[Math.floor(Math.random() * moves.length)];
}

export function firstCardExchange(state: GameState, player: PlayerId): string {
  const card = state.players.find((p) => p.id === player)?.hand[0];
  if (!card) throw new Error("No card available for exchange");
  return card.id;
}

export function performExchange(state: GameState, selector: ExchangeSelector = firstCardExchange): GameState {
  const choices = {} as Record<PlayerId, string>;
  for (const player of [0, 1, 2, 3] as PlayerId[]) choices[player] = selector(state, player);
  return exchangePartnerCards(state, choices);
}

export function handIsOver(state: GameState): boolean {
  return state.players.every((p) => p.hand.length === 0 || p.hasDiscardedHand);
}

/** Plays one current player's turn. */
export function playTurn(state: GameState, selector: MoveSelector = randomMoveSelector): GameState {
  const moves = getLegalMoves(state);
  if (moves.length === 0) return discardWholeHand(state);
  return executeMove(state, selector(state, moves));
}

/**
 * Runs a complete game with pluggable move/exchange selectors.
 * The default selectors are intentionally stupid: random legal move and first
 * card exchange. Their purpose is engine stress-testing, not strategy.
 */
export function simulateGame(
  initialState: GameState,
  moveSelector: MoveSelector = randomMoveSelector,
  exchangeSelector: ExchangeSelector = firstCardExchange,
  maxTurns = 10000,
): GameState {
  let state = performExchange(startDeckCycle(initialState), exchangeSelector);
  let turns = 0;

  while (state.winner === null && turns < maxTurns) {
    if (handIsOver(state)) {
      state = performExchange(prepareNextDeal(state), exchangeSelector);
      continue;
    }
    state = playTurn(state, moveSelector);
    turns += 1;
  }

  if (turns >= maxTurns && state.winner === null) {
    throw new Error(`Simulation exceeded ${maxTurns} turns`);
  }
  return state;
}
