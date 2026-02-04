/**
 * OscillatorMeasurementLinesNode - View for two horizontal dashed lines that span the driver width.
 * Each line is vertically draggable for measuring heights above the driver plate.
 * Uses MeasurementLinesModel for the underlying model state.
 *
 * This is a shared view component used by all oscillator-based screens:
 * - Single Oscillator
 * - Multiple Oscillators
 * - Phase Analysis
 */

import { Node, Line, Rectangle } from "scenerystack/scenery";
import { DragListener, KeyboardDragListener } from "scenerystack/scenery";
import { Bounds2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import {
  MeasurementLineModel,
  MeasurementLinesModel,
} from "../model/MeasurementLineModel.js";
import ResonanceColors from "../ResonanceColors.js";

/**
 * View for a single draggable measurement line with a handle.
 */
class MeasurementLineNode extends Node {
  public constructor(
    model: MeasurementLineModel,
    driverWidth: number,
    driverCenterX: number,
    equilibriumY: number,
    modelViewTransform: ModelViewTransform2,
    lineNumber: number,
  ) {
    super();

    // Create the dashed horizontal line
    const lineLength = driverWidth;
    const line = new Line(0, 0, lineLength, 0, {
      stroke: ResonanceColors.textProperty,
      lineWidth: 2,
      lineDash: [10, 6],
    });
    line.centerX = 0;
    this.addChild(line);

    // Create a small handle on the left side for dragging
    const handleWidth = 12;
    const handleHeight = 20;
    const handle = new Rectangle(
      -handleWidth / 2,
      -handleHeight / 2,
      handleWidth,
      handleHeight,
      {
        fill: ResonanceColors.driverFillProperty,
        stroke: ResonanceColors.textProperty,
        lineWidth: 1,
        cornerRadius: 3,
        cursor: "ns-resize",
      },
    );
    handle.left = line.left - handleWidth / 2 - 5;
    this.addChild(handle);

    this.cursor = "ns-resize";

    // Make focusable for keyboard navigation
    this.tagName = "div";
    this.focusable = true;
    this.accessibleName = `Measurement Line ${lineNumber}`;

    // Position the node based on model position relative to equilibrium
    // The model position y is displacement from equilibrium (positive = above equilibrium)
    model.positionProperty.link((position) => {
      // Convert displacement to view delta (positive displacement = above equilibrium = negative Y in view)
      const viewYOffset = modelViewTransform.modelToViewDeltaY(position.y);
      this.x = driverCenterX;
      // equilibriumY is where model y=0 should appear, and viewYOffset is negative for positive displacements
      this.y = equilibriumY + viewYOffset;
    });

    // DragListener uses model's positionProperty directly with transform and bounds
    const dragListener = new DragListener({
      targetNode: this,
      positionProperty: model.positionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: model.dragBoundsProperty,
    });
    this.addInputListener(dragListener);

    // KeyboardDragListener for keyboard navigation (vertical only)
    const keyboardDragListener = new KeyboardDragListener({
      positionProperty: model.positionProperty,
      transform: modelViewTransform,
      dragBoundsProperty: model.dragBoundsProperty,
      dragSpeed: 100, // pixels per second
      shiftDragSpeed: 50, // slower with shift key
    });
    this.addInputListener(keyboardDragListener);
  }
}

/**
 * Container view for the two measurement lines.
 */
export class OscillatorMeasurementLinesNode extends Node {
  private readonly line1Node: MeasurementLineNode;
  private readonly line2Node: MeasurementLineNode;
  public readonly model: MeasurementLinesModel;

  public constructor(
    driverCenterX: number,
    driverTopY: number,
    driverWidth: number,
    naturalLength: number,
    modelViewTransform: ModelViewTransform2,
    _layoutBounds: Bounds2,
  ) {
    super();

    // Calculate displacement range in model coordinates (meters)
    // Using same coordinate system as mass position: 0 = equilibrium
    const minDisplacement = -0.4; // Can go 40cm below equilibrium
    const maxDisplacement = 0.3; // Can go 30cm above equilibrium

    // Create the model with displacement bounds (0 cm and 14 cm from equilibrium)
    this.model = new MeasurementLinesModel(
      minDisplacement,
      maxDisplacement,
      0.0,
      0.14,
    );

    // Calculate equilibrium Y position in view coordinates
    // Equilibrium is where the mass sits at rest (natural spring length above driver plate)
    const naturalLengthView = Math.abs(
      modelViewTransform.modelToViewDeltaY(naturalLength),
    );
    const equilibriumY = driverTopY - naturalLengthView;

    // Create view nodes for each line
    this.line1Node = new MeasurementLineNode(
      this.model.line1,
      driverWidth,
      driverCenterX,
      equilibriumY,
      modelViewTransform,
      1,
    );
    this.line2Node = new MeasurementLineNode(
      this.model.line2,
      driverWidth,
      driverCenterX,
      equilibriumY,
      modelViewTransform,
      2,
    );

    this.addChild(this.line1Node);
    this.addChild(this.line2Node);
  }

  public reset(): void {
    this.model.reset();
  }
}
