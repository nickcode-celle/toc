import { describe, expect, it } from "vitest";
import { checkExitHome, checkJackSwap } from "./aceKingJack";
import { forwardDestination } from "./movement";
import { checkNormalForwardMove } from "./rules";
import { checkBackwardFour, validateSevenPlan } from "./specialMoves";
import { createInitialGameState } from "./state";
import type { GameState, Marble } from "./types";

function trackMarble(id: string, owner: 0 | 1 | 2 | 3, position: number): Marble {
  return { id, owner, zone: "TRACK", trackPosition: position, finishPosition: null, qualifiedForFinish: false };
}

function stateWith(...marbles: Marble[]): GameState {
  const state = createInitialGameState();
  state.marbles = marbles;
  return state;
}

describe("Toc core rules", () => {
  it("moves a normal marble clockwise", () => {
    const marble = trackMarble("r0", 0, 5);
    expect(forwardDestination(marble, 3)).toEqual({ zone: "TRACK", trackPosition: 8 });
  });

  it("wraps around the 64-position circuit", () => {
    const marble = trackMarble("y0", 3, 62);
    expect(forwardDestination(marble, 5)).toEqual({ zone: "TRACK", trackPosition: 3 });
  });

  it("captures a marble landed on exactly", () => {
    const mover = trackMarble("r0", 0, 5);
    const victim = trackMarble("g0", 1, 8);
    const check = checkNormalForwardMove(stateWith(mover, victim), mover, 3);
    expect(check.legal).toBe(true);
    expect(check.capturedMarbleIds).toEqual(["g0"]);
  });

  it("also captures a teammate marble landed on exactly", () => {
    const mover = trackMarble("r0", 0, 5);
    const teammate = trackMarble("b0", 2, 8);
    expect(checkNormalForwardMove(stateWith(mover, teammate), mover, 3).capturedMarbleIds).toEqual(["b0"]);
  });

  it("cannot pass an occupied base", () => {
    const mover = trackMarble("r0", 0, 14);
    const blocker = trackMarble("g0", 1, 16);
    expect(checkNormalForwardMove(stateWith(mover, blocker), mover, 4).legal).toBe(false);
  });

  it("Ace cannot exit when own base is occupied", () => {
    const home: Marble = { id: "r0", owner: 0, zone: "HOME", trackPosition: null, finishPosition: null, qualifiedForFinish: false };
    const base = trackMarble("r1", 0, 0);
    expect(checkExitHome(stateWith(home, base), 0, home, "A").legal).toBe(false);
  });

  it("Jack cannot swap a marble on a base", () => {
    const base = trackMarble("r0", 0, 0);
    const other = trackMarble("g0", 1, 10);
    expect(checkJackSwap(stateWith(base, other), 0, base, other).legal).toBe(false);
  });

  it("four captures every marble crossed", () => {
    const mover = trackMarble("r0", 0, 10);
    const a = trackMarble("g0", 1, 9);
    const b = trackMarble("b0", 2, 7);
    const result = checkBackwardFour(stateWith(mover, a, b), mover);
    expect(result.legal).toBe(true);
    expect(result.capturedMarbleIds.sort()).toEqual(["b0", "g0"]);
  });

  it("seven must use exactly seven points", () => {
    const a = trackMarble("r0", 0, 4);
    const b = trackMarble("r1", 0, 8);
    const state = stateWith(a, b);
    expect(validateSevenPlan(state, 0, [{ marbleId: "r0", steps: 3 }, { marbleId: "r1", steps: 3 }]).legal).toBe(false);
  });

  it("seven cannot use the same marble twice", () => {
    const a = trackMarble("r0", 0, 4);
    const state = stateWith(a);
    expect(validateSevenPlan(state, 0, [{ marbleId: "r0", steps: 3 }, { marbleId: "r0", steps: 4 }]).legal).toBe(false);
  });
});
