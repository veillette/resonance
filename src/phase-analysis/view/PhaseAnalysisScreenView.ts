/**
 * PhaseAnalysisScreenView is the view for the Phase Analysis screen.
 * It extends BaseOscillatorScreenView and adds a configurable graph
 * that lets users plot various physical quantities against each other.
 */

import { ScreenViewOptions } from "scenerystack/sim";
import { Node, Text } from "scenerystack/scenery";
import { Checkbox } from "scenerystack/sun";
import { BaseOscillatorScreenView } from "../../common/view/BaseOscillatorScreenView.js";
import { PhaseAnalysisModel } from "../model/PhaseAnalysisModel.js";
import ConfigurableGraph from "../../common/view/graph/ConfigurableGraph.js";
import type { PlottableProperty } from "../../common/view/graph/PlottableProperty.js";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";
import ResonanceConstants from "../../common/ResonanceConstants.js";
import ResonanceColors from "../../common/ResonanceColors.js";

export class PhaseAnalysisScreenView extends BaseOscillatorScreenView {
  private readonly configurableGraph: ConfigurableGraph;

  public constructor(model: PhaseAnalysisModel, options?: ScreenViewOptions) {
    super(model, options);

    const resonanceModel = model.resonanceModel;

    // Define the plottable properties available in the combo box
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
        name: ResonanceStrings.controls.kineticEnergyStringProperty,
        property: resonanceModel.kineticEnergyProperty,
        unit: "J",
      },
      {
        name: ResonanceStrings.controls.springPotentialEnergyStringProperty,
        property: resonanceModel.springPotentialEnergyProperty,
        unit: "J",
      },
    ];

    // Default: velocity (y-axis) vs time (x-axis)
    const initialXProperty = plottableProperties[0]!; // Time
    const initialYProperty = plottableProperties[2]!; // Velocity

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

    // Position the graph in the upper-left area of the screen
    this.configurableGraph.x = this.layoutBounds.left + 20;
    this.configurableGraph.y = this.layoutBounds.top + 60;

    // Make the graph visible by default on this screen
    this.configurableGraph.getGraphVisibleProperty().value = true;

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
    graphCheckbox.top = this.layoutBounds.top + 10;

    this.addChild(graphCheckbox);
    this.addChild(this.configurableGraph);
    this.addChild(comboBoxListParent);
  }

  public override step(dt: number): void {
    super.step(dt);

    // Add data points to the graph when the simulation is playing
    if (this.model.isPlayingProperty.value) {
      this.configurableGraph.addDataPoint();
    }
  }

  public override reset(): void {
    super.reset();
    this.configurableGraph.reset();
  }
}
