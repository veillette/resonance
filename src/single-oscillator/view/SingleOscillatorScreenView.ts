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

    // Create the configurable graph
    this.configurableGraph = new ConfigurableGraph(
      plottableProperties,
      initialXProperty,
      initialYProperty,
      350,
      250,
      2000,
      comboBoxListParent,
    );

    // Position the graph below the vector control panel
    this.configurableGraph.x = this.layoutBounds.left + 20;
    this.configurableGraph.y = this.vectorControlPanel.bottom + 50;

    // Add a checkbox to toggle graph visibility
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
    graphCheckbox.left = this.layoutBounds.left + 20;
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
