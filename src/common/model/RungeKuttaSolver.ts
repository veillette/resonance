/**
 * Fourth-order Runge-Kutta ODE solver
 * Provides fourth-order accurate numerical integration for ODEs
 *
 * The RK4 method evaluates derivatives at four points:
 * k1 = f(t, y)
 * k2 = f(t + dt/2, y + k1*dt/2)
 * k3 = f(t + dt/2, y + k2*dt/2)
 * k4 = f(t + dt, y + k3*dt)
 *
 * Final update: y_new = y + (k1 + 2*k2 + 2*k3 + k4) * dt/6
 */

import { ODESolver, ODEModel } from "./ODESolver.js";

export class RungeKuttaSolver extends ODESolver {
  private fixedTimestep: number;

  // Use TypedArrays for better performance and cache locality
  // Pre-allocated to expected state size (3 for oscillator: position, velocity, phase)
  private k1: Float64Array = new Float64Array(3);
  private k2: Float64Array = new Float64Array(3);
  private k3: Float64Array = new Float64Array(3);
  private k4: Float64Array = new Float64Array(3);
  private tempState: Float64Array = new Float64Array(3);
  private newState: Float64Array = new Float64Array(3);
  private cachedStateLength: number = 3;

  public constructor(fixedTimestep: number = 0.001) {
    super();
    this.fixedTimestep = fixedTimestep;
  }

  public override setFixedTimestep(fixedTimestep: number): void {
    this.fixedTimestep = fixedTimestep;
  }

  /**
   * Integrate the system forward by dt using RK4
   * If dt > fixedTimestep, subdivides into smaller steps
   */
  public override step(dt: number, model: ODEModel): void {
    // Subdivide large timesteps
    const numSteps = Math.ceil(dt / this.fixedTimestep);
    const actualDt = dt / numSteps;

    for (let i = 0; i < numSteps; i++) {
      this.stepExact(actualDt, model);
    }
  }

  /**
   * Resize TypedArrays if state length has changed.
   * This is rare - typically only called once on first step.
   */
  private ensureCapacity(n: number): void {
    if (this.cachedStateLength !== n) {
      this.k1 = new Float64Array(n);
      this.k2 = new Float64Array(n);
      this.k3 = new Float64Array(n);
      this.k4 = new Float64Array(n);
      this.tempState = new Float64Array(n);
      this.newState = new Float64Array(n);
      this.cachedStateLength = n;
    }
  }

  /**
   * Perform a single RK4 step without subdivision.
   * Uses pre-allocated Float64Arrays for improved performance.
   */
  private stepExact(dt: number, model: ODEModel): void {
    const state = model.getState();
    const n = state.length;

    // Ensure TypedArrays are properly sized
    this.ensureCapacity(n);

    const halfDt = dt * 0.5;
    const sixthDt = dt / 6;

    // k1 = f(t, y)
    const k1Derivatives = model.getDerivatives(0, state);
    for (let i = 0; i < n; i++) {
      this.k1[i] = k1Derivatives[i]!;
    }

    // k2 = f(t + dt/2, y + k1*dt/2)
    for (let i = 0; i < n; i++) {
      this.tempState[i] = state[i]! + this.k1[i]! * halfDt;
    }
    const k2Derivatives = model.getDerivatives(
      halfDt,
      Array.from(this.tempState),
    );
    for (let i = 0; i < n; i++) {
      this.k2[i] = k2Derivatives[i]!;
    }

    // k3 = f(t + dt/2, y + k2*dt/2)
    for (let i = 0; i < n; i++) {
      this.tempState[i] = state[i]! + this.k2[i]! * halfDt;
    }
    const k3Derivatives = model.getDerivatives(
      halfDt,
      Array.from(this.tempState),
    );
    for (let i = 0; i < n; i++) {
      this.k3[i] = k3Derivatives[i]!;
    }

    // k4 = f(t + dt, y + k3*dt)
    for (let i = 0; i < n; i++) {
      this.tempState[i] = state[i]! + this.k3[i]! * dt;
    }
    const k4Derivatives = model.getDerivatives(dt, Array.from(this.tempState));
    for (let i = 0; i < n; i++) {
      this.k4[i] = k4Derivatives[i]!;
    }

    // Update: y_new = y + (k1 + 2*k2 + 2*k3 + k4) * dt/6
    for (let i = 0; i < n; i++) {
      this.newState[i] =
        state[i]! +
        (this.k1[i]! + 2 * this.k2[i]! + 2 * this.k3[i]! + this.k4[i]!) *
          sixthDt;
    }

    model.setState(Array.from(this.newState));
  }
}
