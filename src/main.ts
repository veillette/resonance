// NOTE: brand.js needs to be the first import. This is because SceneryStack for sims needs a very specific loading
// order: init.ts => assert.ts => splash.ts => brand.ts => everything else (here)
import "./brand.js";

import { onReadyToLaunch, Sim, PreferencesModel } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { VBox } from "scenerystack/scenery";
import { Property } from "scenerystack/axon";
import { SimScreen } from "./screen-name/SimScreen.js";
import { ResonanceStrings } from "./strings/ResonanceStrings.js";
import { ResonancePreferencesModel } from "./preferences/ResonancePreferencesModel.js";
import { setColorProfile } from "./common/ResonanceColors.js";
import type { ColorProfile } from "./common/ResonanceColors.js";

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
        customPreferences: [],
      },
    }),
  };

  const screens = [
    new SimScreen(resonancePreferences, {
      tandem: Tandem.ROOT.createTandem("simScreen"),
    }),
  ];

  // Create title property
  const titleProperty = new Property<string>(ResonanceStrings.resonance.title);

  // Create the simulation
  const sim = new Sim(titleProperty, screens, simOptions);

  // Listen to color profile changes and update the color system
  resonancePreferences.colorProfileProperty.link((colorProfile: ColorProfile) => {
    setColorProfile(colorProfile);
    // Force a redraw by dispatching a custom event
    window.dispatchEvent(new Event("colorProfileChanged"));
  });

  sim.start();
});
