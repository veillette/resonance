import { ReadOnlyProperty } from "scenerystack/axon";
import { ResonanceStrings } from "../../i18n/ResonanceStrings.js";

/**
 * Enumeration of available ODE solver types
 */
export enum SolverType {
  RUNGE_KUTTA_4 = "rk4",
  ADAPTIVE_RK45 = "adaptiveRK45",
  ANALYTICAL = "analytical",
}

/**
 * Human-readable names for solver types (localized)
 */
export const SolverTypeName: Record<SolverType, ReadOnlyProperty<string>> = {
  [SolverType.RUNGE_KUTTA_4]:
    ResonanceStrings.common.solverNames.solverRK4StringProperty,
  [SolverType.ADAPTIVE_RK45]:
    ResonanceStrings.common.solverNames.solverAdaptiveRK45StringProperty,
  [SolverType.ANALYTICAL]:
    ResonanceStrings.common.solverNames.solverAnalyticalStringProperty,
};

/**
 * Human-readable descriptions for solver types (localized)
 */
export const SolverTypeDescription: Record<
  SolverType,
  ReadOnlyProperty<string>
> = {
  [SolverType.RUNGE_KUTTA_4]:
    ResonanceStrings.preferences.solvers.rk4DescriptionStringProperty,
  [SolverType.ADAPTIVE_RK45]:
    ResonanceStrings.preferences.solvers.adaptiveRK45DescriptionStringProperty,
  [SolverType.ANALYTICAL]:
    ResonanceStrings.preferences.solvers.analyticalDescriptionStringProperty,
};
