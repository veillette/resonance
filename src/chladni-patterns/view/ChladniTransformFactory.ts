/**
 * ChladniTransformFactory.ts
 *
 * Factory for creating ModelViewTransform2 instances for the Chladni plate visualization.
 * Eliminates duplicate transform creation logic across ChladniScreenView and
 * ChladniVisualizationNode.
 *
 * Coordinate System:
 * - Model: (0,0) at plate center, x in [-width/2, width/2], y in [-height/2, height/2], +Y up
 * - View: (0,0) at top-left of visualization, +Y down
 */

import { Bounds2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";

/**
 * Creates a ModelViewTransform2 for converting between model and view coordinates.
 *
 * @param plateWidth - Physical plate width in meters
 * @param plateHeight - Physical plate height in meters
 * @param viewWidth - Visualization width in pixels
 * @param viewHeight - Visualization height in pixels
 * @returns A ModelViewTransform2 with Y inversion (model +Y up, view +Y down)
 */
export function createChladniTransform(
  plateWidth: number,
  plateHeight: number,
  viewWidth: number,
  viewHeight: number,
): ModelViewTransform2 {
  // Model bounds: centered coordinates
  const modelBounds = new Bounds2(
    -plateWidth / 2,
    -plateHeight / 2,
    plateWidth / 2,
    plateHeight / 2,
  );

  // View bounds: (0,0) at top-left
  const viewBounds = new Bounds2(0, 0, viewWidth, viewHeight);

  // Create transform with Y inversion (model +Y up, view +Y down)
  return ModelViewTransform2.createRectangleInvertedYMapping(
    modelBounds,
    viewBounds,
  );
}

/**
 * Configuration object for creating transforms, used when passing multiple parameters.
 */
export interface ChladniTransformConfig {
  plateWidth: number;
  plateHeight: number;
  viewWidth: number;
  viewHeight: number;
}

/**
 * Creates a ModelViewTransform2 from a configuration object.
 *
 * @param config - Configuration with plate and view dimensions
 * @returns A ModelViewTransform2 with Y inversion
 */
export function createChladniTransformFromConfig(
  config: ChladniTransformConfig,
): ModelViewTransform2 {
  return createChladniTransform(
    config.plateWidth,
    config.plateHeight,
    config.viewWidth,
    config.viewHeight,
  );
}
