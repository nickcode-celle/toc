import { describe, expect, it } from "vitest";
import { chooseBaselineExchange } from "./aiExchange";
import { createInitialGameState } from "./state";
import type { Card } from "./types";

const card = (id: string, rank: Card["rank"]): Card => ({ id, rank, suit: "clubs" });

describe("strategic partner exchange", () => {
  it("gives an exit card to an advanced partner who still has a marble home", () => {
    const state = createInitialGameState();
    state.players[1].hand = [card("ace", "A"), card("two", "2"), card("queen", "Q")];
    // Player 3 is partner of player 1. Make the partner visibly more advanced.
    const partnerMarbles = state.marbles.filter(m => m.owner === 3);
    partnerMarbles[0].zone = "FINISH"; partnerMarbles[0].finishPosition = 3;
    partnerMarbles[1].zone = "FINISH"; partnerMarbles[1].finishPosition = 2;
    // Two remain HOME, so an Ace is strategically useful to the partner.
    expect(chooseBaselineExchange(state, 1)).toBe("ace");
  });

  it("never needs to inspect the partner hand", () => {
    const state = createInitialGameState();
    state.players[1].hand = [card("three", "3"), card("king", "K")];
    const first = chooseBaselineExchange(state, 1);
    state.players[3].hand = [card("hidden-a", "A"), card("hidden-7", "7"), card("hidden-j", "J")];
    expect(chooseBaselineExchange(state, 1)).toBe(first);
  });
});
