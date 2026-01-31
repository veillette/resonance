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
 * - Modal superposition over (m, n) modes with m, n = 0, 2, 4, ..., 18
 * - Damping term gamma = 0.02 / plateSize
 */

import { Property, NumberProperty, BooleanProperty } from "scenerystack/axon";
import { Vector2, Range } from "scenerystack/dot";
import { Material, MaterialType } from "./Material.js";

// Number of particles to simulate
const PARTICLE_COUNT = 10000;

// Plate size - normalized for particle positions (0 to 1)
const PLATE_SIZE_NORMALIZED = 1.0;

// Physical plate size in meters (from original Chladni simulator)
// This affects wave number calculations and resonant frequencies
const PLATE_SIZE_PHYSICAL = 0.32;

// Particle movement parameters
const PARTICLE_STEP_SCALE = 5.0;
const DAMPING_COEFFICIENT = 0.02;

// Modal calculation parameters
// Include both even and odd modes for off-center excitation
const MAX_MODE = 16;
const MODE_STEP = 1; // Include all modes for off-center excitation

// Threshold for skipping modes with negligible source contribution
const SOURCE_THRESHOLD = 0.001;

// Default excitation position (center of plate, normalized 0-1)
const DEFAULT_EXCITATION_X = 0.5;
const DEFAULT_EXCITATION_Y = 0.5;

// Full frequency range for the simulation (Hz)
const FREQUENCY_MIN = 50;
const FREQUENCY_MAX = 4000;
const FREQUENCY_DEFAULT = 500;

// Width of the visible window in the resonance curve graph (Hz)
const GRAPH_WINDOW_WIDTH = 500;

export class ChladniModel {
  // Material selection
  public readonly materialProperty: Property<MaterialType>;

  // Frequency control - single slider covering full range
  public readonly frequencyProperty: NumberProperty;

  // Full frequency range
  public readonly frequencyRange: Range;

  // Excitation position (normalized 0-1 coordinates)
  // This is where the plate is driven (e.g., by a speaker or vibrator)
  public readonly excitationPositionProperty: Property<Vector2>;

  // Animation state
  public readonly isPlayingProperty: BooleanProperty;

  // Particle positions (normalized 0-1 coordinates)
  public readonly particlePositions: Vector2[];

  // Cached values for performance
  private cachedWaveNumber: number;
  private cachedDamping: number;

  public constructor() {
    // Initialize material to aluminum (good mid-range dispersion)
    this.materialProperty = new Property<MaterialType>(Material.ALUMINUM);

    // Initialize frequency with full range
    this.frequencyRange = new Range(FREQUENCY_MIN, FREQUENCY_MAX);
    this.frequencyProperty = new NumberProperty(FREQUENCY_DEFAULT, {
      range: this.frequencyRange,
    });

    // Initialize excitation position at center of plate
    this.excitationPositionProperty = new Property<Vector2>(
      new Vector2(DEFAULT_EXCITATION_X, DEFAULT_EXCITATION_Y),
    );

    // Animation starts paused
    this.isPlayingProperty = new BooleanProperty(false);

    // Initialize particles with random positions
    this.particlePositions = [];
    this.initializeParticles();

    // Cache derived values
    this.cachedWaveNumber = this.calculateWaveNumber();
    this.cachedDamping = DAMPING_COEFFICIENT / PLATE_SIZE_PHYSICAL;

    // Update cached wave number when frequency or material changes
    this.frequencyProperty.link(() => {
      this.cachedWaveNumber = this.calculateWaveNumber();
    });
    this.materialProperty.link(() => {
      this.cachedWaveNumber = this.calculateWaveNumber();
    });
  }

  /**
   * Initialize all particles with random positions across the plate.
   * Positions are normalized (0 to 1).
   */
  private initializeParticles(): void {
    this.particlePositions.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.particlePositions.push(
        new Vector2(Math.random() * PLATE_SIZE_NORMALIZED, Math.random() * PLATE_SIZE_NORMALIZED),
      );
    }
  }

  /**
   * Calculate the wave number k from the current frequency and material.
   * k = sqrt(frequency / C) where C is the dispersion constant
   */
  private calculateWaveNumber(): number {
    const frequency = this.frequencyProperty.value;
    const C = this.materialProperty.value.dispersionConstant;
    return Math.sqrt(frequency / C);
  }

  /**
   * Calculate the displacement psi at a given point (x, y).
   * Input coordinates are normalized (0 to 1), internally converted to physical units.
   * Uses modal superposition based on the inhomogeneous Helmholtz equation solution.
   *
   * From Tuan et al. (Phys. Rev. E 89, 022911, 2014), Equation 12:
   * Ψ(x,y; k,γ) = (2/a)² Σₘ Σₙ [cos(mπx'/a)cos(nπy'/a) / ((k² - k²ₘₙ) + 2iγk)]
   *              × cos(mπx/a)cos(nπy/a)
   *
   * where (x', y') is the excitation position and k_{m,n} = (π/a)√(m² + n²)
   */
  public psi(x: number, y: number): number {
    const k = this.cachedWaveNumber;
    const gamma = this.cachedDamping;
    const a = PLATE_SIZE_PHYSICAL;

    // Get excitation position in physical coordinates
    const excitation = this.excitationPositionProperty.value;
    const excitX = excitation.x * a;
    const excitY = excitation.y * a;

    // Convert normalized coordinates (0-1) to physical coordinates (0-a)
    const physX = x * a;
    const physY = y * a;

    let sumReal = 0;
    let sumImag = 0;
    const piOverA = Math.PI / a;
    const twoGammaK = 2 * gamma * k;
    const kSquared = k * k;

    // Sum over modes m, n = 0, 1, 2, ..., MAX_MODE
    for (let m = 0; m <= MAX_MODE; m += MODE_STEP) {
      // Source term X component: cos(mπx'/a)
      const sourceX = Math.cos(m * Math.PI * excitX / a);

      for (let n = 0; n <= MAX_MODE; n += MODE_STEP) {
        // Skip the (0,0) mode to avoid division issues
        if (m === 0 && n === 0) continue;

        // Source term: cos(mπx'/a)cos(nπy'/a)
        const sourceY = Math.cos(n * Math.PI * excitY / a);
        const sourceTerm = sourceX * sourceY;

        // Skip modes with negligible source contribution (optimization)
        if (Math.abs(sourceTerm) < SOURCE_THRESHOLD) continue;

        const kmn = piOverA * Math.sqrt(m * m + n * n);
        const kmnSquared = kmn * kmn;

        // Complex denominator: (k² - k²ₘₙ) + 2iγk
        const realPart = kSquared - kmnSquared;
        const imagPart = twoGammaK;
        const denomMagSquared = realPart * realPart + imagPart * imagPart;

        // Field term: cos(mπx/a)cos(nπy/a)
        const fieldX = Math.cos(m * Math.PI * physX / a);
        const fieldY = Math.cos(n * Math.PI * physY / a);
        const fieldTerm = fieldX * fieldY;

        // Complex division: numerator / (realPart + i*imagPart)
        // = numerator * (realPart - i*imagPart) / |denominator|²
        const numerator = sourceTerm * fieldTerm;
        sumReal += numerator * realPart / denomMagSquared;
        sumImag -= numerator * imagPart / denomMagSquared;
      }
    }

    // Return magnitude of complex sum, with normalization
    const normalization = (2 / a) * (2 / a);
    return normalization * Math.sqrt(sumReal * sumReal + sumImag * sumImag);
  }

  /**
   * Step the simulation forward by dt seconds.
   * Moves particles based on a biased random walk where step size
   * is proportional to local displacement magnitude.
   */
  public step(dt: number): void {
    if (!this.isPlayingProperty.value) {
      return;
    }

    // Scale factor for reasonable animation speed
    const timeScale = dt * 60; // Normalize to ~60fps

    for (let i = 0; i < this.particlePositions.length; i++) {
      const particle = this.particlePositions[i]!;
      const x = particle.x;
      const y = particle.y;

      // Calculate displacement at current position
      const displacement = Math.abs(this.psi(x, y));

      // Random walk with step size proportional to displacement
      const stepSize = PARTICLE_STEP_SCALE * displacement * timeScale * 0.01;
      const angle = Math.random() * 2 * Math.PI;

      // Update position
      let newX = x + stepSize * Math.cos(angle);
      let newY = y + stepSize * Math.sin(angle);

      // Clamp to plate boundaries (normalized coordinates)
      newX = Math.max(0, Math.min(PLATE_SIZE_NORMALIZED, newX));
      newY = Math.max(0, Math.min(PLATE_SIZE_NORMALIZED, newY));

      particle.setXY(newX, newY);
    }
  }

  /**
   * Reset the model to initial state.
   */
  public reset(): void {
    this.materialProperty.reset();
    this.frequencyProperty.reset();
    this.excitationPositionProperty.reset();
    this.isPlayingProperty.reset();
    this.initializeParticles();
    this.cachedWaveNumber = this.calculateWaveNumber();
  }

  /**
   * Get the visible frequency range for the resonance curve graph.
   * Returns a window centered on the current frequency.
   */
  public getGraphWindowRange(): Range {
    const currentFreq = this.frequencyProperty.value;
    const halfWindow = GRAPH_WINDOW_WIDTH / 2;

    let min = currentFreq - halfWindow;
    let max = currentFreq + halfWindow;

    // Clamp to valid frequency range
    if (min < FREQUENCY_MIN) {
      min = FREQUENCY_MIN;
      max = Math.min(FREQUENCY_MIN + GRAPH_WINDOW_WIDTH, FREQUENCY_MAX);
    }
    if (max > FREQUENCY_MAX) {
      max = FREQUENCY_MAX;
      min = Math.max(FREQUENCY_MAX - GRAPH_WINDOW_WIDTH, FREQUENCY_MIN);
    }

    return new Range(min, max);
  }

  /**
   * Regenerate particles with new random positions.
   */
  public regenerateParticles(): void {
    this.initializeParticles();
  }

  /**
   * Get the current frequency display value.
   */
  public get frequency(): number {
    return this.frequencyProperty.value;
  }

  /**
   * Get the current material name.
   */
  public get materialName(): string {
    return this.materialProperty.value.name;
  }

  /**
   * Get the number of particles.
   */
  public get particleCount(): number {
    return PARTICLE_COUNT;
  }

  /**
   * Calculate the resonance strength/amplitude at a given frequency.
   * This is used to plot the resonance curve showing peaks at resonant frequencies.
   *
   * From Tuan et al. (Phys. Rev. E 89, 022911, 2014), Equation 9:
   * I(x',y',k,γ) = Σₙ |φₙ(x',y')|² / [(k² - kₙ²)² + 4(γk)²]
   *
   * The |φₙ(x',y')|² term weights each mode by its amplitude at the excitation point.
   */
  public strength(freq: number): number {
    const C = this.materialProperty.value.dispersionConstant;
    const k = Math.sqrt(freq / C);
    const gamma = this.cachedDamping;
    const a = PLATE_SIZE_PHYSICAL;

    // Get excitation position in physical coordinates
    const excitation = this.excitationPositionProperty.value;
    const excitX = excitation.x * a;
    const excitY = excitation.y * a;

    let sum = 0;
    const piOverA = Math.PI / a;
    const fourGammaKSquared = 4 * gamma * gamma * k * k;
    const kSquared = k * k;
    const normFactor = (2 / a) * (2 / a);

    // Sum over modes m, n = 0, 1, 2, ..., MAX_MODE
    for (let m = 0; m <= MAX_MODE; m += MODE_STEP) {
      const cosX = Math.cos(m * Math.PI * excitX / a);
      const cosXSquared = cosX * cosX;

      for (let n = 0; n <= MAX_MODE; n += MODE_STEP) {
        // Skip (0,0) mode
        if (m === 0 && n === 0) continue;

        // |φₙ(x',y')|² = (2/a)² cos²(mπx'/a) cos²(nπy'/a)
        const cosY = Math.cos(n * Math.PI * excitY / a);
        const phiSquared = normFactor * cosXSquared * cosY * cosY;

        // Skip modes with negligible source contribution
        if (phiSquared < SOURCE_THRESHOLD * SOURCE_THRESHOLD) continue;

        const kmn = piOverA * Math.sqrt(m * m + n * n);
        const kmnSquared = kmn * kmn;

        // Resonance denominator: (k² - kmn²)² + 4(γk)²
        const diff = kSquared - kmnSquared;
        const denominator = diff * diff + fourGammaKSquared;

        if (denominator > 0) {
          sum += phiSquared / denominator;
        }
      }
    }

    return sum;
  }
}
