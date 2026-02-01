/**
 * ParticleRenderer.ts
 *
 * Strategy interface for particle rendering.
 * Allows switching between different rendering implementations (Canvas 2D, WebGL).
 */

import { Node } from "scenerystack/scenery";
import { Vector2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";

/**
 * Interface for particle renderers.
 * Implementations handle the actual drawing of particles using different technologies.
 */
export interface ParticleRenderer {
  /**
   * Get the rendering node to be added to the scene graph.
   */
  getNode(): Node;

  /**
   * Update the renderer with new particle positions.
   * @param particles - Array of particle positions in model coordinates
   * @param transform - Transform for converting model to view coordinates
   */
  update(particles: Vector2[], transform: ModelViewTransform2): void;

  /**
   * Resize the renderer to new dimensions.
   * @param width - New width in pixels
   * @param height - New height in pixels
   * @param transform - Updated transform for the new dimensions
   */
  resize(width: number, height: number, transform: ModelViewTransform2): void;

  /**
   * Called when particle color changes.
   */
  onColorChange(): void;

  /**
   * Dispose of the renderer, cleaning up any resources.
   */
  dispose(): void;
}
