import { init, madeWithSceneryStackSplashDataURI } from "scenerystack/init";

// Initialize values that will be used at import-time by other modules.
// This needs to happen first, so we have init.ts => assert.ts => splash.ts => brand.ts => everything else (in main.ts)
//
// Note: In production builds, the inline script in index.html pre-initializes phet globals
// before ES modules load. This ensures proper initialization order when bundled.
// The init() call here may run after initialize-globals but the critical values are
// already set by the inline script.
init({
  // Internal name of the simulation.
  name: "resonance",

  // Version (will be shown in the About dialog)
  version: "1.0.0",

  // The brand name used (should be the same as in brand.ts)
  brand: "made-with-scenerystack",

  // Should be one of the keys from https://github.com/phetsims/babel/blob/main/localeData.json
  // Can be omitted, will default to 'en'
  locale: "en",

  // List of locales that are supported (and can be switched between in the simulation while running)
  availableLocales: ["en", "es", "fr"],

  // Image to show while loading the simulation. Can be any image URL.
  splashDataURI: madeWithSceneryStackSplashDataURI,

  allowLocaleSwitching: true,

  // Color profiles supported by this simulation
  colorProfiles: ["default", "projector"],
});
