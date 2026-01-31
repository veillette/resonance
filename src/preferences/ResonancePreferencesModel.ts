/**
 * PreferencesModel for the Resonance simulation
 * Manages all user preferences including visual, simulation, and localization settings
 */

import { Property, BooleanProperty } from "scenerystack/axon";
import { SolverType } from "../common/model/SolverType.js";

/**
 * Renderer types for the Chladni visualization.
 */
export const RendererType = {
  CANVAS: "canvas",
  WEBGL: "webgl",
} as const;

export type RendererType = (typeof RendererType)[keyof typeof RendererType];

/** Shape of preferences as stored in localStorage (may be partial) */
export interface StoredPreferences {
  showEnergy?: boolean;
  showVectors?: boolean;
  showPhase?: boolean;
  solverType?: SolverType;
  rendererType?: RendererType;
}

export class ResonancePreferencesModel {
  // Simulation preferences
  public readonly showEnergyProperty: BooleanProperty;
  public readonly showVectorsProperty: BooleanProperty;
  public readonly showPhaseProperty: BooleanProperty;
  public readonly solverTypeProperty: Property<SolverType>;

  // Rendering preferences
  public readonly rendererTypeProperty: Property<RendererType>;

  // Localization preferences (handled by SceneryStack's locale system)
  // We don't need a separate property for this as it's managed by joist

  public constructor() {
    // Simulation preferences
    this.showEnergyProperty = new BooleanProperty(true);
    this.showVectorsProperty = new BooleanProperty(false);
    this.showPhaseProperty = new BooleanProperty(true);
    this.solverTypeProperty = new Property<SolverType>(
      SolverType.RUNGE_KUTTA_4,
    );

    // Rendering preferences - default to Canvas
    this.rendererTypeProperty = new Property<RendererType>(RendererType.CANVAS);

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
        const preferences = JSON.parse(saved) as StoredPreferences;

        if (preferences.showEnergy !== undefined) {
          this.showEnergyProperty.value = preferences.showEnergy;
        }
        if (preferences.showVectors !== undefined) {
          this.showVectorsProperty.value = preferences.showVectors;
        }
        if (preferences.showPhase !== undefined) {
          this.showPhaseProperty.value = preferences.showPhase;
        }
        if (preferences.solverType) {
          this.solverTypeProperty.value = preferences.solverType;
        }
        if (preferences.rendererType) {
          this.rendererTypeProperty.value = preferences.rendererType;
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
        showEnergy: this.showEnergyProperty.value,
        showVectors: this.showVectorsProperty.value,
        showPhase: this.showPhaseProperty.value,
        solverType: this.solverTypeProperty.value,
        rendererType: this.rendererTypeProperty.value,
      };
      localStorage.setItem(
        "resonance-preferences",
        JSON.stringify(preferences),
      );
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
    this.showEnergyProperty.link(() => this.savePreferences());
    this.showVectorsProperty.link(() => this.savePreferences());
    this.showPhaseProperty.link(() => this.savePreferences());
    this.solverTypeProperty.link(() => this.savePreferences());
    this.rendererTypeProperty.link(() => this.savePreferences());
  }

  /**
   * Reset all preferences to default values
   */
  public reset(): void {
    this.showEnergyProperty.reset();
    this.showVectorsProperty.reset();
    this.showPhaseProperty.reset();
    this.solverTypeProperty.reset();
    this.rendererTypeProperty.reset();
  }
}
