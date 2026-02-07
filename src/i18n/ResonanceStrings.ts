/**
 * ResonanceStrings.ts
 *
 * Provides convenient access to localized strings for the Resonance simulation.
 * Strings are organized by category and accessed as reactive properties.
 */

import { getStringProperties, StringManager } from "./StringManager.js";

// Get the nested string properties
const strings = getStringProperties();

// Convenience aliases for simulation preferences solver strings
const simulationPrefs = strings.resonance.preferences.simulation;

/**
 * All localized strings for the Resonance simulation.
 * Access strings directly: ResonanceStrings.controls.massStringProperty
 */
export const ResonanceStrings = {
  // Title
  titleStringProperty: strings.resonance.titleStringProperty,

  // Screens
  screens: strings.resonance.screens,

  // Controls
  controls: strings.resonance.controls,

  // Preferences
  preferences: {
    titleStringProperty: strings.resonance.preferences.titleStringProperty,
    visual: strings.resonance.preferences.visual,
    simulation: strings.resonance.preferences.simulation,
    localization: strings.resonance.preferences.localization,

    // Solver names and descriptions (convenience mapping)
    solvers: {
      rk4StringProperty: simulationPrefs.solverRK4StringProperty,
      adaptiveRK45StringProperty:
        simulationPrefs.solverAdaptiveRK45StringProperty,
      rk4DescriptionStringProperty:
        simulationPrefs.solverRK4DescriptionStringProperty,
      adaptiveRK45DescriptionStringProperty:
        simulationPrefs.solverAdaptiveRK45DescriptionStringProperty,
    },
  },

  // Content
  content: strings.resonance.content,

  // Presets
  presets: strings.resonance.presets,

  // Units
  units: strings.resonance.units,

  // Common solver names (convenience mapping for model code)
  common: {
    ...strings.resonance.common,
    solverNames: {
      solverRK4StringProperty: strings.resonance.common.solverRK4StringProperty,
      solverAdaptiveRK45StringProperty:
        strings.resonance.common.solverAdaptiveRK45StringProperty,
    },
  },

  // Chladni screen strings
  chladni: strings.resonance.chladni,

  // Accessibility strings for oscillator screen
  a11y: strings.resonance.a11y,
};

// Export for backward compatibility
export const resonanceStringManager = StringManager.getInstance();

// Export StringManager for direct access when needed
export { StringManager };
