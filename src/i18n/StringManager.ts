/**
 * StringManager.ts
 *
 * Centralizes string management for the Resonance simulation.
 * Provides access to localized strings for all components.
 */

import { LocalizedString } from "scenerystack";
import strings_en from "./strings_en.json";
import strings_fr from "./strings_fr.json";
import strings_es from "./strings_es.json";

/**
 * Creates and caches the localized string properties.
 * Uses LocalizedString.getNestedStringProperties to automatically
 * create reactive string properties for all strings in the JSON files.
 */
function createStringProperties() {
  return LocalizedString.getNestedStringProperties({
    en: strings_en,
    fr: strings_fr,
    es: strings_es,
  });
}

// Cached string properties (created once on first access)
let cachedStringProperties: ReturnType<typeof createStringProperties> | null =
  null;

/**
 * Get the string properties, creating them if necessary.
 * This provides lazy initialization and singleton behavior.
 */
export function getStringProperties() {
  if (!cachedStringProperties) {
    cachedStringProperties = createStringProperties();
  }
  return cachedStringProperties;
}

/**
 * StringManager class maintained for backward compatibility.
 * @deprecated Use getStringProperties() or ResonanceStrings directly instead.
 */
export class StringManager {
  private static instance: StringManager;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): StringManager {
    if (!StringManager.instance) {
      StringManager.instance = new StringManager();
    }
    return StringManager.instance;
  }

  /**
   * Get all string properties directly.
   * This is the recommended way to access strings.
   */
  public getAllStringProperties() {
    return getStringProperties();
  }
}
