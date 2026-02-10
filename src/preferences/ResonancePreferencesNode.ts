/**
 * ResonancePreferencesNode - Custom preferences UI panel for the Resonance simulation.
 *
 * Renders the simulation-specific preferences content shown in the Preferences dialog,
 * organized into two sections:
 * - Oscillator Screens: display options (energy, vectors, phase) and solver method
 * - Chladni Screen: modal controls toggle and renderer selection
 */

import { VBox, Text, HStrut } from "scenerystack/scenery";
import { Checkbox, VerticalAquaRadioButtonGroup } from "scenerystack/sun";
import { PhetFont } from "scenerystack/scenery-phet";
import { ResonancePreferencesModel, RendererType } from "./ResonancePreferencesModel.js";
import { ResonanceStrings } from "../i18n/ResonanceStrings.js";
import { SolverType } from "../common/model/SolverType.js";
import ResonanceColors from "../common/ResonanceColors.js";

export class ResonancePreferencesNode extends VBox {
  public constructor(preferencesModel: ResonancePreferencesModel) {
    super({
      align: "left",
      spacing: 24,
      children: [
        ResonancePreferencesNode.createOscillatorSection(preferencesModel),
        new HStrut(600), // Set minimum width
        ResonancePreferencesNode.createChladniSection(preferencesModel),
      ],
    });
  }

  /**
   * Create the Oscillator Screens preferences section:
   * display options checkboxes and solver method radio buttons.
   */
  private static createOscillatorSection(
    preferencesModel: ResonancePreferencesModel,
  ): VBox {
    const header = new Text(
      ResonanceStrings.screens.singleOscillatorStringProperty,
      {
        font: new PhetFont({ size: 18, weight: "bold" }),
        fill: ResonanceColors.preferencesTextProperty,
      },
    );

    const displayOptionsSection = new VBox({
      align: "left",
      spacing: 8,
      children: [
        new Text(
          ResonanceStrings.preferences.simulation.displayOptionsStringProperty,
          {
            font: new PhetFont({ size: 14, weight: "bold" }),
            fill: ResonanceColors.preferencesTextProperty,
          },
        ),
        ResonancePreferencesNode.createCheckbox(
          preferencesModel.showEnergyProperty,
          ResonanceStrings.preferences.simulation.showEnergyStringProperty,
        ),
        ResonancePreferencesNode.createCheckbox(
          preferencesModel.showVectorsProperty,
          ResonanceStrings.preferences.simulation.showVectorsStringProperty,
        ),
        ResonancePreferencesNode.createCheckbox(
          preferencesModel.showPhaseProperty,
          ResonanceStrings.preferences.simulation.showPhaseStringProperty,
        ),
      ],
    });

    const solverSection = ResonancePreferencesNode.createSolverSection(preferencesModel);

    return new VBox({
      align: "left",
      spacing: 12,
      children: [header, displayOptionsSection, solverSection],
    });
  }

  /**
   * Create the solver method radio button group section.
   */
  private static createSolverSection(
    preferencesModel: ResonancePreferencesModel,
  ): VBox {
    const solverRadioButtonGroup = new VerticalAquaRadioButtonGroup(
      preferencesModel.solverTypeProperty,
      [
        {
          value: SolverType.RUNGE_KUTTA_4,
          createNode: () =>
            ResonancePreferencesNode.createRadioButtonLabel(
              ResonanceStrings.preferences.solvers.rk4StringProperty,
              ResonanceStrings.preferences.solvers.rk4DescriptionStringProperty,
            ),
          tandemName: "rk4RadioButton",
        },
        {
          value: SolverType.ADAPTIVE_RK45,
          createNode: () =>
            ResonancePreferencesNode.createRadioButtonLabel(
              ResonanceStrings.preferences.solvers.adaptiveRK45StringProperty,
              ResonanceStrings.preferences.solvers.adaptiveRK45DescriptionStringProperty,
            ),
          tandemName: "adaptiveRK45RadioButton",
        },
        {
          value: SolverType.ANALYTICAL,
          createNode: () =>
            ResonancePreferencesNode.createRadioButtonLabel(
              ResonanceStrings.preferences.solvers.analyticalStringProperty,
              ResonanceStrings.preferences.solvers.analyticalDescriptionStringProperty,
            ),
          tandemName: "analyticalRadioButton",
        },
      ],
      {
        spacing: 10,
        radioButtonOptions: { radius: 8 },
      },
    );

    return new VBox({
      align: "left",
      spacing: 8,
      children: [
        new Text(
          ResonanceStrings.preferences.simulation.solverMethodStringProperty,
          {
            font: new PhetFont({ size: 14, weight: "bold" }),
            fill: ResonanceColors.preferencesTextProperty,
          },
        ),
        new Text(
          ResonanceStrings.preferences.simulation.solverDescriptionStringProperty,
          {
            font: new PhetFont(11),
            fill: ResonanceColors.preferencesTextSecondaryProperty,
            maxWidth: 550,
          },
        ),
        solverRadioButtonGroup,
      ],
    });
  }

  /**
   * Create the Chladni Patterns screen preferences section:
   * modal controls toggle and renderer selection.
   */
  private static createChladniSection(
    preferencesModel: ResonancePreferencesModel,
  ): VBox {
    const header = new Text(
      ResonanceStrings.screens.chladniPatternsStringProperty,
      {
        font: new PhetFont({ size: 18, weight: "bold" }),
        fill: ResonanceColors.preferencesTextProperty,
      },
    );

    const modalControlsCheckbox = new Checkbox(
      preferencesModel.showModalControlsProperty,
      new VBox({
        align: "left",
        spacing: 2,
        children: [
          new Text(
            ResonanceStrings.preferences.simulation.showModalControlsStringProperty,
            {
              font: new PhetFont(14),
              fill: ResonanceColors.preferencesTextProperty,
            },
          ),
          new Text(
            ResonanceStrings.preferences.simulation.showModalControlsDescriptionStringProperty,
            {
              font: new PhetFont(11),
              fill: ResonanceColors.preferencesTextSecondaryProperty,
              maxWidth: 500,
            },
          ),
        ],
      }),
      { boxWidth: 16 },
    );

    const rendererSection = ResonancePreferencesNode.createRendererSection(preferencesModel);

    return new VBox({
      align: "left",
      spacing: 12,
      children: [header, modalControlsCheckbox, rendererSection],
    });
  }

  /**
   * Create the renderer selection radio button group section.
   */
  private static createRendererSection(
    preferencesModel: ResonancePreferencesModel,
  ): VBox {
    const rendererRadioButtonGroup = new VerticalAquaRadioButtonGroup(
      preferencesModel.rendererTypeProperty,
      [
        {
          value: RendererType.CANVAS,
          createNode: () =>
            ResonancePreferencesNode.createRadioButtonLabel(
              ResonanceStrings.preferences.simulation.rendererCanvasStringProperty,
              ResonanceStrings.preferences.simulation.rendererCanvasDescriptionStringProperty,
            ),
          tandemName: "canvasRadioButton",
        },
        {
          value: RendererType.WEBGL,
          createNode: () =>
            ResonancePreferencesNode.createRadioButtonLabel(
              ResonanceStrings.preferences.simulation.rendererWebGLStringProperty,
              ResonanceStrings.preferences.simulation.rendererWebGLDescriptionStringProperty,
            ),
          tandemName: "webglRadioButton",
        },
      ],
      {
        spacing: 10,
        radioButtonOptions: { radius: 8 },
      },
    );

    return new VBox({
      align: "left",
      spacing: 8,
      children: [
        new Text(
          ResonanceStrings.preferences.simulation.rendererStringProperty,
          {
            font: new PhetFont({ size: 14, weight: "bold" }),
            fill: ResonanceColors.preferencesTextProperty,
          },
        ),
        new Text(
          ResonanceStrings.preferences.simulation.rendererDescriptionStringProperty,
          {
            font: new PhetFont(11),
            fill: ResonanceColors.preferencesTextSecondaryProperty,
            maxWidth: 550,
          },
        ),
        rendererRadioButtonGroup,
      ],
    });
  }

  /**
   * Create a standard preferences checkbox with consistent styling.
   */
  private static createCheckbox(
    property: import("scenerystack/axon").BooleanProperty,
    labelStringProperty: import("scenerystack/axon").TReadOnlyProperty<string>,
  ): Checkbox {
    return new Checkbox(
      property,
      new Text(labelStringProperty, {
        font: new PhetFont(14),
        fill: ResonanceColors.preferencesTextProperty,
      }),
      { boxWidth: 16 },
    );
  }

  /**
   * Create a radio button label with title and description text.
   */
  private static createRadioButtonLabel(
    titleStringProperty: import("scenerystack/axon").TReadOnlyProperty<string>,
    descriptionStringProperty: import("scenerystack/axon").TReadOnlyProperty<string>,
  ): VBox {
    return new VBox({
      align: "left",
      spacing: 4,
      children: [
        new Text(titleStringProperty, {
          font: new PhetFont(14),
          fill: ResonanceColors.preferencesTextProperty,
        }),
        new Text(descriptionStringProperty, {
          font: new PhetFont(11),
          fill: ResonanceColors.preferencesTextSecondaryProperty,
          maxWidth: 500,
        }),
      ],
    });
  }
}
