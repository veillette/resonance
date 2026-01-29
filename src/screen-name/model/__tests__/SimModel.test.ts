/**
 * Tests for SimModel - Multi-resonator configuration logic
 *
 * P1 Priority: Complex logic that determines how multiple oscillators are configured.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SimModel } from "../SimModel.js";
import { ResonatorConfigMode } from "../../../common/model/ResonatorConfigMode.js";
import { ResonancePreferencesModel } from "../../../preferences/ResonancePreferencesModel.js";

describe("SimModel", () => {
  let preferencesModel: ResonancePreferencesModel;
  let model: SimModel;

  beforeEach(() => {
    preferencesModel = new ResonancePreferencesModel();
    model = new SimModel(preferencesModel);
  });

  describe("initialization", () => {
    it("should initialize with default values", () => {
      expect(model.resonatorCountProperty.value).toBe(1);
      expect(model.selectedResonatorIndexProperty.value).toBe(0);
      expect(model.resonatorConfigProperty.value).toBe(
        ResonatorConfigMode.SAME_MASS,
      );
    });

    it("should create MAX_RESONATORS resonator models", () => {
      expect(model.resonatorModels.length).toBe(SimModel.MAX_RESONATORS);
    });

    it("should have resonanceModel as the first resonator model", () => {
      expect(model.resonatorModels[0]).toBe(model.resonanceModel);
    });
  });

  describe("SAME_MASS mode", () => {
    beforeEach(() => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_MASS;
      model.resonatorCountProperty.value = 10;
    });

    it("should distribute frequencies from 1 Hz to 5.5 Hz", () => {
      // First resonator should be at 1.0 Hz
      expect(model.getNaturalFrequencyHz(0)).toBeCloseTo(1.0, 1);

      // Last resonator should be at 5.5 Hz
      expect(model.getNaturalFrequencyHz(9)).toBeCloseTo(5.5, 1);
    });

    it("should keep all masses equal", () => {
      const masses = [];
      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        masses.push(model.getMass(i));
      }

      // All masses should be the same
      const uniqueMasses = new Set(masses);
      expect(uniqueMasses.size).toBe(1);
    });

    it("should vary spring constants to achieve target frequencies", () => {
      const springConstants = [];
      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        springConstants.push(model.getSpringConstant(i));
      }

      // Spring constants should increase (higher frequency = higher k for same mass)
      for (let i = 1; i < springConstants.length; i++) {
        expect(springConstants[i]).toBeGreaterThan(springConstants[i - 1]);
      }
    });

    it("should calculate spring constant from k = (2*pi*f)^2 * m", () => {
      const mass = model.getMass(0);
      const freq = model.getNaturalFrequencyHz(0);
      const k = model.getSpringConstant(0);

      const expectedK = Math.pow(2 * Math.PI * freq, 2) * mass;
      expect(k).toBeCloseTo(expectedK, 2);
    });

    it("should evenly distribute frequencies", () => {
      const frequencies = [];
      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        frequencies.push(model.getNaturalFrequencyHz(i));
      }

      // Check that frequency steps are approximately equal
      const steps = [];
      for (let i = 1; i < frequencies.length; i++) {
        steps.push(frequencies[i] - frequencies[i - 1]);
      }

      // All steps should be approximately equal (5.5 - 1.0) / 9 = 0.5 Hz
      const expectedStep = (5.5 - 1.0) / 9;
      for (const step of steps) {
        expect(step).toBeCloseTo(expectedStep, 1);
      }
    });
  });

  describe("SAME_SPRING_CONSTANT mode", () => {
    beforeEach(() => {
      model.resonatorConfigProperty.value =
        ResonatorConfigMode.SAME_SPRING_CONSTANT;
      model.resonatorCountProperty.value = 10;
    });

    it("should distribute frequencies from 1 Hz to 5.5 Hz", () => {
      expect(model.getNaturalFrequencyHz(0)).toBeCloseTo(1.0, 1);
      expect(model.getNaturalFrequencyHz(9)).toBeCloseTo(5.5, 1);
    });

    it("should keep all spring constants equal", () => {
      const springConstants = [];
      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        springConstants.push(model.getSpringConstant(i));
      }

      // All spring constants should be the same
      const uniqueK = new Set(springConstants);
      expect(uniqueK.size).toBe(1);
    });

    it("should vary masses to achieve target frequencies", () => {
      const masses = [];
      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        masses.push(model.getMass(i));
      }

      // Masses should decrease (higher frequency = lower mass for same k)
      for (let i = 1; i < masses.length; i++) {
        expect(masses[i]).toBeLessThan(masses[i - 1]);
      }
    });

    it("should calculate mass from m = k / (2*pi*f)^2", () => {
      const mass = model.getMass(0);
      const freq = model.getNaturalFrequencyHz(0);
      const k = model.getSpringConstant(0);

      const expectedMass = k / Math.pow(2 * Math.PI * freq, 2);
      expect(mass).toBeCloseTo(expectedMass, 2);
    });
  });

  describe("MIXED mode", () => {
    beforeEach(() => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.MIXED;
      model.resonatorCountProperty.value = 5;
    });

    it("should scale both mass and spring constant proportionally", () => {
      const baseMass = model.getMass(0);
      const baseK = model.getSpringConstant(0);

      for (let i = 1; i < model.resonatorCountProperty.value; i++) {
        const expectedMultiplier = i + 1;
        expect(model.getMass(i)).toBeCloseTo(baseMass * expectedMultiplier, 5);
        expect(model.getSpringConstant(i)).toBeCloseTo(
          baseK * expectedMultiplier,
          5,
        );
      }
    });

    it("should keep all natural frequencies equal", () => {
      const frequencies = [];
      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        frequencies.push(model.getNaturalFrequencyHz(i));
      }

      // All frequencies should be approximately equal
      const baseFreq = frequencies[0];
      for (const freq of frequencies) {
        expect(freq).toBeCloseTo(baseFreq, 3);
      }
    });
  });

  describe("SAME_FREQUENCY mode", () => {
    beforeEach(() => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_FREQUENCY;
      model.resonatorCountProperty.value = 5;
    });

    it("should behave same as MIXED mode (all frequencies equal)", () => {
      const frequencies = [];
      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        frequencies.push(model.getNaturalFrequencyHz(i));
      }

      // All frequencies should be approximately equal
      const baseFreq = frequencies[0];
      for (const freq of frequencies) {
        expect(freq).toBeCloseTo(baseFreq, 3);
      }
    });

    it("should scale both mass and spring constant proportionally", () => {
      const baseMass = model.getMass(0);
      const baseK = model.getSpringConstant(0);

      for (let i = 1; i < model.resonatorCountProperty.value; i++) {
        const expectedMultiplier = i + 1;
        expect(model.getMass(i)).toBeCloseTo(baseMass * expectedMultiplier, 5);
        expect(model.getSpringConstant(i)).toBeCloseTo(
          baseK * expectedMultiplier,
          5,
        );
      }
    });
  });

  describe("CUSTOM mode", () => {
    beforeEach(() => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.CUSTOM;
      model.resonatorCountProperty.value = 3;
    });

    it("should not modify parameters when base values change", () => {
      // Set some custom values on resonator 1
      const customMass = 2.5;
      const customK = 150;
      model.resonatorModels[1].massProperty.value = customMass;
      model.resonatorModels[1].springConstantProperty.value = customK;

      // Change base resonator parameters
      model.resonanceModel.massProperty.value = 5.0;
      model.resonanceModel.springConstantProperty.value = 500;

      // Custom values should be unchanged
      expect(model.getMass(1)).toBe(customMass);
      expect(model.getSpringConstant(1)).toBe(customK);
    });

    it("should allow independent custom values on each resonator", () => {
      // Set different values on each resonator
      model.resonatorModels[0].massProperty.value = 1.0;
      model.resonatorModels[0].springConstantProperty.value = 100;
      model.resonatorModels[1].massProperty.value = 2.0;
      model.resonatorModels[1].springConstantProperty.value = 200;
      model.resonatorModels[2].massProperty.value = 3.0;
      model.resonatorModels[2].springConstantProperty.value = 300;

      // Verify each has its own values
      expect(model.getMass(0)).toBe(1.0);
      expect(model.getSpringConstant(0)).toBe(100);
      expect(model.getMass(1)).toBe(2.0);
      expect(model.getSpringConstant(1)).toBe(200);
      expect(model.getMass(2)).toBe(3.0);
      expect(model.getSpringConstant(2)).toBe(300);

      // Verify frequencies are different (based on different m and k)
      const freq0 = model.getNaturalFrequencyHz(0);
      const freq1 = model.getNaturalFrequencyHz(1);
      const freq2 = model.getNaturalFrequencyHz(2);

      // f = (1/2π) * sqrt(k/m), so:
      // freq0 = sqrt(100/1) / 2π ≈ 1.59 Hz
      // freq1 = sqrt(200/2) / 2π = sqrt(100) / 2π ≈ 1.59 Hz (same ratio)
      // freq2 = sqrt(300/3) / 2π = sqrt(100) / 2π ≈ 1.59 Hz (same ratio)
      expect(freq0).toBeCloseTo(freq1, 2);
      expect(freq1).toBeCloseTo(freq2, 2);
    });

    it("should preserve custom values when resonator count changes", () => {
      // Set custom values
      model.resonatorModels[1].massProperty.value = 5.5;
      model.resonatorModels[1].springConstantProperty.value = 275;

      // Increase count
      model.resonatorCountProperty.value = 5;

      // Custom values should be preserved
      expect(model.getMass(1)).toBe(5.5);
      expect(model.getSpringConstant(1)).toBe(275);
    });

    it("should allow creating unique frequency distributions", () => {
      model.resonatorCountProperty.value = 4;

      // Set custom values for a non-uniform frequency distribution
      const frequencies = [1.0, 2.0, 4.0, 8.0]; // Exponential distribution

      for (let i = 0; i < 4; i++) {
        const targetFreq = frequencies[i];
        const omega = 2 * Math.PI * targetFreq;
        // Keep mass constant at 1, vary k
        model.resonatorModels[i].massProperty.value = 1.0;
        model.resonatorModels[i].springConstantProperty.value = omega * omega;
      }

      // Verify the frequencies match what we set
      for (let i = 0; i < 4; i++) {
        expect(model.getNaturalFrequencyHz(i)).toBeCloseTo(frequencies[i], 1);
      }
    });

    it("should not recalculate values when switching to CUSTOM mode", () => {
      // Start in SAME_MASS mode
      model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_MASS;
      model.resonatorCountProperty.value = 3;

      // Record current values
      const mass1 = model.getMass(1);
      const k1 = model.getSpringConstant(1);

      // Switch to CUSTOM mode
      model.resonatorConfigProperty.value = ResonatorConfigMode.CUSTOM;

      // Values should remain the same (CUSTOM doesn't recalculate)
      expect(model.getMass(1)).toBe(mass1);
      expect(model.getSpringConstant(1)).toBe(k1);
    });
  });

  describe("parameter synchronization", () => {
    beforeEach(() => {
      model.resonatorCountProperty.value = 3;
    });

    it("should sync driving enabled across all resonators", () => {
      model.resonanceModel.drivingEnabledProperty.value = false;

      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        expect(model.resonatorModels[i].drivingEnabledProperty.value).toBe(
          false,
        );
      }

      model.resonanceModel.drivingEnabledProperty.value = true;

      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        expect(model.resonatorModels[i].drivingEnabledProperty.value).toBe(
          true,
        );
      }
    });

    it("should sync driving frequency across all resonators", () => {
      const testFreq = 2.5;
      model.resonanceModel.drivingFrequencyProperty.value = testFreq;

      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        expect(model.resonatorModels[i].drivingFrequencyProperty.value).toBe(
          testFreq,
        );
      }
    });

    it("should sync driving amplitude across all resonators", () => {
      const testAmp = 0.5;
      model.resonanceModel.drivingAmplitudeProperty.value = testAmp;

      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        expect(model.resonatorModels[i].drivingAmplitudeProperty.value).toBe(
          testAmp,
        );
      }
    });

    it("should sync damping across all resonators", () => {
      const testDamping = 1.5;
      model.resonanceModel.dampingProperty.value = testDamping;

      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        expect(model.resonatorModels[i].dampingProperty.value).toBe(
          testDamping,
        );
      }
    });

    it("should sync gravity across all resonators", () => {
      const testGravity = 9.81;
      model.resonanceModel.gravityProperty.value = testGravity;

      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        expect(model.resonatorModels[i].gravityProperty.value).toBe(
          testGravity,
        );
      }
    });

    it("should sync isPlaying across all resonators", () => {
      model.resonanceModel.isPlayingProperty.value = false;

      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        expect(model.resonatorModels[i].isPlayingProperty.value).toBe(false);
      }
    });

    it("should sync timeSpeed across all resonators", () => {
      model.resonanceModel.timeSpeedProperty.value = "fast";

      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        expect(model.resonatorModels[i].timeSpeedProperty.value).toBe("fast");
      }
    });
  });

  describe("selection clamping", () => {
    it("should clamp selected index when resonator count decreases", () => {
      model.resonatorCountProperty.value = 5;
      model.selectedResonatorIndexProperty.value = 4; // Last one

      model.resonatorCountProperty.value = 3;

      // Should clamp to valid range [0, 2]
      expect(model.selectedResonatorIndexProperty.value).toBe(2);
    });

    it("should not change selected index when it is still valid", () => {
      model.resonatorCountProperty.value = 5;
      model.selectedResonatorIndexProperty.value = 1;

      model.resonatorCountProperty.value = 3;

      // Index 1 is still valid
      expect(model.selectedResonatorIndexProperty.value).toBe(1);
    });
  });

  describe("base parameter changes", () => {
    it("should recalculate other resonators when base mass changes in SAME_MASS mode", () => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_MASS;
      model.resonatorCountProperty.value = 3;

      const newMass = 2.0;
      model.resonanceModel.massProperty.value = newMass;

      // All masses should now equal the new mass
      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        expect(model.getMass(i)).toBe(newMass);
      }
    });

    it("should recalculate other resonators when base k changes in SAME_SPRING_CONSTANT mode", () => {
      model.resonatorConfigProperty.value =
        ResonatorConfigMode.SAME_SPRING_CONSTANT;
      model.resonatorCountProperty.value = 3;

      const newK = 300;
      model.resonanceModel.springConstantProperty.value = newK;

      // All spring constants should now equal the new k
      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        expect(model.getSpringConstant(i)).toBe(newK);
      }
    });
  });

  describe("step function", () => {
    it("should step all active resonators", () => {
      model.resonatorCountProperty.value = 3;

      // Set initial positions
      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        model.resonatorModels[i].positionProperty.value = 0.1;
        model.resonatorModels[i].velocityProperty.value = 0;
      }

      const initialTimes = model.resonatorModels
        .slice(0, 3)
        .map((m) => m.timeProperty.value);

      model.step(0.1);

      // All active resonators should have advanced
      for (let i = 0; i < model.resonatorCountProperty.value; i++) {
        expect(model.resonatorModels[i].timeProperty.value).toBeGreaterThan(
          initialTimes[i],
        );
      }
    });

    it("should not step inactive resonators", () => {
      model.resonatorCountProperty.value = 2;

      const inactiveTime = model.resonatorModels[5].timeProperty.value;

      model.step(0.1);

      // Inactive resonator should not have advanced
      expect(model.resonatorModels[5].timeProperty.value).toBe(inactiveTime);
    });
  });

  describe("reset", () => {
    it("should reset configuration mode to default", () => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.CUSTOM;

      model.reset();

      expect(model.resonatorConfigProperty.value).toBe(
        ResonatorConfigMode.SAME_MASS,
      );
    });

    it("should reset resonator count to default", () => {
      model.resonatorCountProperty.value = 5;

      model.reset();

      expect(model.resonatorCountProperty.value).toBe(1);
    });

    it("should reset selected index to default", () => {
      model.selectedResonatorIndexProperty.value = 3;

      model.reset();

      expect(model.selectedResonatorIndexProperty.value).toBe(0);
    });

    it("should reset all resonator models", () => {
      model.resonatorCountProperty.value = 3;

      // Modify some values
      for (let i = 0; i < 3; i++) {
        model.resonatorModels[i].positionProperty.value = 1.0;
        model.resonatorModels[i].velocityProperty.value = 2.0;
      }

      model.reset();

      // All positions and velocities should be back to default
      for (let i = 0; i < SimModel.MAX_RESONATORS; i++) {
        expect(model.resonatorModels[i].positionProperty.value).toBe(0);
        expect(model.resonatorModels[i].velocityProperty.value).toBe(0);
      }
    });
  });

  describe("frequency distribution with different counts", () => {
    it("should handle single resonator", () => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_MASS;
      model.resonatorCountProperty.value = 1;

      // Single resonator should have the base frequency
      expect(model.getNaturalFrequencyHz(0)).toBeCloseTo(1.0, 1);
    });

    it("should handle two resonators", () => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_MASS;
      model.resonatorCountProperty.value = 2;

      // Should be 1.0 Hz and 5.5 Hz
      expect(model.getNaturalFrequencyHz(0)).toBeCloseTo(1.0, 1);
      expect(model.getNaturalFrequencyHz(1)).toBeCloseTo(5.5, 1);
    });

    it("should handle five resonators", () => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_MASS;
      model.resonatorCountProperty.value = 5;

      // Should be evenly distributed: 1.0, 2.125, 3.25, 4.375, 5.5 Hz
      const expectedFreqs = [1.0, 2.125, 3.25, 4.375, 5.5];
      for (let i = 0; i < 5; i++) {
        expect(model.getNaturalFrequencyHz(i)).toBeCloseTo(expectedFreqs[i], 1);
      }
    });
  });

  describe("config mode switching", () => {
    it("should recalculate parameters when switching from SAME_MASS to SAME_SPRING_CONSTANT", () => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_MASS;
      model.resonatorCountProperty.value = 3;

      // In SAME_MASS mode, masses should be equal
      const massBefore = model.getMass(1);
      expect(model.getMass(0)).toBe(massBefore);
      expect(model.getMass(1)).toBe(massBefore);

      // Switch to SAME_SPRING_CONSTANT
      model.resonatorConfigProperty.value =
        ResonatorConfigMode.SAME_SPRING_CONSTANT;

      // Now spring constants should be equal
      const kAfter = model.getSpringConstant(0);
      expect(model.getSpringConstant(1)).toBe(kAfter);
      expect(model.getSpringConstant(2)).toBe(kAfter);

      // But masses should differ (to achieve different frequencies)
      expect(model.getMass(1)).not.toBe(model.getMass(0));
    });

    it("should preserve frequency distribution when switching between modes", () => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_MASS;
      model.resonatorCountProperty.value = 5;

      // Get frequencies in SAME_MASS mode
      const freqsSameMass = [];
      for (let i = 0; i < 5; i++) {
        freqsSameMass.push(model.getNaturalFrequencyHz(i));
      }

      // Switch to SAME_SPRING_CONSTANT
      model.resonatorConfigProperty.value =
        ResonatorConfigMode.SAME_SPRING_CONSTANT;

      // Frequencies should still follow the same distribution pattern
      // (1 Hz to 5.5 Hz evenly distributed)
      for (let i = 0; i < 5; i++) {
        expect(model.getNaturalFrequencyHz(i)).toBeCloseTo(freqsSameMass[i], 0);
      }
    });

    it("should update parameters when switching from CUSTOM to preset mode", () => {
      // Start in CUSTOM mode with arbitrary values
      model.resonatorConfigProperty.value = ResonatorConfigMode.CUSTOM;
      model.resonatorCountProperty.value = 3;
      model.resonatorModels[1].massProperty.value = 999;
      model.resonatorModels[1].springConstantProperty.value = 888;

      // Switch to SAME_MASS mode
      model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_MASS;

      // Values should be recalculated (no longer 999/888)
      expect(model.getMass(1)).not.toBe(999);
      // Mass should match base mass in SAME_MASS mode
      expect(model.getMass(1)).toBe(model.getMass(0));
    });

    it("should switch from MIXED to SAME_MASS correctly", () => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.MIXED;
      model.resonatorCountProperty.value = 4;

      // In MIXED mode, all frequencies should be equal
      const baseFreq = model.getNaturalFrequencyHz(0);
      for (let i = 1; i < 4; i++) {
        expect(model.getNaturalFrequencyHz(i)).toBeCloseTo(baseFreq, 2);
      }

      // Switch to SAME_MASS mode
      model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_MASS;

      // Now frequencies should be distributed from 1 Hz to 5.5 Hz
      expect(model.getNaturalFrequencyHz(0)).toBeCloseTo(1.0, 1);
      expect(model.getNaturalFrequencyHz(3)).toBeCloseTo(5.5, 1);
    });
  });

  describe("edge cases and boundary conditions", () => {
    it("should handle MAX_RESONATORS correctly", () => {
      model.resonatorCountProperty.value = SimModel.MAX_RESONATORS;
      model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_MASS;

      // All 10 resonators should have valid parameters
      for (let i = 0; i < SimModel.MAX_RESONATORS; i++) {
        expect(model.getMass(i)).toBeGreaterThan(0);
        expect(model.getSpringConstant(i)).toBeGreaterThan(0);
        expect(model.getNaturalFrequencyHz(i)).toBeGreaterThan(0);
        expect(model.getNaturalFrequencyHz(i)).toBeLessThan(Infinity);
      }
    });

    it("should correctly distribute frequencies across MAX_RESONATORS", () => {
      model.resonatorCountProperty.value = SimModel.MAX_RESONATORS;
      model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_MASS;

      // First should be 1 Hz, last should be 5.5 Hz
      expect(model.getNaturalFrequencyHz(0)).toBeCloseTo(1.0, 1);
      expect(
        model.getNaturalFrequencyHz(SimModel.MAX_RESONATORS - 1),
      ).toBeCloseTo(5.5, 1);

      // Frequencies should be monotonically increasing
      for (let i = 1; i < SimModel.MAX_RESONATORS; i++) {
        expect(model.getNaturalFrequencyHz(i)).toBeGreaterThan(
          model.getNaturalFrequencyHz(i - 1),
        );
      }
    });

    it("should clamp selected index to 0 when count becomes 1", () => {
      model.resonatorCountProperty.value = 5;
      model.selectedResonatorIndexProperty.value = 4;

      model.resonatorCountProperty.value = 1;

      expect(model.selectedResonatorIndexProperty.value).toBe(0);
    });

    it("should handle rapid mode changes without errors", () => {
      model.resonatorCountProperty.value = 5;

      // Rapidly switch between modes
      expect(() => {
        for (let i = 0; i < 10; i++) {
          model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_MASS;
          model.resonatorConfigProperty.value =
            ResonatorConfigMode.SAME_SPRING_CONSTANT;
          model.resonatorConfigProperty.value = ResonatorConfigMode.MIXED;
          model.resonatorConfigProperty.value =
            ResonatorConfigMode.SAME_FREQUENCY;
          model.resonatorConfigProperty.value = ResonatorConfigMode.CUSTOM;
        }
      }).not.toThrow();

      // Model should still be in valid state
      expect(model.getMass(0)).toBeGreaterThan(0);
    });

    it("should handle simultaneous count and mode changes", () => {
      // Change both at once
      model.resonatorCountProperty.value = 7;
      model.resonatorConfigProperty.value =
        ResonatorConfigMode.SAME_SPRING_CONSTANT;

      // Should be valid
      for (let i = 0; i < 7; i++) {
        expect(model.getSpringConstant(i)).toBe(model.getSpringConstant(0));
      }
    });

    it("should maintain valid state after reset", () => {
      // Modify everything
      model.resonatorCountProperty.value = 8;
      model.resonatorConfigProperty.value = ResonatorConfigMode.CUSTOM;
      model.selectedResonatorIndexProperty.value = 5;
      model.resonatorModels[3].massProperty.value = 123;

      model.reset();

      // Check all defaults are restored
      expect(model.resonatorCountProperty.value).toBe(1);
      expect(model.resonatorConfigProperty.value).toBe(
        ResonatorConfigMode.SAME_MASS,
      );
      expect(model.selectedResonatorIndexProperty.value).toBe(0);

      // Base resonator should have default values
      expect(model.resonanceModel.massProperty.value).toBe(0.25);
      expect(model.resonanceModel.springConstantProperty.value).toBe(100);
    });
  });

  describe("physics relationship verification", () => {
    it("should satisfy f = (1/2π) * sqrt(k/m) for all resonators in SAME_MASS mode", () => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_MASS;
      model.resonatorCountProperty.value = 5;

      for (let i = 0; i < 5; i++) {
        const m = model.getMass(i);
        const k = model.getSpringConstant(i);
        const expectedFreq = (1 / (2 * Math.PI)) * Math.sqrt(k / m);
        const actualFreq = model.getNaturalFrequencyHz(i);

        expect(actualFreq).toBeCloseTo(expectedFreq, 5);
      }
    });

    it("should satisfy f = (1/2π) * sqrt(k/m) for all resonators in SAME_SPRING_CONSTANT mode", () => {
      model.resonatorConfigProperty.value =
        ResonatorConfigMode.SAME_SPRING_CONSTANT;
      model.resonatorCountProperty.value = 5;

      for (let i = 0; i < 5; i++) {
        const m = model.getMass(i);
        const k = model.getSpringConstant(i);
        const expectedFreq = (1 / (2 * Math.PI)) * Math.sqrt(k / m);
        const actualFreq = model.getNaturalFrequencyHz(i);

        expect(actualFreq).toBeCloseTo(expectedFreq, 5);
      }
    });

    it("should maintain constant k/m ratio in MIXED mode", () => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.MIXED;
      model.resonatorCountProperty.value = 5;

      const baseRatio = model.getSpringConstant(0) / model.getMass(0);

      for (let i = 1; i < 5; i++) {
        const ratio = model.getSpringConstant(i) / model.getMass(i);
        expect(ratio).toBeCloseTo(baseRatio, 5);
      }
    });

    it("should have increasing spring constants in SAME_MASS mode", () => {
      model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_MASS;
      model.resonatorCountProperty.value = 5;

      for (let i = 1; i < 5; i++) {
        expect(model.getSpringConstant(i)).toBeGreaterThan(
          model.getSpringConstant(i - 1),
        );
      }
    });

    it("should have decreasing masses in SAME_SPRING_CONSTANT mode", () => {
      model.resonatorConfigProperty.value =
        ResonatorConfigMode.SAME_SPRING_CONSTANT;
      model.resonatorCountProperty.value = 5;

      for (let i = 1; i < 5; i++) {
        expect(model.getMass(i)).toBeLessThan(model.getMass(i - 1));
      }
    });
  });
});
