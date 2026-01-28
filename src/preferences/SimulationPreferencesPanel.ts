/**
 * Simulation Preferences Panel
 * Allows users to configure simulation display options and units
 */

import { VBox, Text } from "scenerystack/scenery";
import { Checkbox, AquaRadioButtonGroup } from "scenerystack/sun";
import { PhetFont } from "scenerystack/scenery-phet";
import { ResonancePreferencesModel } from "./ResonancePreferencesModel.js";
import { ResonanceStrings } from "../strings/ResonanceStrings.js";
import { SolverType, SolverTypeName } from "../common/model/SolverType.js";

export class SimulationPreferencesPanel extends VBox {
  public constructor(preferencesModel: ResonancePreferencesModel) {
    // Get localized strings
    const strings = ResonanceStrings.resonance.preferences.simulation;

    // Display options section
    const displayOptionsLabel = new Text(strings.displayOptions, {
      font: new PhetFont({ size: 14, weight: 'bold' }),
    });

    const showEnergyCheckbox = new Checkbox(
      preferencesModel.showEnergyProperty,
      new Text(strings.showEnergy, { font: new PhetFont({ size: 12 }) }),
      {
        boxWidth: 16,
      }
    );

    const showVectorsCheckbox = new Checkbox(
      preferencesModel.showVectorsProperty,
      new Text(strings.showVectors, { font: new PhetFont({ size: 12 }) }),
      {
        boxWidth: 16,
      }
    );

    const showPhaseCheckbox = new Checkbox(
      preferencesModel.showPhaseProperty,
      new Text(strings.showPhase, { font: new PhetFont({ size: 12 }) }),
      {
        boxWidth: 16,
      }
    );

    const displayOptionsSection = new VBox({
      align: "left",
      spacing: 8,
      children: [
        displayOptionsLabel,
        showEnergyCheckbox,
        showVectorsCheckbox,
        showPhaseCheckbox,
      ],
    });

    // Units section
    const unitsLabel = new Text(strings.units, {
      font: new PhetFont({ size: 14, weight: 'bold' }),
    });

    const unitsButtons = new AquaRadioButtonGroup(
      preferencesModel.unitsProperty,
      [
        {
          value: "metric",
          createNode: () =>
            new Text(strings.unitsMetric, { font: new PhetFont({ size: 12 }) }),
        },
        {
          value: "imperial",
          createNode: () =>
            new Text(strings.unitsImperial, { font: new PhetFont({ size: 12 }) }),
        },
      ],
      {
        spacing: 8,
        radioButtonOptions: {
          radius: 8,
        },
      }
    );

    const unitsSection = new VBox({
      align: "left",
      spacing: 8,
      children: [unitsLabel, unitsButtons],
    });

    // ODE Solver section
    const solverLabel = new Text("ODE Solver", {
      font: new PhetFont({ size: 14, weight: 'bold' }),
    });

    const solverButtons = new AquaRadioButtonGroup(
      preferencesModel.solverTypeProperty,
      [
        {
          value: SolverType.RUNGE_KUTTA_4,
          createNode: () =>
            new Text(SolverTypeName[SolverType.RUNGE_KUTTA_4], { font: new PhetFont({ size: 12 }) }),
        },
        {
          value: SolverType.ADAPTIVE_RK45,
          createNode: () =>
            new Text(SolverTypeName[SolverType.ADAPTIVE_RK45], { font: new PhetFont({ size: 12 }) }),
        },
        {
          value: SolverType.ADAPTIVE_EULER,
          createNode: () =>
            new Text(SolverTypeName[SolverType.ADAPTIVE_EULER], { font: new PhetFont({ size: 12 }) }),
        },
        {
          value: SolverType.MODIFIED_MIDPOINT,
          createNode: () =>
            new Text(SolverTypeName[SolverType.MODIFIED_MIDPOINT], { font: new PhetFont({ size: 12 }) }),
        },
      ],
      {
        spacing: 8,
        radioButtonOptions: {
          radius: 8,
        },
      }
    );

    const solverSection = new VBox({
      align: "left",
      spacing: 8,
      children: [solverLabel, solverButtons],
    });

    // Create panel content
    const content = new VBox({
      align: "left",
      spacing: 15,
      children: [displayOptionsSection, unitsSection, solverSection],
    });

    super({
      align: "left",
      spacing: 10,
      children: [content],
    });
  }
}
