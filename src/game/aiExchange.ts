import { BASE_POSITION, FINISH_GATE_LOCAL_POSITION, TEAMMATE, TRACK_SIZE } from "./constants";
import type { Card, GameState, PlayerId } from "./types";
function rel(state:GameState,owner:PlayerId){return state.marbles.filter(m=>m.owner===owner).map(m=>m.zone==="FINISH"?TRACK_SIZE+(m.finishPosition??0):m.zone==="TRACK"&&m.trackPosition!==null?(m.trackPosition-BASE_POSITION[owner]+TRACK_SIZE)%TRACK_SIZE:-1);}
function finished(state:GameState,owner:PlayerId){return state.marbles.filter(m=>m.owner===owner&&m.zone==="FINISH").length;}
function home(state:GameState,owner:PlayerId){return state.marbles.filter(m=>m.owner===owner&&m.zone==="HOME").length;}
function nextPlayers(player:PlayerId):PlayerId[]{return[((player+1)%4) as PlayerId,((player+2)%4) as PlayerId,((player+3)%4) as PlayerId];}
function numeric(c:Card){return c.rank==="A"?1:c.rank==="Q"?12:c.rank==="K"?13:Number(c.rank);}
export function chooseBaselineExchange(state:GameState,player:PlayerId):string{
 const found=state.players.find(p=>p.id===player)?.hand;if(!found?.length)throw new Error("No card available for exchange");const hand:Card[]=found,partner=TEAMMATE[player],team=state.players.find(p=>p.id===player)!.team,enemyTeam=team===0?1:0;
 const ownFinished=finished(state,player),ownHome=home(state,player),ownTrack=rel(state,player).filter(x=>x>=0&&x<TRACK_SIZE),partnerHome=home(state,partner),partnerFinish=finished(state,partner),partnerTrack=rel(state,partner).filter(x=>x>=0&&x<TRACK_SIZE),exitCards=hand.filter(c=>c.rank==="A"||c.rank==="K");
 const controlled=ownFinished===4?partner:player,controlledHome=home(state,controlled),controlledTrack=rel(state,controlled).filter(x=>x>=0&&x<TRACK_SIZE);
 const enemies:PlayerId[]=state.players.filter(p=>p.team===enemyTeam).map(p=>p.id),enemyFinished=enemies.reduce((s,o)=>s+finished(state,o),0),enemyNear=enemies.some(o=>rel(state,o).some(x=>x>=FINISH_GATE_LOCAL_POSITION-3&&x<TRACK_SIZE));const order=nextPlayers(player),firstEnemy=order.findIndex(p=>state.players.find(x=>x.id===p)!.team===enemyTeam),partnerIndex=order.indexOf(partner),partnerActsBeforeThreat=partnerIndex>=0&&(firstEnemy<0||partnerIndex<firstEnemy);
 function scoreGift(c:Card){let benefit=0,cost=0;if(partnerHome>0&&(c.rank==="A"||c.rank==="K"))benefit+=150+(partnerFinish>=2?220:0);if(partnerFinish>=2&&c.rank==="7")benefit+=65;if(partnerTrack.some(x=>x===0)&&c.rank==="4")benefit+=50;for(const p of partnerTrack){const remaining=FINISH_GATE_LOCAL_POSITION+1-p,n=numeric(c);if(Number.isFinite(n))for(const kept of hand){if(kept.id===c.id)continue;const k=numeric(kept);if(Number.isFinite(k)&&n+k===remaining)benefit+=110;}}if(enemyFinished>=7&&enemyNear&&partnerActsBeforeThreat&&(c.rank==="J"||c.rank==="4"||c.rank==="7"))benefit+=500;
   // The hand that currently controls the team's remaining HOME marble must retain its sole A/K.
   // This includes the two-hands phase: a finished player may be the only teammate able to exit the last shared marble before partner's turn.
   if(controlledHome>0&&controlledTrack.length===0&&exitCards.length===1&&(c.rank==="A"||c.rank==="K"))cost+=5000;
   if(ownHome>0&&exitCards.length===1&&(c.rank==="A"||c.rank==="K"))cost+=1000;
   if(ownTrack.length>0&&(c.rank==="7"||c.rank==="J"))cost+=70;if(ownTrack.length>0&&c.rank==="4")cost+=45;if(ownHome===4&&exitCards.length===0&&(c.rank==="4"||c.rank==="7"||c.rank==="J"))benefit+=75;const n=numeric(c);if(Number.isFinite(n)&&c.rank!=="K"&&c.rank!=="Q")cost+=n*2;return benefit-cost;}
 return[...hand].sort((a,b)=>scoreGift(b)-scoreGift(a)||a.id.localeCompare(b.id))[0].id;
}
