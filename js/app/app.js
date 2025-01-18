"use strict";

// import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../supabaseConfig.js";
const supabaseUrl = window.__env__.SUPABASE_URL;  
const supabaseKey = window.__env__.SUPABASE_ANON_KEY;
import { Game } from "../game/game.js";
import { Player } from "../player/player.js";
import { Music } from "../game/music.js";

export class App {
  #game;
  #player;
  #music;
  #boundHandleGameEnd;
  #boundHandleStart;
  #boundHandlePlayAgain;
  #sb;

  constructor() {
    this.elements = {
      overlayEl: document.getElementById("overlay-section"),
      startEl: document.getElementById("start-section"),
      endEl: document.getElementById("end-section"),
      startBtn: document.getElementById("start-btn"),
      againBtn: document.getElementById("again-btn"),
    };
    this.#music = new Music();

    this.#boundHandleGameEnd = this.handleGameEnd.bind(this);
    this.#boundHandleStart = this.handleStart.bind(this);
    this.#boundHandlePlayAgain = this.handlePlayAgain.bind(this);

    this.#sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    this.init();
  }

  async init() {
    this.resetApp();
  }

  resetApp() {
    this.hide(this.elements.startBtn);
    this.cleanupEventListeners();
    if (this.#game) {
      this.#game.destroy();
    }
    this.#game = new Game();
    this.setupEventListeners();
    this.showWelcome();
    this.#music.stopMusic();
  }

  setupEventListeners() {
    this.elements.startBtn.addEventListener("click", this.#boundHandleStart);
    this.elements.againBtn.addEventListener(
      "click",
      this.#boundHandlePlayAgain
    );
    document.addEventListener("gameEnd", this.#boundHandleGameEnd);
  }

  cleanupEventListeners() {
    this.elements.startBtn.removeEventListener("click", this.#boundHandleStart);
    this.elements.againBtn.removeEventListener(
      "click",
      this.#boundHandlePlayAgain
    );
    document.removeEventListener("gameEnd", this.#boundHandleGameEnd);
  }

  handleStart(e) {
    if (e.target.closest("#start-btn")) {
      this.showGame();
      this.#game.startRound();
    }
  }

  handlePlayAgain(e) {
    if (e.target.closest("#again-btn")) {
      this.resetApp();
    }
  }

  handleGameEnd() {
    this.#player = new Player(this.#sb, this.#game.state.score);
    this.#player.score = this.#game.state.score;
    this.showEnd();
    this.#music.stopMusic();
  }

  showWelcome() {
    this.show(this.elements.overlayEl);
    this.show(this.elements.startEl);
    this.hide(this.elements.endEl);
  }

  showGame() {
    this.hide(this.elements.overlayEl);
    this.hide(this.elements.startEl);
    this.hide(this.elements.endEl);
  }

  showEnd() {
    this.show(this.elements.overlayEl);
    this.hide(this.elements.startEl);
    this.show(this.elements.endEl);
  }

  show(el) {
    el.classList.remove("hidden");
  }

  hide(el) {
    el.classList.add("hidden");
  }
}
