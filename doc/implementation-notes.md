# Resonance Simulation - Implementation Notes

This document provides technical details for developers and maintainers of the Resonance Simulation codebase. It covers architecture decisions, code organization, design patterns, and implementation considerations.

## Table of Contents

1. [Terminology](#terminology)
2. [Architecture Overview](#architecture-overview)
3. [Four-Screen Structure](#four-screen-structure)
4. [Model Layer](#model-layer)
5. [View Layer](#view-layer)
6. [Numerical Integration](#numerical-integration)
7. [Multi-Oscillator System](#multi-oscillator-system)
8. [Testing](#testing)

---

## Terminology

Understanding the domain-specific terminology used throughout the codebase:

- **Screen** - A simulation view; Resonance has four screens: Single Oscillator, Multiple Oscillators, Phase Analysis, and Chladni Patterns
- **BaseOscillatorScreenModel** - Shared model for the first three oscillator-based screens
- **BaseOscillatorScreenView** - Shared view for the first three oscillator-based screens
- **ResonanceModel** - Physics model for a single mass-spring-damper system
- **State vector** - Array of numbers representing the complete dynamic state: `[position, velocity, drivingPhase]`
- **Derived properties** - Computed values that depend on state (e.g., acceleration, energy, natural frequency)
- **ODE Solver** - Numerical integration algorithm that advances the simulation state
- **Resonator** - A single mass-spring-damper system being driven by the plate
- **Driver** - The oscillating plate that provides displacement-based driving force
- **Natural frequency** - The frequency at which the system oscillates without driving: `ω₀ = √(k/m)`
- **Damping ratio** - Dimensionless measure of damping: `ζ = b/(2√(mk))`
- **Phase lag** - The angular delay between driving displacement and mass response
- **Property** - Observable value from Axon framework that notifies listeners of changes
- **Node** - Visual element from Scenery scene graph

---

## Architecture Overview

### Design Patterns

The codebase employs several design patterns:

1. **Model-View-Screen (MVC)**
   - Model: `BaseOscillatorScreenModel`, `ResonanceModel`, `ChladniModel`
   - View: `BaseOscillatorScreenView`, `ChladniScreenView` and supporting view classes
   - Screen: `SingleOscillatorScreen`, `MultipleOscillatorsScreen`, `PhaseAnalysisScreen`, `ChladniScreen`

2. **Template Method Pattern**
   - `BaseModel` defines the simulation stepping algorithm
   - `ResonanceModel` implements abstract methods: `getState()`, `setState()`, `getDerivatives()`

3. **Strategy Pattern**
   - ODE solvers are interchangeable strategies
   - `BaseModel` accepts any `ODESolver` implementation
   - Users can switch solvers via preferences

4. **Observer Pattern**
   - Axon Properties implement observable pattern
   - UI components observe model properties and update automatically

5. **Composite Pattern**
   - `BaseOscillatorScreenModel` manages multiple `ResonanceModel` instances
   - Shared parameters (driving, damping) are synchronized across all oscillators

---

## Four-Screen Structure

The simulation has four distinct screens with shared infrastructure:

### Oscillator Screens (1-3)

The first three screens share common base classes:

```
BaseOscillatorScreenModel
├── SingleOscillatorModel (singleOscillatorMode=true)
├── MultipleOscillatorsModel
└── PhaseAnalysisModel

BaseOscillatorScreenView
├── SingleOscillatorScreenView
├── MultipleOscillatorsScreenView
└── PhaseAnalysisScreenView
```

**Key files:**

- `src/common/model/BaseOscillatorScreenModel.ts` - Manages 1-10 ResonanceModel instances
- `src/common/view/BaseOscillatorScreenView.ts` - Renders driver plate, springs, masses

### Chladni Screen (4)

The Chladni screen has independent architecture (not using BaseModel):

```
ChladniModel
├── PlateGeometry
├── ModalCalculator
├── ParticleManager
├── ResonanceCurveCalculator
├── FrequencySweepController
└── PlaybackStateMachine

ChladniScreenView
├── ChladniVisualizationNode
├── ChladniControlPanel
├── ResonanceCurveNode
└── renderers/ (Canvas/WebGL)
```

---

## Model Layer

### BaseModel Abstract Class

Location: `src/common/model/BaseModel.ts`

Provides:

- Time management (play/pause, time speed: 0.5x, 1x, 2x)
- ODE solver creation and management
- Physics time stepping via Template Method pattern
- Frame-rate independence (dt capping at 100ms)

**Abstract Methods** (must be implemented by subclasses):

```typescript
abstract getState(): number[]
abstract setState(state: number[]): void
abstract getDerivatives(t: number, state: number[]): number[]
abstract reset(): void
```

### ResonanceModel

Location: `src/common/model/ResonanceModel.ts`

Models a single driven, damped harmonic oscillator with displacement-based driving.

**State Variables**: `[position, velocity, drivingPhase]`

**Important Design Decision**: The driving is displacement-based (the plate moves), not force-based:

- The effective driving force is `k * A * sin(ωt)`
- Stiffer springs produce stronger driving at the same amplitude
- This models realistic mechanical resonance setups

### BaseOscillatorScreenModel

Location: `src/common/model/BaseOscillatorScreenModel.ts`

Manages 1-10 independent ResonanceModel instances with configurable parameter distribution.

**Configuration Modes**:

1. **SAME_MASS** - Varying spring constants, same mass
2. **SAME_SPRING_CONSTANT** - Varying masses, same spring constant
3. **MIXED** - Both vary proportionally (same natural frequency)
4. **SAME_FREQUENCY** - Alias for MIXED
5. **CUSTOM** - Independent control of each oscillator

**Shared Parameters**: Driving amplitude, frequency, damping, and gravity are synchronized across all oscillators.

---

## View Layer

### BaseOscillatorScreenView

Location: `src/common/view/BaseOscillatorScreenView.ts`

**Visual Components**:

- **Driver system**: Control box + connection rod + oscillating plate
- **Resonators**: Springs + square mass boxes (numbered 1-10)
- **Measurement tools**: Draggable ruler with 1cm tick marks
- **Control panels**: Parameter sliders, playback controls
- **Reset button**: Restores initial state

**Coordinate Transformation**:

```typescript
// Model: +y is up, range ±0.5m
// View: +y is down (screen coordinates)
const viewY = baseY - modelPosition * scale;
```

---

## Numerical Integration

### Available Solvers

| Solver                     | Method            | Accuracy | Best For                             |
| -------------------------- | ----------------- | -------- | ------------------------------------ |
| **RungeKuttaSolver**       | RK4 (4th order)   | O(h⁴)    | **Default**, stable, general-purpose |
| **AdaptiveRK45Solver**     | Dormand-Prince    | Adaptive | High accuracy requirements           |
| **AdaptiveEulerSolver**    | Adaptive Euler    | O(h²)    | Educational, simple problems         |
| **ModifiedMidpointSolver** | Modified midpoint | O(h²)    | Oscillatory systems                  |

**Default Configuration**: RK4 with 0.001s fixed timestep, automatic substepping for large frame deltas.

### Time Step Configuration

- Fixed physics timestep: 1ms (0.001s)
- Maximum frame dt: 100ms (prevents jumps from tab switching)
- Large frame deltas are broken into multiple physics steps

---

## Multi-Oscillator System

### Parameter Distribution

When multiple oscillators are active, parameters are distributed based on the configuration mode.

Frequencies are evenly distributed from 1.0 Hz (resonator 1) to 5.5 Hz (resonator 10):
`f_i = 1.0 + (i-1) / (count-1) × (5.5 - 1.0) Hz`

### Preset Configurations

Six presets demonstrate different damping regimes:

| Preset            | Mass   | k      | b    | Damping Ratio | Character                    |
| ----------------- | ------ | ------ | ---- | ------------- | ---------------------------- |
| Light and Bouncy  | 0.5 kg | 50 N/m | 0.1  | ζ ≈ 0.01      | Fast oscillation             |
| Heavy and Slow    | 5.0 kg | 5 N/m  | 0.5  | ζ ≈ 0.05      | Slow oscillation             |
| Underdamped       | 1 kg   | 25 N/m | 2.0  | ζ = 0.2       | Oscillates with decay        |
| Critically Damped | 1 kg   | 25 N/m | 10.0 | ζ = 1.0       | Fastest return, no overshoot |
| Overdamped        | 1 kg   | 25 N/m | 20.0 | ζ = 2.0       | Slow return                  |
| Resonance Demo    | 1 kg   | 10 N/m | 0.3  | ζ ≈ 0.05      | f_drive = f₀                 |

---

## Testing

### Available Test Commands

```bash
npm test              # Unit tests (Vitest)
npm run test:coverage # Code coverage report
npm run test:fuzz     # Fuzz testing (Playwright, 60s default)
npm run test:fuzz:quick   # Quick fuzz test (30s)
npm run test:fuzz:long    # Long fuzz test (5min)
```

### Key Test Cases

- Natural frequency calculations: f₀ = (1/2π)√(k/m)
- Critical damping threshold: b = 2√(mk)
- Energy conservation without damping/driving
- Resonance at ω_drive = ω₀
- All solver methods produce consistent results

### Debugging

Run with `?ea` query parameter to enable assertions:

```typescript
assert && assert(mass > 0, "Mass must be positive");
```

---

## Maintenance Checklist

When making changes:

- [ ] Run linter: `npm run lint`
- [ ] Build successfully: `npm run build`
- [ ] Test simulation functionality: `npm test`
- [ ] Run fuzz tests: `npm run test:fuzz:quick`
- [ ] Verify accessibility (keyboard navigation, color profiles)
- [ ] Check performance (no lag during simulation)
- [ ] Run with `?ea` to verify no assertion failures

---

## Related Documentation

- **[model.md](model.md)** - Comprehensive physics model and educational guide
- **[CLAUDE.md](../CLAUDE.md)** - Quick reference for AI assistants and developers
- **[model.md](model.md)** - Physics model for educators
- **[chladni-recommendations.md](chladni-recommendations.md)** - Chladni screen enhancement ideas
