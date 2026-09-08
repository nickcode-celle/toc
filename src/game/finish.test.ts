import { describe, expect, it } from "vitest";
import { becomesQualifiedAfterForwardMove, forwardDestination } from "./movement";
import type { Marble } from "./types";

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
});
