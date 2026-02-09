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
import { ResonanceModel } from "../../common/model/ResonanceModel.js";
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

    // Define the plottable properties available in the combo box.
    // Organized by category: kinematics, forces, energy, driver/ratios.
    const plottableProperties: PlottableProperty[] = [
      // Time
      {
        name: ResonanceStrings.controls.timeStringProperty,
        property: resonanceModel.timeProperty,
        unit: "s",
      },
      // Kinematics
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
        name: ResonanceStrings.controls.rmsDisplacementStringProperty,
        property: resonanceModel.rmsDisplacementProperty,
        unit: "m",
      },
      {
        name: ResonanceStrings.controls.rmsVelocityStringProperty,
        property: resonanceModel.rmsVelocityProperty,
        unit: "m/s",
      },
      // Forces
      {
        name: ResonanceStrings.controls.appliedForceStringProperty,
        property: resonanceModel.appliedForceProperty,
        unit: "N",
      },
      {
        name: ResonanceStrings.controls.springForceStringProperty,
        property: resonanceModel.springForceProperty,
        unit: "N",
      },
      {
        name: ResonanceStrings.controls.dampingForceStringProperty,
        property: resonanceModel.dampingForceProperty,
        unit: "N",
      },
      {
        name: ResonanceStrings.controls.netForceStringProperty,
        property: resonanceModel.netForceProperty,
        unit: "N",
      },
      // Energy
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
      {
        name: ResonanceStrings.controls
          .gravitationalPotentialEnergyStringProperty,
        property: resonanceModel.gravitationalPotentialEnergyProperty,
        unit: "J",
      },
      {
        name: ResonanceStrings.controls.totalPotentialEnergyStringProperty,
        property: resonanceModel.potentialEnergyProperty,
        unit: "J",
      },
      {
        name: ResonanceStrings.controls.totalEnergyStringProperty,
        property: resonanceModel.totalEnergyProperty,
        unit: "J",
      },
      {
        name: ResonanceStrings.controls.driverEnergyStringProperty,
        property: resonanceModel.driverEnergyProperty,
        unit: "J",
      },
      {
        name: ResonanceStrings.controls.thermalEnergyStringProperty,
        property: resonanceModel.thermalEnergyProperty,
        unit: "J",
      },
      {
        name: ResonanceStrings.controls.dampingPowerStringProperty,
        property: resonanceModel.dampingPowerProperty,
        unit: "W",
      },
      {
        name: ResonanceStrings.controls.drivingPowerStringProperty,
        property: resonanceModel.drivingPowerProperty,
        unit: "W",
      },
      {
        name: ResonanceStrings.controls.springPowerStringProperty,
        property: resonanceModel.springPowerProperty,
        unit: "W",
      },
      {
        name: ResonanceStrings.controls.gravitationalPowerStringProperty,
        property: resonanceModel.gravitationalPowerProperty,
        unit: "W",
      },
      // Driver and dimensionless ratios
      {
        name: ResonanceStrings.controls.driverPositionStringProperty,
        property: resonanceModel.driverPositionProperty,
        unit: "m",
      },
      {
        name: ResonanceStrings.controls.frequencyRatioStringProperty,
        property: resonanceModel.frequencyRatioProperty,
      },
      {
        name: ResonanceStrings.controls.amplitudeRatioStringProperty,
        property: resonanceModel.amplitudeRatioProperty,
      },
    ];

    // Default: velocity (y-axis) vs time (x-axis)
    const initialXProperty = plottableProperties[0]!; // Time
    const initialYProperty = plottableProperties[2]!; // Velocity

    // Create a parent node for combo box dropdowns (must be above the graph in z-order)
    const comboBoxListParent = new Node();

    // Create the configurable graph with support for multiple resonators
    // Use MAX_RESONATORS so graph can handle any number of active resonators
    const maxResonators = 10; // BaseOscillatorScreenModel.MAX_RESONATORS
    this.configurableGraph = new ConfigurableGraph(
      plottableProperties,
      initialXProperty,
      initialYProperty,
      350,
      250,
      2000,
      comboBoxListParent,
      maxResonators,
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

    // Enable sub-step data collection for all resonators when graph is visible
    this.configurableGraph.getGraphVisibleProperty().link((visible) => {
      // Enable for all resonator models
      for (const resonatorModel of model.resonatorModels) {
        resonatorModel.subStepCollectionEnabled = visible;
      }
    });
  }

  public override step(dt: number): void {
    super.step(dt);

    // Add data points to the graph when the simulation is playing
    if (this.model.isPlayingProperty.value) {
      const phaseModel = this.model as PhaseAnalysisModel;
      const resonatorCount = phaseModel.resonatorCountProperty.value;

      // Add data for each active resonator
      for (let i = 0; i < resonatorCount; i++) {
        const resonatorModel = phaseModel.getResonatorModel(i);

        // Use sub-step data if available for smooth phase-space plots
        if (resonatorModel.hasSubStepData()) {
          const subStepData = resonatorModel.flushSubStepData();
          this.configurableGraph.addDataPointsFromSubSteps(subStepData, i);
        } else {
          // Fall back to single-point sampling (e.g., during drag)
          // For multi-series, we need to get values from each resonator
          const xProp = this.configurableGraph.getXPropertyProperty().value;
          const yProp = this.configurableGraph.getYPropertyProperty().value;
          const xValue = this.getPropertyValueForResonator(xProp, resonatorModel);
          const yValue = this.getPropertyValueForResonator(yProp, resonatorModel);
          if (xValue !== null && yValue !== null) {
            this.configurableGraph.addDataPointForSeries(xValue, yValue, i);
          }
        }
      }
    }
  }

  /**
   * Get a property value from a specific resonator model.
   * Maps the plottable property to the resonator's corresponding property.
   */
  private getPropertyValueForResonator(
    prop: PlottableProperty,
    resonatorModel: ResonanceModel,
  ): number | null {
    const name =
      typeof prop.name === "string" ? prop.name : prop.name.value;
    const lowerName = name.toLowerCase();

    // Map common property names to resonator model properties
    if (lowerName.includes("time")) {
      return resonatorModel.timeProperty.value;
    }
    if (lowerName.includes("position") || lowerName.includes("displacement")) {
      return resonatorModel.positionProperty.value;
    }
    if (lowerName.includes("velocity") && !lowerName.includes("rms")) {
      return resonatorModel.velocityProperty.value;
    }
    if (lowerName.includes("acceleration") && !lowerName.includes("rms")) {
      return resonatorModel.accelerationProperty.value;
    }

    // For other properties, return null (will use first resonator's value)
    return null;
  }

  public override reset(): void {
    super.reset();
    this.configurableGraph.reset();
  }
}
