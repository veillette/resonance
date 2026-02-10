// NOTE: brand.js needs to be the first import. This is because SceneryStack for sims needs a very specific loading
// order: init.ts => assert.ts => splash.ts => brand.ts => everything else (here)
import "./brand.js";

import { onReadyToLaunch, Sim, PreferencesModel } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { SingleOscillatorScreen } from "./single-oscillator/SingleOscillatorScreen.js";
import { MultipleOscillatorsScreen } from "./multiple-oscillators/MultipleOscillatorsScreen.js";
import { PhaseAnalysisScreen } from "./phase-analysis/PhaseAnalysisScreen.js";
import { ChladniScreen } from "./chladni-patterns/ChladniScreen.js";
import { ResonanceStrings } from "./i18n/ResonanceStrings.js";
import { ResonancePreferencesModel } from "./preferences/ResonancePreferencesModel.js";
import { ResonancePreferencesNode } from "./preferences/ResonancePreferencesNode.js";

onReadyToLaunch(() => {
  const resonancePreferences = new ResonancePreferencesModel();

  const simOptions = {
    webgl: true,
    hasKeyboardHelpContent: true,
    preferencesModel: new PreferencesModel({
      visualOptions: {
        supportsProjectorMode: true,
        supportsInteractiveHighlights: true,
      },
      audioOptions: {
        supportsVoicing: true,
        supportsSound: true,
      },
      inputOptions: {
        supportsGestureControl: false,
      },
      localizationOptions: {
        supportsDynamicLocale: true,
        includeLocalePanel: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (_tandem: Tandem) =>
              new ResonancePreferencesNode(resonancePreferences),
          },
        ],
      },
    }),
  };

  const screens = [
    new SingleOscillatorScreen(resonancePreferences, {
      tandem: Tandem.ROOT.createTandem("singleOscillatorScreen"),
    }),
    new MultipleOscillatorsScreen(resonancePreferences, {
      tandem: Tandem.ROOT.createTandem("multipleOscillatorsScreen"),
    }),
    new PhaseAnalysisScreen(resonancePreferences, {
      tandem: Tandem.ROOT.createTandem("phaseAnalysisScreen"),
    }),
    new ChladniScreen(resonancePreferences, {
      tandem: Tandem.ROOT.createTandem("chladniPatternsScreen"),
    }),
  ];

  const sim = new Sim(
    ResonanceStrings.titleStringProperty,
    screens,
    simOptions,
  );

  sim.start();
});
