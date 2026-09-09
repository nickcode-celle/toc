import { describe, expect, it } from "vitest";
import { forwardDestination } from "./movement";
import { checkNormalForwardMove } from "./rules";
import { checkBackwardFour, controlledOwner } from "./specialMoves";
import { createInitialGameState } from "./state";
import type { Marble, PlayerId } from "./types";
function marble(position:number,owner:PlayerId=0):Marble{return{id:`${owner}-0`,owner,zone:"TRACK",trackPosition:position,finishPosition:null};}
describe("arrival entry on the physical 15-position colour sectors",()=>{
 it("own case 12 plus 1 stays on own case 13",()=>{expect(forwardDestination(marble(57),1)).toEqual({zone:"TRACK",trackPosition:58});});
 it("own case 12 plus 2 enters arrival position 1",()=>{expect(forwardDestination(marble(57),2)).toEqual({zone:"FINISH",finishPosition:0});});
 it("own case 13 plus 1 enters arrival position 1",()=>{expect(forwardDestination(marble(58),1)).toEqual({zone:"FINISH",finishPosition:0});});
 it("each colour has its own case 13 gate",()=>{expect(forwardDestination(marble(13,1),1)).toEqual({zone:"FINISH",finishPosition:0});expect(forwardDestination(marble(28,2),1)).toEqual({zone:"FINISH",finishPosition:0});expect(forwardDestination(marble(43,3),1)).toEqual({zone:"FINISH",finishPosition:0});});
 it("uses the marble owner gate even when a finished partner controls it",()=>{const state=createInitialGameState();for(const m of state.marbles.filter(x=>x.owner===2)){m.zone="FINISH";m.trackPosition=null;m.finishPosition=Number(m.id.split("-")[1]);}const blue=state.marbles.find(x=>x.id==="0-0")!;blue.zone="TRACK";blue.trackPosition=58;expect(controlledOwner(state,2)).toBe(0);expect(forwardDestination(blue,1)).toEqual({zone:"FINISH",finishPosition:0});});
 it("case 13 belonging to another colour does not open this player's arrival",()=>{expect(forwardDestination(marble(13),1)).toEqual({zone:"TRACK",trackPosition:14});});
 it("own case 14 has passed the arrival branch",()=>{expect(forwardDestination(marble(59),1)).toEqual({zone:"TRACK",trackPosition:0});});
 it("arrival marble cannot overflow back to circuit",()=>{const m:Marble={...marble(58),zone:"FINISH",trackPosition:null,finishPosition:2};expect(forwardDestination(m,2)).toBeNull();});
 it("a marble in arrival blocks entry and cannot be jumped",()=>{const state=createInitialGameState(),m=state.marbles.find(x=>x.id==="0-0")!,blocker=state.marbles.find(x=>x.id==="0-1")!;m.zone="TRACK";m.trackPosition=58;blocker.zone="FINISH";blocker.trackPosition=null;blocker.finishPosition=1;expect(checkNormalForwardMove(state,m,3).legal).toBe(false);});
});
describe("bases",()=>{it("a base is case 15 and a move counts from the next hole without an extra step",()=>{expect(forwardDestination(marble(0),2)).toEqual({zone:"TRACK",trackPosition:2});expect(forwardDestination(marble(15,1),3)).toEqual({zone:"TRACK",trackPosition:18});});it("a four from own base is legal and lands four behind",()=>{const state=createInitialGameState(),m=state.marbles.find(x=>x.id==="0-0")!;m.zone="TRACK";m.trackPosition=0;expect(checkBackwardFour(state,m).legal).toBe(true);});it("a normal move cannot end on any base even when empty",()=>{const state=createInitialGameState(),m=state.marbles.find(x=>x.id==="0-0")!;m.zone="TRACK";m.trackPosition=14;expect(checkNormalForwardMove(state,m,1).legal).toBe(false);});});
