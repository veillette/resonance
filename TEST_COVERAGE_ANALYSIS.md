# Test Coverage Analysis for Resonance

## Executive Summary

**Current Test Coverage: 0%**

The Resonance codebase has **no automated tests**. There is no testing framework configured, no test files, and no test script in `package.json`. This analysis identifies critical areas that need test coverage and provides specific recommendations for implementation.

---

## Recommended Testing Framework Setup

Add Vitest (which integrates well with the existing Vite build):

```bash
npm install -D vitest @vitest/coverage-v8
```

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## Priority 1: Critical Physics Model Tests

### 1.1 ResonanceModel Core Physics (`src/common/model/ResonanceModel.ts`)

**Why critical**: This is the heart of the simulation. Physics calculation errors would make the entire application incorrect.

| Test Case                     | Expected Behavior                                      | Lines   |
| ----------------------------- | ------------------------------------------------------ | ------- |
| Natural frequency calculation | `ω₀ = √(k/m)` should match formula                     | 74-77   |
| Natural frequency in Hz       | `f₀ = ω₀/(2π)` should convert correctly                | 80-83   |
| Damping ratio calculation     | `ζ = b/(2√(mk))` for various regimes                   | 86-89   |
| Kinetic energy                | `KE = ½mv²`                                            | 92-95   |
| Potential energy              | `PE = ½kx² - mgx` (with and without gravity)           | 99-102  |
| Total energy conservation     | With `b=0` and no driving, energy should stay constant | 105-108 |
| Phase angle at resonance      | Should be `π/2` when `ω = ω₀`                          | 113-135 |
| State get/set roundtrip       | `setState(getState())` should preserve state           | 141-156 |
| Derivatives calculation       | Springs, damping, gravity, driving forces              | 169-198 |
| Reset functionality           | All properties return to defaults                      | 203-223 |
| Preset application            | All preset values applied correctly                    | 228-236 |

**Suggested test file**: `src/common/model/__tests__/ResonanceModel.test.ts`

```typescript
// Example test structure
describe("ResonanceModel", () => {
  describe("natural frequency", () => {
    it("should calculate ω₀ = √(k/m) for default values", () => {
      const model = new ResonanceModel(mockPreferences);
      // k=100, m=0.25 → ω₀ = √(100/0.25) = 20 rad/s
      expect(model.naturalFrequencyProperty.value).toBeCloseTo(20, 5);
    });

    it("should update when mass changes", () => {
      /* ... */
    });
    it("should update when spring constant changes", () => {
      /* ... */
    });
  });

  describe("damping ratio", () => {
    it("should identify underdamped (ζ < 1)", () => {
      /* ... */
    });
    it("should identify critically damped (ζ = 1)", () => {
      /* ... */
    });
    it("should identify overdamped (ζ > 1)", () => {
      /* ... */
    });
  });

  describe("energy conservation", () => {
    it("should conserve total energy when b=0 and no driving", () => {
      // Step simulation, verify E_total stays constant
    });
  });
});
```

### 1.2 ODE Solvers (`src/common/model/*Solver.ts`)

**Why critical**: Numerical integration errors compound over time and produce incorrect physics.

| Solver                     | Test Cases                                                         |
| -------------------------- | ------------------------------------------------------------------ |
| **RungeKuttaSolver**       | 4th-order accuracy, subdivision handling, state preservation       |
| **AdaptiveRK45Solver**     | Error tolerance, step size adaptation, Dormand-Prince coefficients |
| **AdaptiveEulerSolver**    | Adaptive stepping, error estimation                                |
| **ModifiedMidpointSolver** | Midpoint correction, substep handling                              |

**Key tests for all solvers**:

1. **Simple harmonic oscillator** - Verify amplitude stays constant (energy conservation)
2. **Known analytical solutions** - Compare with `x(t) = A*cos(ω₀t)` for undamped oscillator
3. **Convergence** - Smaller timestep → more accurate result
4. **All solvers produce similar results** - For same problem, different solvers should agree within tolerance

**Suggested test file**: `src/common/model/__tests__/ODESolvers.test.ts`

```typescript
describe("ODE Solvers", () => {
  const solvers = [
    new RungeKuttaSolver(0.001),
    new AdaptiveRK45Solver(),
    new AdaptiveEulerSolver(),
    new ModifiedMidpointSolver(0.001, 4),
  ];

  describe.each(solvers)("$constructor.name", (solver) => {
    it("should conserve energy for undamped oscillator", () => {
      // Create model with b=0, no driving
      // Step for 10 seconds
      // Verify total energy change < 0.1%
    });

    it("should match analytical solution for simple harmonic motion", () => {
      // x(t) = x₀*cos(ω₀t)
      // Step and compare at t=0.5, 1.0, 2.0, 5.0 seconds
    });
  });
});
```

### 1.3 BaseModel Time Management (`src/common/model/BaseModel.ts`)

| Test Case              | Expected Behavior                           |
| ---------------------- | ------------------------------------------- |
| Play/pause control     | Steps only when `isPlayingProperty` is true |
| Force step             | `step(dt, true)` works even when paused     |
| Time speed multipliers | `slow=0.5x`, `normal=1x`, `fast=2x`         |
| dt capping             | Large dt values capped at 100ms             |
| Solver switching       | Changing solver type creates correct solver |

---

## Priority 2: SimModel Multi-Resonator Logic

### 2.1 SimModel Configuration Modes (`src/screen-name/model/SimModel.ts`)

**Why important**: Complex logic that determines how multiple oscillators are configured.

| Mode                     | Test Cases                                                            |
| ------------------------ | --------------------------------------------------------------------- |
| **SAME_MASS**            | All masses equal, spring constants vary to achieve target frequencies |
| **SAME_SPRING_CONSTANT** | All k equal, masses vary to achieve target frequencies                |
| **MIXED**                | Both scale proportionally, all frequencies equal                      |
| **SAME_FREQUENCY**       | k/m ratio constant, all have same natural frequency                   |
| **CUSTOM**               | Parameters remain unchanged when set manually                         |

**Additional tests**:

1. **Frequency distribution** - Frequencies evenly distributed from 1.0 Hz to 5.5 Hz
2. **Parameter synchronization** - Driving force, damping, gravity sync across all resonators
3. **Selection clamping** - Selected index adjusts when resonator count decreases
4. **Base parameter changes** - Updating base resonator recalculates others

**Suggested test file**: `src/screen-name/model/__tests__/SimModel.test.ts`

```typescript
describe("SimModel", () => {
  describe("SAME_MASS mode", () => {
    it("should distribute frequencies from 1 Hz to 5.5 Hz", () => {
      model.resonatorCountProperty.value = 10;
      model.resonatorConfigProperty.value = ResonatorConfigMode.SAME_MASS;

      expect(model.getNaturalFrequencyHz(0)).toBeCloseTo(1.0, 1);
      expect(model.getNaturalFrequencyHz(9)).toBeCloseTo(5.5, 1);
    });

    it("should keep all masses equal", () => {
      model.resonatorCountProperty.value = 5;
      const masses = [0, 1, 2, 3, 4].map((i) => model.getMass(i));
      expect(new Set(masses).size).toBe(1); // All same
    });
  });
});
```

---

## Priority 3: Utility Classes

### 3.1 CircularUpdateGuard (`src/common/util/CircularUpdateGuard.ts`)

| Test Case          | Expected                                 |
| ------------------ | ---------------------------------------- |
| Single execution   | Callback runs, returns true              |
| Reentrant call     | Callback skipped, returns false          |
| isUpdating flag    | True during callback, false before/after |
| Exception handling | Flag reset even if callback throws       |

**Suggested test file**: `src/common/util/__tests__/CircularUpdateGuard.test.ts`

```typescript
describe("CircularUpdateGuard", () => {
  it("should prevent circular updates", () => {
    const guard = new CircularUpdateGuard();
    let innerRan = false;

    guard.run(() => {
      guard.run(() => {
        innerRan = true;
      });
    });

    expect(innerRan).toBe(false);
  });
});
```

### 3.2 ListenerTracker (if exists)

Test that listeners are properly registered and cleaned up to prevent memory leaks.

---

## Priority 4: Preferences Persistence

### 4.1 ResonancePreferencesModel (`src/preferences/ResonancePreferencesModel.ts`)

| Test Case            | Expected                             |
| -------------------- | ------------------------------------ |
| Default values       | All properties have correct defaults |
| Persistence save     | Changes saved to localStorage        |
| Persistence load     | Values restored on construction      |
| Invalid storage data | Graceful handling, uses defaults     |
| Reset functionality  | All values return to defaults        |

**Note**: These tests need to mock `localStorage`.

```typescript
describe("ResonancePreferencesModel", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should persist solver type changes", () => {
    const model = new ResonancePreferencesModel();
    model.solverTypeProperty.value = SolverType.ADAPTIVE_RK45;

    const saved = JSON.parse(localStorage.getItem("resonance-preferences")!);
    expect(saved.solverType).toBe(SolverType.ADAPTIVE_RK45);
  });
});
```

---

## Priority 5: Integration Tests

### 5.1 Full Simulation Integration

| Test Case                       | What to Verify                           |
| ------------------------------- | ---------------------------------------- |
| Resonance behavior              | Amplitude increases when `f_drive ≈ f₀`  |
| Damping decay                   | Amplitude decays exponentially with time |
| Preset loading                  | All presets produce expected behavior    |
| Solver switching mid-simulation | Simulation continues correctly           |
| Reset during simulation         | All state returns to initial             |

### 5.2 End-to-End Scenarios

```typescript
describe('Resonance simulation', () => {
  it('should demonstrate resonance when driving at natural frequency', () => {
    const model = new ResonanceModel(mockPreferences);
    model.drivingFrequencyProperty.value = model.naturalFrequencyHzProperty.value;
    model.drivingEnabledProperty.value = true;

    // Record initial amplitude
    const initialAmplitude = Math.abs(model.positionProperty.value);

    // Step for 20 seconds
    for (let i = 0; i < 2000; i++) {
      model.step(0.01, true);
    }

    // Amplitude should grow significantly
    const maxPosition = /* track max during stepping */;
    expect(maxPosition).toBeGreaterThan(initialAmplitude * 5);
  });
});
```

---

## Testing Recommendations Summary

### Immediate Actions (Week 1)

1. Set up Vitest testing framework
2. Write tests for `ResonanceModel` core physics calculations
3. Write tests for ODE solvers with energy conservation verification

### Short-term (Week 2-3)

4. Test `SimModel` configuration modes
5. Test `CircularUpdateGuard` utility
6. Test `ResonancePreferencesModel` persistence

### Medium-term (Week 4+)

7. Integration tests for full simulation behavior
8. Performance benchmarks for ODE solvers
9. Edge case testing (extreme parameter values)

---

## Code Coverage Goals

| Category        | Target Coverage       |
| --------------- | --------------------- |
| Physics models  | 90%+                  |
| ODE solvers     | 85%+                  |
| Utilities       | 95%+                  |
| Preferences     | 80%+                  |
| View components | 60%+ (harder to test) |
| **Overall**     | **80%+**              |

---

## Files Requiring Tests (by priority)

| Priority | File                                           | Reason                |
| -------- | ---------------------------------------------- | --------------------- |
| P0       | `src/common/model/ResonanceModel.ts`           | Core physics          |
| P0       | `src/common/model/RungeKuttaSolver.ts`         | Primary solver        |
| P0       | `src/common/model/AdaptiveRK45Solver.ts`       | Adaptive solver       |
| P1       | `src/screen-name/model/SimModel.ts`            | Multi-resonator logic |
| P1       | `src/common/model/BaseModel.ts`                | Time management       |
| P2       | `src/common/util/CircularUpdateGuard.ts`       | Utility class         |
| P2       | `src/preferences/ResonancePreferencesModel.ts` | Persistence           |
| P3       | `src/common/model/AdaptiveEulerSolver.ts`      | Alternative solver    |
| P3       | `src/common/model/ModifiedMidpointSolver.ts`   | Alternative solver    |

---

## Risks of No Testing

1. **Physics bugs go undetected** - Incorrect resonance behavior, energy not conserving
2. **Regression on refactoring** - Recent commits show active refactoring (circular update guards, nomenclature changes)
3. **Solver accuracy unknown** - No verification that numerical integration is correct
4. **Configuration mode bugs** - Complex logic in SimModel untested
5. **Preference persistence issues** - Data loss or corruption undetected

---

_Analysis generated: 2026-01-29_
