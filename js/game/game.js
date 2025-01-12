"use strict";

import { GAME_CONFIG, ICONS } from "../config.js";
import { LocationService } from "./location.js";
import { GameMap } from "./map.js";

export class GameTimer {
  constructor(counterElement) {
    this.counterElement = counterElement;
    this.interval = null;
    this.timeLeft = GAME_CONFIG.timePerRound;
  }

  start(onTimeUp) {
    this.reset();
    this.interval = setInterval(() => {
      this.timeLeft--;
      this.updateDisplay();

      if (this.timeLeft <= 0) {
        this.stop();
        onTimeUp();
      }
    }, 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  reset() {
    this.stop();
    this.timeLeft = GAME_CONFIG.timePerRound;
    this.updateDisplay();
  }

  updateDisplay() {
    this.counterElement.textContent = this.timeLeft.toString();
  }
}

export class Game {
  constructor() {
    this.map = new GameMap();
    this.timer = new GameTimer(document.getElementById("counter"));
    this.elements = {
      ahTitle: document.getElementById("ah-address"),
      result: document.getElementById("distance-score"),
      nextBtn: document.getElementById("continue-btn"),
      counter: document.getElementById("counter"),
      mapElement: document.getElementById("map"),
      startBtn: document.getElementById("start-btn"),
    };

    this.handleMapClick = this.handleMapClick.bind(this);
    this.handleMapElementClick = this.handleMapElementClick.bind(this);

    this.state = {
      round: 1,
      score: 0,
      currentLocation: null,
      clickedLocation: null,
      disableMapClick: false,
      nextBtnActive: false,
    };

    this.init();
  }

  async init() {
    const locations = await LocationService.fetchLocations();
    if (!locations) throw new Error("No locations available");

    this.locations = locations.osm.node.slice();
    this.map.init();
    this.setupEventListeners();
    this.elements.startBtn.classList.remove("hidden");
    // this.startRound();
  }

  handleMapClick(e) {
    if (!this.state.disableMapClick) {
      this.state.clickedLocation = e.latlng;
      this.map.showConfirmationPopup(e.latlng);
    }
  }

  handleMapElementClick(e) {
    if (e.target.id === "confirm-btn") {
      this.handleConfirmation();
    }
    if (e.target.closest("#right-box") && this.state.nextBtnActive) {
      this.handleNextRound();
    }
  }

  setupEventListeners() {
    this.map.map.on("click", this.handleMapClick);
    this.elements.mapElement.addEventListener(
      "click",
      this.handleMapElementClick
    );
  }

  startRound() {
    this.state.currentLocation = LocationService.getRandomLocation(
      this.locations
    );
    this.elements.ahTitle.textContent = LocationService.formatAddress(
      this.state.currentLocation
    );
    this.timer.start(() => this.handleTimeUp());
    this.state.disableMapClick = false;
    this.state.nextBtnActive = false;
    this.elements.result.textContent = " ";
    this.elements.nextBtn.classList.add("hidden");
    this.elements.counter.classList.remove("hidden");
  }

  calculateScore(distanceKM, timeLeft) {
    if (distanceKM >= 100 || timeLeft <= 0) return 0;
    return Math.max(
      0,
      Math.trunc(
        100 -
          distanceKM -
          (GAME_CONFIG.timePerRound - timeLeft) *
            GAME_CONFIG.scoreMultipliers.time
      )
    );
  }

  handleConfirmation() {
    this.timer.stop();
    this.map.clearAnswers();
    this.state.disableMapClick = true;

    const userMarker = L.marker(
      [this.state.clickedLocation.lat, this.state.clickedLocation.lng],
      {
        icon: ICONS.user,
      }
    ).addTo(this.map.answerLayer);

    const ahMarker = L.marker(
      [this.state.currentLocation._lat, this.state.currentLocation._lon],
      {
        icon: ICONS.ah,
      }
    ).addTo(this.map.answerLayer);

    const distanceKM = Math.floor(
      userMarker.getLatLng().distanceTo(ahMarker.getLatLng()) / 1000
    );
    const roundScore = this.calculateScore(distanceKM, this.timer.timeLeft);
    this.state.score += roundScore;

    this.map.drawLine(userMarker, ahMarker);
    this.elements.result.textContent = `Afstand: ${distanceKM}KM (score +${roundScore})`;
    this.map.fitMarkers(userMarker, ahMarker);

    this.elements.nextBtn.classList.remove("hidden");
    this.elements.counter.classList.add("hidden");
    this.state.nextBtnActive = true;
  }

  handleTimeUp() {
    if (this.state.disableMapClick) return;

    this.state.disableMapClick = true;
    this.map.clearAnswers();

    const ahMarker = L.marker(
      [this.state.currentLocation._lat, this.state.currentLocation._lon],
      {
        icon: ICONS.ah,
      }
    ).addTo(this.map.answerLayer);

    this.elements.result.textContent = "Tijd is op! (score +0)";
    this.map.fitMarkers(ahMarker, ahMarker);

    this.elements.nextBtn.classList.remove("hidden");
    this.elements.counter.classList.add("hidden");
    this.state.nextBtnActive = true;
  }

  handleNextRound() {
    this.map.clearAnswers();
    if (++this.state.round > GAME_CONFIG.roundsTotal) {
      this.endGame();
      return;
    }

    this.map.resetView();
    this.startRound();
  }

  destroy() {
    if (this.map.map) {
      this.map.map.off("click", this.handleMapClick);
    }
    this.elements.mapElement.removeEventListener(
      "click",
      this.handleMapElementClick
    );
    this.timer.stop();
    this.map.destroy();
    this.state = {
      round: 1,
      score: 0,
      currentLocation: null,
      clickedLocation: null,
      disableMapClick: false,
      nextBtnActive: false,
    };
  }

  endGame() {
    const gameEndEvent = new CustomEvent("gameEnd", {
      detail: {
        score: this.state.score,
      },
    });
    document.dispatchEvent(gameEndEvent);
  }
}
