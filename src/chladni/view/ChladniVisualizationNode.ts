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

import {
  CanvasNode,
  CanvasNodeOptions,
  Node,
  NodeOptions,
  Rectangle,
  Sprite,
  SpriteImage,
  SpriteInstance,
  SpriteInstanceTransformType,
  Sprites,
} from "scenerystack/scenery";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Property } from "scenerystack/axon";
import { ChladniModel } from "../model/ChladniModel.js";
import ResonanceColors from "../../common/ResonanceColors.js";
import { RendererType } from "../../preferences/ResonancePreferencesModel.js";

// Particle rendering size in pixels
const PARTICLE_SIZE = 2;

export interface ChladniVisualizationNodeOptions extends NodeOptions {
  // Size of the visualization area (deprecated, use visualizationWidth/Height)
  visualizationSize?: number;
  // Width of the visualization area in pixels
  visualizationWidth?: number;
  // Height of the visualization area in pixels
  visualizationHeight?: number;
}

/**
 * Custom CanvasNode for rendering particles using 2D Canvas API.
 */
class ParticleCanvasNode extends CanvasNode {
  private readonly model: ChladniModel;
  private modelViewTransform: ModelViewTransform2;

  public constructor(
    model: ChladniModel,
    modelViewTransform: ModelViewTransform2,
    width: number,
    height: number,
    options?: CanvasNodeOptions,
  ) {
    super({
      ...options,
      canvasBounds: new Bounds2(0, 0, width, height),
    });
    this.model = model;
    this.modelViewTransform = modelViewTransform;
  }

  public setModelViewTransform(transform: ModelViewTransform2): void {
    this.modelViewTransform = transform;
  }

  public setCanvasSize(width: number, height: number): void {
    this.canvasBounds = new Bounds2(0, 0, width, height);
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    const particles = this.model.particlePositions;
    const color = ResonanceColors.chladniParticleProperty.value.toCSS();
    const radius = PARTICLE_SIZE / 2;

    context.fillStyle = color;

    // Draw all particles
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i]!;
      const viewPos = this.modelViewTransform.modelToViewPosition(particle);

      context.beginPath();
      context.arc(viewPos.x, viewPos.y, radius, 0, Math.PI * 2);
      context.fill();
    }
  }
}

export class ChladniVisualizationNode extends Node {
  private readonly model: ChladniModel;
  private readonly rendererTypeProperty: Property<RendererType>;
  private visualizationWidth: number;
  private visualizationHeight: number;

  // Model-View transform for coordinate conversion
  private modelViewTransform: ModelViewTransform2;

  // Common elements
  private readonly backgroundRect: Rectangle;
  private readonly borderRect: Rectangle;

  // WebGL (Sprites) rendering components
  private spritesNode: Sprites | null = null;
  private sprite: Sprite | null = null;
  private spriteInstances: SpriteInstance[] = [];

  // Canvas rendering components
  private canvasNode: ParticleCanvasNode | null = null;

  // Current renderer type
  private currentRenderer: RendererType;

  public constructor(
    model: ChladniModel,
    rendererTypeProperty: Property<RendererType>,
    providedOptions?: ChladniVisualizationNodeOptions,
  ) {
    super(providedOptions);

    // Support both legacy visualizationSize and new width/height options
    const defaultSize = 400;
    const visualizationWidth = providedOptions?.visualizationWidth
      ?? providedOptions?.visualizationSize
      ?? defaultSize;
    const visualizationHeight = providedOptions?.visualizationHeight
      ?? providedOptions?.visualizationSize
      ?? defaultSize;

    this.model = model;
    this.rendererTypeProperty = rendererTypeProperty;
    this.visualizationWidth = visualizationWidth;
    this.visualizationHeight = visualizationHeight;
    this.currentRenderer = rendererTypeProperty.value;

    // Create the model-view transform
    this.modelViewTransform = this.createModelViewTransform();

    // Create background rectangle
    this.backgroundRect = new Rectangle(0, 0, visualizationWidth, visualizationHeight, {
      fill: ResonanceColors.chladniBackgroundProperty,
    });
    this.addChild(this.backgroundRect);

    // Create border rectangle
    this.borderRect = new Rectangle(0, 0, visualizationWidth, visualizationHeight, {
      stroke: ResonanceColors.chladniPlateBorderProperty,
      lineWidth: 2,
    });

    // Initialize the appropriate renderer
    this.initializeRenderer(this.currentRenderer);

    // Add border on top
    this.addChild(this.borderRect);

    // Listen for renderer type changes
    rendererTypeProperty.link((newRenderer) => {
      if (newRenderer !== this.currentRenderer) {
        this.switchRenderer(newRenderer);
      }
    });

    // Update sprite/canvas when particle color changes
    ResonanceColors.chladniParticleProperty.link(() => {
      if (this.currentRenderer === RendererType.WEBGL && this.spritesNode) {
        this.recreateSpritesNode();
      } else if (this.currentRenderer === RendererType.CANVAS && this.canvasNode) {
        this.canvasNode.invalidatePaint();
      }
    });
  }

  /**
   * Initialize the specified renderer.
   */
  private initializeRenderer(rendererType: RendererType): void {
    if (rendererType === RendererType.WEBGL) {
      this.initializeWebGLRenderer();
    } else {
      this.initializeCanvasRenderer();
    }
    this.currentRenderer = rendererType;
  }

  /**
   * Initialize WebGL (Sprites) renderer.
   */
  private initializeWebGLRenderer(): void {
    // Create the particle sprite
    this.sprite = this.createParticleSprite();

    // Create sprite instances for all particles
    this.spriteInstances = [];
    this.initializeSpriteInstances();

    // Create the sprites node for WebGL rendering
    this.spritesNode = new Sprites({
      sprites: [this.sprite],
      spriteInstances: this.spriteInstances,
      canvasBounds: new Bounds2(0, 0, this.visualizationWidth, this.visualizationHeight),
      hitTestSprites: false,
      renderer: "webgl",
    });
    this.insertChild(1, this.spritesNode);
  }

  /**
   * Initialize Canvas 2D renderer.
   */
  private initializeCanvasRenderer(): void {
    this.canvasNode = new ParticleCanvasNode(
      this.model,
      this.modelViewTransform,
      this.visualizationWidth,
      this.visualizationHeight,
    );
    this.insertChild(1, this.canvasNode);
  }

  /**
   * Switch between renderers.
   */
  private switchRenderer(newRenderer: RendererType): void {
    // Remove current renderer
    if (this.currentRenderer === RendererType.WEBGL && this.spritesNode) {
      this.removeChild(this.spritesNode);
      this.spritesNode = null;
      this.sprite = null;
      this.spriteInstances = [];
    } else if (this.currentRenderer === RendererType.CANVAS && this.canvasNode) {
      this.removeChild(this.canvasNode);
      this.canvasNode = null;
    }

    // Initialize new renderer
    this.initializeRenderer(newRenderer);

    // Update positions
    this.update();
  }

  /**
   * Recreate the sprites node with updated sprite/instances.
   * Called when sprite appearance or instance count changes.
   */
  private recreateSpritesNode(): void {
    if (!this.spritesNode) return;

    // Remove old sprites node
    this.removeChild(this.spritesNode);

    // Create new sprite
    this.sprite = this.createParticleSprite();

    // Update all instances to use new sprite
    for (const instance of this.spriteInstances) {
      instance.sprite = this.sprite;
    }

    // Create new sprites node
    this.spritesNode = new Sprites({
      sprites: [this.sprite],
      spriteInstances: this.spriteInstances,
      canvasBounds: new Bounds2(0, 0, this.visualizationWidth, this.visualizationHeight),
      hitTestSprites: false,
      renderer: "webgl",
    });

    // Insert between background and border
    this.insertChild(1, this.spritesNode);
  }

  /**
   * Create a sprite image for a single particle.
   */
  private createParticleSprite(): Sprite {
    // Create a small canvas for the particle
    const canvas = document.createElement("canvas");
    const size = PARTICLE_SIZE * 2; // Extra space for anti-aliasing
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d")!;
    const color = ResonanceColors.chladniParticleProperty.value;

    // Draw a filled circle
    context.beginPath();
    context.arc(size / 2, size / 2, PARTICLE_SIZE / 2, 0, Math.PI * 2);
    context.fillStyle = color.toCSS();
    context.fill();

    // Create sprite image with center offset
    const spriteImage = new SpriteImage(canvas, new Vector2(size / 2, size / 2));
    return new Sprite(spriteImage);
  }

  /**
   * Initialize sprite instances for all particles.
   */
  private initializeSpriteInstances(): void {
    const particles = this.model.particlePositions;

    // Clear existing instances
    this.spriteInstances.length = 0;

    // Create an instance for each particle
    for (let i = 0; i < particles.length; i++) {
      const instance = SpriteInstance.pool.fetch();
      instance.sprite = this.sprite!;
      instance.transformType = SpriteInstanceTransformType.TRANSLATION;
      instance.alpha = 1.0;
      instance.matrix.setToIdentity();
      this.spriteInstances.push(instance);
    }
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
   * Update the visualization (called each frame when animating).
   * Updates sprite instance positions or triggers canvas repaint.
   */
  public update(): void {
    if (this.currentRenderer === RendererType.WEBGL) {
      this.updateWebGL();
    } else {
      this.updateCanvas();
    }
  }

  /**
   * Update WebGL (Sprites) renderer.
   */
  private updateWebGL(): void {
    if (!this.spritesNode) return;

    const particles = this.model.particlePositions;

    // Ensure we have the right number of sprite instances
    if (this.spriteInstances.length !== particles.length) {
      this.initializeSpriteInstances();
      this.recreateSpritesNode();
    }

    // Update each sprite instance position
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i]!;
      const instance = this.spriteInstances[i]!;

      // Convert model coordinates to view coordinates
      const viewPos = this.modelViewTransform.modelToViewPosition(particle);

      // Update the instance's translation matrix
      instance.matrix.setToTranslation(viewPos.x, viewPos.y);
    }

    // Trigger repaint
    this.spritesNode.invalidatePaint();
  }

  /**
   * Update Canvas renderer.
   */
  private updateCanvas(): void {
    if (!this.canvasNode) return;
    this.canvasNode.invalidatePaint();
  }

  /**
   * Resize the visualization to new dimensions.
   * The center position is preserved.
   * Recreates the ModelViewTransform2 for the new dimensions.
   */
  public resize(newWidth: number, newHeight: number): void {
    this.visualizationWidth = newWidth;
    this.visualizationHeight = newHeight;

    // Recreate the transform for new dimensions
    this.modelViewTransform = this.createModelViewTransform();

    // Update background and border
    this.backgroundRect.setRect(0, 0, newWidth, newHeight);
    this.borderRect.setRect(0, 0, newWidth, newHeight);

    // Update renderer-specific elements
    if (this.currentRenderer === RendererType.WEBGL && this.spritesNode) {
      this.recreateSpritesNode();
    } else if (this.currentRenderer === RendererType.CANVAS && this.canvasNode) {
      this.canvasNode.setCanvasSize(newWidth, newHeight);
      this.canvasNode.setModelViewTransform(this.modelViewTransform);
    }

    // Explicitly set local bounds so they update immediately (even when paused)
    this.localBounds = new Bounds2(0, 0, newWidth, newHeight);

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
}
