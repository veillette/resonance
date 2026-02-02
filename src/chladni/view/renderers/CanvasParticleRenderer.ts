/**
 * CanvasParticleRenderer.ts
 *
 * Canvas 2D implementation of the ParticleRenderer interface.
 * Renders particles using the HTML5 Canvas 2D API.
 *
 * Performance optimizations:
 * - Dirty rectangle culling: only clears and redraws the region containing particles
 * - Single fill() call with Path2D batching for reduced draw call overhead
 * - Reused view position vector to reduce allocations
 */

import { CanvasNode, CanvasNodeOptions, Node } from "scenerystack/scenery";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import ResonanceColors from "../../../common/ResonanceColors.js";
import { ParticleRenderer } from "./ParticleRenderer.js";

// Particle rendering size in pixels
const PARTICLE_SIZE = 2;
const PARTICLE_RADIUS = PARTICLE_SIZE / 2;

// Padding around dirty region to account for particle radius and anti-aliasing
const DIRTY_REGION_PADDING = PARTICLE_SIZE + 1;

/**
 * Internal CanvasNode for rendering particles with dirty rectangle culling.
 */
class ParticleCanvasNode extends CanvasNode {
  private particles: Vector2[] = [];
  private modelViewTransform: ModelViewTransform2;

  // Dirty region tracking for efficient clearing
  private previousDirtyBounds: Bounds2 | null = null;

  // Reused vector for coordinate transformation (reduces allocations)
  private readonly tempViewPos: Vector2 = new Vector2(0, 0);

  public constructor(
    modelViewTransform: ModelViewTransform2,
    width: number,
    height: number,
    options?: CanvasNodeOptions,
  ) {
    super({
      ...options,
      canvasBounds: new Bounds2(0, 0, width, height),
    });
    this.modelViewTransform = modelViewTransform;
  }

  public setParticles(particles: Vector2[]): void {
    this.particles = particles;
  }

  public setModelViewTransform(transform: ModelViewTransform2): void {
    this.modelViewTransform = transform;
    // Reset dirty bounds when transform changes
    this.previousDirtyBounds = null;
  }

  public setCanvasSize(width: number, height: number): void {
    this.canvasBounds = new Bounds2(0, 0, width, height);
    // Reset dirty bounds when canvas size changes
    this.previousDirtyBounds = null;
  }

  /**
   * Calculate the bounding box of all particles in view coordinates.
   * Returns null if there are no particles.
   */
  private calculateParticleBounds(): Bounds2 | null {
    if (this.particles.length === 0) {
      return null;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i]!;
      // Use the transform to get view coordinates
      const viewX = this.modelViewTransform.modelToViewX(particle.x);
      const viewY = this.modelViewTransform.modelToViewY(particle.y);

      if (viewX < minX) minX = viewX;
      if (viewX > maxX) maxX = viewX;
      if (viewY < minY) minY = viewY;
      if (viewY > maxY) maxY = viewY;
    }

    // Add padding for particle radius and anti-aliasing
    return new Bounds2(
      minX - DIRTY_REGION_PADDING,
      minY - DIRTY_REGION_PADDING,
      maxX + DIRTY_REGION_PADDING,
      maxY + DIRTY_REGION_PADDING,
    );
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    const color = ResonanceColors.chladniParticleProperty.value.toCSS();
    const canvasBounds = this.canvasBounds;

    // Calculate current particle bounds
    const currentBounds = this.calculateParticleBounds();

    // Determine the region to clear (union of previous and current bounds)
    let clearBounds: Bounds2;
    if (this.previousDirtyBounds && currentBounds) {
      // Union of previous and current bounds, clamped to canvas
      clearBounds = this.previousDirtyBounds
        .union(currentBounds)
        .intersection(canvasBounds);
    } else if (this.previousDirtyBounds) {
      clearBounds = this.previousDirtyBounds.intersection(canvasBounds);
    } else if (currentBounds) {
      clearBounds = currentBounds.intersection(canvasBounds);
    } else {
      // No particles previously or now - nothing to do
      return;
    }

    // Clear only the dirty region (more efficient than clearing entire canvas)
    if (clearBounds.isValid() && !clearBounds.isEmpty()) {
      context.clearRect(
        Math.floor(clearBounds.minX),
        Math.floor(clearBounds.minY),
        Math.ceil(clearBounds.width) + 1,
        Math.ceil(clearBounds.height) + 1,
      );
    }

    // Store current bounds for next frame
    this.previousDirtyBounds = currentBounds;

    // Skip drawing if no particles
    if (this.particles.length === 0) {
      return;
    }

    // Draw all particles with batched path operations
    context.fillStyle = color;
    context.beginPath();

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i]!;
      const viewX = this.modelViewTransform.modelToViewX(particle.x);
      const viewY = this.modelViewTransform.modelToViewY(particle.y);

      // Add arc to current path (batched - single fill at end)
      context.moveTo(viewX + PARTICLE_RADIUS, viewY);
      context.arc(viewX, viewY, PARTICLE_RADIUS, 0, Math.PI * 2);
    }

    // Single fill call for all particles
    context.fill();
  }
}

/**
 * Canvas 2D particle renderer implementation.
 */
export class CanvasParticleRenderer implements ParticleRenderer {
  private readonly canvasNode: ParticleCanvasNode;
  private particles: Vector2[] = [];

  public constructor(
    width: number,
    height: number,
    transform: ModelViewTransform2,
  ) {
    this.canvasNode = new ParticleCanvasNode(transform, width, height);
  }

  public getNode(): Node {
    return this.canvasNode;
  }

  public update(particles: Vector2[], transform: ModelViewTransform2): void {
    this.particles = particles;
    this.canvasNode.setParticles(particles);
    this.canvasNode.setModelViewTransform(transform);
    this.canvasNode.invalidatePaint();
  }

  public resize(
    width: number,
    height: number,
    transform: ModelViewTransform2,
  ): void {
    this.canvasNode.setCanvasSize(width, height);
    this.canvasNode.setModelViewTransform(transform);
  }

  public onColorChange(): void {
    this.canvasNode.invalidatePaint();
  }

  public dispose(): void {
    // Canvas nodes are automatically disposed when removed from the scene graph
  }
}
