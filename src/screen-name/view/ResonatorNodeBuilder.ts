/**
 * ResonatorNodeBuilder creates spring and mass nodes for resonators.
 * Returns cleanup functions to prevent memory leaks when resonators are rebuilt.
 */

import { Node, Text, Rectangle } from "scenerystack/scenery";
import { DragListener } from "scenerystack/scenery";
import { ParametricSpringNode, PhetFont } from "scenerystack/scenery-phet";
import { Vector2Property } from "scenerystack/dot";
import { Vector2, Bounds2 } from "scenerystack/dot";
import { Property, NumberProperty } from "scenerystack/axon";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { ResonanceModel } from "../../common/model/index.js";
import ResonanceColors from "../../common/ResonanceColors.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import { CircularUpdateGuard } from "../../common/util/index.js";

/**
 * Context needed to build resonator nodes.
 */
export interface ResonatorBuildContext {
  modelViewTransform: ModelViewTransform2;
  layoutBounds: Bounds2;
  driverPlate: Rectangle;
  selectedResonatorIndexProperty: NumberProperty;
}

/**
 * Result from building a spring node.
 */
export interface SpringNodeResult {
  node: ParametricSpringNode;
  cleanup: () => void;
}

/**
 * Result from building a mass node.
 */
export interface MassNodeResult {
  node: Node;
  cleanup: () => void;
}

/**
 * Result from building all resonator nodes.
 */
export interface ResonatorBuildResult {
  springNodes: ParametricSpringNode[];
  massNodes: Node[];
  cleanups: Array<() => void>;
}

export class ResonatorNodeBuilder {
  /**
   * Calculate mass box size based on mass value using surface area scaling.
   * Surface area scales linearly with mass, so side length scales with √mass.
   */
  public static calculateMassSize(mass: number): number {
    const minMass = ResonanceConstants.MASS_RANGE.min;
    const maxMass = ResonanceConstants.MASS_RANGE.max;
    const minSize = ResonanceConstants.MIN_MASS_SIZE;
    const maxSize = ResonanceConstants.MAX_MASS_SIZE;

    // Surface area scaling: side = minSize + (maxSize - minSize) × √((mass - minMass) / (maxMass - minMass))
    const normalizedMass = (mass - minMass) / (maxMass - minMass);
    const size = minSize + (maxSize - minSize) * Math.sqrt(normalizedMass);

    return size;
  }

  /**
   * Creates a spring node for a resonator with line width (stroke) varying by spring constant only.
   * The coil stroke width depends ONLY on spring constant, NOT on mass or any other property.
   */
  public static createSpringNode(
    resonatorModel: ResonanceModel,
  ): SpringNodeResult {
    // Calculate line width based ONLY on spring constant (not mass or other properties)
    // Uses square root scaling to prevent stroke from growing too large at high spring constants
    const calculateLineWidth = (springConstant: number): number => {
      const minK = ResonanceConstants.SPRING_CONSTANT_RANGE.min;
      const maxK = ResonanceConstants.SPRING_CONSTANT_RANGE.max;
      // Clamp spring constant to valid range
      const clampedK = Math.max(minK, Math.min(maxK, springConstant));
      // Normalize to [0, 1]
      const normalizedK = (clampedK - minK) / (maxK - minK);
      // Use square root to compress high values - stroke grows slower at high spring constants
      const sqrtNormalizedK = Math.sqrt(normalizedK);
      return (
        ResonanceConstants.SPRING_LINE_WIDTH_MIN +
        sqrtNormalizedK *
          (ResonanceConstants.SPRING_LINE_WIDTH_MAX -
            ResonanceConstants.SPRING_LINE_WIDTH_MIN)
      );
    };

    const springNode = new ParametricSpringNode({
      frontColor: ResonanceColors.springProperty,
      middleColor: ResonanceColors.springProperty,
      backColor: ResonanceColors.springBackProperty,
      loops: ResonanceConstants.SPRING_LOOPS,
      radius: ResonanceConstants.SPRING_RADIUS,
      aspectRatio: ResonanceConstants.SPRING_ASPECT_RATIO,
      pointsPerLoop: ResonanceConstants.SPRING_POINTS_PER_LOOP,
      lineWidth: calculateLineWidth(resonatorModel.springConstantProperty.value),
      leftEndLength: ResonanceConstants.SPRING_LEFT_END_LENGTH,
      rightEndLength: ResonanceConstants.SPRING_RIGHT_END_LENGTH,
      rotation: -Math.PI / 2,
      boundsMethod: "none",
    });

    // Line width (stroke) varies ONLY with spring constant - NOT mass or any other property
    // Only listen to springConstantProperty, not massProperty
    const springConstantListener = (springConstant: number) => {
      springNode.lineWidthProperty.value = calculateLineWidth(springConstant);
    };

    resonatorModel.springConstantProperty.link(springConstantListener);

    const cleanup = () => {
      resonatorModel.springConstantProperty.unlink(springConstantListener);
    };

    return { node: springNode, cleanup };
  }

  /**
   * Creates a mass node for a resonator with drag handling and position sync.
   */
  public static createMassNode(
    resonatorModel: ResonanceModel,
    index: number,
    count: number,
    context: ResonatorBuildContext,
  ): MassNodeResult {
    const {
      modelViewTransform,
      layoutBounds,
      driverPlate,
      selectedResonatorIndexProperty,
    } = context;

    const massNode = new Node();
    const initialMassSize = ResonatorNodeBuilder.calculateMassSize(
      resonatorModel.massProperty.value,
    );
    const massBox = new Rectangle(0, 0, initialMassSize, initialMassSize, {
      fill: ResonanceColors.massProperty,
      stroke: ResonanceColors.massStrokeProperty,
      lineWidth: ResonanceConstants.MASS_STROKE_LINE_WIDTH,
      cornerRadius: 3,
    });
    const massLabel = new Text(`${index + 1}`, {
      font: new PhetFont({
        size: Math.max(
          ResonanceConstants.MASS_LABEL_FONT_SIZE_MIN,
          ResonanceConstants.MASS_LABEL_FONT_SIZE_BASE - count * 2,
        ),
        weight: "bold",
      }),
      fill: ResonanceColors.massLabelProperty,
      center: massBox.center,
    });
    massNode.addChild(massBox);
    massNode.addChild(massLabel);

    // Update mass box size when mass changes
    const massListener = (mass: number) => {
      const newSize = ResonatorNodeBuilder.calculateMassSize(mass);
      massBox.setRect(0, 0, newSize, newSize);
      massLabel.center = massBox.center;
    };
    resonatorModel.massProperty.link(massListener);

    // Change label color when dragging to indicate selection
    const draggingListener = (isDragging: boolean) => {
      massLabel.fill = isDragging
        ? ResonanceColors.massLabelDraggingProperty
        : ResonanceColors.massLabelProperty;
    };
    resonatorModel.isDraggingProperty.link(draggingListener);

    // Add vertical drag listener using positionProperty
    massNode.cursor = "ns-resize";

    // Create a Vector2Property for dragging that stays synchronized with the resonator's position
    const massPositionProperty = new Vector2Property(new Vector2(0, 0));

    // Guard to prevent circular updates
    const positionGuard = new CircularUpdateGuard();

    // Bidirectional sync: model position -> view position
    // Only update view from model when NOT dragging
    const positionListener = (modelPosition: number) => {
      // Skip model->view updates while dragging (user controls position)
      if (resonatorModel.isDraggingProperty.value) {
        return;
      }
      positionGuard.run(() => {
        const naturalLength = resonatorModel.naturalLengthProperty.value;
        const naturalLengthView = Math.abs(
          modelViewTransform.modelToViewDeltaY(naturalLength),
        );
        const driverTopY = driverPlate.top;
        const equilibriumY = driverTopY - naturalLengthView;
        const viewYOffset = modelViewTransform.modelToViewDeltaY(modelPosition);
        const junctionY = equilibriumY - viewYOffset;
        const massCenterY = junctionY - ResonanceConstants.MASS_CENTER_OFFSET;

        // Keep x fixed, only update y
        massPositionProperty.value = new Vector2(
          massPositionProperty.value.x,
          massCenterY,
        );
      });
    };
    resonatorModel.positionProperty.link(positionListener);

    // View position -> model position (only active during drag)
    const viewPositionListener = (viewPosition: Vector2) => {
      positionGuard.run(() => {
        const massCenterY = viewPosition.y;
        const junctionY = massCenterY + ResonanceConstants.MASS_CENTER_OFFSET;

        const naturalLength = resonatorModel.naturalLengthProperty.value;
        const naturalLengthView = Math.abs(
          modelViewTransform.modelToViewDeltaY(naturalLength),
        );
        const driverTopY = driverPlate.top;
        const equilibriumY = driverTopY - naturalLengthView;
        const viewYOffset = equilibriumY - junctionY;
        const modelPosition = modelViewTransform.viewToModelDeltaY(viewYOffset);

        resonatorModel.positionProperty.value = modelPosition;
        resonatorModel.velocityProperty.value = 0;
        // Note: Don't stop the simulation - only this resonator is frozen while dragging
      });
    };
    massPositionProperty.lazyLink(viewPositionListener);

    const dragListener = new DragListener({
      targetNode: massNode,
      positionProperty: massPositionProperty,
      dragBoundsProperty: new Property(layoutBounds),
      start: () => {
        // Mark this resonator as being dragged - simulation will skip updating it
        resonatorModel.isDraggingProperty.value = true;
        // Select this resonator in the control panel
        selectedResonatorIndexProperty.value = index;
      },
      end: () => {
        // Release the resonator back to simulation control
        resonatorModel.isDraggingProperty.value = false;
      },
    });
    massNode.addInputListener(dragListener);

    const cleanup = () => {
      resonatorModel.massProperty.unlink(massListener);
      resonatorModel.isDraggingProperty.unlink(draggingListener);
      resonatorModel.positionProperty.unlink(positionListener);
      massPositionProperty.unlink(viewPositionListener);
      massNode.removeInputListener(dragListener);
    };

    return { node: massNode, cleanup };
  }

  /**
   * Builds all resonator nodes (springs + masses) for the given resonator models.
   */
  public static buildResonators(
    resonatorModels: ResonanceModel[],
    count: number,
    context: ResonatorBuildContext,
  ): ResonatorBuildResult {
    const springNodes: ParametricSpringNode[] = [];
    const massNodes: Node[] = [];
    const cleanups: Array<() => void> = [];

    for (let i = 0; i < count; i++) {
      const resonatorModel = resonatorModels[i];

      // Create spring node
      const springResult =
        ResonatorNodeBuilder.createSpringNode(resonatorModel);
      springNodes.push(springResult.node);
      cleanups.push(springResult.cleanup);

      // Create mass node
      const massResult = ResonatorNodeBuilder.createMassNode(
        resonatorModel,
        i,
        count,
        context,
      );
      massNodes.push(massResult.node);
      cleanups.push(massResult.cleanup);
    }

    return { springNodes, massNodes, cleanups };
  }
}
