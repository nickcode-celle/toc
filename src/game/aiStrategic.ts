import { evaluateState } from "./ai";
import { executeMove } from "./executor";
import { getLegalMoves, type LegalMove } from "./legalMoves";
import type { GameState, PlayerId } from "./types";

function finishedCount(state: GameState, team: 0 | 1): number {
  const owners = state.players.filter(p => p.team === team).map(p => p.id);
  return state.marbles.filter(m => owners.includes(m.owner) && m.zone === "FINISH").length;
}
function homeCount(state: GameState, team: 0 | 1): number {
  const owners = state.players.filter(p => p.team === team).map(p => p.id);
  return state.marbles.filter(m => owners.includes(m.owner) && m.zone === "HOME").length;
}

/**
 * Tactical AI that uses only information legitimately available to the acting player:
 * its own hand plus the public board/discard state. It never examines another hand.
 */
export function chooseStrategicMove(state: GameState, player: PlayerId = state.currentPlayer): LegalMove {
  if (player !== state.currentPlayer) throw new Error("AI can only choose for current player");
  const moves = getLegalMoves(state, player); // only the current player's hand is consulted
  if (!moves.length) throw new Error("No legal move");
  const team = state.players.find(p => p.id === player)!.team;
  const enemyTeam = (team === 0 ? 1 : 0) as 0 | 1;
  const beforeOwnFinish = finishedCount(state, team);
  const beforeEnemyHome = homeCount(state, enemyTeam);
  let best = moves[0], bestScore = -Infinity;

  for (const move of moves) {
    const after = executeMove(state, move);
    if (after.winner === team) return move;
    let score = evaluateState(after, player);
    // Explicit tactical rewards use only public consequences of our own move.
    score += (finishedCount(after, team) - beforeOwnFinish) * 80;
    score += (homeCount(after, enemyTeam) - beforeEnemyHome) * 45;
    if (move.type === "EXIT") score += 20;
    if (score > bestScore) { bestScore = score; best = move; }
  }
  return best;
}
