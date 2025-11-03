// NOTE: brand.js needs to be the first import. This is because SceneryStack for sims needs a very specific loading
// order: init.ts => assert.ts => splash.ts => brand.ts => everything else (here)
import "./brand.js";

import { onReadyToLaunch, Sim, PreferencesModel } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { VBox, Text, HStrut } from "scenerystack/scenery";
import { Property } from "scenerystack/axon";
import { Checkbox, VerticalAquaRadioButtonGroup } from "scenerystack/sun";
import { PhetFont } from "scenerystack/scenery-phet";
import { SimScreen } from "./screen-name/SimScreen.js";
import { ResonanceStrings } from "./strings/ResonanceStrings.js";
import { ResonancePreferencesModel } from "./preferences/ResonancePreferencesModel.js";
import { setColorProfile } from "./common/ResonanceColors.js";
import type { ColorProfile } from "./common/ResonanceColors.js";
import { SolverType } from "./common/model/SolverType.js";

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
      simulationOptions: {
        customPreferences: [
          {
            createContent: (_tandem: Tandem) => {
              // Display options section
              const displayOptionsSection = new VBox({
                align: "left",
                spacing: 8,
                children: [
                  new Text(ResonanceStrings.preferences.simulation.displayOptionsStringProperty, {
                    font: new PhetFont({ size: 16, weight: "bold" }),
                    fill: "black",
                  }),
                  new Checkbox(
                    resonancePreferences.showEnergyProperty,
                    new Text(ResonanceStrings.preferences.simulation.showEnergyStringProperty, {
                      font: new PhetFont(16),
                      fill: "black",
                    }),
                    {
                      boxWidth: 16,
                    },
                  ),
                  new Checkbox(
                    resonancePreferences.showVectorsProperty,
                    new Text(ResonanceStrings.preferences.simulation.showVectorsStringProperty, {
                      font: new PhetFont(16),
                      fill: "black",
                    }),
                    {
                      boxWidth: 16,
                    },
                  ),
                  new Checkbox(
                    resonancePreferences.showPhaseProperty,
                    new Text(ResonanceStrings.preferences.simulation.showPhaseStringProperty, {
                      font: new PhetFont(16),
                      fill: "black",
                    }),
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
                    createNode: () => new VBox({
                      align: "left",
                      spacing: 4,
                      children: [
                        new Text(ResonanceStrings.preferences.solvers.rk4StringProperty, {
                          font: new PhetFont(14),
                          fill: "black",
                        }),
                        new Text(ResonanceStrings.preferences.solvers.rk4DescriptionStringProperty, {
                          font: new PhetFont(11),
                          fill: "rgb(80,80,80)",
                          maxWidth: 550,
                        }),
                      ],
                    }),
                    tandemName: "rk4RadioButton",
                  },
                  {
                    value: SolverType.ADAPTIVE_RK45,
                    createNode: () => new VBox({
                      align: "left",
                      spacing: 4,
                      children: [
                        new Text(ResonanceStrings.preferences.solvers.adaptiveRK45StringProperty, {
                          font: new PhetFont(14),
                          fill: "black",
                        }),
                        new Text(ResonanceStrings.preferences.solvers.adaptiveRK45DescriptionStringProperty, {
                          font: new PhetFont(11),
                          fill: "rgb(80,80,80)",
                          maxWidth: 550,
                        }),
                      ],
                    }),
                    tandemName: "adaptiveRK45RadioButton",
                  },
                  {
                    value: SolverType.ADAPTIVE_EULER,
                    createNode: () => new VBox({
                      align: "left",
                      spacing: 4,
                      children: [
                        new Text(ResonanceStrings.preferences.solvers.adaptiveEulerStringProperty, {
                          font: new PhetFont(14),
                          fill: "black",
                        }),
                        new Text(ResonanceStrings.preferences.solvers.adaptiveEulerDescriptionStringProperty, {
                          font: new PhetFont(11),
                          fill: "rgb(80,80,80)",
                          maxWidth: 550,
                        }),
                      ],
                    }),
                    tandemName: "adaptiveEulerRadioButton",
                  },
                  {
                    value: SolverType.MODIFIED_MIDPOINT,
                    createNode: () => new VBox({
                      align: "left",
                      spacing: 4,
                      children: [
                        new Text(ResonanceStrings.preferences.solvers.modifiedMidpointStringProperty, {
                          font: new PhetFont(14),
                          fill: "black",
                        }),
                        new Text(ResonanceStrings.preferences.solvers.modifiedMidpointDescriptionStringProperty, {
                          font: new PhetFont(11),
                          fill: "rgb(80,80,80)",
                          maxWidth: 550,
                        }),
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
                  new Text(ResonanceStrings.preferences.simulation.solverMethodStringProperty, {
                    font: new PhetFont({ size: 16, weight: "bold" }),
                    fill: "black",
                  }),
                  new Text(ResonanceStrings.preferences.simulation.solverDescriptionStringProperty, {
                    font: new PhetFont(12),
                    fill: "black",
                    maxWidth: 600,
                  }),
                  solverRadioButtonGroup,
                ],
              });

              return new VBox({
                align: "left",
                spacing: 20,
                children: [
                  displayOptionsSection,
                  new HStrut(650), // Set minimum width
                  solverSection,
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
  ];

  // Create the simulation
  const sim = new Sim(ResonanceStrings.titleStringProperty, screens, simOptions);

  // Listen to color profile changes and update the color system
  resonancePreferences.colorProfileProperty.link((colorProfile: ColorProfile) => {
    setColorProfile(colorProfile);
    // Force a redraw by dispatching a custom event
    window.dispatchEvent(new Event("colorProfileChanged"));
  });

  sim.start();
});
