import { describe, expect, it } from "vitest";
import { chooseStrategicMove } from "./aiStrategic";
import { createDeck } from "./deck";
import { getLegalMoves } from "./legalMoves";
import { createInitialGameState } from "./state";
function card(rank:string){return createDeck().find(c=>c.rank===rank)!;}
describe("strategic AI",()=>{
 it("always returns one of the engine legal moves",()=>{const state=createInitialGameState();state.currentPlayer=0;state.players[0].hand=[card("A"),card("K")];const legal=getLegalMoves(state,0).map(m=>JSON.stringify(m));expect(legal).toContain(JSON.stringify(chooseStrategicMove(state,0)));});
 it("refuses to act for a player who is not current",()=>{const state=createInitialGameState();state.currentPlayer=1;expect(()=>chooseStrategicMove(state,0)).toThrow();});
 it("makes the same decision when hidden opponent hands change",()=>{const a=createInitialGameState();a.currentPlayer=0;a.players[0].hand=[card("A"),card("K")];const b=structuredClone(a);a.players[1].hand=[card("2")];b.players[1].hand=[card("7")];expect(chooseStrategicMove(a,0)).toEqual(chooseStrategicMove(b,0));});
 it("takes the exact winning arrival when controlling the finished partner's last marble",()=>{const state=createInitialGameState();state.currentPlayer=2;state.players[2].hand=[card("A")];for(const m of state.marbles.filter(x=>x.owner===2)){m.zone="FINISH";m.trackPosition=null;m.finishPosition=Number(m.id.split("-")[1]);}const blue=state.marbles.filter(x=>x.owner===0);for(let i=0;i<3;i++){blue[i].zone="FINISH";blue[i].trackPosition=null;blue[i].finishPosition=i;}blue[3].zone="TRACK";blue[3].trackPosition=58;const move=chooseStrategicMove(state,2);expect(move.type).toBe("MOVE");if(move.type==="MOVE")expect(move.marbleId).toBe(blue[3].id);});
});
