import { evaluateState } from "./ai";
import { executeMove } from "./executor";
import { getLegalMoves, type LegalMove } from "./legalMoves";
import type { GameState, PlayerId } from "./types";

function immediateScore(state: GameState, player: PlayerId, move: LegalMove): number {
  return evaluateState(executeMove(state, move), player);
}

/**
 * Lightweight strategic AI for the playable prototype.
 * It evaluates its move, then anticipates the strongest legal reply by the next player.
 * Hidden hands are never inspected for decision making beyond the current actor's own legal hand.
 */
export function chooseStrategicMove(state: GameState, player: PlayerId = state.currentPlayer): LegalMove {
  if (player !== state.currentPlayer) throw new Error("AI can only choose for current player");
  const moves = getLegalMoves(state, player);
  if (!moves.length) throw new Error("No legal move");
  const team = state.players.find(p => p.id === player)!.team;
  let best = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const after = executeMove(state, move);
    let score = evaluateState(after, player);
    if (after.winner !== null) return move;

    const replyPlayer = after.currentPlayer;
    const reply = getLegalMoves(after, replyPlayer);
    if (reply.length) {
      const replyTeam = after.players.find(p => p.id === replyPlayer)!.team;
      const replyScores = reply.map(r => immediateScore(after, player, r));
      // Opponents minimize our position; teammate naturally maximizes the team's position.
      score = replyTeam === team ? Math.max(...replyScores) : Math.min(...replyScores);
    }

    if (score > bestScore) { bestScore = score; best = move; }
  }
  return best;
}
