import { describe, expect, it } from "vitest";
import { createDeck } from "./deck";
import { advanceTurn, discardWholeHand, visibleDiscardCard } from "./executor";
import { handIsOver, performExchange } from "./gameLoop";
import { createInitialGameState, randomDealer } from "./state";
import { dealCards, prepareNextDeal, startDeckCycle } from "./deck";
import type { Card, PlayerId } from "./types";

function deterministicRandom() { return 0.5; }

describe("dealer and 5-4-4 lifecycle", () => {
  it("can choose the initial dealer randomly", () => {
    expect(randomDealer(() => 0)).toBe(0);
    expect(randomDealer(() => 0.26)).toBe(1);
    expect(randomDealer(() => 0.51)).toBe(2);
    expect(randomDealer(() => 0.99)).toBe(3);
  });

  it("deals 5 then 4 then 4 while keeping the same dealer", () => {
    let state = startDeckCycle(createInitialGameState(2), deterministicRandom);
    expect(state.players.map((p) => p.hand.length)).toEqual([5, 5, 5, 5]);
    expect(state.dealer).toBe(2); expect(state.currentPlayer).toBe(3); expect(state.deck).toHaveLength(32);
    state.players.forEach((p) => { state.discardPile.push(...p.hand); p.hand = []; });
    state = prepareNextDeal(state, deterministicRandom);
    expect(state.dealNumber).toBe(1); expect(state.dealer).toBe(2); expect(state.currentPlayer).toBe(3);
    expect(state.players.map((p) => p.hand.length)).toEqual([4, 4, 4, 4]);
    state.players.forEach((p) => { state.discardPile.push(...p.hand); p.hand = []; });
    state = prepareNextDeal(state, deterministicRandom);
    expect(state.dealNumber).toBe(2); expect(state.dealer).toBe(2); expect(state.currentPlayer).toBe(3);
    expect(state.players.map((p) => p.hand.length)).toEqual([4, 4, 4, 4]);
  });

  it("rotates dealer only after the third deal and rebuilds all 52 cards", () => {
    let state = startDeckCycle(createInitialGameState(2), deterministicRandom);
    for (let deal = 0; deal < 3; deal += 1) {
      state.players.forEach((p) => { state.discardPile.push(...p.hand); p.hand = []; });
      if (deal < 2) state = prepareNextDeal(state, deterministicRandom);
    }
    expect(state.deck).toHaveLength(0); expect(state.discardPile).toHaveLength(52);
    state = prepareNextDeal(state, deterministicRandom);
    expect(state.dealer).toBe(3); expect(state.currentPlayer).toBe(0); expect(state.dealNumber).toBe(0);
    expect(state.players.map((p) => p.hand.length)).toEqual([5, 5, 5, 5]); expect(state.deck).toHaveLength(32); expect(state.discardPile).toHaveLength(0);
  });
});

describe("exchange, discard and skipped players", () => {
  it("performs partner exchange simultaneously", () => {
    const state = dealCards({ ...createInitialGameState(0), deck: createDeck(), dealNumber: 0 });
    const before = new Map(state.players.map((p) => [p.id, p.hand[0].id]));
    const result = performExchange(state, (_s, player) => before.get(player)!);
    const teammate: Record<PlayerId, PlayerId> = { 0: 2, 1: 3, 2: 0, 3: 1 };
    for (const p of result.players) expect(p.hand.some((c) => c.id === before.get(teammate[p.id]))).toBe(true);
  });

  it("lets a full-hand discard choose the only visible top card", () => {
    const state = createInitialGameState();
    state.currentPlayer = 0;
    // 2/3/4 cannot leave HOME, so this hand has no legal move and must be discarded.
    const hand: Card[] = createDeck().filter((c) => c.rank === "2" || c.rank === "3" || c.rank === "4").slice(0, 3);
    state.players[0].hand = hand;
    const chosen = hand[0].id;
    const next = discardWholeHand(state, chosen);
    expect(next.players[0].hand).toHaveLength(0); expect(next.players[0].hasDiscardedHand).toBe(true);
    expect(visibleDiscardCard(next)?.id).toBe(chosen);
  });

  it("skips discarded players and can return to the only active player", () => {
    const state = createInitialGameState(); state.currentPlayer = 0;
    state.players.forEach((p) => { p.hand = createDeck().slice(p.id, p.id + 1); p.hasDiscardedHand = p.id !== 0; });
    advanceTurn(state); expect(state.currentPlayer).toBe(0);
  });

  it("resets discarded status on the next deal", () => {
    const state = createInitialGameState(); state.deck = createDeck(); state.dealNumber = 1;
    state.players.forEach((p) => { p.hasDiscardedHand = true; p.hand = []; });
    const dealt = dealCards(state);
    expect(dealt.players.every((p) => !p.hasDiscardedHand)).toBe(true);
  });

  it("recognizes a deal as over when everybody is empty or discarded", () => {
    const state = createInitialGameState(); state.players.forEach((p) => { p.hand = []; });
    expect(handIsOver(state)).toBe(true);
  });
});
