import { BASE_POSITION } from "./constants";
import { controlledOwner } from "./specialMoves";
import type { CardRank, GameState, Marble, PlayerId } from "./types";

export interface ActionCheck {
  legal: boolean;
  reason?: string;
}

/** Ace and King may bring one controlled marble from HOME onto its own base. */
export function checkExitHome(
  state: GameState,
  currentPlayer: PlayerId,
  marble: Marble,
  rank: CardRank,
): ActionCheck {
  if (rank !== "A" && rank !== "K") {
    return { legal: false, reason: "Only Ace or King can leave home" };
  }

  const owner = controlledOwner(state, currentPlayer);
  if (marble.owner !== owner || marble.zone !== "HOME") {
    return { legal: false, reason: "Marble is not a controlled home marble" };
  }

  const base = BASE_POSITION[owner];
  const occupied = state.marbles.some(
    (m) => m.zone === "TRACK" && m.trackPosition === base,
  );

  if (occupied) {
    return { legal: false, reason: "Base is occupied" };
  }

  return { legal: true };
}

/**
 * Jack swaps one currently controlled track marble with any other track marble.
 * Neither marble may be on any base. FINISH and HOME marbles are untouchable.
 */
export function checkJackSwap(
  state: GameState,
  currentPlayer: PlayerId,
  controlledMarble: Marble,
  targetMarble: Marble,
): ActionCheck {
  if (controlledMarble.id === targetMarble.id) {
    return { legal: false, reason: "Jack needs two different marbles" };
  }

  const owner = controlledOwner(state, currentPlayer);
  if (controlledMarble.owner !== owner) {
    return { legal: false, reason: "First Jack marble is not controlled" };
  }

  if (
    controlledMarble.zone !== "TRACK" ||
    targetMarble.zone !== "TRACK" ||
    controlledMarble.trackPosition === null ||
    targetMarble.trackPosition === null
  ) {
    return { legal: false, reason: "Jack can swap only circuit marbles" };
  }

  const bases = new Set<number>(Object.values(BASE_POSITION));
  if (
    bases.has(controlledMarble.trackPosition) ||
    bases.has(targetMarble.trackPosition)
  ) {
    return { legal: false, reason: "Jack cannot swap a marble on a base" };
  }

  return { legal: true };
}

export function applyJackSwap(a: Marble, b: Marble): [Marble, Marble] {
  if (a.trackPosition === null || b.trackPosition === null) return [a, b];
  return [
    { ...a, trackPosition: b.trackPosition },
    { ...b, trackPosition: a.trackPosition },
  ];
}
