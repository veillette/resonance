# CLAUDE.md - AI Assistant Guide for Resonance

This document provides essential information for AI assistants working with the Resonance physics simulation codebase.

## Project Overview

Resonance is an interactive physics simulation demonstrating resonance phenomena in oscillating systems and Chladni plate vibration patterns. Built with [SceneryStack](https://scenerystack.org/), a simulation framework from PhET Interactive Simulations.

**Four simulation screens:**

1. **Single Oscillator** - A single driven, damped harmonic oscillator
2. **Multiple Oscillators** - Multiple oscillators with different natural frequencies
3. **Phase Analysis** - Phase relationships in driven oscillators
4. **Chladni Patterns** - Visualization of Chladni patterns showing 2D plate vibration modes

The first three screens share common base classes (`BaseOscillatorScreenModel`, `BaseOscillatorScreenView`) and can be customized independently.

## Technology Stack

- **SceneryStack** (`scenerystack` v3.x) - Physics simulation framework
- **TypeScript** - Strict mode enabled with `noUncheckedIndexedAccess`
- **Vite** - Development server and bundler
- **Vitest** - Unit testing with jsdom environment
- **Playwright** - End-to-end and fuzz testing
- **ESLint** - Type-aware linting for `src/` directory

## Quick Start Commands

```bash
npm start           # Development server at http://localhost:5173
npm run build       # Production build (runs tsc then vite build)
npm run check       # TypeScript type checking without emit
npm run lint        # ESLint checking
npm test            # Unit tests (Vitest)
npm run test:fuzz   # Fuzz testing (Playwright, 60s default)
npm run test:fuzz:quick   # Quick fuzz test (30s)
npm run test:fuzz:long    # Long fuzz test (5min)
```

## Project Structure

```
resonance/
├── src/
│   ├── init.ts              # Simulation metadata initialization
│   ├── assert.ts            # Assertion enablement
│   ├── splash.ts            # Splash screen setup
│   ├── brand.ts             # Branding configuration
│   ├── main.ts              # Entry point - creates Sim instance
│   ├── common/
│   │   ├── ResonanceColors.ts    # ProfileColorProperty definitions
│   │   ├── ResonanceConstants.ts # Magic numbers, ranges, layout constants
│   │   ├── ResonanceNamespace.ts # Namespace for color profiles
│   │   ├── model/                # ODE solvers, base model, physics
│   │   │   ├── ODESolver.ts           # Abstract solver interface
│   │   │   ├── RungeKuttaSolver.ts    # RK4, fixed 1ms steps (default)
│   │   │   ├── AdaptiveRK45Solver.ts  # Adaptive RK4/5 with error control
│   │   │   ├── AnalyticalSolver.ts    # Closed-form steady-state solver
│   │   │   ├── BaseModel.ts           # Abstract model with time management
│   │   │   ├── BaseOscillatorScreenModel.ts  # Shared oscillator screen model
│   │   │   ├── ResonanceModel.ts      # Single oscillator physics + analytical properties
│   │   │   ├── MeasurementLineModel.ts # Measurement line model
│   │   │   ├── TraceDataModel.ts      # Trace/grid scrolling data
│   │   │   ├── FrequencySweepController.ts  # Frequency sweep (all oscillator screens)
│   │   │   ├── ResonatorConfigMode.ts # Resonator configuration modes
│   │   │   └── SolverType.ts          # Solver enumeration
│   │   ├── view/                 # Shared view components
│   │   │   ├── BaseOscillatorScreenView.ts   # Shared oscillator screen view
│   │   │   ├── OscillatorControlPanel.ts     # Shared control panel (with presets)
│   │   │   ├── OscillatorDriverControlNode.ts
│   │   │   ├── OscillatorPlaybackControlNode.ts
│   │   │   ├── OscillatorResonatorNodeBuilder.ts
│   │   │   ├── OscillatorMeasurementLinesNode.ts
│   │   │   ├── OscillatorTraceNode.ts        # Trace visualization with grid scroll
│   │   │   ├── OscillatorGridNode.ts         # Background grid
│   │   │   ├── SweepButton.ts                # Frequency sweep button
│   │   │   ├── NumberControlFactory.ts       # Reusable number control builder
│   │   │   ├── KeyboardShortcutsNode.ts
│   │   │   └── graph/                        # Configurable graph components
│   │   │       ├── ConfigurableGraph.ts      # Multi-plot phase-space graph
│   │   │       ├── GraphDataManager.ts       # Graph data collection
│   │   │       ├── GraphControlsPanel.ts     # Graph axis controls
│   │   │       ├── GraphInteractionHandler.ts
│   │   │       ├── PlottableProperty.ts      # Property metadata for plotting
│   │   │       └── GraphDataConstants.ts
│   │   └── util/                 # Utility classes
│   │       ├── ListenerTracker.ts
│   │       └── CircularUpdateGuard.ts
│   ├── single-oscillator/    # Single Oscillator screen
│   │   ├── SingleOscillatorScreen.ts
│   │   ├── model/
│   │   │   └── SingleOscillatorModel.ts  # Extends BaseOscillatorScreenModel
│   │   └── view/
│   │       └── SingleOscillatorScreenView.ts  # Extends BaseOscillatorScreenView
│   ├── multiple-oscillators/ # Multiple Oscillators screen
│   │   ├── MultipleOscillatorsScreen.ts
│   │   ├── model/
│   │   │   └── MultipleOscillatorsModel.ts
│   │   └── view/
│   │       └── MultipleOscillatorsScreenView.ts
│   ├── phase-analysis/       # Phase Analysis screen
│   │   ├── PhaseAnalysisScreen.ts
│   │   ├── model/
│   │   │   └── PhaseAnalysisModel.ts
│   │   └── view/
│   │       └── PhaseAnalysisScreenView.ts
│   ├── chladni-patterns/     # Chladni Patterns screen
│   │   ├── ChladniScreen.ts
│   │   ├── model/
│   │   │   ├── ChladniModel.ts           # Plate physics and particles
│   │   │   ├── ChladniConstants.ts       # Physics constants and config
│   │   │   ├── ModalCalculator.ts        # Wave equation solution
│   │   │   ├── ParticleManager.ts        # Particle simulation with object pooling
│   │   │   ├── Material.ts               # Material properties (dispersion)
│   │   │   ├── PlateGeometry.ts          # Plate dimension management
│   │   │   ├── FrequencySweepController.ts  # Frequency sweep animation
│   │   │   ├── ResonanceCurveCalculator.ts  # Precomputed resonance data
│   │   │   ├── PlaybackStateMachine.ts   # Animation state management
│   │   │   └── FrequencyRange.ts         # Frequency range utilities
│   │   └── view/
│   │       ├── ChladniScreenView.ts
│   │       ├── ChladniControlPanel.ts
│   │       ├── ChladniVisualizationNode.ts  # Particle display
│   │       ├── ResonanceCurveNode.ts     # Frequency response graph
│   │       ├── DisplacementColormapNode.ts  # Colormap overlay
│   │       ├── ExcitationMarkerNode.ts   # Draggable excitation point
│   │       ├── controls/                 # Control panel sections
│   │       └── renderers/                # Canvas/WebGL particle rendering
│   ├── i18n/                 # Internationalization
│   │   ├── ResonanceStrings.ts
│   │   ├── StringManager.ts
│   │   ├── strings_en.json
│   │   ├── strings_es.json
│   │   └── strings_fr.json
│   └── preferences/
│       └── ResonancePreferencesModel.ts
├── tests/
│   └── fuzz/
│       └── fuzz.spec.ts      # Playwright fuzz tests
├── doc/                      # Additional documentation
│   ├── model.md              # Physics model and educational guide
│   └── implementation-notes.md  # Technical architecture notes
└── README.md                 # User-facing overview
```

## Critical: Import Order

SceneryStack requires a **strict import order** in the entry chain:

1. `init.ts` - Initialize simulation metadata
2. `assert.ts` - Enable assertions
3. `splash.ts` - Setup splash screen
4. `brand.ts` - Configure branding
5. `main.ts` - Everything else

**Never break this chain.** Each file imports the previous one.

## Key SceneryStack Patterns

### Properties (Reactive State)

All observable state uses Properties from `scenerystack/axon`:

```typescript
import {
  NumberProperty,
  Property,
  BooleanProperty,
  DerivedProperty,
} from "scenerystack/axon";

// Basic properties
const massProperty = new NumberProperty(0.25);
const isPlayingProperty = new BooleanProperty(true);

// Observe changes
massProperty.link((value) => console.log(`Mass: ${value}`));

// Derived properties (computed from other properties)
const frequencyProperty = new DerivedProperty(
  [massProperty, springConstantProperty],
  (m, k) => Math.sqrt(k / m) / (2 * Math.PI),
);
```

### Color Profiles (Accessibility)

All colors must use `ProfileColorProperty` for accessibility support:

```typescript
import { ProfileColorProperty, Color } from "scenerystack/scenery";

const springProperty = new ProfileColorProperty(namespace, "spring", {
  default: new Color(255, 100, 100), // Dark theme
  projector: new Color(204, 0, 0), // Light/projector theme
});
```

Colors are defined in `src/common/ResonanceColors.ts`.

### Scene Graph (UI Elements)

```typescript
import {
  Circle,
  Rectangle,
  Text,
  Node,
  VBox,
  HBox,
} from "scenerystack/scenery";
import { NumberControl, ResetAllButton } from "scenerystack/scenery-phet";
import { Range } from "scenerystack/dot";

const control = new NumberControl("Label", property, new Range(0, 10));
```

### Model-View-Screen Pattern

Each simulation screen follows this structure:

```typescript
// Screen - connects model and view
class MyScreen extends Screen<MyModel, MyScreenView> {
  constructor(options: ScreenOptions) {
    super(
      () => new MyModel(),
      (model) => new MyScreenView(model),
      options,
    );
  }
}

// Model - physics calculations, step(dt), reset()
class MyModel extends BaseModel {
  step(dt: number): void {
    /* physics integration */
  }
  reset(): void {
    /* restore initial state */
  }
}

// View - UI elements, step(dt), reset()
class MyScreenView extends ScreenView {
  step(dt: number): void {
    /* update visuals */
  }
  reset(): void {
    /* reset view state */
  }
}
```

## Testing Conventions

### Unit Tests

Tests are co-located with source files in `__tests__/` directories:

```
src/common/model/__tests__/ResonanceModel.test.ts
src/common/view/__tests__/OscillatorControlPanel.test.ts
```

Test pattern:

```typescript
import { describe, it, expect, beforeEach } from "vitest";

describe("ComponentName", () => {
  let model: ResonanceModel;

  beforeEach(() => {
    model = new ResonanceModel(createMockPreferences());
  });

  it("should calculate natural frequency correctly", () => {
    expect(model.naturalFrequencyProperty.value).toBeCloseTo(20, 5);
  });
});
```

### Fuzz Tests

Run with Playwright to stress-test the simulation:

```bash
npm run test:fuzz                        # Default 60s test
FUZZ_SEED=12345 npm run test:fuzz        # Reproducible with seed
FUZZ_DURATION=300 npm run test:fuzz      # 5 minute test
```

## Physics Model Reference

### Oscillator Equation of Motion

```
m·a = -k·(x - x_plate(t)) - b·v - m·g
```

The model defines **positive x = upward** (away from the driver plate).

Where:

- `x_plate(t) = A·sin(ω·t)` - driver plate position
- `-k·x` - spring restoring force (Hooke's Law)
- `-b·v` - damping force
- `-m·g` - gravity, acts downward (optional, default OFF)

### Key Derived Values

- **Natural frequency**: `ω₀ = √(k/m)` rad/s, `f₀ = ω₀/(2π)` Hz
- **Damping ratio**: `ζ = b/(2√(mk))`
- **Kinetic energy**: `KE = ½mv²`
- **Potential energy**: `PE = ½kx² + mgx`

### Parameter Ranges (from ResonanceConstants)

| Parameter         | Default | Min | Max  | Unit  |
| ----------------- | ------- | --- | ---- | ----- |
| Mass              | 0.25    | 0.1 | 5.0  | kg    |
| Spring Constant   | 100     | 10  | 1200 | N/m   |
| Damping           | 0.5     | 0.1 | 5.0  | N·s/m |
| Driving Frequency | 1.0     | 0.1 | 5.0  | Hz    |
| Driving Amplitude | 1.0     | 0.2 | 2.0  | cm    |

### Advanced Analytical Properties

`ResonanceModel` provides extensive analytical (closed-form) properties for steady-state oscillator analysis:

**Basic derived properties:**
- `naturalFrequencyProperty` - ω₀ = √(k/m) (rad/s and Hz)
- `dampingRatioProperty` - ζ = b/(2√(mk))
- `qualityFactorProperty` - Q = √(mk)/b
- `dampedFrequencyProperty` - ωd = ω₀√(1-ζ²) (damped oscillation frequency)

**Steady-state response:**
- `steadyStateAmplitudeProperty` - X₀ = F₀/√[(k-mω²)² + (bω)²]
- `steadyStatePhaseProperty` - φ = arctan(bω/(k-mω²))
- `steadyStateRmsDisplacementProperty` - X₀/√2
- `steadyStateRmsVelocityProperty` - ωX₀/√2
- `steadyStateRmsAccelerationProperty` - ω²X₀/√2

**Energy properties:**
- `steadyStateKineticEnergyProperty` - ⟨KE⟩ = ¼mω²X₀²
- `steadyStatePotentialEnergyProperty` - ⟨PE⟩ = ¼kX₀²
- `steadyStateAverageEnergyProperty` - ⟨E⟩ = ¼(mω² + k)X₀²

**Power dissipation:**
- `steadyStateDrivingPowerProperty` - ⟨P_drive⟩ = ½F₀ωX₀sin(φ)
- `steadyStateDampingPowerProperty` - ⟨P_damp⟩ = -½bω²X₀²

**Mechanical impedance (force/velocity analogy):**
- `mechanicalReactanceProperty` - X = mω - k/ω (N·s/m)
- `impedanceMagnitudeProperty` - |Z| = √(b² + X²)
- `impedancePhaseProperty` - ∠Z = φ - π/2
- `powerFactorProperty` - sin(φ) = b/|Z|

**Phase relationships:**
- `springForcePhaseProperty` - Anti-phase to displacement (φ ± π)
- `dampingForcePhaseProperty` - Anti-phase to velocity

**Resonance characteristics:**
- `peakResponseFrequencyProperty` - f_peak = f₀√(1-2ζ²) (frequency of maximum amplitude)
- `peakDisplacementAmplitudeProperty` - Maximum amplitude at f_peak
- `halfPowerBandwidthProperty` - Δf = f₀/Q
- `logarithmicDecrementProperty` - δ = 2πζ/√(1-ζ²)
- `decayTimeConstantProperty` - τ = 2m/b

All analytical properties are `DerivedProperty` instances that update automatically when system parameters change.

### Spring Presets

Oscillator screens include a preset combo box with five configurations:

1. **Light and Bouncy** - m=0.1kg, k=100N/m, b=0.5N·s/m (low mass, moderate stiffness)
2. **Heavy and Slow** - m=5kg, k=100N/m, b=2N·s/m (default, high mass)
3. **Underdamped** - m=0.25kg, k=100N/m, b=0.5N·s/m (ζ < 1, oscillatory)
4. **Critically Damped** - m=0.25kg, k=100N/m, b=3.16N·s/m (ζ = 1, fastest return to equilibrium)
5. **Overdamped** - m=0.25kg, k=100N/m, b=5N·s/m (ζ > 1, no oscillation)

Users can select a preset to quickly explore different damping regimes, then customize parameters freely.

### Frequency Sweep

All oscillator screens (Single Oscillator, Multiple Oscillators, Phase Analysis) now include frequency sweep functionality:

- **Sweep button** - Starts/stops automatic frequency sweep from min to max
- **Sweep rate** - 0.067 Hz/s (~90 seconds for full 0.1-5 Hz range)
- **Speed sync** - Sweep rate scales with time speed (slow/normal/fast)
- **Auto-enable** - Clicking sweep automatically enables driving and starts playback
- **Pause behavior** - Sweep pauses when simulation is paused
- **End behavior** - Power turns off and playback stops when sweep reaches max frequency
- **Slider disable** - Frequency slider is disabled during active sweep

Implemented in `FrequencySweepController.ts` (model) and `SweepButton.ts` (view).

### ODE Solvers and Sub-Step Data

The simulation supports multiple ODE solvers with sub-frame data collection:

**Available solvers:**
- `RungeKuttaSolver` - RK4, fixed 1ms time steps (default)
- `AdaptiveRK45Solver` - Adaptive RK4/5 with error control
- `AnalyticalSolver` - Closed-form steady-state solution

**Sub-step data collection:**
- Solvers emit data at each internal sub-step via `SubStepCallback`
- Used by `ConfigurableGraph` for smooth phase-space plots (velocity vs position)
- Collection enabled only when graph is visible (performance optimization)
- Decimation factor of 4 balances smoothness with memory (~8 seconds at 2000 max points)

See `ODESolver.ts` for the interface and individual solver implementations for details.

### Trace Mode Features

Oscillator screens include an enhanced trace mode:

- **Grid scroll syncing** - Grid scrolls at rate matching simulation speed (slow/normal/fast)
- **Pause behavior** - Grid scroll pauses when simulation is paused
- **Pen dot indicator** - Colored dot appears at trace origin matching trace line color
- **Smooth transitions** - Seamless scroll rate changes when switching speeds mid-trace
- **Separate offsets** - Cumulative scroll offset tracked separately from visual grid offset (which wraps for tiling)

Implemented in `OscillatorTraceNode.ts` and `TraceDataModel.ts`.

## Internationalization

All user-visible strings must be translatable:

```typescript
import { ResonanceStrings } from "../i18n/ResonanceStrings";

// Use string properties in UI
const control = new NumberControl(
  ResonanceStrings.controls.massStringProperty,
  model.massProperty,
  new Range(0.1, 5.0),
);
```

String files: `src/i18n/strings_en.json`, `strings_es.json`, `strings_fr.json`

## Common Pitfalls to Avoid

### 1. Circular Property Updates

When syncing properties (e.g., meters ↔ centimeters), use guards:

```typescript
import { CircularUpdateGuard } from "../common/util/CircularUpdateGuard.js";

const guard = new CircularUpdateGuard();
property1.link((val) =>
  guard.execute(() => {
    property2.value = transform(val);
  }),
);
```

### 2. Coordinate System

- **Model**: Positive Y = upward (springs extend up from driver plate)
- **View**: Positive Y = downward (standard screen coordinates)
- Use `ModelViewTransform2` for conversion

### 3. Unit Conversions

- Driving amplitude: stored in meters, displayed in centimeters
- Frequency: stored in Hz internally
- Always check `ResonanceConstants` for proper ranges

### 4. Unused Variable Naming

ESLint rule requires prefixing unused variables with `_`:

```typescript
callback: (_tandem: Tandem) => { ... }
```

## Key Files for Common Tasks

| Task                           | Files                                                            |
| ------------------------------ | ---------------------------------------------------------------- |
| Add new physics parameter      | `ResonanceModel.ts`, `ResonanceConstants.ts`                     |
| Add analytical property        | `ResonanceModel.ts` (add new `DerivedProperty`)                  |
| Add new color                  | `ResonanceColors.ts`                                             |
| Add new string                 | `strings_en.json`, `ResonanceStrings.ts`                         |
| Modify oscillator controls     | `common/view/OscillatorControlPanel.ts`                          |
| Add/modify spring presets      | `common/view/OscillatorControlPanel.ts`                          |
| Modify Chladni controls        | `chladni-patterns/view/ChladniControlPanel.ts`                   |
| Change solver behavior         | `common/model/` solvers (RK4, RK45, Analytical)                  |
| Modify frequency sweep         | `FrequencySweepController.ts`, `SweepButton.ts`                  |
| Add graph plot                 | `ConfigurableGraph.ts`, `PlottableProperty.ts`                   |
| Modify trace/grid behavior     | `OscillatorTraceNode.ts`, `TraceDataModel.ts`                    |
| Add preference                 | `ResonancePreferencesModel.ts`, `main.ts`                        |
| Add new oscillator screen      | Extend `BaseOscillatorScreenModel`/`View`, register in `main.ts` |
| Customize oscillator screen    | Override methods in screen-specific model/view classes           |

## Related Documentation

- **[README.md](README.md)** - User-facing features and getting started
- **[doc/model.md](doc/model.md)** - Comprehensive physics model and educational guide
- **[doc/implementation-notes.md](doc/implementation-notes.md)** - Technical architecture and design patterns
