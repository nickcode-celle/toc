import { describe, expect, it } from "vitest";
import { getAssistanceHints } from "./assistance";
import { createDeck } from "./deck";
import { createInitialGameState } from "./state";

function card(rank: string) { return createDeck().find((c) => c.rank === rank)!; }

describe("assistance modes", () => {
  it("expert reveals no help", () => {
    const state = createInitialGameState(); state.currentPlayer = 0; state.players[0].hand = [card("A")];
    const hints = getAssistanceHints(state, "EXPERT", state.players[0].hand[0].id);
    expect(hints.playableCardIds).toEqual([]); expect(hints.playableMarbleIds).toEqual([]); expect(hints.destinationKeys).toEqual([]); expect(hints.sevenRemaining).toBeNull();
  });

  it("easy highlights a playable ace and only one HOME marble as exit hint", () => {
    const state = createInitialGameState(); state.currentPlayer = 0; state.players[0].hand = [card("A")];
    const id = state.players[0].hand[0].id; const hints = getAssistanceHints(state, "EASY", id);
    expect(hints.playableCardIds).toContain(id); expect(hints.homeExitHintMarbleId).not.toBeNull();
    expect(hints.playableMarbleIds.length).toBe(4);
  });

  it("normal does not reveal playable cards, marbles or HOME exit", () => {
    const state = createInitialGameState(); state.currentPlayer = 0; state.players[0].hand = [card("K")];
    const hints = getAssistanceHints(state, "NORMAL", state.players[0].hand[0].id);
    expect(hints.playableCardIds).toEqual([]); expect(hints.playableMarbleIds).toEqual([]); expect(hints.homeExitHintMarbleId).toBeNull(); expect(hints.destinationKeys).toEqual([]);
  });

  it("normal shows the seven counter but no seven destination", () => {
    const state = createInitialGameState(); state.currentPlayer = 0; state.players[0].hand = [card("7")];
    const marble = state.marbles.find((m) => m.owner === 0)!; marble.zone = "TRACK"; marble.trackPosition = 5;
    const hints = getAssistanceHints(state, "NORMAL", state.players[0].hand[0].id, marble.id, 3);
    expect(hints.sevenRemaining).toBe(4); expect(hints.destinationKeys).toEqual([]); expect(hints.playableMarbleIds).toEqual([]);
  });

  it("normal highlights a classic destination only after marble selection", () => {
    const state = createInitialGameState(); state.currentPlayer = 0; state.players[0].hand = [card("5")];
    const marble = state.marbles.find((m) => m.owner === 0)!; marble.zone = "TRACK"; marble.trackPosition = 1;
    const before = getAssistanceHints(state, "NORMAL", state.players[0].hand[0].id);
    const after = getAssistanceHints(state, "NORMAL", state.players[0].hand[0].id, marble.id);
    expect(before.destinationKeys).toEqual([]); expect(after.destinationKeys).toEqual(["TRACK:6"]);
  });
});
