/**
 * ParticleManager.ts
 *
 * Manages the particle lifecycle for Chladni plate visualization.
 * Handles particle initialization, stepping, boundary handling, and regeneration.
 * Extracted from ChladniModel for separation of concerns.
 *
 * Performance: Uses object pooling to reuse Vector2 instances and reduce GC pressure.
 * The particle pool is pre-allocated at the maximum grain count and reused across
 * reinitializations.
 */

import { Vector2 } from "scenerystack/dot";
import { NumberProperty, TReadOnlyProperty } from "scenerystack/axon";
import {
  TWO_PI,
  PARTICLE_STEP_SCALE,
  STEP_TIME_SCALE,
  TARGET_FPS,
  BoundaryMode,
  GrainCountOption,
  GRAIN_COUNT_OPTIONS,
} from "./ChladniConstants.js";

/**
 * Type for the displacement function (psi)
 */
export type DisplacementFunction = (x: number, y: number) => number;

/**
 * Options for creating a ParticleManager
 */
export interface ParticleManagerOptions {
  grainCountProperty: TReadOnlyProperty<GrainCountOption>;
  plateWidthProperty: TReadOnlyProperty<number>;
  plateHeightProperty: TReadOnlyProperty<number>;
  boundaryModeProperty: TReadOnlyProperty<BoundaryMode>;
  isPlayingProperty: TReadOnlyProperty<boolean>;
}

// Maximum particles (from GRAIN_COUNT_OPTIONS)
const MAX_PARTICLE_COUNT = GRAIN_COUNT_OPTIONS[GRAIN_COUNT_OPTIONS.length - 1]!.value;

/**
 * ParticleManager handles all particle-related operations for the Chladni simulation.
 *
 * Uses object pooling: A fixed-size pool of Vector2 objects is pre-allocated at
 * construction time. Active particles are tracked via activeCount rather than
 * array length, avoiding array resizing and object allocation during simulation.
 */
export class ParticleManager {
  private readonly grainCountProperty: TReadOnlyProperty<GrainCountOption>;
  private readonly plateWidthProperty: TReadOnlyProperty<number>;
  private readonly plateHeightProperty: TReadOnlyProperty<number>;
  private readonly boundaryModeProperty: TReadOnlyProperty<BoundaryMode>;
  private readonly isPlayingProperty: TReadOnlyProperty<boolean>;

  /**
   * Pre-allocated particle pool (fixed size at MAX_PARTICLE_COUNT).
   * Only the first 'activeCount' entries are valid active particles.
   */
  private readonly particlePool: Vector2[];

  /**
   * Number of currently active particles in the pool.
   */
  private activeCount: number;

  /**
   * Public view of active particle positions.
   * Returns a slice of the pool for backward compatibility.
   */
  public get particlePositions(): Vector2[] {
    return this.particlePool.slice(0, this.activeCount);
  }

  /**
   * Actual particle count (may differ from target if particles are removed)
   */
  public readonly actualParticleCountProperty: NumberProperty;

  public constructor(options: ParticleManagerOptions) {
    this.grainCountProperty = options.grainCountProperty;
    this.plateWidthProperty = options.plateWidthProperty;
    this.plateHeightProperty = options.plateHeightProperty;
    this.boundaryModeProperty = options.boundaryModeProperty;
    this.isPlayingProperty = options.isPlayingProperty;

    // Pre-allocate particle pool at maximum capacity
    this.particlePool = new Array(MAX_PARTICLE_COUNT);
    for (let i = 0; i < MAX_PARTICLE_COUNT; i++) {
      this.particlePool[i] = new Vector2(0, 0);
    }
    this.activeCount = 0;

    this.actualParticleCountProperty = new NumberProperty(0);
  }

  /**
   * Initialize all particles with random positions across the plate.
   * Uses centered coordinates: x in [-width/2, width/2], y in [-height/2, height/2].
   *
   * Reuses pre-allocated Vector2 objects from the pool to avoid GC pressure.
   */
  public initialize(): void {
    const count = this.grainCountProperty.value.value;
    const halfWidth = this.plateWidthProperty.value / 2;
    const halfHeight = this.plateHeightProperty.value / 2;

    // Reuse pooled Vector2 objects - just update their positions
    for (let i = 0; i < count; i++) {
      const particle = this.particlePool[i]!;
      // Random position in centered coordinates
      const x = (Math.random() - 0.5) * 2 * halfWidth;
      const y = (Math.random() - 0.5) * 2 * halfHeight;
      particle.setXY(x, y);
    }

    this.activeCount = count;
    this.actualParticleCountProperty.value = count;
  }

  /**
   * Step the particle simulation forward by dt seconds.
   * Moves particles based on a biased random walk where step size
   * is proportional to local displacement magnitude.
   *
   * Performance: Uses swap-remove for O(1) particle removal instead of splice's O(n).
   *
   * @param dt - Time step in seconds
   * @param psiFunction - Function that returns displacement at (x, y)
   */
  public step(dt: number, psiFunction: DisplacementFunction): void {
    if (!this.isPlayingProperty.value) {
      return;
    }

    // Scale factor for reasonable animation speed (normalize to target FPS)
    const timeScale = dt * TARGET_FPS;

    const halfWidth = this.plateWidthProperty.value / 2;
    const halfHeight = this.plateHeightProperty.value / 2;
    const boundaryMode = this.boundaryModeProperty.value;
    const isRemoveMode = boundaryMode === "remove";

    // Process active particles - iterate forward with swap-remove for efficiency
    let i = 0;
    while (i < this.activeCount) {
      const particle = this.particlePool[i]!;
      const x = particle.x;
      const y = particle.y;

      // Calculate displacement at current position
      const displacement = Math.abs(psiFunction(x, y));

      // Random walk with step size proportional to displacement
      const stepSize =
        PARTICLE_STEP_SCALE * displacement * timeScale * STEP_TIME_SCALE;
      const angle = Math.random() * TWO_PI;

      // Update position
      const newX = x + stepSize * Math.cos(angle);
      const newY = y + stepSize * Math.sin(angle);

      // Handle boundary based on mode
      if (isRemoveMode) {
        // Remove particles that leave the plate (Roussel's approach)
        if (Math.abs(newX) > halfWidth || Math.abs(newY) > halfHeight) {
          // Swap-remove: move last active particle to this slot, decrement count
          // This is O(1) vs splice's O(n)
          this.activeCount--;
          if (i < this.activeCount) {
            const lastParticle = this.particlePool[this.activeCount]!;
            particle.setXY(lastParticle.x, lastParticle.y);
          }
          // Don't increment i - need to process the swapped particle
        } else {
          particle.setXY(newX, newY);
          i++;
        }
      } else {
        // Clamp to plate boundaries (default behavior)
        const clampedX = Math.max(-halfWidth, Math.min(halfWidth, newX));
        const clampedY = Math.max(-halfHeight, Math.min(halfHeight, newY));
        particle.setXY(clampedX, clampedY);
        i++;
      }
    }

    // Update actual particle count (may have changed if particles were removed)
    this.actualParticleCountProperty.value = this.activeCount;
  }

  /**
   * Clamp all particles to current plate bounds.
   * Called when plate dimensions change to ensure particles stay within bounds.
   */
  public clampToBounds(): void {
    const halfWidth = this.plateWidthProperty.value / 2;
    const halfHeight = this.plateHeightProperty.value / 2;

    for (let i = 0; i < this.activeCount; i++) {
      const particle = this.particlePool[i]!;
      particle.x = Math.max(-halfWidth, Math.min(halfWidth, particle.x));
      particle.y = Math.max(-halfHeight, Math.min(halfHeight, particle.y));
    }
  }

  /**
   * Regenerate particles with new random positions.
   */
  public regenerate(): void {
    this.initialize();
  }

  /**
   * Get the current particle count.
   */
  public get count(): number {
    return this.activeCount;
  }

  /**
   * Get the target particle count from settings.
   */
  public get targetCount(): number {
    return this.grainCountProperty.value.value;
  }

  /**
   * Get read-only access to the active particles in the pool.
   * For performance-critical rendering, use getParticleAt() instead.
   */
  public getActiveParticles(): readonly Vector2[] {
    return this.particlePool.slice(0, this.activeCount);
  }

  /**
   * Get a particle at a specific index (for efficient iteration).
   * @param index - Index in range [0, count)
   * @returns The Vector2 at that index, or undefined if out of range
   */
  public getParticleAt(index: number): Vector2 | undefined {
    if (index >= 0 && index < this.activeCount) {
      return this.particlePool[index];
    }
    return undefined;
  }
}
