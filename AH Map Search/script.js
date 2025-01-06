"use strict";

const getLocations = async function () {
  try {
    const response = await fetch("locations.json");
    if (!response.ok) {
      throw new Error("Failed to fetch the JSON file");
    }
    const locations = await response.json(); // Automatically parses the JSON
    return locations; // Return the parsed JSON
  } catch (error) {
    console.error("Error:", error);
    return null; // Return null if an error occurs
  }
};

/**
 * Creates the map instance
 * @returns map object
 */
const initMap = async function () {
  /** Init Leaflet instance */
  const map = L.map("map", {
    attributionControl: false,
    zoomControl: false,
  }).setView([52.154912, 5.386841], 7);
  /** Set Leaflet map style  */
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
    {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }
  ).addTo(map);

  return map;
};

/**
 * Returns a random Albert Heijn location from the locations array
 * @param {*} locations Array with all Albert Heijn locations
 * @returns 1 Albert Heijn location as an object
 */
const getRandomAh = function (locations) {
  const num = Math.floor(Math.random() * locations.length);
  const ah = locations.at(num);

  /** Verify if AH contains an adress and city. If not, call function again*/
  if (
    ah.tag.some((tag) => tag._k === "addr:city") &&
    ah.tag.some((tag) => tag._k === "addr:street")
  ) {
    return ah;
  }
  return getRandomAh(locations);
};

/**
 * Set pin on map click and give confirmation popup
 * @param {*} answer The location of the click on the map
 * @param {*} answerLayer The map layer of the answers
 * @returns none
 */
const askConformation = function (answer, answerLayer) {
  /** Clear all marker instances on the markerGroup layer. This
   * is to prevent more than 1 answer to be visible at the same time.
   */
  answerLayer.clearLayers();

  /** Open confirmation popup */
  const popup = L.popup(answer, {
    content: `<div>  
      <p>Bevestig locatie</p>  
      <button id="confirm-btn">Bevestigen</button>  
    </div>`,
    autoClose: false,
    closeOnClick: false,
  }).openOn(answerLayer);
};

const setAhText = function (text, location) {
  const city = location.tag.filter((item) => item._k === "addr:city")[0]._v;
  const street = location.tag.filter((item) => item._k === "addr:street")[0]._v;
  const houseNumber = location.tag.filter(
    (item) => item._k === "addr:housenumber"
  )[0]._v;

  text.textContent = `${street} ${houseNumber}, ${city} `;
};

const drawLineBetweenPoints = function (m1, m2, layer) {
  // Get start and end points of the line
  const lineCoords = [m1.getLatLng(), m2.getLatLng()];
  // Draw line
  L.polyline(lineCoords, {
    color: "var(--line-color)",
    weight: 2,
  }).addTo(layer);
};

const zoomMapToMarkers = function (m1, m2, map) {
  // Methode 2: Met de coördinaten
  const bounds = L.latLngBounds([m1.getLatLng(), m2.getLatLng()]);
  map.fitBounds(bounds, {
    padding: [300, 100],
    maxZoom: 17,
    animate: true,
    duration: 1.5,
  });
};

/**
 * Main function that is running during the game. Only resolves
 * after 10 rounds.
 * @param {*} allLocations Object with all AH location info
 * @param {*} map Leaflet map instance
 * @returns The score that the player got
 */
const playGame = async function (allLocations, map) {
  /** Create neccesary variables */
  const locations = allLocations.osm.node.slice(); // Locations copy
  let round = 1; // round counter
  let location = getRandomAh(locations); // AH location (changes every round)
  let clickedLocation; // The current clicked location on the map
  let score = 0; // The score (adds up every round)
  const answerLayer = L.layerGroup().addTo(map); // Layer with the markers
  let disableMapClick = false; // true if user confirmed answer
  let nextBtnActive = false; // true when next button is active
  const ahTitle = document.getElementById("ah-address"); // DOM-element text
  const result = document.getElementById("distanceScore"); // DOM-element score
  const counter = document.getElementById("counter");
  const nextBtn = document.getElementById("continueBtn");
  // The custom AH location pin
  const ahIcon = L.icon({
    iconUrl: "AH_pin.png",
    iconSize: [40, 45], // width: 38px, height: 40px
    iconAnchor: [20, 45], // x: half of width, y: full height for bottom point
  });
  // The custom user location pin
  const userIcon = L.icon({
    iconUrl: "user_pin.png",
    iconSize: [40, 45], // width: 38px, height: 40px
    iconAnchor: [20, 45], // x: half of width, y: full height for bottom point
  });

  /** 1. Set first location and start timer. */
  setAhText(ahTitle, location);

  /** 2. Set a pin on a location when clicked */
  map.on("click", (e) => {
    if (!disableMapClick) {
      clickedLocation = e.latlng;
      askConformation(e.latlng, answerLayer);
    }
  });

  return new Promise((resolve) => {
    /** 3. Add Event handler for confirmation clicks */
    const mapDiv = document.getElementById("map");
    mapDiv.addEventListener("click", (e) => {
      if (e.target.id === "confirm-btn") {
        disableMapClick = true;
        /* 1. Remove confirmation pop up and set pin for clicked location */
        answerLayer.clearLayers();
        const userPin = L.marker([clickedLocation.lat, clickedLocation.lng], {
          icon: userIcon,
        }).addTo(answerLayer);

        /* 2. Set pin for the Albert Heijn location */
        const ahPin = L.marker([location._lat, location._lon], {
          icon: ahIcon,
        }).addTo(answerLayer);

        /* 3. Calculate distance in KM */
        const distanceKM = Math.floor(
          userPin.getLatLng().distanceTo(ahPin.getLatLng()) / 1000
        );

        /** 4. Calculate score. User only earns points if the answer
         * is within 100km of the actual location. 100 points is the perfect
         * answer. For every kilomter distance, 1 point gets subtracted,
         * until 0 remains.
         */
        if (distanceKM < 100) {
          score += 100 - distanceKM;
        }

        /* 5. Visualize with line and set distance text */
        drawLineBetweenPoints(userPin, ahPin, answerLayer, distanceKM);
        result.textContent = `Afstand: ${distanceKM}KM (score +${
          distanceKM < 100 ? 100 - distanceKM : "0"
        })`;

        /* 7. Zoom out to correct boundaries */
        zoomMapToMarkers(userPin, ahPin, map);

        /* 9. Hide counter & show continue button */
        nextBtn.classList.remove("hidden");
        counter.classList.add("hidden");
        nextBtnActive = true;
      }

      /** Trigger this event if the continue button is clicked */
      if (e.target.closest("#rightBox") && nextBtnActive) {
        /* 10. Remove all markers and line */
        answerLayer.clearLayers();
        /* 11. reset zoom */
        map.flyTo([52.154912, 5.386841], 7, {
          duration: 0.5,
        });
        /* 12. Get new location and show text */
        location = getRandomAh(locations);
        setAhText(ahTitle, location);
        result.textContent = " ";
        /* 13. Hide continue button, show timer */
        nextBtn.classList.add("hidden");
        counter.classList.remove("hidden");
        nextBtnActive = false;

        /* 14. Enable map click */
        disableMapClick = false;

        /* 8. Increase round */
        if (++round >= 11) {
          map.off();
          resolve(score);
        }
      }

      /** Extra: handle timer */
      /** Extra: handle highscores */
    });

    // Return a Promise that resolves after 10 rounds (clicks)
  });
};

const endGame = function (score) {
  alert(score);
};

const initApp = async function () {
  try {
    // Call the async function to get all AH locations
    const allLocations = await getLocations();
    if (!allLocations) {
      throw new Error("GetLocations: No locations available");
    }
    const map = await initMap();
    const score = await playGame(allLocations, map);
    endGame(score);
  } catch (error) {
    console.error(error.message);
  }
};

initApp();
