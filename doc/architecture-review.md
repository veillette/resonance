# Architecture Review: Resonance Simulation

A thorough analysis of the codebase architecture, encapsulation, and separation of concerns.

---

## Executive Summary

Resonance is a well-structured physics simulation with strong foundations: a clean solver abstraction, proper reactive state management via SceneryStack Properties, comprehensive test coverage (352+ unit tests), and a well-organized screen-based architecture. The codebase demonstrates good understanding of both the physics domain and the framework patterns.

That said, several structural issues limit maintainability and extensibility. The most significant are: **ResonanceModel carrying too many responsibilities** (1100+ lines mixing physics, analytics, visualization, and configuration), **duplicated graph setup across screens**, **tight parameter synchronization coupling** in the multi-oscillator model, and **a 443-line `main.ts` that inlines an entire preferences UI**. Below is a detailed breakdown with prioritized recommendations.

---

## 1. Model Layer

### 1.1 ResonanceModel — God Object Tendencies

**File:** `src/common/model/ResonanceModel.ts` (~1100 lines)

This is the most significant architectural concern. ResonanceModel combines at least four distinct responsibilities:

| Responsibility | Lines (approx.) | Description |
|---|---|---|
| Physics integration | ~100 | `getState()`, `setState()`, `getDerivatives()` |
| 140+ derived properties | ~600 | Analytical steady-state, impedance, energy, phase, RMS, bandwidth, Q factor, etc. |
| Preset system | ~50 | 6 predefined configurations |
| Sub-step data collection | ~40 | Buffer management for graph visualization |

**Problems:**
- Cannot reuse the physics engine without dragging along all 140+ analytical properties.
- Cannot test analytical derivations without instantiating the full model.
- The sub-step data buffer (`subStepCollectionEnabled`, `subStepDataBuffer`, `flushSubStepData()`) is a visualization concern living inside the physics model.
- Adding a new derived property means editing this already-large file.

**Recommendation:** Extract concerns into composable pieces:
1. Keep `ResonanceModel` focused on the ODE state, parameters, and `getDerivatives()`.
2. Move analytical properties into an `AnalyticalProperties` class (or factory) that accepts the model and creates DerivedProperty instances.
3. Move preset definitions to a `Presets` constant or `PresetManager`.
4. Move sub-step buffering to the view layer or a dedicated `SubStepCollector` class that wraps the solver callback.

### 1.2 BaseOscillatorScreenModel — Implicit Synchronization Web

**File:** `src/common/model/BaseOscillatorScreenModel.ts` (~400 lines)

The `syncSharedParameters()` method creates 7 property links from the reference model to each of the 10 resonators (70 total listener registrations). This creates a complex implicit dependency web:

```
referenceModel.drivingFrequencyProperty ──link──→ resonator[1].drivingFrequencyProperty
                                         ──link──→ resonator[2].drivingFrequencyProperty
                                         ...
                                         ──link──→ resonator[9].drivingFrequencyProperty
(× 7 shared properties)
```

**Problems:**
- Adding a new shared parameter requires changes in a non-obvious location.
- No unsubscription mechanism if resonator count changes (listeners persist on inactive resonators).
- Debugging data flow is difficult — there is no centralized list of what syncs.
- The `CircularUpdateGuard` usage, while necessary, indicates the synchronization topology is fragile.

**Recommendation:** Create an explicit `SharedParameterSet` that defines which properties sync and provides a single loop to propagate values. This makes the sync surface area visible and testable.

### 1.3 Solver Architecture — Clean Interface, Unsafe Cast

The solver hierarchy (`ODESolver` → `RungeKuttaSolver`, `AdaptiveRK45Solver`, `AnalyticalSolver`) is one of the cleanest parts of the architecture. The strategy pattern is well-applied and the three implementations are genuinely different algorithms behind a common interface.

**One concern:** `AnalyticalSolver` requires an extended interface (`AnalyticalODEModel` with `massProperty`, `springConstantProperty`, etc.) but enforces this via an unsafe runtime cast:

```typescript
const m = model as AnalyticalODEModel; // No compile-time guarantee
```

If someone creates a new model type and selects the analytical solver, this fails at runtime with a cryptic error.

**Recommendation:** Either:
- Validate the interface at solver creation time (fail fast with a descriptive error), or
- Use a factory that pairs solvers with compatible model types at the type level.

### 1.4 Solver Factory in BaseModel

`BaseModel.createSolver()` uses a switch statement that must be edited whenever a new solver is added:

```typescript
switch (solverType) {
  case SolverType.RUNGE_KUTTA_4: return new RungeKuttaSolver(0.001);
  case SolverType.ADAPTIVE_RK45: return new AdaptiveRK45Solver();
  case SolverType.ANALYTICAL: return new AnalyticalSolver();
}
```

This is a minor open/closed principle violation. A solver registry map would be more extensible, though for only three solvers the current approach is acceptable.

---

## 2. View Layer

### 2.1 Duplicated Graph Setup Across Screens

**Files:** `SingleOscillatorScreenView.ts` and `PhaseAnalysisScreenView.ts`

Both screens contain nearly identical code (~120 lines each) for:
1. Defining `PlottableProperty[]` arrays
2. Creating a `ConfigurableGraph` instance
3. Linking graph visibility to `subStepCollectionEnabled`
4. Adding data points in `step()`
5. Creating a visibility checkbox

The only difference is which properties appear in the plottable list and default axis selections.

**Recommendation:** Extract a `createConfigurableGraph(options: { plottableProperties, defaultX, defaultY, ... })` helper method — either on `BaseOscillatorScreenView` or as a standalone factory — that encapsulates the shared setup. Screen-specific views would only provide the property list and defaults.

### 2.2 Empty Placeholder Subclasses

Three files exist solely as empty extensions:
- `MultipleOscillatorsModel` (15 lines, empty)
- `MultipleOscillatorsScreenView` (19 lines, empty)
- `PhaseAnalysisModel` (16 lines, empty)

These add maintenance overhead without providing value. If future customization is anticipated, a comment in the base class or a TODO would communicate intent more clearly than an empty file.

**Recommendation:** Either remove the subclasses and use the base classes directly (passing options for behavioral differences), or document specifically what customization is planned.

### 2.3 GraphInteractionHandler — Massive Single-Responsibility Violation

**File:** `src/common/view/graph/GraphInteractionHandler.ts` (~1145 lines)

This single class handles:
- Mouse wheel zoom
- Touch pinch zoom (full chart, X-axis only, Y-axis only)
- Mouse drag pan
- Touch drag pan
- Keyboard pan
- Corner resize handles
- Axis-specific interaction regions

The three touch zoom methods (`setupTouchZoomControls`, `setupYAxisTouchControls`, `setupXAxisTouchControls`) contain ~400 lines of near-identical code.

**Recommendation:**
1. Extract a `PinchZoomHandler` that handles the common pinch logic and accepts an axis constraint parameter.
2. Extract a `PanHandler` for drag/keyboard panning.
3. Extract a `ResizeHandler` for the corner handles.
4. Keep `GraphInteractionHandler` as a thin coordinator.

### 2.4 BaseOscillatorScreenView Constructor Complexity

The constructor is ~276 lines, creating and wiring together 15+ visual subsystems. While each subsystem is individually reasonable, the monolithic constructor makes it hard to understand initialization order and dependencies.

**Recommendation:** Break into named private factory methods (`createDriverElements()`, `createGridAndTrace()`, `createResonatorNodes()`, `createControlPanels()`). This doesn't change the architecture but makes the constructor readable and each subsystem independently reviewable.

### 2.5 String-Based Property Matching in ConfigurableGraph

`ConfigurableGraph` maps sub-step data to plottable properties using `String.includes()` on property names:

```typescript
if (lowerName.includes("time")) return point.time;
if (lowerName.includes("position") || lowerName.includes("displacement")) ...
```

This is fragile: localized property names would break it, and there's no compile-time guarantee of coverage.

**Recommendation:** Use a type-safe mapping — either a `Map<PlottableProperty, (point: SubStepDataPoint) => number>` or add a `subStepAccessor` field to `PlottableProperty`.

---

## 3. Encapsulation

### 3.1 Public Mutable State Without Invariant Enforcement

All `ResonanceModel` properties are `public readonly` (meaning the reference is readonly, but the property's `value` is freely writable from any consumer):

```typescript
public readonly positionProperty: NumberProperty; // Anyone can set .value
public readonly massProperty: NumberProperty;     // No validation
```

There is no distinction between:
- **User-settable parameters** (mass, spring constant, damping) — legitimately writable from UI
- **Solver-managed state** (position, velocity) — should only be written by the solver
- **Accumulated quantities** (driverEnergy, thermalEnergy) — should only be written by integration

The view can directly mutate `positionProperty.value`, bypassing the solver entirely. The `isDraggingProperty` flag is the only guard, and it's enforced by convention, not the type system.

**Recommendation:** Consider exposing solver-managed state as `TReadOnlyProperty<number>` publicly, with internal `NumberProperty` access available only to the solver via a package-private pattern or a `setState()` method.

### 3.2 Sub-Step Collection Flag

```typescript
public subStepCollectionEnabled: boolean = false; // Public mutable boolean flag
```

The view must remember to:
1. Set `model.subStepCollectionEnabled = true` before stepping
2. Step the model
3. Call `model.flushSubStepData()` after stepping

This protocol is enforced by convention only. Multiple consumers could conflict. There's no lifecycle management.

**Recommendation:** Replace with a callback-based or subscription-based approach:
```typescript
const unsubscribe = model.onSubStepData((point: SubStepDataPoint) => {
  graph.addPoint(point);
});
```

### 3.3 CircularUpdateGuard — Necessary But Symptomatic

The `CircularUpdateGuard` is well-implemented (exception-safe, reentrant-preventing). However, its widespread use (in `BaseOscillatorScreenModel`, `OscillatorControlPanel`, `OscillatorResonatorNodeBuilder`, `OscillatorDriverControlNode`) suggests the bidirectional binding pattern is overused.

Each guard instance represents a place where two-way data flow creates the risk of infinite loops. This is a symptom of unclear ownership — if it's ambiguous who "owns" a value, guards become necessary.

**Recommendation:** Audit each guard usage to determine if true bidirectional binding is needed, or if one direction could be eliminated by making one side derived/read-only.

---

## 4. Separation of Concerns

### 4.1 `main.ts` Inlines 350+ Lines of Preferences UI

**File:** `src/main.ts` (443 lines)

The `createContent` callback for custom preferences builds an entire UI tree inline — radio button groups, checkboxes, VBox layouts, text labels — all inside the `onReadyToLaunch()` callback. This is the second-largest file in the project.

**Problems:**
- The entry point should be thin: create preferences, create screens, launch sim.
- The preferences UI construction belongs in a dedicated view class.
- Testing the preferences UI requires launching the entire simulation.

**Recommendation:** Extract to `src/preferences/ResonancePreferencesNode.ts`:
```typescript
export class ResonancePreferencesNode extends VBox {
  constructor(preferencesModel: ResonancePreferencesModel) { ... }
}
```
Then `main.ts` becomes ~30 lines.

### 4.2 Chladni Screen — Separate Universe

The Chladni screen shares almost no code with the oscillator screens beyond utilities (`ResonanceColors`, `ResonanceConstants`, `ResonanceStrings`) and `FrequencySweepController`. It has its own:
- Model architecture (no `BaseModel` or `BaseOscillatorScreenModel`)
- View architecture (directly extends `ScreenView`, not `BaseOscillatorScreenView`)
- Physics system (modal superposition vs. ODE integration)
- Particle system (unique to Chladni)
- Rendering strategy (Canvas/WebGL, unique to Chladni)

This is architecturally appropriate — the Chladni physics is fundamentally different. However, the `FrequencySweepController` in `src/chladni-patterns/model/` is a separate file from `src/common/model/FrequencySweepController.ts`, creating potential confusion about which is used where.

**Recommendation:** Either:
- If the Chladni sweep controller is meaningfully different, document why it exists separately.
- If they share logic, extract a common base and have screen-specific extensions.

### 4.3 ResonanceConstants — Mixed Abstraction Levels

`ResonanceConstants` contains both physics constants and view layout values in a single flat object:

```typescript
// Physics
FREQUENCY_RANGE: new Range(0.0, 6),
MASS_RANGE: new Range(0.1, 5.0),

// View layout
EQUILIBRIUM_VIEW_X: 300,
DRIVER_PLATE_HEIGHT_VIEW: 10,
CONTROL_PANEL_WIDTH: 200,
```

**Recommendation:** Group constants by domain:
```typescript
ResonanceConstants.physics.FREQUENCY_RANGE
ResonanceConstants.layout.EQUILIBRIUM_VIEW_X
ResonanceConstants.rendering.SPRING_LINE_WIDTH
```

### 4.4 Preferences Persistence — Tight localStorage Coupling

`ResonancePreferencesModel` directly calls `localStorage.setItem()` and `localStorage.getItem()`. Each property change triggers a full JSON serialization and write (6 separate `link()` calls, one per property).

**Problems:**
- No batching: changing 5 properties writes to storage 5 times.
- No storage abstraction: can't swap to IndexedDB, sessionStorage, or in-memory for tests.
- Testing requires `vi.spyOn(Storage.prototype, ...)`.

**Recommendation:** Inject a storage adapter and add a batch/debounce mechanism:
```typescript
constructor(storage: StorageAdapter = new LocalStorageAdapter()) { ... }
```

---

## 5. Testing

### 5.1 Strengths

- **352+ unit tests** with vitest, well-organized in `__tests__/` directories
- **Fuzz testing** via Playwright with seed reproducibility
- **WCAG contrast ratio checks** in color tests
- **Edge case coverage** (invalid JSON, localStorage failures, circular update prevention)
- **Clean test structure** using describe/it/expect with proper lifecycle hooks

### 5.2 Gaps

- **No integration tests**: The oscillator screen models are complex compositions (reference model + 10 resonators + sweep controller + config modes) but are only tested through their parts.
- **No view tests**: Control panels, graph, and trace node have no unit tests. These contain significant logic (bidirectional sync, coordinate transforms, clipping).
- **Fuzz tests use random clicks**: The configuration stress test clicks randomly on the page. Targeted interaction sequences (e.g., rapid preset switching, extreme slider values, sweep + drag simultaneously) would find more bugs.

**Recommendation:** Add integration tests for:
1. `BaseOscillatorScreenModel` — test parameter sync across resonators, config mode switching, sweep lifecycle.
2. Screen views — test graph data collection, trace accumulation, vector updates.

---

## 6. Hardcoded Values and Magic Numbers

The codebase has many scattered magic numbers without named constants:

| Location | Value | Purpose |
|---|---|---|
| OscillatorTraceNode | `0.1, 1.0, 2.0` | Time speed multipliers (duplicated from BaseModel) |
| OscillatorResonatorNodeBuilder | `150`, `50` | Drag/shift speeds (px/s) |
| OscillatorMeasurementLinesNode | `-0.4`, `0.3`, `0.14` | Displacement bounds and initial position |
| OscillatorGridNode | `0.0001` | Floating-point tolerance for equilibrium line |
| GraphInteractionHandler | `1.1` | Zoom factor per wheel tick |
| GraphInteractionHandler | `200`, `150` | Minimum resize dimensions |
| ConfigurableGraph | `4` | Decimation factor |
| SweepButton | `1.5`, `6` | Icon chirp frequencies |

**Recommendation:** Move to `ResonanceConstants` (grouped by domain) so they are discoverable, documented, and changeable from one location.

---

## 7. Dependency Management

### 7.1 Single Production Dependency

The project has only `scenerystack ^3.0.0` as a production dependency. This is excellent for bundle size and supply chain security. The framework handles rendering, UI components, math, accessibility, and audio.

### 7.2 Import Chain Fragility

The mandatory import order (`init → assert → splash → brand → main`) is a framework constraint. It's well-documented in both `CLAUDE.md` and code comments. However, there is no automated enforcement — a developer could accidentally import from `scenerystack/scenery` before `init.ts` runs and get a silent failure.

**Recommendation:** Consider adding an ESLint rule or a build-time check that validates the import chain.

---

## 8. Prioritized Recommendations

### High Priority (Structural Improvements)

| # | Recommendation | Effort | Impact |
|---|---|---|---|
| 1 | **Extract ResonanceModel analytical properties** into a composable class | Medium | Reduces god object, enables isolated testing |
| 2 | **Extract preferences UI from main.ts** into `ResonancePreferencesNode` | Low | Clean entry point, testable preferences |
| 3 | **Deduplicate graph setup** across Single/Phase screens | Low | Eliminates ~120 lines of duplication |
| 4 | **Replace string-based property matching** in ConfigurableGraph with type-safe mapping | Low | Eliminates fragile string matching |

### Medium Priority (Encapsulation Improvements)

| # | Recommendation | Effort | Impact |
|---|---|---|---|
| 5 | **Distinguish read-only vs writable properties** on ResonanceModel | Medium | Prevents accidental state corruption |
| 6 | **Replace sub-step collection flag** with subscription pattern | Low | Cleaner API, supports multiple consumers |
| 7 | **Extract GraphInteractionHandler** into Zoom/Pan/Resize handlers | Medium | Eliminates ~400 lines of duplication |
| 8 | **Centralize magic numbers** into ResonanceConstants | Low | Single source of truth |

### Lower Priority (Refinements)

| # | Recommendation | Effort | Impact |
|---|---|---|---|
| 9 | **Group ResonanceConstants** by domain (physics/layout/rendering) | Low | Better discoverability |
| 10 | **Abstract localStorage** behind a storage adapter | Low | Testability, batching |
| 11 | **Add integration tests** for BaseOscillatorScreenModel | Medium | Catches sync/config bugs |
| 12 | **Remove or justify empty subclasses** | Low | Reduces file count, clarifies intent |
| 13 | **Validate AnalyticalSolver interface** at creation time | Low | Fail-fast with clear error |
| 14 | **Break BaseOscillatorScreenView constructor** into factory methods | Low | Readability |
| 15 | **Complete StringManager deprecation** | Low | Removes redundant API |

---

## 9. What the Codebase Does Well

To be balanced, these are genuine strengths:

1. **Solver abstraction**: Three fundamentally different ODE solvers (RK4, adaptive RK45, analytical) behind a clean interface — this is textbook strategy pattern done right.
2. **Property-based reactivity**: Consistent use of SceneryStack Properties means state changes propagate reliably. DerivedProperty is used extensively and correctly.
3. **Accessibility**: ProfileColorProperty with projector mode, keyboard navigation, ARIA labels, utterance queue alerts, and WCAG contrast ratio testing.
4. **Physics correctness**: The analytical solver handles all three damping regimes (underdamped, critically damped, overdamped) with proper initial condition re-solving on parameter changes.
5. **Test quality**: Tests check behavior, not implementation. Edge cases are covered. The fuzz testing approach is pragmatic.
6. **Performance optimization**: Object pooling in ParticleManager, TypedArray use in ModalCalculator, lazy sub-step collection, canvas/WebGL rendering strategy — performance-sensitive code is well-optimized.
7. **Documentation**: `CLAUDE.md`, `doc/model.md`, and `doc/implementation-notes.md` provide excellent context. Inline physics comments include equation references.
8. **Chladni screen independence**: Correctly identified that 2D plate physics is a different domain from 1D oscillator physics and didn't force shared abstractions where none belong.
