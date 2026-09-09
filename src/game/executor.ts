import { BASE_POSITION, TRACK_SIZE } from "./constants";
import { applyJackSwap } from "./aceKingJack";
import { getLegalMoves, type LegalMove } from "./legalMoves";
import { forwardDestination } from "./movement";
import { checkBackwardFour } from "./specialMoves";
import { simulateSevenPlan } from "./sevenSimulation";
import type { GameState, Marble, PlayerId, TeamId } from "./types";

function cloneState(state: GameState): GameState { return { ...state, players: state.players.map((p) => ({ ...p, hand: [...p.hand] })), marbles: state.marbles.map((m) => ({ ...m })), deck: [...state.deck], discardPile: [...state.discardPile] }; }
function sendHome(m: Marble): void { m.zone = "HOME"; m.trackPosition = null; m.finishPosition = null; }
function applyCaptures(state: GameState, ids: string[]): void { for (const id of ids) { const m = state.marbles.find((x) => x.id === id); if (m) sendHome(m); } }
function placePlayedCard(state: GameState, player: PlayerId, cardId: string): void { const p = state.players.find((x) => x.id === player); if (!p) throw new Error("Unknown player"); const i = p.hand.findIndex((c) => c.id === cardId); if (i < 0) throw new Error("Played card is not in hand"); const [card] = p.hand.splice(i, 1); state.discardPile.push(card); }
function sameMove(a: LegalMove, b: LegalMove): boolean { return JSON.stringify(a) === JSON.stringify(b); }
function detectWinner(state: GameState): TeamId | null { for (const team of [0, 1] as TeamId[]) { const owners = state.players.filter((p) => p.team === team).map((p) => p.id); const teamMarbles = state.marbles.filter((m) => owners.includes(m.owner)); if (teamMarbles.length === 8 && teamMarbles.every((m) => m.zone === "FINISH")) return team; } return null; }
export function nextPlayer(player: PlayerId): PlayerId { return ((player + 1) % 4) as PlayerId; }
export function advanceTurn(state: GameState): void { let candidate = nextPlayer(state.currentPlayer); for (let i = 0; i < 4; i += 1) { const p = state.players.find((x) => x.id === candidate)!; if (!p.hasDiscardedHand && p.hand.length > 0) { state.currentPlayer = candidate; return; } candidate = nextPlayer(candidate); } state.currentPlayer = candidate; }

export function executeMove(state: GameState, move: LegalMove): GameState {
  const legal = getLegalMoves(state, state.currentPlayer);
  if (!legal.some((c) => sameMove(c, move))) throw new Error("Illegal move");

  const player = state.currentPlayer;
  let next = cloneState(state);

  // Toc rule: the chosen card is exposed on top of the discard pile before any
  // marble movement (including Seven and Jack). Because legality was checked
  // above, an invalid action never reaches this point in the digital game.
  placePlayedCard(next, player, move.cardId);

  if (move.type === "SEVEN") {
    const simulated = simulateSevenPlan(next, player, move.parts);
    if (!simulated) throw new Error("Illegal seven plan");
    next = simulated;
  } else {
    const marble = "marbleId" in move ? next.marbles.find((m) => m.id === move.marbleId) : undefined;
    if (move.type === "EXIT" && marble) { marble.zone = "TRACK"; marble.trackPosition = BASE_POSITION[marble.owner]; marble.finishPosition = null; }
    if (move.type === "MOVE" && marble) {
      const destination = forwardDestination(marble, move.steps); if (!destination) throw new Error("Invalid destination");
      if (destination.zone === "TRACK") { const victim = next.marbles.find((m) => m.id !== marble.id && m.zone === "TRACK" && m.trackPosition === destination.trackPosition); if (victim) sendHome(victim); marble.zone = "TRACK"; marble.trackPosition = destination.trackPosition; marble.finishPosition = null; }
      else { marble.zone = "FINISH"; marble.trackPosition = null; marble.finishPosition = destination.finishPosition; }
    }
    if (move.type === "FOUR" && marble && marble.trackPosition !== null) { const check = checkBackwardFour(next, marble); if (!check.legal) throw new Error("Illegal four"); applyCaptures(next, check.capturedMarbleIds); marble.trackPosition = (marble.trackPosition - 4 + TRACK_SIZE) % TRACK_SIZE; }
    if (move.type === "JACK") { const a = next.marbles.find((m) => m.id === move.marbleId)!; const b = next.marbles.find((m) => m.id === move.targetMarbleId)!; const [na, nb] = applyJackSwap(a, b); Object.assign(a, na); Object.assign(b, nb); }
  }

  next.winner = detectWinner(next);
  if (next.winner === null) advanceTurn(next);
  return next;
}

/**
 * Discards the complete hand when no legal move exists.
 * `visibleCardId` chooses which card is placed last, hence the only card visible
 * on top of the common discard pile. Other discarded cards remain hidden UI data.
 */
export function discardWholeHand(state: GameState, visibleCardId?: string): GameState {
  const next = cloneState(state);
  const p = next.players.find((x) => x.id === next.currentPlayer)!;
  if (getLegalMoves(next, next.currentPlayer).length > 0) throw new Error("Cannot discard: at least one legal move exists");
  if (p.hand.length === 0) throw new Error("Cannot discard an empty hand");
  const topId = visibleCardId ?? p.hand[p.hand.length - 1].id;
  if (!p.hand.some((c) => c.id === topId)) throw new Error("Visible discard card must belong to the hand");
  const hidden = p.hand.filter((c) => c.id !== topId);
  const top = p.hand.find((c) => c.id === topId)!;
  next.discardPile.push(...hidden, top);
  p.hand = [];
  p.hasDiscardedHand = true;
  advanceTurn(next);
  return next;
}

export function visibleDiscardCard(state: GameState) { return state.discardPile.at(-1) ?? null; }
