import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createInitialGameState } from "./game/state";
import { createMachineGame, submitHumanExchange, advanceMachines, type MachineGame } from "./game/machineGame";
import type { Card } from "./game/types";
import "./ui.css";

const suits: Record<string,string> = { clubs:"♣", diamonds:"♦", hearts:"♥", spades:"♠" };
function PlayingCard({card,onClick,selected}:{card:Card;onClick?:()=>void;selected?:boolean}) {
  const red = card.suit === "diamonds" || card.suit === "hearts";
  return <button className={`card ${red?"red":""} ${selected?"selected":""}`} onClick={onClick}><b>{card.rank}</b><span>{suits[card.suit]}</span></button>;
}
function Board(){
  const holes=useMemo(()=>Array.from({length:64},(_,i)=>i),[]);
  return <div className="board"><div className="logo">TOC<span>♠</span></div>{holes.map((i)=>{const a=(i/64)*Math.PI*2-Math.PI/2;const x=50+43*Math.cos(a),y=50+43*Math.sin(a);return <i key={i} className="hole" style={{left:`${x}%`,top:`${y}%`}}/>})}<div className="finish f0">● ● ● ●</div><div className="finish f1">● ● ● ●</div><div className="finish f2">● ● ● ●</div><div className="finish f3">● ● ● ●</div></div>;
}
function App(){
  const [game,setGame]=useState<MachineGame>(()=>createMachineGame(createInitialGameState(),0));
  const [mode,setMode]=useState("NORMAL");
  const human=game.state.players.find(p=>p.id===0)!;
  function exchange(id:string){ let g=submitHumanExchange(game,id); g=advanceMachines(g); setGame(g); }
  return <main><header><div><strong>TOC</strong><small>contre la machine</small></div><select value={mode} onChange={e=>setMode(e.target.value)}><option value="EASY">Facile</option><option value="NORMAL">Normal</option><option value="EXPERT">Expert</option></select></header><section className="table"><div className="opponent top">Machine 2 <span>{game.state.players[2].hand.length} cartes</span></div><div className="opponent left">Machine 1 <span>{game.state.players[1].hand.length}</span></div><Board/><div className="opponent right">Machine 3 <span>{game.state.players[3].hand.length}</span></div></section><section className="status">{game.phase==="EXCHANGE"?"Choisissez une carte à donner à votre partenaire":game.phase==="HUMAN_TURN"?"À vous de jouer":game.phase==="GAME_OVER"?"Partie terminée":"Les machines jouent…"}</section><section className="hand">{human.hand.map(c=><PlayingCard key={c.id} card={c} onClick={game.phase==="EXCHANGE"?()=>exchange(c.id):undefined}/>)}</section><footer>Vous êtes Rouge · votre partenaire est en face</footer></main>;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
