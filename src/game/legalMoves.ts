import { CARD_FORWARD_VALUE } from "./constants";
import { checkExitHome, checkJackSwap } from "./aceKingJack";
import { checkNormalForwardMove } from "./rules";
import { checkBackwardFour, controlledOwner, type SevenPart, validateSevenPlan } from "./specialMoves";
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

function movesForCard(
  state: GameState,
  player: PlayerId,
  card: Card,
): LegalMove[] {
  const marbles = controlledMarbles(state, player);
  const result: LegalMove[] = [];

  if (card.rank === "A" || card.rank === "K") {
    for (const marble of marbles) {
      if (checkExitHome(state, player, marble, card.rank).legal) {
        result.push({ type: "EXIT", cardId: card.id, marbleId: marble.id });
      }
    }
  }

  const forward = CARD_FORWARD_VALUE[card.rank];
  if (forward !== undefined) {
    for (const marble of marbles) {
      if (checkNormalForwardMove(state, marble, forward).legal) {
        result.push({ type: "MOVE", cardId: card.id, marbleId: marble.id, steps: forward });
      }
    }
  }

  if (card.rank === "4") {
    for (const marble of marbles) {
      if (checkBackwardFour(state, marble).legal) {
        result.push({ type: "FOUR", cardId: card.id, marbleId: marble.id });
      }
    }
  }

  if (card.rank === "J") {
    for (const marble of marbles) {
      for (const target of state.marbles) {
        if (checkJackSwap(state, player, marble, target).legal) {
          result.push({
            type: "JACK",
            cardId: card.id,
            marbleId: marble.id,
            targetMarbleId: target.id,
          });
        }
      }
    }
  }

  if (card.rank === "7") {
    result.push(...generateSevenPlans(state, player, card.id));
  }

  return result;
}

/**
 * Enumerates candidate partitions of 7 across distinct controlled marbles.
 * Full sequential board simulation will later filter candidates whose paths
 * become illegal because of blockers/captures/control transition.
 */
function generateSevenPlans(
  state: GameState,
  player: PlayerId,
  cardId: string,
): LegalMove[] {
  const firstOwner = controlledOwner(state, player);
  const first = state.marbles.filter(
    (m) => m.owner === firstOwner && m.zone !== "HOME",
  );
  const candidates: SevenPart[][] = [];

  function recurse(parts: SevenPart[], used: Set<string>, remaining: number): void {
    if (remaining === 0) {
      if (validateSevenPlan(state, player, parts).legal) candidates.push(parts);
      return;
    }

    // Include both own and teammate marbles as candidates; validateSevenPlan
    // enforces when the mid-seven control switch is actually permitted.
    const pool = state.marbles.filter(
      (m) =>
        m.zone !== "HOME" &&
        !used.has(m.id) &&
        (m.owner === player || m.owner === (player === 0 ? 2 : player === 2 ? 0 : player === 1 ? 3 : 1)),
    );

    for (const marble of pool) {
      for (let steps = 1; steps <= remaining; steps += 1) {
        recurse(
          [...parts, { marbleId: marble.id, steps }],
          new Set([...used, marble.id]),
          remaining - steps,
        );
      }
    }
  }

  // Avoid recursing when no controlled circuit/finish marble exists.
  if (first.length > 0) recurse([], new Set<string>(), 7);

  return candidates.map((parts) => ({ type: "SEVEN", cardId, parts }));
}

export function getLegalMoves(
  state: GameState,
  player: PlayerId = state.currentPlayer,
): LegalMove[] {
  const playerState = state.players.find((p) => p.id === player);
  if (!playerState || playerState.hasDiscardedHand) return [];

  return playerState.hand.flatMap((card) => movesForCard(state, player, card));
}

export function mustDiscardWholeHand(state: GameState, player: PlayerId): boolean {
  const playerState = state.players.find((p) => p.id === player);
  return !!playerState && playerState.hand.length > 0 && getLegalMoves(state, player).length === 0;
}
