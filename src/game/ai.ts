import { BASE_POSITION, TEAMMATE, TRACK_SIZE } from "./constants";
import { executeMove } from "./executor";
import { getLegalMoves, type LegalMove } from "./legalMoves";
import type { GameState, Marble, PlayerId } from "./types";

function controlledOwners(state: GameState, player: PlayerId): PlayerId[] {
  const ownDone = state.marbles.filter((m) => m.owner === player).every((m) => m.zone === "FINISH");
  return ownDone ? [TEAMMATE[player]] : [player];
}

function marbleProgress(m: Marble): number {
  if (m.zone === "HOME") return -12;
  if (m.zone === "FINISH") return 80 + (m.finishPosition ?? 0) * 6;
  const base = BASE_POSITION[m.owner];
  const relative = ((m.trackPosition ?? base) - base + TRACK_SIZE) % TRACK_SIZE;
  return relative;
}

export function evaluateState(state: GameState, player: PlayerId): number {
  const team = state.players.find((p) => p.id === player)!.team;
  if (state.winner !== null) return state.winner === team ? 1_000_000 : -1_000_000;
  let score = 0;
  for (const m of state.marbles) {
    const sameTeam = state.players.find((p) => p.id === m.owner)!.team === team;
    const value = marbleProgress(m) + (m.zone === "FINISH" ? 120 : 0) + (m.zone === "TRACK" && m.trackPosition === BASE_POSITION[m.owner] ? 18 : 0);
    score += sameTeam ? value : -value;
  }
  // Finishing one's own four is strategically valuable because this player then
  // starts using their cards for the partner (the "two hands" Toc dynamic).
  for (const owner of state.players.filter((p) => p.team === team).map((p) => p.id)) {
    if (state.marbles.filter((m) => m.owner === owner).every((m) => m.zone === "FINISH")) score += 90;
  }
  return score;
}

export function chooseBaselineMove(state: GameState, player: PlayerId = state.currentPlayer): LegalMove {
  if (player !== state.currentPlayer) throw new Error("AI can only choose for current player");
  const moves = getLegalMoves(state, player);
  if (!moves.length) throw new Error("No legal move");
  let best = moves[0]; let bestScore = -Infinity;
  for (const move of moves) {
    const next = executeMove(state, move);
    const score = evaluateState(next, player);
    if (score > bestScore) { bestScore = score; best = move; }
  }
  return best;
}

/** Deterministic selector suitable for gameLoop.simulateGame and reproducible tests. */
export function baselineMoveSelector(state: GameState, moves: LegalMove[]): LegalMove {
  const legalIds = new Set(moves.map((m) => JSON.stringify(m)));
  const chosen = chooseBaselineMove(state);
  if (!legalIds.has(JSON.stringify(chosen))) throw new Error("Baseline AI selected a move outside supplied legal moves");
  return chosen;
}
