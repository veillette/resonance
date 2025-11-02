/**
 * Resonance string module
 * Provides access to all translatable strings in the simulation
 *
 * NOTE: This is a simplified version that directly exports the English strings.
 * For full i18n support with SceneryStack, additional configuration may be needed.
 */

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

// Export the strings for the current locale
// Using a getter so it updates when locale changes
export const ResonanceStrings = {
  get resonance() {
    return stringsByLocale[currentLocale].resonance;
  },
};
