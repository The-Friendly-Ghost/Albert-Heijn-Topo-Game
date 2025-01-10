"use strict";

import { Game } from "../game/game.js";
import { Player } from "../player/player.js";
import { Music } from "../game/music.js";

export class App {
  #game;
  #player;
  #music;

  constructor() {
    this.elements = {
      overlayEl: document.getElementById("overlay-section"),
      startBtn: document.getElementById("startBtn"),
      gameEl: document.getElementById("map"),
      endEl: document.getElementById("end-section"),
    };
    this.#music = new Music();

    this.init();
  }

  async init() {
    this.resetApp();
    this.setupStartEventListener();
  }

  resetApp() {
    this.showWelcome();
    this.#player = new Player();
    this.#game = new Game();
    this.#music.stopMusic();
  }

  setupStartEventListener() {
    this.elements.startBtn.addEventListener("click", (e) => {
      if (e.target.closest("#startBtn")) {
        this.showGame();
        this.#game.startRound();
      }
    });
  }

  startGame() {
    this.elements.this.#game.startRound();
  }

  showWelcome() {
    this.show(this.elements.overlayEl);
    this.show(this.elements.gameEl);
    this.hide(this.elements.endEl);
  }

  showGame() {
    this.hide(this.elements.overlayEl);
    this.show(this.elements.gameEl);
    this.hide(this.elements.endEl);
  }

  showEnd() {
    this.hide(this.elements.overlayEl);
    this.show(this.elements.gameEl);
    this.show(this.elements.endEl);
  }

  show(el) {
    el.classList.remove("hidden");
  }

  hide(el) {
    el.classList.add("hidden");
  }
}
