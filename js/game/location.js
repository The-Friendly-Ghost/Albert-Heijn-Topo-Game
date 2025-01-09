"use strict";

export class LocationService {
  static async fetchLocations() {
    try {
      const response = await fetch("/locations/locations.json");
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
