/**
 * PreferencesModel for the Resonance simulation
 * Manages all user preferences including visual, simulation, and localization settings
 */

import { Property, StringProperty, BooleanProperty, NumberProperty } from "scenerystack/axon";
import { SolverType } from "../common/model/SolverType.js";

export type ColorProfileType = "default" | "projector" | "colorblind";
export type UnitsType = "metric" | "imperial";

export class ResonancePreferencesModel {
  // Visual preferences
  public readonly colorProfileProperty: Property<ColorProfileType>;
  public readonly contrastProperty: NumberProperty;

  // Simulation preferences
  public readonly showEnergyProperty: BooleanProperty;
  public readonly showVectorsProperty: BooleanProperty;
  public readonly showPhaseProperty: BooleanProperty;
  public readonly unitsProperty: Property<UnitsType>;
  public readonly solverTypeProperty: Property<SolverType>;

  // Localization preferences (handled by SceneryStack's locale system)
  // We don't need a separate property for this as it's managed by joist

  public constructor() {
    // Visual preferences
    this.colorProfileProperty = new Property<ColorProfileType>("default");
    this.contrastProperty = new NumberProperty(1.0);

    // Simulation preferences
    this.showEnergyProperty = new BooleanProperty(true);
    this.showVectorsProperty = new BooleanProperty(false);
    this.showPhaseProperty = new BooleanProperty(true);
    this.unitsProperty = new Property<UnitsType>("metric");
    this.solverTypeProperty = new Property<SolverType>(SolverType.RUNGE_KUTTA_4);

    // Set up persistence
    this.setupPersistence();
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): void {
    try {
      const saved = localStorage.getItem("resonance-preferences");
      if (saved) {
        const preferences = JSON.parse(saved);

        if (preferences.colorProfile) {
          this.colorProfileProperty.value = preferences.colorProfile;
        }
        if (preferences.contrast !== undefined) {
          this.contrastProperty.value = preferences.contrast;
        }
        if (preferences.showEnergy !== undefined) {
          this.showEnergyProperty.value = preferences.showEnergy;
        }
        if (preferences.showVectors !== undefined) {
          this.showVectorsProperty.value = preferences.showVectors;
        }
        if (preferences.showPhase !== undefined) {
          this.showPhaseProperty.value = preferences.showPhase;
        }
        if (preferences.units) {
          this.unitsProperty.value = preferences.units;
        }
        if (preferences.solverType) {
          this.solverTypeProperty.value = preferences.solverType;
        }
      }
    } catch (error) {
      console.warn("Failed to load preferences:", error);
    }
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    try {
      const preferences = {
        colorProfile: this.colorProfileProperty.value,
        contrast: this.contrastProperty.value,
        showEnergy: this.showEnergyProperty.value,
        showVectors: this.showVectorsProperty.value,
        showPhase: this.showPhaseProperty.value,
        units: this.unitsProperty.value,
        solverType: this.solverTypeProperty.value,
      };
      localStorage.setItem("resonance-preferences", JSON.stringify(preferences));
    } catch (error) {
      console.warn("Failed to save preferences:", error);
    }
  }

  /**
   * Set up automatic persistence - save whenever a preference changes
   */
  private setupPersistence(): void {
    // Load saved preferences
    this.loadPreferences();

    // Save whenever any preference changes
    this.colorProfileProperty.link(() => this.savePreferences());
    this.contrastProperty.link(() => this.savePreferences());
    this.showEnergyProperty.link(() => this.savePreferences());
    this.showVectorsProperty.link(() => this.savePreferences());
    this.showPhaseProperty.link(() => this.savePreferences());
    this.unitsProperty.link(() => this.savePreferences());
    this.solverTypeProperty.link(() => this.savePreferences());
  }

  /**
   * Reset all preferences to default values
   */
  public reset(): void {
    this.colorProfileProperty.reset();
    this.contrastProperty.reset();
    this.showEnergyProperty.reset();
    this.showVectorsProperty.reset();
    this.showPhaseProperty.reset();
    this.unitsProperty.reset();
    this.solverTypeProperty.reset();
  }
}
