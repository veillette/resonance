/**
 * IModalCalculatorStrategy.ts
 *
 * Interface for modal calculator strategies.
 * Each plate shape has its own physics implementation.
 */

/**
 * Interface for modal calculator strategies.
 * Implementations calculate displacement field and resonance strength
 * for different plate geometries.
 */
export interface IModalCalculatorStrategy {
  /**
   * Calculate the displacement at a given point for a given wave number.
   *
   * @param x - X coordinate in model space (centered at origin)
   * @param y - Y coordinate in model space (centered at origin)
   * @param k - Wave number
   * @returns Displacement value (psi)
   */
  psi(x: number, y: number, k: number): number;

  /**
   * Calculate the resonance strength at a given frequency.
   *
   * @param frequency - Frequency in Hz
   * @returns Resonance strength (amplitude response)
   */
  strength(frequency: number): number;

  /**
   * Calculate the wave number for a given frequency.
   *
   * @param frequency - Frequency in Hz
   * @returns Wave number k
   */
  calculateWaveNumber(frequency: number): number;

  /**
   * Invalidate any cached mode calculations.
   * Called when excitation position or other parameters change.
   */
  invalidateModeCache(): void;

  /**
   * Update cached damping value.
   * Called when plate dimensions change.
   */
  updateCachedDamping(): void;
}

// Note: Options for creating modal calculator strategies are defined
// in each specific calculator implementation.
