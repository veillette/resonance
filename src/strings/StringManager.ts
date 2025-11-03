/**
 * StringManager.ts
 *
 * Centralizes string management for the Resonance simulation.
 * Provides access to localized strings for all components.
 */

import { LocalizedString, ReadOnlyProperty } from "scenerystack";
import strings_en from "./locales/en/resonance-strings.json";
import strings_fr from "./locales/fr/resonance-strings.json";
import strings_es from "./locales/es/resonance-strings.json";

/**
 * Manages all localized strings for the simulation
 */
export class StringManager {
  // The cached singleton instance
  private static instance: StringManager;

  // All string properties organized by category
  private readonly stringProperties;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Create localized string properties
    this.stringProperties = LocalizedString.getNestedStringProperties({
      en: strings_en,
      fr: strings_fr,
      es: strings_es,
    });
  }

  /**
   * Get the singleton instance of StringManager
   * @returns The StringManager instance
   */
  public static getInstance(): StringManager {
    if (!StringManager.instance) {
      StringManager.instance = new StringManager();
    }
    return StringManager.instance;
  }

  /**
   * Get the title string property
   */
  public getTitleStringProperty(): ReadOnlyProperty<string> {
    return this.stringProperties.resonance.titleStringProperty;
  }

  /**
   * Get screen name string properties
   */
  public getScreenNames() {
    return {
      simStringProperty: this.stringProperties.resonance.screens.simStringProperty,
    };
  }

  /**
   * Get control label string properties
   */
  public getControlLabels() {
    return {
      springConstantStringProperty: this.stringProperties.resonance.controls.springConstantStringProperty,
      dampingCoefficientStringProperty: this.stringProperties.resonance.controls.dampingCoefficientStringProperty,
      drivingFrequencyStringProperty: this.stringProperties.resonance.controls.drivingFrequencyStringProperty,
      drivingAmplitudeStringProperty: this.stringProperties.resonance.controls.drivingAmplitudeStringProperty,
      massStringProperty: this.stringProperties.resonance.controls.massStringProperty,
      resetStringProperty: this.stringProperties.resonance.controls.resetStringProperty,
    };
  }

  /**
   * Get preferences string properties
   */
  public getPreferencesLabels() {
    return {
      titleStringProperty: this.stringProperties.resonance.preferences.titleStringProperty,
    };
  }

  /**
   * Get visual preferences string properties
   */
  public getVisualPreferencesLabels() {
    return {
      titleStringProperty: this.stringProperties.resonance.preferences.visual.titleStringProperty,
      colorProfileStringProperty: this.stringProperties.resonance.preferences.visual.colorProfileStringProperty,
      colorProfileDefaultStringProperty: this.stringProperties.resonance.preferences.visual.colorProfileDefaultStringProperty,
      colorProfileProjectorStringProperty: this.stringProperties.resonance.preferences.visual.colorProfileProjectorStringProperty,
      colorProfileColorblindStringProperty: this.stringProperties.resonance.preferences.visual.colorProfileColorblindStringProperty,
      contrastStringProperty: this.stringProperties.resonance.preferences.visual.contrastStringProperty,
    };
  }

  /**
   * Get simulation preferences string properties
   */
  public getSimulationPreferencesLabels() {
    return {
      titleStringProperty: this.stringProperties.resonance.preferences.simulation.titleStringProperty,
      displayOptionsStringProperty: this.stringProperties.resonance.preferences.simulation.displayOptionsStringProperty,
      showEnergyStringProperty: this.stringProperties.resonance.preferences.simulation.showEnergyStringProperty,
      showVectorsStringProperty: this.stringProperties.resonance.preferences.simulation.showVectorsStringProperty,
      showPhaseStringProperty: this.stringProperties.resonance.preferences.simulation.showPhaseStringProperty,
      unitsStringProperty: this.stringProperties.resonance.preferences.simulation.unitsStringProperty,
      unitsMetricStringProperty: this.stringProperties.resonance.preferences.simulation.unitsMetricStringProperty,
      unitsImperialStringProperty: this.stringProperties.resonance.preferences.simulation.unitsImperialStringProperty,
      solverMethodStringProperty: this.stringProperties.resonance.preferences.simulation.solverMethodStringProperty,
      solverDescriptionStringProperty: this.stringProperties.resonance.preferences.simulation.solverDescriptionStringProperty,
    };
  }

  /**
   * Get solver name string properties
   */
  public getSolverNames() {
    return {
      rk4StringProperty: this.stringProperties.resonance.preferences.simulation.solverRK4StringProperty,
      adaptiveRK45StringProperty: this.stringProperties.resonance.preferences.simulation.solverAdaptiveRK45StringProperty,
      adaptiveEulerStringProperty: this.stringProperties.resonance.preferences.simulation.solverAdaptiveEulerStringProperty,
      modifiedMidpointStringProperty: this.stringProperties.resonance.preferences.simulation.solverModifiedMidpointStringProperty,
    };
  }

  /**
   * Get solver description string properties
   */
  public getSolverDescriptions() {
    return {
      rk4DescriptionStringProperty: this.stringProperties.resonance.preferences.simulation.solverRK4DescriptionStringProperty,
      adaptiveRK45DescriptionStringProperty: this.stringProperties.resonance.preferences.simulation.solverAdaptiveRK45DescriptionStringProperty,
      adaptiveEulerDescriptionStringProperty: this.stringProperties.resonance.preferences.simulation.solverAdaptiveEulerDescriptionStringProperty,
      modifiedMidpointDescriptionStringProperty: this.stringProperties.resonance.preferences.simulation.solverModifiedMidpointDescriptionStringProperty,
    };
  }

  /**
   * Get localization preferences string properties
   */
  public getLocalizationPreferencesLabels() {
    return {
      titleStringProperty: this.stringProperties.resonance.preferences.localization.titleStringProperty,
      languageStringProperty: this.stringProperties.resonance.preferences.localization.languageStringProperty,
    };
  }

  /**
   * Get content string properties
   */
  public getContentLabels() {
    return {
      sampleTextStringProperty: this.stringProperties.resonance.content.sampleTextStringProperty,
    };
  }

  /**
   * Get all raw string properties
   * This can be used if direct access is needed to a specific string property
   */
  public getAllStringProperties() {
    return this.stringProperties;
  }
}
