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
│   │   │   ├── RungeKuttaSolver.ts    # RK4 (default)
│   │   │   ├── AdaptiveRK45Solver.ts  # Adaptive RK 4/5
│   │   │   ├── AdaptiveEulerSolver.ts # Adaptive Euler
│   │   │   ├── ModifiedMidpointSolver.ts
│   │   │   ├── BaseModel.ts           # Abstract model with time management
│   │   │   ├── BaseOscillatorScreenModel.ts  # Shared oscillator screen model
│   │   │   ├── ResonanceModel.ts      # Single oscillator physics
│   │   │   ├── MeasurementLineModel.ts # Measurement line model
│   │   │   └── SolverType.ts          # Solver enumeration
│   │   ├── view/                 # Shared view components
│   │   │   ├── BaseOscillatorScreenView.ts   # Shared oscillator screen view
│   │   │   ├── OscillatorControlPanel.ts     # Shared control panel
│   │   │   ├── OscillatorDriverControlNode.ts
│   │   │   ├── OscillatorPlaybackControlNode.ts
│   │   │   ├── OscillatorResonatorNodeBuilder.ts
│   │   │   ├── OscillatorMeasurementLinesNode.ts
│   │   │   └── KeyboardShortcutsNode.ts
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
├── IMPLEMENTATION_GUIDE.md   # Detailed physics and technical reference
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
m·a = -k·(x - x_plate(t)) - b·v + m·g
```

Where:

- `x_plate(t) = A·sin(ω·t)` - driver plate position
- `-k·x` - spring restoring force (Hooke's Law)
- `-b·v` - damping force
- `m·g` - gravity (optional, default OFF)

### Key Derived Values

- **Natural frequency**: `ω₀ = √(k/m)` rad/s, `f₀ = ω₀/(2π)` Hz
- **Damping ratio**: `ζ = b/(2√(mk))`
- **Kinetic energy**: `KE = ½mv²`
- **Potential energy**: `PE = ½kx² - mgx`

### Parameter Ranges (from ResonanceConstants)

| Parameter         | Default | Min | Max  | Unit  |
| ----------------- | ------- | --- | ---- | ----- |
| Mass              | 0.25    | 0.1 | 5.0  | kg    |
| Spring Constant   | 100     | 10  | 1200 | N/m   |
| Damping           | 0.5     | 0.1 | 5.0  | N·s/m |
| Driving Frequency | 1.0     | 0.1 | 5.0  | Hz    |
| Driving Amplitude | 1.0     | 0.2 | 2.0  | cm    |

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

| Task                        | Files                                                              |
| --------------------------- | ------------------------------------------------------------------ |
| Add new physics parameter   | `ResonanceModel.ts`, `ResonanceConstants.ts`                       |
| Add new color               | `ResonanceColors.ts`                                               |
| Add new string              | `strings_en.json`, `ResonanceStrings.ts`                           |
| Modify oscillator controls  | `common/view/OscillatorControlPanel.ts`                            |
| Modify Chladni controls     | `chladni-patterns/view/ChladniControlPanel.ts`                     |
| Change solver behavior      | `common/model/` solvers                                            |
| Add preference              | `ResonancePreferencesModel.ts`, `main.ts`                          |
| Add new oscillator screen   | Extend `BaseOscillatorScreenModel`/`View`, register in `main.ts`   |
| Customize oscillator screen | Override methods in screen-specific model/view classes             |

## Related Documentation

- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Detailed physics model, coordinate system, ODE solvers
- **[README.md](README.md)** - User-facing features and getting started
- **[doc/model.md](doc/model.md)** - Additional model documentation
