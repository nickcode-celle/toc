import { describe, expect, it } from "vitest";
import { chooseStrategicMove } from "./aiStrategic";
import { createDeck } from "./deck";
import { getLegalMoves } from "./legalMoves";
import { createInitialGameState } from "./state";

function card(rank: string) { return createDeck().find(c => c.rank === rank)!; }

describe("strategic AI", () => {
  it("always returns one of the engine legal moves", () => {
    const state = createInitialGameState(); state.currentPlayer = 0; state.players[0].hand = [card("A"), card("K")];
    const legal = getLegalMoves(state, 0).map(m => JSON.stringify(m));
    expect(legal).toContain(JSON.stringify(chooseStrategicMove(state, 0)));
  });

  it("refuses to act for a player who is not current", () => {
    const state = createInitialGameState(); state.currentPlayer = 1;
    expect(() => chooseStrategicMove(state, 0)).toThrow();
  });

  it("makes the same decision when hidden opponent hands change", () => {
    const a = createInitialGameState(); a.currentPlayer = 0; a.players[0].hand = [card("A"), card("K")];
    const b = structuredClone(a);
    a.players[1].hand = [card("2"), card("3"), card("4")];
    b.players[1].hand = [card("7"), card("J"), card("Q")];
    a.players[3].hand = [card("5")]; b.players[3].hand = [card("10"), card("K")];
    expect(chooseStrategicMove(a, 0)).toEqual(chooseStrategicMove(b, 0));
  });
});
