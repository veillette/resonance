/**
 * Enumeration of available ODE solver types
 */
export enum SolverType {
  RUNGE_KUTTA_4 = "rk4",
  ADAPTIVE_RK45 = "adaptiveRK45",
  ADAPTIVE_EULER = "adaptiveEuler",
  MODIFIED_MIDPOINT = "modifiedMidpoint",
}

/**
 * Human-readable names for solver types
 */
export const SolverTypeName: Record<SolverType, string> = {
  [SolverType.RUNGE_KUTTA_4]: "Runge-Kutta 4th Order",
  [SolverType.ADAPTIVE_RK45]: "Adaptive RK45",
  [SolverType.ADAPTIVE_EULER]: "Adaptive Euler",
  [SolverType.MODIFIED_MIDPOINT]: "Modified Midpoint",
};
