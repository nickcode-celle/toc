import { describe, expect, it } from "vitest";
import { createInitialGameState } from "./state";
import { advanceMachines, createMachineGame, submitHumanExchange } from "./machineGame";

describe("machine game controller", () => {
  it("starts with the mandatory simultaneous exchange", () => {
    const game = createMachineGame(createInitialGameState(), 0);
    expect(game.phase).toBe("EXCHANGE");
    expect(game.state.players.every((p) => p.hand.length === 5)).toBe(true);
  });

  it("accepts the human exchange and keeps every hand at five cards", () => {
    let game = createMachineGame(createInitialGameState(), 0);
    const cardId = game.state.players[0].hand[0].id;
    game = submitHumanExchange(game, cardId);
    expect(game.state.players.every((p) => p.hand.length === 5)).toBe(true);
    expect(game.phase === "HUMAN_TURN" || game.phase === "MACHINE_TURN").toBe(true);
  });

  it("can advance machine turns until human action or another phase is required", () => {
    let game = createMachineGame(createInitialGameState(), 0);
    game = submitHumanExchange(game, game.state.players[0].hand[0].id);
    if (game.phase === "MACHINE_TURN") game = advanceMachines(game);
    expect(["HUMAN_TURN", "EXCHANGE", "GAME_OVER"]).toContain(game.phase);
  });
});
