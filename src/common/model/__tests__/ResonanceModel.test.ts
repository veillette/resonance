/**
 * Tests for ResonanceModel - Core physics calculations
 *
 * P0 Priority: These tests verify the heart of the simulation.
 * Physics calculation errors would make the entire application incorrect.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Property } from "scenerystack/axon";
import { ResonanceModel, ResonancePresets } from "../ResonanceModel.js";
import { SolverType } from "../SolverType.js";

// Mock preferences model for testing
function createMockPreferences() {
  return {
    solverTypeProperty: new Property<SolverType>(SolverType.RUNGE_KUTTA_4),
  };
}

describe("ResonanceModel", () => {
  let model: ResonanceModel;

  beforeEach(() => {
    model = new ResonanceModel(createMockPreferences());
  });

  describe("natural frequency", () => {
    it("should calculate omega_0 = sqrt(k/m) for default values", () => {
      // Default: k=100, m=0.25 -> omega_0 = sqrt(100/0.25) = 20 rad/s
      expect(model.naturalFrequencyProperty.value).toBeCloseTo(20, 5);
    });

    it("should convert to Hz correctly: f_0 = omega_0/(2*pi)", () => {
      // omega_0 = 20 rad/s -> f_0 = 20/(2*pi) ≈ 3.183 Hz
      const expectedHz = 20 / (2 * Math.PI);
      expect(model.naturalFrequencyHzProperty.value).toBeCloseTo(expectedHz, 4);
    });

    it("should update when mass changes", () => {
      model.massProperty.value = 1.0; // k=100, m=1.0 -> omega_0 = 10 rad/s
      expect(model.naturalFrequencyProperty.value).toBeCloseTo(10, 5);
    });

    it("should update when spring constant changes", () => {
      model.springConstantProperty.value = 25; // k=25, m=0.25 -> omega_0 = 10 rad/s
      expect(model.naturalFrequencyProperty.value).toBeCloseTo(10, 5);
    });

    it("should scale correctly for arbitrary values", () => {
      model.massProperty.value = 2.0;
      model.springConstantProperty.value = 50.0;
      // omega_0 = sqrt(50/2) = sqrt(25) = 5 rad/s
      expect(model.naturalFrequencyProperty.value).toBeCloseTo(5, 5);
    });
  });

  describe("damping ratio", () => {
    it("should calculate zeta = b/(2*sqrt(m*k))", () => {
      // Default: b=0.5, m=0.25, k=100 -> zeta = 0.5/(2*sqrt(25)) = 0.5/10 = 0.05
      expect(model.dampingRatioProperty.value).toBeCloseTo(0.05, 5);
    });

    it("should identify underdamped (zeta < 1)", () => {
      model.dampingProperty.value = 0.5;
      expect(model.dampingRatioProperty.value).toBeLessThan(1);
    });

    it("should identify critically damped (zeta = 1)", () => {
      // For critical damping: b = 2*sqrt(m*k)
      // With m=0.25, k=100: b = 2*sqrt(25) = 10
      model.dampingProperty.value = 10.0;
      expect(model.dampingRatioProperty.value).toBeCloseTo(1.0, 5);
    });

    it("should identify overdamped (zeta > 1)", () => {
      model.dampingProperty.value = 20.0;
      expect(model.dampingRatioProperty.value).toBeGreaterThan(1);
    });

    it("should be zero for undamped system", () => {
      model.dampingProperty.value = 0;
      expect(model.dampingRatioProperty.value).toBe(0);
    });
  });

  describe("kinetic energy", () => {
    it("should calculate KE = 0.5 * m * v^2", () => {
      model.velocityProperty.value = 2.0; // m=0.25, v=2 -> KE = 0.5*0.25*4 = 0.5 J
      expect(model.kineticEnergyProperty.value).toBeCloseTo(0.5, 5);
    });

    it("should be zero when velocity is zero", () => {
      model.velocityProperty.value = 0;
      expect(model.kineticEnergyProperty.value).toBe(0);
    });

    it("should be positive for negative velocity", () => {
      model.velocityProperty.value = -3.0;
      expect(model.kineticEnergyProperty.value).toBeGreaterThan(0);
    });

    it("should scale with mass", () => {
      model.velocityProperty.value = 2.0;
      const ke1 = model.kineticEnergyProperty.value;

      model.massProperty.value = 0.5; // Double the mass
      const ke2 = model.kineticEnergyProperty.value;

      expect(ke2).toBeCloseTo(ke1 * 2, 5);
    });
  });

  describe("potential energy", () => {
    it("should calculate PE = 0.5 * k * x^2 for no gravity", () => {
      model.gravityProperty.value = 0;
      model.positionProperty.value = 0.1; // k=100, x=0.1 -> PE = 0.5*100*0.01 = 0.5 J
      expect(model.potentialEnergyProperty.value).toBeCloseTo(0.5, 5);
    });

    it("should be zero at equilibrium with no gravity", () => {
      model.gravityProperty.value = 0;
      model.positionProperty.value = 0;
      expect(model.potentialEnergyProperty.value).toBe(0);
    });

    it("should include gravitational potential: PE = 0.5*k*x^2 - m*g*x", () => {
      model.gravityProperty.value = 10;
      model.positionProperty.value = 0.1;
      // PE = 0.5*100*0.01 - 0.25*10*0.1 = 0.5 - 0.25 = 0.25 J
      expect(model.potentialEnergyProperty.value).toBeCloseTo(0.25, 5);
    });
  });

  describe("total energy", () => {
    it("should equal KE + PE", () => {
      model.positionProperty.value = 0.1;
      model.velocityProperty.value = 1.0;

      const ke = model.kineticEnergyProperty.value;
      const pe = model.potentialEnergyProperty.value;
      const total = model.totalEnergyProperty.value;

      expect(total).toBeCloseTo(ke + pe, 10);
    });
  });

  describe("energy conservation", () => {
    it("should conserve total energy when b=0, no driving, and no gravity", () => {
      // Set up undamped, undriven oscillator
      model.dampingProperty.value = 0;
      model.drivingEnabledProperty.value = false;
      model.gravityProperty.value = 0;
      model.positionProperty.value = 0.1; // Initial displacement
      model.velocityProperty.value = 0;

      const initialEnergy = model.totalEnergyProperty.value;

      // Step simulation for several periods
      const period = (2 * Math.PI) / model.naturalFrequencyProperty.value;
      const numSteps = 1000;
      const dt = (5 * period) / numSteps;

      for (let i = 0; i < numSteps; i++) {
        model.step(dt, true);
      }

      const finalEnergy = model.totalEnergyProperty.value;

      // Energy should be conserved within 0.1%
      const energyChange =
        Math.abs(finalEnergy - initialEnergy) / initialEnergy;
      expect(energyChange).toBeLessThan(0.001);
    });

    it("should lose energy when damping is present", () => {
      // Set up damped, undriven oscillator
      model.dampingProperty.value = 1.0;
      model.drivingEnabledProperty.value = false;
      model.gravityProperty.value = 0;
      model.positionProperty.value = 0.1;
      model.velocityProperty.value = 0;

      const initialEnergy = model.totalEnergyProperty.value;

      // Step simulation
      for (let i = 0; i < 1000; i++) {
        model.step(0.01, true);
      }

      const finalEnergy = model.totalEnergyProperty.value;

      // Energy should decrease
      expect(finalEnergy).toBeLessThan(initialEnergy);
    });
  });

  describe("phase angle at resonance", () => {
    it("should be pi/2 when driving at natural frequency", () => {
      // Set driving frequency to natural frequency
      model.drivingFrequencyProperty.value =
        model.naturalFrequencyHzProperty.value;
      model.drivingEnabledProperty.value = true;

      // At resonance, phase should be pi/2
      expect(model.phaseAngleProperty.value).toBeCloseTo(Math.PI / 2, 2);
    });

    it("should be 0 when driving is disabled", () => {
      model.drivingEnabledProperty.value = false;
      expect(model.phaseAngleProperty.value).toBe(0);
    });

    it("should be positive when driving below natural frequency", () => {
      const naturalFreq = model.naturalFrequencyHzProperty.value;
      model.drivingFrequencyProperty.value = naturalFreq * 0.5;
      model.drivingEnabledProperty.value = true;

      // Below resonance, phase is positive (between 0 and pi/2)
      expect(model.phaseAngleProperty.value).toBeGreaterThan(0);
      expect(model.phaseAngleProperty.value).toBeLessThan(Math.PI / 2);
    });

    it("should be negative when driving above natural frequency", () => {
      const naturalFreq = model.naturalFrequencyHzProperty.value;
      model.drivingFrequencyProperty.value = naturalFreq * 2;
      model.drivingEnabledProperty.value = true;

      // Above resonance, phase is negative
      expect(model.phaseAngleProperty.value).toBeLessThan(0);
    });
  });

  describe("state get/set roundtrip", () => {
    it("should preserve state through getState/setState", () => {
      model.positionProperty.value = 0.123;
      model.velocityProperty.value = -0.456;
      model.drivingPhaseProperty.value = 1.234;

      const state = model.getState();

      // Change values
      model.positionProperty.value = 0;
      model.velocityProperty.value = 0;
      model.drivingPhaseProperty.value = 0;

      // Restore
      model.setState(state);

      expect(model.positionProperty.value).toBeCloseTo(0.123, 10);
      expect(model.velocityProperty.value).toBeCloseTo(-0.456, 10);
      expect(model.drivingPhaseProperty.value).toBeCloseTo(1.234, 10);
    });

    it("should return state vector in correct order", () => {
      model.positionProperty.value = 1.0;
      model.velocityProperty.value = 2.0;
      model.drivingPhaseProperty.value = 3.0;

      const state = model.getState();

      expect(state).toHaveLength(3);
      expect(state[0]).toBe(1.0); // position
      expect(state[1]).toBe(2.0); // velocity
      expect(state[2]).toBe(3.0); // driving phase
    });
  });

  describe("derivatives calculation", () => {
    it("should return velocity as first derivative (dx/dt = v)", () => {
      const state = [0.1, 2.0, 0]; // position=0.1, velocity=2.0
      const derivatives = model.getDerivatives(0, state);

      expect(derivatives[0]).toBe(2.0); // dx/dt = v
    });

    it("should calculate spring force correctly: F_spring = -k*x", () => {
      model.dampingProperty.value = 0;
      model.gravityProperty.value = 0;
      model.drivingEnabledProperty.value = false;

      const state = [0.1, 0, 0]; // position=0.1, velocity=0
      const derivatives = model.getDerivatives(0, state);

      // a = -k*x/m = -100*0.1/0.25 = -40 m/s^2
      expect(derivatives[1]).toBeCloseTo(-40, 5);
    });

    it("should calculate damping force correctly: F_damp = -b*v", () => {
      model.springConstantProperty.value = 0;
      model.gravityProperty.value = 0;
      model.drivingEnabledProperty.value = false;
      model.dampingProperty.value = 2.0;

      const state = [0, 1.0, 0]; // position=0, velocity=1.0
      const derivatives = model.getDerivatives(0, state);

      // a = -b*v/m = -2.0*1.0/0.25 = -8 m/s^2
      expect(derivatives[1]).toBeCloseTo(-8, 5);
    });

    it("should calculate gravitational force correctly: F_grav = m*g", () => {
      model.springConstantProperty.value = 0;
      model.dampingProperty.value = 0;
      model.drivingEnabledProperty.value = false;
      model.gravityProperty.value = 10;

      const state = [0, 0, 0];
      const derivatives = model.getDerivatives(0, state);

      // a = g = 10 m/s^2
      expect(derivatives[1]).toBeCloseTo(10, 5);
    });

    it("should calculate driving force correctly when enabled", () => {
      // For displacement-driven oscillator: F_drive = k * A * sin(phase)
      model.springConstantProperty.value = 1.0; // k = 1 N/m
      model.dampingProperty.value = 0;
      model.gravityProperty.value = 0;
      model.drivingEnabledProperty.value = true;
      model.drivingAmplitudeProperty.value = 1.0; // A = 1 m
      model.drivingFrequencyProperty.value = 1.0;

      // At phase = pi/2, sin(phase) = 1
      const state = [0, 0, Math.PI / 2];
      const derivatives = model.getDerivatives(0, state);

      // F_drive = k * A * sin(phase) = 1 * 1 * 1 = 1 N
      // a = F_drive / m = 1 / 0.25 = 4 m/s^2
      expect(derivatives[1]).toBeCloseTo(4, 5);
    });

    it("should not apply driving force when disabled", () => {
      model.springConstantProperty.value = 0;
      model.dampingProperty.value = 0;
      model.gravityProperty.value = 0;
      model.drivingEnabledProperty.value = false;
      model.drivingAmplitudeProperty.value = 1.0;

      const state = [0, 0, Math.PI / 2];
      const derivatives = model.getDerivatives(0, state);

      expect(derivatives[1]).toBe(0);
    });

    it("should update phase derivative based on driving frequency", () => {
      model.drivingEnabledProperty.value = true;
      model.drivingFrequencyProperty.value = 2.0; // 2 Hz

      const state = [0, 0, 0];
      const derivatives = model.getDerivatives(0, state);

      // dphase/dt = omega = 2*pi*f = 2*pi*2 ≈ 12.566 rad/s
      expect(derivatives[2]).toBeCloseTo(2 * Math.PI * 2, 5);
    });
  });

  describe("reset functionality", () => {
    it("should reset position and velocity to defaults", () => {
      model.positionProperty.value = 1.0;
      model.velocityProperty.value = 2.0;

      model.reset();

      expect(model.positionProperty.value).toBe(0.0);
      expect(model.velocityProperty.value).toBe(0.0);
    });

    it("should reset physical parameters to defaults", () => {
      model.massProperty.value = 5.0;
      model.springConstantProperty.value = 200.0;
      model.dampingProperty.value = 10.0;

      model.reset();

      expect(model.massProperty.value).toBe(0.25);
      expect(model.springConstantProperty.value).toBe(100.0);
      expect(model.dampingProperty.value).toBe(0.5);
    });

    it("should reset driving parameters to defaults", () => {
      model.drivingAmplitudeProperty.value = 10.0;
      model.drivingFrequencyProperty.value = 5.0;
      model.drivingEnabledProperty.value = false;
      model.drivingPhaseProperty.value = 3.14;

      model.reset();

      expect(model.drivingAmplitudeProperty.value).toBe(0.01);
      expect(model.drivingFrequencyProperty.value).toBe(1.0);
      expect(model.drivingEnabledProperty.value).toBe(true);
      expect(model.drivingPhaseProperty.value).toBe(0.0);
    });

    it("should reset time to zero", () => {
      model.step(1.0, true);
      expect(model.timeProperty.value).toBeGreaterThan(0);

      model.reset();

      expect(model.timeProperty.value).toBe(0);
    });
  });

  describe("preset application", () => {
    it("should apply preset values correctly", () => {
      const preset = ResonancePresets[0]!; // Light and Bouncy

      model.setPreset(preset);

      expect(model.massProperty.value).toBe(preset.mass);
      expect(model.springConstantProperty.value).toBe(preset.springConstant);
      expect(model.dampingProperty.value).toBe(preset.damping);
      expect(model.positionProperty.value).toBe(preset.initialPosition);
    });

    it("should apply all available presets without error", () => {
      for (const preset of ResonancePresets) {
        expect(() => model.setPreset(preset)).not.toThrow();

        // Verify natural frequency is calculable (no division by zero, etc.)
        expect(model.naturalFrequencyProperty.value).toBeGreaterThan(0);
        expect(model.naturalFrequencyProperty.value).toBeLessThan(Infinity);
      }
    });

    it("should use default values for optional preset fields", () => {
      const minimalPreset = {
        nameKey: "underdamped" as const,
        mass: 1.0,
        springConstant: 10.0,
        damping: 0.5,
        initialPosition: 0.5,
      };

      model.setPreset(minimalPreset);

      expect(model.massProperty.value).toBe(1.0);
      expect(model.velocityProperty.value).toBe(0); // Default when not specified
    });
  });

  describe("simulation behavior", () => {
    it("should oscillate when displaced from equilibrium", () => {
      model.dampingProperty.value = 0;
      model.drivingEnabledProperty.value = false;
      model.gravityProperty.value = 0;
      model.positionProperty.value = 0.1;
      model.velocityProperty.value = 0;

      // Track max and min positions during simulation
      let maxPos = model.positionProperty.value;
      let minPos = model.positionProperty.value;

      for (let i = 0; i < 1000; i++) {
        model.step(0.001, true);
        maxPos = Math.max(maxPos, model.positionProperty.value);
        minPos = Math.min(minPos, model.positionProperty.value);
      }

      // Should oscillate around equilibrium
      expect(maxPos).toBeGreaterThan(0.05);
      expect(minPos).toBeLessThan(-0.05);
    });

    it("should demonstrate resonance behavior when driving at natural frequency", () => {
      // Light damping for clear resonance
      model.dampingProperty.value = 0.5;
      model.gravityProperty.value = 0;
      model.positionProperty.value = 0;
      model.velocityProperty.value = 0;
      model.drivingEnabledProperty.value = true;
      model.drivingAmplitudeProperty.value = 1.0;
      model.drivingFrequencyProperty.value =
        model.naturalFrequencyHzProperty.value;

      // Track amplitude
      let maxAmplitude = 0;

      for (let i = 0; i < 5000; i++) {
        model.step(0.001, true);
        maxAmplitude = Math.max(
          maxAmplitude,
          Math.abs(model.positionProperty.value),
        );
      }

      // At resonance, amplitude should build up significantly
      expect(maxAmplitude).toBeGreaterThan(0.01);
    });

    it("should have smaller amplitude when driving off resonance", () => {
      // Light damping
      model.dampingProperty.value = 0.5;
      model.gravityProperty.value = 0;
      model.positionProperty.value = 0;
      model.velocityProperty.value = 0;
      model.drivingEnabledProperty.value = true;
      model.drivingAmplitudeProperty.value = 1.0;

      // First, measure amplitude at resonance
      model.drivingFrequencyProperty.value =
        model.naturalFrequencyHzProperty.value;
      let maxAtResonance = 0;
      for (let i = 0; i < 3000; i++) {
        model.step(0.001, true);
        maxAtResonance = Math.max(
          maxAtResonance,
          Math.abs(model.positionProperty.value),
        );
      }

      // Reset and measure off-resonance
      model.reset();
      model.dampingProperty.value = 0.5;
      model.drivingEnabledProperty.value = true;
      model.drivingAmplitudeProperty.value = 1.0;
      model.drivingFrequencyProperty.value =
        model.naturalFrequencyHzProperty.value * 3; // Far from resonance

      let maxOffResonance = 0;
      for (let i = 0; i < 3000; i++) {
        model.step(0.001, true);
        maxOffResonance = Math.max(
          maxOffResonance,
          Math.abs(model.positionProperty.value),
        );
      }

      // Off-resonance amplitude should be smaller
      expect(maxOffResonance).toBeLessThan(maxAtResonance);
    });
  });
});
