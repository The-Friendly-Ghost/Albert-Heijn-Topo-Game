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

const confirmAnswer = function (answer, map, answerLayer) {
  /** Clear all marker instances on the markerGroup layer. This
   * is to prevent more than 1 answer to be visible at the same time.
   */
  answerLayer.clearLayers();

  /** Open confirmation popup */
  const popup = L.popup(answer, {
    content: `<div>  
      <p>Is dit je keuze?</p>  
      <button id="confirm-btn">Confirm</button>  
      <button id="cancel-btn">Cancel</button>  
    </div>`,
    autoClose: false,
    closeButton: false,
    closeOnClick: false,
  }).openOn(answerLayer);
  return true;
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
  let score = 0;
  const answerLayer = L.layerGroup().addTo(map);

  // Return a Promise that resolves after 10 rounds (clicks)
  return new Promise((resolve) => {
    /** Set event handler for click on map */
    map.on("click", (e) => {
      /** On click: 1. give confirmation modal. 2. if confirmed,
       * score the answer */
      if (confirmAnswer(e.latlng, map, answerLayer)) {
        // score = scoreAnswer(e.latlng, location);
        // if (++round <= 11) {
        //   /** If round 10 or before, get new location */
        //   location = getRandomAh(locations);
        //   round++;
        // } else {
        //   /** If round is at 11, end the game */
        //   map.off();
        //   resolve(score);
        // }
      }
    });
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
