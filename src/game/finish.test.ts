import { describe, expect, it } from "vitest";
import { forwardDestination } from "./movement";
import { checkNormalForwardMove } from "./rules";
import { checkBackwardFour } from "./specialMoves";
import { createInitialGameState } from "./state";
import type { Marble } from "./types";

function marble(position: number): Marble { return { id: "0-0", owner: 0, zone: "TRACK", trackPosition: position, finishPosition: null }; }

describe("arrival entry on the physical numbered board", () => {
  // Player 0 base is global 0. Its own numbered sector is immediately before it:
  // own 12 = global 60, own 13 = 61, own 14 = 62, own 15 = 63.
  it("own case 12 plus 1 stays on own case 13", () => { expect(forwardDestination(marble(60), 1)).toEqual({ zone: "TRACK", trackPosition: 61 }); });
  it("own case 12 plus 2 enters arrival position 1", () => { expect(forwardDestination(marble(60), 2)).toEqual({ zone: "FINISH", finishPosition: 0 }); });
  it("own case 13 plus 1 enters arrival position 1", () => { expect(forwardDestination(marble(61), 1)).toEqual({ zone: "FINISH", finishPosition: 0 }); });
  it("own case 13 plus 2 enters arrival position 2", () => { expect(forwardDestination(marble(61), 2)).toEqual({ zone: "FINISH", finishPosition: 1 }); });
  it("own case 13 plus 5 is too large and continues on circuit", () => { expect(forwardDestination(marble(61), 5)).toEqual({ zone: "TRACK", trackPosition: 2 }); });
  it("own case 13 plus 12 is too large and continues on circuit", () => { expect(forwardDestination(marble(61), 12)).toEqual({ zone: "TRACK", trackPosition: 9 }); });
  it("case 13 belonging to another sector does not open this player's arrival", () => { expect(forwardDestination(marble(13), 1)).toEqual({ zone: "TRACK", trackPosition: 14 }); });
  it("own case 14 has passed the arrival branch", () => { expect(forwardDestination(marble(62), 1)).toEqual({ zone: "TRACK", trackPosition: 63 }); });
  it("arrival marble cannot overflow back to circuit", () => { const m: Marble = { ...marble(61), zone: "FINISH", trackPosition: null, finishPosition: 2 }; expect(forwardDestination(m, 2)).toBeNull(); });
  it("a marble in arrival blocks entry and cannot be jumped", () => { const state = createInitialGameState(); const m = state.marbles.find((x) => x.id === "0-0")!; m.zone = "TRACK"; m.trackPosition = 61; const blocker = state.marbles.find((x) => x.id === "0-1")!; blocker.zone = "FINISH"; blocker.trackPosition = null; blocker.finishPosition = 1; expect(checkNormalForwardMove(state, m, 3).legal).toBe(false); });
});

describe("bases", () => {
  it("a four from own base is legal and lands four behind", () => { const state = createInitialGameState(); const m = state.marbles.find((x) => x.id === "0-0")!; m.zone = "TRACK"; m.trackPosition = 0; expect(checkBackwardFour(state, m).legal).toBe(true); });
  it("a normal move cannot end on any base even when empty", () => { const state = createInitialGameState(); const m = state.marbles.find((x) => x.id === "0-0")!; m.zone = "TRACK"; m.trackPosition = 15; expect(checkNormalForwardMove(state, m, 1).legal).toBe(false); });
  it("a four cannot end on any base even when empty", () => { const state = createInitialGameState(); const m = state.marbles.find((x) => x.id === "0-0")!; m.zone = "TRACK"; m.trackPosition = 20; expect(checkBackwardFour(state, m).legal).toBe(false); });
});
