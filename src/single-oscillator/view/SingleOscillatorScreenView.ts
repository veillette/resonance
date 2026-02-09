/**
 * SingleOscillatorScreenView is the view for the Single Oscillator screen.
 * It extends BaseOscillatorScreenView and adds:
 * - Velocity, acceleration, and applied force vector arrows on the mass
 * - A control panel with checkboxes to toggle vector visibility
 * - A configurable graph for plotting physical quantities
 */

import { ScreenViewOptions } from "scenerystack/sim";
import { Node, Text } from "scenerystack/scenery";
import { Checkbox } from "scenerystack/sun";
import { BaseOscillatorScreenView } from "../../common/view/BaseOscillatorScreenView.js";
import { SingleOscillatorModel } from "../model/SingleOscillatorModel.js";
import { OscillatorVectorNode } from "./OscillatorVectorNode.js";
import { OscillatorVectorControlPanel } from "./OscillatorVectorControlPanel.js";
import ConfigurableGraph from "../../common/view/graph/ConfigurableGraph.js";
import type { PlottableProperty } from "../../common/view/graph/PlottableProperty.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import ResonanceColors from "../../common/ResonanceColors.js";

export class SingleOscillatorScreenView extends BaseOscillatorScreenView {
  private readonly vectorNode: OscillatorVectorNode;
  private readonly vectorControlPanel: OscillatorVectorControlPanel;
  private readonly configurableGraph: ConfigurableGraph;

  public constructor(
    model: SingleOscillatorModel,
    options?: ScreenViewOptions,
  ) {
    super(model, options);

    // Create the vector control panel (positioned in upper-left)
    this.vectorControlPanel = new OscillatorVectorControlPanel();
    this.vectorControlPanel.left =
      this.layoutBounds.minX + ResonanceConstants.CONTROL_PANEL_X_MARGIN;
    this.vectorControlPanel.top =
      this.layoutBounds.minY + ResonanceConstants.CONTROL_PANEL_TOP_MARGIN;
    this.addChild(this.vectorControlPanel);

    // Create the vector node that displays arrows on the mass
    this.vectorNode = new OscillatorVectorNode(
      model.resonanceModel,
      this.modelViewTransform,
      {
        velocityVisibleProperty:
          this.vectorControlPanel.velocityVisibleProperty,
        accelerationVisibleProperty:
          this.vectorControlPanel.accelerationVisibleProperty,
        appliedForceVisibleProperty:
          this.vectorControlPanel.appliedForceVisibleProperty,
      },
    );

    // Add vector node to the resonators container so it appears with the mass
    this.resonatorsContainer.addChild(this.vectorNode);

    // Initial vector position update
    this.updateVectorPosition();

    // ===== CONFIGURABLE GRAPH =====
    const resonanceModel = model.resonanceModel;

    // Define the plottable properties for the Single Oscillator screen.
    // Limited to: position, velocity, acceleration, applied force, frequency, and time.
    const plottableProperties: PlottableProperty[] = [
      {
        name: ResonanceStrings.controls.timeStringProperty,
        property: resonanceModel.timeProperty,
        unit: "s",
      },
      {
        name: ResonanceStrings.controls.positionStringProperty,
        property: resonanceModel.positionProperty,
        unit: "m",
      },
      {
        name: ResonanceStrings.controls.velocityStringProperty,
        property: resonanceModel.velocityProperty,
        unit: "m/s",
      },
      {
        name: ResonanceStrings.controls.accelerationStringProperty,
        property: resonanceModel.accelerationProperty,
        unit: "m/s\u00B2",
      },
      {
        name: ResonanceStrings.controls.appliedForceStringProperty,
        property: resonanceModel.appliedForceProperty,
        unit: "N",
      },
      {
        name: ResonanceStrings.controls.frequencyStringProperty,
        property: resonanceModel.drivingFrequencyProperty,
        unit: "Hz",
      },
    ];

    // Default: position (y-axis) vs time (x-axis)
    const initialXProperty = plottableProperties[0]!; // Time
    const initialYProperty = plottableProperties[1]!; // Position

    // Create a parent node for combo box dropdowns (must be above the graph in z-order)
    const comboBoxListParent = new Node();

    // Calculate graph position:
    // - Right of the mass (mass is at layoutBounds.centerX + DRIVER_CENTER_X_OFFSET)
    // - Left of the control panel
    // - Top aligned with control panel top
    // - Bottom above the driver plate
    const massAreaRight =
      this.layoutBounds.centerX +
      ResonanceConstants.DRIVER_CENTER_X_OFFSET +
      ResonanceConstants.MAX_MASS_SIZE / 2 +
      60; // margin after mass
    const controlPanelLeft =
      this.controlPanel.left - 20; // margin before control panel
    const graphWidth = Math.min(350, controlPanelLeft - massAreaRight);

    // Calculate height: from control panel top to above driver plate
    // Account for graph header elements (title panel + header bar ~60px)
    const graphHeaderOffset = 60;
    const driverPlateTopViewY = this.modelViewTransform.modelToViewY(
      ResonanceConstants.DRIVER_PLATE_REST_MODEL_Y,
    );
    const graphTop = this.controlPanel.top + graphHeaderOffset;
    const graphBottom = driverPlateTopViewY - 40; // margin above driver
    const graphHeight = Math.min(300, graphBottom - graphTop);

    // Create the configurable graph with calculated dimensions
    this.configurableGraph = new ConfigurableGraph(
      plottableProperties,
      initialXProperty,
      initialYProperty,
      graphWidth,
      graphHeight,
      2000,
      comboBoxListParent,
    );

    // Position the graph (graphTop already includes the header offset)
    this.configurableGraph.x = massAreaRight;
    this.configurableGraph.y = graphTop;

    // Add a checkbox to toggle graph visibility (position above the graph)
    const graphCheckboxLabel = new Text(
      ResonanceStrings.controls.graphStringProperty,
      {
        font: ResonanceConstants.CONTROL_FONT,
        fill: ResonanceColors.textProperty,
      },
    );
    const graphCheckbox = new Checkbox(
      this.configurableGraph.getGraphVisibleProperty(),
      graphCheckboxLabel,
      {
        boxWidth: 14,
        spacing: 6,
      },
    );
    graphCheckbox.left = this.vectorControlPanel.left;
    graphCheckbox.top = this.vectorControlPanel.bottom + 10;

    this.addChild(graphCheckbox);
    this.addChild(this.configurableGraph);
    this.addChild(comboBoxListParent);

    // Enable sub-step data collection only when graph is visible (performance optimization)
    this.configurableGraph.getGraphVisibleProperty().link((visible) => {
      model.resonanceModel.subStepCollectionEnabled = visible;
    });
  }

  /**
   * Update the position of the vector node to match the mass bottom.
   * The vectors originate from the bottom of the mass (the spring connection point).
   */
  private updateVectorPosition(): void {
    const massNode = this.massNodes[0];
    if (massNode) {
      // Get the bottom of the mass node in parent coordinates
      // massNode.y is already the bottom of the mass (local origin is at bottom)
      const massBottomX = massNode.x;
      const massBottomY = massNode.y;
      this.vectorNode.setMassBottom(massBottomX, massBottomY);
    }
  }

  public override reset(): void {
    super.reset();
    this.vectorControlPanel.reset();
    this.configurableGraph.reset();
  }

  public override step(dt: number): void {
    super.step(dt);

    // Update vector position to follow the mass
    this.updateVectorPosition();

    // Update the vector arrows based on current physics values
    this.vectorNode.updateVectors();

    // Add data points to the graph when the simulation is playing
    if (this.model.isPlayingProperty.value) {
      const singleModel = this.model as SingleOscillatorModel;
      const resonanceModel = singleModel.resonanceModel;

      // Use sub-step data if available for smooth phase-space plots
      if (resonanceModel.hasSubStepData()) {
        const subStepData = resonanceModel.flushSubStepData();
        this.configurableGraph.addDataPointsFromSubSteps(subStepData);
      } else {
        // Fall back to single-point sampling (e.g., during drag)
        this.configurableGraph.addDataPoint();
      }
    }
  }
}
