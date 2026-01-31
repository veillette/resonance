/**
 * Adaptive Euler ODE solver
 * Uses error estimation to adapt the timestep for efficient integration
 *
 * This solver takes two steps:
 * 1. One full step of size dt
 * 2. Two half steps of size dt/2
 *
 * The difference between these gives an error estimate.
 * If error is too large, the step is rejected and retried with a smaller timestep.
 */

import { ODESolver, ODEModel } from "./ODESolver.js";

export class AdaptiveEulerSolver extends ODESolver {
  private maxTimestep: number = 0.01;
  private minTimestep: number = 0.00001;
  private errorTolerance: number = 0.0001;

  /**
   * Integrate the system forward by dt using adaptive Euler method
   */
  public override step(dt: number, model: ODEModel): void {
    let remainingTime = dt;
    let currentTimestep = Math.min(this.maxTimestep, dt);

    while (remainingTime > 0) {
      const actualDt = Math.min(currentTimestep, remainingTime);
      const success = this.tryStep(actualDt, model);

      if (success) {
        remainingTime -= actualDt;
        // Increase timestep on success (but not too aggressively)
        currentTimestep = Math.min(actualDt * 1.5, this.maxTimestep);
      } else {
        // Decrease timestep on failure
        currentTimestep = Math.max(actualDt * 0.5, this.minTimestep);
      }

      // Safety check to prevent infinite loops
      if (currentTimestep < this.minTimestep) {
        console.warn(
          "AdaptiveEulerSolver: Timestep became too small, forcing step",
        );
        this.forceStep(remainingTime, model);
        break;
      }
    }
  }

  /**
   * Try to take a step, return true if error is acceptable
   */
  private tryStep(dt: number, model: ODEModel): boolean {
    const initialState = model.getState();
    const n = initialState.length;

    // Full step
    const fullStepDerivatives = model.getDerivatives(0, initialState);
    const fullStepState: number[] = Array.from(
      { length: n },
      (_, i) => initialState[i]! + fullStepDerivatives[i]! * dt,
    );

    // Two half steps
    const halfDt = dt * 0.5;

    // First half step
    const firstHalfDerivatives = model.getDerivatives(0, initialState);
    const halfStepState: number[] = Array.from(
      { length: n },
      (_, i) =>
        initialState[i]! + firstHalfDerivatives[i]! * halfDt,
    );

    // Second half step
    const secondHalfDerivatives: number[] = model.getDerivatives(
      halfDt,
      halfStepState,
    );
    const twoHalfStepsState: number[] = Array.from(
      { length: n },
      (_, i) =>
        halfStepState[i]! + secondHalfDerivatives[i]! * halfDt,
    );

    // Calculate error
    let maxError = 0;
    for (let i = 0; i < n; i++) {
      const error = Math.abs(twoHalfStepsState[i]! - fullStepState[i]!);
      maxError = Math.max(maxError, error);
    }

    // Accept or reject the step
    if (maxError <= this.errorTolerance) {
      // Use the more accurate two-half-steps result
      model.setState(twoHalfStepsState);
      return true;
    } else {
      // Reject the step, state remains unchanged
      return false;
    }
  }

  /**
   * Force a step (used when adaptive method fails)
   */
  private forceStep(dt: number, model: ODEModel): void {
    const state = model.getState();
    const derivatives = model.getDerivatives(0, state);
    const n = state.length;

    const newState: number[] = Array.from(
      { length: n },
      (_, i) => state[i]! + derivatives[i]! * dt,
    );

    model.setState(newState);
  }
}
