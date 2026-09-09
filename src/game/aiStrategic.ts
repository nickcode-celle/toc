import { BASE_POSITION, TRACK_SIZE } from "./constants";
import { evaluateState } from "./ai";
import { executeMove } from "./executor";
import { getLegalMoves, type LegalMove } from "./legalMoves";
import type { GameState, Marble, PlayerId } from "./types";

function teamOwners(state: GameState, team: 0 | 1): PlayerId[] { return state.players.filter(p => p.team === team).map(p => p.id); }
function finishedCount(state: GameState, team: 0 | 1): number { const owners=teamOwners(state,team); return state.marbles.filter(m=>owners.includes(m.owner)&&m.zone==="FINISH").length; }
function homeCount(state: GameState, team: 0 | 1): number { const owners=teamOwners(state,team); return state.marbles.filter(m=>owners.includes(m.owner)&&m.zone==="HOME").length; }
function relativeProgress(m: Marble): number { if(m.zone!=="TRACK"||m.trackPosition===null)return -1; return (m.trackPosition-BASE_POSITION[m.owner]+TRACK_SIZE)%TRACK_SIZE; }
function exposedThreat(state: GameState, team: 0 | 1): number { const enemyOwners=teamOwners(state,team===0?1:0),ownOwners=teamOwners(state,team);let danger=0;for(const mine of state.marbles.filter(m=>ownOwners.includes(m.owner)&&m.zone==="TRACK"&&m.trackPosition!==null)){if(mine.trackPosition===BASE_POSITION[mine.owner])continue;for(const enemy of state.marbles.filter(m=>enemyOwners.includes(m.owner)&&m.zone==="TRACK"&&m.trackPosition!==null)){const distance=(mine.trackPosition!-enemy.trackPosition!+TRACK_SIZE)%TRACK_SIZE;if(distance>=1&&distance<=13)danger+=14-distance;}}return danger; }
function advancedMarbles(state: GameState, team: 0 | 1): number { const owners=teamOwners(state,team);return state.marbles.filter(m=>owners.includes(m.owner)&&(m.zone==="FINISH"||relativeProgress(m)>=10)).length; }

/** Tactical AI using only the acting player's own hand and public board. */
export function chooseStrategicMove(state: GameState, player: PlayerId = state.currentPlayer): LegalMove {
  if(player!==state.currentPlayer)throw new Error("AI can only choose for current player");
  const moves=getLegalMoves(state,player);if(!moves.length)throw new Error("No legal move");
  const team=state.players.find(p=>p.id===player)!.team,enemyTeam=(team===0?1:0) as 0|1;
  const beforeOwnFinish=finishedCount(state,team),beforeEnemyHome=homeCount(state,enemyTeam),beforeDanger=exposedThreat(state,team),beforeAdvanced=advancedMarbles(state,team);
  let best=moves[0],bestScore=-Infinity;
  for(const move of moves){const after=executeMove(state,move);if(after.winner===team)return move;let score=evaluateState(after,player);score+=(finishedCount(after,team)-beforeOwnFinish)*120;score+=(homeCount(after,enemyTeam)-beforeEnemyHome)*70;score+=(beforeDanger-exposedThreat(after,team))*2;score+=(advancedMarbles(after,team)-beforeAdvanced)*18;if(move.type==="EXIT")score+=30;if(move.type==="JACK"&&move.marbleId!==move.targetMarbleId)score+=4;if(move.type==="SEVEN")score+=move.parts.length>1?6:0;if(score>bestScore){bestScore=score;best=move;}}
  return best;
}
