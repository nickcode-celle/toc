import type { Card, GameState, PlayerId } from "./types";

function exchangeKeepValue(card: Card): number {
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

/**
 * Baseline secret exchange: give away the least strategically flexible card.
 * It only reads the player's own hand, so it respects the information boundary.
 */
export function chooseBaselineExchange(state: GameState, player: PlayerId): string {
  const hand = state.players.find((p) => p.id === player)?.hand;
  if (!hand?.length) throw new Error("No card available for exchange");
  return [...hand].sort((a, b) => exchangeKeepValue(a) - exchangeKeepValue(b) || a.id.localeCompare(b.id))[0].id;
}
