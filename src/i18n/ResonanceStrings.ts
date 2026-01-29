/**
 * ResonanceStrings.ts
 *
 * Provides convenient access to localized strings for the Resonance simulation.
 * This module exports the StringManager singleton for use throughout the application.
 */

import { StringManager } from "./StringManager";

// Export the StringManager singleton instance
export const resonanceStringManager = StringManager.getInstance();

// Export commonly used string properties for convenience
export const ResonanceStrings = {
  // Title
  titleStringProperty: resonanceStringManager.getTitleStringProperty(),

  // Screens
  screens: resonanceStringManager.getScreenNames(),

  // Controls
  controls: resonanceStringManager.getControlLabels(),

  // Preferences
  preferences: {
    titleStringProperty:
      resonanceStringManager.getPreferencesLabels().titleStringProperty,

    visual: resonanceStringManager.getVisualPreferencesLabels(),

    simulation: resonanceStringManager.getSimulationPreferencesLabels(),

    localization: resonanceStringManager.getLocalizationPreferencesLabels(),

    // Solver names and descriptions (merged for convenience)
    solvers: {
      ...resonanceStringManager.getSolverNames(),
      ...resonanceStringManager.getSolverDescriptions(),
    },
  },

  // Content
  content: resonanceStringManager.getContentLabels(),

  // Presets
  presets: resonanceStringManager.getPresetNames(),

  // Units
  units: resonanceStringManager.getUnitLabels(),

  // Common (for use in model code)
  common: {
    solverNames: resonanceStringManager.getCommonSolverNames(),
  },
};

// Export the StringManager for direct access when needed
export { StringManager };
