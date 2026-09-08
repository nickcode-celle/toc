import { describe, expect, it } from "vitest";
import { simulateSevenPlan } from "./sevenSimulation";
import { createInitialGameState } from "./state";
import type { Marble } from "./types";

function finish(id: string, owner: 0 | 1 | 2 | 3, position: number): Marble {
  return { id, owner, zone: "FINISH", trackPosition: null, finishPosition: position, qualifiedForFinish: true };
}
function track(id: string, owner: 0 | 1 | 2 | 3, position: number, qualified = false): Marble {
  return { id, owner, zone: "TRACK", trackPosition: position, finishPosition: null, qualifiedForFinish: qualified };
}
function home(id: string, owner: 0 | 1 | 2 | 3): Marble {
  return { id, owner, zone: "HOME", trackPosition: null, finishPosition: null, qualifiedForFinish: false };
}

describe("seven sequential control", () => {
  it("can finish the fourth own marble then spend remaining points on teammate", () => {
    const state = createInitialGameState();
    state.currentPlayer = 0;
    state.marbles = [
      finish("0-0", 0, 0), finish("0-1", 0, 1), finish("0-2", 0, 2),
      track("0-3", 0, 12, true),
      track("2-0", 2, 20), home("2-1", 2), home("2-2", 2), home("2-3", 2),
      home("1-0", 1), home("1-1", 1), home("1-2", 1), home("1-3", 1),
      home("3-0", 3), home("3-1", 3), home("3-2", 3), home("3-3", 3),
    ];

    const result = simulateSevenPlan(state, 0, [
      { marbleId: "0-3", steps: 2 },
      { marbleId: "2-0", steps: 5 },
    ]);

    expect(result).not.toBeNull();
    expect(result!.marbles.find((m) => m.id === "0-3")?.zone).toBe("FINISH");
    expect(result!.marbles.find((m) => m.id === "2-0")?.trackPosition).toBe(25);
  });

  it("cannot use teammate before the fourth own marble is finished", () => {
    const state = createInitialGameState();
    state.currentPlayer = 0;
    state.marbles = [
      finish("0-0", 0, 0), finish("0-1", 0, 1),
      track("0-2", 0, 5), track("0-3", 0, 12, true),
      track("2-0", 2, 20), home("2-1", 2), home("2-2", 2), home("2-3", 2),
      home("1-0", 1), home("1-1", 1), home("1-2", 1), home("1-3", 1),
      home("3-0", 3), home("3-1", 3), home("3-2", 3), home("3-3", 3),
    ];

    expect(simulateSevenPlan(state, 0, [
      { marbleId: "0-3", steps: 2 },
      { marbleId: "2-0", steps: 5 },
    ])).toBeNull();
  });

  it("cannot use the same marble twice", () => {
    const state = createInitialGameState();
    expect(simulateSevenPlan(state, 0, [
      { marbleId: "0-0", steps: 3 },
      { marbleId: "0-0", steps: 4 },
    ])).toBeNull();
  });
});
