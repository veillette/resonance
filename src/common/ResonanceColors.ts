/**
 * Color definitions for the Resonance simulation
 * Simple color constants that can be updated based on preferences
 *
 * NOTE: This is a simplified version. For full ProfileColorProperty support,
 * additional SceneryStack configuration may be needed.
 */

// Color profiles
export type ColorProfile = "default" | "projector" | "colorblind";

// Color definitions for each profile
const colorProfiles = {
  default: {
    spring: "#2196F3",
    mass: "#FF5722",
    equilibrium: "#4CAF50",
    background: "#FFFFFF",
    panelFill: "#F0F0F0",
    panelStroke: "#CCCCCC",
    text: "#000000",
    textSecondary: "#666666",
    plot1: "#2196F3",
    plot2: "#FF5722",
    plot3: "#9C27B0",
    gridLines: "#E0E0E0",
    axes: "#757575",
    kineticEnergy: "#FF9800",
    potentialEnergy: "#03A9F4",
    totalEnergy: "#9C27B0",
    inPhase: "#4CAF50",
    outOfPhase: "#F44336",
    rotatingRectangle: "#CCCCCC",
  },
  projector: {
    spring: "#0D47A1",
    mass: "#BF360C",
    equilibrium: "#1B5E20",
    background: "#F5F5F5",
    panelFill: "#E0E0E0",
    panelStroke: "#999999",
    text: "#000000",
    textSecondary: "#333333",
    plot1: "#0D47A1",
    plot2: "#BF360C",
    plot3: "#4A148C",
    gridLines: "#BDBDBD",
    axes: "#424242",
    kineticEnergy: "#E65100",
    potentialEnergy: "#01579B",
    totalEnergy: "#4A148C",
    inPhase: "#1B5E20",
    outOfPhase: "#B71C1C",
    rotatingRectangle: "#999999",
  },
  colorblind: {
    spring: "#0077BB",
    mass: "#EE7733",
    equilibrium: "#009988",
    background: "#FFFFFF",
    panelFill: "#F0F0F0",
    panelStroke: "#CCCCCC",
    text: "#000000",
    textSecondary: "#666666",
    plot1: "#0077BB",
    plot2: "#EE7733",
    plot3: "#CC3311",
    gridLines: "#E0E0E0",
    axes: "#757575",
    kineticEnergy: "#EE7733",
    potentialEnergy: "#0077BB",
    totalEnergy: "#CC3311",
    inPhase: "#009988",
    outOfPhase: "#CC3311",
    rotatingRectangle: "#CCCCCC",
  },
};

// Current active profile (default)
let activeProfile: ColorProfile = "default";

// Function to set the active color profile
export function setColorProfile(profile: ColorProfile): void {
  activeProfile = profile;
}

// Function to get the current color profile
export function getColorProfile(): ColorProfile {
  return activeProfile;
}

// Export color getters that return the color for the active profile
const ResonanceColors = {
  get spring() {
    return colorProfiles[activeProfile].spring;
  },
  get mass() {
    return colorProfiles[activeProfile].mass;
  },
  get equilibrium() {
    return colorProfiles[activeProfile].equilibrium;
  },
  get background() {
    return colorProfiles[activeProfile].background;
  },
  get panelFill() {
    return colorProfiles[activeProfile].panelFill;
  },
  get panelStroke() {
    return colorProfiles[activeProfile].panelStroke;
  },
  get text() {
    return colorProfiles[activeProfile].text;
  },
  get textSecondary() {
    return colorProfiles[activeProfile].textSecondary;
  },
  get plot1() {
    return colorProfiles[activeProfile].plot1;
  },
  get plot2() {
    return colorProfiles[activeProfile].plot2;
  },
  get plot3() {
    return colorProfiles[activeProfile].plot3;
  },
  get gridLines() {
    return colorProfiles[activeProfile].gridLines;
  },
  get axes() {
    return colorProfiles[activeProfile].axes;
  },
  get kineticEnergy() {
    return colorProfiles[activeProfile].kineticEnergy;
  },
  get potentialEnergy() {
    return colorProfiles[activeProfile].potentialEnergy;
  },
  get totalEnergy() {
    return colorProfiles[activeProfile].totalEnergy;
  },
  get inPhase() {
    return colorProfiles[activeProfile].inPhase;
  },
  get outOfPhase() {
    return colorProfiles[activeProfile].outOfPhase;
  },
  get rotatingRectangle() {
    return colorProfiles[activeProfile].rotatingRectangle;
  },
};

export default ResonanceColors;
