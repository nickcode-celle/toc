import { describe, expect, it } from "vitest";
import { checkExitHome, checkJackSwap } from "./aceKingJack";
import { forwardDestination } from "./movement";
import { checkNormalForwardMove } from "./rules";
import { checkBackwardFour, validateSevenPlan } from "./specialMoves";
import { createInitialGameState } from "./state";
import type { GameState, Marble } from "./types";

function trackMarble(id: string, owner: 0 | 1 | 2 | 3, position: number): Marble { return { id, owner, zone: "TRACK", trackPosition: position, finishPosition: null }; }
function homeMarble(id: string, owner: 0 | 1 | 2 | 3): Marble { return { id, owner, zone: "HOME", trackPosition: null, finishPosition: null }; }
function stateWith(...marbles: Marble[]): GameState { const state = createInitialGameState(); state.marbles = marbles; return state; }

describe("Toc core rules", () => {
  it("moves a normal marble clockwise", () => { expect(forwardDestination(trackMarble("r0", 0, 5), 3)).toEqual({ zone: "TRACK", trackPosition: 8 }); });
  it("wraps around the 64-position circuit", () => { expect(forwardDestination(trackMarble("y0", 3, 62), 5)).toEqual({ zone: "TRACK", trackPosition: 3 }); });
  it("captures an opponent landed on exactly", () => { const mover = trackMarble("r0", 0, 5); expect(checkNormalForwardMove(stateWith(mover, trackMarble("g0", 1, 8)), mover, 3).capturedMarbleIds).toEqual(["g0"]); });
  it("captures a teammate landed on exactly", () => { const mover = trackMarble("r0", 0, 5); expect(checkNormalForwardMove(stateWith(mover, trackMarble("b0", 2, 8)), mover, 3).capturedMarbleIds).toEqual(["b0"]); });
  it("captures another own marble landed on exactly", () => { const mover = trackMarble("r0", 0, 5); expect(checkNormalForwardMove(stateWith(mover, trackMarble("r1", 0, 8)), mover, 3).capturedMarbleIds).toEqual(["r1"]); });
  it("cannot pass an occupied base", () => { const mover = trackMarble("r0", 0, 14); expect(checkNormalForwardMove(stateWith(mover, trackMarble("g0", 1, 16)), mover, 4).legal).toBe(false); });
  it("Ace cannot exit when own base is occupied", () => { const home = homeMarble("r0", 0); expect(checkExitHome(stateWith(home, trackMarble("r1", 0, 0)), 0, home, "A").legal).toBe(false); });
  it("Jack cannot swap a marble on a base", () => { const base = trackMarble("r0", 0, 0); expect(checkJackSwap(stateWith(base, trackMarble("g0", 1, 10)), 0, base, trackMarble("g0", 1, 10)).legal).toBe(false); });
  it("four captures every ordinary marble crossed including own and teammate", () => { const mover = trackMarble("r0", 0, 10); const result = checkBackwardFour(stateWith(mover, trackMarble("r1", 0, 9), trackMarble("b0", 2, 8), trackMarble("g0", 1, 7)), mover); expect(result.legal).toBe(true); expect(result.capturedMarbleIds.sort()).toEqual(["b0", "g0", "r1"]); });
  it("four is atomic when a later occupied base blocks it", () => { const mover = trackMarble("r0", 0, 19); const victim = trackMarble("g0", 1, 18); const blocker = trackMarble("b0", 2, 16); const result = checkBackwardFour(stateWith(mover, victim, blocker), mover); expect(result.legal).toBe(false); expect(result.capturedMarbleIds).toEqual([]); });
  it("seven must use exactly seven points", () => { const a = trackMarble("r0", 0, 4); const b = trackMarble("r1", 0, 8); expect(validateSevenPlan(stateWith(a, b), 0, [{ marbleId: "r0", steps: 3 }, { marbleId: "r1", steps: 3 }]).legal).toBe(false); });
  it("seven cannot use the same marble twice", () => { const a = trackMarble("r0", 0, 4); expect(validateSevenPlan(stateWith(a), 0, [{ marbleId: "r0", steps: 3 }, { marbleId: "r0", steps: 4 }]).legal).toBe(false); });
});
