import { describe, expect, it } from "vitest";
import { createInitialGameState } from "./state";
import { advanceMachines, createMachineGame, submitHumanDiscard, submitHumanExchange, submitHumanMove } from "./machineGame";
import { getLegalMoves } from "./legalMoves";
import { createDeck } from "./deck";

describe("machine game controller", () => {
  it("starts with the mandatory simultaneous exchange", () => { const game=createMachineGame(createInitialGameState(),0);expect(game.phase).toBe("EXCHANGE");expect(game.state.players.every(p=>p.hand.length===5)).toBe(true); });
  it("accepts the human exchange and keeps every hand at five cards", () => { let game=createMachineGame(createInitialGameState(),0);game=submitHumanExchange(game,game.state.players[0].hand[0].id);expect(game.state.players.every(p=>p.hand.length===5)).toBe(true);expect(game.phase==="HUMAN_TURN"||game.phase==="MACHINE_TURN").toBe(true); });
  it("can advance machine turns until human action or another phase is required", () => { let game=createMachineGame(createInitialGameState(),0);game=submitHumanExchange(game,game.state.players[0].hand[0].id);if(game.phase==="MACHINE_TURN")game=advanceMachines(game);expect(["HUMAN_TURN","EXCHANGE","GAME_OVER"]).toContain(game.phase); });
  it("automatically deals the next hand after the last card is played", () => {
    let game=createMachineGame(createInitialGameState(),0);game=submitHumanExchange(game,game.state.players[0].hand[0].id);
    const two=createDeck().find(c=>c.rank==="2")!;
    const marbles=game.state.marbles.map(m=>m.owner===0&&m.id===game.state.marbles.find(x=>x.owner===0)!.id?{...m,zone:"TRACK" as const,trackPosition:0,finishPosition:null}:m);
    game={...game,phase:"HUMAN_TURN",state:{...game.state,marbles,currentPlayer:0,dealNumber:0,players:game.state.players.map(p=>p.id===0?{...p,hand:[two],hasDiscardedHand:false}:{...p,hand:[],hasDiscardedHand:false})}};
    const move=getLegalMoves(game.state,0)[0];expect(move).toBeTruthy();game=submitHumanMove(game,move);expect(game.phase).toBe("EXCHANGE");expect(game.state.dealNumber).toBe(1);expect(game.state.players.every(p=>p.hand.length===4)).toBe(true);
  });
  it("survives beyond a complete 52-card 5-4-4 cycle", () => {
    let game=createMachineGame(createInitialGameState(),0);let exchanges=0,guard=0;
    while(exchanges<4&&game.phase!=="GAME_OVER"&&guard++<500){
      if(game.phase==="EXCHANGE"){game=submitHumanExchange(game,game.state.players[0].hand[0].id);exchanges++;continue;}
      if(game.phase==="MACHINE_TURN"){game=advanceMachines(game,20);continue;}
      const legal=getLegalMoves(game.state,0);
      game=legal.length?submitHumanMove(game,legal[0]):submitHumanDiscard(game,game.state.players[0].hand.at(-1)?.id);
    }
    expect(exchanges).toBeGreaterThanOrEqual(4);
    expect(game.state.players.reduce((n,p)=>n+p.hand.length,0)+game.state.deck.length+game.state.discardPile.length).toBe(52);
    expect(["EXCHANGE","HUMAN_TURN","MACHINE_TURN","GAME_OVER"]).toContain(game.phase);
  });
});
