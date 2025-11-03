/**
 * Abstract base class for physics models with time management and ODE integration
 * Provides infrastructure for:
 * - Time management (play/pause, speed control)
 * - ODE solver management
 * - Stepping logic with frame-rate independence
 *
 * Subclasses must implement:
 * - getState(): Return the state vector for integration
 * - setState(): Apply integrated results back to model properties
 * - getDerivatives(): Define physics equations for the ODE solver
 * - reset(): Restore initial conditions
 */

import { BooleanProperty, NumberProperty, Property } from "scenerystack/axon";
import { ODESolver, ODEModel } from "./ODESolver.js";
import { RungeKuttaSolver } from "./RungeKuttaSolver.js";
import { AdaptiveEulerSolver } from "./AdaptiveEulerSolver.js";
import { AdaptiveRK45Solver } from "./AdaptiveRK45Solver.js";
import { ModifiedMidpointSolver } from "./ModifiedMidpointSolver.js";
import { SolverType } from "./SolverType.js";

export type TimeSpeed = "slow" | "normal" | "fast";

export abstract class BaseModel implements ODEModel {
  // Time management
  public readonly timeProperty: NumberProperty;
  public readonly isPlayingProperty: BooleanProperty;
  public readonly timeSpeedProperty: Property<TimeSpeed>;

  // ODE solver
  protected solver: ODESolver;
  private readonly solverTypeProperty: Property<SolverType>;

  // Time speed multipliers
  private readonly timeSpeedMultipliers: Record<TimeSpeed, number> = {
    slow: 0.5,
    normal: 1.0,
    fast: 2.0,
  };

  protected constructor(solverTypeProperty: Property<SolverType>) {
    // Initialize time management properties
    this.timeProperty = new NumberProperty(0);
    this.isPlayingProperty = new BooleanProperty(false);
    this.timeSpeedProperty = new Property<TimeSpeed>("normal");

    // Initialize solver
    this.solverTypeProperty = solverTypeProperty;
    this.solver = this.createSolver(solverTypeProperty.value);

    // Update solver when solver type changes
    this.solverTypeProperty.link((solverType) => {
      this.solver = this.createSolver(solverType);
    });
  }

  /**
   * Create an ODE solver based on the solver type
   */
  private createSolver(solverType: SolverType): ODESolver {
    switch (solverType) {
      case SolverType.RUNGE_KUTTA_4:
        return new RungeKuttaSolver(0.001);

      case SolverType.ADAPTIVE_RK45:
        return new AdaptiveRK45Solver();

      case SolverType.ADAPTIVE_EULER:
        return new AdaptiveEulerSolver();

      case SolverType.MODIFIED_MIDPOINT:
        return new ModifiedMidpointSolver(0.001, 4);

      default:
        console.warn(`Unknown solver type: ${solverType}, using RK4`);
        return new RungeKuttaSolver(0.001);
    }
  }

  /**
   * Step the physics simulation forward by dt seconds
   * @param dt - time step in seconds
   * @param forceStep - if true, step even if paused
   */
  public step(dt: number, forceStep: boolean = false): void {
    // Only step if playing or forced
    if (!this.isPlayingProperty.value && !forceStep) {
      return;
    }

    // Cap dt to prevent large jumps when user switches tabs or browser loses focus
    const cappedDt = Math.min(dt, 0.1);

    // Apply time speed multiplier (only when playing automatically)
    let adjustedDt = cappedDt;
    if (!forceStep) {
      const speedMultiplier = this.timeSpeedMultipliers[this.timeSpeedProperty.value as TimeSpeed];
      adjustedDt = cappedDt * speedMultiplier;
    }

    // Integrate the physics
    this.solver.step(adjustedDt, this);

    // Update time
    this.timeProperty.value += adjustedDt;
  }

  /**
   * Reset the model to initial conditions
   * Subclasses should override and call resetCommon()
   */
  public abstract reset(): void;

  /**
   * Common reset logic for all models
   * Should be called by subclass reset() methods
   */
  protected resetCommon(): void {
    this.timeProperty.reset();
    this.isPlayingProperty.reset();
    this.timeSpeedProperty.reset();
  }

  /**
   * Get the current state vector for ODE integration
   * Subclasses must implement this to return [position, velocity, ...]
   */
  public abstract getState(): number[];

  /**
   * Set the state vector after ODE integration
   * Subclasses must implement this to apply [position, velocity, ...]
   */
  public abstract setState(state: number[]): void;

  /**
   * Get the derivatives dy/dt for the ODE solver
   * Subclasses must implement this to define the physics equations
   * @param t - current time offset from start of step (usually ignored)
   * @param state - current state vector
   * @returns derivatives vector [dposition/dt, dvelocity/dt, ...]
   */
  public abstract getDerivatives(t: number, state: number[]): number[];
}
