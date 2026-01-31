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
  public readonly positionProperty: NumberProperty; // displacement from natural length (m, positive = downward)
  public readonly velocityProperty: NumberProperty; // velocity (m/s, positive = downward)

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

  public constructor(preferencesModel: {
    solverTypeProperty: Property<SolverType>;
  }) {
    super(preferencesModel.solverTypeProperty);

    // Initialize state variables
    this.positionProperty = new NumberProperty(0.0); // Start at equilibrium (natural length)
    this.velocityProperty = new NumberProperty(0.0); // Start at rest
    this.isDraggingProperty = new BooleanProperty(false); // Not being dragged initially

    // Initialize physical parameters with reasonable defaults
    this.massProperty = new NumberProperty(0.25); // 0.25 kg - reasonable for small oscillator
    this.springConstantProperty = new NumberProperty(100.0); // 100 N/m - gives ~3.2 Hz natural frequency
    this.dampingProperty = new NumberProperty(0.5); // 0.5 N/(m/s) - light damping
    this.gravityProperty = new NumberProperty(0); // Start with no gravity
    this.naturalLengthProperty = new NumberProperty(0.2); // 20 cm natural length

    // Initialize driving force parameters
    this.drivingAmplitudeProperty = new NumberProperty(0.01); // 1 cm (in meters)
    this.drivingFrequencyProperty = new NumberProperty(1.0); // Start at 1.0 Hz
    this.drivingEnabledProperty = new Property<boolean>(true); // Enabled by default
    this.drivingPhaseProperty = new NumberProperty(0.0); // Start at zero phase

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

    // Compute potential energy: PE = ½kx² - mgx
    // (Spring potential + gravitational potential with reference at natural length)
    this.potentialEnergyProperty = new DerivedProperty(
      [
        this.springConstantProperty,
        this.positionProperty,
        this.massProperty,
        this.gravityProperty,
      ],
      (k: number, x: number, m: number, g: number) =>
        0.5 * k * x * x - m * g * x,
    );

    // Compute total energy: E = KE + PE
    this.totalEnergyProperty = new DerivedProperty(
      [this.kineticEnergyProperty, this.potentialEnergyProperty],
      (ke: number, pe: number) => ke + pe,
    );

    // Compute phase angle between displacement and driving force
    // This is a simplified calculation - for accurate phase, we'd need to track
    // the driving force phase and compare with displacement
    this.phaseAngleProperty = new DerivedProperty(
      [
        this.drivingFrequencyProperty,
        this.naturalFrequencyProperty,
        this.dampingRatioProperty,
        this.drivingEnabledProperty,
      ],
      (omega: number, omega0: number, zeta: number, enabled: boolean) => {
        if (!enabled) return 0;

        // Theoretical phase lag: φ = arctan(2ζω/(ω₀²-ω²))
        const omegaRad = omega * 2 * Math.PI;
        const numerator = 2 * zeta * omegaRad * omega0;
        const denominator = omega0 * omega0 - omegaRad * omegaRad;

        // Handle resonance case (denominator near zero)
        if (Math.abs(denominator) < 0.001) {
          return Math.PI / 2;
        }

        return Math.atan(numerator / denominator);
      },
    );
  }

  /**
   * Get the current state vector [position, velocity, drivingPhase]
   */
  public override getState(): number[] {
    return [
      this.positionProperty.value,
      this.velocityProperty.value,
      this.drivingPhaseProperty.value,
    ];
  }

  /**
   * Set the state vector [position, velocity, drivingPhase]
   */
  public override setState(state: number[]): void {
    this.positionProperty.value = state[0]!;
    this.velocityProperty.value = state[1]!;
    this.drivingPhaseProperty.value = state[2]!;
  }

  /**
   * Get the derivatives [dx/dt, dv/dt, dphase/dt] for the ODE solver
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
    // F_total = -k*x (spring) - b*v (damping) - m*g (gravity, downward) + F_drive
    const acceleration = (-k * x - b * v - m * g + F_drive) / m;

    return [
      v, // dx/dt = v
      acceleration, // dv/dt = a
      phaseDerivative, // dphase/dt = ω
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
  const propertyName =
    `${preset.nameKey}StringProperty`;
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
