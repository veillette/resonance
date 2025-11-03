/**
 * Modified Midpoint ODE solver
 * A second-order accurate method that's particularly good for oscillatory systems
 *
 * This method is a variant of the midpoint (leapfrog) method with improved stability.
 * It's especially useful for Hamiltonian systems and oscillators.
 */

import { ODESolver, ODEModel } from "./ODESolver.js";

export class ModifiedMidpointSolver extends ODESolver {
  private fixedTimestep: number;
  private substeps: number;

  /**
   * @param fixedTimestep - the fixed timestep in seconds
   * @param substeps - number of substeps for the modified midpoint method
   */
  public constructor(fixedTimestep: number = 0.001, substeps: number = 4) {
    super();
    this.fixedTimestep = fixedTimestep;
    this.substeps = substeps;
  }

  public override setFixedTimestep(fixedTimestep: number): void {
    this.fixedTimestep = fixedTimestep;
  }

  /**
   * Integrate the system forward by dt using modified midpoint method
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
   * Perform a single modified midpoint step
   */
  private stepExact(H: number, model: ODEModel): void {
    const y0 = model.getState();
    const n = y0.length;
    const substepSize = H / this.substeps;

    // Allocate arrays
    const z = new Array(n * (this.substeps + 1));
    for (let i = 0; i < n * (this.substeps + 1); i++) {
      z[i] = 0;
    }

    // Initialize: z0 = y0
    for (let i = 0; i < n; i++) {
      z[i] = y0[i];
    }

    // First substep: z1 = z0 + h * f(z0)
    const f0 = model.getDerivatives(0, y0);
    for (let i = 0; i < n; i++) {
      z[n + i] = z[i] + substepSize * f0[i];
    }

    // Subsequent substeps: z_{m+1} = z_{m-1} + 2h * f(z_m)
    for (let m = 1; m < this.substeps; m++) {
      const zm = new Array(n);
      for (let i = 0; i < n; i++) {
        zm[i] = z[m * n + i];
      }

      const fm = model.getDerivatives(m * substepSize, zm);

      for (let i = 0; i < n; i++) {
        z[(m + 1) * n + i] = z[(m - 1) * n + i] + 2 * substepSize * fm[i];
      }
    }

    // Final smoothing step to reduce numerical oscillations
    // y_new = 0.5 * (z_{n-1} + z_n + h * f(z_n))
    const zLast = new Array(n);
    for (let i = 0; i < n; i++) {
      zLast[i] = z[this.substeps * n + i];
    }

    const fLast = model.getDerivatives(H, zLast);

    const newState = new Array(n);
    for (let i = 0; i < n; i++) {
      newState[i] =
        0.5 * (z[(this.substeps - 1) * n + i] + z[this.substeps * n + i] + substepSize * fLast[i]);
    }

    model.setState(newState);
  }
}
