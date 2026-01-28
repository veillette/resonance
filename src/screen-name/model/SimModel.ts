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
 * are distributed across oscillators.
 *
 * Frequencies are evenly distributed from 1.0 Hz (oscillator 1) to 5.5 Hz (oscillator 10):
 * f_i = 1.0 + (i-1) / (count-1) × (5.5 - 1.0) Hz
 *
 * - SAME_MASS: All oscillators have mass = 1 kg; spring constants calculated to match target frequencies
 * - SAME_SPRING_CONSTANT: All oscillators have k = 200 N/m; masses calculated to match target frequencies
 * - MIXED: Both mass and spring constant scale proportionally (m_i = i×m₁, k_i = i×k₁)
 *   → All frequencies equal (resonance at same frequency)
 * - SAME_FREQUENCY: Same as MIXED (both scale proportionally to maintain constant f)
 * - CUSTOM: User sets all parameters manually
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

  // Flag to prevent circular updates
  private updatingParameters: boolean = false;

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
    // Reset base oscillator to default values for the mode
    this.oscillatorConfigProperty.link(() => {
      this.updateOscillatorParameters(true);
    });

    // When resonator count changes, recalculate parameters and clamp selected index
    this.resonatorCountProperty.link((count: number) => {
      this.updateOscillatorParameters(false);
      // Clamp selected resonator index to valid range [0, count-1]
      if (this.selectedResonatorIndexProperty.value >= count) {
        this.selectedResonatorIndexProperty.value = count - 1;
      }
    });

    // When base mass or spring constant changes, recalculate other oscillators
    // But only if we're in a preset mode (not CUSTOM)
    this.resonanceModel.massProperty.link(() => {
      if (!this.updatingParameters) {
        const mode = this.oscillatorConfigProperty.value;
        // In SAME_MASS or SAME_FREQUENCY/MIXED modes, update when mass changes
        if (mode === OscillatorConfigMode.SAME_MASS ||
            mode === OscillatorConfigMode.MIXED ||
            mode === OscillatorConfigMode.SAME_FREQUENCY) {
          this.updateOscillatorParameters(false);
        }
      }
    });

    this.resonanceModel.springConstantProperty.link(() => {
      if (!this.updatingParameters) {
        const mode = this.oscillatorConfigProperty.value;
        // In SAME_SPRING_CONSTANT or SAME_FREQUENCY/MIXED modes, update when k changes
        if (mode === OscillatorConfigMode.SAME_SPRING_CONSTANT ||
            mode === OscillatorConfigMode.MIXED ||
            mode === OscillatorConfigMode.SAME_FREQUENCY) {
          this.updateOscillatorParameters(false);
        }
      }
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
   *
   * Frequencies are distributed evenly from f_min (oscillator 1) to f_max (last oscillator).
   * Default: 1 Hz to 5.5 Hz for 10 oscillators.
   *
   * @param resetBaseValues - If true, reset the base oscillator to mode-specific defaults
   *                          (1 kg for SAME_MASS, 200 N/m for SAME_SPRING_CONSTANT)
   *                          If false, use current user-set values
   */
  private updateOscillatorParameters(resetBaseValues: boolean = false): void {
    if (this.updatingParameters) return;
    this.updatingParameters = true;

    const mode = this.oscillatorConfigProperty.value;
    const count = this.resonatorCountProperty.value;

    // Target frequency range
    const f_min = 1.0; // Hz
    const f_max = 5.5; // Hz

    // Set base oscillator values when mode changes
    if (resetBaseValues) {
      const omega_min = 2 * Math.PI * f_min;
      if (mode === OscillatorConfigMode.SAME_MASS) {
        // For same mass mode: m = 1 kg, calculate k for f = 1 Hz
        this.resonanceModel.massProperty.value = 1.0;
        this.resonanceModel.springConstantProperty.value = omega_min * omega_min * 1.0;
      } else if (mode === OscillatorConfigMode.SAME_SPRING_CONSTANT) {
        // For same spring constant mode: k = 200 N/m, calculate m for f = 1 Hz
        this.resonanceModel.springConstantProperty.value = 200.0;
        this.resonanceModel.massProperty.value = 200.0 / (omega_min * omega_min);
      }
    }

    // Use the base oscillator's current mass and spring constant as reference
    // The user can adjust these via the control panel, and we calculate others from these values
    const baseMass = this.resonanceModel.massProperty.value;
    const baseK = this.resonanceModel.springConstantProperty.value;

    for (let i = 1; i < count; i++) {
      const model = this.oscillatorModels[i];

      // Calculate target frequency for this oscillator (evenly distributed)
      // f_i = f_min + (i / (count - 1)) × (f_max - f_min)
      const targetFrequency = f_min + (i / (count - 1)) * (f_max - f_min);
      const omega = 2 * Math.PI * targetFrequency; // Angular frequency (rad/s)

      switch (mode) {
        case OscillatorConfigMode.SAME_MASS:
          // Same mass, vary spring constant to achieve target frequency
          // f = (1/2π) × √(k/m)  →  k = (2πf)² × m
          model.massProperty.value = baseMass;
          model.springConstantProperty.value = omega * omega * baseMass;
          break;

        case OscillatorConfigMode.SAME_SPRING_CONSTANT:
          // Same spring constant, vary mass to achieve target frequency
          // f = (1/2π) × √(k/m)  →  m = k / (2πf)²
          model.springConstantProperty.value = baseK;
          model.massProperty.value = baseK / (omega * omega);
          break;

        case OscillatorConfigMode.MIXED: {
          // Both vary: masses increase, spring constants increase proportionally
          // Keep natural frequency constant for all oscillators
          const multiplier = i + 1;
          model.massProperty.value = baseMass * multiplier;
          model.springConstantProperty.value = baseK * multiplier;
          break;
        }

        case OscillatorConfigMode.SAME_FREQUENCY: {
          // Same natural frequency: ω₀ = √(k/m) remains constant
          // Keep k/m ratio constant by scaling both proportionally
          const multiplier2 = i + 1;
          model.massProperty.value = baseMass * multiplier2;
          model.springConstantProperty.value = baseK * multiplier2;
          break;
        }

        case OscillatorConfigMode.CUSTOM:
          // Custom mode: don't modify values, user sets them manually
          // Parameters remain as they are
          break;
      }
    }

    this.updatingParameters = false;
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
