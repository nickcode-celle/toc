import { BASE_POSITION, TRACK_SIZE } from "./constants";
import { evaluateState } from "./ai";
import { executeMove } from "./executor";
import { getLegalMoves, type LegalMove } from "./legalMoves";
import type { CardRank, GameState, Marble, PlayerId, TeamId } from "./types";

function teamOwners(state: GameState, team: TeamId): PlayerId[] { return state.players.filter(p => p.team === team).map(p => p.id); }
function finishedCount(state: GameState, team: TeamId): number { const owners=teamOwners(state,team); return state.marbles.filter(m=>owners.includes(m.owner)&&m.zone==="FINISH").length; }
function homeCount(state: GameState, team: TeamId): number { const owners=teamOwners(state,team); return state.marbles.filter(m=>owners.includes(m.owner)&&m.zone==="HOME").length; }
function relativeProgress(m: Marble): number { if(m.zone!=="TRACK"||m.trackPosition===null)return -1; return (m.trackPosition-BASE_POSITION[m.owner]+TRACK_SIZE)%TRACK_SIZE; }
function teamProgress(state: GameState, team: TeamId): number { const owners=teamOwners(state,team); return state.marbles.filter(m=>owners.includes(m.owner)).reduce((s,m)=>s+(m.zone==="FINISH"?80+(m.finishPosition??0)*8:m.zone==="TRACK"?relativeProgress(m):0),0); }
function exposedThreat(state: GameState, team: TeamId): number { const enemyOwners=teamOwners(state,team===0?1:0),ownOwners=teamOwners(state,team);let danger=0;for(const mine of state.marbles.filter(m=>ownOwners.includes(m.owner)&&m.zone==="TRACK"&&m.trackPosition!==null)){if(mine.trackPosition===BASE_POSITION[mine.owner])continue;for(const enemy of state.marbles.filter(m=>enemyOwners.includes(m.owner)&&m.zone==="TRACK"&&m.trackPosition!==null)){const d=(mine.trackPosition!-enemy.trackPosition!+TRACK_SIZE)%TRACK_SIZE;if(d>=1&&d<=13)danger+=14-d;}}return danger; }
function enemyArrivalThreat(state: GameState, team: TeamId): number { const enemy=(team===0?1:0) as TeamId; const owners=teamOwners(state,enemy); const finished=finishedCount(state,enemy); let t=finished*35; for(const m of state.marbles.filter(x=>owners.includes(x.owner)&&x.zone==="TRACK")){const p=relativeProgress(m); if(p>=58)t+=(p-57)*18; else if(p>=50)t+=(p-49)*5;} if(finished===7)t*=4; return t; }
function cardRank(state: GameState, player: PlayerId, move: LegalMove): CardRank | undefined { return state.players.find(p=>p.id===player)?.hand.find(c=>c.id===move.cardId)?.rank; }
function special(rank: CardRank|undefined){return rank==="4"||rank==="7"||rank==="J";}
function newlyArrived(before:GameState,after:GameState,team:TeamId){const owners=teamOwners(before,team);let n=0;for(const a of after.marbles){if(!owners.includes(a.owner)||a.zone!=="FINISH")continue;const b=before.marbles.find(m=>m.id===a.id);if(b&&b.zone!=="FINISH")n++;}return n;}

/** Team-first AI: every move is valued by the race to bring the team's eight marbles home. */
export function chooseStrategicMove(state: GameState, player: PlayerId = state.currentPlayer): LegalMove {
  if(player!==state.currentPlayer)throw new Error("AI can only choose for current player");
  const moves=getLegalMoves(state,player); if(!moves.length)throw new Error("No legal move");
  const team=state.players.find(p=>p.id===player)!.team, enemy=(team===0?1:0) as TeamId;
  const before={finish:finishedCount(state,team),enemyHome:homeCount(state,enemy),progress:teamProgress(state,team),enemyProgress:teamProgress(state,enemy),danger:exposedThreat(state,team),threat:enemyArrivalThreat(state,team)};
  const hasOrdinaryAlternative=moves.some(m=>!special(cardRank(state,player,m)));
  let best=moves[0],bestScore=-Infinity;
  for(const move of moves){
    const after=executeMove(state,move); if(after.winner===team)return move;
    const rank=cardRank(state,player,move);
    const ownFinishGain=finishedCount(after,team)-before.finish;
    const arrivals=newlyArrived(state,after,team);
    const captures=homeCount(after,enemy)-before.enemyHome;
    const progressGain=teamProgress(after,team)-before.progress;
    const enemyProgressLoss=before.enemyProgress-teamProgress(after,enemy);
    const threatRemoved=before.threat-enemyArrivalThreat(after,team);
    const dangerRemoved=before.danger-exposedThreat(after,team);
    let score=evaluateState(after,player)*0.25;
    // A legal entry into arrival is normally much stronger than continuing around the circuit.
    score+=ownFinishGain*5000+arrivals*2500+captures*95+progressGain*4+enemyProgressLoss*5+threatRemoved*7+dangerRemoved*2;
    const owners=teamOwners(state,team);
    const beforeCompleted=owners.filter(o=>state.marbles.filter(m=>m.owner===o&&m.zone==="FINISH").length===4).length;
    const afterCompleted=owners.filter(o=>after.marbles.filter(m=>m.owner===o&&m.zone==="FINISH").length===4).length;
    score+=(afterCompleted-beforeCompleted)*1800;
    if(move.type==="EXIT")score+=180;
    const immediateBenefit=captures>0||ownFinishGain>0||threatRemoved>0||progressGain>=10||dangerRemoved>=5;
    if(hasOrdinaryAlternative&&!immediateBenefit){if(rank==="4")score-=120;if(rank==="7")score-=180;if(rank==="J")score-=140;}
    if(rank==="7"&&move.type==="SEVEN"){
      // Splitting Seven has no value by itself. Extra partial moves must earn their keep.
      score-=(move.parts.length-1)*35;
      if(arrivals>0)score+=900;
      if(captures>0)score+=300;
    }
    if(rank==="J"&&move.type==="JACK"){
      const target=state.marbles.find(m=>m.id===move.targetMarbleId);
      if(target&&state.players.find(p=>p.id===target.owner)!.team===enemy){const swing=enemyProgressLoss+progressGain;score+=swing*7;if(swing<=0)score-=220;}
    }
    if(before.finish<8&&finishedCount(state,enemy)>=6)score+=threatRemoved*10+captures*70;
    if(score>bestScore){bestScore=score;best=move;}
  }
  return best;
}
