/**
 * GuitarModalCalculator.ts
 *
 * Modal calculator for guitar (dreadnought) shaped Chladni plates.
 *
 * Physics approach:
 * Since there is no closed-form analytical solution for guitar-shaped plates,
 * we use rectangular modal physics with boundary masking:
 * - Points inside the guitar boundary use rectangular eigenfunctions
 * - Points outside the guitar polygon return psi = 0
 *
 * This produces approximate but visually plausible Chladni patterns.
 */

import { Property, TReadOnlyProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import type { MaterialType } from "./Material.js";
import type { IModalCalculatorStrategy } from "./IModalCalculatorStrategy.js";
import type { GuitarPlateGeometry } from "./GuitarPlateGeometry.js";
import {
  MAX_MODE,
  MODE_STEP,
  SOURCE_THRESHOLD,
  SOURCE_THRESHOLD_SQUARED,
  NORMALIZATION_NUMERATOR,
  DAMPING_COEFFICIENT,
} from "./ChladniConstants.js";

/**
 * Maximum number of cached modes.
 */
const MAX_CACHED_MODES = (MAX_MODE + 1) * (MAX_MODE + 1);

/**
 * Options for creating a GuitarModalCalculator.
 */
export interface GuitarModalCalculatorOptions {
  materialProperty: TReadOnlyProperty<MaterialType>;
  geometry: GuitarPlateGeometry;
  excitationPositionProperty: Property<Vector2>;
}

/**
 * GuitarModalCalculator uses rectangular modal physics with guitar boundary masking.
 */
export class GuitarModalCalculator implements IModalCalculatorStrategy {
  private readonly materialProperty: TReadOnlyProperty<MaterialType>;
  private readonly excitationPositionProperty: Property<Vector2>;
  private readonly geometry: GuitarPlateGeometry;

  // Cached values
  private cachedDamping: number;

  // Mode coefficient cache (same structure as rectangular calculator)
  private readonly mPiOverA: Float64Array;
  private readonly nPiOverB: Float64Array;
  private readonly realCoeffs: Float64Array;
  private readonly imagCoeffs: Float64Array;
  private cachedModeCount: number = 0;
  private cacheWaveNumber: number = -1;
  private cacheNormalization: number = 0;
  private cacheScale: number = -1;

  public constructor(options: GuitarModalCalculatorOptions) {
    this.materialProperty = options.materialProperty as Property<MaterialType>;
    this.geometry = options.geometry;
    this.excitationPositionProperty = options.excitationPositionProperty;

    this.cachedDamping = this.calculateDamping();

    // Pre-allocate TypedArrays for mode cache
    this.mPiOverA = new Float64Array(MAX_CACHED_MODES);
    this.nPiOverB = new Float64Array(MAX_CACHED_MODES);
    this.realCoeffs = new Float64Array(MAX_CACHED_MODES);
    this.imagCoeffs = new Float64Array(MAX_CACHED_MODES);

    // Invalidate cache when scale changes
    this.geometry.scaleProperty.lazyLink(() => this.invalidateModeCache());
  }

  /**
   * Calculate damping based on guitar dimensions.
   */
  private calculateDamping(): number {
    const a = this.geometry.width;
    const b = this.geometry.height;
    return DAMPING_COEFFICIENT / Math.sqrt(a * b);
  }

  /**
   * Update cached damping when dimensions change.
   */
  public updateCachedDamping(): void {
    this.cachedDamping = this.calculateDamping();
    this.invalidateModeCache();
  }

  /**
   * Invalidate the mode cache.
   */
  public invalidateModeCache(): void {
    this.cacheWaveNumber = -1;
  }

  /**
   * Calculate wave number from frequency.
   */
  public calculateWaveNumber(frequency: number): number {
    const C = this.materialProperty.value.dispersionConstant;
    return Math.sqrt(frequency / C);
  }

  /**
   * Update the mode cache for the current wave number.
   */
  private updateModeCache(waveNumber: number): void {
    const k = waveNumber;
    const gamma = this.cachedDamping;
    const a = this.geometry.width;
    const b = this.geometry.height;

    // Convert centered excitation to physics coordinates (0 to a, 0 to b)
    const excitation = this.excitationPositionProperty.value;
    const excitX = excitation.x + a / 2;
    const excitY = excitation.y + b / 2;

    const piOverA = Math.PI / a;
    const piOverB = Math.PI / b;
    const twoGammaK = 2 * gamma * k;
    const kSquared = k * k;

    let modeIndex = 0;

    for (let m = 0; m <= MAX_MODE; m += MODE_STEP) {
      const mPi = m * Math.PI;
      const sourceX = Math.cos((mPi * excitX) / a);
      const mPiOverA = m * piOverA;

      for (let n = 0; n <= MAX_MODE; n += MODE_STEP) {
        if (m === 0 && n === 0) continue;

        const nPi = n * Math.PI;
        const sourceY = Math.cos((nPi * excitY) / b);
        const sourceTerm = sourceX * sourceY;

        if (Math.abs(sourceTerm) < SOURCE_THRESHOLD) continue;

        const nPiOverB = n * piOverB;
        const kmnSquared = mPiOverA * mPiOverA + nPiOverB * nPiOverB;

        const realPart = kSquared - kmnSquared;
        const imagPart = twoGammaK;
        const denomMagSquared = realPart * realPart + imagPart * imagPart;

        const invDenom = 1 / denomMagSquared;

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
    this.cacheScale = this.geometry.scale;
  }

  /**
   * Calculate displacement at point (x, y) for given wave number.
   * Returns 0 if the point is outside the guitar boundary.
   */
  public psi(x: number, y: number, waveNumber: number): number {
    // Check if point is inside guitar boundary
    if (!this.geometry.containsPoint(x, y)) {
      return 0;
    }

    // Update cache if needed
    if (
      waveNumber !== this.cacheWaveNumber ||
      this.geometry.scale !== this.cacheScale
    ) {
      this.updateModeCache(waveNumber);
    }

    // Convert centered coordinates to physics coordinates
    const a = this.geometry.width;
    const b = this.geometry.height;
    const physX = x + a / 2;
    const physY = y + b / 2;

    let sumReal = 0;
    let sumImag = 0;

    const modeCount = this.cachedModeCount;

    for (let i = 0; i < modeCount; i++) {
      const fieldX = Math.cos(this.mPiOverA[i]! * physX);
      const fieldY = Math.cos(this.nPiOverB[i]! * physY);
      const fieldTerm = fieldX * fieldY;

      sumReal += fieldTerm * this.realCoeffs[i]!;
      sumImag -= fieldTerm * this.imagCoeffs[i]!;
    }

    return (
      this.cacheNormalization * Math.sqrt(sumReal * sumReal + sumImag * sumImag)
    );
  }

  /**
   * Calculate resonance strength at given frequency.
   */
  public strength(frequency: number): number {
    const C = this.materialProperty.value.dispersionConstant;
    const k = Math.sqrt(frequency / C);
    const gamma = this.cachedDamping;
    const a = this.geometry.width;
    const b = this.geometry.height;

    const excitation = this.excitationPositionProperty.value;
    const excitX = excitation.x + a / 2;
    const excitY = excitation.y + b / 2;

    let sum = 0;
    const mOverA = Math.PI / a;
    const nOverB = Math.PI / b;
    const fourGammaKSquared = NORMALIZATION_NUMERATOR * gamma * gamma * k * k;
    const kSquared = k * k;
    const normFactor = NORMALIZATION_NUMERATOR / (a * b);

    for (let m = 0; m <= MAX_MODE; m += MODE_STEP) {
      const cosX = Math.cos((m * Math.PI * excitX) / a);
      const cosXSquared = cosX * cosX;

      for (let n = 0; n <= MAX_MODE; n += MODE_STEP) {
        if (m === 0 && n === 0) continue;

        const cosY = Math.cos((n * Math.PI * excitY) / b);
        const phiSquared = normFactor * cosXSquared * cosY * cosY;

        if (phiSquared < SOURCE_THRESHOLD_SQUARED) continue;

        const kmn = Math.sqrt(
          m * mOverA * (m * mOverA) + n * nOverB * (n * nOverB),
        );
        const kmnSquared = kmn * kmn;

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
