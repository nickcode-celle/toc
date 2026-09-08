import { describe, expect, it } from "vitest";
import { becomesQualifiedAfterForwardMove, forwardDestination } from "./movement";
import { checkBackwardFour } from "./specialMoves";
import { createInitialGameState } from "./state";
import { executeMove } from "./executor";
import type { Card, Marble } from "./types";

function marble(position: number, qualified = false): Marble {
  return { id: "0-0", owner: 0, zone: "TRACK", trackPosition: position, finishPosition: null, qualifiedForFinish: qualified };
}

describe("arrival qualification", () => {
  it("does not qualify merely by leaving own base", () => {
    expect(becomesQualifiedAfterForwardMove(marble(0), 5)).toBe(false);
  });

  it("qualifies when a forward move crosses own base after a circuit", () => {
    expect(becomesQualifiedAfterForwardMove(marble(62), 3)).toBe(true);
  });

  it("qualified marble enters arrival when the value fits", () => {
    expect(forwardDestination(marble(12, true), 2)).toEqual({ zone: "FINISH", finishPosition: 0 });
  });

  it("qualified marble continues on circuit when value is too large for arrival", () => {
    expect(forwardDestination(marble(13, true), 6)).toEqual({ zone: "TRACK", trackPosition: 19 });
  });

  it("a four from own base is legal when the backward path is clear", () => {
    const state = createInitialGameState();
    const m = state.marbles.find((x) => x.id === "0-0")!;
    m.zone = "TRACK";
    m.trackPosition = 0;
    expect(checkBackwardFour(state, m).legal).toBe(true);
  });

  it("a four played from own base immediately qualifies that marble for arrival", () => {
    const state = createInitialGameState();
    state.currentPlayer = 0;
    const m = state.marbles.find((x) => x.id === "0-0")!;
    m.zone = "TRACK";
    m.trackPosition = 0;
    m.qualifiedForFinish = false;
    const card: Card = { id: "four", rank: "4", suit: "clubs" };
    state.players[0].hand = [card];

    const next = executeMove(state, { type: "FOUR", cardId: "four", marbleId: "0-0" });
    const moved = next.marbles.find((x) => x.id === "0-0")!;
    expect(moved.trackPosition).toBe(60);
    expect(moved.qualifiedForFinish).toBe(true);
  });
});
