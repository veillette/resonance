/**
 * ResonanceStrings.ts
 *
 * Provides convenient access to localized strings for the Resonance simulation.
 * This module exports the StringManager singleton for use throughout the application.
 */

import { StringManager } from "./StringManager";

// Export the StringManager singleton instance
export const resonanceStringManager = StringManager.getInstance();

// Get the raw string properties for backward compatibility
const allStringProperties = resonanceStringManager.getAllStringProperties();

// Export commonly used string properties for convenience
export const ResonanceStrings = {
  // Raw strings for backward compatibility (returns the current locale's string values)
  get resonance() {
    // Access the current value of the localized strings
    // Note: This is for backward compatibility with code that accesses raw strings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getCurrentStrings = (obj: any): any => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = {};
      for (const key in obj) {
        const value = obj[key];
        if (value && typeof value === 'object') {
          // Check if it's a Property (has a 'value' getter)
          if ('value' in value && typeof value.value !== 'undefined') {
            result[key.replace('StringProperty', '')] = value.value;
          } else {
            result[key] = getCurrentStrings(value);
          }
        }
      }
      return result;
    };
    return getCurrentStrings(allStringProperties.resonance);
  },

  // Title
  titleStringProperty: resonanceStringManager.getTitleStringProperty(),

  // Screens
  screens: resonanceStringManager.getScreenNames(),

  // Controls
  controls: resonanceStringManager.getControlLabels(),

  // Preferences
  preferences: {
    titleStringProperty: resonanceStringManager.getPreferencesLabels().titleStringProperty,

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
};

// Export the StringManager for direct access when needed
export { StringManager };
