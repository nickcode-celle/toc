import { describe, expect, it } from "vitest";
import { forwardDestination } from "./movement";
import { checkNormalForwardMove } from "./rules";
import { checkBackwardFour } from "./specialMoves";
import { createInitialGameState } from "./state";
import type { Marble } from "./types";

function marble(position: number): Marble {
  return { id: "0-0", owner: 0, zone: "TRACK", trackPosition: position, finishPosition: null, qualifiedForFinish: false };
}

describe("arrival entry", () => {
  it("case 12 plus 1 stays on case 13", () => {
    expect(forwardDestination(marble(12), 1)).toEqual({ zone: "TRACK", trackPosition: 13 });
  });

  it("case 12 plus 2 enters arrival position 1", () => {
    expect(forwardDestination(marble(12), 2)).toEqual({ zone: "FINISH", finishPosition: 0 });
  });

  it("case 13 plus 1 enters arrival position 1", () => {
    expect(forwardDestination(marble(13), 1)).toEqual({ zone: "FINISH", finishPosition: 0 });
  });

  it("case 13 plus 2 enters arrival position 2", () => {
    expect(forwardDestination(marble(13), 2)).toEqual({ zone: "FINISH", finishPosition: 1 });
  });

  it("case 13 plus 5 is too large and continues on circuit", () => {
    expect(forwardDestination(marble(13), 5)).toEqual({ zone: "TRACK", trackPosition: 18 });
  });

  it("case 13 plus 12 is too large and continues on circuit", () => {
    expect(forwardDestination(marble(13), 12)).toEqual({ zone: "TRACK", trackPosition: 25 });
  });

  it("arrival marble cannot overflow back to circuit", () => {
    const m: Marble = { ...marble(13), zone: "FINISH", trackPosition: null, finishPosition: 2 };
    expect(forwardDestination(m, 2)).toBeNull();
  });

  it("a marble in arrival blocks entry and cannot be jumped", () => {
    const state = createInitialGameState();
    const m = state.marbles.find((x) => x.id === "0-0")!;
    m.zone = "TRACK"; m.trackPosition = 13;
    const blocker = state.marbles.find((x) => x.id === "0-1")!;
    blocker.zone = "FINISH"; blocker.trackPosition = null; blocker.finishPosition = 1;
    expect(checkNormalForwardMove(state, m, 3).legal).toBe(false);
  });
});

describe("bases", () => {
  it("a four from own base is legal and lands four behind", () => {
    const state = createInitialGameState();
    const m = state.marbles.find((x) => x.id === "0-0")!;
    m.zone = "TRACK"; m.trackPosition = 0;
    expect(checkBackwardFour(state, m).legal).toBe(true);
  });

  it("a normal move cannot end on any base even when empty", () => {
    const state = createInitialGameState();
    const m = state.marbles.find((x) => x.id === "0-0")!;
    m.zone = "TRACK"; m.trackPosition = 15;
    expect(checkNormalForwardMove(state, m, 1).legal).toBe(false);
  });

  it("a four cannot end on any base even when empty", () => {
    const state = createInitialGameState();
    const m = state.marbles.find((x) => x.id === "0-0")!;
    m.zone = "TRACK"; m.trackPosition = 20;
    expect(checkBackwardFour(state, m).legal).toBe(false);
  });
});
