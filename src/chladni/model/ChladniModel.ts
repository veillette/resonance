/**
 * ChladniModel.ts
 *
 * Model for the Chladni plate pattern visualization.
 *
 * Physics:
 * - Chladni patterns form when particles on a vibrating plate migrate to nodal lines
 * - The displacement psi(x, y) is calculated using modal superposition
 * - Particles perform a biased random walk, moving faster in high-displacement regions
 *
 * The wave equation solution uses:
 * - Wave number k = sqrt(frequency / C) where C is the material dispersion constant
 * - Modal superposition over (m, n) modes with m, n = 0, 1, 2, ..., MAX_MODE
 * - For rectangular plate with dimensions a (width) × b (height):
 *   k_{m,n} = π√((m/a)² + (n/b)²)
 * - Damping term gamma = 0.02 / √(a*b) (geometric mean of dimensions)
 *
 * This model coordinates between specialized submodules:
 * - PlateGeometry: Plate dimensions and bounds
 * - ModalCalculator: Physics calculations
 * - ParticleManager: Particle simulation
 * - ResonanceCurveCalculator: Curve precomputation
 * - FrequencySweepController: Sweep functionality
 * - PlaybackStateMachine: Animation state management
 */

import { Property, NumberProperty, Multilink } from "scenerystack/axon";
import { Vector2, Range } from "scenerystack/dot";
import { Material, MaterialType } from "./Material.js";
import { ModalCalculator } from "./ModalCalculator.js";
import { ParticleManager } from "./ParticleManager.js";
import { PlateGeometry } from "./PlateGeometry.js";
import { CircularPlateGeometry } from "./CircularPlateGeometry.js";
import { GuitarPlateGeometry } from "./GuitarPlateGeometry.js";
import { PlateShape, PlateShapeType, DEFAULT_PLATE_SHAPE } from "./PlateShape.js";
import { ModalCalculatorFactory } from "./ModalCalculatorFactory.js";
import type { IModalCalculatorStrategy } from "./IModalCalculatorStrategy.js";
import { ResonanceCurveCalculator } from "./ResonanceCurveCalculator.js";
import { FrequencySweepController } from "./FrequencySweepController.js";
import { PlaybackStateMachine, PlaybackState } from "./PlaybackStateMachine.js";
import {
  BoundaryMode,
  GrainCountOption,
  GRAIN_COUNT_OPTIONS,
  DEFAULT_GRAIN_COUNT,
  FREQUENCY_MIN,
  FREQUENCY_MAX,
  FREQUENCY_DEFAULT,
  DEFAULT_EXCITATION_X,
  DEFAULT_EXCITATION_Y,
  DEFAULT_BOUNDARY_MODE,
} from "./ChladniConstants.js";

// Re-export types for backward compatibility
export type { BoundaryMode, GrainCountOption };
export { GRAIN_COUNT_OPTIONS };

export class ChladniModel {
  // Material selection
  public readonly materialProperty: Property<MaterialType>;

  // Plate shape selection
  public readonly plateShapeProperty: Property<PlateShapeType>;

  // Frequency control - single slider covering full range
  public readonly frequencyProperty: NumberProperty;

  // Full frequency range
  public readonly frequencyRange: Range;

  // Excitation position (centered model coordinates)
  // This is where the plate is driven (e.g., by a speaker or vibrator)
  public readonly excitationPositionProperty: Property<Vector2>;

  // Grain count selection (number of particles)
  public readonly grainCountProperty: Property<GrainCountOption>;

  // Boundary handling mode: clamp particles to edges or remove them
  public readonly boundaryModeProperty: Property<BoundaryMode>;

  // --- Extracted Modules ---

  // Plate geometry managers for each shape
  private readonly rectangularGeometry: PlateGeometry;
  private readonly circularGeometry: CircularPlateGeometry;
  private readonly guitarGeometry: GuitarPlateGeometry;

  // Legacy alias for backward compatibility
  private get plateGeometry(): PlateGeometry {
    return this.rectangularGeometry;
  }

  // Modal calculator factory
  private readonly calculatorFactory: ModalCalculatorFactory;

  // Current active modal calculator (based on selected shape)
  private activeCalculator: IModalCalculatorStrategy;

  // Legacy alias for backward compatibility
  private readonly modalCalculator: ModalCalculator;

  // Particle manager
  private readonly particleManager: ParticleManager;

  // Resonance curve calculator
  private readonly resonanceCurveCalculator: ResonanceCurveCalculator;

  // Frequency sweep controller
  private readonly sweepController: FrequencySweepController;

  // Playback state machine
  private readonly playbackStateMachine: PlaybackStateMachine;

  // Cached wave number for current frequency
  private cachedWaveNumber: number;

  // --- Public Properties (delegated to modules) ---

  // Animation state (from playback state machine)
  public get isPlayingProperty() {
    return this.playbackStateMachine.isPlayingProperty;
  }

  // Frequency sweep state (from sweep controller)
  public get isSweepingProperty() {
    return this.sweepController.isSweepingProperty;
  }

  // Plate dimensions (from plate geometry)
  public get plateWidthProperty() {
    return this.plateGeometry.widthProperty;
  }

  public get plateHeightProperty() {
    return this.plateGeometry.heightProperty;
  }

  // Actual particle count (from particle manager)
  public readonly actualParticleCountProperty: NumberProperty;

  // Particle positions (from particle manager)
  public get particlePositions(): Vector2[] {
    return this.particleManager.particlePositions;
  }

  // Current wave number (for modal visualization)
  public get waveNumber(): number {
    return this.cachedWaveNumber;
  }

  public constructor() {
    // Initialize material to aluminum (good mid-range dispersion)
    this.materialProperty = new Property<MaterialType>(Material.ALUMINUM);

    // Initialize plate shape
    this.plateShapeProperty = new Property<PlateShapeType>(DEFAULT_PLATE_SHAPE);

    // Initialize frequency with full range
    this.frequencyRange = new Range(FREQUENCY_MIN, FREQUENCY_MAX);
    this.frequencyProperty = new NumberProperty(FREQUENCY_DEFAULT, {
      range: this.frequencyRange,
    });

    // Initialize excitation position at center of plate
    this.excitationPositionProperty = new Property<Vector2>(
      new Vector2(DEFAULT_EXCITATION_X, DEFAULT_EXCITATION_Y),
    );

    // Initialize grain count to default (10,000)
    this.grainCountProperty = new Property<GrainCountOption>(
      DEFAULT_GRAIN_COUNT,
    );

    // Initialize boundary mode
    this.boundaryModeProperty = new Property<BoundaryMode>(
      DEFAULT_BOUNDARY_MODE,
    );

    // --- Initialize Extracted Modules ---

    // Create plate geometry managers for each shape
    this.rectangularGeometry = new PlateGeometry();
    this.circularGeometry = new CircularPlateGeometry();
    this.guitarGeometry = new GuitarPlateGeometry();

    // Create playback state machine
    this.playbackStateMachine = new PlaybackStateMachine();

    // Create frequency sweep controller
    this.sweepController = new FrequencySweepController({
      frequencyProperty: this.frequencyProperty,
      frequencyRange: this.frequencyRange,
    });

    // Listen for sweep completion from the Animation-based controller
    this.sweepController.sweepCompletedEmitter.addListener(() => {
      this.playbackStateMachine.onSweepComplete();
    });

    // Pause/resume sweep animation based on playback state
    this.playbackStateMachine.isPlayingProperty.lazyLink((isPlaying) => {
      if (this.sweepController.isSweeping) {
        if (isPlaying) {
          this.sweepController.resumeSweep();
        } else {
          this.sweepController.pauseSweep();
        }
      }
    });

    // Create modal calculator (for backward compatibility and rectangular)
    this.modalCalculator = new ModalCalculator({
      materialProperty: this.materialProperty,
      plateWidthProperty: this.rectangularGeometry.widthProperty,
      plateHeightProperty: this.rectangularGeometry.heightProperty,
      excitationPositionProperty: this.excitationPositionProperty,
    });

    // Create modal calculator factory
    this.calculatorFactory = new ModalCalculatorFactory({
      materialProperty: this.materialProperty,
      excitationPositionProperty: this.excitationPositionProperty,
      rectangularGeometry: this.rectangularGeometry,
      circularGeometry: this.circularGeometry,
      guitarGeometry: this.guitarGeometry,
    });

    // Set initial active calculator based on shape
    this.activeCalculator = this.calculatorFactory.getCalculator(
      this.plateShapeProperty.value,
    );

    // Create particle manager
    this.particleManager = new ParticleManager({
      grainCountProperty: this.grainCountProperty,
      plateWidthProperty: this.plateGeometry.widthProperty,
      plateHeightProperty: this.plateGeometry.heightProperty,
      boundaryModeProperty: this.boundaryModeProperty,
      isPlayingProperty: this.playbackStateMachine.isPlayingProperty,
    });

    // Create resonance curve calculator
    this.resonanceCurveCalculator = new ResonanceCurveCalculator({
      modalCalculator: this.modalCalculator,
    });

    // Expose actual particle count from particle manager
    this.actualParticleCountProperty =
      this.particleManager.actualParticleCountProperty;

    // Initialize particles
    this.particleManager.initialize();

    // Cache initial wave number
    this.cachedWaveNumber = this.modalCalculator.calculateWaveNumber(
      this.frequencyProperty.value,
    );

    // Initialize precomputed resonance curve
    this.resonanceCurveCalculator.recompute();

    // --- Set Up Property Links ---

    // Update cached wave number when frequency changes
    this.frequencyProperty.link(() => {
      this.cachedWaveNumber = this.activeCalculator.calculateWaveNumber(
        this.frequencyProperty.value,
      );
    });

    // Recompute resonance curve when material or excitation position changes
    this.materialProperty.link(() => {
      this.cachedWaveNumber = this.activeCalculator.calculateWaveNumber(
        this.frequencyProperty.value,
      );
      this.calculatorFactory.invalidateAllModeCaches();
      this.resonanceCurveCalculator.recompute();
    });

    this.excitationPositionProperty.link(() => {
      this.calculatorFactory.invalidateAllModeCaches();
      this.resonanceCurveCalculator.recompute();
    });

    // Regenerate particles when grain count changes
    this.grainCountProperty.lazyLink(() => {
      this.particleManager.initialize();
    });

    // Recompute when plate dimensions change - using Multilink for coordinated updates
    Multilink.lazyMultilink(
      [this.rectangularGeometry.widthProperty, this.rectangularGeometry.heightProperty],
      () => {
        this.modalCalculator.updateCachedDamping();
        this.resonanceCurveCalculator.recompute();
        this.particleManager.clampToBounds();
        this.rectangularGeometry.clampExcitationPosition(
          this.excitationPositionProperty,
        );
      },
    );

    // Handle shape changes
    this.plateShapeProperty.lazyLink((shape) => {
      this.activeCalculator = this.calculatorFactory.getCalculator(shape);
      this.activeCalculator.updateCachedDamping();
      this.cachedWaveNumber = this.activeCalculator.calculateWaveNumber(
        this.frequencyProperty.value,
      );
      // Update geometry provider for particle manager
      this.updateParticleGeometryProvider(shape);
      // Reinitialize particles for new shape
      this.particleManager.initialize();
    });

    // Set initial geometry provider
    this.updateParticleGeometryProvider(this.plateShapeProperty.value);

    // Update circular geometry listeners
    Multilink.lazyMultilink(
      [this.circularGeometry.outerRadiusProperty, this.circularGeometry.innerRadiusProperty],
      () => {
        if (this.plateShapeProperty.value === PlateShape.CIRCLE) {
          this.activeCalculator.updateCachedDamping();
          this.resonanceCurveCalculator.recompute();
        }
      },
    );

    // Update guitar geometry listener
    this.guitarGeometry.scaleProperty.lazyLink(() => {
      if (this.plateShapeProperty.value === PlateShape.GUITAR) {
        this.activeCalculator.updateCachedDamping();
        this.resonanceCurveCalculator.recompute();
      }
    });
  }

  /**
   * Update the particle manager's geometry provider based on shape.
   */
  private updateParticleGeometryProvider(shape: PlateShapeType): void {
    switch (shape) {
      case PlateShape.CIRCLE:
        this.particleManager.setGeometryProvider(this.circularGeometry);
        break;
      case PlateShape.GUITAR:
        this.particleManager.setGeometryProvider(this.guitarGeometry);
        break;
      case PlateShape.RECTANGLE:
      default:
        this.particleManager.setGeometryProvider(null);
        break;
    }
  }

  /**
   * Get the precomputed resonance curve data for the current visible window.
   * Returns an array of {frequency, normalizedStrength} points ready for plotting.
   */
  public getResonanceCurveData(sampleCount: number): Vector2[] {
    return this.resonanceCurveCalculator.getData(
      this.frequencyProperty.value,
      sampleCount,
    );
  }

  /**
   * Get the visible frequency range for the resonance curve graph.
   * Returns a window centered on the current frequency.
   */
  public getGraphWindowRange(): Range {
    return this.resonanceCurveCalculator.getGraphWindowRange(
      this.frequencyProperty.value,
    );
  }

  /**
   * Calculate the displacement psi at a given point (x, y).
   * Delegates to the active ModalCalculator using the cached wave number.
   */
  public psi(x: number, y: number): number {
    return this.activeCalculator.psi(x, y, this.cachedWaveNumber);
  }

  /**
   * Step the simulation forward by dt seconds.
   */
  public step(dt: number): void {
    // Note: Frequency sweep is now handled automatically by Animation in the sweep controller.
    // The animation runs independently and notifies completion via sweepCompletedEmitter.

    // Delegate particle stepping to particle manager
    this.particleManager.step(dt, (x, y) => this.psi(x, y));
  }

  /**
   * Start a frequency sweep from minimum to maximum frequency.
   */
  public startSweep(): void {
    this.sweepController.startSweep();
    this.playbackStateMachine.startSweep();
  }

  /**
   * Stop an active frequency sweep.
   */
  public stopSweep(): void {
    this.sweepController.stopSweep();
    this.playbackStateMachine.stopSweep();
  }

  /**
   * Reset the model to initial state.
   */
  public reset(): void {
    this.materialProperty.reset();
    this.plateShapeProperty.reset();
    this.frequencyProperty.reset();
    this.excitationPositionProperty.reset();
    this.grainCountProperty.reset();
    this.boundaryModeProperty.reset();

    // Reset all geometry modules
    this.rectangularGeometry.reset();
    this.circularGeometry.reset();
    this.guitarGeometry.reset();

    // Reset other modules
    this.playbackStateMachine.reset();
    this.sweepController.reset();

    // Update active calculator
    this.activeCalculator = this.calculatorFactory.getCalculator(
      this.plateShapeProperty.value,
    );

    // Reinitialize particles
    this.particleManager.initialize();

    // Update cached values
    this.cachedWaveNumber = this.activeCalculator.calculateWaveNumber(
      this.frequencyProperty.value,
    );
    this.activeCalculator.updateCachedDamping();
    this.modalCalculator.updateCachedDamping();
  }

  /**
   * Regenerate particles with new random positions.
   */
  public regenerateParticles(): void {
    this.particleManager.regenerate();
  }

  /**
   * Calculate the resonance strength/amplitude at a given frequency.
   * Delegates to the active ModalCalculator.
   */
  public strength(freq: number): number {
    return this.activeCalculator.strength(freq);
  }

  /**
   * Get the current playback state.
   */
  public get playbackState(): PlaybackState {
    return this.playbackStateMachine.state;
  }

  /**
   * Get the playback state machine for advanced state management.
   */
  public getPlaybackStateMachine(): PlaybackStateMachine {
    return this.playbackStateMachine;
  }

  /**
   * Get the rectangular plate geometry manager.
   */
  public getPlateGeometry(): PlateGeometry {
    return this.rectangularGeometry;
  }

  /**
   * Get the circular plate geometry manager.
   */
  public getCircularGeometry(): CircularPlateGeometry {
    return this.circularGeometry;
  }

  /**
   * Get the guitar plate geometry manager.
   */
  public getGuitarGeometry(): GuitarPlateGeometry {
    return this.guitarGeometry;
  }

  /**
   * Get the current plate shape.
   */
  public get plateShape(): PlateShapeType {
    return this.plateShapeProperty.value;
  }

  // --- Convenience Getters ---

  public get frequency(): number {
    return this.frequencyProperty.value;
  }

  public get materialName(): string {
    return this.materialProperty.value.name;
  }

  public get particleCount(): number {
    return this.grainCountProperty.value.value;
  }

  public get plateWidth(): number {
    return this.plateGeometry.width;
  }

  public get plateHeight(): number {
    return this.plateGeometry.height;
  }

  public get aspectRatio(): number {
    return this.plateGeometry.aspectRatio;
  }

  public get defaultPlateWidth(): number {
    return this.plateGeometry.defaultWidth;
  }

  public get defaultPlateHeight(): number {
    return this.plateGeometry.defaultHeight;
  }
}
