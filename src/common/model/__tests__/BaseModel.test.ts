/**
 * Tests for BaseModel - Time management and ODE solver infrastructure
 *
 * P1 Priority: Core infrastructure for time management and solver switching.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Property } from 'scenerystack/axon';
import { BaseModel, TimeSpeed } from '../BaseModel.js';
import { SolverType } from '../SolverType.js';
import { RungeKuttaSolver } from '../RungeKuttaSolver.js';
import { AdaptiveRK45Solver } from '../AdaptiveRK45Solver.js';
import { AdaptiveEulerSolver } from '../AdaptiveEulerSolver.js';
import { ModifiedMidpointSolver } from '../ModifiedMidpointSolver.js';

/**
 * Concrete implementation of BaseModel for testing
 * Simple harmonic oscillator: x'' = -omega^2 * x
 */
class TestModel extends BaseModel {
  public position: number = 0;
  public velocity: number = 0;
  private omega: number = 1;

  constructor(solverTypeProperty: Property<SolverType>) {
    super(solverTypeProperty);
  }

  getState(): number[] {
    return [this.position, this.velocity];
  }

  setState(state: number[]): void {
    this.position = state[0];
    this.velocity = state[1];
  }

  getDerivatives(_t: number, state: number[]): number[] {
    const [x, v] = state;
    return [
      v,
      -this.omega * this.omega * x
    ];
  }

  reset(): void {
    this.position = 0;
    this.velocity = 0;
    this.resetCommon();
  }

  setOmega(omega: number): void {
    this.omega = omega;
  }

  // Expose solver for testing
  getSolver() {
    return this.solver;
  }
}

describe('BaseModel', () => {
  let solverTypeProperty: Property<SolverType>;
  let model: TestModel;

  beforeEach(() => {
    solverTypeProperty = new Property<SolverType>(SolverType.RUNGE_KUTTA_4);
    model = new TestModel(solverTypeProperty);
  });

  describe('time management', () => {
    describe('play/pause control', () => {
      it('should default to playing', () => {
        expect(model.isPlayingProperty.value).toBe(true);
      });

      it('should step when playing', () => {
        model.position = 1;
        model.velocity = 0;
        model.isPlayingProperty.value = true;

        const initialTime = model.timeProperty.value;
        model.step(0.1);

        expect(model.timeProperty.value).toBeGreaterThan(initialTime);
      });

      it('should not step when paused', () => {
        model.position = 1;
        model.velocity = 0;
        model.isPlayingProperty.value = false;

        const initialPosition = model.position;
        const initialTime = model.timeProperty.value;

        model.step(0.1);

        expect(model.position).toBe(initialPosition);
        expect(model.timeProperty.value).toBe(initialTime);
      });

      it('should step when paused if forceStep is true', () => {
        model.position = 1;
        model.velocity = 0;
        model.isPlayingProperty.value = false;

        const initialTime = model.timeProperty.value;
        model.step(0.1, true);

        expect(model.timeProperty.value).toBeGreaterThan(initialTime);
      });
    });

    describe('time speed multipliers', () => {
      it('should default to normal speed', () => {
        expect(model.timeSpeedProperty.value).toBe('normal');
      });

      it('should step at normal speed with multiplier 1.0', () => {
        model.position = 1;
        model.velocity = 0;
        model.timeSpeedProperty.value = 'normal';

        const initialTime = model.timeProperty.value;
        model.step(0.1);

        // Normal speed: dt * 1.0 = 0.1
        expect(model.timeProperty.value).toBeCloseTo(initialTime + 0.1, 5);
      });

      it('should step at slow speed with multiplier 0.5', () => {
        model.position = 1;
        model.velocity = 0;
        model.timeSpeedProperty.value = 'slow';

        const initialTime = model.timeProperty.value;
        model.step(0.1);

        // Slow speed: dt * 0.5 = 0.05
        expect(model.timeProperty.value).toBeCloseTo(initialTime + 0.05, 5);
      });

      it('should step at fast speed with multiplier 2.0', () => {
        model.position = 1;
        model.velocity = 0;
        model.timeSpeedProperty.value = 'fast';

        const initialTime = model.timeProperty.value;
        model.step(0.1);

        // Fast speed: dt * 2.0 = 0.2
        expect(model.timeProperty.value).toBeCloseTo(initialTime + 0.2, 5);
      });

      it('should ignore time speed multiplier when forceStep is true', () => {
        model.position = 1;
        model.velocity = 0;
        model.timeSpeedProperty.value = 'slow';

        const initialTime = model.timeProperty.value;
        model.step(0.1, true);

        // Force step should use dt directly without multiplier
        expect(model.timeProperty.value).toBeCloseTo(initialTime + 0.1, 5);
      });
    });

    describe('dt capping', () => {
      it('should cap large dt values at 100ms', () => {
        model.position = 1;
        model.velocity = 0;
        model.timeSpeedProperty.value = 'normal';

        const initialTime = model.timeProperty.value;
        model.step(0.5); // 500ms - should be capped to 100ms

        // Capped at 0.1s
        expect(model.timeProperty.value).toBeCloseTo(initialTime + 0.1, 5);
      });

      it('should not cap small dt values', () => {
        model.position = 1;
        model.velocity = 0;
        model.timeSpeedProperty.value = 'normal';

        const initialTime = model.timeProperty.value;
        model.step(0.05);

        expect(model.timeProperty.value).toBeCloseTo(initialTime + 0.05, 5);
      });
    });
  });

  describe('solver management', () => {
    describe('solver creation', () => {
      it('should create RungeKuttaSolver for RUNGE_KUTTA_4', () => {
        solverTypeProperty.value = SolverType.RUNGE_KUTTA_4;
        expect(model.getSolver()).toBeInstanceOf(RungeKuttaSolver);
      });

      it('should create AdaptiveRK45Solver for ADAPTIVE_RK45', () => {
        solverTypeProperty.value = SolverType.ADAPTIVE_RK45;
        expect(model.getSolver()).toBeInstanceOf(AdaptiveRK45Solver);
      });

      it('should create AdaptiveEulerSolver for ADAPTIVE_EULER', () => {
        solverTypeProperty.value = SolverType.ADAPTIVE_EULER;
        expect(model.getSolver()).toBeInstanceOf(AdaptiveEulerSolver);
      });

      it('should create ModifiedMidpointSolver for MODIFIED_MIDPOINT', () => {
        solverTypeProperty.value = SolverType.MODIFIED_MIDPOINT;
        expect(model.getSolver()).toBeInstanceOf(ModifiedMidpointSolver);
      });
    });

    describe('solver switching', () => {
      it('should switch solver when solverTypeProperty changes', () => {
        const initialSolver = model.getSolver();
        expect(initialSolver).toBeInstanceOf(RungeKuttaSolver);

        solverTypeProperty.value = SolverType.ADAPTIVE_RK45;

        const newSolver = model.getSolver();
        expect(newSolver).toBeInstanceOf(AdaptiveRK45Solver);
        expect(newSolver).not.toBe(initialSolver);
      });

      it('should continue simulation correctly after solver switch', () => {
        model.position = 1;
        model.velocity = 0;
        model.setOmega(2 * Math.PI); // 1 Hz oscillator

        // Step with RK4
        model.step(0.1, true);
        const posAfterRK4 = model.position;

        // Switch to AdaptiveRK45 and continue
        solverTypeProperty.value = SolverType.ADAPTIVE_RK45;
        model.step(0.1, true);
        const posAfterRK45 = model.position;

        // Simulation should continue (position should change)
        expect(posAfterRK45).not.toBe(posAfterRK4);

        // And should still follow physics (oscillating)
        expect(Math.abs(posAfterRK45)).toBeLessThan(1);
      });
    });
  });

  describe('reset functionality', () => {
    it('should reset time to zero', () => {
      model.step(0.5, true);
      expect(model.timeProperty.value).toBeGreaterThan(0);

      model.reset();

      expect(model.timeProperty.value).toBe(0);
    });

    it('should reset isPlaying to default', () => {
      model.isPlayingProperty.value = false;

      model.reset();

      expect(model.isPlayingProperty.value).toBe(true);
    });

    it('should reset timeSpeed to default', () => {
      model.timeSpeedProperty.value = 'fast';

      model.reset();

      expect(model.timeSpeedProperty.value).toBe('normal');
    });

    it('should reset model state', () => {
      model.position = 1;
      model.velocity = 2;

      model.reset();

      expect(model.position).toBe(0);
      expect(model.velocity).toBe(0);
    });
  });

  describe('ODEModel interface', () => {
    it('should implement getState correctly', () => {
      model.position = 1.5;
      model.velocity = -0.5;

      const state = model.getState();

      expect(state).toEqual([1.5, -0.5]);
    });

    it('should implement setState correctly', () => {
      model.setState([2.5, 1.5]);

      expect(model.position).toBe(2.5);
      expect(model.velocity).toBe(1.5);
    });

    it('should implement getDerivatives correctly', () => {
      model.setOmega(2); // omega = 2

      // At position 1, velocity 0: derivatives should be [0, -4]
      // dx/dt = v = 0
      // dv/dt = -omega^2 * x = -4 * 1 = -4
      const derivatives = model.getDerivatives(0, [1, 0]);

      expect(derivatives[0]).toBe(0);
      expect(derivatives[1]).toBe(-4);
    });
  });

  describe('physics simulation', () => {
    it('should simulate simple harmonic motion', () => {
      model.position = 1;
      model.velocity = 0;
      model.setOmega(2 * Math.PI); // 1 Hz

      // At t=0: x=1, v=0
      // At t=0.25 (quarter period): x≈0, v≈-2π
      // At t=0.5 (half period): x≈-1, v≈0

      // Step for half a period (0.5 seconds)
      const numSteps = 500;
      const dt = 0.5 / numSteps;
      for (let i = 0; i < numSteps; i++) {
        model.step(dt, true);
      }

      // Position should be approximately -1 after half period
      expect(model.position).toBeCloseTo(-1, 1);
    });

    it('should advance time during simulation', () => {
      model.position = 1;
      model.velocity = 0;

      expect(model.timeProperty.value).toBe(0);

      model.step(0.1, true);

      expect(model.timeProperty.value).toBeCloseTo(0.1, 5);
    });
  });

  describe('all TimeSpeed values', () => {
    const speeds: TimeSpeed[] = ['slow', 'normal', 'fast'];
    const multipliers: Record<TimeSpeed, number> = {
      slow: 0.5,
      normal: 1.0,
      fast: 2.0,
    };

    it.each(speeds)('should apply correct multiplier for %s speed', (speed) => {
      model.position = 1;
      model.velocity = 0;
      model.timeSpeedProperty.value = speed;

      const initialTime = model.timeProperty.value;
      const dt = 0.08; // Small enough to not be capped
      model.step(dt);

      const expectedTime = initialTime + dt * multipliers[speed];
      expect(model.timeProperty.value).toBeCloseTo(expectedTime, 5);
    });
  });
});
