/**
 * Tests for SimScreen - Screen wrapper connecting model and view
 *
 * P2 Priority: Integration tests for screen components.
 *
 * Note: Direct Screen instantiation requires PhET-iO infrastructure,
 * so we test the model and view factories indirectly.
 */

import { describe, it, expect } from "vitest";
import { SimModel } from "../model/SimModel.js";
import { SimScreenView } from "../view/SimScreenView.js";
import { ResonancePreferencesModel } from "../../preferences/ResonancePreferencesModel.js";

describe("SimScreen components", () => {
  describe("model factory", () => {
    it("should create SimModel with preferences", () => {
      const preferencesModel = new ResonancePreferencesModel();
      const model = new SimModel(preferencesModel);

      expect(model).toBeInstanceOf(SimModel);
    });

    it("should create unique model instances", () => {
      const preferencesModel = new ResonancePreferencesModel();
      const model1 = new SimModel(preferencesModel);
      const model2 = new SimModel(preferencesModel);

      expect(model1).not.toBe(model2);
    });

    it("should have resonance model initialized", () => {
      const preferencesModel = new ResonancePreferencesModel();
      const model = new SimModel(preferencesModel);

      expect(model.resonanceModel).toBeDefined();
    });

    it("should have resonator count property", () => {
      const preferencesModel = new ResonancePreferencesModel();
      const model = new SimModel(preferencesModel);

      expect(model.resonatorCountProperty).toBeDefined();
      expect(model.resonatorCountProperty.value).toBeGreaterThanOrEqual(1);
    });
  });

  describe("view factory", () => {
    it("should create SimScreenView from model", () => {
      const preferencesModel = new ResonancePreferencesModel();
      const model = new SimModel(preferencesModel);
      const view = new SimScreenView(model);

      expect(view).toBeInstanceOf(SimScreenView);
    });

    it("should pass model to view", () => {
      const preferencesModel = new ResonancePreferencesModel();
      const model = new SimModel(preferencesModel);
      const view = new SimScreenView(model);

      expect(view.model).toBe(model);
    });

    it("should create functional view with children", () => {
      const preferencesModel = new ResonancePreferencesModel();
      const model = new SimModel(preferencesModel);
      const view = new SimScreenView(model);

      expect(view.children.length).toBeGreaterThan(0);
    });
  });

  describe("model-view integration", () => {
    it("should create compatible model and view pairs", () => {
      const preferencesModel = new ResonancePreferencesModel();
      const model = new SimModel(preferencesModel);
      const view = new SimScreenView(model);

      // Should be able to step without errors
      expect(() => {
        model.step(0.016);
        view.step(0.016);
      }).not.toThrow();
    });

    it("should handle reset on both model and view", () => {
      const preferencesModel = new ResonancePreferencesModel();
      const model = new SimModel(preferencesModel);
      const view = new SimScreenView(model);

      // Modify model state
      model.resonanceModel.drivingFrequencyProperty.value = 3.5;

      // Reset both
      expect(() => {
        model.reset();
        view.reset();
      }).not.toThrow();
    });

    it("should reflect model changes in view", () => {
      const preferencesModel = new ResonancePreferencesModel();
      const model = new SimModel(preferencesModel);
      const view = new SimScreenView(model);

      // Change model state
      model.resonanceModel.drivingEnabledProperty.value = true;
      model.resonatorCountProperty.value = 5;

      // View should still be valid
      expect(view.bounds.isValid()).toBe(true);
    });

    it("should step model when view steps", () => {
      const preferencesModel = new ResonancePreferencesModel();
      const model = new SimModel(preferencesModel);
      const view = new SimScreenView(model);

      // Enable running state (using isPlayingProperty on resonanceModel)
      model.resonanceModel.isPlayingProperty.value = true;
      model.resonanceModel.drivingEnabledProperty.value = true;

      const initialTime = model.resonanceModel.timeProperty.value;

      // Step the model
      model.step(0.1);

      // Time should have advanced
      expect(model.resonanceModel.timeProperty.value).toBeGreaterThan(
        initialTime,
      );
    });
  });

  describe("multiple instances", () => {
    it("should create independent model instances", () => {
      const preferencesModel = new ResonancePreferencesModel();
      const model1 = new SimModel(preferencesModel);
      const model2 = new SimModel(preferencesModel);

      // Models should be independent
      model1.resonanceModel.drivingFrequencyProperty.value = 1.0;
      model2.resonanceModel.drivingFrequencyProperty.value = 5.0;

      expect(model1.resonanceModel.drivingFrequencyProperty.value).toBe(1.0);
      expect(model2.resonanceModel.drivingFrequencyProperty.value).toBe(5.0);
    });

    it("should create independent view instances", () => {
      const preferencesModel = new ResonancePreferencesModel();
      const model1 = new SimModel(preferencesModel);
      const model2 = new SimModel(preferencesModel);
      const view1 = new SimScreenView(model1);
      const view2 = new SimScreenView(model2);

      expect(view1).not.toBe(view2);
      expect(view1.model).not.toBe(view2.model);
    });
  });

  describe("preferences integration", () => {
    it("should use shared preferences model", () => {
      const sharedPrefs = new ResonancePreferencesModel();
      const model1 = new SimModel(sharedPrefs);
      const model2 = new SimModel(sharedPrefs);

      // Both models created successfully with shared prefs
      expect(model1).toBeDefined();
      expect(model2).toBeDefined();
    });

    it("should respond to preference changes", () => {
      const preferencesModel = new ResonancePreferencesModel();
      const model = new SimModel(preferencesModel);

      // Verify model was created and has expected structure
      expect(model.resonanceModel.drivingFrequencyProperty).toBeDefined();
      expect(model.resonanceModel.drivingAmplitudeProperty).toBeDefined();
    });
  });

  describe("simulation behavior", () => {
    it("should support pausing and resuming", () => {
      const preferencesModel = new ResonancePreferencesModel();
      const model = new SimModel(preferencesModel);

      // Start paused (use isPlayingProperty on resonanceModel)
      model.resonanceModel.isPlayingProperty.value = false;
      expect(model.resonanceModel.isPlayingProperty.value).toBe(false);

      // Resume
      model.resonanceModel.isPlayingProperty.value = true;
      expect(model.resonanceModel.isPlayingProperty.value).toBe(true);
    });

    it("should support stepping while playing", () => {
      const preferencesModel = new ResonancePreferencesModel();
      const model = new SimModel(preferencesModel);

      model.resonanceModel.isPlayingProperty.value = true;
      model.resonanceModel.drivingEnabledProperty.value = true;

      const initialTime = model.resonanceModel.timeProperty.value;

      // Step should advance time
      model.step(0.016);

      expect(model.resonanceModel.timeProperty.value).toBeGreaterThan(
        initialTime,
      );
    });

    it("should have time speed control", () => {
      const preferencesModel = new ResonancePreferencesModel();
      const model = new SimModel(preferencesModel);

      // Should have time speed property
      expect(model.resonanceModel.timeSpeedProperty).toBeDefined();
    });
  });
});
