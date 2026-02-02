/**
 * CircularModalCalculator.ts
 *
 * Modal calculator for circular (solid disc) Chladni plates.
 *
 * Physics:
 * For a circular plate with radius R and clamped/free boundary:
 * - Eigenfunctions: J_m(k_mn * r) * cos(m*theta) or sin(m*theta)
 * - Where k_mn are determined by boundary conditions
 * - For clamped: J_m(k_mn * R) = 0
 * - For free: J'_m(k_mn * R) = 0
 *
 * The displacement field is:
 * psi(r, theta) = sum_{m,n} A_mn * J_m(k_mn * r) * cos(m * theta)
 */

import { Property, TReadOnlyProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import type { MaterialType } from "./Material.js";
import type { IModalCalculatorStrategy } from "./IModalCalculatorStrategy.js";
import {
  besselJ,
  getBesselJZero,
  getBesselJPrimeZero,
} from "./BesselFunctions.js";
import {
  DAMPING_COEFFICIENT,
  SOURCE_THRESHOLD,
} from "./ChladniConstants.js";

/**
 * Maximum angular mode number (m = 0, 1, 2, ..., MAX_M)
 */
const MAX_M = 8;

/**
 * Maximum radial mode number (n = 1, 2, ..., MAX_N)
 */
const MAX_N = 8;

/**
 * Boundary condition type for circular plate.
 */
export type CircularBoundaryCondition = "clamped" | "free";

/**
 * Options for creating a CircularModalCalculator.
 */
export interface CircularModalCalculatorOptions {
  materialProperty: TReadOnlyProperty<MaterialType>;
  outerRadiusProperty: TReadOnlyProperty<number>;
  excitationPositionProperty: Property<Vector2>;
  boundaryCondition?: CircularBoundaryCondition;
}

/**
 * Cached mode data for a single (m, n) mode.
 */
interface CachedMode {
  m: number;
  kmnR: number; // k_mn * R (Bessel zero)
  sourceAmplitude: number; // J_m(k_mn * r') * cos(m * theta')
  realCoeff: number;
  imagCoeff: number;
}

/**
 * CircularModalCalculator handles physics calculations for circular plates.
 */
export class CircularModalCalculator implements IModalCalculatorStrategy {
  private readonly materialProperty: TReadOnlyProperty<MaterialType>;
  private readonly excitationPositionProperty: Property<Vector2>;
  private readonly outerRadiusProperty: TReadOnlyProperty<number>;
  private readonly boundaryCondition: CircularBoundaryCondition;

  // Cached values
  private cachedDamping: number;
  private cachedModes: CachedMode[] = [];
  private cacheWaveNumber: number = -1;
  private cacheRadius: number = -1;

  public constructor(options: CircularModalCalculatorOptions) {
    this.materialProperty = options.materialProperty as Property<MaterialType>;
    this.outerRadiusProperty = options.outerRadiusProperty;
    this.excitationPositionProperty = options.excitationPositionProperty;
    this.boundaryCondition = options.boundaryCondition ?? "free";

    this.cachedDamping = this.calculateDamping();
  }

  /**
   * Calculate damping based on plate radius.
   */
  private calculateDamping(): number {
    const R = this.outerRadiusProperty.value;
    // Use equivalent area for damping: pi * R^2 ~ a * b for rectangular
    return DAMPING_COEFFICIENT / R;
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
   * Get the Bessel zero for mode (m, n) based on boundary condition.
   */
  private getBesselZero(m: number, n: number): number {
    if (this.boundaryCondition === "clamped") {
      return getBesselJZero(m, n);
    } else {
      return getBesselJPrimeZero(m, n);
    }
  }

  /**
   * Update the mode cache for the current wave number and radius.
   */
  private updateModeCache(waveNumber: number): void {
    const R = this.outerRadiusProperty.value;
    const gamma = this.cachedDamping;
    const k = waveNumber;

    // Convert excitation position to polar coordinates
    const excitation = this.excitationPositionProperty.value;
    const rExcit = Math.sqrt(excitation.x ** 2 + excitation.y ** 2);
    const thetaExcit = Math.atan2(excitation.y, excitation.x);

    const kSquared = k * k;
    const twoGammaK = 2 * gamma * k;

    this.cachedModes = [];

    // Iterate over angular modes m and radial modes n
    for (let m = 0; m <= MAX_M; m++) {
      for (let n = 0; n < MAX_N; n++) {
        // Get the Bessel zero for this mode
        const kmnR = this.getBesselZero(m, n);
        const kmn = kmnR / R;
        const kmnSquared = kmn * kmn;

        // Calculate source amplitude at excitation point
        // For m > 0, we use cos(m*theta) modes (symmetric about x-axis)
        const rNormalized = rExcit / R;
        const besselAtSource = besselJ(m, kmnR * rNormalized);
        const angularSource = m === 0 ? 1 : Math.cos(m * thetaExcit);
        const sourceAmplitude = besselAtSource * angularSource;

        // Skip modes with negligible contribution
        if (Math.abs(sourceAmplitude) < SOURCE_THRESHOLD) continue;

        // Complex denominator: (k² - k²_mn) + 2i*gamma*k
        const realPart = kSquared - kmnSquared;
        const denomMagSquared = realPart * realPart + twoGammaK * twoGammaK;

        if (denomMagSquared === 0) continue;

        const invDenom = 1 / denomMagSquared;

        this.cachedModes.push({
          m,
          kmnR,
          sourceAmplitude,
          realCoeff: sourceAmplitude * realPart * invDenom,
          imagCoeff: sourceAmplitude * twoGammaK * invDenom,
        });
      }
    }

    this.cacheWaveNumber = waveNumber;
    this.cacheRadius = R;
  }

  /**
   * Calculate displacement at point (x, y) for given wave number.
   */
  public psi(x: number, y: number, waveNumber: number): number {
    // Update cache if needed
    if (
      waveNumber !== this.cacheWaveNumber ||
      this.outerRadiusProperty.value !== this.cacheRadius
    ) {
      this.updateModeCache(waveNumber);
    }

    const R = this.outerRadiusProperty.value;

    // Convert to polar coordinates
    const r = Math.sqrt(x * x + y * y);
    const theta = Math.atan2(y, x);
    const rNormalized = r / R;

    // Check if outside plate
    if (r > R) {
      return 0;
    }

    let sumReal = 0;
    let sumImag = 0;

    for (const mode of this.cachedModes) {
      // Field term: J_m(k_mn * r) * cos(m * theta)
      const besselTerm = besselJ(mode.m, mode.kmnR * rNormalized);
      const angularTerm = mode.m === 0 ? 1 : Math.cos(mode.m * theta);
      const fieldTerm = besselTerm * angularTerm;

      sumReal += fieldTerm * mode.realCoeff;
      sumImag -= fieldTerm * mode.imagCoeff;
    }

    // Normalization factor for circular plate
    const normalization = 1 / (Math.PI * R * R);

    return normalization * Math.sqrt(sumReal * sumReal + sumImag * sumImag);
  }

  /**
   * Calculate resonance strength at given frequency.
   */
  public strength(frequency: number): number {
    const C = this.materialProperty.value.dispersionConstant;
    const k = Math.sqrt(frequency / C);
    const gamma = this.cachedDamping;
    const R = this.outerRadiusProperty.value;

    // Convert excitation to polar
    const excitation = this.excitationPositionProperty.value;
    const rExcit = Math.sqrt(excitation.x ** 2 + excitation.y ** 2);
    const thetaExcit = Math.atan2(excitation.y, excitation.x);
    const rNormalized = rExcit / R;

    const kSquared = k * k;
    const fourGammaKSquared = 4 * gamma * gamma * kSquared;

    let sum = 0;

    for (let m = 0; m <= MAX_M; m++) {
      // Multiplicity factor: 1 for m=0, 2 for m>0 (cos and sin modes)
      const multiplicity = m === 0 ? 1 : 2;

      for (let n = 0; n < MAX_N; n++) {
        const kmnR = this.getBesselZero(m, n);
        const kmn = kmnR / R;
        const kmnSquared = kmn * kmn;

        // Source amplitude squared
        const besselAtSource = besselJ(m, kmnR * rNormalized);
        const angularSource = m === 0 ? 1 : Math.cos(m * thetaExcit);
        const sourceSquared =
          besselAtSource * besselAtSource * angularSource * angularSource;

        if (sourceSquared < SOURCE_THRESHOLD * SOURCE_THRESHOLD) continue;

        // Resonance denominator
        const diff = kSquared - kmnSquared;
        const denominator = diff * diff + fourGammaKSquared;

        if (denominator > 0) {
          sum += (multiplicity * sourceSquared) / denominator;
        }
      }
    }

    return sum / (Math.PI * R * R);
  }
}
