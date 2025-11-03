/**
 * Resonance string module
 * Provides access to all translatable strings in the simulation
 *
 * NOTE: This is a simplified version that directly exports the English strings.
 * For full i18n support with SceneryStack, additional configuration may be needed.
 */

import { Property } from "scenerystack/axon";
import enStrings from "./locales/en/resonance-strings.json";
import esStrings from "./locales/es/resonance-strings.json";
import frStrings from "./locales/fr/resonance-strings.json";

// For now, we'll use a simple locale variable
// In a full implementation, this would be connected to SceneryStack's locale system
let currentLocale = "en";

const stringsByLocale: Record<string, typeof enStrings> = {
  en: enStrings,
  es: esStrings,
  fr: frStrings,
};

export function setLocale(locale: string): void {
  if (stringsByLocale[locale]) {
    currentLocale = locale;
  }
}

export function getLocale(): string {
  return currentLocale;
}

// Helper function to create a Property from a string path
function createStringProperty(path: string): Property<string> {
  const parts = path.split(".");
  const getValue = () => {
    let value: any = stringsByLocale[currentLocale];
    for (const part of parts) {
      value = value[part];
    }
    return value;
  };
  return new Property<string>(getValue());
}

// Export the strings for the current locale
// Using a getter so it updates when locale changes
export const ResonanceStrings = {
  get resonance() {
    return stringsByLocale[currentLocale].resonance;
  },

  // String properties for preferences
  titleStringProperty: createStringProperty("resonance.title"),

  preferences: {
    simulation: {
      displayOptionsStringProperty: createStringProperty("resonance.preferences.simulation.displayOptions"),
      solverMethodStringProperty: createStringProperty("resonance.preferences.simulation.solverMethod"),
      solverDescriptionStringProperty: createStringProperty("resonance.preferences.simulation.solverDescription"),
      showEnergyStringProperty: createStringProperty("resonance.preferences.simulation.showEnergy"),
      showVectorsStringProperty: createStringProperty("resonance.preferences.simulation.showVectors"),
      showPhaseStringProperty: createStringProperty("resonance.preferences.simulation.showPhase"),
    },
    solvers: {
      rk4StringProperty: createStringProperty("resonance.preferences.simulation.solverRK4"),
      rk4DescriptionStringProperty: createStringProperty("resonance.preferences.simulation.solverRK4Description"),
      adaptiveRK45StringProperty: createStringProperty("resonance.preferences.simulation.solverAdaptiveRK45"),
      adaptiveRK45DescriptionStringProperty: createStringProperty("resonance.preferences.simulation.solverAdaptiveRK45Description"),
      adaptiveEulerStringProperty: createStringProperty("resonance.preferences.simulation.solverAdaptiveEuler"),
      adaptiveEulerDescriptionStringProperty: createStringProperty("resonance.preferences.simulation.solverAdaptiveEulerDescription"),
      modifiedMidpointStringProperty: createStringProperty("resonance.preferences.simulation.solverModifiedMidpoint"),
      modifiedMidpointDescriptionStringProperty: createStringProperty("resonance.preferences.simulation.solverModifiedMidpointDescription"),
    },
  },
};
