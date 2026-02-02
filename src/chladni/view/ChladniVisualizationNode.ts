/**
 * ChladniVisualizationNode.ts
 *
 * A high-performance visualization for rendering Chladni pattern particles.
 * Supports both Canvas 2D and WebGL (via SceneryStack's Sprites system) rendering modes.
 * User can choose between renderers via preferences.
 *
 * Coordinate System:
 * - Model: (0,0) at center, +Y up
 * - View: (0,0) at top-left, +Y down
 * - Uses ModelViewTransform2 for coordinate conversion
 */

import { Node, NodeOptions, Path, Rectangle } from "scenerystack/scenery";
import { Bounds2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { DerivedProperty, Property } from "scenerystack/axon";
import { ChladniModel } from "../model/ChladniModel.js";
import { PlateShape, PlateShapeType } from "../model/PlateShape.js";
import ResonanceColors from "../../common/ResonanceColors.js";
import { RendererType } from "../../preferences/ResonancePreferencesModel.js";
import { createChladniTransform } from "./ChladniTransformFactory.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";
import {
  ParticleRenderer,
  CanvasParticleRenderer,
  WebGLParticleRenderer,
} from "./renderers/index.js";

export interface ChladniVisualizationNodeOptions extends NodeOptions {
  // Size of the visualization area (deprecated, use visualizationWidth/Height)
  visualizationSize?: number;
  // Width of the visualization area in pixels
  visualizationWidth?: number;
  // Height of the visualization area in pixels
  visualizationHeight?: number;
}

export class ChladniVisualizationNode extends Node {
  private readonly model: ChladniModel;
  private readonly rendererTypeProperty: Property<RendererType>;
  private visualizationWidth: number;
  private visualizationHeight: number;

  // Model-View transform for coordinate conversion
  private modelViewTransform: ModelViewTransform2;

  // Rectangular elements
  private readonly backgroundRect: Rectangle;
  private readonly borderRect: Rectangle;
  private readonly innerBorderRect: Rectangle;

  // Shape-specific elements (for circle and guitar)
  private shapePath: Path | null = null;
  private shapeBorderPath: Path | null = null;

  // Container for shape elements
  private readonly shapeContainer: Node;

  // Particle renderer (strategy pattern)
  private particleRenderer: ParticleRenderer | null = null;
  private currentRendererType: RendererType;
  private currentShape: PlateShapeType;

  public constructor(
    model: ChladniModel,
    rendererTypeProperty: Property<RendererType>,
    providedOptions?: ChladniVisualizationNodeOptions,
  ) {
    super(providedOptions);

    // Support both legacy visualizationSize and new width/height options
    const defaultSize = 400;
    const visualizationWidth =
      providedOptions?.visualizationWidth ??
      providedOptions?.visualizationSize ??
      defaultSize;
    const visualizationHeight =
      providedOptions?.visualizationHeight ??
      providedOptions?.visualizationSize ??
      defaultSize;

    this.model = model;
    this.rendererTypeProperty = rendererTypeProperty;
    this.visualizationWidth = visualizationWidth;
    this.visualizationHeight = visualizationHeight;
    this.currentRendererType = rendererTypeProperty.value;
    this.currentShape = model.plateShape;

    // Create the model-view transform using the shared factory
    this.modelViewTransform = createChladniTransform(
      model.plateWidth,
      model.plateHeight,
      visualizationWidth,
      visualizationHeight,
    );

    // Create background rectangle (for rectangular shape)
    this.backgroundRect = new Rectangle(
      0,
      0,
      visualizationWidth,
      visualizationHeight,
      {
        fill: ResonanceColors.chladniBackgroundProperty,
      },
    );
    this.addChild(this.backgroundRect);

    // Create shape container for non-rectangular shapes
    this.shapeContainer = new Node();
    this.addChild(this.shapeContainer);

    // Create border rectangle (outer) for rectangular shape
    this.borderRect = new Rectangle(
      0,
      0,
      visualizationWidth,
      visualizationHeight,
      {
        stroke: ResonanceColors.chladniPlateBorderProperty,
        lineWidth: 2,
      },
    );

    // Create inner border rectangle (shown only in clamp mode)
    const innerInset = 4;
    this.innerBorderRect = new Rectangle(
      innerInset,
      innerInset,
      visualizationWidth - 2 * innerInset,
      visualizationHeight - 2 * innerInset,
      {
        stroke: ResonanceColors.chladniPlateBorderProperty,
        lineWidth: 1,
        opacity: 0.6,
      },
    );

    // Initialize the renderer using strategy pattern
    this.initializeRenderer(this.currentRendererType);

    // Add borders on top
    this.addChild(this.borderRect);
    this.addChild(this.innerBorderRect);

    // Update shape display
    this.updateShapeDisplay();

    // Link inner border visibility to boundary mode
    model.boundaryModeProperty.link((mode) => {
      this.innerBorderRect.visible = mode === "clamp";
    });

    // Listen for renderer type changes
    rendererTypeProperty.link((newRenderer) => {
      if (newRenderer !== this.currentRendererType) {
        this.switchRenderer(newRenderer);
      }
    });

    // Listen for shape changes
    model.plateShapeProperty.link((shape) => {
      if (shape !== this.currentShape) {
        this.currentShape = shape;
        this.updateShapeDisplay();
      }
    });

    // Listen for circular geometry changes
    model.getCircularGeometry().outerRadiusProperty.link(() => {
      if (this.currentShape === PlateShape.CIRCLE) {
        this.updateShapeDisplay();
      }
    });
    model.getCircularGeometry().innerRadiusProperty.link(() => {
      if (this.currentShape === PlateShape.CIRCLE) {
        this.updateShapeDisplay();
      }
    });

    // Listen for guitar geometry changes
    model.getGuitarGeometry().scaleProperty.link(() => {
      if (this.currentShape === PlateShape.GUITAR) {
        this.updateShapeDisplay();
      }
    });

    // Update renderer when particle color changes
    ResonanceColors.chladniParticleProperty.link(() => {
      this.particleRenderer?.onColorChange();
    });

    // --- Accessibility (PDOM) Setup ---
    // Make the visualization accessible to screen readers
    this.tagName = "div";
    this.ariaRole = "img";
    this.accessibleName =
      ResonanceStrings.chladni.a11y.visualizationLabelStringProperty;

    // Create dynamic description that updates with model state
    const descriptionProperty = new DerivedProperty(
      [
        model.frequencyProperty,
        model.materialProperty,
        model.actualParticleCountProperty,
      ],
      (frequency, material, particleCount) => {
        return `Chladni plate visualization showing ${particleCount} particles on a ${material.name} plate at ${Math.round(frequency)} Hz. Particles gather along nodal lines where the plate has zero displacement.`;
      },
    );

    descriptionProperty.link((description) => {
      this.descriptionContent = description;
    });
  }

  /**
   * Update the shape display based on current shape.
   */
  private updateShapeDisplay(): void {
    const shape = this.model.plateShape;
    const centerX = this.visualizationWidth / 2;
    const centerY = this.visualizationHeight / 2;

    // Clear existing shape paths
    this.shapeContainer.removeAllChildren();
    this.shapePath = null;
    this.shapeBorderPath = null;

    // Show/hide rectangular elements based on shape
    const isRect = shape === PlateShape.RECTANGLE;
    this.backgroundRect.visible = isRect;
    this.borderRect.visible = isRect;
    this.innerBorderRect.visible = isRect && this.model.boundaryModeProperty.value === "clamp";

    if (shape === PlateShape.CIRCLE) {
      // Create circular shape
      const circularGeom = this.model.getCircularGeometry();
      const outerRadius = circularGeom.outerRadius;
      const innerRadius = circularGeom.innerRadius;

      // Convert to view coordinates
      const scale = Math.min(
        this.visualizationWidth / (outerRadius * 2),
        this.visualizationHeight / (outerRadius * 2),
      ) * 0.95; // 95% to leave some margin

      const viewOuterRadius = outerRadius * scale;
      const viewInnerRadius = innerRadius * scale;

      // Create background circle
      let circleShape: Shape;
      if (innerRadius > 0) {
        // Annular ring
        circleShape = new Shape()
          .arc(centerX, centerY, viewOuterRadius, 0, Math.PI * 2, false)
          .arc(centerX, centerY, viewInnerRadius, Math.PI * 2, 0, true)
          .close();
      } else {
        // Solid disc
        circleShape = Shape.circle(centerX, centerY, viewOuterRadius);
      }

      this.shapePath = new Path(circleShape, {
        fill: ResonanceColors.chladniBackgroundProperty,
      });
      this.shapeContainer.addChild(this.shapePath);

      // Create border
      const borderShape = new Shape()
        .arc(centerX, centerY, viewOuterRadius, 0, Math.PI * 2, false);
      if (innerRadius > 0) {
        borderShape.arc(centerX, centerY, viewInnerRadius, 0, Math.PI * 2, false);
      }

      this.shapeBorderPath = new Path(borderShape, {
        stroke: ResonanceColors.chladniPlateBorderProperty,
        lineWidth: 2,
      });
      this.shapeContainer.addChild(this.shapeBorderPath);

    } else if (shape === PlateShape.GUITAR) {
      // Create guitar shape
      const guitarGeom = this.model.getGuitarGeometry();
      const vertices = guitarGeom.getVertices();

      if (vertices.length > 0) {
        // Calculate scale to fit in visualization
        const bounds = guitarGeom.getBounds();
        const scaleX = (this.visualizationWidth * 0.9) / bounds.width;
        const scaleY = (this.visualizationHeight * 0.9) / bounds.height;
        const scale = Math.min(scaleX, scaleY);

        // Build shape from vertices
        const guitarShape = new Shape();
        const firstVertex = vertices[0]!;
        guitarShape.moveTo(
          centerX + firstVertex.x * scale,
          centerY - firstVertex.y * scale, // Y is inverted in view
        );

        for (let i = 1; i < vertices.length; i++) {
          const v = vertices[i]!;
          guitarShape.lineTo(centerX + v.x * scale, centerY - v.y * scale);
        }
        guitarShape.close();

        this.shapePath = new Path(guitarShape, {
          fill: ResonanceColors.chladniBackgroundProperty,
        });
        this.shapeContainer.addChild(this.shapePath);

        this.shapeBorderPath = new Path(guitarShape, {
          stroke: ResonanceColors.chladniPlateBorderProperty,
          lineWidth: 2,
        });
        this.shapeContainer.addChild(this.shapeBorderPath);
      }
    }
  }

  /**
   * Initialize the specified renderer using strategy pattern.
   */
  private initializeRenderer(rendererType: RendererType): void {
    // Dispose existing renderer
    if (this.particleRenderer) {
      const oldNode = this.particleRenderer.getNode();
      if (this.hasChild(oldNode)) {
        this.removeChild(oldNode);
      }
      this.particleRenderer.dispose();
    }

    // Create new renderer based on type
    if (rendererType === RendererType.WEBGL) {
      this.particleRenderer = new WebGLParticleRenderer(
        this.visualizationWidth,
        this.visualizationHeight,
        this.modelViewTransform,
      );
    } else {
      this.particleRenderer = new CanvasParticleRenderer(
        this.visualizationWidth,
        this.visualizationHeight,
        this.modelViewTransform,
      );
    }

    // Insert renderer node between background and border
    this.insertChild(1, this.particleRenderer.getNode());
    this.currentRendererType = rendererType;
  }

  /**
   * Switch to a different renderer.
   */
  private switchRenderer(newRendererType: RendererType): void {
    this.initializeRenderer(newRendererType);
    this.update();
  }

  /**
   * Update the visualization (called each frame when animating).
   */
  public update(): void {
    if (this.particleRenderer) {
      this.particleRenderer.update(
        this.model.particlePositions,
        this.modelViewTransform,
      );
    }
  }

  /**
   * Resize the visualization to new dimensions.
   * The center position is preserved.
   * Recreates the ModelViewTransform2 for the new dimensions.
   */
  public resize(newWidth: number, newHeight: number): void {
    this.visualizationWidth = newWidth;
    this.visualizationHeight = newHeight;

    // Recreate the transform using the shared factory
    this.modelViewTransform = createChladniTransform(
      this.model.plateWidth,
      this.model.plateHeight,
      newWidth,
      newHeight,
    );

    // Update background and borders
    this.backgroundRect.setRect(0, 0, newWidth, newHeight);
    this.borderRect.setRect(0, 0, newWidth, newHeight);
    const innerInset = 4;
    this.innerBorderRect.setRect(
      innerInset,
      innerInset,
      newWidth - 2 * innerInset,
      newHeight - 2 * innerInset,
    );

    // Resize the renderer
    if (this.particleRenderer) {
      this.particleRenderer.resize(
        newWidth,
        newHeight,
        this.modelViewTransform,
      );
    }

    // Explicitly set local bounds so they update immediately (even when paused)
    this.localBounds = new Bounds2(0, 0, newWidth, newHeight);

    // Update shape display for new dimensions
    this.updateShapeDisplay();

    // Update positions
    this.update();
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

  /**
   * Dispose of the visualization node and its renderer.
   */
  public override dispose(): void {
    this.particleRenderer?.dispose();
    super.dispose();
  }
}
