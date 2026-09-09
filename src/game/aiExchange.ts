import { BASE_POSITION, TEAMMATE, TRACK_SIZE } from "./constants";
import type { Card, GameState, PlayerId } from "./types";
function rel(state:GameState,owner:PlayerId){return state.marbles.filter(m=>m.owner===owner).map(m=>m.zone==="FINISH"?64+(m.finishPosition??0):m.zone==="TRACK"&&m.trackPosition!==null?(m.trackPosition-BASE_POSITION[owner]+TRACK_SIZE)%TRACK_SIZE:-1);}
function finished(state:GameState,owner:PlayerId){return state.marbles.filter(m=>m.owner===owner&&m.zone==="FINISH").length;}
function home(state:GameState,owner:PlayerId){return state.marbles.filter(m=>m.owner===owner&&m.zone==="HOME").length;}
function nextPlayers(player:PlayerId):PlayerId[]{return [((player+1)%4) as PlayerId,((player+2)%4) as PlayerId,((player+3)%4) as PlayerId];}
function numeric(c:Card){return c.rank==="A"?1:c.rank==="Q"?12:c.rank==="K"?13:Number(c.rank);}
export function chooseBaselineExchange(state:GameState,player:PlayerId):string{
 const found=state.players.find(p=>p.id===player)?.hand;if(!found||found.length===0)throw new Error("No card available for exchange");const hand:Card[]=found;
 const partner=TEAMMATE[player],team=state.players.find(p=>p.id===player)!.team,enemyTeam=team===0?1:0;
 const ownHome=home(state,player),ownTrack=rel(state,player).filter(x=>x>=0&&x<64),partnerHome=home(state,partner),partnerFinish=finished(state,partner),partnerTrack=rel(state,partner).filter(x=>x>=0&&x<64);
 const exitCards=hand.filter(c=>c.rank==="A"||c.rank==="K");
 const enemies:PlayerId[]=state.players.filter(p=>p.team===enemyTeam).map(p=>p.id),enemyFinished=enemies.reduce<number>((s,o)=>s+finished(state,o),0),enemyNear=enemies.some(o=>rel(state,o).some(x=>x>=58&&x<64));
 const order=nextPlayers(player),firstEnemy=order.findIndex(p=>state.players.find(x=>x.id===p)!.team===enemyTeam),partnerIndex=order.indexOf(partner),partnerActsBeforeThreat=partnerIndex>=0&&(firstEnemy<0||partnerIndex<firstEnemy);
 function scoreGift(c:Card){
   let benefit=0,cost=0;
   if(partnerHome>0&&(c.rank==="A"||c.rank==="K"))benefit+=150;
   if(partnerFinish>=2&&c.rank==="7")benefit+=65;
   if(partnerTrack.some(x=>x===0)&&c.rank==="4")benefit+=50;
   for(const p of partnerTrack){const remaining=64-p,n=numeric(c);if(Number.isFinite(n))for(const kept of hand){if(kept.id===c.id)continue;const k=numeric(kept);if(Number.isFinite(k)&&n+k===remaining)benefit+=110;}}
   if(enemyFinished>=7&&enemyNear&&partnerActsBeforeThreat&&(c.rank==="J"||c.rank==="4"||c.rank==="7"))benefit+=500;
   // Never casually give away the only card that prevents our own forced discard.
   if(ownHome===4&&ownTrack.length===0&&(c.rank==="A"||c.rank==="K")){cost+=exitCards.length===1?1000:260;}
   if(ownHome>0&&exitCards.length===1&&(c.rank==="A"||c.rank==="K"))cost+=500;
   // Preserve tactical cards when we already have a live marble, unless partner has a concrete stronger use.
   if(ownTrack.length>0&&(c.rank==="7"||c.rank==="J"))cost+=70;
   if(ownTrack.length>0&&c.rank==="4")cost+=45;
   // If we are blocked without A/K, transferring a tactical card is preferable to wasting it in a likely discard.
   if(ownHome===4&&exitCards.length===0&&(c.rank==="4"||c.rank==="7"||c.rank==="J"))benefit+=75;
   // Small ordinary cards are the default gifts when they do not form a deliberate team combination.
   const n=numeric(c);if(Number.isFinite(n)&&c.rank!=="K"&&c.rank!=="Q")cost+=n*2;
   return benefit-cost;
 }
 return [...hand].sort((a,b)=>scoreGift(b)-scoreGift(a)||a.id.localeCompare(b.id))[0].id;
}
