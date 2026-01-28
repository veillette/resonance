import { ReadOnlyProperty } from "scenerystack/axon";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";

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
 * Human-readable names for solver types (localized)
 */
export const SolverTypeName: Record<SolverType, ReadOnlyProperty<string>> = {
  [SolverType.RUNGE_KUTTA_4]: ResonanceStrings.common.solverNames.solverRK4StringProperty,
  [SolverType.ADAPTIVE_RK45]: ResonanceStrings.common.solverNames.solverAdaptiveRK45StringProperty,
  [SolverType.ADAPTIVE_EULER]: ResonanceStrings.common.solverNames.solverAdaptiveEulerStringProperty,
  [SolverType.MODIFIED_MIDPOINT]: ResonanceStrings.common.solverNames.solverModifiedMidpointStringProperty,
};
