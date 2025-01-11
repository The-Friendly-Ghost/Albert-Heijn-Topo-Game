"use strict";

export class Music {
  constructor() {
    this.audio = new Audio("../../media/ah_song.m4a");
    this.elements = {
      parent: document.getElementById("music"),
      play: document.getElementById("play-btn"),
      stop: document.getElementById("stop-btn"),
    };

    this.elements.parent.addEventListener("click", (e) => {
      if (e.target.closest("#play-btn")) {
        this.playMusic();
      } else if (e.target.closest("#stop-btn")) {
        this.stopMusic();
      }
    });
  }

  playMusic() {
    this.audio.play();
    this.showStopBtn();
  }

  stopMusic() {
    this.audio.pause();
    this.showPlayBtn();
    this.audio.currentTime = 0;
  }

  showStopBtn() {
    this.elements.play.classList.add("hidden");
    this.elements.stop.classList.remove("hidden");
  }

  showPlayBtn() {
    this.elements.play.classList.remove("hidden");
    this.elements.stop.classList.add("hidden");
  }
}
