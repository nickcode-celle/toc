import { describe, expect, it } from "vitest";
import { createDeck } from "./deck";
import { playerView } from "./playerView";
import { createInitialGameState } from "./state";

it("exposes only the viewer hand and the top discard card", () => {
  const state = createInitialGameState();
  const cards = createDeck();
  state.players[0].hand = cards.slice(0, 3);
  state.players[1].hand = cards.slice(3, 7);
  state.players[2].hand = cards.slice(7, 9);
  state.players[3].hand = cards.slice(9, 14);
  state.deck = cards.slice(14, 30);
  state.discardPile = [cards[30], cards[31], cards[32]];

  const view = playerView(state, 0);
  expect(view.ownHand.map((c) => c.id)).toEqual(state.players[0].hand.map((c) => c.id));
  expect(view.players.map((p) => p.handSize)).toEqual([3, 4, 2, 5]);
  expect(view.visibleDiscard?.id).toBe(cards[32].id);
  expect(view.deckSize).toBe(16);
  expect("deck" in view).toBe(false);
  expect("discardPile" in view).toBe(false);
  expect(view).not.toHaveProperty("hands");
});

it("does not reveal the teammate hand", () => {
  const state = createInitialGameState();
  const cards = createDeck();
  state.players[0].hand = cards.slice(0, 2);
  state.players[2].hand = cards.slice(2, 6);
  const view = playerView(state, 0);
  expect(view.teammate).toBe(2);
  expect(view.players.find((p) => p.id === 2)?.handSize).toBe(4);
  const serialized = JSON.stringify(view);
  for (const card of state.players[2].hand) expect(serialized).not.toContain(card.id);
});
