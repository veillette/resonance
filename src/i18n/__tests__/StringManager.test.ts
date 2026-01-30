/**
 * Tests for StringManager - Internationalization string management
 *
 * Tests singleton pattern and string properties access.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { StringManager, getStringProperties } from "../StringManager.js";

describe("StringManager", () => {
  let stringManager: StringManager;

  beforeEach(() => {
    stringManager = StringManager.getInstance();
  });

  describe("singleton pattern", () => {
    it("should return the same instance on multiple getInstance calls", () => {
      const instance1 = StringManager.getInstance();
      const instance2 = StringManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should return the same instance stored from beforeEach", () => {
      const newInstance = StringManager.getInstance();
      expect(newInstance).toBe(stringManager);
    });
  });

  describe("getAllStringProperties", () => {
    it("should return the full nested string properties object", () => {
      const all = stringManager.getAllStringProperties();
      expect(all).toBeDefined();
      expect(all.resonance).toBeDefined();
    });

    it("should contain all major sections", () => {
      const all = stringManager.getAllStringProperties();
      expect(all.resonance.titleStringProperty).toBeDefined();
      expect(all.resonance.screens).toBeDefined();
      expect(all.resonance.controls).toBeDefined();
      expect(all.resonance.preferences).toBeDefined();
      expect(all.resonance.presets).toBeDefined();
      expect(all.resonance.units).toBeDefined();
      expect(all.resonance.common).toBeDefined();
    });
  });
});

describe("getStringProperties", () => {
  it("should return the string properties object", () => {
    const strings = getStringProperties();
    expect(strings).toBeDefined();
    expect(strings.resonance).toBeDefined();
  });

  it("should return the same object on multiple calls (cached)", () => {
    const strings1 = getStringProperties();
    const strings2 = getStringProperties();
    expect(strings1).toBe(strings2);
  });

  describe("title", () => {
    it("should have a valid title string property", () => {
      const strings = getStringProperties();
      expect(strings.resonance.titleStringProperty).toBeDefined();
      expect(typeof strings.resonance.titleStringProperty.value).toBe("string");
      expect(strings.resonance.titleStringProperty.value.length).toBeGreaterThan(0);
    });
  });

  describe("screens", () => {
    it("should have screen name string properties", () => {
      const strings = getStringProperties();
      expect(strings.resonance.screens.simStringProperty).toBeDefined();
      expect(strings.resonance.screens.simStringProperty.value.length).toBeGreaterThan(0);
    });
  });

  describe("controls", () => {
    it("should have all control label string properties", () => {
      const controls = getStringProperties().resonance.controls;
      expect(controls.springConstantStringProperty).toBeDefined();
      expect(controls.dampingCoefficientStringProperty).toBeDefined();
      expect(controls.drivingFrequencyStringProperty).toBeDefined();
      expect(controls.drivingAmplitudeStringProperty).toBeDefined();
      expect(controls.massStringProperty).toBeDefined();
      expect(controls.resetStringProperty).toBeDefined();
    });

    it("should have resonator config labels", () => {
      const controls = getStringProperties().resonance.controls;
      expect(controls.resonatorConfigStringProperty).toBeDefined();
      expect(controls.sameMassStringProperty).toBeDefined();
      expect(controls.sameSpringConstantStringProperty).toBeDefined();
      expect(controls.mixedStringProperty).toBeDefined();
      expect(controls.sameFrequencyStringProperty).toBeDefined();
      expect(controls.customStringProperty).toBeDefined();
    });

    it("should have frequency and amplitude labels", () => {
      const controls = getStringProperties().resonance.controls;
      expect(controls.frequencyStringProperty).toBeDefined();
      expect(controls.amplitudeStringProperty).toBeDefined();
    });

    it("should have resonator labels", () => {
      const controls = getStringProperties().resonance.controls;
      expect(controls.resonatorsStringProperty).toBeDefined();
      expect(controls.resonator1StringProperty).toBeDefined();
      expect(controls.resonatorPatternStringProperty).toBeDefined();
    });

    it("should have simple labels for mass and spring constant", () => {
      const controls = getStringProperties().resonance.controls;
      expect(controls.massSimpleStringProperty).toBeDefined();
      expect(controls.springConstantSimpleStringProperty).toBeDefined();
    });

    it("should have damping, gravity, ruler, and on labels", () => {
      const controls = getStringProperties().resonance.controls;
      expect(controls.dampingStringProperty).toBeDefined();
      expect(controls.gravityStringProperty).toBeDefined();
      expect(controls.rulerStringProperty).toBeDefined();
      expect(controls.onStringProperty).toBeDefined();
    });

    it("should have speed control and other labels", () => {
      const controls = getStringProperties().resonance.controls;
      expect(controls.slowStringProperty).toBeDefined();
      expect(controls.normalStringProperty).toBeDefined();
      expect(controls.frequencyEqualsStringProperty).toBeDefined();
      expect(controls.closeStringProperty).toBeDefined();
    });
  });

  describe("preferences", () => {
    it("should have preferences title", () => {
      const prefs = getStringProperties().resonance.preferences;
      expect(prefs.titleStringProperty).toBeDefined();
    });

    it("should have visual preferences labels", () => {
      const visual = getStringProperties().resonance.preferences.visual;
      expect(visual.titleStringProperty).toBeDefined();
      expect(visual.colorProfileStringProperty).toBeDefined();
      expect(visual.colorProfileDefaultStringProperty).toBeDefined();
      expect(visual.colorProfileProjectorStringProperty).toBeDefined();
      expect(visual.colorProfileColorblindStringProperty).toBeDefined();
      expect(visual.contrastStringProperty).toBeDefined();
    });

    it("should have simulation preferences labels", () => {
      const sim = getStringProperties().resonance.preferences.simulation;
      expect(sim.titleStringProperty).toBeDefined();
      expect(sim.displayOptionsStringProperty).toBeDefined();
      expect(sim.showEnergyStringProperty).toBeDefined();
      expect(sim.showVectorsStringProperty).toBeDefined();
      expect(sim.showPhaseStringProperty).toBeDefined();
    });

    it("should have units labels", () => {
      const sim = getStringProperties().resonance.preferences.simulation;
      expect(sim.unitsStringProperty).toBeDefined();
      expect(sim.unitsMetricStringProperty).toBeDefined();
      expect(sim.unitsImperialStringProperty).toBeDefined();
    });

    it("should have solver method labels", () => {
      const sim = getStringProperties().resonance.preferences.simulation;
      expect(sim.solverMethodStringProperty).toBeDefined();
      expect(sim.solverDescriptionStringProperty).toBeDefined();
      expect(sim.odeSolverStringProperty).toBeDefined();
      expect(sim.solverRK4StringProperty).toBeDefined();
      expect(sim.solverRK4DescriptionStringProperty).toBeDefined();
      expect(sim.solverAdaptiveRK45StringProperty).toBeDefined();
      expect(sim.solverAdaptiveRK45DescriptionStringProperty).toBeDefined();
    });

    it("should have localization labels", () => {
      const loc = getStringProperties().resonance.preferences.localization;
      expect(loc.titleStringProperty).toBeDefined();
      expect(loc.languageStringProperty).toBeDefined();
    });
  });

  describe("presets", () => {
    it("should have all preset name string properties", () => {
      const presets = getStringProperties().resonance.presets;
      expect(presets.lightAndBouncyStringProperty).toBeDefined();
      expect(presets.heavyAndSlowStringProperty).toBeDefined();
      expect(presets.underdampedStringProperty).toBeDefined();
      expect(presets.criticallyDampedStringProperty).toBeDefined();
      expect(presets.overdampedStringProperty).toBeDefined();
      expect(presets.resonanceDemoStringProperty).toBeDefined();
    });

    it("should have non-empty preset names", () => {
      const presets = getStringProperties().resonance.presets;
      expect(presets.lightAndBouncyStringProperty.value.length).toBeGreaterThan(0);
      expect(presets.resonanceDemoStringProperty.value.length).toBeGreaterThan(0);
    });
  });

  describe("common", () => {
    it("should have common solver name string properties", () => {
      const common = getStringProperties().resonance.common;
      expect(common.solverRK4StringProperty).toBeDefined();
      expect(common.solverAdaptiveRK45StringProperty).toBeDefined();
      expect(common.solverAdaptiveEulerStringProperty).toBeDefined();
      expect(common.solverModifiedMidpointStringProperty).toBeDefined();
    });
  });

  describe("units", () => {
    it("should have all unit label string properties", () => {
      const units = getStringProperties().resonance.units;
      expect(units.hertzPatternStringProperty).toBeDefined();
      expect(units.cmPatternStringProperty).toBeDefined();
      expect(units.kgPatternStringProperty).toBeDefined();
      expect(units.newtonPerMeterPatternStringProperty).toBeDefined();
      expect(units.dampingUnitsPatternStringProperty).toBeDefined();
      expect(units.cmStringProperty).toBeDefined();
    });

    it("should have pattern strings containing placeholder", () => {
      const units = getStringProperties().resonance.units;
      expect(units.hertzPatternStringProperty.value).toContain("{{value}}");
      expect(units.cmPatternStringProperty.value).toContain("{{value}}");
      expect(units.kgPatternStringProperty.value).toContain("{{value}}");
    });
  });

  describe("content", () => {
    it("should have content labels", () => {
      const content = getStringProperties().resonance.content;
      expect(content.sampleTextStringProperty).toBeDefined();
    });
  });
});
