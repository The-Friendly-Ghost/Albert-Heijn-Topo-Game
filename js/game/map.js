"use strict";

import { MAP_CONFIG } from "../config.js";

export class GameMap {
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
