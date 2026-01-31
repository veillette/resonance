/**
 * ChladniVisualizationNode.ts
 *
 * A CanvasNode-based visualization for rendering Chladni pattern particles.
 * Uses HTML5 Canvas for efficient rendering of 10,000+ particles.
 */

import { CanvasNode, CanvasNodeOptions } from "scenerystack/scenery";
import { Bounds2 } from "scenerystack/dot";
import { ChladniModel } from "../model/ChladniModel.js";
import ResonanceColors from "../../common/ResonanceColors.js";

// Particle rendering size in pixels
const PARTICLE_SIZE = 1.5;

export interface ChladniVisualizationNodeOptions extends CanvasNodeOptions {
  // Size of the visualization area
  visualizationSize?: number;
}

export class ChladniVisualizationNode extends CanvasNode {
  private readonly model: ChladniModel;
  private readonly visualizationSize: number;

  // Cached colors for rendering
  private particleColor: string = "#ffffff";
  private backgroundColor: string = "#1a1a2e";

  public constructor(
    model: ChladniModel,
    providedOptions?: ChladniVisualizationNodeOptions,
  ) {
    const visualizationSize = providedOptions?.visualizationSize ?? 400;

    super({
      canvasBounds: new Bounds2(0, 0, visualizationSize, visualizationSize),
      ...providedOptions,
    });

    this.model = model;
    this.visualizationSize = visualizationSize;

    // Update cached colors when color properties change
    ResonanceColors.chladniParticleProperty.link((color) => {
      this.particleColor = color.toCSS();
      this.invalidatePaint();
    });

    ResonanceColors.chladniBackgroundProperty.link((color) => {
      this.backgroundColor = color.toCSS();
      this.invalidatePaint();
    });
  }

  /**
   * Paint the particles onto the canvas.
   */
  public override paintCanvas(context: CanvasRenderingContext2D): void {
    const size = this.visualizationSize;

    // Draw background
    context.fillStyle = this.backgroundColor;
    context.fillRect(0, 0, size, size);

    // Draw particles
    context.fillStyle = this.particleColor;

    const particles = this.model.particlePositions;
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i]!;
      // Convert normalized (0-1) coordinates to view coordinates
      const x = particle.x * size;
      const y = particle.y * size;

      // Draw as small filled circle (or square for performance)
      context.fillRect(
        x - PARTICLE_SIZE / 2,
        y - PARTICLE_SIZE / 2,
        PARTICLE_SIZE,
        PARTICLE_SIZE,
      );
    }

    // Draw border
    context.strokeStyle = "#444466";
    context.lineWidth = 2;
    context.strokeRect(0, 0, size, size);
  }

  /**
   * Update the visualization (called each frame when animating).
   */
  public update(): void {
    this.invalidatePaint();
  }
}
