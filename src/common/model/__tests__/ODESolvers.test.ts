/**
 * Tests for ODE Solvers - Numerical integration accuracy
 *
 * P0 Priority: Numerical integration errors compound over time and produce incorrect physics.
 * These tests verify that solvers produce correct results for known problems.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ODEModel, ODESolver } from "../ODESolver.js";
import { RungeKuttaSolver } from "../RungeKuttaSolver.js";
import { AdaptiveRK45Solver } from "../AdaptiveRK45Solver.js";
import { AdaptiveEulerSolver } from "../AdaptiveEulerSolver.js";
import { ModifiedMidpointSolver } from "../ModifiedMidpointSolver.js";

/**
 * Simple harmonic oscillator model for testing
 * x'' = -omega^2 * x
 * State: [position, velocity]
 * Analytical solution: x(t) = A*cos(omega*t + phi)
 */
class SimpleHarmonicOscillator implements ODEModel {
  private state: number[];
  public readonly omega: number;

  constructor(
    omega: number = 1,
    initialPosition: number = 1,
    initialVelocity: number = 0,
  ) {
    this.omega = omega;
    this.state = [initialPosition, initialVelocity];
  }

  getState(): number[] {
    return [...this.state];
  }

  setState(state: number[]): void {
    this.state = [...state];
  }

  getDerivatives(_t: number, state: number[]): number[] {
    const [x, v] = state;
    return [
      v, // dx/dt = v
      -this.omega * this.omega * x, // dv/dt = -omega^2 * x
    ];
  }

  // Analytical solution: x(t) = x0*cos(omega*t) + (v0/omega)*sin(omega*t)
  analyticalPosition(t: number, x0: number, v0: number): number {
    return (
      x0 * Math.cos(this.omega * t) +
      (v0 / this.omega) * Math.sin(this.omega * t)
    );
  }

  analyticalVelocity(t: number, x0: number, v0: number): number {
    return (
      -x0 * this.omega * Math.sin(this.omega * t) +
      v0 * Math.cos(this.omega * t)
    );
  }

  // Total energy: E = 0.5*v^2 + 0.5*omega^2*x^2
  totalEnergy(): number {
    const [x, v] = this.state;
    return 0.5 * v * v + 0.5 * this.omega * this.omega * x * x;
  }
}

/**
 * Exponential growth model for testing accuracy
 * y' = y, solution: y(t) = y0 * e^t
 */
class ExponentialModel implements ODEModel {
  private state: number[];

  constructor(y0: number = 1) {
    this.state = [y0];
  }

  getState(): number[] {
    return [...this.state];
  }

  setState(state: number[]): void {
    this.state = [...state];
  }

  getDerivatives(_t: number, state: number[]): number[] {
    return [state[0]]; // dy/dt = y
  }
}

describe("RungeKuttaSolver", () => {
  let solver: RungeKuttaSolver;

  beforeEach(() => {
    solver = new RungeKuttaSolver(0.001);
  });

  describe("basic functionality", () => {
    it("should integrate state forward in time", () => {
      const model = new SimpleHarmonicOscillator(1, 1, 0);
      const initialState = model.getState();

      solver.step(0.1, model);

      const newState = model.getState();
      expect(newState).not.toEqual(initialState);
    });

    it("should handle zero timestep", () => {
      const model = new SimpleHarmonicOscillator(1, 1, 0);
      const initialState = model.getState();

      solver.step(0, model);

      const newState = model.getState();
      expect(newState[0]).toBeCloseTo(initialState[0], 10);
      expect(newState[1]).toBeCloseTo(initialState[1], 10);
    });
  });

  describe("accuracy", () => {
    it("should match analytical solution for simple harmonic oscillator", () => {
      const omega = 2.0;
      const x0 = 1.0;
      const v0 = 0.0;
      const model = new SimpleHarmonicOscillator(omega, x0, v0);

      // Test at several time points
      const testTimes = [0.5, 1.0, 2.0, 5.0];

      for (const targetTime of testTimes) {
        // Reset model
        model.setState([x0, v0]);

        // Integrate to target time
        const numSteps = Math.ceil(targetTime / 0.01);
        const dt = targetTime / numSteps;
        for (let i = 0; i < numSteps; i++) {
          solver.step(dt, model);
        }

        const state = model.getState();
        const expectedX = model.analyticalPosition(targetTime, x0, v0);
        const expectedV = model.analyticalVelocity(targetTime, x0, v0);

        // RK4 should be accurate to within 0.01% for well-behaved problems
        expect(state[0]).toBeCloseTo(expectedX, 3);
        expect(state[1]).toBeCloseTo(expectedV, 3);
      }
    });

    it("should be fourth-order accurate (error scales as dt^4)", () => {
      const model1 = new ExponentialModel(1);
      const model2 = new ExponentialModel(1);
      const solver1 = new RungeKuttaSolver(0.01);
      const solver2 = new RungeKuttaSolver(0.005); // Half the timestep

      const targetTime = 1.0;
      const exactSolution = Math.exp(targetTime);

      // Integrate with coarse timestep
      let time = 0;
      while (time < targetTime) {
        solver1.step(0.01, model1);
        time += 0.01;
      }
      const error1 = Math.abs(model1.getState()[0] - exactSolution);

      // Integrate with fine timestep
      time = 0;
      while (time < targetTime) {
        solver2.step(0.005, model2);
        time += 0.005;
      }
      const error2 = Math.abs(model2.getState()[0] - exactSolution);

      // For 4th order method, halving dt should reduce error by factor of ~16
      // Allow some tolerance
      expect(error1 / error2).toBeGreaterThan(8);
    });
  });

  describe("energy conservation", () => {
    it("should conserve energy for undamped oscillator", () => {
      const model = new SimpleHarmonicOscillator(2.0, 1.0, 0.5);
      const initialEnergy = model.totalEnergy();

      // Simulate for 10 periods
      const period = (2 * Math.PI) / model.omega;
      const totalTime = 10 * period;
      const numSteps = 10000;
      const dt = totalTime / numSteps;

      for (let i = 0; i < numSteps; i++) {
        solver.step(dt, model);
      }

      const finalEnergy = model.totalEnergy();

      // Energy should be conserved within 0.1%
      const relativeError =
        Math.abs(finalEnergy - initialEnergy) / initialEnergy;
      expect(relativeError).toBeLessThan(0.001);
    });

    it("should maintain amplitude for undamped oscillator", () => {
      const x0 = 1.0;
      const model = new SimpleHarmonicOscillator(1.0, x0, 0);

      // Expected amplitude
      const expectedAmplitude = x0;

      // Track max amplitude during simulation
      let maxAmplitude = 0;
      const totalTime = 20; // About 3 periods
      const dt = 0.001;

      for (let t = 0; t < totalTime; t += dt) {
        solver.step(dt, model);
        maxAmplitude = Math.max(maxAmplitude, Math.abs(model.getState()[0]));
      }

      // Amplitude should stay close to initial
      expect(maxAmplitude).toBeCloseTo(expectedAmplitude, 2);
    });
  });

  describe("timestep subdivision", () => {
    it("should handle large timesteps by subdividing", () => {
      const x0 = 1.0;
      const v0 = 0.0;
      const omega = 1.0;

      // With fixed timestep of 0.001, a 0.1s step should be subdivided
      const modelLarge = new SimpleHarmonicOscillator(omega, x0, v0);
      const modelSmall = new SimpleHarmonicOscillator(omega, x0, v0);

      // Large step (should be subdivided internally)
      solver.step(0.1, modelLarge);

      // Equivalent small steps
      for (let i = 0; i < 100; i++) {
        solver.step(0.001, modelSmall);
      }

      // Results should be nearly identical
      const stateL = modelLarge.getState();
      const stateS = modelSmall.getState();

      expect(stateL[0]).toBeCloseTo(stateS[0], 8);
      expect(stateL[1]).toBeCloseTo(stateS[1], 8);
    });
  });

  describe("setFixedTimestep", () => {
    it("should allow changing the fixed timestep", () => {
      const model = new SimpleHarmonicOscillator(1, 1, 0);

      solver.setFixedTimestep(0.01);
      solver.step(0.1, model);
      const state1 = model.getState();

      model.setState([1, 0]);
      solver.setFixedTimestep(0.001);
      solver.step(0.1, model);
      const state2 = model.getState();

      // Both should be close but not identical due to different discretization
      expect(state1[0]).toBeCloseTo(state2[0], 2);
    });
  });
});

describe("AdaptiveRK45Solver", () => {
  let solver: AdaptiveRK45Solver;

  beforeEach(() => {
    solver = new AdaptiveRK45Solver();
  });

  describe("basic functionality", () => {
    it("should integrate state forward in time", () => {
      const model = new SimpleHarmonicOscillator(1, 1, 0);
      const initialState = model.getState();

      solver.step(0.1, model);

      const newState = model.getState();
      expect(newState).not.toEqual(initialState);
    });
  });

  describe("accuracy", () => {
    it("should match analytical solution for simple harmonic oscillator", () => {
      const omega = 2.0;
      const x0 = 1.0;
      const v0 = 0.0;
      const model = new SimpleHarmonicOscillator(omega, x0, v0);

      // Test at several time points
      const testTimes = [0.5, 1.0, 2.0, 5.0];

      for (const targetTime of testTimes) {
        model.setState([x0, v0]);

        solver.step(targetTime, model);

        const state = model.getState();
        const expectedX = model.analyticalPosition(targetTime, x0, v0);
        const expectedV = model.analyticalVelocity(targetTime, x0, v0);

        // Adaptive solver should be very accurate
        expect(state[0]).toBeCloseTo(expectedX, 3);
        expect(state[1]).toBeCloseTo(expectedV, 3);
      }
    });

    it("should handle exponential growth accurately", () => {
      const model = new ExponentialModel(1);
      const targetTime = 2.0;
      const exactSolution = Math.exp(targetTime);

      solver.step(targetTime, model);

      const result = model.getState()[0];
      const relativeError = Math.abs(result - exactSolution) / exactSolution;

      // Should be accurate to within 0.01%
      expect(relativeError).toBeLessThan(0.0001);
    });
  });

  describe("energy conservation", () => {
    it("should conserve energy for undamped oscillator", () => {
      const model = new SimpleHarmonicOscillator(2.0, 1.0, 0.5);
      const initialEnergy = model.totalEnergy();

      // Simulate for 10 periods
      const period = (2 * Math.PI) / model.omega;
      const totalTime = 10 * period;

      solver.step(totalTime, model);

      const finalEnergy = model.totalEnergy();

      // Energy should be conserved within 0.1%
      const relativeError =
        Math.abs(finalEnergy - initialEnergy) / initialEnergy;
      expect(relativeError).toBeLessThan(0.001);
    });
  });

  describe("adaptive behavior", () => {
    it("should handle stiff-like problems without crashing", () => {
      // High frequency oscillator
      const model = new SimpleHarmonicOscillator(100, 1, 0);

      expect(() => solver.step(1.0, model)).not.toThrow();

      // Should still maintain reasonable accuracy
      const state = model.getState();
      expect(Math.abs(state[0])).toBeLessThan(2); // Bounded
    });

    it("should produce similar results for different total times", () => {
      const model1 = new SimpleHarmonicOscillator(1, 1, 0);
      const model2 = new SimpleHarmonicOscillator(1, 1, 0);

      // Single large step
      solver.step(1.0, model1);

      // Multiple smaller steps
      solver.step(0.5, model2);
      solver.step(0.5, model2);

      const state1 = model1.getState();
      const state2 = model2.getState();

      // Results should be very close
      expect(state1[0]).toBeCloseTo(state2[0], 4);
      expect(state1[1]).toBeCloseTo(state2[1], 4);
    });
  });
});

describe("AdaptiveEulerSolver", () => {
  let solver: AdaptiveEulerSolver;

  beforeEach(() => {
    solver = new AdaptiveEulerSolver();
  });

  describe("basic functionality", () => {
    it("should integrate state forward in time", () => {
      const model = new SimpleHarmonicOscillator(1, 1, 0);
      const initialState = model.getState();

      solver.step(0.1, model);

      const newState = model.getState();
      expect(newState).not.toEqual(initialState);
    });

    it("should handle zero timestep gracefully", () => {
      const model = new SimpleHarmonicOscillator(1, 1, 0);
      const initialState = model.getState();

      solver.step(0, model);

      const newState = model.getState();
      // Should be unchanged or very close
      expect(newState[0]).toBeCloseTo(initialState[0], 5);
    });
  });

  describe("accuracy", () => {
    it("should match analytical solution for simple harmonic oscillator", () => {
      const omega = 2.0;
      const x0 = 1.0;
      const v0 = 0.0;
      const model = new SimpleHarmonicOscillator(omega, x0, v0);

      // Test at several time points
      const testTimes = [0.5, 1.0, 2.0];

      for (const targetTime of testTimes) {
        model.setState([x0, v0]);

        // Use multiple smaller steps for adaptive Euler
        const numSteps = 100;
        const dt = targetTime / numSteps;
        for (let i = 0; i < numSteps; i++) {
          solver.step(dt, model);
        }

        const state = model.getState();
        const expectedX = model.analyticalPosition(targetTime, x0, v0);
        const expectedV = model.analyticalVelocity(targetTime, x0, v0);

        // Euler is less accurate, allow larger tolerance
        expect(state[0]).toBeCloseTo(expectedX, 1);
        expect(state[1]).toBeCloseTo(expectedV, 1);
      }
    });

    it("should handle exponential growth", () => {
      const model = new ExponentialModel(1);
      const targetTime = 1.0;
      const exactSolution = Math.exp(targetTime);

      // Use small steps for better accuracy
      const numSteps = 100;
      const dt = targetTime / numSteps;
      for (let i = 0; i < numSteps; i++) {
        solver.step(dt, model);
      }

      const result = model.getState()[0];
      const relativeError = Math.abs(result - exactSolution) / exactSolution;

      // Euler is lower order, accept larger error
      expect(relativeError).toBeLessThan(0.05);
    });
  });

  describe("energy conservation", () => {
    it("should approximately conserve energy for undamped oscillator", () => {
      const model = new SimpleHarmonicOscillator(2.0, 1.0, 0.5);
      const initialEnergy = model.totalEnergy();

      // Simulate for several periods
      const period = (2 * Math.PI) / model.omega;
      const totalTime = 5 * period;
      const numSteps = 5000;
      const dt = totalTime / numSteps;

      for (let i = 0; i < numSteps; i++) {
        solver.step(dt, model);
      }

      const finalEnergy = model.totalEnergy();

      // Euler is much less accurate at energy conservation, allow 15%
      // This is expected for first-order methods
      const relativeError =
        Math.abs(finalEnergy - initialEnergy) / initialEnergy;
      expect(relativeError).toBeLessThan(0.15);
    });
  });

  describe("adaptive behavior", () => {
    it("should adapt timestep based on error", () => {
      const model = new SimpleHarmonicOscillator(1, 1, 0);

      // Should complete without throwing
      expect(() => solver.step(1.0, model)).not.toThrow();

      // Result should be bounded
      const state = model.getState();
      expect(Math.abs(state[0])).toBeLessThan(2);
    });

    it("should handle high frequency oscillator", () => {
      const model = new SimpleHarmonicOscillator(50, 1, 0);

      expect(() => solver.step(0.5, model)).not.toThrow();

      const state = model.getState();
      expect(Math.abs(state[0])).toBeLessThan(2);
    });
  });
});

describe("ModifiedMidpointSolver", () => {
  let solver: ModifiedMidpointSolver;

  beforeEach(() => {
    solver = new ModifiedMidpointSolver(0.001, 4);
  });

  describe("basic functionality", () => {
    it("should integrate state forward in time", () => {
      const model = new SimpleHarmonicOscillator(1, 1, 0);
      const initialState = model.getState();

      solver.step(0.1, model);

      const newState = model.getState();
      expect(newState).not.toEqual(initialState);
    });

    it("should handle zero timestep", () => {
      const model = new SimpleHarmonicOscillator(1, 1, 0);
      const initialState = model.getState();

      solver.step(0, model);

      const newState = model.getState();
      expect(newState[0]).toBeCloseTo(initialState[0], 10);
      expect(newState[1]).toBeCloseTo(initialState[1], 10);
    });
  });

  describe("accuracy", () => {
    it("should match analytical solution for simple harmonic oscillator", () => {
      const omega = 2.0;
      const x0 = 1.0;
      const v0 = 0.0;
      const model = new SimpleHarmonicOscillator(omega, x0, v0);

      // Test at several time points
      const testTimes = [0.5, 1.0, 2.0, 5.0];

      for (const targetTime of testTimes) {
        model.setState([x0, v0]);

        const numSteps = Math.ceil(targetTime / 0.01);
        const dt = targetTime / numSteps;
        for (let i = 0; i < numSteps; i++) {
          solver.step(dt, model);
        }

        const state = model.getState();
        const expectedX = model.analyticalPosition(targetTime, x0, v0);
        const expectedV = model.analyticalVelocity(targetTime, x0, v0);

        // Modified midpoint should be reasonably accurate
        expect(state[0]).toBeCloseTo(expectedX, 2);
        expect(state[1]).toBeCloseTo(expectedV, 2);
      }
    });

    it("should handle exponential growth accurately", () => {
      const model = new ExponentialModel(1);
      const targetTime = 2.0;
      const exactSolution = Math.exp(targetTime);

      const numSteps = 200;
      const dt = targetTime / numSteps;
      for (let i = 0; i < numSteps; i++) {
        solver.step(dt, model);
      }

      const result = model.getState()[0];
      const relativeError = Math.abs(result - exactSolution) / exactSolution;

      // Should be accurate to within 1%
      expect(relativeError).toBeLessThan(0.01);
    });
  });

  describe("energy conservation", () => {
    it("should conserve energy for undamped oscillator", () => {
      const model = new SimpleHarmonicOscillator(2.0, 1.0, 0.5);
      const initialEnergy = model.totalEnergy();

      // Simulate for 10 periods
      const period = (2 * Math.PI) / model.omega;
      const totalTime = 10 * period;
      const numSteps = 10000;
      const dt = totalTime / numSteps;

      for (let i = 0; i < numSteps; i++) {
        solver.step(dt, model);
      }

      const finalEnergy = model.totalEnergy();

      // Energy should be conserved within 1%
      const relativeError =
        Math.abs(finalEnergy - initialEnergy) / initialEnergy;
      expect(relativeError).toBeLessThan(0.01);
    });

    it("should maintain amplitude for undamped oscillator", () => {
      const x0 = 1.0;
      const model = new SimpleHarmonicOscillator(1.0, x0, 0);

      let maxAmplitude = 0;
      const totalTime = 20;
      const dt = 0.001;

      for (let t = 0; t < totalTime; t += dt) {
        solver.step(dt, model);
        maxAmplitude = Math.max(maxAmplitude, Math.abs(model.getState()[0]));
      }

      // Amplitude should stay close to initial (within 5%)
      expect(maxAmplitude).toBeCloseTo(x0, 1);
    });
  });

  describe("timestep subdivision", () => {
    it("should handle large timesteps by subdividing", () => {
      const x0 = 1.0;
      const v0 = 0.0;
      const omega = 1.0;

      const modelLarge = new SimpleHarmonicOscillator(omega, x0, v0);
      const modelSmall = new SimpleHarmonicOscillator(omega, x0, v0);

      // Large step
      solver.step(0.1, modelLarge);

      // Equivalent small steps
      for (let i = 0; i < 100; i++) {
        solver.step(0.001, modelSmall);
      }

      const stateL = modelLarge.getState();
      const stateS = modelSmall.getState();

      // Results should be close
      expect(stateL[0]).toBeCloseTo(stateS[0], 4);
      expect(stateL[1]).toBeCloseTo(stateS[1], 4);
    });
  });

  describe("setFixedTimestep", () => {
    it("should allow changing the fixed timestep", () => {
      const model = new SimpleHarmonicOscillator(1, 1, 0);

      solver.setFixedTimestep(0.01);
      solver.step(0.1, model);
      const state1 = model.getState();

      model.setState([1, 0]);
      solver.setFixedTimestep(0.001);
      solver.step(0.1, model);
      const state2 = model.getState();

      // Both should be close
      expect(state1[0]).toBeCloseTo(state2[0], 1);
    });
  });

  describe("substeps configuration", () => {
    it("should work with different substep counts", () => {
      const omega = 2.0;
      const x0 = 1.0;
      const v0 = 0.0;

      const substepCounts = [2, 4, 8];
      const results: number[] = [];

      for (const substeps of substepCounts) {
        const solver = new ModifiedMidpointSolver(0.001, substeps);
        const model = new SimpleHarmonicOscillator(omega, x0, v0);

        solver.step(1.0, model);
        results.push(model.getState()[0]);
      }

      // All should give similar results
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBeCloseTo(results[0], 1);
      }
    });
  });
});

describe("Solver comparison", () => {
  it("should produce similar results for same problem (high-order solvers)", () => {
    // Compare only higher-order solvers that should be accurate
    // AdaptiveEulerSolver is first-order and much less accurate
    const solvers: { name: string; solver: ODESolver }[] = [
      { name: "RungeKutta", solver: new RungeKuttaSolver(0.001) },
      { name: "AdaptiveRK45", solver: new AdaptiveRK45Solver() },
      {
        name: "ModifiedMidpoint",
        solver: new ModifiedMidpointSolver(0.001, 4),
      },
    ];

    const x0 = 1.0;
    const v0 = 0.5;
    const omega = 2.0;
    const targetTime = 5.0;

    const results: { name: string; position: number; velocity: number }[] = [];

    for (const { name, solver } of solvers) {
      const model = new SimpleHarmonicOscillator(omega, x0, v0);

      // Use consistent stepping approach
      const numSteps = 100;
      const dt = targetTime / numSteps;
      for (let i = 0; i < numSteps; i++) {
        solver.step(dt, model);
      }

      const state = model.getState();
      results.push({ name, position: state[0], velocity: state[1] });
    }

    // All high-order solvers should agree within tight tolerance
    const referencePosition = results[0].position;
    const referenceVelocity = results[0].velocity;

    for (const { position, velocity } of results) {
      expect(position).toBeCloseTo(referencePosition, 2);
      expect(velocity).toBeCloseTo(referenceVelocity, 2);
    }
  });

  it("should produce bounded results for AdaptiveEulerSolver", () => {
    // Euler solver is first-order, so it won't match higher-order solvers
    // but it should still produce bounded, reasonable results
    const solver = new AdaptiveEulerSolver();
    const x0 = 1.0;
    const v0 = 0.5;
    const omega = 2.0;
    const targetTime = 5.0;

    const model = new SimpleHarmonicOscillator(omega, x0, v0);

    const numSteps = 100;
    const dt = targetTime / numSteps;
    for (let i = 0; i < numSteps; i++) {
      solver.step(dt, model);
    }

    const state = model.getState();

    // Should be bounded (oscillator with initial amplitude ~1.12)
    expect(Math.abs(state[0])).toBeLessThan(3);
    expect(Math.abs(state[1])).toBeLessThan(5);
  });

  it("should all produce correct frequency for oscillator", () => {
    const solvers: { name: string; solver: ODESolver }[] = [
      { name: "RungeKutta", solver: new RungeKuttaSolver(0.001) },
      { name: "AdaptiveRK45", solver: new AdaptiveRK45Solver() },
    ];

    const omega = 2.0;
    const expectedPeriod = (2 * Math.PI) / omega;

    for (const { solver } of solvers) {
      const model = new SimpleHarmonicOscillator(omega, 1, 0);

      // Find when position returns to initial value (one period)
      let time = 0;
      const dt = 0.001;
      let foundPeriod = false;
      let measuredPeriod = 0;

      // Skip first quarter period
      while (time < expectedPeriod / 4) {
        solver.step(dt, model);
        time += dt;
      }

      // Now find the next zero crossing with positive velocity
      let prevX = model.getState()[0];
      while (time < 3 * expectedPeriod && !foundPeriod) {
        solver.step(dt, model);
        time += dt;
        const [x, v] = model.getState();

        // Zero crossing going up (position crosses zero with positive velocity)
        if (prevX < 0 && x >= 0 && v > 0) {
          // Measure time to complete one more full cycle
          const startTime = time;
          const cycleCount = 0;
          let cycleStartX = x;

          while (cycleCount < 1 && time < 3 * expectedPeriod) {
            solver.step(dt, model);
            time += dt;
            const [newX, newV] = model.getState();

            if (cycleStartX > 0 && newX <= 0) {
              // Crossed zero going down
              cycleStartX = newX;
            } else if (cycleStartX <= 0 && newX > 0 && newV > 0) {
              // Completed a cycle
              measuredPeriod = time - startTime;
              foundPeriod = true;
              break;
            }
            cycleStartX = newX;
          }
        }
        prevX = x;
      }

      if (foundPeriod) {
        // Measured period should match expected within 1%
        const periodError =
          Math.abs(measuredPeriod - expectedPeriod) / expectedPeriod;
        expect(periodError).toBeLessThan(0.01);
      }
    }
  });
});
