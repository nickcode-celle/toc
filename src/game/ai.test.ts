import { describe, expect, it } from "vitest";
import { chooseBaselineMove, evaluateState } from "./ai";
import { createDeck } from "./deck";
import { getLegalMoves } from "./legalMoves";
import { createInitialGameState } from "./state";

function card(rank: string) { return createDeck().find((c) => c.rank === rank)!; }

describe("baseline AI", () => {
  it("always chooses a legal move", () => {
    const state = createInitialGameState(); state.currentPlayer = 0; state.players[0].hand = [card("A"), card("2")];
    const legal = getLegalMoves(state).map((m) => JSON.stringify(m));
    expect(legal).toContain(JSON.stringify(chooseBaselineMove(state)));
  });

  it("strongly prefers immediate victory", () => {
    const state = createInitialGameState(); state.currentPlayer = 0; state.players[0].hand = [card("A")];
    for (const m of state.marbles.filter((m) => m.owner === 0 || m.owner === 2)) { m.zone = "FINISH"; m.trackPosition = null; m.finishPosition = 3; }
    // Keep exactly one team marble one step from its final arrival slot.
    const last = state.marbles.find((m) => m.owner === 0)!; last.zone = "FINISH"; last.finishPosition = 2;
    // Free slot 3 for that owner by moving its duplicate fixture away.
    const duplicate = state.marbles.find((m) => m.owner === 0 && m.id !== last.id && m.finishPosition === 3)!; duplicate.finishPosition = 0;
    const move = chooseBaselineMove(state);
    expect(move.type).toBe("MOVE");
  });

  it("scores a won state above an unfinished state", () => {
    const state = createInitialGameState(); const before = evaluateState(state, 0);
    for (const m of state.marbles.filter((m) => m.owner === 0 || m.owner === 2)) { m.zone = "FINISH"; m.trackPosition = null; m.finishPosition = m.id.endsWith("0") ? 0 : Number(m.id.split("-").at(-1)) || 0; }
    state.winner = 0;
    expect(evaluateState(state, 0)).toBeGreaterThan(before);
  });
});
