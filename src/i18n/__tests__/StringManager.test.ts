/**
 * Tests for StringManager - Internationalization string management
 *
 * Tests singleton pattern, string property getters, and localization support.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { StringManager } from "../StringManager.js";

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

  describe("getTitleStringProperty", () => {
    it("should return a valid string property", () => {
      const titleProperty = stringManager.getTitleStringProperty();
      expect(titleProperty).toBeDefined();
      expect(typeof titleProperty.value).toBe("string");
    });

    it("should return a non-empty title", () => {
      const titleProperty = stringManager.getTitleStringProperty();
      expect(titleProperty.value.length).toBeGreaterThan(0);
    });
  });

  describe("getScreenNames", () => {
    it("should return screen name string properties", () => {
      const screenNames = stringManager.getScreenNames();
      expect(screenNames).toBeDefined();
      expect(screenNames.simStringProperty).toBeDefined();
    });

    it("should have non-empty sim screen name", () => {
      const screenNames = stringManager.getScreenNames();
      expect(screenNames.simStringProperty.value.length).toBeGreaterThan(0);
    });
  });

  describe("getControlLabels", () => {
    it("should return all control label string properties", () => {
      const controls = stringManager.getControlLabels();
      expect(controls).toBeDefined();
    });

    it("should have spring constant label", () => {
      const controls = stringManager.getControlLabels();
      expect(controls.springConstantStringProperty).toBeDefined();
      expect(controls.springConstantStringProperty.value.length).toBeGreaterThan(0);
    });

    it("should have damping coefficient label", () => {
      const controls = stringManager.getControlLabels();
      expect(controls.dampingCoefficientStringProperty).toBeDefined();
    });

    it("should have driving frequency label", () => {
      const controls = stringManager.getControlLabels();
      expect(controls.drivingFrequencyStringProperty).toBeDefined();
    });

    it("should have driving amplitude label", () => {
      const controls = stringManager.getControlLabels();
      expect(controls.drivingAmplitudeStringProperty).toBeDefined();
    });

    it("should have mass label", () => {
      const controls = stringManager.getControlLabels();
      expect(controls.massStringProperty).toBeDefined();
    });

    it("should have reset label", () => {
      const controls = stringManager.getControlLabels();
      expect(controls.resetStringProperty).toBeDefined();
    });

    it("should have resonator config labels", () => {
      const controls = stringManager.getControlLabels();
      expect(controls.resonatorConfigStringProperty).toBeDefined();
      expect(controls.sameMassStringProperty).toBeDefined();
      expect(controls.sameSpringConstantStringProperty).toBeDefined();
      expect(controls.mixedStringProperty).toBeDefined();
      expect(controls.sameFrequencyStringProperty).toBeDefined();
      expect(controls.customStringProperty).toBeDefined();
    });

    it("should have frequency and amplitude labels", () => {
      const controls = stringManager.getControlLabels();
      expect(controls.frequencyStringProperty).toBeDefined();
      expect(controls.amplitudeStringProperty).toBeDefined();
    });

    it("should have resonator labels", () => {
      const controls = stringManager.getControlLabels();
      expect(controls.resonatorsStringProperty).toBeDefined();
      expect(controls.resonator1StringProperty).toBeDefined();
      expect(controls.resonatorPatternStringProperty).toBeDefined();
    });

    it("should have simple labels for mass and spring constant", () => {
      const controls = stringManager.getControlLabels();
      expect(controls.massSimpleStringProperty).toBeDefined();
      expect(controls.springConstantSimpleStringProperty).toBeDefined();
    });

    it("should have damping and gravity labels", () => {
      const controls = stringManager.getControlLabels();
      expect(controls.dampingStringProperty).toBeDefined();
      expect(controls.gravityStringProperty).toBeDefined();
    });

    it("should have ruler and on labels", () => {
      const controls = stringManager.getControlLabels();
      expect(controls.rulerStringProperty).toBeDefined();
      expect(controls.onStringProperty).toBeDefined();
    });

    it("should have speed control labels", () => {
      const controls = stringManager.getControlLabels();
      expect(controls.slowStringProperty).toBeDefined();
      expect(controls.normalStringProperty).toBeDefined();
    });

    it("should have frequency equals and close labels", () => {
      const controls = stringManager.getControlLabels();
      expect(controls.frequencyEqualsStringProperty).toBeDefined();
      expect(controls.closeStringProperty).toBeDefined();
    });
  });

  describe("getPreferencesLabels", () => {
    it("should return preferences title string property", () => {
      const prefs = stringManager.getPreferencesLabels();
      expect(prefs).toBeDefined();
      expect(prefs.titleStringProperty).toBeDefined();
    });
  });

  describe("getVisualPreferencesLabels", () => {
    it("should return visual preferences labels", () => {
      const visual = stringManager.getVisualPreferencesLabels();
      expect(visual).toBeDefined();
      expect(visual.titleStringProperty).toBeDefined();
    });

    it("should have color profile labels", () => {
      const visual = stringManager.getVisualPreferencesLabels();
      expect(visual.colorProfileStringProperty).toBeDefined();
      expect(visual.colorProfileDefaultStringProperty).toBeDefined();
      expect(visual.colorProfileProjectorStringProperty).toBeDefined();
      expect(visual.colorProfileColorblindStringProperty).toBeDefined();
    });

    it("should have contrast label", () => {
      const visual = stringManager.getVisualPreferencesLabels();
      expect(visual.contrastStringProperty).toBeDefined();
    });
  });

  describe("getSimulationPreferencesLabels", () => {
    it("should return simulation preferences labels", () => {
      const sim = stringManager.getSimulationPreferencesLabels();
      expect(sim).toBeDefined();
      expect(sim.titleStringProperty).toBeDefined();
    });

    it("should have display options labels", () => {
      const sim = stringManager.getSimulationPreferencesLabels();
      expect(sim.displayOptionsStringProperty).toBeDefined();
      expect(sim.showEnergyStringProperty).toBeDefined();
      expect(sim.showVectorsStringProperty).toBeDefined();
      expect(sim.showPhaseStringProperty).toBeDefined();
    });

    it("should have units labels", () => {
      const sim = stringManager.getSimulationPreferencesLabels();
      expect(sim.unitsStringProperty).toBeDefined();
      expect(sim.unitsMetricStringProperty).toBeDefined();
      expect(sim.unitsImperialStringProperty).toBeDefined();
    });

    it("should have solver method labels", () => {
      const sim = stringManager.getSimulationPreferencesLabels();
      expect(sim.solverMethodStringProperty).toBeDefined();
      expect(sim.solverDescriptionStringProperty).toBeDefined();
      expect(sim.odeSolverStringProperty).toBeDefined();
    });
  });

  describe("getSolverNames", () => {
    it("should return all solver name string properties", () => {
      const solvers = stringManager.getSolverNames();
      expect(solvers).toBeDefined();
      expect(solvers.rk4StringProperty).toBeDefined();
      expect(solvers.adaptiveRK45StringProperty).toBeDefined();
      expect(solvers.adaptiveEulerStringProperty).toBeDefined();
      expect(solvers.modifiedMidpointStringProperty).toBeDefined();
    });

    it("should have non-empty solver names", () => {
      const solvers = stringManager.getSolverNames();
      expect(solvers.rk4StringProperty.value.length).toBeGreaterThan(0);
      expect(solvers.adaptiveRK45StringProperty.value.length).toBeGreaterThan(0);
      expect(solvers.adaptiveEulerStringProperty.value.length).toBeGreaterThan(0);
      expect(solvers.modifiedMidpointStringProperty.value.length).toBeGreaterThan(0);
    });
  });

  describe("getSolverDescriptions", () => {
    it("should return all solver description string properties", () => {
      const descriptions = stringManager.getSolverDescriptions();
      expect(descriptions).toBeDefined();
      expect(descriptions.rk4DescriptionStringProperty).toBeDefined();
      expect(descriptions.adaptiveRK45DescriptionStringProperty).toBeDefined();
      expect(descriptions.adaptiveEulerDescriptionStringProperty).toBeDefined();
      expect(descriptions.modifiedMidpointDescriptionStringProperty).toBeDefined();
    });
  });

  describe("getLocalizationPreferencesLabels", () => {
    it("should return localization labels", () => {
      const loc = stringManager.getLocalizationPreferencesLabels();
      expect(loc).toBeDefined();
      expect(loc.titleStringProperty).toBeDefined();
      expect(loc.languageStringProperty).toBeDefined();
    });
  });

  describe("getContentLabels", () => {
    it("should return content labels", () => {
      const content = stringManager.getContentLabels();
      expect(content).toBeDefined();
      expect(content.sampleTextStringProperty).toBeDefined();
    });
  });

  describe("getPresetNames", () => {
    it("should return all preset name string properties", () => {
      const presets = stringManager.getPresetNames();
      expect(presets).toBeDefined();
      expect(presets.lightAndBouncyStringProperty).toBeDefined();
      expect(presets.heavyAndSlowStringProperty).toBeDefined();
      expect(presets.underdampedStringProperty).toBeDefined();
      expect(presets.criticallyDampedStringProperty).toBeDefined();
      expect(presets.overdampedStringProperty).toBeDefined();
      expect(presets.resonanceDemoStringProperty).toBeDefined();
    });

    it("should have non-empty preset names", () => {
      const presets = stringManager.getPresetNames();
      expect(presets.lightAndBouncyStringProperty.value.length).toBeGreaterThan(0);
      expect(presets.resonanceDemoStringProperty.value.length).toBeGreaterThan(0);
    });
  });

  describe("getCommonSolverNames", () => {
    it("should return common solver name string properties", () => {
      const common = stringManager.getCommonSolverNames();
      expect(common).toBeDefined();
      expect(common.solverRK4StringProperty).toBeDefined();
      expect(common.solverAdaptiveRK45StringProperty).toBeDefined();
      expect(common.solverAdaptiveEulerStringProperty).toBeDefined();
      expect(common.solverModifiedMidpointStringProperty).toBeDefined();
    });
  });

  describe("getUnitLabels", () => {
    it("should return all unit label string properties", () => {
      const units = stringManager.getUnitLabels();
      expect(units).toBeDefined();
      expect(units.hertzPatternStringProperty).toBeDefined();
      expect(units.cmPatternStringProperty).toBeDefined();
      expect(units.kgPatternStringProperty).toBeDefined();
      expect(units.newtonPerMeterPatternStringProperty).toBeDefined();
      expect(units.dampingUnitsPatternStringProperty).toBeDefined();
      expect(units.cmStringProperty).toBeDefined();
    });

    it("should have pattern strings containing placeholder", () => {
      const units = stringManager.getUnitLabels();
      // Pattern strings should contain {{value}} placeholder
      expect(units.hertzPatternStringProperty.value).toContain("{{value}}");
      expect(units.cmPatternStringProperty.value).toContain("{{value}}");
      expect(units.kgPatternStringProperty.value).toContain("{{value}}");
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
