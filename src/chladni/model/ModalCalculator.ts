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
 */

import { Vector2 } from "scenerystack/dot";
import { Property, NumberProperty, TReadOnlyProperty } from "scenerystack/axon";
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
 * ModalCalculator handles the physics calculations for plate displacement (psi)
 * and resonance strength at various frequencies.
 */
export class ModalCalculator {
  private readonly materialProperty: TReadOnlyProperty<MaterialType>;
  private readonly plateWidthProperty: TReadOnlyProperty<number>;
  private readonly plateHeightProperty: TReadOnlyProperty<number>;
  private readonly excitationPositionProperty: TReadOnlyProperty<Vector2>;

  // Cached values for performance
  private cachedDamping: number;

  public constructor(options: ModalCalculatorOptions) {
    this.materialProperty = options.materialProperty;
    this.plateWidthProperty = options.plateWidthProperty;
    this.plateHeightProperty = options.plateHeightProperty;
    this.excitationPositionProperty = options.excitationPositionProperty;

    // Initialize cached damping
    this.cachedDamping = this.calculateDamping();
  }

  /**
   * Calculate the damping coefficient based on plate dimensions.
   * Uses geometric mean of plate dimensions.
   */
  public calculateDamping(): number {
    const a = this.plateWidthProperty.value;
    const b = this.plateHeightProperty.value;
    return DAMPING_COEFFICIENT / Math.sqrt(a * b);
  }

  /**
   * Update cached damping value. Call when plate dimensions change.
   */
  public updateCachedDamping(): void {
    this.cachedDamping = this.calculateDamping();
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
   */
  public psi(x: number, y: number, waveNumber: number): number {
    const k = waveNumber;
    const gamma = this.cachedDamping;
    const a = this.plateWidthProperty.value;
    const b = this.plateHeightProperty.value;

    // Convert centered coordinates to physics coordinates (0 to a, 0 to b)
    const excitation = this.excitationPositionProperty.value;
    const excitX = excitation.x + a / 2;
    const excitY = excitation.y + b / 2;

    // Convert input centered coordinates to physics coordinates
    const physX = x + a / 2;
    const physY = y + b / 2;

    let sumReal = 0;
    let sumImag = 0;
    const mOverA = Math.PI / a;
    const nOverB = Math.PI / b;
    const twoGammaK = 2 * gamma * k;
    const kSquared = k * k;

    // Sum over modes m, n = 0, 1, 2, ..., MAX_MODE
    for (let m = 0; m <= MAX_MODE; m += MODE_STEP) {
      // Source term X component: cos(mπx'/a)
      const sourceX = Math.cos((m * Math.PI * excitX) / a);

      for (let n = 0; n <= MAX_MODE; n += MODE_STEP) {
        // Skip the (0,0) mode to avoid division issues
        if (m === 0 && n === 0) continue;

        // Source term: cos(mπx'/a)cos(nπy'/b)
        const sourceY = Math.cos((n * Math.PI * excitY) / b);
        const sourceTerm = sourceX * sourceY;

        // Skip modes with negligible source contribution (optimization)
        if (Math.abs(sourceTerm) < SOURCE_THRESHOLD) continue;

        // Modal wave number for rectangular plate: k_{m,n} = π√((m/a)² + (n/b)²)
        const kmn = Math.sqrt(
          m * mOverA * (m * mOverA) + n * nOverB * (n * nOverB),
        );
        const kmnSquared = kmn * kmn;

        // Complex denominator: (k² - k²ₘₙ) + 2iγk
        const realPart = kSquared - kmnSquared;
        const imagPart = twoGammaK;
        const denomMagSquared = realPart * realPart + imagPart * imagPart;

        // Field term: cos(mπx/a)cos(nπy/b)
        const fieldX = Math.cos((m * Math.PI * physX) / a);
        const fieldY = Math.cos((n * Math.PI * physY) / b);
        const fieldTerm = fieldX * fieldY;

        // Complex division: numerator / (realPart + i*imagPart)
        // = numerator * (realPart - i*imagPart) / |denominator|²
        const numerator = sourceTerm * fieldTerm;
        sumReal += (numerator * realPart) / denomMagSquared;
        sumImag -= (numerator * imagPart) / denomMagSquared;
      }
    }

    // Return magnitude of complex sum, with normalization for rectangular plate
    const normalization = NORMALIZATION_NUMERATOR / (a * b);
    return normalization * Math.sqrt(sumReal * sumReal + sumImag * sumImag);
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
