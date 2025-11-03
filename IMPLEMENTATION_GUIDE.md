# Resonance Model Implementation Guide

This document describes the implementation of the physics model for the Resonance simulation, based on the spring model from veillette's classical mechanics simulations.

## Architecture Overview

The implementation follows a clean, modular architecture:

```
src/
├── common/
│   └── model/
│       ├── ODESolver.ts              # Abstract solver interface
│       ├── RungeKuttaSolver.ts       # RK4 implementation (default)
│       ├── AdaptiveEulerSolver.ts    # Adaptive Euler method
│       ├── AdaptiveRK45Solver.ts     # Adaptive Runge-Kutta 4/5
│       ├── ModifiedMidpointSolver.ts # Modified midpoint method
│       ├── SolverType.ts             # Solver enumeration
│       ├── BaseModel.ts              # Abstract base with time management
│       ├── ResonanceModel.ts         # Main physics model
│       └── index.ts                  # Barrel exports
├── preferences/
│   └── ResonancePreferencesModel.ts  # Includes solver selection
└── screen-name/
    └── model/
        └── SimModel.ts               # Wraps ResonanceModel
```

## Components

### 1. ODE Solver Infrastructure

Four numerical integration methods are provided:

#### RungeKuttaSolver (Default)
- **Method**: Fourth-order Runge-Kutta (RK4)
- **Accuracy**: O(h⁴) - very accurate
- **Fixed timestep**: 0.001s with automatic substepping
- **Best for**: General-purpose, stable integration
- **Use case**: Default choice for most simulations

#### AdaptiveRK45Solver
- **Method**: Dormand-Prince embedded RK4/5
- **Accuracy**: Adaptive with error control
- **Error tolerance**: 0.0001
- **Best for**: High accuracy with automatic step size adjustment
- **Use case**: When maximum accuracy is needed

#### AdaptiveEulerSolver
- **Method**: Adaptive Euler with error estimation
- **Accuracy**: O(h²) with adaptation
- **Error tolerance**: 0.0001
- **Best for**: Simple problems, educational purposes
- **Use case**: Less accurate but easier to understand

#### ModifiedMidpointSolver
- **Method**: Modified midpoint (leapfrog variant)
- **Accuracy**: O(h²) - good for oscillatory systems
- **Best for**: Hamiltonian systems, oscillators
- **Use case**: Alternative for spring systems

### 2. BaseModel

Abstract base class providing:

```typescript
abstract class BaseModel {
  // Time management
  timeProperty: NumberProperty
  isPlayingProperty: BooleanProperty
  timeSpeedProperty: Property<"slow" | "normal" | "fast">

  // Solver management
  protected solver: ODESolver

  // Methods to implement
  abstract getState(): number[]
  abstract setState(state: number[]): void
  abstract getDerivatives(t: number, state: number[]): number[]
  abstract reset(): void

  // Provided functionality
  step(dt: number, forceStep?: boolean): void
}
```

**Key features:**
- Automatic solver creation based on preferences
- Time speed control (0.5x, 1.0x, 2.0x)
- Frame-rate independent physics (dt capping at 100ms)
- Play/pause state management

### 3. ResonanceModel

The main physics model implementing a driven, damped harmonic oscillator.

#### State Variables
```typescript
positionProperty: NumberProperty  // displacement from natural length (m)
velocityProperty: NumberProperty  // velocity (m/s)
```

#### Physical Parameters
```typescript
massProperty: NumberProperty              // mass (kg)
springConstantProperty: NumberProperty    // spring constant (N/m)
dampingProperty: NumberProperty           // damping coefficient (N·s/m)
gravityProperty: NumberProperty           // gravitational acceleration (m/s²)
naturalLengthProperty: NumberProperty     // natural length (m)
```

#### Driving Force Parameters
```typescript
drivingAmplitudeProperty: NumberProperty  // F₀ (N)
drivingFrequencyProperty: NumberProperty  // f (Hz)
drivingEnabledProperty: Property<boolean> // on/off toggle
```

#### Derived Properties
```typescript
naturalFrequencyProperty: TReadOnlyProperty<number>    // ω₀ = √(k/m) rad/s
naturalFrequencyHzProperty: TReadOnlyProperty<number>  // f₀ = ω₀/(2π) Hz
dampingRatioProperty: TReadOnlyProperty<number>        // ζ = b/(2√(mk))

kineticEnergyProperty: TReadOnlyProperty<number>       // KE = ½mv²
potentialEnergyProperty: TReadOnlyProperty<number>     // PE = ½kx² - mgx
totalEnergyProperty: TReadOnlyProperty<number>         // E = KE + PE

phaseAngleProperty: TReadOnlyProperty<number>          // phase lag (rad)
```

### 4. Physics Equations

The model implements the driven, damped harmonic oscillator:

```
m·a = -k·x - b·v + m·g + F₀·sin(ω·t)
```

Where:
- **-k·x**: Spring restoring force (Hooke's Law)
- **-b·v**: Damping force (linear, velocity-dependent)
- **m·g**: Gravitational force (constant, downward)
- **F₀·sin(ω·t)**: Driving force (sinusoidal, optional)

#### Implementation in `getDerivatives()`
```typescript
getDerivatives(t: number, state: number[]): number[] {
  const x = state[0]  // position
  const v = state[1]  // velocity

  // Calculate driving force
  let F_drive = 0
  if (drivingEnabled) {
    F_drive = F0 * sin(ω * (time + t))
  }

  // Calculate acceleration
  const a = (-k*x - b*v + m*g + F_drive) / m

  return [v, a]  // [dx/dt, dv/dt]
}
```

### 5. Energy Calculations

#### Kinetic Energy
```typescript
KE = ½ · m · v²
```

#### Potential Energy
```typescript
PE = ½ · k · x² - m · g · x
```

This combines:
- **Elastic potential**: ½kx² (stored in spring deformation)
- **Gravitational potential**: -mgx (reference at natural length)

#### Total Energy
```typescript
E_total = KE + PE
```

**Energy conservation:** Without damping and driving force, total energy is conserved. With damping, energy decreases. With driving force, energy can be added.

### 6. Resonance Phenomena

The model exhibits resonance when the driving frequency approaches the natural frequency.

#### Natural Frequency
```typescript
ω₀ = √(k/m)           // rad/s
f₀ = ω₀ / (2π)        // Hz
```

#### Damping Ratio
```typescript
ζ = b / (2√(m·k))
```

**Regimes:**
- **ζ < 1**: Underdamped (oscillates with decay)
- **ζ = 1**: Critically damped (fastest return, no overshoot)
- **ζ > 1**: Overdamped (slow return, no oscillation)

#### Resonance Condition
Maximum amplitude occurs when:
```
ω_drive ≈ ω₀ (for low damping)
```

At resonance, small driving forces can produce large amplitude oscillations.

#### Phase Relationship
The phase lag φ between displacement and driving force depends on the frequency ratio:

```typescript
φ = arctan(2·ζ·ω·ω₀ / (ω₀² - ω²))
```

- **ω << ω₀**: φ ≈ 0 (in phase)
- **ω = ω₀**: φ = π/2 (90° lag)
- **ω >> ω₀**: φ ≈ π (out of phase)

### 7. Presets

Six preset configurations are provided:

#### Light and Bouncy
- m = 0.5 kg, k = 50 N/m, b = 0.1 N·s/m
- f₀ ≈ 1.59 Hz
- Demonstrates fast, energetic oscillation

#### Heavy and Slow
- m = 5.0 kg, k = 5 N/m, b = 0.5 N·s/m
- f₀ ≈ 0.16 Hz
- Demonstrates slow oscillation

#### Underdamped
- m = 1.0 kg, k = 25 N/m, b = 2.0 N·s/m
- ζ = 0.2
- Oscillates with gradual decay

#### Critically Damped
- m = 1.0 kg, k = 25 N/m, b = 10.0 N·s/m
- ζ = 1.0 (b = 2√(mk))
- Returns to equilibrium in minimum time

#### Overdamped
- m = 1.0 kg, k = 25 N/m, b = 20.0 N·s/m
- ζ = 2.0
- Slowly returns without oscillating

#### Resonance Demo
- m = 1.0 kg, k = 10.0 N/m, b = 0.3 N·s/m
- f_drive = f₀ ≈ 0.503 Hz
- Demonstrates resonance with light damping

### 8. Preferences Integration

The solver selection is integrated into the preferences system:

```typescript
// In ResonancePreferencesModel
solverTypeProperty: Property<SolverType>

// Persisted to localStorage
// Available in preferences dialog UI
```

Users can select their preferred ODE solver from the simulation preferences panel.

### 9. Usage Example

```typescript
import { ResonanceModel } from "./common/model/index.js"

// Create model with preferences
const model = new ResonanceModel(preferencesModel)

// Set parameters
model.massProperty.value = 1.0
model.springConstantProperty.value = 10.0
model.dampingProperty.value = 0.5
model.drivingAmplitudeProperty.value = 5.0
model.drivingFrequencyProperty.value = 0.5
model.drivingEnabledProperty.value = true

// Start simulation
model.isPlayingProperty.value = true

// Step physics (called each frame)
model.step(dt)

// Access computed properties
const f0 = model.naturalFrequencyHzProperty.value
const energy = model.totalEnergyProperty.value
const phase = model.phaseAngleProperty.value

// Apply preset
model.setPreset(ResonancePresets[5]) // Resonance Demo
```

## Implementation Notes

### Time Stepping Strategy
- **Fixed substeps**: Solvers use small fixed timesteps internally (0.001s)
- **Frame independence**: Large frame dt is subdivided automatically
- **dt capping**: Maximum 100ms to prevent jumps from tab switching
- **Speed control**: Multipliers applied only during automatic playback

### Coordinate System
- **Positive direction**: Downward (gravity acts positively)
- **Zero position**: Natural length of spring
- **Initial position**: Typically 1-2m below natural length

### Numerical Stability
- RK4 is stable for typical spring constants and masses
- Adaptive methods automatically adjust for stiff problems
- Modified midpoint is particularly good for oscillatory systems

### Performance Considerations
- RK4 with fixed timestep: 4 derivative evaluations per substep
- Adaptive RK45: 7 evaluations per attempt (may retry)
- Typical frame: 0.016s divided into ~16 substeps = 64 evaluations
- All solvers reuse temporary arrays to minimize allocations

## Testing Recommendations

### Unit Tests
1. Test that natural frequency matches √(k/m)
2. Test that critical damping occurs at b = 2√(mk)
3. Test energy conservation (with b=0, F₀=0)
4. Test that resonance occurs at ω_drive = ω₀

### Integration Tests
1. Verify all solvers produce similar results for standard parameters
2. Test that solver switching works correctly
3. Test that preferences persist across sessions
4. Test preset loading

### Visual Tests
1. Underdamped should show decaying oscillation
2. Critically damped should return smoothly without overshoot
3. Overdamped should return slowly
4. Resonance should show growing amplitude at f₀
5. Energy display should decrease with damping

## Future Enhancements

Possible additions to the model:

1. **Nonlinear springs**: Add x³ term for large displacements
2. **Multiple driving forces**: Superposition of frequencies
3. **Frequency sweep**: Automatically vary driving frequency
4. **Transient analysis**: Measure rise time, settling time
5. **Amplitude response curve**: Plot A(ω) automatically
6. **Quality factor**: Display Q = ω₀/(2γ)
7. **Fourier analysis**: Show frequency spectrum

## References

- **Original implementation**: https://github.com/veillette/classicalMechanicsSimulations/
- **Spring Model Reference**: See `SPRING_MODEL_REFERENCE.md`
- **Theory**: Classical Mechanics, Goldstein et al.
- **Numerical Methods**: Numerical Recipes, Press et al.

---

*This implementation guide was created on 2025-11-02.*
