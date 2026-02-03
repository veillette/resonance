/**
 * GuitarModalCalculator.ts
 *
 * Modal calculator for guitar (dreadnought) shaped Chladni plates using
 * the 2D Helmholtz equation with Green's function approach.
 *
 * Physics Background:
 * Since Chladni's experiment is a driven oscillation system, we use the
 * 2D inhomogeneous Helmholtz equation. The Green's function approach
 * derives the response function of the thin plate:
 *
 *   ∇²ψ + k²ψ = δ(r - r')    (point excitation at r')
 *
 * The solution uses modal expansion with eigenmodes φₙ that satisfy:
 *   ∇²φₙ + kₙ²φₙ = 0    with boundary condition φₙ = 0
 *
 * Green's function response:
 *   G(r, r'; k) = Σₙ φₙ(r)φₙ(r') / (kₙ² - k² - 2iγk)
 *
 * For arbitrary guitar boundaries, eigenmodes are computed numerically
 * using finite difference discretization on a grid.
 */

import { Property, TReadOnlyProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import type { MaterialType } from "./Material.js";
import type { IModalCalculatorStrategy } from "./IModalCalculatorStrategy.js";
import type { GuitarPlateGeometry } from "./GuitarPlateGeometry.js";
import { HelmholtzGuitarSolver } from "./HelmholtzGuitarSolver.js";
import { DAMPING_COEFFICIENT } from "./ChladniConstants.js";

/**
 * Options for creating a GuitarModalCalculator.
 */
export interface GuitarModalCalculatorOptions {
  materialProperty: TReadOnlyProperty<MaterialType>;
  geometry: GuitarPlateGeometry;
  excitationPositionProperty: Property<Vector2>;
}

/**
 * GuitarModalCalculator computes Chladni patterns for guitar-shaped plates
 * using the 2D Helmholtz equation with numerically computed eigenmodes.
 *
 * This approach is more physically accurate than simple boundary masking
 * because the eigenmodes properly satisfy the boundary conditions of the
 * guitar shape.
 */
export class GuitarModalCalculator implements IModalCalculatorStrategy {
  private readonly materialProperty: TReadOnlyProperty<MaterialType>;
  private readonly excitationPositionProperty: Property<Vector2>;
  private readonly geometry: GuitarPlateGeometry;

  // Helmholtz solver for numerical eigenmode computation
  private readonly helmholtzSolver: HelmholtzGuitarSolver;

  // Cached values
  private cachedDamping: number;
  private cachedWaveNumber: number = -1;
  private cachedScale: number = -1;

  public constructor(options: GuitarModalCalculatorOptions) {
    this.materialProperty = options.materialProperty as Property<MaterialType>;
    this.geometry = options.geometry;
    this.excitationPositionProperty = options.excitationPositionProperty;

    this.cachedDamping = this.calculateDamping();

    // Initialize the Helmholtz solver with the guitar geometry
    this.helmholtzSolver = new HelmholtzGuitarSolver(this.geometry);

    // Invalidate cache when scale changes
    this.geometry.scaleProperty.lazyLink(() => this.invalidateModeCache());
  }

  /**
   * Calculate damping based on guitar dimensions.
   * gamma = DAMPING_COEFFICIENT / sqrt(area)
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
   * Called when excitation position or other parameters change.
   */
  public invalidateModeCache(): void {
    this.cachedWaveNumber = -1;
    this.helmholtzSolver.invalidateCache();
  }

  /**
   * Calculate wave number from frequency using material dispersion.
   * k = sqrt(f / C) where C is the material dispersion constant.
   */
  public calculateWaveNumber(frequency: number): number {
    const C = this.materialProperty.value.dispersionConstant;
    return Math.sqrt(frequency / C);
  }

  /**
   * Calculate displacement at point (x, y) for given wave number.
   *
   * Uses the Helmholtz Green's function approach:
   *   ψ(r; k) = G(r, r'; k) = Σₙ φₙ(r)φₙ(r') / (kₙ² - k² - 2iγk)
   *
   * Returns |ψ|, the magnitude of the complex displacement.
   * Returns 0 if the point is outside the guitar boundary.
   */
  public psi(x: number, y: number, waveNumber: number): number {
    // Check if scale changed - solver needs reinitialization
    if (this.geometry.scale !== this.cachedScale) {
      this.helmholtzSolver.reinitialize();
      this.cachedScale = this.geometry.scale;
      this.cachedWaveNumber = -1;
    }

    // Get excitation position
    const excitation = this.excitationPositionProperty.value;

    // Use Helmholtz solver for physically accurate computation
    return this.helmholtzSolver.psi(
      x,
      y,
      excitation.x,
      excitation.y,
      waveNumber,
    );
  }

  /**
   * Calculate resonance strength at given frequency.
   *
   * I(k) = Σₙ |φₙ(r')|² / [(kₙ² - k²)² + 4γ²k²]
   *
   * This gives the amplitude response used for the resonance curve plot.
   */
  public strength(frequency: number): number {
    const C = this.materialProperty.value.dispersionConstant;
    const excitation = this.excitationPositionProperty.value;

    return this.helmholtzSolver.strength(
      frequency,
      excitation.x,
      excitation.y,
      C,
    );
  }
}
