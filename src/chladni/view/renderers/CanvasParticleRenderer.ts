/**
 * CanvasParticleRenderer.ts
 *
 * Canvas 2D implementation of the ParticleRenderer interface.
 * Renders particles using the HTML5 Canvas 2D API.
 */

import {
  CanvasNode,
  CanvasNodeOptions,
  Node,
} from "scenerystack/scenery";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import ResonanceColors from "../../../common/ResonanceColors.js";
import { ParticleRenderer } from "./ParticleRenderer.js";

// Particle rendering size in pixels
const PARTICLE_SIZE = 2;

/**
 * Internal CanvasNode for rendering particles.
 */
class ParticleCanvasNode extends CanvasNode {
  private particles: Vector2[] = [];
  private modelViewTransform: ModelViewTransform2;

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
  }

  public setCanvasSize(width: number, height: number): void {
    this.canvasBounds = new Bounds2(0, 0, width, height);
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    const color = ResonanceColors.chladniParticleProperty.value.toCSS();
    const radius = PARTICLE_SIZE / 2;

    context.fillStyle = color;

    // Draw all particles
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i]!;
      const viewPos = this.modelViewTransform.modelToViewPosition(particle);

      context.beginPath();
      context.arc(viewPos.x, viewPos.y, radius, 0, Math.PI * 2);
      context.fill();
    }
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
