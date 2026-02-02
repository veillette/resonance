/**
 * ModalCalculator.ts
 *
 * Handles the physics calculations for Chladni plate modal superposition.
 * Extracted from ChladniModel for separation of concerns.
 *
 * Physics:
 * - Uses modal superposition based on the inhomogeneous Helmholtz equation
 * - Wave number k = sqrt(frequency / C) where C is the material dispersion constant
 * - Modal wave number for rectangular plate: k_{m,n} = π√((m/a)² + (n/b)²)
 * - Damping term gamma = DAMPING_COEFFICIENT / √(a*b)
 *
 * Performance optimization:
 * - Mode coefficients are pre-computed and cached when frequency/excitation changes
 * - The psi() function uses cached coefficients for fast per-particle evaluation
 * - Only modes that pass SOURCE_THRESHOLD are included in the cache
 */

import { Vector2 } from "scenerystack/dot";
import { TReadOnlyProperty } from "scenerystack/axon";
import { MaterialType } from "./Material.js";
import {
  MAX_MODE,
  MODE_STEP,
  SOURCE_THRESHOLD,
  SOURCE_THRESHOLD_SQUARED,
  NORMALIZATION_NUMERATOR,
  DAMPING_COEFFICIENT,
} from "./ChladniConstants.js";

/**
 * Options for creating a ModalCalculator
 */
export interface ModalCalculatorOptions {
  materialProperty: TReadOnlyProperty<MaterialType>;
  plateWidthProperty: TReadOnlyProperty<number>;
  plateHeightProperty: TReadOnlyProperty<number>;
  excitationPositionProperty: TReadOnlyProperty<Vector2>;
}

/**
 * Maximum number of modes that could pass the threshold filter.
 * (MAX_MODE + 1)^2 - 1 for the (0,0) mode = 288 for MAX_MODE=16
 */
const MAX_CACHED_MODES = (MAX_MODE + 1) * (MAX_MODE + 1);

/**
 * ModalCalculator handles the physics calculations for plate displacement (psi)
 * and resonance strength at various frequencies.
 *
 * Performance: Uses pre-computed mode coefficient caching. When evaluating psi()
 * for many particles at the same frequency, the frequency-dependent terms are
 * computed once and cached, reducing per-particle computation by ~80%.
 */
export class ModalCalculator {
  private readonly materialProperty: TReadOnlyProperty<MaterialType>;
  private readonly plateWidthProperty: TReadOnlyProperty<number>;
  private readonly plateHeightProperty: TReadOnlyProperty<number>;
  private readonly excitationPositionProperty: TReadOnlyProperty<Vector2>;

  // Cached values for performance
  private cachedDamping: number;

  // === Mode coefficient cache for optimized psi() calculation ===
  // These TypedArrays store pre-computed coefficients for valid modes.
  // Using TypedArrays improves cache locality and enables JIT optimizations.

  /** Coefficient for field X term: m * PI / a */
  private readonly mPiOverA: Float64Array;

  /** Coefficient for field Y term: n * PI / b */
  private readonly nPiOverB: Float64Array;

  /** Pre-computed real coefficient: sourceTerm * realPart / denomMagSquared */
  private readonly realCoeffs: Float64Array;

  /** Pre-computed imaginary coefficient: sourceTerm * imagPart / denomMagSquared */
  private readonly imagCoeffs: Float64Array;

  /** Number of valid cached modes (modes that pass the threshold filter) */
  private cachedModeCount: number = 0;

  /** Wave number for which the cache was computed */
  private cacheWaveNumber: number = -1;

  /** Normalization factor for the cached computation */
  private cacheNormalization: number = 0;

  public constructor(options: ModalCalculatorOptions) {
    this.materialProperty = options.materialProperty;
    this.plateWidthProperty = options.plateWidthProperty;
    this.plateHeightProperty = options.plateHeightProperty;
    this.excitationPositionProperty = options.excitationPositionProperty;

    // Initialize cached damping
    this.cachedDamping = this.calculateDamping();

    // Pre-allocate TypedArrays for mode coefficient cache
    this.mPiOverA = new Float64Array(MAX_CACHED_MODES);
    this.nPiOverB = new Float64Array(MAX_CACHED_MODES);
    this.realCoeffs = new Float64Array(MAX_CACHED_MODES);
    this.imagCoeffs = new Float64Array(MAX_CACHED_MODES);
  }

  /**
   * Calculate the damping coefficient based on plate dimensions.
   * Uses geometric mean of plate dimensions.
   */
  private calculateDamping(): number {
    const a = this.plateWidthProperty.value;
    const b = this.plateHeightProperty.value;
    return DAMPING_COEFFICIENT / Math.sqrt(a * b);
  }

  /**
   * Update cached damping value. Call when plate dimensions change.
   * Also invalidates the mode coefficient cache.
   */
  public updateCachedDamping(): void {
    this.cachedDamping = this.calculateDamping();
    this.invalidateModeCache();
  }

  /**
   * Invalidate the mode coefficient cache.
   * Call when excitation position or plate dimensions change.
   */
  public invalidateModeCache(): void {
    this.cacheWaveNumber = -1;
  }

  /**
   * Calculate the wave number k from frequency and material.
   * k = sqrt(frequency / C) where C is the dispersion constant
   */
  public calculateWaveNumber(frequency: number): number {
    const C = this.materialProperty.value.dispersionConstant;
    return Math.sqrt(frequency / C);
  }

  /**
   * Update the mode coefficient cache for the given wave number.
   * This pre-computes all frequency-dependent terms so that psi()
   * only needs to compute the position-dependent field terms.
   *
   * Performance: This is called once per frame (or when frequency changes),
   * eliminating redundant calculations across all 10,000+ particles.
   */
  private updateModeCache(waveNumber: number): void {
    const k = waveNumber;
    const gamma = this.cachedDamping;
    const a = this.plateWidthProperty.value;
    const b = this.plateHeightProperty.value;

    // Convert centered excitation to physics coordinates
    const excitation = this.excitationPositionProperty.value;
    const excitX = excitation.x + a / 2;
    const excitY = excitation.y + b / 2;

    const piOverA = Math.PI / a;
    const piOverB = Math.PI / b;
    const twoGammaK = 2 * gamma * k;
    const kSquared = k * k;

    let modeIndex = 0;

    // Pre-compute coefficients for all valid modes
    for (let m = 0; m <= MAX_MODE; m += MODE_STEP) {
      const mPi = m * Math.PI;
      const sourceX = Math.cos((mPi * excitX) / a);
      const mPiOverA = m * piOverA;

      for (let n = 0; n <= MAX_MODE; n += MODE_STEP) {
        // Skip the (0,0) mode
        if (m === 0 && n === 0) continue;

        // Source term: cos(mπx'/a)cos(nπy'/b)
        const nPi = n * Math.PI;
        const sourceY = Math.cos((nPi * excitY) / b);
        const sourceTerm = sourceX * sourceY;

        // Skip modes with negligible source contribution
        if (Math.abs(sourceTerm) < SOURCE_THRESHOLD) continue;

        // Modal wave number: k_{m,n} = π√((m/a)² + (n/b)²)
        const nPiOverB = n * piOverB;
        const kmnSquared = mPiOverA * mPiOverA + nPiOverB * nPiOverB;

        // Complex denominator: (k² - k²ₘₙ) + 2iγk
        const realPart = kSquared - kmnSquared;
        const imagPart = twoGammaK;
        const denomMagSquared = realPart * realPart + imagPart * imagPart;

        // Pre-compute coefficients: sourceTerm * (realPart or imagPart) / denomMagSquared
        const invDenom = 1 / denomMagSquared;

        // Store in cache
        this.mPiOverA[modeIndex] = mPiOverA;
        this.nPiOverB[modeIndex] = nPiOverB;
        this.realCoeffs[modeIndex] = sourceTerm * realPart * invDenom;
        this.imagCoeffs[modeIndex] = sourceTerm * imagPart * invDenom;

        modeIndex++;
      }
    }

    this.cachedModeCount = modeIndex;
    this.cacheWaveNumber = waveNumber;
    this.cacheNormalization = NORMALIZATION_NUMERATOR / (a * b);
  }

  /**
   * Calculate the displacement psi at a given point (x, y) for a given wave number.
   * Input coordinates are centered: x in [-a/2, a/2], y in [-b/2, b/2].
   *
   * Uses modal superposition based on the inhomogeneous Helmholtz equation solution.
   *
   * For a rectangular plate with dimensions a (width) × b (height):
   * Ψ(x,y; k,γ) = (2/√(ab))² Σₘ Σₙ [cos(mπx'/a)cos(nπy'/b) / ((k² - k²ₘₙ) + 2iγk)]
   *              × cos(mπx/a)cos(nπy/b)
   *
   * where (x', y') is the excitation position and k_{m,n} = π√((m/a)² + (n/b)²)
   *
   * Performance: Uses pre-computed mode coefficients to minimize per-particle computation.
   * The cache is updated once per wave number change, then reused for all particles.
   */
  public psi(x: number, y: number, waveNumber: number): number {
    // Update cache if wave number changed
    if (waveNumber !== this.cacheWaveNumber) {
      this.updateModeCache(waveNumber);
    }

    // Convert centered coordinates to physics coordinates (0 to a, 0 to b)
    const a = this.plateWidthProperty.value;
    const b = this.plateHeightProperty.value;
    const physX = x + a / 2;
    const physY = y + b / 2;

    // Use cached coefficients for fast evaluation
    let sumReal = 0;
    let sumImag = 0;

    const modeCount = this.cachedModeCount;
    const mPiOverA = this.mPiOverA;
    const nPiOverB = this.nPiOverB;
    const realCoeffs = this.realCoeffs;
    const imagCoeffs = this.imagCoeffs;

    // Tight loop with minimal operations per iteration
    for (let i = 0; i < modeCount; i++) {
      // Field term: cos(mπx/a)cos(nπy/b) - only position-dependent computation
      const fieldX = Math.cos(mPiOverA[i]! * physX);
      const fieldY = Math.cos(nPiOverB[i]! * physY);
      const fieldTerm = fieldX * fieldY;

      // Accumulate with pre-computed coefficients
      sumReal += fieldTerm * realCoeffs[i]!;
      sumImag -= fieldTerm * imagCoeffs[i]!;
    }

    // Return magnitude of complex sum with cached normalization
    return (
      this.cacheNormalization * Math.sqrt(sumReal * sumReal + sumImag * sumImag)
    );
  }

  /**
   * Calculate the resonance strength/amplitude at a given frequency.
   * This is used to plot the resonance curve showing peaks at resonant frequencies.
   *
   * For a rectangular plate with dimensions a × b:
   * I(x',y',k,γ) = Σₘₙ |φₘₙ(x',y')|² / [(k² - k²ₘₙ)² + 4(γk)²]
   *
   * The |φₘₙ(x',y')|² term weights each mode by its amplitude at the excitation point.
   */
  public strength(frequency: number): number {
    const C = this.materialProperty.value.dispersionConstant;
    const k = Math.sqrt(frequency / C);
    const gamma = this.cachedDamping;
    const a = this.plateWidthProperty.value;
    const b = this.plateHeightProperty.value;

    // Convert centered excitation position to physics coordinates (0 to a, 0 to b)
    const excitation = this.excitationPositionProperty.value;
    const excitX = excitation.x + a / 2;
    const excitY = excitation.y + b / 2;

    let sum = 0;
    const mOverA = Math.PI / a;
    const nOverB = Math.PI / b;
    const fourGammaKSquared = NORMALIZATION_NUMERATOR * gamma * gamma * k * k;
    const kSquared = k * k;
    // Normalization for rectangular plate: (2/√(ab))² = 4/(ab)
    const normFactor = NORMALIZATION_NUMERATOR / (a * b);

    // Sum over modes m, n = 0, 1, 2, ..., MAX_MODE
    for (let m = 0; m <= MAX_MODE; m += MODE_STEP) {
      const cosX = Math.cos((m * Math.PI * excitX) / a);
      const cosXSquared = cosX * cosX;

      for (let n = 0; n <= MAX_MODE; n += MODE_STEP) {
        // Skip (0,0) mode
        if (m === 0 && n === 0) continue;

        // |φₘₙ(x',y')|² = (4/ab) cos²(mπx'/a) cos²(nπy'/b)
        const cosY = Math.cos((n * Math.PI * excitY) / b);
        const phiSquared = normFactor * cosXSquared * cosY * cosY;

        // Skip modes with negligible source contribution
        if (phiSquared < SOURCE_THRESHOLD_SQUARED) continue;

        // Modal wave number for rectangular plate: k_{m,n} = π√((m/a)² + (n/b)²)
        const kmn = Math.sqrt(
          m * mOverA * (m * mOverA) + n * nOverB * (n * nOverB),
        );
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
