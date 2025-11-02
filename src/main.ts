// NOTE: brand.js needs to be the first import. This is because SceneryStack for sims needs a very specific loading
// order: init.ts => assert.ts => splash.ts => brand.ts => everything else (here)
import "./brand.js";

import { onReadyToLaunch, Sim } from "scenerystack/sim";
import { StringProperty } from "scenerystack/axon";
import { Tandem } from "scenerystack/tandem";
import { SimScreen } from "./screen-name/SimScreen.js";
import { ResonanceStrings } from "./strings/ResonanceStrings.js";
import { ResonancePreferencesModel } from "./preferences/ResonancePreferencesModel.js";
import { setColorProfile } from "./common/ResonanceColors.js";
import type { ColorProfile } from "./common/ResonanceColors.js";

onReadyToLaunch(() => {
  // Create preferences model first
  const preferencesModel = new ResonancePreferencesModel();

  // Use internationalized title
  const titleStringProperty = new StringProperty(ResonanceStrings.resonance.title);

  const screens = [
    new SimScreen(preferencesModel, { tandem: Tandem.ROOT.createTandem("simScreen") }),
  ];

  // Create the simulation
  const sim = new Sim(titleStringProperty, screens);

  // Listen to color profile changes and update the color system
  preferencesModel.colorProfileProperty.link((colorProfile) => {
    setColorProfile(colorProfile as ColorProfile);
    // Force a redraw by dispatching a custom event
    window.dispatchEvent(new Event('colorProfileChanged'));
  });

  sim.start();
});
