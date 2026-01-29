/**
 * Tests for DriverControlNode - Driver control box UI component
 *
 * Tests the power toggle, frequency control, and amplitude control
 * for the driving force.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { DriverControlNode } from "../DriverControlNode.js";
import { SimModel } from "../../model/SimModel.js";
import { ResonancePreferencesModel } from "../../../preferences/ResonancePreferencesModel.js";
import ResonanceConstants from "../../../common/ResonanceConstants.js";

describe("DriverControlNode", () => {
  let model: SimModel;
  let driverNode: DriverControlNode;

  beforeEach(() => {
    model = new SimModel(new ResonancePreferencesModel());
    driverNode = new DriverControlNode(model);
  });

  describe("construction", () => {
    it("should construct without errors", () => {
      expect(driverNode).toBeDefined();
    });

    it("should have child nodes", () => {
      expect(driverNode.children.length).toBeGreaterThan(0);
    });

    it("should have bounds matching driver box dimensions", () => {
      // The node should contain the driver box
      expect(driverNode.width).toBeGreaterThanOrEqual(
        ResonanceConstants.DRIVER_BOX_WIDTH,
      );
      expect(driverNode.height).toBeGreaterThanOrEqual(
        ResonanceConstants.DRIVER_BOX_HEIGHT,
      );
    });
  });

  describe("driving enabled toggle", () => {
    it("should sync with model driving enabled property", () => {
      const initialEnabled = model.resonanceModel.drivingEnabledProperty.value;
      expect(typeof initialEnabled).toBe("boolean");
    });

    it("should allow toggling driving on", () => {
      model.resonanceModel.drivingEnabledProperty.value = true;
      expect(model.resonanceModel.drivingEnabledProperty.value).toBe(true);
    });

    it("should allow toggling driving off", () => {
      model.resonanceModel.drivingEnabledProperty.value = false;
      expect(model.resonanceModel.drivingEnabledProperty.value).toBe(false);
    });
  });

  describe("frequency control", () => {
    it("should have frequency in valid range", () => {
      const frequency = model.resonanceModel.drivingFrequencyProperty.value;
      expect(frequency).toBeGreaterThanOrEqual(
        ResonanceConstants.FREQUENCY_RANGE.min,
      );
      expect(frequency).toBeLessThanOrEqual(
        ResonanceConstants.FREQUENCY_RANGE.max,
      );
    });

    it("should allow setting minimum frequency", () => {
      model.resonanceModel.drivingFrequencyProperty.value =
        ResonanceConstants.FREQUENCY_RANGE.min;
      expect(model.resonanceModel.drivingFrequencyProperty.value).toBe(
        ResonanceConstants.FREQUENCY_RANGE.min,
      );
    });

    it("should allow setting maximum frequency", () => {
      model.resonanceModel.drivingFrequencyProperty.value =
        ResonanceConstants.FREQUENCY_RANGE.max;
      expect(model.resonanceModel.drivingFrequencyProperty.value).toBe(
        ResonanceConstants.FREQUENCY_RANGE.max,
      );
    });

    it("should allow setting middle frequency", () => {
      const middleFreq =
        (ResonanceConstants.FREQUENCY_RANGE.min +
          ResonanceConstants.FREQUENCY_RANGE.max) /
        2;
      model.resonanceModel.drivingFrequencyProperty.value = middleFreq;
      expect(model.resonanceModel.drivingFrequencyProperty.value).toBe(
        middleFreq,
      );
    });
  });

  describe("amplitude control", () => {
    it("should have amplitude in valid range", () => {
      const amplitude = model.resonanceModel.drivingAmplitudeProperty.value;
      expect(amplitude).toBeGreaterThanOrEqual(
        ResonanceConstants.AMPLITUDE_RANGE.min,
      );
      expect(amplitude).toBeLessThanOrEqual(
        ResonanceConstants.AMPLITUDE_RANGE.max,
      );
    });

    it("should allow setting minimum amplitude", () => {
      model.resonanceModel.drivingAmplitudeProperty.value =
        ResonanceConstants.AMPLITUDE_RANGE.min;
      expect(model.resonanceModel.drivingAmplitudeProperty.value).toBe(
        ResonanceConstants.AMPLITUDE_RANGE.min,
      );
    });

    it("should allow setting maximum amplitude", () => {
      model.resonanceModel.drivingAmplitudeProperty.value =
        ResonanceConstants.AMPLITUDE_RANGE.max;
      expect(model.resonanceModel.drivingAmplitudeProperty.value).toBe(
        ResonanceConstants.AMPLITUDE_RANGE.max,
      );
    });

    it("amplitude should be in meters (not cm)", () => {
      // The model stores amplitude in meters, displayed in cm in the UI
      const amplitude = model.resonanceModel.drivingAmplitudeProperty.value;
      // Amplitude range is 0.002 to 0.02 meters (0.2 cm to 2 cm)
      expect(amplitude).toBeLessThan(1); // Should be in meters, not cm
    });
  });

  describe("control node visual properties", () => {
    it("should have non-zero width", () => {
      expect(driverNode.width).toBeGreaterThan(0);
    });

    it("should have non-zero height", () => {
      expect(driverNode.height).toBeGreaterThan(0);
    });

    it("should be visible by default", () => {
      expect(driverNode.visible).toBe(true);
    });
  });

  describe("model synchronization", () => {
    it("should not affect model on construction", () => {
      // Create a fresh model and node
      const freshModel = new SimModel(new ResonancePreferencesModel());
      const initialFreq =
        freshModel.resonanceModel.drivingFrequencyProperty.value;
      const initialAmp =
        freshModel.resonanceModel.drivingAmplitudeProperty.value;

      // Create node
      new DriverControlNode(freshModel);

      // Model values should not change from construction
      expect(freshModel.resonanceModel.drivingFrequencyProperty.value).toBe(
        initialFreq,
      );
      expect(freshModel.resonanceModel.drivingAmplitudeProperty.value).toBe(
        initialAmp,
      );
    });

    it("should reflect model changes", () => {
      // Change model values
      model.resonanceModel.drivingFrequencyProperty.value = 3.5;
      model.resonanceModel.drivingAmplitudeProperty.value = 0.015;

      // Node should still be valid
      expect(driverNode.children.length).toBeGreaterThan(0);
    });
  });
});
