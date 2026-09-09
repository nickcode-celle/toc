import { BASE_POSITION, TRACK_SIZE } from "./constants";
import { evaluateState } from "./ai";
import { executeMove } from "./executor";
import { getLegalMoves, type LegalMove } from "./legalMoves";
import type { CardRank, GameState, Marble, PlayerId, TeamId } from "./types";

function teamOwners(state: GameState, team: TeamId): PlayerId[] { return state.players.filter(p => p.team === team).map(p => p.id); }
function finishedCount(state: GameState, team: TeamId): number { const owners=teamOwners(state,team); return state.marbles.filter(m=>owners.includes(m.owner)&&m.zone==="FINISH").length; }
function homeCount(state: GameState, team: TeamId): number { const owners=teamOwners(state,team); return state.marbles.filter(m=>owners.includes(m.owner)&&m.zone==="HOME").length; }
function relativeProgress(m: Marble): number { if(m.zone!=="TRACK"||m.trackPosition===null)return -1; return (m.trackPosition-BASE_POSITION[m.owner]+TRACK_SIZE)%TRACK_SIZE; }
function teamProgress(state: GameState, team: TeamId): number { const owners=teamOwners(state,team); return state.marbles.filter(m=>owners.includes(m.owner)).reduce((s,m)=>s+(m.zone==="FINISH"?68+(m.finishPosition??0)*5:m.zone==="TRACK"?relativeProgress(m):0),0); }
function exposedThreat(state: GameState, team: TeamId): number { const enemyOwners=teamOwners(state,team===0?1:0),ownOwners=teamOwners(state,team);let danger=0;for(const mine of state.marbles.filter(m=>ownOwners.includes(m.owner)&&m.zone==="TRACK"&&m.trackPosition!==null)){if(mine.trackPosition===BASE_POSITION[mine.owner])continue;for(const enemy of state.marbles.filter(m=>enemyOwners.includes(m.owner)&&m.zone==="TRACK"&&m.trackPosition!==null)){const d=(mine.trackPosition!-enemy.trackPosition!+TRACK_SIZE)%TRACK_SIZE;if(d>=1&&d<=13)danger+=14-d;}}return danger; }
function enemyArrivalThreat(state: GameState, team: TeamId): number { const enemy=(team===0?1:0) as TeamId; const owners=teamOwners(state,enemy); const finished=finishedCount(state,enemy); let t=finished*35; for(const m of state.marbles.filter(x=>owners.includes(x.owner)&&x.zone==="TRACK")){const p=relativeProgress(m); if(p>=58)t+=(p-57)*18; else if(p>=50)t+=(p-49)*5;} if(finished===7)t*=4; return t; }
function cardRank(state: GameState, player: PlayerId, move: LegalMove): CardRank | undefined { return state.players.find(p=>p.id===player)?.hand.find(c=>c.id===move.cardId)?.rank; }
function special(rank: CardRank|undefined){return rank==="4"||rank==="7"||rank==="J";}

/** Team-first AI: every move is valued only by its contribution to getting our eight marbles home before theirs. */
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
    const captures=homeCount(after,enemy)-before.enemyHome;
    const progressGain=teamProgress(after,team)-before.progress;
    const enemyProgressLoss=before.enemyProgress-teamProgress(after,enemy);
    const threatRemoved=before.threat-enemyArrivalThreat(after,team);
    const dangerRemoved=before.danger-exposedThreat(after,team);
    let score=evaluateState(after,player)*0.35;
    score+=ownFinishGain*260+captures*95+progressGain*4+enemyProgressLoss*5+threatRemoved*7+dangerRemoved*2;
    // Finishing one player's four is strategically valuable: the team then plays the remaining marbles with two hands.
    const owners=teamOwners(state,team);
    const beforeCompleted=owners.filter(o=>state.marbles.filter(m=>m.owner===o&&m.zone==="FINISH").length===4).length;
    const afterCompleted=owners.filter(o=>after.marbles.filter(m=>m.owner===o&&m.zone==="FINISH").length===4).length;
    score+=(afterCompleted-beforeCompleted)*220;
    if(move.type==="EXIT")score+=45;
    // 4/7/Jack are future tactical resources. Do not burn them merely because they are legal.
    const immediateBenefit=captures>0||ownFinishGain>0||threatRemoved>0||progressGain>=10||dangerRemoved>=5;
    if(hasOrdinaryAlternative&&!immediateBenefit){if(rank==="4")score-=85;if(rank==="7")score-=105;if(rank==="J")score-=100;}
    if(rank==="7"&&move.type==="SEVEN"&&move.parts.length>1)score+=12;
    // A Jack must improve the team race, not merely exchange two legal marbles.
    if(rank==="J"&&move.type==="JACK"){
      const target=state.marbles.find(m=>m.id===move.targetMarbleId);
      if(target&&state.players.find(p=>p.id===target.owner)!.team===enemy){
        const swing=enemyProgressLoss+progressGain;
        score+=swing*7;
        if(swing<=0)score-=160;
      }
    }
    // When the opponent is close to its eighth marble, defence becomes disproportionately important.
    if(before.finish<8&&finishedCount(state,enemy)>=6)score+=threatRemoved*10+captures*70;
    if(score>bestScore){bestScore=score;best=move;}
  }
  return best;
}
