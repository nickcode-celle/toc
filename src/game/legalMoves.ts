import { CARD_FORWARD_VALUE, TEAMMATE } from "./constants";
import { checkExitHome, checkJackSwap } from "./aceKingJack";
import { checkNormalForwardMove } from "./rules";
import { simulateSevenPlan } from "./sevenSimulation";
import { checkBackwardFour, controlledOwner, type SevenPart } from "./specialMoves";
import type { Card, GameState, Marble, PlayerId } from "./types";

export type LegalMove =
  | { type: "MOVE"; cardId: string; marbleId: string; steps: number }
  | { type: "EXIT"; cardId: string; marbleId: string }
  | { type: "FOUR"; cardId: string; marbleId: string }
  | { type: "JACK"; cardId: string; marbleId: string; targetMarbleId: string }
  | { type: "SEVEN"; cardId: string; parts: SevenPart[] };

function controlledMarbles(state: GameState, player: PlayerId): Marble[] {
  const owner = controlledOwner(state, player);
  return state.marbles.filter((m) => m.owner === owner);
}

function movesForCard(state: GameState, player: PlayerId, card: Card): LegalMove[] {
  const marbles = controlledMarbles(state, player);
  const result: LegalMove[] = [];

  if (card.rank === "A" || card.rank === "K") {
    for (const marble of marbles) if (checkExitHome(state, player, marble, card.rank).legal) result.push({ type: "EXIT", cardId: card.id, marbleId: marble.id });
  }

  const forward = CARD_FORWARD_VALUE[card.rank];
  if (forward !== undefined) {
    for (const marble of marbles) if (checkNormalForwardMove(state, marble, forward).legal) result.push({ type: "MOVE", cardId: card.id, marbleId: marble.id, steps: forward });
  }

  if (card.rank === "4") {
    for (const marble of marbles) if (checkBackwardFour(state, marble).legal) result.push({ type: "FOUR", cardId: card.id, marbleId: marble.id });
  }

  if (card.rank === "J") {
    for (const marble of marbles) for (const target of state.marbles) if (checkJackSwap(state, player, marble, target).legal) result.push({ type: "JACK", cardId: card.id, marbleId: marble.id, targetMarbleId: target.id });
  }

  if (card.rank === "7") result.push(...generateSevenPlans(state, player, card.id));
  return result;
}

function generateSevenPlans(state: GameState, player: PlayerId, cardId: string): LegalMove[] {
  const firstOwner = controlledOwner(state, player);
  const first = state.marbles.filter((m) => m.owner === firstOwner && m.zone !== "HOME");
  if (first.length === 0) return [];

  const candidates: SevenPart[][] = [];
  const partner = TEAMMATE[player];

  function recurse(parts: SevenPart[], used: Set<string>, remaining: number): void {
    if (remaining === 0) {
      if (simulateSevenPlan(state, player, parts) !== null) candidates.push(parts);
      return;
    }
    const pool = state.marbles.filter((m) => m.zone !== "HOME" && !used.has(m.id) && (m.owner === player || m.owner === partner));
    for (const marble of pool) {
      for (let steps = 1; steps <= remaining; steps += 1) {
        recurse([...parts, { marbleId: marble.id, steps }], new Set([...used, marble.id]), remaining - steps);
      }
    }
  }

  recurse([], new Set<string>(), 7);
  return candidates.map((parts) => ({ type: "SEVEN", cardId, parts }));
}

export function getLegalMoves(state: GameState, player: PlayerId = state.currentPlayer): LegalMove[] {
  const playerState = state.players.find((p) => p.id === player);
  if (!playerState || playerState.hasDiscardedHand) return [];
  return playerState.hand.flatMap((card) => movesForCard(state, player, card));
}

export function mustDiscardWholeHand(state: GameState, player: PlayerId): boolean {
  const playerState = state.players.find((p) => p.id === player);
  return !!playerState && playerState.hand.length > 0 && getLegalMoves(state, player).length === 0;
}
