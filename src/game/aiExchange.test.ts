import { describe, expect, it } from "vitest";
import { chooseBaselineExchange } from "./aiExchange";
import { createInitialGameState } from "./state";
import type { Card } from "./types";
const card=(id:string,rank:Card["rank"]):Card=>({id,rank,suit:"clubs"});
describe("strategic partner exchange",()=>{
 it("gives an exit card to an advanced partner when the giver is not sacrificing its only exit",()=>{const state=createInitialGameState();state.players[1].hand=[card("ace","A"),card("king","K"),card("two","2")];const pm=state.marbles.filter(m=>m.owner===3);pm[0].zone="FINISH";pm[0].finishPosition=3;pm[1].zone="FINISH";pm[1].finishPosition=2;expect(["ace","king"]).toContain(chooseBaselineExchange(state,1));});
 it("never gives away its sole King when all four marbles are home",()=>{const state=createInitialGameState();state.players[2].hand=[card("king","K"),card("two","2"),card("five","5"),card("eight","8")];expect(chooseBaselineExchange(state,2)).not.toBe("king");});
 it("never gives away its sole Ace when all four marbles are home",()=>{const state=createInitialGameState();state.players[2].hand=[card("ace","A"),card("three","3"),card("six","6"),card("nine","9")];expect(chooseBaselineExchange(state,2)).not.toBe("ace");});
 it("finished partner keeps its only exit card when the team's last shared marble is HOME",()=>{const state=createInitialGameState();for(const m of state.marbles.filter(x=>x.owner===2)){m.zone="FINISH";m.trackPosition=null;m.finishPosition=Number(m.id.split("-")[1]);}const blue=state.marbles.filter(x=>x.owner===0);for(let i=0;i<3;i++){blue[i].zone="FINISH";blue[i].trackPosition=null;blue[i].finishPosition=i;}state.players[2].hand=[card("king","K"),card("two","2"),card("five","5"),card("eight","8")];expect(chooseBaselineExchange(state,2)).not.toBe("king");});
 it("never needs to inspect the partner hand",()=>{const state=createInitialGameState();state.players[1].hand=[card("three","3"),card("king","K")];const first=chooseBaselineExchange(state,1);state.players[3].hand=[card("hidden-a","A"),card("hidden-7","7"),card("hidden-j","J")];expect(chooseBaselineExchange(state,1)).toBe(first);});
});
