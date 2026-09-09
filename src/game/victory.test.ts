import { describe, expect, it } from "vitest";
import { simulateSevenPlan } from "./sevenSimulation";
import { createInitialGameState } from "./state";
import type { Marble } from "./types";

function finish(id: string, owner: 0 | 1 | 2 | 3, position: number): Marble { return { id, owner, zone: "FINISH", trackPosition: null, finishPosition: position }; }
function track(id: string, owner: 0 | 1 | 2 | 3, position: number): Marble { return { id, owner, zone: "TRACK", trackPosition: position, finishPosition: null }; }
function home(id: string, owner: 0 | 1 | 2 | 3): Marble { return { id, owner, zone: "HOME", trackPosition: null, finishPosition: null }; }

describe("seven victory timing", () => {
  it("rejects a seven if the eighth team marble reaches finish before all seven points are spent", () => {
    const state = createInitialGameState(); state.currentPlayer = 0;
    state.marbles = [
      finish("0-0", 0, 0), finish("0-1", 0, 1), finish("0-2", 0, 2), finish("0-3", 0, 3),
      finish("2-0", 2, 0), finish("2-1", 2, 1), finish("2-2", 2, 2), track("2-3", 2, 45),
      home("1-0", 1), home("1-1", 1), home("1-2", 1), home("1-3", 1),
      home("3-0", 3), home("3-1", 3), home("3-2", 3), home("3-3", 3),
    ];
    const result = simulateSevenPlan(state, 0, [{ marbleId: "2-3", steps: 1 }, { marbleId: "2-0", steps: 6 }]);
    expect(result).toBeNull();
  });

  it("allows victory when the eighth team marble enters finish on the final point", () => {
    const state = createInitialGameState(); state.currentPlayer = 0;
    state.marbles = [
      finish("0-0", 0, 0), finish("0-1", 0, 1), finish("0-2", 0, 2), finish("0-3", 0, 3),
      finish("2-0", 2, 0), finish("2-1", 2, 1), finish("2-2", 2, 3), track("2-3", 2, 25),
      home("1-0", 1), home("1-1", 1), home("1-2", 1), home("1-3", 1),
      home("3-0", 3), home("3-1", 3), home("3-2", 3), home("3-3", 3),
    ];
    // Player 2's own gate is global 29. From global 25, five points enter finish 0.
    const result = simulateSevenPlan(state, 0, [
      { marbleId: "2-1", steps: 1 },
      { marbleId: "2-0", steps: 1 },
      { marbleId: "2-3", steps: 5 },
    ]);
    expect(result).not.toBeNull();
    expect(result!.marbles.filter((m) => m.owner === 0 || m.owner === 2).every((m) => m.zone === "FINISH")).toBe(true);
  });
});
