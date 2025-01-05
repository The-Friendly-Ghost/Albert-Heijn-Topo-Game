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
  const map = L.map("map", { attributionControl: false }).setView(
    [52.154912, 5.386841],
    7
  );
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

/**
 * Main function that is running during the game. Only resolves
 * after 10 rounds.
 * @param {*} allLocations Object with all AH location info
 * @param {*} map Leaflet map instance
 * @returns The score that the player got
 */
const playGame = async function (allLocations, map) {
  /** Create a copy of locations array */
  const locations = allLocations.osm.node.slice();
  let round = 1;
  let location = getRandomAh(locations);
  let clickedLocation;
  let score = 0;
  const answerLayer = L.layerGroup().addTo(map);

  /** 1. Set first location and start timer. */

  /** 2. Set a pin on a location when clicked */
  map.on("click", (e) => {
    clickedLocation = e.latlng;
    askConformation(e.latlng, answerLayer);
  });

  /** 3. Add Event handler for conformation clicks */
  const mapDiv = document.getElementById("map");
  mapDiv.addEventListener("click", (e) => {
    if (e.target.id === "confirm-btn") {
      /* Verwerk antwoord: */
      /* 1. Set pin voor gegokte locatie op map */
      /* 2. set pin voor daadwerkelijke locatie */
      /* 3. bereken afstand */
      /* 4. visualiseer afstand met cirkel */
      /* 5. Bereken score, set naar score variabele, increase round */
      /* reset:
      6. verwijder alle markers */
      /* 7. reset zoom */
      /* 8. Nieuwe AH-locatie ophalen */
      /* 9. timer resetten (extra) */
    }

    /** Extra: handle timer */
    /** Extra: handle highscores */
  });

  // Return a Promise that resolves after 10 rounds (clicks)
  return new Promise((resolve) => {
    if (round >= 11) {
      map.off();
      resolve(score);
    }
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
