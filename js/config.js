"use strict";

export const MAP_CONFIG = {
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

export const GAME_CONFIG = {
  roundsTotal: 10,
  timePerRound: 20,
  scoreMultipliers: {
    distance: 1,
    time: 2,
  },
};

// Custom Icons
export const ICONS = {
  ah: L.icon({
    iconUrl: "/media/AH_pin.png",
    iconSize: [40, 45],
    iconAnchor: [20, 45],
  }),
  user: L.icon({
    iconUrl: "/media/user_pin.png",
    iconSize: [40, 45],
    iconAnchor: [20, 45],
  }),
};
