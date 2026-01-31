/**
 * ChladniVisualizationNode.ts
 *
 * A CanvasNode-based visualization for rendering Chladni pattern particles.
 * Uses HTML5 Canvas for efficient rendering of 10,000+ particles.
 * Supports rectangular plates with different width and height.
 *
 * Coordinate System:
 * - Model: (0,0) at center, +Y up
 * - View: (0,0) at top-left, +Y down
 * - Uses ModelViewTransform2 for coordinate conversion
 */

import { CanvasNode, CanvasNodeOptions } from "scenerystack/scenery";
import { Bounds2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { ChladniModel } from "../model/ChladniModel.js";
import ResonanceColors from "../../common/ResonanceColors.js";

// Particle rendering size in pixels
const PARTICLE_SIZE = 1.5;

export interface ChladniVisualizationNodeOptions extends CanvasNodeOptions {
  // Size of the visualization area (deprecated, use visualizationWidth/Height)
  visualizationSize?: number;
  // Width of the visualization area in pixels
  visualizationWidth?: number;
  // Height of the visualization area in pixels
  visualizationHeight?: number;
}

export class ChladniVisualizationNode extends CanvasNode {
  private readonly model: ChladniModel;
  private visualizationWidth: number;
  private visualizationHeight: number;

  // Model-View transform for coordinate conversion
  private modelViewTransform: ModelViewTransform2;

  // Cached colors for rendering
  private particleColor: string = "#ffffff";
  private backgroundColor: string = "#1a1a2e";

  public constructor(
    model: ChladniModel,
    providedOptions?: ChladniVisualizationNodeOptions,
  ) {
    // Support both legacy visualizationSize and new width/height options
    const defaultSize = 400;
    const visualizationWidth = providedOptions?.visualizationWidth
      ?? providedOptions?.visualizationSize
      ?? defaultSize;
    const visualizationHeight = providedOptions?.visualizationHeight
      ?? providedOptions?.visualizationSize
      ?? defaultSize;

    super({
      canvasBounds: new Bounds2(0, 0, visualizationWidth, visualizationHeight),
      ...providedOptions,
    });

    this.model = model;
    this.visualizationWidth = visualizationWidth;
    this.visualizationHeight = visualizationHeight;

    // Create the model-view transform
    this.modelViewTransform = this.createModelViewTransform();

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
   * Create the ModelViewTransform2 for coordinate conversion.
   * Model: (0,0) at center, +Y up
   * View: (0,0) at top-left, +Y down
   */
  private createModelViewTransform(): ModelViewTransform2 {
    const plateWidth = this.model.plateWidth;
    const plateHeight = this.model.plateHeight;

    // Model bounds: centered coordinates
    const modelBounds = new Bounds2(
      -plateWidth / 2, -plateHeight / 2,
      plateWidth / 2, plateHeight / 2
    );

    // View bounds: (0,0) at top-left
    const viewBounds = new Bounds2(0, 0, this.visualizationWidth, this.visualizationHeight);

    // Create transform with Y inversion (model +Y up, view +Y down)
    return ModelViewTransform2.createRectangleInvertedYMapping(modelBounds, viewBounds);
  }

  /**
   * Paint the particles onto the canvas.
   * Uses ModelViewTransform2 to convert model coordinates to view coordinates.
   */
  public override paintCanvas(context: CanvasRenderingContext2D): void {
    const width = this.visualizationWidth;
    const height = this.visualizationHeight;

    // Draw background
    context.fillStyle = this.backgroundColor;
    context.fillRect(0, 0, width, height);

    // Draw particles
    context.fillStyle = this.particleColor;

    const particles = this.model.particlePositions;
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i]!;

      // Convert model coordinates to view coordinates using the transform
      const viewPos = this.modelViewTransform.modelToViewPosition(particle);

      // Draw as small filled circle (or square for performance)
      context.fillRect(
        viewPos.x - PARTICLE_SIZE / 2,
        viewPos.y - PARTICLE_SIZE / 2,
        PARTICLE_SIZE,
        PARTICLE_SIZE,
      );
    }

    // Draw border
    context.strokeStyle = "#444466";
    context.lineWidth = 2;
    context.strokeRect(0, 0, width, height);
  }

  /**
   * Update the visualization (called each frame when animating).
   */
  public update(): void {
    this.invalidatePaint();
  }

  /**
   * Resize the visualization to new dimensions.
   * The center position is preserved.
   * Recreates the ModelViewTransform2 for the new dimensions.
   */
  public resize(newWidth: number, newHeight: number): void {
    this.visualizationWidth = newWidth;
    this.visualizationHeight = newHeight;
    this.setCanvasBounds(new Bounds2(0, 0, newWidth, newHeight));

    // Recreate the transform for new dimensions
    this.modelViewTransform = this.createModelViewTransform();

    this.invalidatePaint();
  }

  /**
   * Get the current visualization width.
   */
  public getVisualizationWidth(): number {
    return this.visualizationWidth;
  }

  /**
   * Get the current visualization height.
   */
  public getVisualizationHeight(): number {
    return this.visualizationHeight;
  }
}
