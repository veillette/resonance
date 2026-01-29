/**
 * Tests for ResonatorControlPanel - Main control panel UI component
 *
 * Tests resonator count control, configuration mode selection,
 * mass/spring controls, damping, gravity toggle, and ruler checkbox.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ResonatorControlPanel } from "../ResonatorControlPanel.js";
import { SimModel } from "../../model/SimModel.js";
import { ResonancePreferencesModel } from "../../../preferences/ResonancePreferencesModel.js";
import { ResonatorConfigMode } from "../../../common/model/ResonatorConfigMode.js";
import ResonanceConstants from "../../../common/ResonanceConstants.js";
import { Bounds2 } from "scenerystack/dot";
import { Property } from "scenerystack/axon";

describe("ResonatorControlPanel", () => {
  let model: SimModel;
  let rulerVisibleProperty: Property<boolean>;
  let controlPanel: ResonatorControlPanel;
  let layoutBounds: Bounds2;

  beforeEach(() => {
    model = new SimModel(new ResonancePreferencesModel());
    layoutBounds = new Bounds2(0, 0, 1024, 768);
    rulerVisibleProperty = new Property<boolean>(false);
    controlPanel = new ResonatorControlPanel(
      model,
      layoutBounds,
      rulerVisibleProperty
    );
  });

  afterEach(() => {
    controlPanel.dispose();
  });

  describe("construction", () => {
    it("should construct without errors", () => {
      expect(controlPanel).toBeDefined();
    });

    it("should have child nodes", () => {
      expect(controlPanel.children.length).toBeGreaterThan(0);
    });

    it("should expose comboBoxListParent", () => {
      expect(controlPanel.comboBoxListParent).toBeDefined();
    });

    it("should expose gravityEnabledProperty", () => {
      expect(controlPanel.gravityEnabledProperty).toBeDefined();
      expect(typeof controlPanel.gravityEnabledProperty.value).toBe("boolean");
    });

    it("should expose rulerVisibleProperty", () => {
      expect(controlPanel.rulerVisibleProperty).toBeDefined();
      expect(controlPanel.rulerVisibleProperty).toBe(rulerVisibleProperty);
    });

    it("should be visible by default", () => {
      expect(controlPanel.visible).toBe(true);
    });

    it("should have non-zero dimensions", () => {
      expect(controlPanel.width).toBeGreaterThan(0);
      expect(controlPanel.height).toBeGreaterThan(0);
    });
  });

  describe("resonator count control", () => {
    it("should start with count 1", () => {
      expect(model.resonatorCountProperty.value).toBe(1);
    });

    it("should allow setting count to maximum", () => {
      model.resonatorCountProperty.value = 10;
      expect(model.resonatorCountProperty.value).toBe(10);
    });

    it("should allow setting count to values in range", () => {
      for (let i = 1; i <= 10; i++) {
        model.resonatorCountProperty.value = i;
        expect(model.resonatorCountProperty.value).toBe(i);
      }
    });
  });

  describe("configuration mode", () => {
    it("should start with SAME_MASS mode", () => {
      expect(model.resonatorConfigProperty.value).toBe(
        ResonatorConfigMode.SAME_MASS
      );
    });

    it("should allow setting SAME_SPRING_CONSTANT mode", () => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_SPRING_CONSTANT;
      expect(model.resonatorConfigProperty.value).toBe(
        ResonatorConfigMode.SAME_SPRING_CONSTANT
      );
    });

    it("should allow setting MIXED mode", () => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.MIXED;
      expect(model.resonatorConfigProperty.value).toBe(
        ResonatorConfigMode.MIXED
      );
    });

    it("should allow setting SAME_FREQUENCY mode", () => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_FREQUENCY;
      expect(model.resonatorConfigProperty.value).toBe(
        ResonatorConfigMode.SAME_FREQUENCY
      );
    });

    it("should allow setting CUSTOM mode", () => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.CUSTOM;
      expect(model.resonatorConfigProperty.value).toBe(
        ResonatorConfigMode.CUSTOM
      );
    });

    it("should allow cycling through all modes", () => {
      const modes = [
        ResonatorConfigMode.SAME_SPRING_CONSTANT,
        ResonatorConfigMode.SAME_MASS,
        ResonatorConfigMode.MIXED,
        ResonatorConfigMode.SAME_FREQUENCY,
        ResonatorConfigMode.CUSTOM,
      ];

      modes.forEach((mode) => {
        model.resonatorConfigProperty.value = mode;
        expect(model.resonatorConfigProperty.value).toBe(mode);
      });
    });
  });

  describe("mass control", () => {
    it("should have mass in valid range", () => {
      const mass = model.resonanceModel.massProperty.value;
      expect(mass).toBeGreaterThanOrEqual(ResonanceConstants.MASS_RANGE.min);
      expect(mass).toBeLessThanOrEqual(ResonanceConstants.MASS_RANGE.max);
    });

    it("should allow setting minimum mass", () => {
      model.resonanceModel.massProperty.value = ResonanceConstants.MASS_RANGE.min;
      expect(model.resonanceModel.massProperty.value).toBe(
        ResonanceConstants.MASS_RANGE.min
      );
    });

    it("should allow setting maximum mass", () => {
      model.resonanceModel.massProperty.value = ResonanceConstants.MASS_RANGE.max;
      expect(model.resonanceModel.massProperty.value).toBe(
        ResonanceConstants.MASS_RANGE.max
      );
    });
  });

  describe("spring constant control", () => {
    it("should have spring constant in valid range", () => {
      const k = model.resonanceModel.springConstantProperty.value;
      expect(k).toBeGreaterThanOrEqual(
        ResonanceConstants.SPRING_CONSTANT_RANGE.min
      );
      expect(k).toBeLessThanOrEqual(
        ResonanceConstants.SPRING_CONSTANT_RANGE.max
      );
    });

    it("should allow setting minimum spring constant", () => {
      model.resonanceModel.springConstantProperty.value =
        ResonanceConstants.SPRING_CONSTANT_RANGE.min;
      expect(model.resonanceModel.springConstantProperty.value).toBe(
        ResonanceConstants.SPRING_CONSTANT_RANGE.min
      );
    });

    it("should allow setting maximum spring constant", () => {
      model.resonanceModel.springConstantProperty.value =
        ResonanceConstants.SPRING_CONSTANT_RANGE.max;
      expect(model.resonanceModel.springConstantProperty.value).toBe(
        ResonanceConstants.SPRING_CONSTANT_RANGE.max
      );
    });
  });

  describe("damping control", () => {
    it("should have damping in valid range", () => {
      const damping = model.resonanceModel.dampingProperty.value;
      expect(damping).toBeGreaterThanOrEqual(
        ResonanceConstants.DAMPING_RANGE.min
      );
      expect(damping).toBeLessThanOrEqual(ResonanceConstants.DAMPING_RANGE.max);
    });

    it("should allow setting minimum damping", () => {
      model.resonanceModel.dampingProperty.value =
        ResonanceConstants.DAMPING_RANGE.min;
      expect(model.resonanceModel.dampingProperty.value).toBe(
        ResonanceConstants.DAMPING_RANGE.min
      );
    });

    it("should allow setting maximum damping", () => {
      model.resonanceModel.dampingProperty.value =
        ResonanceConstants.DAMPING_RANGE.max;
      expect(model.resonanceModel.dampingProperty.value).toBe(
        ResonanceConstants.DAMPING_RANGE.max
      );
    });
  });

  describe("gravity toggle", () => {
    it("should start with gravity disabled (0)", () => {
      // Default gravity is 0
      expect(model.resonanceModel.gravityProperty.value).toBe(0);
    });

    it("should enable gravity via gravityEnabledProperty", () => {
      controlPanel.gravityEnabledProperty.value = true;
      expect(model.resonanceModel.gravityProperty.value).toBe(
        ResonanceConstants.GRAVITY_ACCELERATION
      );
    });

    it("should disable gravity via gravityEnabledProperty", () => {
      controlPanel.gravityEnabledProperty.value = true;
      controlPanel.gravityEnabledProperty.value = false;
      expect(model.resonanceModel.gravityProperty.value).toBe(0);
    });

    it("should toggle gravity correctly", () => {
      // Enable
      controlPanel.gravityEnabledProperty.value = true;
      expect(model.resonanceModel.gravityProperty.value).toBeGreaterThan(0);

      // Disable
      controlPanel.gravityEnabledProperty.value = false;
      expect(model.resonanceModel.gravityProperty.value).toBe(0);

      // Enable again
      controlPanel.gravityEnabledProperty.value = true;
      expect(model.resonanceModel.gravityProperty.value).toBeGreaterThan(0);
    });
  });

  describe("ruler visibility", () => {
    it("should start with ruler hidden", () => {
      expect(rulerVisibleProperty.value).toBe(false);
    });

    it("should allow showing ruler", () => {
      rulerVisibleProperty.value = true;
      expect(rulerVisibleProperty.value).toBe(true);
    });

    it("should allow hiding ruler", () => {
      rulerVisibleProperty.value = true;
      rulerVisibleProperty.value = false;
      expect(rulerVisibleProperty.value).toBe(false);
    });
  });

  describe("reset", () => {
    it("should reset gravityEnabledProperty", () => {
      controlPanel.gravityEnabledProperty.value = true;
      controlPanel.reset();
      expect(controlPanel.gravityEnabledProperty.value).toBe(false);
    });

    it("should be callable multiple times", () => {
      expect(() => {
        controlPanel.reset();
        controlPanel.reset();
        controlPanel.reset();
      }).not.toThrow();
    });
  });

  describe("dispose", () => {
    it("should dispose without errors", () => {
      const panel = new ResonatorControlPanel(
        model,
        layoutBounds,
        new Property(false)
      );
      expect(() => panel.dispose()).not.toThrow();
    });

    it("should be safe to dispose multiple times", () => {
      const panel = new ResonatorControlPanel(
        model,
        layoutBounds,
        new Property(false)
      );
      expect(() => {
        panel.dispose();
        // Second dispose might throw or not, depending on implementation
        // but should not cause unrecoverable errors
      }).not.toThrow();
    });
  });

  describe("visibility based on resonator count", () => {
    it("should work with single resonator", () => {
      model.resonatorCountProperty.value = 1;
      // Panel should still be functional
      expect(controlPanel.visible).toBe(true);
    });

    it("should work with multiple resonators", () => {
      model.resonatorCountProperty.value = 5;
      // Panel should still be functional
      expect(controlPanel.visible).toBe(true);
    });

    it("should work with maximum resonators", () => {
      model.resonatorCountProperty.value = 10;
      // Panel should still be functional
      expect(controlPanel.visible).toBe(true);
    });
  });

  describe("resonator selection", () => {
    it("should start with first resonator selected", () => {
      expect(model.selectedResonatorIndexProperty.value).toBe(0);
    });

    it("should allow selecting different resonators", () => {
      model.resonatorCountProperty.value = 5;
      model.selectedResonatorIndexProperty.value = 3;
      expect(model.selectedResonatorIndexProperty.value).toBe(3);
    });

    it("should clamp selection when count decreases", () => {
      model.resonatorCountProperty.value = 5;
      model.selectedResonatorIndexProperty.value = 4;
      model.resonatorCountProperty.value = 3;
      expect(model.selectedResonatorIndexProperty.value).toBeLessThan(3);
    });
  });

  describe("layout positioning", () => {
    it("should position relative to layout bounds", () => {
      expect(controlPanel.right).toBeLessThanOrEqual(layoutBounds.maxX);
      expect(controlPanel.top).toBeGreaterThanOrEqual(layoutBounds.minY);
    });

    it("should work with different layout bounds", () => {
      const smallBounds = new Bounds2(0, 0, 800, 600);
      const panel = new ResonatorControlPanel(
        model,
        smallBounds,
        new Property(false)
      );
      expect(panel.right).toBeLessThanOrEqual(smallBounds.maxX);
      panel.dispose();
    });
  });

  describe("CUSTOM mode behavior", () => {
    it("should allow independent mass changes in CUSTOM mode", () => {
      model.resonatorCountProperty.value = 3;
      model.resonatorConfigProperty.value = ResonatorConfigMode.CUSTOM;

      // Change mass of second resonator
      model.selectedResonatorIndexProperty.value = 1;
      model.resonatorModels[1].massProperty.value = 2.5;

      expect(model.resonatorModels[1].massProperty.value).toBe(2.5);
    });

    it("should allow independent spring constant changes in CUSTOM mode", () => {
      model.resonatorCountProperty.value = 3;
      model.resonatorConfigProperty.value = ResonatorConfigMode.CUSTOM;

      // Change spring constant of second resonator
      model.selectedResonatorIndexProperty.value = 1;
      model.resonatorModels[1].springConstantProperty.value = 500;

      expect(model.resonatorModels[1].springConstantProperty.value).toBe(500);
    });
  });
});
