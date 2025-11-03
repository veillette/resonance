/**
 * Abstract base class for ODE (Ordinary Differential Equation) solvers
 * Solvers integrate equations of the form dy/dt = f(t, y)
 */

export interface ODEModel {
  /**
   * Get the current state vector
   */
  getState(): number[];

  /**
   * Set the state vector
   */
  setState(state: number[]): void;

  /**
   * Get the derivatives dy/dt for the current state
   * @param t - current time
   * @param state - current state vector
   * @returns derivatives vector
   */
  getDerivatives(t: number, state: number[]): number[];
}

export abstract class ODESolver {
  /**
   * Integrate the ODE system forward by dt
   * @param dt - time step in seconds
   * @param model - the model to integrate
   */
  public abstract step(dt: number, model: ODEModel): void;

  /**
   * Set the fixed timestep for the solver (if applicable)
   * @param fixedTimestep - the fixed timestep in seconds
   */
  public setFixedTimestep(fixedTimestep: number): void {
    // Default implementation does nothing
    // Override in subclasses that use fixed timesteps
  }
}
