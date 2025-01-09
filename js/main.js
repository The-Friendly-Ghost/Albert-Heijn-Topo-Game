"use strict";
import { App } from "./app/app.js";
import { Game } from "./game/game.js";

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  const game = new Game();
  game.init().catch(console.error);
});
