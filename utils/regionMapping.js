// backend/utils/regionMapping.js

/**
 * State to Region Mapping
 * This file maps each US state to its designated region
 * for reporting and analytics purposes.
 */

const stateToRegion = {
  // ========== CORE MID-SOUTH ==========
  Tennessee: "Core Mid-South",
  Mississippi: "Core Mid-South",
  Arkansas: "Core Mid-South",
  Missouri: "Core Mid-South",
  Kentucky: "Core Mid-South",

  // ========== DEEP SOUTH ==========
  Alabama: "Deep South",
  Georgia: "Deep South",
  Louisiana: "Deep South",
  "South Carolina": "Deep South",

  // ========== OTHER STATES (Not in target region) ==========
  // Northeast
  "New York": "Other",
  "New Jersey": "Other",
  Pennsylvania: "Other",
  Massachusetts: "Other",
  Connecticut: "Other",
  "Rhode Island": "Other",
  "New Hampshire": "Other",
  Vermont: "Other",
  Maine: "Other",

  // Midwest
  Ohio: "Other",
  Indiana: "Other",
  Illinois: "Other",
  Michigan: "Other",
  Wisconsin: "Other",
  Minnesota: "Other",
  Iowa: "Other",
  "North Dakota": "Other",
  "South Dakota": "Other",
  Nebraska: "Other",
  Kansas: "Other",

  // West
  California: "Other",
  Oregon: "Other",
  Washington: "Other",
  Nevada: "Other",
  Arizona: "Other",
  Utah: "Other",
  Idaho: "Other",
  Montana: "Other",
  Wyoming: "Other",
  Colorado: "Other",
  "New Mexico": "Other",
  Hawaii: "Other",
  Alaska: "Other",

  // South (but not Deep South)
  Texas: "Other",
  Oklahoma: "Other",
  "West Virginia": "Other",
  Virginia: "Other",
  Maryland: "Other",
  Delaware: "Other",
  "Washington DC": "Other",
  "District of Columbia": "Other",
  "North Carolina": "Other",
  Florida: "Other",
};

/**
 * Get region by state name
 * @param {string} state - The state name
 * @returns {string} - Region name (Core Mid-South, Deep South, or Other)
 */
const getRegionByState = (state) => {
  if (!state) return "Unknown";
  return stateToRegion[state] || "Other";
};

/**
 * Get all available regions
 * @returns {Array} - List of region names
 */
const getAllRegions = () => {
  return ["Core Mid-South", "Deep South", "Other", "Unknown"];
};

/**
 * Get list of states in a specific region
 * @param {string} region - Region name
 * @returns {Array} - List of state names
 */
const getStatesByRegion = (region) => {
  return Object.entries(stateToRegion)
    .filter(([state, stateRegion]) => stateRegion === region)
    .map(([state]) => state);
};

/**
 * Check if a state is in the target region (Mid-South or Deep South)
 * @param {string} state - State name
 * @returns {boolean} - True if in target region
 */
const isInTargetRegion = (state) => {
  const region = getRegionByState(state);
  return region === "Core Mid-South" || region === "Deep South";
};

module.exports = {
  stateToRegion,
  getRegionByState,
  getAllRegions,
  getStatesByRegion,
  isInTargetRegion,
};
