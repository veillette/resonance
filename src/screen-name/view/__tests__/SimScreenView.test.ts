/**
 * Tests for SimScreenView - Main simulation view component
 *
 * Tests view construction, reset functionality, step method,
 * and resonator rebuilding.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SimScreenView } from "../SimScreenView.js";
import { SimModel } from "../../model/SimModel.js";
import { ResonancePreferencesModel } from "../../../preferences/ResonancePreferencesModel.js";
import { Bounds2 } from "scenerystack/dot";

describe("SimScreenView", () => {
  let model: SimModel;
  let view: SimScreenView;

  beforeEach(() => {
    model = new SimModel(new ResonancePreferencesModel());
    view = new SimScreenView(model, {
      layoutBounds: new Bounds2(0, 0, 1024, 768),
    });
  });

  describe("construction", () => {
    it("should construct without errors", () => {
      expect(view).toBeDefined();
    });

    it("should have correct layout bounds", () => {
      expect(view.layoutBounds.width).toBe(1024);
      expect(view.layoutBounds.height).toBe(768);
    });

    it("should store reference to model", () => {
      // View should be able to step the model
      expect(() => view.step(0.016)).not.toThrow();
    });

    it("should create child nodes", () => {
      // SimScreenView should have children (simulation area, control panel, etc.)
      expect(view.children.length).toBeGreaterThan(0);
    });
  });

  describe("reset", () => {
    it("should reset without errors", () => {
      expect(() => view.reset()).not.toThrow();
    });

    it("should be callable multiple times", () => {
      expect(() => {
        view.reset();
        view.reset();
        view.reset();
      }).not.toThrow();
    });
  });

  describe("step", () => {
    it("should step with positive dt", () => {
      expect(() => view.step(0.016)).not.toThrow();
    });

    it("should step with zero dt", () => {
      expect(() => view.step(0)).not.toThrow();
    });

    it("should step with small dt", () => {
      expect(() => view.step(0.001)).not.toThrow();
    });

    it("should step multiple times in sequence", () => {
      expect(() => {
        for (let i = 0; i < 100; i++) {
          view.step(0.016);
        }
      }).not.toThrow();
    });

    it("should call model.step", () => {
      const stepSpy = vi.spyOn(model, "step");
      view.step(0.016);
      expect(stepSpy).toHaveBeenCalledWith(0.016);
    });
  });

  describe("resonator count changes", () => {
    it("should handle resonator count increase", () => {
      model.resonatorCountProperty.value = 5;
      expect(() => view.step(0.016)).not.toThrow();
    });

    it("should handle resonator count decrease", () => {
      model.resonatorCountProperty.value = 5;
      view.step(0.016);
      model.resonatorCountProperty.value = 2;
      expect(() => view.step(0.016)).not.toThrow();
    });

    it("should handle single resonator", () => {
      model.resonatorCountProperty.value = 1;
      expect(() => view.step(0.016)).not.toThrow();
    });

    it("should handle maximum resonators", () => {
      model.resonatorCountProperty.value = 10;
      expect(() => view.step(0.016)).not.toThrow();
    });

    it("should handle rapid count changes", () => {
      expect(() => {
        for (let i = 1; i <= 10; i++) {
          model.resonatorCountProperty.value = i;
          view.step(0.016);
        }
        for (let i = 10; i >= 1; i--) {
          model.resonatorCountProperty.value = i;
          view.step(0.016);
        }
      }).not.toThrow();
    });
  });

  describe("driving force visualization", () => {
    it("should handle driving enabled", () => {
      model.resonanceModel.drivingEnabledProperty.value = true;
      expect(() => view.step(0.016)).not.toThrow();
    });

    it("should handle driving disabled", () => {
      model.resonanceModel.drivingEnabledProperty.value = false;
      expect(() => view.step(0.016)).not.toThrow();
    });

    it("should handle driving toggle during simulation", () => {
      model.resonanceModel.drivingEnabledProperty.value = true;
      view.step(0.016);
      model.resonanceModel.drivingEnabledProperty.value = false;
      view.step(0.016);
      model.resonanceModel.drivingEnabledProperty.value = true;
      view.step(0.016);
      expect(true).toBe(true); // Test passes if no errors
    });

    it("should handle different driving amplitudes", () => {
      model.resonanceModel.drivingEnabledProperty.value = true;
      model.resonanceModel.drivingAmplitudeProperty.value = 0.002; // min
      view.step(0.016);
      model.resonanceModel.drivingAmplitudeProperty.value = 0.02; // max
      view.step(0.016);
      expect(true).toBe(true);
    });
  });

  describe("physics simulation visualization", () => {
    it("should handle position changes", () => {
      model.resonanceModel.positionProperty.value = 0.1;
      expect(() => view.step(0.016)).not.toThrow();
    });

    it("should handle negative positions", () => {
      model.resonanceModel.positionProperty.value = -0.2;
      expect(() => view.step(0.016)).not.toThrow();
    });

    it("should handle running simulation", () => {
      model.resonanceModel.isPlayingProperty.value = true;
      model.resonanceModel.drivingEnabledProperty.value = true;

      // Run for several frames
      for (let i = 0; i < 60; i++) {
        view.step(0.016);
      }

      expect(true).toBe(true); // Test passes if no errors
    });
  });

  describe("integration with model reset", () => {
    it("should work after model reset", () => {
      // Run simulation
      model.resonanceModel.isPlayingProperty.value = true;
      for (let i = 0; i < 30; i++) {
        view.step(0.016);
      }

      // Reset model
      model.reset();

      // Continue simulation
      expect(() => {
        for (let i = 0; i < 30; i++) {
          view.step(0.016);
        }
      }).not.toThrow();
    });

    it("should work after view and model reset", () => {
      // Run simulation
      model.resonanceModel.isPlayingProperty.value = true;
      for (let i = 0; i < 30; i++) {
        view.step(0.016);
      }

      // Reset both
      model.reset();
      view.reset();

      // Continue simulation
      expect(() => {
        for (let i = 0; i < 30; i++) {
          view.step(0.016);
        }
      }).not.toThrow();
    });
  });

  describe("multiple resonators", () => {
    it("should visualize all resonators correctly", () => {
      model.resonatorCountProperty.value = 5;

      // Set different positions for each resonator
      for (let i = 0; i < 5; i++) {
        model.resonatorModels[i]!.positionProperty.value = 0.1 * (i - 2);
      }

      expect(() => view.step(0.016)).not.toThrow();
    });

    it("should update when resonator properties change", () => {
      model.resonatorCountProperty.value = 3;

      // Change mass and spring constant
      model.resonatorModels[0]!.massProperty.value = 2.0;
      model.resonatorModels[0]!.springConstantProperty.value = 500;

      expect(() => view.step(0.016)).not.toThrow();
    });
  });
});
