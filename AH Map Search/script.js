// Constants
const MAP_CONFIG = {
  initialView: {
    lat: 52.154912,
    lng: 5.386841,
    zoom: 7,
  },
  tileLayer: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
};

const GAME_CONFIG = {
  roundsTotal: 10,
  timePerRound: 20,
  scoreMultipliers: {
    distance: 1,
    time: 2,
  },
};

// Custom Icons
const ICONS = {
  ah: L.icon({
    iconUrl: "AH_pin.png",
    iconSize: [40, 45],
    iconAnchor: [20, 45],
  }),
  user: L.icon({
    iconUrl: "user_pin.png",
    iconSize: [40, 45],
    iconAnchor: [20, 45],
  }),
};

class LocationService {
  static async fetchLocations() {
    try {
      const response = await fetch("locations.json");
      if (!response.ok) throw new Error("Failed to fetch locations");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching locations:", error);
      return null;
    }
  }

  static getRandomLocation(locations) {
    const hasRequiredTags = (location) => {
      return (
        location.tag.some((tag) => tag._k === "addr:city") &&
        location.tag.some((tag) => tag._k === "addr:street")
      );
    };

    const randomLocation =
      locations[Math.floor(Math.random() * locations.length)];
    return hasRequiredTags(randomLocation)
      ? randomLocation
      : this.getRandomLocation(locations);
  }

  static formatAddress(location) {
    const getTagValue = (key) =>
      location.tag.find((item) => item._k === key)?._v;
    const street = getTagValue("addr:street");
    const houseNumber = getTagValue("addr:housenumber");
    const city = getTagValue("addr:city");

    return `${street} ${houseNumber}, ${city}`;
  }
}

class GameMap {
  constructor() {
    this.map = null;
    this.answerLayer = null;
  }

  init() {
    this.map = L.map("map", {
      attributionControl: false,
      zoomControl: false,
    }).setView(
      [MAP_CONFIG.initialView.lat, MAP_CONFIG.initialView.lng],
      MAP_CONFIG.initialView.zoom
    );

    L.tileLayer(MAP_CONFIG.tileLayer.url, {
      maxZoom: MAP_CONFIG.tileLayer.maxZoom,
      attribution: MAP_CONFIG.tileLayer.attribution,
    }).addTo(this.map);

    this.answerLayer = L.layerGroup().addTo(this.map);
    return this;
  }

  showConfirmationPopup(latlng) {
    this.answerLayer.clearLayers();
    return L.popup(latlng, {
      content: '<div><button id="confirm-btn">Bevestigen</button></div>',
      autoClose: false,
      closeOnClick: false,
    }).openOn(this.answerLayer);
  }

  drawLine(point1, point2) {
    const lineCoords = [point1.getLatLng(), point2.getLatLng()];
    L.polyline(lineCoords, {
      color: "var(--line-color)",
      weight: 2,
    }).addTo(this.answerLayer);
  }

  fitMarkers(marker1, marker2) {
    const bounds = L.latLngBounds([marker1.getLatLng(), marker2.getLatLng()]);
    this.map.fitBounds(bounds, {
      padding: [300, 100],
      maxZoom: 14,
      animate: true,
      duration: 1.5,
    });
  }

  resetView() {
    this.map.flyTo(
      [MAP_CONFIG.initialView.lat, MAP_CONFIG.initialView.lng],
      MAP_CONFIG.initialView.zoom,
      { duration: 0.5 }
    );
  }

  clearAnswers() {
    this.answerLayer.clearLayers();
  }
}

class GameTimer {
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

class Game {
  constructor() {
    this.map = new GameMap();
    this.timer = new GameTimer(document.getElementById("counter"));
    this.elements = {
      ahTitle: document.getElementById("ah-address"),
      result: document.getElementById("distanceScore"),
      nextBtn: document.getElementById("continueBtn"),
      counter: document.getElementById("counter"),
    };

    this.state = {
      round: 1,
      score: 0,
      currentLocation: null,
      clickedLocation: null,
      disableMapClick: false,
      nextBtnActive: false,
    };
  }

  async init() {
    const locations = await LocationService.fetchLocations();
    if (!locations) throw new Error("No locations available");

    this.locations = locations.osm.node.slice();
    this.map.init();
    this.setupEventListeners();
    this.startRound();
  }

  setupEventListeners() {
    this.map.map.on("click", (e) => {
      if (!this.state.disableMapClick) {
        this.state.clickedLocation = e.latlng;
        this.map.showConfirmationPopup(e.latlng);
      }
    });

    document.getElementById("map").addEventListener("click", (e) => {
      if (e.target.id === "confirm-btn") {
        this.handleConfirmation();
      }
      if (e.target.closest("#rightBox") && this.state.nextBtnActive) {
        this.handleNextRound();
      }
    });
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

  endGame() {
    alert(this.state.score);
  }
}

// Initialize the game
document.addEventListener("DOMContentLoaded", () => {
  const game = new Game();
  game.init().catch(console.error);
});
