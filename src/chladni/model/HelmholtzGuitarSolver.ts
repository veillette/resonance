/**
 * HelmholtzGuitarSolver.ts
 *
 * Implements the 2D Helmholtz equation solver for guitar-shaped plates
 * using Green's function approach with numerical eigenmode computation.
 *
 * Physics Background:
 * For a driven Chladni plate, the response can be derived from the
 * 2D inhomogeneous Helmholtz equation:
 *   ∇²ψ + k²ψ = f(x,y)
 *
 * Using Green's function with modal expansion:
 *   G(r, r'; k) = Σₙ φₙ(r)φₙ(r') / (kₙ² - k² - 2iγk)
 *
 * where φₙ are the eigenmodes satisfying:
 *   ∇²φₙ + kₙ²φₙ = 0  with boundary condition φₙ = 0
 *
 * The response at point r due to excitation at r' is:
 *   ψ(r; k) = G(r, r'; k)
 *
 * For arbitrary boundaries like a guitar shape, eigenmodes are computed
 * numerically using finite difference discretization on a grid.
 */

import type { GuitarPlateGeometry } from "./GuitarPlateGeometry.js";
import {
  HELMHOLTZ_GRID_SIZE,
  HELMHOLTZ_MAX_MODES,
  HELMHOLTZ_EIGENVALUE_TOLERANCE,
  HELMHOLTZ_MAX_ITERATIONS,
  DAMPING_COEFFICIENT,
} from "./ChladniConstants.js";

/**
 * Represents a numerically computed eigenmode on the guitar domain.
 */
interface Eigenmode {
  /** Eigenvalue (kₙ²) */
  eigenvalue: number;
  /** Mode shape values sampled on the grid (only interior points) */
  modeShape: Float64Array;
  /** L2 norm of the mode (for normalization) */
  norm: number;
}

/**
 * HelmholtzGuitarSolver computes the displacement field for a guitar-shaped
 * Chladni plate using the Green's function approach with numerically computed
 * eigenmodes.
 *
 * The solver:
 * 1. Discretizes the guitar domain on a rectangular grid
 * 2. Identifies interior points (inside guitar boundary)
 * 3. Constructs finite difference Laplacian matrix
 * 4. Solves eigenvalue problem using power iteration with deflation
 * 5. Uses modal superposition for displacement calculation
 */
export class HelmholtzGuitarSolver {
  private readonly geometry: GuitarPlateGeometry;

  // Grid parameters
  private readonly gridSize: number;
  private readonly dx: number;
  private readonly dy: number;
  private gridWidth: number = 0;
  private gridHeight: number = 0;

  // Grid point classification
  /** Maps (ix, iy) to interior point index, -1 if boundary/exterior */
  private gridToInterior: Int32Array = new Int32Array(0);
  /** Number of interior grid points */
  private numInteriorPoints: number = 0;
  /** X coordinates of interior points */
  private interiorX: Float64Array = new Float64Array(0);
  /** Y coordinates of interior points */
  private interiorY: Float64Array = new Float64Array(0);

  // Computed eigenmodes
  private eigenmodes: Eigenmode[] = [];
  private modesComputed: boolean = false;

  // Cached values for psi evaluation
  private cachedScale: number = -1;
  private cachedExcitX: number = NaN;
  private cachedExcitY: number = NaN;
  private cachedWaveNumber: number = -1;
  /** Pre-computed source terms: φₙ(r') for each mode */
  private sourceCoeffs: Float64Array = new Float64Array(0);
  /** Pre-computed response coefficients including denominator */
  private responseRealCoeffs: Float64Array = new Float64Array(0);
  private responseImagCoeffs: Float64Array = new Float64Array(0);

  public constructor(geometry: GuitarPlateGeometry, gridSize?: number) {
    this.geometry = geometry;
    this.gridSize = gridSize ?? HELMHOLTZ_GRID_SIZE;

    // Initial grid spacing based on default dimensions
    this.dx = this.geometry.width / this.gridSize;
    this.dy = this.geometry.height / this.gridSize;

    // Initialize the grid and compute modes
    this.initializeGrid();
    this.computeEigenmodes();
  }

  /**
   * Initialize the computational grid and classify points as interior/exterior.
   */
  private initializeGrid(): void {
    const width = this.geometry.width;
    const height = this.geometry.height;
    const hw = width / 2;
    const hh = height / 2;

    // Compute grid dimensions with some margin
    this.gridWidth = Math.ceil(width / this.dx) + 2;
    this.gridHeight = Math.ceil(height / this.dy) + 2;

    const totalPoints = this.gridWidth * this.gridHeight;
    this.gridToInterior = new Int32Array(totalPoints).fill(-1);

    // First pass: count interior points and store coordinates
    const tempX: number[] = [];
    const tempY: number[] = [];
    let interiorIndex = 0;

    for (let iy = 0; iy < this.gridHeight; iy++) {
      const y = -hh + iy * this.dy;
      for (let ix = 0; ix < this.gridWidth; ix++) {
        const x = -hw + ix * this.dx;
        const gridIdx = iy * this.gridWidth + ix;

        // Check if point is inside the guitar boundary
        if (this.geometry.containsPoint(x, y)) {
          // Also ensure we're not too close to boundary for finite differences
          if (this.isInteriorPoint(x, y)) {
            this.gridToInterior[gridIdx] = interiorIndex;
            tempX.push(x);
            tempY.push(y);
            interiorIndex++;
          }
        }
      }
    }

    this.numInteriorPoints = interiorIndex;
    this.interiorX = new Float64Array(tempX);
    this.interiorY = new Float64Array(tempY);

    // Allocate coefficient arrays
    this.sourceCoeffs = new Float64Array(HELMHOLTZ_MAX_MODES);
    this.responseRealCoeffs = new Float64Array(HELMHOLTZ_MAX_MODES);
    this.responseImagCoeffs = new Float64Array(HELMHOLTZ_MAX_MODES);
  }

  /**
   * Check if a point is truly interior (has neighbors in all directions inside boundary).
   */
  private isInteriorPoint(x: number, y: number): boolean {
    const dx = this.dx;
    const dy = this.dy;

    // Check all 4 neighbors
    return (
      this.geometry.containsPoint(x + dx, y) &&
      this.geometry.containsPoint(x - dx, y) &&
      this.geometry.containsPoint(x, y + dy) &&
      this.geometry.containsPoint(x, y - dy)
    );
  }

  /**
   * Compute eigenmodes of the Helmholtz operator on the guitar domain.
   * Uses power iteration with deflation to find the lowest eigenmodes.
   *
   * The discrete Laplacian with finite differences:
   *   ∇²φ ≈ (φ(x+dx,y) + φ(x-dx,y) + φ(x,y+dy) + φ(x,y-dy) - 4φ(x,y)) / h²
   *
   * Eigenvalue problem: -∇²φ = λφ (note the negative sign)
   */
  private computeEigenmodes(): void {
    if (this.numInteriorPoints < 4) {
      console.warn("HelmholtzGuitarSolver: Too few interior points");
      this.modesComputed = false;
      return;
    }

    const n = this.numInteriorPoints;
    const maxModes = Math.min(HELMHOLTZ_MAX_MODES, Math.floor(n / 2));

    // Use inverse power iteration to find eigenmodes
    // Start with random initial vector
    this.eigenmodes = [];

    // Storage for deflation
    const foundModes: Float64Array[] = [];

    for (let modeIdx = 0; modeIdx < maxModes; modeIdx++) {
      const result = this.computeSingleEigenmode(foundModes);
      if (!result) break;

      this.eigenmodes.push(result);
      foundModes.push(result.modeShape);
    }

    this.modesComputed = this.eigenmodes.length > 0;
    this.cachedScale = this.geometry.scale;
  }

  /**
   * Compute a single eigenmode using inverse power iteration with deflation.
   */
  private computeSingleEigenmode(
    previousModes: Float64Array[],
  ): Eigenmode | null {
    const n = this.numInteriorPoints;
    const dx = this.dx;
    const dy = this.dy;
    const dxSq = dx * dx;
    const dySq = dy * dy;

    // Start with random vector
    let v = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      v[i] = Math.random() - 0.5;
    }

    // Orthogonalize against previous modes
    for (const prevMode of previousModes) {
      const dot = this.dotProduct(v, prevMode);
      for (let i = 0; i < n; i++) {
        v[i] = v[i]! - dot * prevMode[i]!;
      }
    }

    // Normalize
    let norm = Math.sqrt(this.dotProduct(v, v));
    if (norm < 1e-10) return null;
    for (let i = 0; i < n; i++) v[i] = v[i]! / norm;

    let eigenvalue = 0;
    const w = new Float64Array(n);

    // Power iteration for -∇² (finds smallest eigenvalue)
    for (let iter = 0; iter < HELMHOLTZ_MAX_ITERATIONS; iter++) {
      // Apply -∇² operator
      this.applyLaplacian(v, w, dxSq, dySq);

      // Orthogonalize against previous modes (deflation)
      for (const prevMode of previousModes) {
        const dot = this.dotProduct(w, prevMode);
        for (let i = 0; i < n; i++) {
          w[i] = w[i]! - dot * prevMode[i]!;
        }
      }

      // Compute Rayleigh quotient for eigenvalue estimate
      const vDotW = this.dotProduct(v, w);
      const vDotV = this.dotProduct(v, v);
      const newEigenvalue = vDotW / vDotV;

      // Normalize
      norm = Math.sqrt(this.dotProduct(w, w));
      if (norm < 1e-10) return null;

      for (let i = 0; i < n; i++) {
        v[i] = w[i]! / norm;
      }

      // Check convergence
      if (
        Math.abs(newEigenvalue - eigenvalue) <
        HELMHOLTZ_EIGENVALUE_TOLERANCE * Math.abs(newEigenvalue)
      ) {
        eigenvalue = newEigenvalue;
        break;
      }
      eigenvalue = newEigenvalue;
    }

    // Ensure eigenvalue is positive (should be for -∇²)
    if (eigenvalue <= 0) {
      eigenvalue = Math.abs(eigenvalue) + 1e-6;
    }

    return {
      eigenvalue: eigenvalue,
      modeShape: v,
      norm: 1.0, // Already normalized
    };
  }

  /**
   * Apply the negative Laplacian operator: w = -∇²v
   * Uses 5-point stencil finite difference with Dirichlet boundary (zero outside)
   */
  private applyLaplacian(
    v: Float64Array,
    w: Float64Array,
    dxSq: number,
    dySq: number,
  ): void {
    const width = this.gridWidth;
    const height = this.gridHeight;
    const gridToInterior = this.gridToInterior;

    // Coefficient for standard 5-point stencil
    const cx = 1.0 / dxSq;
    const cy = 1.0 / dySq;
    const center = 2.0 * cx + 2.0 * cy;

    for (let iy = 0; iy < height; iy++) {
      for (let ix = 0; ix < width; ix++) {
        const gridIdx = iy * width + ix;
        const i = gridToInterior[gridIdx]!;
        if (i < 0) continue; // Skip non-interior points

        // Center value
        let laplacian = center * v[i]!;

        // Left neighbor
        if (ix > 0) {
          const leftIdx = gridToInterior[gridIdx - 1]!;
          if (leftIdx >= 0) laplacian -= cx * v[leftIdx]!;
          // else: boundary (zero Dirichlet)
        }

        // Right neighbor
        if (ix < width - 1) {
          const rightIdx = gridToInterior[gridIdx + 1]!;
          if (rightIdx >= 0) laplacian -= cx * v[rightIdx]!;
        }

        // Bottom neighbor
        if (iy > 0) {
          const bottomIdx = gridToInterior[gridIdx - width]!;
          if (bottomIdx >= 0) laplacian -= cy * v[bottomIdx]!;
        }

        // Top neighbor
        if (iy < height - 1) {
          const topIdx = gridToInterior[gridIdx + width]!;
          if (topIdx >= 0) laplacian -= cy * v[topIdx]!;
        }

        w[i] = laplacian;
      }
    }
  }

  /**
   * Compute dot product of two vectors.
   */
  private dotProduct(a: Float64Array, b: Float64Array): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i]! * b[i]!;
    }
    return sum;
  }

  /**
   * Reinitialize the solver when geometry changes.
   */
  public reinitialize(): void {
    this.initializeGrid();
    this.computeEigenmodes();
    this.invalidateCache();
  }

  /**
   * Invalidate the response coefficient cache.
   */
  public invalidateCache(): void {
    this.cachedWaveNumber = -1;
    this.cachedExcitX = NaN;
    this.cachedExcitY = NaN;
  }

  /**
   * Check if solver needs reinitialization due to scale change.
   */
  public needsReinitialize(): boolean {
    return this.geometry.scale !== this.cachedScale;
  }

  /**
   * Update response coefficients for current excitation position and wave number.
   */
  private updateResponseCoefficients(
    excitX: number,
    excitY: number,
    waveNumber: number,
  ): void {
    const k = waveNumber;
    const kSquared = k * k;
    const width = this.geometry.width;
    const height = this.geometry.height;
    const gamma = DAMPING_COEFFICIENT / Math.sqrt(width * height);
    const twoGammaK = 2 * gamma * k;

    const numModes = this.eigenmodes.length;

    for (let m = 0; m < numModes; m++) {
      const mode = this.eigenmodes[m]!;

      // Evaluate mode at excitation position using interpolation
      const sourceValue = this.evaluateModeAtPoint(m, excitX, excitY);
      this.sourceCoeffs[m] = sourceValue;

      // Compute response denominator: (kₙ² - k²) - 2iγk
      // Note: eigenvalue is kₙ² (from -∇²φ = kₙ²φ)
      const realDenom = mode.eigenvalue - kSquared;
      const imagDenom = -twoGammaK;
      const denomMagSq = realDenom * realDenom + imagDenom * imagDenom;

      if (denomMagSq > 1e-20) {
        const invDenom = sourceValue / denomMagSq;
        this.responseRealCoeffs[m] = realDenom * invDenom;
        this.responseImagCoeffs[m] = imagDenom * invDenom;
      } else {
        this.responseRealCoeffs[m] = 0;
        this.responseImagCoeffs[m] = 0;
      }
    }

    this.cachedExcitX = excitX;
    this.cachedExcitY = excitY;
    this.cachedWaveNumber = waveNumber;
  }

  /**
   * Evaluate a mode shape at an arbitrary point using bilinear interpolation.
   */
  private evaluateModeAtPoint(
    modeIndex: number,
    x: number,
    y: number,
  ): number {
    if (!this.geometry.containsPoint(x, y)) {
      return 0;
    }

    const mode = this.eigenmodes[modeIndex];
    if (!mode) return 0;

    const hw = this.geometry.width / 2;
    const hh = this.geometry.height / 2;

    // Convert to grid coordinates
    const gx = (x + hw) / this.dx;
    const gy = (y + hh) / this.dy;

    const ix0 = Math.floor(gx);
    const iy0 = Math.floor(gy);
    const fx = gx - ix0;
    const fy = gy - iy0;

    // Bilinear interpolation using 4 nearest grid points
    const getValue = (ix: number, iy: number): number => {
      if (ix < 0 || ix >= this.gridWidth || iy < 0 || iy >= this.gridHeight) {
        return 0;
      }
      const idx = this.gridToInterior[iy * this.gridWidth + ix]!;
      return idx >= 0 ? mode.modeShape[idx]! : 0;
    };

    const v00 = getValue(ix0, iy0);
    const v10 = getValue(ix0 + 1, iy0);
    const v01 = getValue(ix0, iy0 + 1);
    const v11 = getValue(ix0 + 1, iy0 + 1);

    return (
      v00 * (1 - fx) * (1 - fy) +
      v10 * fx * (1 - fy) +
      v01 * (1 - fx) * fy +
      v11 * fx * fy
    );
  }

  /**
   * Calculate displacement at point (x, y) using Green's function modal expansion.
   *
   * ψ(r; k) = Σₙ φₙ(r) φₙ(r') / (kₙ² - k² - 2iγk)
   *
   * Returns |ψ|, the magnitude of the complex displacement.
   */
  public psi(
    x: number,
    y: number,
    excitX: number,
    excitY: number,
    waveNumber: number,
  ): number {
    if (!this.modesComputed) {
      return 0;
    }

    // Check if point is inside guitar
    if (!this.geometry.containsPoint(x, y)) {
      return 0;
    }

    // Check if scale changed - need full reinitialization
    if (this.needsReinitialize()) {
      this.reinitialize();
    }

    // Update response coefficients if excitation or wave number changed
    if (
      waveNumber !== this.cachedWaveNumber ||
      excitX !== this.cachedExcitX ||
      excitY !== this.cachedExcitY
    ) {
      this.updateResponseCoefficients(excitX, excitY, waveNumber);
    }

    // Sum modal contributions
    let sumReal = 0;
    let sumImag = 0;
    const numModes = this.eigenmodes.length;

    for (let m = 0; m < numModes; m++) {
      const fieldValue = this.evaluateModeAtPoint(m, x, y);
      sumReal += fieldValue * this.responseRealCoeffs[m]!;
      sumImag += fieldValue * this.responseImagCoeffs[m]!;
    }

    // Return magnitude with normalization
    const magnitude = Math.sqrt(sumReal * sumReal + sumImag * sumImag);
    const area = this.geometry.width * this.geometry.height;
    return (4 / area) * magnitude;
  }

  /**
   * Calculate resonance strength at given frequency.
   * This is the response amplitude used for plotting the resonance curve.
   *
   * I(k) = Σₙ |φₙ(r')|² / [(kₙ² - k²)² + 4γ²k²]
   */
  public strength(
    frequency: number,
    excitX: number,
    excitY: number,
    dispersionConstant: number,
  ): number {
    if (!this.modesComputed) {
      return 0;
    }

    const k = Math.sqrt(frequency / dispersionConstant);
    const kSquared = k * k;
    const width = this.geometry.width;
    const height = this.geometry.height;
    const gamma = DAMPING_COEFFICIENT / Math.sqrt(width * height);
    const fourGammaSqKSq = 4 * gamma * gamma * kSquared;

    let sum = 0;
    const numModes = this.eigenmodes.length;

    for (let m = 0; m < numModes; m++) {
      const mode = this.eigenmodes[m]!;

      // Evaluate |φₙ(r')|²
      const sourceValue = this.evaluateModeAtPoint(m, excitX, excitY);
      const sourceValueSq = sourceValue * sourceValue;

      if (sourceValueSq < 1e-10) continue;

      // Resonance denominator
      const diff = mode.eigenvalue - kSquared;
      const denominator = diff * diff + fourGammaSqKSq;

      if (denominator > 0) {
        sum += sourceValueSq / denominator;
      }
    }

    return sum;
  }

  /**
   * Get the number of computed eigenmodes.
   */
  public getModeCount(): number {
    return this.eigenmodes.length;
  }

  /**
   * Get eigenvalue (kₙ²) for mode n.
   */
  public getEigenvalue(modeIndex: number): number {
    return this.eigenmodes[modeIndex]?.eigenvalue ?? 0;
  }

  /**
   * Check if modes have been successfully computed.
   */
  public isReady(): boolean {
    return this.modesComputed;
  }
}
