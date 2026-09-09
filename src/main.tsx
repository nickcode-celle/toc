import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createInitialGameState } from "./game/state";
import { createMachineGame, submitHumanExchange, submitHumanMove, submitHumanDiscard, advanceMachines, type MachineGame } from "./game/machineGame";
import { getLegalMoves, type LegalMove } from "./game/legalMoves";
import { forwardDestination } from "./game/movement";
import { simulateSevenPrefix } from "./game/sevenSimulation";
import { BASE_POSITION, TRACK_SIZE } from "./game/constants";
import type { SevenPart } from "./game/specialMoves";
import type { Card, Marble, PlayerId } from "./game/types";
import "./ui.css";

const suits: Record<string,string> = { clubs:"♣", diamonds:"♦", hearts:"♥", spades:"♠" };
const playerClass: Record<PlayerId,string> = {0:"p0",1:"p1",2:"p2",3:"p3"};
function PlayingCard({card,onClick,selected,playable}:{card:Card;onClick?:()=>void;selected?:boolean;playable?:boolean}) {
  const red = card.suit === "diamonds" || card.suit === "hearts";
  return <button className={`card ${red?"red":""} ${selected?"selected":""} ${playable?"playable":""}`} onClick={onClick}><b>{card.rank}</b><span>{suits[card.suit]}</span></button>;
}
function trackXY(pos:number){ const a=(pos/TRACK_SIZE)*Math.PI*2-Math.PI/2; return {x:50+43*Math.cos(a),y:50+43*Math.sin(a)}; }
function finishXY(owner:PlayerId,pos:number){ const angle=(BASE_POSITION[owner]/TRACK_SIZE)*Math.PI*2-Math.PI/2; const r=31-pos*6.3; return {x:50+r*Math.cos(angle),y:50+r*Math.sin(angle)}; }
function marbleXY(m:Marble,index:number){
  if(m.zone==="TRACK" && m.trackPosition!==null) return trackXY(m.trackPosition);
  if(m.zone==="FINISH" && m.finishPosition!==null) return finishXY(m.owner,m.finishPosition);
  const anchors:Record<PlayerId,{x:number,y:number}>={0:{x:50,y:88},1:{x:12,y:50},2:{x:50,y:12},3:{x:88,y:50}};
  const base=anchors[m.owner],dx=[-4,4,-4,4][index%4],dy=[-4,-4,4,4][index%4]; return {x:base.x+dx,y:base.y+dy};
}
function destinationForMove(state:MachineGame["state"],move:LegalMove){
  if(move.type==="EXIT"){const m=state.marbles.find(x=>x.id===move.marbleId)!;return trackXY(BASE_POSITION[m.owner]);}
  if(move.type==="MOVE"){const m=state.marbles.find(x=>x.id===move.marbleId)!;const d=forwardDestination(m,move.steps);if(!d)return null;return d.zone==="TRACK"?trackXY(d.trackPosition):finishXY(m.owner,d.finishPosition);}
  if(move.type==="FOUR"){const m=state.marbles.find(x=>x.id===move.marbleId)!;return trackXY(((m.trackPosition??0)-4+TRACK_SIZE)%TRACK_SIZE);}
  return null;
}
function prefixMatches(parts:SevenPart[],prefix:SevenPart[]){return prefix.every((p,i)=>parts[i]?.marbleId===p.marbleId&&parts[i]?.steps===p.steps);}
function Board({game,displayState,selectedCardId,selectedMarbleId,onMarble,onDestination,onSevenStep,mode,sevenPrefix}:{game:MachineGame;displayState:MachineGame["state"];selectedCardId:string|null;selectedMarbleId:string|null;onMarble:(id:string)=>void;onDestination:(m:LegalMove)=>void;onSevenStep:(part:SevenPart)=>void;mode:string;sevenPrefix:SevenPart[]}){
  const holes=useMemo(()=>Array.from({length:64},(_,i)=>i),[]);
  const legal=getLegalMoves(game.state).filter(m=>!selectedCardId||m.cardId===selectedCardId);
  const sevenPlans=legal.filter((m):m is Extract<LegalMove,{type:"SEVEN"}>=>m.type==="SEVEN"&&prefixMatches(m.parts,sevenPrefix));
  const nextSevenParts=sevenPlans.map(m=>m.parts[sevenPrefix.length]).filter((p):p is SevenPart=>!!p);
  const controlled=new Set(legal.flatMap(m=>m.type==="SEVEN"?nextSevenParts.map(p=>p.marbleId):m.type==="JACK"?[m.marbleId,m.targetMarbleId]:[m.marbleId]));
  const standardDestinations=selectedMarbleId?legal.filter(m=>m.type!=="JACK"&&m.type!=="SEVEN"&&m.marbleId===selectedMarbleId).map(m=>({move:m,xy:destinationForMove(displayState,m)})).filter(x=>x.xy):[];
  const sevenDestinations=selectedMarbleId?[...new Map(nextSevenParts.filter(p=>p.marbleId===selectedMarbleId).map(p=>[p.steps,p])).values()].map(part=>{const m=displayState.marbles.find(x=>x.id===part.marbleId);if(!m)return null;const d=forwardDestination(m,part.steps);if(!d)return null;return {part,xy:d.zone==="TRACK"?trackXY(d.trackPosition):finishXY(m.owner,d.finishPosition)};}).filter((x):x is {part:SevenPart;xy:{x:number;y:number}}=>!!x):[];
  const selectedCard=game.state.players[0].hand.find(c=>c.id===selectedCardId);
  return <div className="board"><div className="logo">TOC<span>♠</span></div>{holes.map(i=>{const p=trackXY(i);return <i key={i} className="hole" style={{left:`${p.x}%`,top:`${p.y}%`}}/>})}
    {[0,1,2,3].flatMap(o=>[0,1,2,3].map(p=>{const q=finishXY(o as PlayerId,p);return <i key={`f${o}-${p}`} className={`hole finish-hole ${playerClass[o as PlayerId]}`} style={{left:`${q.x}%`,top:`${q.y}%`}}/>}))}
    {displayState.marbles.map((m,i)=>{const p=marbleXY(m,i);const can=game.phase==="HUMAN_TURN"&&controlled.has(m.id);return <button key={m.id} aria-label={m.id} className={`marble ${playerClass[m.owner]} ${selectedMarbleId===m.id?"selected-marble":""} ${mode==="EASY"&&can?"can-play":""}`} style={{left:`${p.x}%`,top:`${p.y}%`}} onClick={()=>can&&onMarble(m.id)}/>})}
    {standardDestinations.map(({move,xy},i)=><button key={`d${i}`} className={`destination ${mode==="EXPERT"?"invisible-destination":""}`} style={{left:`${xy!.x}%`,top:`${xy!.y}%`}} onClick={()=>onDestination(move)} />)}
    {sevenDestinations.map(({part,xy},i)=><button key={`s${i}`} className={`destination ${mode==="EASY"?"":"invisible-destination"}`} style={{left:`${xy.x}%`,top:`${xy.y}%`}} onClick={()=>onSevenStep(part)} />)}
    {selectedCard?.rank==="7"&&mode!=="EXPERT"&&<div className="seven-counter">7 : {7-sevenPrefix.reduce((s,p)=>s+p.steps,0)} points</div>}
  </div>;
}
function App(){
  const [game,setGame]=useState<MachineGame>(()=>createMachineGame(createInitialGameState(),0));
  const [mode,setMode]=useState("NORMAL");
  const [selectedCardId,setSelectedCardId]=useState<string|null>(null); const [selectedMarbleId,setSelectedMarbleId]=useState<string|null>(null); const [jackSource,setJackSource]=useState<string|null>(null); const [sevenPrefix,setSevenPrefix]=useState<SevenPart[]>([]);
  const human=game.state.players.find(p=>p.id===0)!; const legal=getLegalMoves(game.state); const playableCards=new Set(legal.map(m=>m.cardId));
  const previewState=sevenPrefix.length?simulateSevenPrefix(game.state,game.humanPlayer,sevenPrefix)??game.state:game.state;
  function resetSelection(){setSelectedCardId(null);setSelectedMarbleId(null);setJackSource(null);setSevenPrefix([]);}
  function settle(g:MachineGame){ g=advanceMachines(g); setGame(g); resetSelection(); }
  function exchange(id:string){ settle(submitHumanExchange(game,id)); }
  function chooseCard(id:string){ if(game.phase!=="HUMAN_TURN")return; setSelectedCardId(id);setSelectedMarbleId(null);setJackSource(null);setSevenPrefix([]); }
  function chooseMarble(id:string){
    if(!selectedCardId)return; const moves=legal.filter(m=>m.cardId===selectedCardId); const card=human.hand.find(c=>c.id===selectedCardId);
    if(card?.rank==="J"){
      if(!jackSource){ if(moves.some(m=>m.type==="JACK"&&m.marbleId===id)){setJackSource(id);setSelectedMarbleId(id);} return; }
      const move=moves.find(m=>m.type==="JACK"&&m.marbleId===jackSource&&m.targetMarbleId===id); if(move)settle(submitHumanMove(game,move)); return;
    }
    if(card?.rank==="7"){
      const plans=moves.filter((m):m is Extract<LegalMove,{type:"SEVEN"}>=>m.type==="SEVEN"&&prefixMatches(m.parts,sevenPrefix));
      if(plans.some(p=>p.parts[sevenPrefix.length]?.marbleId===id))setSelectedMarbleId(id); return;
    }
    const matching=moves.filter(m=>m.type!=="JACK"&&m.type!=="SEVEN"&&m.marbleId===id); if(matching.length===1)settle(submitHumanMove(game,matching[0])); else setSelectedMarbleId(id);
  }
  function playDestination(move:LegalMove){ settle(submitHumanMove(game,move)); }
  function playSevenStep(part:SevenPart){
    if(!selectedCardId)return; const next=[...sevenPrefix,part]; const plans=legal.filter((m):m is Extract<LegalMove,{type:"SEVEN"}>=>m.type==="SEVEN"&&m.cardId===selectedCardId&&prefixMatches(m.parts,next));
    const used=next.reduce((s,p)=>s+p.steps,0); if(used===7){const exact=plans.find(p=>p.parts.length===next.length);if(exact)settle(submitHumanMove(game,exact));return;} setSevenPrefix(next);setSelectedMarbleId(null);
  }
  function discard(){ if(game.phase==="HUMAN_TURN"&&legal.length===0&&human.hand.length) settle(submitHumanDiscard(game,human.hand[human.hand.length-1].id)); }
  return <main><header><div><strong>TOC</strong><small>contre la machine</small></div><select value={mode} onChange={e=>setMode(e.target.value)}><option value="EASY">Facile</option><option value="NORMAL">Normal</option><option value="EXPERT">Expert</option></select></header><section className="table"><div className="opponent top">Machine 2 <span>{game.state.players[2].hand.length} cartes</span></div><div className="opponent left">Machine 1 <span>{game.state.players[1].hand.length}</span></div><Board game={game} displayState={previewState} selectedCardId={selectedCardId} selectedMarbleId={selectedMarbleId} onMarble={chooseMarble} onDestination={playDestination} onSevenStep={playSevenStep} mode={mode} sevenPrefix={sevenPrefix}/><div className="opponent right">Machine 3 <span>{game.state.players[3].hand.length}</span></div></section><section className="status">{game.phase==="EXCHANGE"?"Choisissez une carte à donner à votre partenaire":game.phase==="HUMAN_TURN"?legal.length?"À vous de jouer":"Aucun coup possible : défaussez votre main":game.phase==="GAME_OVER"?`Partie terminée · équipe ${game.state.winner===0?"Rouge / Bleu":"Verte / Jaune"} gagnante`:"Les machines jouent…"}</section><section className="hand">{human.hand.map(c=><PlayingCard key={c.id} card={c} selected={selectedCardId===c.id} playable={mode==="EASY"&&playableCards.has(c.id)} onClick={game.phase==="EXCHANGE"?()=>exchange(c.id):game.phase==="HUMAN_TURN"?()=>chooseCard(c.id):undefined}/>)}</section>{game.phase==="HUMAN_TURN"&&legal.length===0&&human.hand.length>0&&<button className="discard" onClick={discard}>Défausser la main</button>}<footer>Vous êtes Rouge · votre partenaire est en face</footer></main>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
