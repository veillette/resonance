/**
 * StringManager.ts
 *
 * Centralizes string management for the Resonance simulation.
 * Provides access to localized strings for all components.
 */

import { LocalizedString, ReadOnlyProperty } from "scenerystack";
import strings_en from "./strings_en.json";
import strings_fr from "./strings_fr.json";
import strings_es from "./strings_es.json";

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
      simStringProperty:
        this.stringProperties.resonance.screens.simStringProperty,
    };
  }

  /**
   * Get control label string properties
   */
  public getControlLabels() {
    return {
      springConstantStringProperty:
        this.stringProperties.resonance.controls.springConstantStringProperty,
      dampingCoefficientStringProperty:
        this.stringProperties.resonance.controls
          .dampingCoefficientStringProperty,
      drivingFrequencyStringProperty:
        this.stringProperties.resonance.controls.drivingFrequencyStringProperty,
      drivingAmplitudeStringProperty:
        this.stringProperties.resonance.controls.drivingAmplitudeStringProperty,
      massStringProperty:
        this.stringProperties.resonance.controls.massStringProperty,
      resetStringProperty:
        this.stringProperties.resonance.controls.resetStringProperty,
      resonatorConfigStringProperty:
        this.stringProperties.resonance.controls.resonatorConfigStringProperty,
      sameMassStringProperty:
        this.stringProperties.resonance.controls.sameMassStringProperty,
      sameSpringConstantStringProperty:
        this.stringProperties.resonance.controls
          .sameSpringConstantStringProperty,
      mixedStringProperty:
        this.stringProperties.resonance.controls.mixedStringProperty,
      sameFrequencyStringProperty:
        this.stringProperties.resonance.controls.sameFrequencyStringProperty,
      customStringProperty:
        this.stringProperties.resonance.controls.customStringProperty,
      frequencyStringProperty:
        this.stringProperties.resonance.controls.frequencyStringProperty,
      amplitudeStringProperty:
        this.stringProperties.resonance.controls.amplitudeStringProperty,
      resonatorsStringProperty:
        this.stringProperties.resonance.controls.resonatorsStringProperty,
      resonator1StringProperty:
        this.stringProperties.resonance.controls.resonator1StringProperty,
      resonatorPatternStringProperty:
        this.stringProperties.resonance.controls.resonatorPatternStringProperty,
      massSimpleStringProperty:
        this.stringProperties.resonance.controls.massSimpleStringProperty,
      springConstantSimpleStringProperty:
        this.stringProperties.resonance.controls
          .springConstantSimpleStringProperty,
      dampingStringProperty:
        this.stringProperties.resonance.controls.dampingStringProperty,
      gravityStringProperty:
        this.stringProperties.resonance.controls.gravityStringProperty,
      rulerStringProperty:
        this.stringProperties.resonance.controls.rulerStringProperty,
      onStringProperty:
        this.stringProperties.resonance.controls.onStringProperty,
      frequencyEqualsStringProperty:
        this.stringProperties.resonance.controls.frequencyEqualsStringProperty,
      slowStringProperty:
        this.stringProperties.resonance.controls.slowStringProperty,
      normalStringProperty:
        this.stringProperties.resonance.controls.normalStringProperty,
      closeStringProperty:
        this.stringProperties.resonance.controls.closeStringProperty,
    };
  }

  /**
   * Get preferences string properties
   */
  public getPreferencesLabels() {
    return {
      titleStringProperty:
        this.stringProperties.resonance.preferences.titleStringProperty,
    };
  }

  /**
   * Get visual preferences string properties
   */
  public getVisualPreferencesLabels() {
    return {
      titleStringProperty:
        this.stringProperties.resonance.preferences.visual.titleStringProperty,
      colorProfileStringProperty:
        this.stringProperties.resonance.preferences.visual
          .colorProfileStringProperty,
      colorProfileDefaultStringProperty:
        this.stringProperties.resonance.preferences.visual
          .colorProfileDefaultStringProperty,
      colorProfileProjectorStringProperty:
        this.stringProperties.resonance.preferences.visual
          .colorProfileProjectorStringProperty,
      colorProfileColorblindStringProperty:
        this.stringProperties.resonance.preferences.visual
          .colorProfileColorblindStringProperty,
      contrastStringProperty:
        this.stringProperties.resonance.preferences.visual
          .contrastStringProperty,
    };
  }

  /**
   * Get simulation preferences string properties
   */
  public getSimulationPreferencesLabels() {
    return {
      titleStringProperty:
        this.stringProperties.resonance.preferences.simulation
          .titleStringProperty,
      displayOptionsStringProperty:
        this.stringProperties.resonance.preferences.simulation
          .displayOptionsStringProperty,
      showEnergyStringProperty:
        this.stringProperties.resonance.preferences.simulation
          .showEnergyStringProperty,
      showVectorsStringProperty:
        this.stringProperties.resonance.preferences.simulation
          .showVectorsStringProperty,
      showPhaseStringProperty:
        this.stringProperties.resonance.preferences.simulation
          .showPhaseStringProperty,
      unitsStringProperty:
        this.stringProperties.resonance.preferences.simulation
          .unitsStringProperty,
      unitsMetricStringProperty:
        this.stringProperties.resonance.preferences.simulation
          .unitsMetricStringProperty,
      unitsImperialStringProperty:
        this.stringProperties.resonance.preferences.simulation
          .unitsImperialStringProperty,
      solverMethodStringProperty:
        this.stringProperties.resonance.preferences.simulation
          .solverMethodStringProperty,
      solverDescriptionStringProperty:
        this.stringProperties.resonance.preferences.simulation
          .solverDescriptionStringProperty,
      odeSolverStringProperty:
        this.stringProperties.resonance.preferences.simulation
          .odeSolverStringProperty,
    };
  }

  /**
   * Get solver name string properties
   */
  public getSolverNames() {
    return {
      rk4StringProperty:
        this.stringProperties.resonance.preferences.simulation
          .solverRK4StringProperty,
      adaptiveRK45StringProperty:
        this.stringProperties.resonance.preferences.simulation
          .solverAdaptiveRK45StringProperty,
      adaptiveEulerStringProperty:
        this.stringProperties.resonance.preferences.simulation
          .solverAdaptiveEulerStringProperty,
      modifiedMidpointStringProperty:
        this.stringProperties.resonance.preferences.simulation
          .solverModifiedMidpointStringProperty,
    };
  }

  /**
   * Get solver description string properties
   */
  public getSolverDescriptions() {
    return {
      rk4DescriptionStringProperty:
        this.stringProperties.resonance.preferences.simulation
          .solverRK4DescriptionStringProperty,
      adaptiveRK45DescriptionStringProperty:
        this.stringProperties.resonance.preferences.simulation
          .solverAdaptiveRK45DescriptionStringProperty,
      adaptiveEulerDescriptionStringProperty:
        this.stringProperties.resonance.preferences.simulation
          .solverAdaptiveEulerDescriptionStringProperty,
      modifiedMidpointDescriptionStringProperty:
        this.stringProperties.resonance.preferences.simulation
          .solverModifiedMidpointDescriptionStringProperty,
    };
  }

  /**
   * Get localization preferences string properties
   */
  public getLocalizationPreferencesLabels() {
    return {
      titleStringProperty:
        this.stringProperties.resonance.preferences.localization
          .titleStringProperty,
      languageStringProperty:
        this.stringProperties.resonance.preferences.localization
          .languageStringProperty,
    };
  }

  /**
   * Get content string properties
   */
  public getContentLabels() {
    return {
      sampleTextStringProperty:
        this.stringProperties.resonance.content.sampleTextStringProperty,
    };
  }

  /**
   * Get preset name string properties
   */
  public getPresetNames() {
    return {
      lightAndBouncyStringProperty:
        this.stringProperties.resonance.presets.lightAndBouncyStringProperty,
      heavyAndSlowStringProperty:
        this.stringProperties.resonance.presets.heavyAndSlowStringProperty,
      underdampedStringProperty:
        this.stringProperties.resonance.presets.underdampedStringProperty,
      criticallyDampedStringProperty:
        this.stringProperties.resonance.presets.criticallyDampedStringProperty,
      overdampedStringProperty:
        this.stringProperties.resonance.presets.overdampedStringProperty,
      resonanceDemoStringProperty:
        this.stringProperties.resonance.presets.resonanceDemoStringProperty,
    };
  }

  /**
   * Get common solver name string properties (for use in model code)
   */
  public getCommonSolverNames() {
    return {
      solverRK4StringProperty:
        this.stringProperties.resonance.common.solverRK4StringProperty,
      solverAdaptiveRK45StringProperty:
        this.stringProperties.resonance.common.solverAdaptiveRK45StringProperty,
      solverAdaptiveEulerStringProperty:
        this.stringProperties.resonance.common
          .solverAdaptiveEulerStringProperty,
      solverModifiedMidpointStringProperty:
        this.stringProperties.resonance.common
          .solverModifiedMidpointStringProperty,
    };
  }

  /**
   * Get unit string properties
   */
  public getUnitLabels() {
    return {
      hertzPatternStringProperty:
        this.stringProperties.resonance.units.hertzPatternStringProperty,
      cmPatternStringProperty:
        this.stringProperties.resonance.units.cmPatternStringProperty,
      kgPatternStringProperty:
        this.stringProperties.resonance.units.kgPatternStringProperty,
      newtonPerMeterPatternStringProperty:
        this.stringProperties.resonance.units
          .newtonPerMeterPatternStringProperty,
      dampingUnitsPatternStringProperty:
        this.stringProperties.resonance.units.dampingUnitsPatternStringProperty,
      cmStringProperty: this.stringProperties.resonance.units.cmStringProperty,
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
