// NOTE: brand.js needs to be the first import. This is because SceneryStack for sims needs a very specific loading
// order: init.ts => assert.ts => splash.ts => brand.ts => everything else (here)
import "./brand.js";

import { onReadyToLaunch, Sim, PreferencesModel } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { VBox, Text, HStrut } from "scenerystack/scenery";
import { Checkbox, VerticalAquaRadioButtonGroup } from "scenerystack/sun";
import { PhetFont } from "scenerystack/scenery-phet";
import { SimScreen } from "./screen-name/SimScreen.js";
import { ChladniScreen } from "./chladni/ChladniScreen.js";
import { ResonanceStrings } from "./i18n/ResonanceStrings.js";
import { ResonancePreferencesModel } from "./preferences/ResonancePreferencesModel.js";
import { SolverType } from "./common/model/SolverType.js";
import { RendererType } from "./preferences/ResonancePreferencesModel.js";
import ResonanceColors from "./common/ResonanceColors.js";

onReadyToLaunch(() => {
  // Create custom preferences model for simulation-specific settings
  const resonancePreferences = new ResonancePreferencesModel();

  const simOptions = {
    webgl: true,
    preferencesModel: new PreferencesModel({
      visualOptions: {
        supportsProjectorMode: true,
        supportsInteractiveHighlights: true,
      },
      audioOptions: {
        supportsVoicing: false,
        supportsSound: true,
      },
      inputOptions: {
        supportsGestureControl: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (_tandem: Tandem) => {
              // Display options section
              const displayOptionsSection = new VBox({
                align: "left",
                spacing: 8,
                children: [
                  new Text(
                    ResonanceStrings.preferences.simulation
                      .displayOptionsStringProperty,
                    {
                      font: new PhetFont({ size: 16, weight: "bold" }),
                      fill: ResonanceColors.preferencesTextProperty,
                    },
                  ),
                  new Checkbox(
                    resonancePreferences.showEnergyProperty,
                    new Text(
                      ResonanceStrings.preferences.simulation
                        .showEnergyStringProperty,
                      {
                        font: new PhetFont(16),
                        fill: ResonanceColors.preferencesTextProperty,
                      },
                    ),
                    {
                      boxWidth: 16,
                    },
                  ),
                  new Checkbox(
                    resonancePreferences.showVectorsProperty,
                    new Text(
                      ResonanceStrings.preferences.simulation
                        .showVectorsStringProperty,
                      {
                        font: new PhetFont(16),
                        fill: ResonanceColors.preferencesTextProperty,
                      },
                    ),
                    {
                      boxWidth: 16,
                    },
                  ),
                  new Checkbox(
                    resonancePreferences.showPhaseProperty,
                    new Text(
                      ResonanceStrings.preferences.simulation
                        .showPhaseStringProperty,
                      {
                        font: new PhetFont(16),
                        fill: ResonanceColors.preferencesTextProperty,
                      },
                    ),
                    {
                      boxWidth: 16,
                    },
                  ),
                ],
              });

              // Solver method preference
              const solverRadioButtonGroup = new VerticalAquaRadioButtonGroup(
                resonancePreferences.solverTypeProperty,
                [
                  {
                    value: SolverType.RUNGE_KUTTA_4,
                    createNode: () =>
                      new VBox({
                        align: "left",
                        spacing: 4,
                        children: [
                          new Text(
                            ResonanceStrings.preferences.solvers
                              .rk4StringProperty,
                            {
                              font: new PhetFont(14),
                              fill: ResonanceColors.preferencesTextProperty,
                            },
                          ),
                          new Text(
                            ResonanceStrings.preferences.solvers
                              .rk4DescriptionStringProperty,
                            {
                              font: new PhetFont(11),
                              fill: ResonanceColors.preferencesTextSecondaryProperty,
                              maxWidth: 550,
                            },
                          ),
                        ],
                      }),
                    tandemName: "rk4RadioButton",
                  },
                  {
                    value: SolverType.ADAPTIVE_RK45,
                    createNode: () =>
                      new VBox({
                        align: "left",
                        spacing: 4,
                        children: [
                          new Text(
                            ResonanceStrings.preferences.solvers
                              .adaptiveRK45StringProperty,
                            {
                              font: new PhetFont(14),
                              fill: ResonanceColors.preferencesTextProperty,
                            },
                          ),
                          new Text(
                            ResonanceStrings.preferences.solvers
                              .adaptiveRK45DescriptionStringProperty,
                            {
                              font: new PhetFont(11),
                              fill: ResonanceColors.preferencesTextSecondaryProperty,
                              maxWidth: 550,
                            },
                          ),
                        ],
                      }),
                    tandemName: "adaptiveRK45RadioButton",
                  },
                  {
                    value: SolverType.ADAPTIVE_EULER,
                    createNode: () =>
                      new VBox({
                        align: "left",
                        spacing: 4,
                        children: [
                          new Text(
                            ResonanceStrings.preferences.solvers
                              .adaptiveEulerStringProperty,
                            {
                              font: new PhetFont(14),
                              fill: ResonanceColors.preferencesTextProperty,
                            },
                          ),
                          new Text(
                            ResonanceStrings.preferences.solvers
                              .adaptiveEulerDescriptionStringProperty,
                            {
                              font: new PhetFont(11),
                              fill: ResonanceColors.preferencesTextSecondaryProperty,
                              maxWidth: 550,
                            },
                          ),
                        ],
                      }),
                    tandemName: "adaptiveEulerRadioButton",
                  },
                  {
                    value: SolverType.MODIFIED_MIDPOINT,
                    createNode: () =>
                      new VBox({
                        align: "left",
                        spacing: 4,
                        children: [
                          new Text(
                            ResonanceStrings.preferences.solvers
                              .modifiedMidpointStringProperty,
                            {
                              font: new PhetFont(14),
                              fill: ResonanceColors.preferencesTextProperty,
                            },
                          ),
                          new Text(
                            ResonanceStrings.preferences.solvers
                              .modifiedMidpointDescriptionStringProperty,
                            {
                              font: new PhetFont(11),
                              fill: ResonanceColors.preferencesTextSecondaryProperty,
                              maxWidth: 550,
                            },
                          ),
                        ],
                      }),
                    tandemName: "modifiedMidpointRadioButton",
                  },
                ],
                {
                  spacing: 12,
                  radioButtonOptions: {
                    radius: 8,
                  },
                },
              );

              const solverSection = new VBox({
                align: "left",
                spacing: 12,
                children: [
                  new Text(
                    ResonanceStrings.preferences.simulation
                      .solverMethodStringProperty,
                    {
                      font: new PhetFont({ size: 16, weight: "bold" }),
                      fill: ResonanceColors.preferencesTextProperty,
                    },
                  ),
                  new Text(
                    ResonanceStrings.preferences.simulation
                      .solverDescriptionStringProperty,
                    {
                      font: new PhetFont(12),
                      fill: ResonanceColors.preferencesTextProperty,
                      maxWidth: 600,
                    },
                  ),
                  solverRadioButtonGroup,
                ],
              });

              // Renderer preference
              const rendererRadioButtonGroup = new VerticalAquaRadioButtonGroup(
                resonancePreferences.rendererTypeProperty,
                [
                  {
                    value: RendererType.CANVAS,
                    createNode: () =>
                      new VBox({
                        align: "left",
                        spacing: 4,
                        children: [
                          new Text(
                            ResonanceStrings.preferences.simulation
                              .rendererCanvasStringProperty,
                            {
                              font: new PhetFont(14),
                              fill: ResonanceColors.preferencesTextProperty,
                            },
                          ),
                          new Text(
                            ResonanceStrings.preferences.simulation
                              .rendererCanvasDescriptionStringProperty,
                            {
                              font: new PhetFont(11),
                              fill: ResonanceColors.preferencesTextSecondaryProperty,
                              maxWidth: 550,
                            },
                          ),
                        ],
                      }),
                    tandemName: "canvasRadioButton",
                  },
                  {
                    value: RendererType.WEBGL,
                    createNode: () =>
                      new VBox({
                        align: "left",
                        spacing: 4,
                        children: [
                          new Text(
                            ResonanceStrings.preferences.simulation
                              .rendererWebGLStringProperty,
                            {
                              font: new PhetFont(14),
                              fill: ResonanceColors.preferencesTextProperty,
                            },
                          ),
                          new Text(
                            ResonanceStrings.preferences.simulation
                              .rendererWebGLDescriptionStringProperty,
                            {
                              font: new PhetFont(11),
                              fill: ResonanceColors.preferencesTextSecondaryProperty,
                              maxWidth: 550,
                            },
                          ),
                        ],
                      }),
                    tandemName: "webglRadioButton",
                  },
                ],
                {
                  spacing: 12,
                  radioButtonOptions: {
                    radius: 8,
                  },
                },
              );

              const rendererSection = new VBox({
                align: "left",
                spacing: 12,
                children: [
                  new Text(
                    ResonanceStrings.preferences.simulation
                      .rendererStringProperty,
                    {
                      font: new PhetFont({ size: 16, weight: "bold" }),
                      fill: ResonanceColors.preferencesTextProperty,
                    },
                  ),
                  new Text(
                    ResonanceStrings.preferences.simulation
                      .rendererDescriptionStringProperty,
                    {
                      font: new PhetFont(12),
                      fill: ResonanceColors.preferencesTextProperty,
                      maxWidth: 600,
                    },
                  ),
                  rendererRadioButtonGroup,
                ],
              });

              return new VBox({
                align: "left",
                spacing: 20,
                children: [
                  displayOptionsSection,
                  new HStrut(650), // Set minimum width
                  solverSection,
                  rendererSection,
                ],
              });
            },
          },
        ],
      },
    }),
  };

  const screens = [
    new SimScreen(resonancePreferences, {
      tandem: Tandem.ROOT.createTandem("simScreen"),
    }),
    new ChladniScreen(resonancePreferences, {
      tandem: Tandem.ROOT.createTandem("chladniScreen"),
    }),
  ];

  // Create the simulation
  const sim = new Sim(
    ResonanceStrings.titleStringProperty,
    screens,
    simOptions,
  );

  sim.start();
});
