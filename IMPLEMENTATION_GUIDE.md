This plan outlines the implementation of an **Analytical Solver** for a driven, damped harmonic oscillator. Unlike numerical integrators (RK4), this method uses the closed-form solution of the differential equation, treating parameter changes as "re-starts" with new initial conditions.

---

## 1. Mathematical Foundation

The simulation governs a mass-spring-damper system with a periodic driver. The equation of motion is:

### Handling Parameter Jumps

To maintain continuity when a user moves a slider (e.g., doubling the mass), we treat the instant of change as a new initial condition problem:

1. **Capture State:** Store and .
2. **Reset Reference Time:** Set a local time .
3. **Solve IVP:** Use the analytical solution

---

## 2. Implementation Steps

### Phase A: Core Logic (`AnalyticalSolver.ts`)

- **Create the Class:** Implement the `ODESolver` interface.
- **State Persistence:** Add private variables to store the "Initial State" () and the "Reference Time" at which the last parameter change occurred.
- **Detection Logic:** Compare current model parameters (m, k, b, etc.) against stored values from the previous frame. If any differ, trigger a **re-sync**:

- **Analytical Implementation:** Use the piecewise solution based on the damping ratio for Underdamped, Overdamped, Critically Damped

### Phase B: Integration & UI

- **`SolverType.ts`:** Add `ANALYTICAL` to the `SolverType` enum.
- **`ResonanceStrings.json`:** Add localized strings:
- `solverAnalytical`: "Analytical (Exact)"
- `solverAnalyticalDescription`: "Uses exact mathematical solutions. Perfectly stable and handles parameter changes by recalculating initial conditions."

- **`BaseModel.ts`:** Update the factory method `createSolver()` to instantiate `AnalyticalSolver` when selected.
- **`main.ts`:** Add a new radio button option to the **Preferences Menu**`.

---

## 3. Verification Plan

| Test Case        | Expected Behavior                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| **Steady State** | Analytical and RK4 solutions should overlap with minimal deviation.                               |
| **Mass Jump**    | When mass is changed mid-swing, the displacement curve must remain continuous (no "teleporting"). |
| **Zero Damping** | Ensure the solver doesn't hit a division-by-zero error when .                                     |
| **Persistence**  | Selecting "Analytical" in preferences should persist after a page refresh.                        |
