import { ResonanceModel } from "../../common/model/index.js";
import { OscillatorConfigMode, OscillatorConfigModeType } from "../../common/model/OscillatorConfigMode.js";
import { ResonancePreferencesModel } from "../../preferences/ResonancePreferencesModel.js";
import { Property, NumberProperty } from "scenerystack/axon";
import { TimeSpeed } from "../../common/model/BaseModel.js";

/**
 * Main model for the Resonance simulation.
 *
 * Manages multiple independent ResonanceModel instances (one per oscillator).
 * The oscillator configuration mode determines how masses and spring constants
 * are distributed across oscillators:
 *
 * - SAME_MASS: All share the base mass; spring constants = k, 2k, 3k, ...
 * - SAME_SPRING_CONSTANT: All share the base spring constant; masses = m, 2m, 3m, ...
 * - MIXED: masses = m, 2m, 3m, ...; spring constants = k, 2k, 3k, ...
 */
export class SimModel {
  // The first resonance model acts as the "reference" model that controls
  // drive parameters, damping, gravity, etc. shared across all oscillators.
  public readonly resonanceModel: ResonanceModel;

  // All oscillator models (index 0 is the same as resonanceModel)
  public readonly oscillatorModels: ResonanceModel[];

  // The oscillator configuration mode
  public readonly oscillatorConfigProperty: Property<OscillatorConfigModeType>;

  // Number of active oscillators
  public readonly resonatorCountProperty: NumberProperty;

  // Index of the currently selected resonator for editing (0-indexed)
  public readonly selectedResonatorIndexProperty: NumberProperty;

  private readonly preferencesModel: ResonancePreferencesModel;

  // Maximum number of oscillators supported
  public static readonly MAX_OSCILLATORS = 10;

  public constructor(preferencesModel: ResonancePreferencesModel) {
    this.preferencesModel = preferencesModel;
    this.resonanceModel = new ResonanceModel(preferencesModel);
    this.oscillatorModels = [this.resonanceModel];

    this.oscillatorConfigProperty = new Property<OscillatorConfigModeType>(
      OscillatorConfigMode.SAME_MASS
    );

    this.resonatorCountProperty = new NumberProperty(1);
    this.selectedResonatorIndexProperty = new NumberProperty(0); // Start with first resonator selected

    // Pre-create all oscillator models
    for (let i = 1; i < SimModel.MAX_OSCILLATORS; i++) {
      const model = new ResonanceModel(preferencesModel);
      this.oscillatorModels.push(model);
    }

    // Sync shared parameters from the reference model to all others
    this.syncSharedParameters();

    // When config mode changes, recalculate per-oscillator parameters
    this.oscillatorConfigProperty.link(() => {
      this.updateOscillatorParameters();
    });

    // When resonator count changes, recalculate parameters and clamp selected index
    this.resonatorCountProperty.link((count: number) => {
      this.updateOscillatorParameters();
      // Clamp selected resonator index to valid range [0, count-1]
      if (this.selectedResonatorIndexProperty.value >= count) {
        this.selectedResonatorIndexProperty.value = count - 1;
      }
    });

    // When base mass or spring constant changes, recalculate
    this.resonanceModel.massProperty.link(() => {
      this.updateOscillatorParameters();
    });

    this.resonanceModel.springConstantProperty.link(() => {
      this.updateOscillatorParameters();
    });
  }

  /**
   * Keep shared parameters (driving force, damping, gravity) in sync
   * across all oscillator models.
   */
  private syncSharedParameters(): void {
    const ref = this.resonanceModel;

    for (let i = 1; i < this.oscillatorModels.length; i++) {
      const model = this.oscillatorModels[i];

      // Sync driving parameters
      ref.drivingEnabledProperty.link((enabled: boolean) => {
        model.drivingEnabledProperty.value = enabled;
      });
      ref.drivingFrequencyProperty.link((freq: number) => {
        model.drivingFrequencyProperty.value = freq;
      });
      ref.drivingAmplitudeProperty.link((amp: number) => {
        model.drivingAmplitudeProperty.value = amp;
      });

      // Sync damping
      ref.dampingProperty.link((damping: number) => {
        model.dampingProperty.value = damping;
      });

      // Sync gravity
      ref.gravityProperty.link((gravity: number) => {
        model.gravityProperty.value = gravity;
      });

      // Sync time management
      ref.isPlayingProperty.link((playing: boolean) => {
        model.isPlayingProperty.value = playing;
      });
      ref.timeSpeedProperty.link((speed: TimeSpeed) => {
        model.timeSpeedProperty.value = speed;
      });
    }
  }

  /**
   * Update per-oscillator mass and spring constant based on the current
   * configuration mode and the reference model's base values.
   */
  private updateOscillatorParameters(): void {
    const mode = this.oscillatorConfigProperty.value;
    const baseMass = this.resonanceModel.massProperty.value;
    const baseK = this.resonanceModel.springConstantProperty.value;
    const count = this.resonatorCountProperty.value;

    for (let i = 1; i < count; i++) {
      const model = this.oscillatorModels[i];
      const multiplier = i + 1; // 2, 3, 4, ...

      switch (mode) {
        case OscillatorConfigMode.SAME_MASS:
          // Same mass, increasing spring constants
          model.massProperty.value = baseMass;
          model.springConstantProperty.value = baseK * multiplier;
          break;

        case OscillatorConfigMode.SAME_SPRING_CONSTANT:
          // Same spring constant, increasing masses
          model.springConstantProperty.value = baseK;
          model.massProperty.value = baseMass * multiplier;
          break;

        case OscillatorConfigMode.MIXED:
          // Both vary: masses increase, spring constants increase
          model.massProperty.value = baseMass * multiplier;
          model.springConstantProperty.value = baseK * multiplier;
          break;

        case OscillatorConfigMode.SAME_FREQUENCY:
          // Same natural frequency: ω₀ = √(k/m) remains constant
          // Keep k/m ratio constant by scaling both proportionally
          model.massProperty.value = baseMass * multiplier;
          model.springConstantProperty.value = baseK * multiplier;
          break;

        case OscillatorConfigMode.CUSTOM:
          // Custom mode: don't modify values, user sets them manually
          // Parameters remain as they are
          break;
      }
    }
  }

  /**
   * Get the mass for a given oscillator index.
   */
  public getMass(index: number): number {
    return this.oscillatorModels[index].massProperty.value;
  }

  /**
   * Get the spring constant for a given oscillator index.
   */
  public getSpringConstant(index: number): number {
    return this.oscillatorModels[index].springConstantProperty.value;
  }

  /**
   * Get the natural frequency (Hz) for a given oscillator index.
   */
  public getNaturalFrequencyHz(index: number): number {
    return this.oscillatorModels[index].naturalFrequencyHzProperty.value;
  }

  public reset(): void {
    this.oscillatorConfigProperty.reset();
    this.resonatorCountProperty.reset();
    this.selectedResonatorIndexProperty.reset();
    for (const model of this.oscillatorModels) {
      model.reset();
    }
  }

  public step(dt: number): void {
    const count = this.resonatorCountProperty.value;
    // Step all active oscillator models. Since isPlayingProperty and
    // timeSpeedProperty are synced, they will all advance the same amount.
    for (let i = 0; i < count; i++) {
      this.oscillatorModels[i].step(dt);
    }
  }
}
