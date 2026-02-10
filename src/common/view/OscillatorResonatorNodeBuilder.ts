/**
 * OscillatorResonatorNodeBuilder creates spring and mass nodes for resonators.
 * All nodes are created once at startup and visibility is controlled by count.
 *
 * This is a shared builder used by all oscillator-based screens:
 * - Single Oscillator
 * - Multiple Oscillators
 * - Phase Analysis
 */

import { Node, Text, Rectangle } from "scenerystack/scenery";
import { DragListener, KeyboardDragListener } from "scenerystack/scenery";
import { ParametricSpringNode, PhetFont } from "scenerystack/scenery-phet";
import { Vector2Property } from "scenerystack/dot";
import { Vector2, Bounds2 } from "scenerystack/dot";
import { Property, NumberProperty } from "scenerystack/axon";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { ResonanceModel } from "../model/index.js";
import { BaseOscillatorScreenModel } from "../model/BaseOscillatorScreenModel.js";
import ResonanceColors from "../ResonanceColors.js";
import ResonanceConstants from "../ResonanceConstants.js";
import { CircularUpdateGuard } from "../util/index.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";

// Named constants for magic numbers
const MASS_BOX_CORNER_RADIUS = 3;
const KEYBOARD_DRAG_SPEED = 150; // pixels per second
const KEYBOARD_SHIFT_DRAG_SPEED = 50; // pixels per second, slower with shift key

/**
 * Context needed to build resonator nodes.
 */
export interface ResonatorBuildContext {
  modelViewTransform: ModelViewTransform2;
  layoutBounds: Bounds2;
  selectedResonatorIndexProperty: NumberProperty;
}

/**
 * Result from building all resonator nodes.
 */
export interface ResonatorBuildResult {
  springNodes: ParametricSpringNode[];
  massNodes: Node[];
}

export class OscillatorResonatorNodeBuilder {
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
   * Creates a spring node for a resonator with line width varying by spring constant.
   */
  public static createSpringNode(
    resonatorModel: ResonanceModel,
    index: number,
    modelViewTransform: ModelViewTransform2,
  ): ParametricSpringNode {
    // Generate accessible label with resonator number
    const springNumber = index + 1;
    const springLabel =
      ResonanceStrings.a11y.resonator.springLabelStringProperty.value.replace(
        "{{number}}",
        String(springNumber),
      );
    const springDescription =
      ResonanceStrings.a11y.resonator.springDescriptionStringProperty.value.replace(
        /\{\{number\}\}/g,
        String(springNumber),
      );

    // Convert spring end lengths from model coordinates (meters) to view coordinates (pixels)
    const leftEndLengthView = Math.abs(
      modelViewTransform.modelToViewDeltaY(
        ResonanceConstants.SPRING_LEFT_END_LENGTH_MODEL,
      ),
    );
    const rightEndLengthView = Math.abs(
      modelViewTransform.modelToViewDeltaY(
        ResonanceConstants.SPRING_RIGHT_END_LENGTH_MODEL,
      ),
    );

    const springNode = new ParametricSpringNode({
      frontColor: ResonanceColors.springProperty,
      middleColor: ResonanceColors.springProperty,
      backColor: ResonanceColors.springBackProperty,
      loops: ResonanceConstants.SPRING_LOOPS,
      radius: ResonanceConstants.SPRING_RADIUS,
      aspectRatio: ResonanceConstants.SPRING_ASPECT_RATIO,
      pointsPerLoop: ResonanceConstants.SPRING_POINTS_PER_LOOP,
      lineWidth: ResonanceConstants.SPRING_LINE_WIDTH,
      leftEndLength: leftEndLengthView,
      rightEndLength: rightEndLengthView,
      rotation: -Math.PI / 2,
      boundsMethod: "none",
      // Accessibility
      tagName: "div",
      ariaRole: "img",
      accessibleName: springLabel,
      descriptionContent: springDescription,
    });

    // Line width varies with spring constant
    resonatorModel.springConstantProperty.link((springConstant: number) => {
      const minK = ResonanceConstants.SPRING_CONSTANT_RANGE.min;
      const maxK = ResonanceConstants.SPRING_CONSTANT_RANGE.max;
      const normalizedK = (springConstant - minK) / (maxK - minK);
      const lineWidth =
        ResonanceConstants.SPRING_LINE_WIDTH_MIN +
        normalizedK *
          (ResonanceConstants.SPRING_LINE_WIDTH_MAX -
            ResonanceConstants.SPRING_LINE_WIDTH_MIN);
      springNode.lineWidthProperty.value = lineWidth;
    });

    return springNode;
  }

  /**
   * Creates a mass node for a resonator with drag handling and position sync.
   */
  public static createMassNode(
    resonatorModel: ResonanceModel,
    index: number,
    context: ResonatorBuildContext,
  ): Node {
    const { modelViewTransform, layoutBounds, selectedResonatorIndexProperty } =
      context;

    const massNode = new Node();
    const initialMassSize = OscillatorResonatorNodeBuilder.calculateMassSize(
      resonatorModel.massProperty.value,
    );
    // Position the mass box so its bottom is at y=0 (local origin at bottom)
    // This way, when mass size changes, the bottom stays fixed and it grows upward
    const massBox = new Rectangle(
      -initialMassSize / 2,
      -initialMassSize,
      initialMassSize,
      initialMassSize,
      {
        fill: ResonanceColors.massProperty,
        stroke: ResonanceColors.massStrokeProperty,
        lineWidth: ResonanceConstants.MASS_STROKE_LINE_WIDTH,
        cornerRadius: MASS_BOX_CORNER_RADIUS,
      },
    );
    // Use a fixed font size based on max resonators to avoid label size changes
    const massLabel = new Text(`${index + 1}`, {
      font: new PhetFont({
        size: Math.max(
          ResonanceConstants.MASS_LABEL_FONT_SIZE_MIN,
          ResonanceConstants.MASS_LABEL_FONT_SIZE_BASE -
            BaseOscillatorScreenModel.MAX_RESONATORS * 2,
        ),
        weight: "bold",
      }),
      fill: ResonanceColors.massLabelProperty,
      center: massBox.center,
    });
    massNode.addChild(massBox);
    massNode.addChild(massLabel);

    // Update mass box size when mass changes - bottom stays fixed, grows upward
    resonatorModel.massProperty.link((mass: number) => {
      const newSize = OscillatorResonatorNodeBuilder.calculateMassSize(mass);
      massBox.setRect(-newSize / 2, -newSize, newSize, newSize);
      massLabel.center = massBox.center;
    });

    // Change label color when dragging to indicate selection
    resonatorModel.isDraggingProperty.link((isDragging: boolean) => {
      massLabel.fill = isDragging
        ? ResonanceColors.massLabelDraggingProperty
        : ResonanceColors.massLabelProperty;
    });

    // Add vertical drag listener using positionProperty
    massNode.cursor = "ns-resize";

    // Create a Vector2Property for dragging that stays synchronized with the resonator's position
    const massPositionProperty = new Vector2Property(new Vector2(0, 0));

    // Guard to prevent circular updates
    const positionGuard = new CircularUpdateGuard();

    // Bidirectional sync: model position -> view position
    // With isometric transform, model Y=0 is equilibrium, so we use modelToViewY directly
    // Only update view from model when NOT dragging
    resonatorModel.positionProperty.link((modelPosition: number) => {
      // Skip model->view updates while dragging (user controls position)
      if (resonatorModel.isDraggingProperty.value) {
        return;
      }
      positionGuard.run(() => {
        // Convert model position directly to view Y using the transform
        const viewY = modelViewTransform.modelToViewY(modelPosition);

        // Keep x fixed, only update y (this is the bottom position)
        massPositionProperty.value = new Vector2(
          massPositionProperty.value.x,
          viewY,
        );
      });
    });

    // View position -> model position (only active during drag)
    massPositionProperty.lazyLink((viewPosition: Vector2) => {
      positionGuard.run(() => {
        // Convert view Y directly to model position using the transform
        const modelPosition = modelViewTransform.viewToModelY(viewPosition.y);

        resonatorModel.positionProperty.value = modelPosition;
        resonatorModel.velocityProperty.value = 0;
        // Note: Don't stop the simulation - only this resonator is frozen while dragging
      });
    });

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

    // Make focusable for keyboard navigation (tab key)
    // Generate accessible label and description with resonator number
    const massNumber = index + 1;
    const accessibleMassLabel =
      ResonanceStrings.a11y.resonator.massLabelStringProperty.value.replace(
        "{{number}}",
        String(massNumber),
      );
    const accessibleMassDescription =
      ResonanceStrings.a11y.resonator.massDescriptionStringProperty.value.replace(
        /\{\{number\}\}/g,
        String(massNumber),
      );

    massNode.tagName = "div";
    massNode.focusable = true;
    massNode.accessibleName = accessibleMassLabel;
    massNode.descriptionContent = accessibleMassDescription;

    // KeyboardDragListener for keyboard navigation (vertical dragging)
    const keyboardDragListener = new KeyboardDragListener({
      positionProperty: massPositionProperty,
      dragBoundsProperty: new Property(layoutBounds),
      dragSpeed: KEYBOARD_DRAG_SPEED,
      shiftDragSpeed: KEYBOARD_SHIFT_DRAG_SPEED,
      start: () => {
        resonatorModel.isDraggingProperty.value = true;
        selectedResonatorIndexProperty.value = index;
      },
      end: () => {
        resonatorModel.isDraggingProperty.value = false;
      },
    });
    massNode.addInputListener(keyboardDragListener);

    return massNode;
  }

  /**
   * Builds all resonator nodes (springs + masses) for MAX_RESONATORS.
   * Nodes are created once and visibility is controlled separately.
   */
  public static buildResonators(
    resonatorModels: ResonanceModel[],
    context: ResonatorBuildContext,
  ): ResonatorBuildResult {
    const springNodes: ParametricSpringNode[] = [];
    const massNodes: Node[] = [];

    for (let i = 0; i < BaseOscillatorScreenModel.MAX_RESONATORS; i++) {
      const resonatorModel = resonatorModels[i];
      if (resonatorModel === undefined) {
        throw new Error(`Resonator index ${i} out of range`);
      }

      // Create spring node
      const springNode = OscillatorResonatorNodeBuilder.createSpringNode(
        resonatorModel,
        i,
        context.modelViewTransform,
      );
      springNodes.push(springNode);

      // Create mass node
      const massNode = OscillatorResonatorNodeBuilder.createMassNode(
        resonatorModel,
        i,
        context,
      );
      massNodes.push(massNode);
    }

    return { springNodes, massNodes };
  }
}
