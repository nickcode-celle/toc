import { BASE_POSITION } from "./constants";
import { getLegalMoves, type LegalMove } from "./legalMoves";
import { forwardDestination } from "./movement";
import { checkBackwardFour } from "./specialMoves";
import type { GameState, PlayerId } from "./types";

export type AssistanceMode = "EASY" | "NORMAL" | "EXPERT";

export interface AssistanceHints {
  playableCardIds: string[];
  playableMarbleIds: string[];
  destinationKeys: string[];
  jackMarbleIds: string[];
  sevenRemaining: number | null;
  homeExitHintMarbleId: string | null;
}

const emptyHints = (): AssistanceHints => ({ playableCardIds: [], playableMarbleIds: [], destinationKeys: [], jackMarbleIds: [], sevenRemaining: null, homeExitHintMarbleId: null });
const destinationKey = (zone: "TRACK" | "FINISH", position: number, owner?: PlayerId) => zone === "TRACK" ? `TRACK:${position}` : `FINISH:${owner}:${position}`;

/** UI-only help. Core legality remains enforced by the engine in every mode. */
export function getAssistanceHints(state: GameState, mode: AssistanceMode, selectedCardId?: string, selectedMarbleId?: string, sevenUsedPoints = 0): AssistanceHints {
  const hints = emptyHints();
  if (mode === "EXPERT") return hints;
  const moves = getLegalMoves(state);
  const selectedCard = state.players.find((p) => p.id === state.currentPlayer)?.hand.find((c) => c.id === selectedCardId);

  if (mode === "EASY") {
    hints.playableCardIds = [...new Set(moves.map((m) => m.cardId))];
    const cardMoves = selectedCardId ? moves.filter((m) => m.cardId === selectedCardId) : [];
    hints.playableMarbleIds = [...new Set(cardMoves.flatMap((m) => m.type === "JACK" ? [m.marbleId, m.targetMarbleId] : "marbleId" in m ? [m.marbleId] : m.parts.map((p) => p.marbleId)))];
    if (selectedCard?.rank === "J") hints.jackMarbleIds = hints.playableMarbleIds;
    if ((selectedCard?.rank === "A" || selectedCard?.rank === "K")) {
      const exit = cardMoves.find((m) => m.type === "EXIT");
      if (exit && exit.type === "EXIT") hints.homeExitHintMarbleId = exit.marbleId; // one visual hint only; every legal HOME marble remains selectable
    }
  }

  if (selectedCard?.rank === "7" && mode !== "EXPERT") hints.sevenRemaining = Math.max(0, 7 - sevenUsedPoints);
  if (!selectedMarbleId || !selectedCard) return hints;

  // NORMAL highlights only classic/four final destinations. Seven and Jack deliberately reveal nothing.
  if (selectedCard.rank === "7" || selectedCard.rank === "J") {
    if (mode === "NORMAL") return hints;
  }

  const marble = state.marbles.find((m) => m.id === selectedMarbleId);
  if (!marble) return hints;
  const cardMoves = moves.filter((m) => m.cardId === selectedCardId && ("marbleId" in m ? m.marbleId === selectedMarbleId : m.parts.some((p) => p.marbleId === selectedMarbleId)));

  for (const move of cardMoves) {
    if (move.type === "MOVE") {
      const d = forwardDestination(marble, move.steps); if (d) hints.destinationKeys.push(destinationKey(d.zone, d.zone === "TRACK" ? d.trackPosition : d.finishPosition, marble.owner));
    } else if (move.type === "FOUR" && marble.trackPosition !== null && checkBackwardFour(state, marble).legal) {
      hints.destinationKeys.push(destinationKey("TRACK", (marble.trackPosition - 4 + 64) % 64));
    } else if (move.type === "EXIT" && mode === "EASY") {
      hints.destinationKeys.push(destinationKey("TRACK", BASE_POSITION[marble.owner]));
    } else if (move.type === "SEVEN" && mode === "EASY") {
      for (const part of move.parts.filter((p) => p.marbleId === selectedMarbleId)) {
        const d = forwardDestination(marble, part.steps); if (d) hints.destinationKeys.push(destinationKey(d.zone, d.zone === "TRACK" ? d.trackPosition : d.finishPosition, marble.owner));
      }
    }
  }
  hints.destinationKeys = [...new Set(hints.destinationKeys)];
  return hints;
}
