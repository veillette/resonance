/**
 * ResonanceModel - Spring-mass system with damping and displacement-driven base
 *
 * This model simulates a mass attached to a vertical spring with a moving base:
 * - Driver base position: y_driver = A*sin(ω*t)
 * - Spring restoring force (Hooke's Law): F_spring = -k*(x - y_driver)
 * - Damping force (linear): F_damping = -b*v
 * - Gravitational force: F_gravity = m*g
 *
 * Equation of motion:
 * m*a = -k*x - b*v + m*g + k*A*sin(ω*t)
 *
 * The effective driving force is k*A*sin(ω*t) where A is the driver amplitude.
 * This model is designed to explore resonance phenomena by varying
 * the driving frequency relative to the natural frequency.
 */

import {
  NumberProperty,
  Property,
  BooleanProperty,
  DerivedProperty,
  TReadOnlyProperty,
  ReadOnlyProperty,
} from "scenerystack/axon";
import { BaseModel } from "./BaseModel.js";
import { SolverType } from "./SolverType.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";

export class ResonanceModel extends BaseModel {
  // State variables
  public readonly positionProperty: NumberProperty; // displacement from equilibrium (m, positive = upward)
  public readonly velocityProperty: NumberProperty; // velocity (m/s, positive = upward)

  // Drag state - when true, this resonator is being dragged by the user
  // and should not be updated by the physics simulation
  public readonly isDraggingProperty: BooleanProperty;

  // Physical parameters
  public readonly massProperty: NumberProperty; // mass (kg)
  public readonly springConstantProperty: NumberProperty; // spring constant (N/m)
  public readonly dampingProperty: NumberProperty; // damping coefficient (N·s/m)
  public readonly gravityProperty: NumberProperty; // gravitational acceleration (m/s²)
  public readonly naturalLengthProperty: NumberProperty; // natural length of spring (m)

  // Driving force parameters
  public readonly drivingAmplitudeProperty: NumberProperty; // driving displacement amplitude (m)
  public readonly drivingFrequencyProperty: NumberProperty; // driving frequency (Hz)
  public readonly drivingEnabledProperty: Property<boolean>; // whether driving force is enabled
  public readonly drivingPhaseProperty: NumberProperty; // accumulated phase (radians) for phase-continuous frequency changes

  // Derived properties
  public readonly naturalFrequencyProperty: TReadOnlyProperty<number>; // ω₀ = √(k/m) (rad/s)
  public readonly dampingRatioProperty: TReadOnlyProperty<number>; // ζ = b/(2√(mk))
  public readonly naturalFrequencyHzProperty: TReadOnlyProperty<number>; // f₀ = ω₀/(2π) (Hz)

  // Energy properties
  public readonly kineticEnergyProperty: TReadOnlyProperty<number>; // KE = ½mv²
  public readonly potentialEnergyProperty: TReadOnlyProperty<number>; // PE = ½kx² - mgx
  public readonly totalEnergyProperty: TReadOnlyProperty<number>; // E = KE + PE

  // Phase relationship (angle between displacement and driving force)
  public readonly phaseAngleProperty: TReadOnlyProperty<number>; // radians

  // Steady-state amplitudes
  public readonly displacementAmplitudeProperty: TReadOnlyProperty<number>; // meters
  public readonly velocityAmplitudeProperty: TReadOnlyProperty<number>; // m/s
  public readonly accelerationAmplitudeProperty: TReadOnlyProperty<number>; // m/s²
  public readonly forceAmplitudeProperty: TReadOnlyProperty<number>; // N (driving force amplitude)

  // Instantaneous dynamic quantities
  public readonly accelerationProperty: TReadOnlyProperty<number>; // m/s² (instantaneous)
  public readonly appliedForceProperty: TReadOnlyProperty<number>; // N (instantaneous driving force)
  public readonly springPotentialEnergyProperty: TReadOnlyProperty<number>; // J (½kx², without gravity)

  // Instantaneous individual forces
  public readonly springForceProperty: TReadOnlyProperty<number>; // N (-k*x)
  public readonly dampingForceProperty: TReadOnlyProperty<number>; // N (-b*v)
  public readonly netForceProperty: TReadOnlyProperty<number>; // N (m*a)

  // Additional energy
  public readonly gravitationalPotentialEnergyProperty: TReadOnlyProperty<number>; // J (m*g*x)
  public readonly dampingPowerProperty: TReadOnlyProperty<number>; // W (-b*v², power dissipated)
  public readonly drivingPowerProperty: TReadOnlyProperty<number>; // W (F_drive*v, power input from driver)
  public readonly springPowerProperty: TReadOnlyProperty<number>; // W (-kxv, spring energy exchange rate)
  public readonly gravitationalPowerProperty: TReadOnlyProperty<number>; // W (-mgv, gravitational energy exchange rate)

  // Cumulative energy quantities (integrated via ODE solver)
  public readonly driverEnergyProperty: NumberProperty; // J (∫ F_drive · v dt, total work done by driver)
  public readonly thermalEnergyProperty: NumberProperty; // J (∫ b·v² dt, total energy dissipated as heat)

  // Driver and dimensionless ratios
  public readonly driverPositionProperty: TReadOnlyProperty<number>; // m (A*sin(phase))
  public readonly frequencyRatioProperty: TReadOnlyProperty<number>; // ω/ω₀ (dimensionless)
  public readonly amplitudeRatioProperty: TReadOnlyProperty<number>; // X₀/(F₀/k) magnification factor

  // Phase relationships (radians, relative to driving force)
  public readonly displacementPhaseProperty: TReadOnlyProperty<number>; // same as phaseAngleProperty
  public readonly velocityPhaseProperty: TReadOnlyProperty<number>; // displacement phase - π/2
  public readonly accelerationPhaseProperty: TReadOnlyProperty<number>; // displacement phase - π
  public readonly appliedForcePhaseProperty: TReadOnlyProperty<number>; // always 0 (reference)

  public constructor(preferencesModel: {
    solverTypeProperty: Property<SolverType>;
  }) {
    super(preferencesModel.solverTypeProperty);

    // Initialize state variables
    this.positionProperty = new NumberProperty(0.0); // Start at equilibrium (natural length)
    this.velocityProperty = new NumberProperty(0.0); // Start at rest
    this.isDraggingProperty = new BooleanProperty(false); // Not being dragged initially

    // Initialize physical parameters with reasonable defaults
    this.massProperty = new NumberProperty(2.53); // 2.53 kg
    this.springConstantProperty = new NumberProperty(100.0); // 100 N/m
    this.dampingProperty = new NumberProperty(1.0); // 1.0 N/(m/s)
    this.gravityProperty = new NumberProperty(0); // Start with no gravity
    this.naturalLengthProperty = new NumberProperty(0.2); // 20 cm natural length

    // Initialize driving force parameters
    this.drivingAmplitudeProperty = new NumberProperty(0.005); // 0.5 cm (in meters)
    this.drivingFrequencyProperty = new NumberProperty(1.0); // Start at 1.0 Hz
    this.drivingEnabledProperty = new Property<boolean>(false); // Disabled by default
    this.drivingPhaseProperty = new NumberProperty(0.0); // Start at zero phase

    // Initialize cumulative energy accumulators (integrated by the ODE solver)
    this.driverEnergyProperty = new NumberProperty(0.0); // Cumulative work done by driver
    this.thermalEnergyProperty = new NumberProperty(0.0); // Cumulative energy dissipated as heat

    // Compute natural frequency: ω₀ = √(k/m)
    this.naturalFrequencyProperty = new DerivedProperty(
      [this.springConstantProperty, this.massProperty],
      (k: number, m: number) => Math.sqrt(k / m),
    );

    // Compute natural frequency in Hz: f₀ = ω₀/(2π)
    this.naturalFrequencyHzProperty = new DerivedProperty(
      [this.naturalFrequencyProperty],
      (omega0: number) => omega0 / (2 * Math.PI),
    );

    // Compute damping ratio: ζ = b/(2√(mk))
    this.dampingRatioProperty = new DerivedProperty(
      [this.dampingProperty, this.massProperty, this.springConstantProperty],
      (b: number, m: number, k: number) => b / (2 * Math.sqrt(m * k)),
    );

    // Compute kinetic energy: KE = ½mv²
    this.kineticEnergyProperty = new DerivedProperty(
      [this.massProperty, this.velocityProperty],
      (m: number, v: number) => 0.5 * m * v * v,
    );

    // Compute potential energy: PE = ½kx² + mgx
    // (Spring potential + gravitational potential with reference at equilibrium)
    // With positive x = upward, gravitational PE increases with height: U_g = mgx
    this.potentialEnergyProperty = new DerivedProperty(
      [
        this.springConstantProperty,
        this.positionProperty,
        this.massProperty,
        this.gravityProperty,
      ],
      (k: number, x: number, m: number, g: number) =>
        0.5 * k * x * x + m * g * x,
    );

    // Compute total energy: E = KE + PE
    this.totalEnergyProperty = new DerivedProperty(
      [this.kineticEnergyProperty, this.potentialEnergyProperty],
      (ke: number, pe: number) => ke + pe,
    );

    // Compute instantaneous acceleration: a = (-k*x - b*v - m*g + F_drive) / m
    this.accelerationProperty = new DerivedProperty(
      [
        this.springConstantProperty,
        this.positionProperty,
        this.dampingProperty,
        this.velocityProperty,
        this.massProperty,
        this.gravityProperty,
        this.drivingAmplitudeProperty,
        this.drivingPhaseProperty,
        this.drivingEnabledProperty,
      ],
      (
        k: number,
        x: number,
        b: number,
        v: number,
        m: number,
        g: number,
        A: number,
        phase: number,
        enabled: boolean,
      ) => {
        const F_drive = enabled ? k * A * Math.sin(phase) : 0;
        return (-k * x - b * v - m * g + F_drive) / m;
      },
    );

    // Compute instantaneous applied (driving) force: F = k * A * sin(phase)
    this.appliedForceProperty = new DerivedProperty(
      [
        this.springConstantProperty,
        this.drivingAmplitudeProperty,
        this.drivingPhaseProperty,
        this.drivingEnabledProperty,
      ],
      (k: number, A: number, phase: number, enabled: boolean) => {
        if (!enabled) return 0;
        return k * A * Math.sin(phase);
      },
    );

    // Compute spring potential energy only (without gravity): PE_spring = ½kx²
    this.springPotentialEnergyProperty = new DerivedProperty(
      [this.springConstantProperty, this.positionProperty],
      (k: number, x: number) => 0.5 * k * x * x,
    );

    // Compute instantaneous spring force: F_spring = -k * x
    this.springForceProperty = new DerivedProperty(
      [this.springConstantProperty, this.positionProperty],
      (k: number, x: number) => -k * x,
    );

    // Compute instantaneous damping force: F_damping = -b * v
    this.dampingForceProperty = new DerivedProperty(
      [this.dampingProperty, this.velocityProperty],
      (b: number, v: number) => -b * v,
    );

    // Compute instantaneous net force: F_net = m * a
    this.netForceProperty = new DerivedProperty(
      [this.massProperty, this.accelerationProperty],
      (m: number, a: number) => m * a,
    );

    // Compute gravitational potential energy: U_grav = m * g * x
    this.gravitationalPotentialEnergyProperty = new DerivedProperty(
      [this.massProperty, this.gravityProperty, this.positionProperty],
      (m: number, g: number, x: number) => m * g * x,
    );

    // Compute power dissipated by damping: P = -b * v² (always non-positive)
    this.dampingPowerProperty = new DerivedProperty(
      [this.dampingProperty, this.velocityProperty],
      (b: number, v: number) => -b * v * v,
    );

    // Compute power injected by the driving force: P_drive = F_drive * v
    this.drivingPowerProperty = new DerivedProperty(
      [this.appliedForceProperty, this.velocityProperty],
      (F: number, v: number) => F * v,
    );

    // Compute spring power: P_spring = F_spring * v = -k * x * v
    // Positive when spring releases energy (restoring toward equilibrium), negative when storing
    this.springPowerProperty = new DerivedProperty(
      [this.springForceProperty, this.velocityProperty],
      (F: number, v: number) => F * v,
    );

    // Compute gravitational power: P_grav = F_grav * v = -m * g * v
    // Rate of energy exchange with gravitational field (zero when gravity is off)
    this.gravitationalPowerProperty = new DerivedProperty(
      [this.massProperty, this.gravityProperty, this.velocityProperty],
      (m: number, g: number, v: number) => -m * g * v,
    );

    // Compute driver plate position: x_driver = A * sin(phase)
    this.driverPositionProperty = new DerivedProperty(
      [
        this.drivingAmplitudeProperty,
        this.drivingPhaseProperty,
        this.drivingEnabledProperty,
      ],
      (A: number, phase: number, enabled: boolean) => {
        if (!enabled) return 0;
        return A * Math.sin(phase);
      },
    );

    // Compute frequency ratio: ω / ω₀ (driving frequency / natural frequency)
    this.frequencyRatioProperty = new DerivedProperty(
      [this.drivingFrequencyProperty, this.naturalFrequencyHzProperty],
      (fDrive: number, fNatural: number) => {
        if (fNatural < 1e-10) return 0;
        return fDrive / fNatural;
      },
    );

    // Compute phase angle between displacement and driving force
    // Phase lag formula: φ = arctan(bω / (k - mω²))
    // When ω < ω₀: φ is small (displacement nearly in phase with force)
    // When ω = ω₀: φ = π/2 (displacement lags by 90°)
    // When ω > ω₀: φ approaches π (displacement nearly opposite to force)
    this.phaseAngleProperty = new DerivedProperty(
      [
        this.drivingFrequencyProperty,
        this.springConstantProperty,
        this.massProperty,
        this.dampingProperty,
        this.drivingEnabledProperty,
      ],
      (freqHz: number, k: number, m: number, b: number, enabled: boolean) => {
        if (!enabled) return 0;

        const omega = freqHz * 2 * Math.PI; // Convert Hz to rad/s
        const numerator = b * omega;
        const denominator = k - m * omega * omega;

        // Handle resonance case (denominator near zero)
        if (Math.abs(denominator) < 1e-10) {
          return Math.PI / 2;
        }

        // atan2 gives us the correct quadrant
        // For ω < ω₀: denominator > 0, phase is small positive
        // For ω > ω₀: denominator < 0, we need phase to approach π
        let phase = Math.atan(numerator / denominator);

        // When denominator is negative (ω > ω₀), we need to add π to get phase in (π/2, π)
        if (denominator < 0) {
          phase += Math.PI;
        }

        return phase;
      },
    );

    // Displacement phase is the same as phase angle (for compatibility)
    this.displacementPhaseProperty = this.phaseAngleProperty;

    // Steady-state displacement amplitude: X₀ = kA / √[(k - mω²)² + (bω)²]
    // where A is the driver amplitude and k*A is the driving force amplitude
    this.displacementAmplitudeProperty = new DerivedProperty(
      [
        this.drivingAmplitudeProperty,
        this.drivingFrequencyProperty,
        this.springConstantProperty,
        this.massProperty,
        this.dampingProperty,
        this.drivingEnabledProperty,
      ],
      (
        A: number,
        freqHz: number,
        k: number,
        m: number,
        b: number,
        enabled: boolean,
      ) => {
        if (!enabled) return 0;

        const omega = freqHz * 2 * Math.PI;
        const F0 = k * A; // Driving force amplitude
        const term1 = k - m * omega * omega;
        const term2 = b * omega;
        const denominator = Math.sqrt(term1 * term1 + term2 * term2);

        if (denominator < 1e-10) {
          // At exact resonance with zero damping, amplitude would be infinite
          // Return a large but finite value
          return F0 / 1e-10;
        }

        return F0 / denominator;
      },
    );

    // Velocity amplitude: A_v = ω × X₀
    this.velocityAmplitudeProperty = new DerivedProperty(
      [this.displacementAmplitudeProperty, this.drivingFrequencyProperty],
      (X0: number, freqHz: number) => {
        const omega = freqHz * 2 * Math.PI;
        return omega * X0;
      },
    );

    // Acceleration amplitude: A_a = ω² × X₀
    this.accelerationAmplitudeProperty = new DerivedProperty(
      [this.displacementAmplitudeProperty, this.drivingFrequencyProperty],
      (X0: number, freqHz: number) => {
        const omega = freqHz * 2 * Math.PI;
        return omega * omega * X0;
      },
    );

    // Driving force amplitude: F₀ = k × A (spring constant × driver amplitude)
    this.forceAmplitudeProperty = new DerivedProperty(
      [
        this.springConstantProperty,
        this.drivingAmplitudeProperty,
        this.drivingEnabledProperty,
      ],
      (k: number, A: number, enabled: boolean) => {
        if (!enabled) return 0;
        return k * A;
      },
    );

    // Compute amplitude ratio (magnification factor): X₀ / A_static
    // where A_static = F₀ / k = A (the static deflection under driving force amplitude)
    this.amplitudeRatioProperty = new DerivedProperty(
      [this.displacementAmplitudeProperty, this.drivingAmplitudeProperty, this.drivingEnabledProperty],
      (X0: number, A: number, enabled: boolean) => {
        if (!enabled || A < 1e-15) return 0;
        return X0 / A;
      },
    );

    // Velocity phase: leads displacement by 90° (π/2)
    // Since x(t) = X₀ cos(ωt - φ), v(t) = -ωX₀ sin(ωt - φ) = ωX₀ cos(ωt - φ + π/2)
    // So velocity phase relative to driving force = φ - π/2
    this.velocityPhaseProperty = new DerivedProperty(
      [this.displacementPhaseProperty],
      (displacementPhase: number) => {
        // Normalize to [-π, π]
        let phase = displacementPhase - Math.PI / 2;
        while (phase < -Math.PI) phase += 2 * Math.PI;
        while (phase > Math.PI) phase -= 2 * Math.PI;
        return phase;
      },
    );

    // Acceleration phase: leads displacement by 180° (π)
    // Since a(t) = -ω²X₀ cos(ωt - φ) = ω²X₀ cos(ωt - φ + π)
    // So acceleration phase relative to driving force = φ - π
    this.accelerationPhaseProperty = new DerivedProperty(
      [this.displacementPhaseProperty],
      (displacementPhase: number) => {
        // Normalize to [-π, π]
        let phase = displacementPhase - Math.PI;
        while (phase < -Math.PI) phase += 2 * Math.PI;
        while (phase > Math.PI) phase -= 2 * Math.PI;
        return phase;
      },
    );

    // Applied force phase: always 0 (this is our reference)
    // The driving force is F(t) = F₀ sin(ωt) or F₀ cos(ωt)
    this.appliedForcePhaseProperty = new DerivedProperty(
      [this.drivingEnabledProperty],
      (_enabled: boolean) => 0,
    );
  }

  /**
   * Get the current state vector [position, velocity, drivingPhase, driverEnergy, thermalEnergy]
   */
  public override getState(): number[] {
    return [
      this.positionProperty.value,
      this.velocityProperty.value,
      this.drivingPhaseProperty.value,
      this.driverEnergyProperty.value,
      this.thermalEnergyProperty.value,
    ];
  }

  /**
   * Set the state vector [position, velocity, drivingPhase, driverEnergy, thermalEnergy]
   */
  public override setState(state: number[]): void {
    this.positionProperty.value = state[0]!;
    this.velocityProperty.value = state[1]!;
    this.drivingPhaseProperty.value = state[2]!;
    this.driverEnergyProperty.value = state[3]!;
    this.thermalEnergyProperty.value = state[4]!;
  }

  // ============================================
  // Phase getter methods (radians, relative to driving force)
  // ============================================

  /**
   * Get the phase of displacement relative to the driving force.
   * Range: [0, π] where 0 = in phase, π/2 = at resonance, π = anti-phase
   */
  public getDisplacementPhase(): number {
    return this.displacementPhaseProperty.value;
  }

  /**
   * Get the phase of velocity relative to the driving force.
   * Velocity leads displacement by 90° (π/2).
   */
  public getVelocityPhase(): number {
    return this.velocityPhaseProperty.value;
  }

  /**
   * Get the phase of acceleration relative to the driving force.
   * Acceleration leads displacement by 180° (π).
   */
  public getAccelerationPhase(): number {
    return this.accelerationPhaseProperty.value;
  }

  /**
   * Get the phase of the applied (driving) force.
   * This is always 0 as it serves as the reference phase.
   */
  public getAppliedForcePhase(): number {
    return this.appliedForcePhaseProperty.value;
  }

  // ============================================
  // Amplitude getter methods (steady-state values)
  // ============================================

  /**
   * Get the steady-state displacement amplitude (meters).
   * X₀ = F₀ / √[(k - mω²)² + (bω)²]
   */
  public getDisplacementAmplitude(): number {
    return this.displacementAmplitudeProperty.value;
  }

  /**
   * Get the steady-state velocity amplitude (m/s).
   * A_v = ω × X₀
   */
  public getVelocityAmplitude(): number {
    return this.velocityAmplitudeProperty.value;
  }

  /**
   * Get the steady-state acceleration amplitude (m/s²).
   * A_a = ω² × X₀
   */
  public getAccelerationAmplitude(): number {
    return this.accelerationAmplitudeProperty.value;
  }

  /**
   * Get the driving force amplitude (N).
   * F₀ = k × A (spring constant × driver amplitude)
   */
  public getForceAmplitude(): number {
    return this.forceAmplitudeProperty.value;
  }

  /**
   * Get the derivatives [dx/dt, dv/dt, dphase/dt, dDriverEnergy/dt, dThermalEnergy/dt]
   *
   * For a displacement-driven oscillator where the driver base moves sinusoidally:
   * - Driver position: y_driver = A * sin(phase)
   * - Spring extension: (x - y_driver)
   * - Spring force: F_spring = -k * (x - y_driver) = -k*x + k*A*sin(phase)
   *
   * Equation of motion:
   * dx/dt = v
   * dv/dt = (-k*x - b*v + m*g + k*A*sin(phase)) / m
   * dphase/dt = ω (angular frequency of driving force)
   * dDriverEnergy/dt = F_drive * v (instantaneous power input from driver)
   * dThermalEnergy/dt = b * v² (instantaneous power dissipated as heat)
   *
   * Using phase instead of time ensures smooth frequency changes
   */
  public override getDerivatives(t: number, state: number[]): number[] {
    const x = state[0]!; // position (displacement from equilibrium)
    const v = state[1]!; // velocity
    const phase = state[2]!; // driving phase

    const m = this.massProperty.value;
    const k = this.springConstantProperty.value;
    const b = this.dampingProperty.value;
    const g = this.gravityProperty.value;

    // Calculate driving force using phase for smooth frequency changes
    // For displacement-driven oscillator: F_drive = k * A * sin(phase)
    // where A is the driver amplitude (displacement in meters)
    let F_drive = 0;
    let phaseDerivative = 0;
    if (this.drivingEnabledProperty.value) {
      const A = this.drivingAmplitudeProperty.value; // Driver amplitude in meters
      const omega = this.drivingFrequencyProperty.value * 2 * Math.PI; // Convert Hz to rad/s
      F_drive = k * A * Math.sin(phase); // Effective force from moving base
      phaseDerivative = omega; // dphase/dt = ω
    }

    // Calculate acceleration: a = F_total / m
    // F_total = -k*x (spring) - b*v (damping) - m*g (gravity, downward in upward-positive coords) + F_drive
    const acceleration = (-k * x - b * v - m * g + F_drive) / m;

    // Cumulative energy derivatives
    const dDriverEnergy = F_drive * v; // Power input from driver (can be negative)
    const dThermalEnergy = b * v * v; // Power dissipated as heat (always non-negative)

    return [
      v, // dx/dt = v
      acceleration, // dv/dt = a
      phaseDerivative, // dphase/dt = ω
      dDriverEnergy, // dDriverEnergy/dt = F_drive * v
      dThermalEnergy, // dThermalEnergy/dt = b * v²
    ];
  }

  /**
   * Reset the model to initial conditions
   */
  public override reset(): void {
    // Reset state
    this.positionProperty.reset();
    this.velocityProperty.reset();
    this.isDraggingProperty.reset();

    // Reset physical parameters
    this.massProperty.reset();
    this.springConstantProperty.reset();
    this.dampingProperty.reset();
    this.gravityProperty.reset();
    this.naturalLengthProperty.reset();

    // Reset driving force parameters
    this.drivingAmplitudeProperty.reset();
    this.drivingFrequencyProperty.reset();
    this.drivingEnabledProperty.reset();
    this.drivingPhaseProperty.reset();

    // Reset cumulative energy accumulators
    this.driverEnergyProperty.reset();
    this.thermalEnergyProperty.reset();

    // Reset time and playback state
    this.resetCommon();
  }

  /**
   * Set to a preset configuration
   */
  public setPreset(preset: ResonancePreset): void {
    this.massProperty.value = preset.mass;
    this.springConstantProperty.value = preset.springConstant;
    this.dampingProperty.value = preset.damping;
    this.positionProperty.value = preset.initialPosition;
    this.velocityProperty.value = preset.initialVelocity ?? 0;
    this.drivingAmplitudeProperty.value = preset.drivingAmplitude ?? 0.01; // Default 1 cm
    this.drivingFrequencyProperty.value = preset.drivingFrequency ?? 0.5;
  }
}

/**
 * Configuration preset for the resonance model
 */
export type ResonancePreset = {
  nameKey:
    | "lightAndBouncy"
    | "heavyAndSlow"
    | "underdamped"
    | "criticallyDamped"
    | "overdamped"
    | "resonanceDemo"; // Key for localized name
  mass: number; // kg
  springConstant: number; // N/m
  damping: number; // N·s/m
  initialPosition: number; // m
  initialVelocity?: number; // m/s
  drivingAmplitude?: number; // m (displacement amplitude)
  drivingFrequency?: number; // Hz
};

/**
 * Get the localized name for a preset
 */
export function getPresetName(
  preset: ResonancePreset,
): ReadOnlyProperty<string> {
  const propertyName = `${preset.nameKey}StringProperty`;
  const presetsMap = ResonanceStrings.presets as Record<
    string,
    ReadOnlyProperty<string>
  >;
  return presetsMap[propertyName]!;
}

/**
 * Predefined presets demonstrating different damping regimes and resonance
 */
export const ResonancePresets: ResonancePreset[] = [
  {
    nameKey: "lightAndBouncy",
    mass: 0.5,
    springConstant: 50,
    damping: 0.1,
    initialPosition: 1.0,
    drivingAmplitude: 0.01, // 1 cm displacement
    drivingFrequency: 1.6, // Near natural frequency ~1.59 Hz
  },
  {
    nameKey: "heavyAndSlow",
    mass: 5.0,
    springConstant: 5,
    damping: 0.5,
    initialPosition: 1.0,
    drivingAmplitude: 0.015, // 1.5 cm displacement
    drivingFrequency: 0.16, // Near natural frequency ~0.159 Hz
  },
  {
    nameKey: "underdamped",
    mass: 1.0,
    springConstant: 25,
    damping: 2.0, // ζ = 0.2 (underdamped)
    initialPosition: 1.0,
    drivingAmplitude: 0.01, // 1 cm displacement
    drivingFrequency: 0.8, // Near natural frequency ~0.796 Hz
  },
  {
    nameKey: "criticallyDamped",
    mass: 1.0,
    springConstant: 25,
    damping: 10.0, // ζ = 1.0 (critical damping = 2√(mk))
    initialPosition: 1.0,
    drivingAmplitude: 0.01, // 1 cm displacement
    drivingFrequency: 0.8,
  },
  {
    nameKey: "overdamped",
    mass: 1.0,
    springConstant: 25,
    damping: 20.0, // ζ = 2.0 (overdamped)
    initialPosition: 1.0,
    drivingAmplitude: 0.01, // 1 cm displacement
    drivingFrequency: 0.8,
  },
  {
    nameKey: "resonanceDemo",
    mass: 1.0,
    springConstant: 10.0,
    damping: 0.3, // Light damping for clear resonance
    initialPosition: 0.5,
    drivingAmplitude: 0.01, // 1 cm displacement
    drivingFrequency: 0.503, // Exactly at natural frequency √(10/1)/(2π) ≈ 0.503 Hz
  },
];
