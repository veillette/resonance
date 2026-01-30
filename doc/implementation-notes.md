# Resonance Simulation - Implementation Notes

This document provides technical details for developers and maintainers of the Resonance Simulation codebase. It covers architecture decisions, code organization, design patterns, and implementation considerations.

## Table of Contents

1. [Terminology](#terminology)
2. [General Considerations](#general-considerations)
3. [Architecture Overview](#architecture-overview)
4. [Model Layer](#model-layer)
5. [View Layer](#view-layer)
6. [Numerical Integration](#numerical-integration)
7. [Multi-Oscillator System](#multi-oscillator-system)
8. [Accessibility](#accessibility)
9. [Internationalization](#internationalization)
10. [Performance Considerations](#performance-considerations)
11. [Testing and Debugging](#testing-and-debugging)

---

## Terminology

Understanding the domain-specific terminology used throughout the codebase:

- **Screen** - The main simulation view (currently a single screen: SimScreen)
- **Model** - The physics state and equations (ResonanceModel, SimModel)
- **View** - The visual representation and UI controls (SimScreenView)
- **State vector** - Array of numbers representing the complete dynamic state: `[position, velocity, drivingPhase]`
- **Derived properties** - Computed values that depend on state (e.g., acceleration, energy, natural frequency)
- **ODE Solver** - Numerical integration algorithm that advances the simulation state
- **Resonator** - A single mass-spring-damper system being driven by the plate
- **Driver** - The oscillating plate that provides displacement-based driving force
- **Natural frequency** - The frequency at which the system oscillates without driving: ω₀ = √(k/m)
- **Damping ratio** - Dimensionless measure of damping: ζ = b/(2√(mk))
- **Phase lag** - The angular delay between driving displacement and mass response
- **Property** - Observable value from Axon framework that notifies listeners of changes
- **Node** - Visual element from Scenery scene graph

---

## General Considerations

### Framework and Dependencies

The simulation is built on the **SceneryStack** framework (v3.0.0), which includes:
- **Scenery** - Scene graph and rendering
- **Axon** - Property-based reactivity and observable patterns
- **Dot** - Mathematical utilities (Vector2, Range, etc.)
- **Sun** - UI components (buttons, sliders, panels)
- **Joist** - Simulation framework (screens, navigation)
- **scenery-phet** - PhET-specific UI components (NumberControl, RulerNode, etc.)

### Coordinate Systems

The simulation uses a physics-based coordinate system:
- **Origin**: Equilibrium position where spring has natural length
- **+y direction**: Up (springs extend upward from driver plate)
- **Range**: ±0.5 m (1 meter total visible)

The ModelViewTransform2 handles conversion to screen coordinates where +y is down.

### Object Lifecycle

Most objects are created at startup and persist for the application's lifetime:
- Models are instantiated once per screen
- Views are created once and reused
- Properties generally don't need disposal
- Listeners are typically attached for the lifetime of the simulation

### Query Parameters

Several query parameters are available for development and debugging:
- `?ea` - Enable assertions (development mode)
- `?locale=<code>` - Set language (e.g., `?locale=es` for Spanish)

---

## Architecture Overview

### Design Patterns

The codebase employs several design patterns:

1. **Model-View-Controller (MVC)**
   - Model: `ResonanceModel`, `SimModel`
   - View: `SimScreenView` and supporting view classes
   - Controller: `SimScreen` and event handlers

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
   - `SimModel` manages multiple `ResonanceModel` instances
   - Shared parameters (driving, damping) are synchronized across all oscillators

### Directory Structure

```
src/
├── main.ts                              # Application entry point
├── common/
│   ├── ResonanceColors.ts              # Color profiles (default, projector)
│   ├── ResonanceConstants.ts           # Configuration constants
│   ├── model/
│   │   ├── BaseModel.ts                # Abstract base for physics models
│   │   ├── ResonanceModel.ts           # Single oscillator physics
│   │   ├── ODESolver.ts                # Solver interface
│   │   ├── RungeKuttaSolver.ts         # RK4 implementation (default)
│   │   ├── AdaptiveRK45Solver.ts       # Adaptive Dormand-Prince
│   │   ├── AdaptiveEulerSolver.ts      # Adaptive Euler
│   │   └── ModifiedMidpointSolver.ts   # Modified midpoint method
│   └── util/                           # Utility classes
├── screen-name/
│   ├── SimScreen.ts                    # Screen definition
│   ├── model/
│   │   └── SimModel.ts                 # Multi-oscillator model
│   └── view/
│       ├── SimScreenView.ts            # Main view
│       ├── DriverControlNode.ts        # Frequency/amplitude controls
│       ├── ResonatorControlPanel.ts    # Mass/spring/damping controls
│       ├── PlaybackControlNode.ts      # Play/pause/speed controls
│       └── MeasurementLinesNode.ts     # Visual measurement aid
├── preferences/
│   └── ResonancePreferencesModel.ts    # User preferences (solver, visuals)
└── i18n/
    └── StringManager.ts                # Internationalization
```

---

## Model Layer

### BaseModel Abstract Class

Location: `src/common/model/BaseModel.ts`

`BaseModel` is the abstract base class for simulation models. It provides:

**Key Responsibilities**:
- Time management (play/pause, time speed: 0.5x, 1x, 2x)
- ODE solver creation and management
- Physics time stepping via Template Method pattern
- Frame-rate independence (dt capping at 100ms)

**Abstract Methods** (must be implemented by subclasses):
```typescript
abstract getState(): number[]
abstract setState(state: number[]): void
abstract getDerivatives(t: number, state: number[]): number[]
abstract resetModel(): void
```

**Template Method** - `step(dt: number)`:
The base class handles time scaling and substepping, then calls the abstract methods to advance physics.

### ResonanceModel

Location: `src/common/model/ResonanceModel.ts`

Models a single driven, damped harmonic oscillator with displacement-based driving.

**State Variables**: `[position, velocity, drivingPhase]`

**Key Properties**:
- `massProperty: NumberProperty` - Mass in kg (0.1 to 5.0)
- `springConstantProperty: NumberProperty` - Spring constant k in N/m (10 to 6000)
- `dampingCoefficientProperty: NumberProperty` - Damping b in N·s/m (0.1 to 5.0)
- `drivingAmplitudeProperty: NumberProperty` - Plate amplitude in m (0.002 to 0.02)
- `drivingFrequencyProperty: NumberProperty` - Driving frequency in Hz (0.1 to 5.0)
- `positionProperty: NumberProperty` - Current position from equilibrium
- `velocityProperty: NumberProperty` - Current velocity

**Derived Properties**:
- `naturalFrequencyProperty` - ω₀ = √(k/m) rad/s
- `naturalFrequencyHzProperty` - f₀ = ω₀/(2π) Hz
- `dampingRatioProperty` - ζ = b/(2√(mk))
- `kineticEnergyProperty` - KE = ½mv²
- `potentialEnergyProperty` - PE = ½kx² (+ gravitational if enabled)
- `totalEnergyProperty` - KE + PE
- `phaseAngleProperty` - Phase lag between displacement and driving

**Physics Implementation**:
```typescript
getDerivatives(t: number, state: number[]): number[] {
  const [x, v, phase] = state;
  const m = this.massProperty.value;
  const k = this.springConstantProperty.value;
  const b = this.dampingCoefficientProperty.value;
  const A = this.drivingAmplitudeProperty.value;
  const omega = this.drivingFrequencyProperty.value * 2 * Math.PI;

  // Plate position (displacement driving)
  const platePosition = A * Math.sin(phase);

  // Forces: spring (to plate), damping, gravity (if enabled)
  const springForce = -k * (x - platePosition);
  const dampingForce = -b * v;
  const gravityForce = this.gravityEnabledProperty.value ? m * 1.62 : 0; // Moon gravity

  const acceleration = (springForce + dampingForce + gravityForce) / m;

  return [v, acceleration, omega]; // [dx/dt, dv/dt, dφ/dt]
}
```

**Important Design Decision**: The driving is displacement-based (the plate moves), not force-based. This means:
- The effective driving force is `k * A * sin(ωt)`
- Stiffer springs produce stronger driving at the same amplitude
- This models realistic mechanical resonance setups

### SimModel

Location: `src/screen-name/model/SimModel.ts`

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

### SimScreenView

Location: `src/screen-name/view/SimScreenView.ts`

The main visualization containing:

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

**Layout Constants** (from ResonanceConstants.ts):
- Mass nodes: 20×20 to 50×50 pixels (squares)
- Spring loops: 10 with 5-pixel radius
- Driver plate height: 20 pixels
- Ruler: 50 cm total with 1 cm tick marks

### Spring Rendering

Springs are rendered with:
- Variable number of coils based on extension
- Line width proportional to spring constant (visual feedback for stiffness)
- Smooth animation during oscillation

### Control Panels

- **DriverControlNode**: Frequency and amplitude sliders
- **ResonatorControlPanel**: Mass, spring constant, damping sliders
- **PlaybackControlNode**: Play/pause button, speed selector (0.5x, 1x, 2x)

---

## Numerical Integration

### ODESolver Interface

Location: `src/common/model/ODESolver.ts`

All ODE solvers implement this interface:
```typescript
interface ODESolver {
  step(
    t: number,
    state: number[],
    dt: number,
    derivativesFunction: (t: number, state: number[]) => number[]
  ): number[];
}
```

### Available Solvers

| Solver | Method | Accuracy | Best For |
|--------|--------|----------|----------|
| **RungeKuttaSolver** | RK4 (4th order) | O(h⁴) | **Default**, stable, general-purpose |
| **AdaptiveRK45Solver** | Dormand-Prince | Adaptive | High accuracy requirements |
| **AdaptiveEulerSolver** | Adaptive Euler | O(h²) | Educational, simple problems |
| **ModifiedMidpointSolver** | Modified midpoint | O(h²) | Oscillatory systems |

**Default Configuration**: RK4 with 0.001s fixed timestep, automatic substepping for large frame deltas.

### Time Step Configuration

The simulation uses substepping to maintain stability:
- Fixed physics timestep: 1ms (0.001s)
- Maximum frame dt: 100ms (prevents jumps from tab switching)
- Large frame deltas are broken into multiple physics steps

---

## Multi-Oscillator System

### Parameter Distribution

When multiple oscillators are active, parameters are distributed based on the configuration mode:

**SAME_MASS mode**:
```typescript
oscillator[i].mass = baseMass;
oscillator[i].springConstant = baseK * (i + 1);
// Natural frequencies: f₀, f₀/√2, f₀/√3, ...
```

**SAME_SPRING_CONSTANT mode**:
```typescript
oscillator[i].springConstant = baseK;
oscillator[i].mass = baseMass * (i + 1);
// Natural frequencies: f₀, f₀/√2, f₀/√3, ...
```

**MIXED mode** (same natural frequency):
```typescript
oscillator[i].mass = baseMass * (i + 1);
oscillator[i].springConstant = baseK * (i + 1);
// All have same natural frequency (k/m ratio constant)
```

### Preset Configurations

Six presets demonstrate different damping regimes:

| Preset | Mass | k | b | Damping Ratio | Character |
|--------|------|---|---|---------------|-----------|
| Light and Bouncy | 0.5 kg | 50 N/m | 0.1 | ζ ≈ 0.01 | Fast oscillation |
| Heavy and Slow | 5.0 kg | 5 N/m | 0.5 | ζ ≈ 0.05 | Slow oscillation |
| Underdamped | 1 kg | 25 N/m | 2.0 | ζ = 0.2 | Oscillates with decay |
| Critically Damped | 1 kg | 25 N/m | 10.0 | ζ = 1.0 | Fastest return, no overshoot |
| Overdamped | 1 kg | 25 N/m | 20.0 | ζ = 2.0 | Slow return |
| Resonance Demo | 1 kg | 10 N/m | 0.3 | ζ ≈ 0.05 | f_drive = f₀ |

---

## Accessibility

### Color Profiles

Location: `src/common/ResonanceColors.ts`

Three color profiles available:
- **Default**: Standard colors
- **Projector**: High contrast for projection
- **Colorblind-friendly**: Adjusted palette

### Measurement Tools

- **Ruler**: Draggable, 50cm total with 1cm tick marks
- **Visual feedback**: Spring thickness indicates stiffness

---

## Internationalization

### StringManager

Location: `src/i18n/StringManager.ts`

Supported locales:
- English (en)
- Spanish (es)
- French (fr)

String categories include:
- Screen names and descriptions
- Physics parameter labels
- Preset names
- UI button labels
- Units

---

## Performance Considerations

### Optimization Strategies

1. **Derived Properties**: Use `DerivedProperty` for computed values
2. **Substepping**: Fixed physics timestep with substepping for stability
3. **Reused arrays**: Temporary arrays reused to minimize allocations
4. **Efficient spring rendering**: Dynamic length changes handled smoothly

### Frame Rate Independence

The simulation maintains consistent physics regardless of frame rate:
- Large frame deltas are broken into fixed-size physics steps
- Maximum dt cap prevents instability from tab switching
- Time scaling (0.5x, 1x, 2x) applied consistently

---

## Testing and Debugging

### Available Test Commands

```bash
npm test              # Unit tests (Vitest)
npm run test:coverage # Code coverage
npm run test:e2e      # End-to-end tests (Playwright)
npm run test:fuzz     # Fuzz testing
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
assert && assert(mass > 0, 'Mass must be positive');
```

---

## Code Style and Conventions

### TypeScript Usage

- Explicit types for public APIs
- `TReadOnlyProperty<T>` for properties that shouldn't be modified externally
- `const` for immutable bindings

### Naming Conventions

- Properties: `camelCaseProperty` (e.g., `massProperty`, `velocityProperty`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_MASS`, `DEFAULT_SPRING_CONSTANT`)
- Files: `PascalCase.ts` for classes

### Documentation

- JSDoc for public methods and classes
- Explain "why" not "what" in comments
- Physics equations documented with derivations where helpful

---

## Maintenance Checklist

When making changes:

- [ ] Run linter: `npm run lint`
- [ ] Build successfully: `npm run build`
- [ ] Test simulation functionality
- [ ] Verify accessibility (keyboard navigation, color profiles)
- [ ] Check performance (no lag during simulation)
- [ ] Update presets if physics equations change
- [ ] Update `model.md` if physics model changes
- [ ] Update this document if architecture changes
- [ ] Run with `?ea` to verify no assertion failures
- [ ] Test with different solvers

---

## Additional Resources

- **SceneryStack Documentation**: https://github.com/nicolenoelle/scenerystack
- **Classical Mechanics References**:
  - French, A.P. *Vibrations and Waves*
  - Crawford, Frank S. *Waves (Berkeley Physics Course, Vol. 3)*
