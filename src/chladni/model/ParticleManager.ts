/**
 * ParticleManager.ts
 *
 * Manages the particle lifecycle for Chladni plate visualization.
 * Handles particle initialization, stepping, boundary handling, and regeneration.
 * Extracted from ChladniModel for separation of concerns.
 */

import { Vector2 } from "scenerystack/dot";
import { NumberProperty, TReadOnlyProperty, Property } from "scenerystack/axon";
import {
  TWO_PI,
  PARTICLE_STEP_SCALE,
  STEP_TIME_SCALE,
  TARGET_FPS,
  BoundaryMode,
  GrainCountOption,
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

/**
 * ParticleManager handles all particle-related operations for the Chladni simulation.
 */
export class ParticleManager {
  private readonly grainCountProperty: TReadOnlyProperty<GrainCountOption>;
  private readonly plateWidthProperty: TReadOnlyProperty<number>;
  private readonly plateHeightProperty: TReadOnlyProperty<number>;
  private readonly boundaryModeProperty: TReadOnlyProperty<BoundaryMode>;
  private readonly isPlayingProperty: TReadOnlyProperty<boolean>;

  /**
   * Particle positions (centered model coordinates)
   */
  public readonly particlePositions: Vector2[];

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

    this.particlePositions = [];
    this.actualParticleCountProperty = new NumberProperty(0);
  }

  /**
   * Initialize all particles with random positions across the plate.
   * Uses centered coordinates: x in [-width/2, width/2], y in [-height/2, height/2].
   */
  public initialize(): void {
    const count = this.grainCountProperty.value.value;
    const halfWidth = this.plateWidthProperty.value / 2;
    const halfHeight = this.plateHeightProperty.value / 2;

    this.particlePositions.length = 0;
    for (let i = 0; i < count; i++) {
      // Random position in centered coordinates
      const x = (Math.random() - 0.5) * 2 * halfWidth;
      const y = (Math.random() - 0.5) * 2 * halfHeight;
      this.particlePositions.push(new Vector2(x, y));
    }

    this.actualParticleCountProperty.value = this.particlePositions.length;
  }

  /**
   * Step the particle simulation forward by dt seconds.
   * Moves particles based on a biased random walk where step size
   * is proportional to local displacement magnitude.
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

    // Process particles in reverse order for safe removal
    for (let i = this.particlePositions.length - 1; i >= 0; i--) {
      const particle = this.particlePositions[i]!;
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
      if (boundaryMode === "remove") {
        // Remove particles that leave the plate (Roussel's approach)
        if (Math.abs(newX) > halfWidth || Math.abs(newY) > halfHeight) {
          this.particlePositions.splice(i, 1);
        } else {
          particle.setXY(newX, newY);
        }
      } else {
        // Clamp to plate boundaries (default behavior)
        const clampedX = Math.max(-halfWidth, Math.min(halfWidth, newX));
        const clampedY = Math.max(-halfHeight, Math.min(halfHeight, newY));
        particle.setXY(clampedX, clampedY);
      }
    }

    // Update actual particle count (may have changed if particles were removed)
    this.actualParticleCountProperty.value = this.particlePositions.length;
  }

  /**
   * Clamp all particles to current plate bounds.
   * Called when plate dimensions change to ensure particles stay within bounds.
   */
  public clampToBounds(): void {
    const halfWidth = this.plateWidthProperty.value / 2;
    const halfHeight = this.plateHeightProperty.value / 2;

    for (const particle of this.particlePositions) {
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
    return this.particlePositions.length;
  }

  /**
   * Get the target particle count from settings.
   */
  public get targetCount(): number {
    return this.grainCountProperty.value.value;
  }
}
