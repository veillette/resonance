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
  private k1: number[] = [];
  private k2: number[] = [];
  private k3: number[] = [];
  private k4: number[] = [];
  private tempState: number[] = [];

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
   * Perform a single RK4 step without subdivision
   */
  private stepExact(dt: number, model: ODEModel): void {
    const state = model.getState();
    const n = state.length;

    // Resize temporary arrays if needed
    if (this.k1.length !== n) {
      this.k1 = new Array(n);
      this.k2 = new Array(n);
      this.k3 = new Array(n);
      this.k4 = new Array(n);
      this.tempState = new Array(n);
    }

    // k1 = f(t, y)
    const k1 = model.getDerivatives(0, state);
    for (let i = 0; i < n; i++) {
      this.k1[i] = k1[i];
    }

    // k2 = f(t + dt/2, y + k1*dt/2)
    for (let i = 0; i < n; i++) {
      this.tempState[i] = state[i] + this.k1[i] * dt * 0.5;
    }
    const k2 = model.getDerivatives(dt * 0.5, this.tempState);
    for (let i = 0; i < n; i++) {
      this.k2[i] = k2[i];
    }

    // k3 = f(t + dt/2, y + k2*dt/2)
    for (let i = 0; i < n; i++) {
      this.tempState[i] = state[i] + this.k2[i] * dt * 0.5;
    }
    const k3 = model.getDerivatives(dt * 0.5, this.tempState);
    for (let i = 0; i < n; i++) {
      this.k3[i] = k3[i];
    }

    // k4 = f(t + dt, y + k3*dt)
    for (let i = 0; i < n; i++) {
      this.tempState[i] = state[i] + this.k3[i] * dt;
    }
    const k4 = model.getDerivatives(dt, this.tempState);
    for (let i = 0; i < n; i++) {
      this.k4[i] = k4[i];
    }

    // Update: y_new = y + (k1 + 2*k2 + 2*k3 + k4) * dt/6
    const newState = new Array(n);
    for (let i = 0; i < n; i++) {
      newState[i] =
        state[i] + (this.k1[i] + 2 * this.k2[i] + 2 * this.k3[i] + this.k4[i]) * dt / 6;
    }

    model.setState(newState);
  }
}
