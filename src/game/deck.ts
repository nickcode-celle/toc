import { TEAMMATE } from "./constants";
import type { Card, CardRank, GameState, PlayerId } from "./types";

const RANKS: CardRank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS: Card["suit"][] = ["clubs", "diamonds", "hearts", "spades"];

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ id: `${suit}-${rank}`, rank, suit })));
}

export function shuffleDeck(cards: Card[], random: () => number = Math.random): Card[] {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function cardsPerPlayerForDeal(dealNumber: 0 | 1 | 2): number {
  return dealNumber === 0 ? 5 : 4;
}

/** Deals clockwise, one card at a time, beginning after the dealer. */
export function dealCards(state: GameState): GameState {
  const next: GameState = {
    ...state,
    players: state.players.map((p) => ({ ...p, hand: [], hasDiscardedHand: false })),
    deck: [...state.deck],
    discardPile: [...state.discardPile],
  };
  const count = cardsPerPlayerForDeal(next.dealNumber);
  for (let round = 0; round < count; round += 1) {
    for (let offset = 1; offset <= 4; offset += 1) {
      const player = ((next.dealer + offset) % 4) as PlayerId;
      const card = next.deck.shift();
      if (!card) throw new Error("Not enough cards to deal");
      next.players.find((p) => p.id === player)!.hand.push(card);
    }
  }
  next.currentPlayer = ((next.dealer + 1) % 4) as PlayerId;
  return next;
}

/** Simultaneous partner exchange: 0<->2 and 1<->3. */
export function exchangePartnerCards(
  state: GameState,
  choices: Record<PlayerId, string>,
): GameState {
  const next: GameState = { ...state, players: state.players.map((p) => ({ ...p, hand: [...p.hand] })) };
  const selected = new Map<PlayerId, Card>();
  for (const id of [0, 1, 2, 3] as PlayerId[]) {
    const p = next.players.find((x) => x.id === id)!;
    const card = p.hand.find((c) => c.id === choices[id]);
    if (!card) throw new Error(`Invalid exchange card for player ${id}`);
    selected.set(id, card);
  }
  for (const id of [0, 1, 2, 3] as PlayerId[]) {
    const p = next.players.find((x) => x.id === id)!;
    p.hand = p.hand.filter((c) => c.id !== choices[id]);
  }
  for (const id of [0, 1, 2, 3] as PlayerId[]) {
    next.players.find((p) => p.id === id)!.hand.push(selected.get(TEAMMATE[id])!);
  }
  return next;
}

/** Advance 5 -> 4 -> 4. After the third hand, rotate dealer and reshuffle 52 cards. */
export function prepareNextDeal(state: GameState, random: () => number = Math.random): GameState {
  const next: GameState = { ...state, players: state.players.map((p) => ({ ...p, hand: [] })), deck: [...state.deck], discardPile: [...state.discardPile] };
  if (next.dealNumber < 2) {
    next.dealNumber = (next.dealNumber + 1) as 1 | 2;
  } else {
    next.dealNumber = 0;
    next.dealer = ((next.dealer + 1) % 4) as PlayerId;
    next.deck = shuffleDeck([...next.deck, ...next.discardPile], random);
    next.discardPile = [];
  }
  return dealCards(next);
}

export function startDeckCycle(state: GameState, random: () => number = Math.random): GameState {
  const next: GameState = { ...state, dealNumber: 0, deck: shuffleDeck(createDeck(), random), discardPile: [] };
  return dealCards(next);
}
