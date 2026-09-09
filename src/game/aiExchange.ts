import { BASE_POSITION, TEAMMATE, TRACK_SIZE } from "./constants";
import type { Card, GameState, PlayerId } from "./types";

function rel(state:GameState,owner:PlayerId){return state.marbles.filter(m=>m.owner===owner).map(m=>m.zone==="FINISH"?64+(m.finishPosition??0):m.zone==="TRACK"&&m.trackPosition!==null?(m.trackPosition-BASE_POSITION[owner]+TRACK_SIZE)%TRACK_SIZE:-1);}
function finished(state:GameState,owner:PlayerId){return state.marbles.filter(m=>m.owner===owner&&m.zone==="FINISH").length;}
function home(state:GameState,owner:PlayerId){return state.marbles.filter(m=>m.owner===owner&&m.zone==="HOME").length;}
function rankValue(c:Card){return ({A:95,K:100,J:88,"7":92,"4":82,Q:60,"10":55,"9":50,"8":48,"6":42,"5":38,"3":28,"2":24} as Record<string,number>)[c.rank];}
function nextPlayers(player:PlayerId){return [((player+1)%4) as PlayerId,((player+2)%4) as PlayerId,((player+3)%4) as PlayerId];}

/** Choose the card whose value is greatest to the team, not merely the least useful card in our hand. */
export function chooseBaselineExchange(state:GameState,player:PlayerId):string{
 const hand=state.players.find(p=>p.id===player)?.hand;if(!hand?.length)throw new Error("No card available for exchange");
 const partner=TEAMMATE[player]; const team=state.players.find(p=>p.id===player)!.team; const enemyTeam=team===0?1:0;
 const ph=home(state,partner),pf=finished(state,partner),oh=home(state,player); const pp=rel(state,partner); const partnerTrack=pp.filter(x=>x>=0&&x<64);
 const enemies=state.players.filter(p=>p.team===enemyTeam).map(p=>p.id); const enemyFinished=enemies.reduce((s,o)=>s+finished(state,o),0);
 const enemyNear=enemies.some(o=>rel(state,o).some(x=>x>=58&&x<64));
 const partnerActsBeforeThreat=nextPlayers(player).indexOf(partner)<=nextPlayers(player).findIndex(p=>state.players.find(x=>x.id===p)!.team===enemyTeam);
 function gift(c:Card){
   let v=rankValue(c);
   if(ph>0&&(c.rank==="A"||c.rank==="K"))v+=130;
   if(pf>=2&&c.rank==="7")v+=70;
   if(partnerTrack.some(x=>x===0)&&c.rank==="4")v+=55; // base -> backward four can prepare a later arrival sequence
   // Exact/complementary arrival planning: small cards can be deliberate signals when they combine with cards we retain.
   for(const p of partnerTrack){const remaining=64-p; const n=Number(c.rank); if(Number.isFinite(n)){for(const kept of hand){if(kept.id===c.id)continue;const k=kept.rank==="Q"?12:kept.rank==="K"?13:kept.rank==="A"?1:Number(kept.rank);if(Number.isFinite(k)&&n+k===remaining)v+=110;}}}
   // Imminent enemy victory: pass any usable defensive resource to a partner who acts before the threat.
   if(enemyFinished>=7&&enemyNear&&partnerActsBeforeThreat&&(c.rank==="J"||c.rank==="4"||c.rank==="7"))v+=350;
   // If our own hand is likely to be stranded, transfer scarce tactical value instead of wasting it in a future full-hand discard.
   if(oh===4&&!hand.some(x=>x.rank==="A"||x.rank==="K")&&(c.rank==="4"||c.rank==="7"||c.rank==="J"))v+=60;
   return v;
 }
 return [...hand].sort((a,b)=>gift(b)-gift(a)||a.id.localeCompare(b.id))[0].id;
}
