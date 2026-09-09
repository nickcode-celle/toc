import { BASE_POSITION, TEAMMATE, TRACK_SIZE } from "./constants";
import type { Card, GameState, PlayerId } from "./types";

function rankValue(card: Card): number {
  switch (card.rank) {
    case "A": return 100;
    case "K": return 95;
    case "7": return 90;
    case "J": return 75;
    case "4": return 65;
    case "Q": return 55;
    case "10": return 50;
    case "9": return 45;
    case "8": return 40;
    case "6": return 35;
    case "5": return 30;
    case "3": return 20;
    case "2": return 15;
  }
}

function progress(state: GameState, owner: PlayerId): number {
  return state.marbles.filter(m => m.owner === owner).reduce((sum, m) => {
    if (m.zone === "FINISH") return sum + 80 + (m.finishPosition ?? 0) * 5;
    if (m.zone === "TRACK" && m.trackPosition !== null) return sum + ((m.trackPosition - BASE_POSITION[owner] + TRACK_SIZE) % TRACK_SIZE);
    return sum;
  }, 0);
}

/**
 * Secret partner exchange based only on the acting player's hand and public board.
 * The machine can support a partner that is close to finishing without reading that
 * partner's hidden cards.
 */
export function chooseBaselineExchange(state: GameState, player: PlayerId): string {
  const hand = state.players.find(p => p.id === player)?.hand;
  if (!hand?.length) throw new Error("No card available for exchange");
  const partner = TEAMMATE[player];
  const ownHome = state.marbles.filter(m => m.owner === player && m.zone === "HOME").length;
  const partnerHome = state.marbles.filter(m => m.owner === partner && m.zone === "HOME").length;
  const partnerFinished = state.marbles.filter(m => m.owner === partner && m.zone === "FINISH").length;
  const partnerAhead = progress(state, partner) > progress(state, player);

  function keepValue(card: Card): number {
    let value = rankValue(card);
    // If we no longer need exits ourselves, A/K become excellent support cards.
    if (ownHome === 0 && (card.rank === "A" || card.rank === "K")) value -= 35;
    // If partner still has marbles at home, deliberately make exit cards easier to give.
    if (partnerHome > 0 && (card.rank === "A" || card.rank === "K")) value -= partnerAhead ? 65 : 40;
    // Seven is especially valuable to a partner approaching completion.
    if (partnerFinished >= 2 && card.rank === "7") value -= 45;
    // Jack/4 remain tactical resources unless partner is clearly the advanced hand.
    if (partnerAhead && (card.rank === "J" || card.rank === "4")) value -= 18;
    return value;
  }

  return [...hand].sort((a, b) => keepValue(a) - keepValue(b) || a.id.localeCompare(b.id))[0].id;
}
