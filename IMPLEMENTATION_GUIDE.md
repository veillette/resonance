# Resonance Model Implementation Guide

This document describes the implementation of the physics model for the Resonance simulation, based on the spring model from veillette's classical mechanics simulations.

## Architecture Overview

The implementation follows a clean, modular architecture with support for multiple coupled oscillators:

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
│       ├── ResonanceModel.ts         # Single oscillator physics model
│       └── index.ts                  # Barrel exports
├── preferences/
│   └── ResonancePreferencesModel.ts  # Includes solver selection
└── screen-name/
    ├── model/
    │   └── SimModel.ts               # Manages multiple ResonanceModel instances
    └── view/
        └── SimScreenView.ts          # Visualizes driver plate and oscillators
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

### 3. Scale and Coordinate System

The simulation uses a **centimeter-scale** coordinate system optimized for resonance phenomena:

#### Model Bounds and Scale
- **Model bounds**: ±0.5 m (symmetric, 1 meter total visible area)
- **Natural length**: 20 cm (0.2 m) - spring length at equilibrium
- **Position = 0**: Equilibrium state (mass at natural length above driver plate)
- **Coordinate convention**: Springs extend **upward** from the driver plate
  - **Positive position**: Mass moves **UP** (spring stretches)
  - **Negative position**: Mass moves **DOWN** (spring compresses)
  - **Screen coordinates**: Y increases downward, so subtract position offset when converting to view

#### Visual Scale Mapping
```typescript
// Uses ModelViewTransform2.createRectangleMapping()
// Maps model coordinates (-0.5 to 0.5 m) to view coordinates (pixels)
// Ensures 1 cm in model = 1 cm on ruler
```

### 4. ResonanceModel

The main physics model implementing a single driven, damped harmonic oscillator attached to an oscillating driver plate.

#### State Variables
```typescript
positionProperty: NumberProperty  // displacement from natural length (m), positive = upward
velocityProperty: NumberProperty  // velocity (m/s), positive = upward
```

#### Physical Parameters
```typescript
massProperty: NumberProperty              // mass (kg)
springConstantProperty: NumberProperty    // spring constant (N/m)
dampingProperty: NumberProperty           // damping coefficient (N·s/m)
gravityProperty: NumberProperty           // gravitational acceleration (m/s²)
naturalLengthProperty: NumberProperty     // natural length (m), default 0.2 m (20 cm)
```

#### Current Parameter Defaults and Ranges

| Parameter | Default | Min | Max | Increment | Unit |
|-----------|---------|-----|-----|-----------|------|
| Mass | 0.25 | 0.1 | 5.0 | 0.01 | kg |
| Spring Constant | 100 | 10 | 1200 | 1 | N/m |
| Damping | 0.5 | 0.1 | 5.0 | 0.1 | N/(m/s) |
| Driving Amplitude | 1.0 | 0.2 | 2.0 | 0.01 | cm |
| Driving Frequency | 1.0 | 0.1 | 5.0 | 0.01 | Hz |
| Gravity | 0 (OFF) | 0 | 9.8 | toggle | m/s² |
| Natural Length | 0.2 | - | - | - | m (20 cm) |
| Initial Position | 0 | - | - | - | m (equilibrium) |

**Natural frequency with defaults**: f₀ = √(100/0.25)/(2π) ≈ **3.2 Hz**

#### Driving Plate Parameters
```typescript
drivingAmplitudeProperty: NumberProperty  // Plate displacement amplitude (m)
drivingFrequencyProperty: NumberProperty  // f (Hz)
drivingEnabledProperty: Property<boolean> // on/off toggle
```

**CRITICAL**: The driving amplitude is a **plate displacement**, NOT a force amplitude.
- Displayed to user in **centimeters** (0.2-2.0 cm range)
- Stored internally in **meters** (0.002-0.02 m)
- Unit conversion handled by separate `amplitudeCmProperty` with bidirectional sync

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

### 5. Physics Equations

The model implements a driven, damped harmonic oscillator with a **time-varying boundary condition** (oscillating attachment point).

#### Driving Plate Model

The driver plate oscillates sinusoidally, creating a moving attachment point for the spring:

```typescript
platePosition(t) = amplitude × sin(ω × t)
```

The spring force is calculated **relative to the moving plate**:

```typescript
springForce = -k × (massPosition - platePosition)
```

This creates a time-varying equilibrium position rather than an external driving force.

#### Full Equation of Motion

```
m·a = -k·(x - x_plate(t)) - b·v + m·g
```

Expanding:
```
m·a = -k·x + k·A·sin(ω·t) - b·v + m·g
```

Where:
- **-k·x**: Spring restoring force (Hooke's Law)
- **k·A·sin(ω·t)**: Effective driving force from oscillating plate
- **-b·v**: Damping force (linear, velocity-dependent)
- **m·g**: Gravitational force (optional, default OFF)

**Key difference from traditional driven oscillator:**
- The "driving force" amplitude is `k·A`, not an independent force `F₀`
- Stiffer springs (larger k) produce stronger driving for the same plate displacement
- This models a more realistic mechanical driving mechanism

#### Implementation in `getDerivatives()`
```typescript
getDerivatives(t: number, state: number[]): number[] {
  const x = state[0]  // position
  const v = state[1]  // velocity

  // Calculate plate position (oscillating boundary condition)
  let platePosition = 0
  if (drivingEnabled) {
    const omega = 2 * Math.PI * frequency  // Convert Hz to rad/s
    platePosition = amplitude * Math.sin(omega * (time + t))
  }

  // Spring force relative to moving plate
  const springForce = -k * (x - platePosition)
  const dampingForce = -b * v
  const gravityForce = m * g

  // Calculate acceleration
  const a = (springForce + dampingForce + gravityForce) / m

  return [v, a]  // [dx/dt, dv/dt]
}
```

### 6. Multiple Oscillator System (SimModel)

The `SimModel` wraps and manages multiple `ResonanceModel` instances, allowing for comparative study of resonance phenomena.

#### Configuration Modes

Five preset modes determine how multiple oscillators' parameters are distributed:

1. **Same Spring Constant (k)**: All share spring constant; masses vary (m, 2m, 3m, ...)
   - Oscillator 1: m, k
   - Oscillator 2: 2m, k
   - Oscillator 3: 3m, k
   - Natural frequencies: f₀, f₀/√2, f₀/√3, ...

2. **Same Mass (m)**: All share mass; spring constants vary (k, 2k, 3k, ...)
   - Oscillator 1: m, k
   - Oscillator 2: m, 2k
   - Oscillator 3: m, 3k
   - Natural frequencies: f₀, f₀×√2, f₀×√3, ...

3. **Mixed (m and k)**: Both vary proportionally
   - Oscillator 1: m, k
   - Oscillator 2: 2m, 2k
   - Oscillator 3: 3m, 3k
   - Natural frequencies: All equal to f₀

4. **Same Frequency**: All have same natural frequency (k/m ratio constant)
   - Oscillator 1: m, k
   - Oscillator 2: 2m, 2k
   - Oscillator 3: 3m, 3k
   - Natural frequencies: All equal

5. **Custom**: User can independently configure each oscillator
   - All parameters editable for each oscillator
   - Complete freedom for exploration

#### Resonator Selection System

```typescript
// User-facing: 1-indexed display (Resonator 1, 2, 3...)
// Internal: 0-indexed arrays
resonatorSelectionProperty: NumberProperty  // Which oscillator to view/edit

// Dynamic property binding
displayedMassProperty: TReadOnlyProperty<number>
displayedSpringConstantProperty: TReadOnlyProperty<number>
// etc.
```

**Editing Rules:**
- **Base oscillator (index 0)**: Always editable; controls scaling for preset modes
- **Derived oscillators (index 1+)**: Editable only in Custom mode
- Automatic clamping: Selection adjusts when oscillator count decreases

#### Shared Parameters

All oscillators share:
- Driving frequency
- Driving amplitude (plate displacement)
- Damping coefficient
- Gravity setting
- Natural length

#### Implementation Pattern

```typescript
class SimModel extends BaseModel {
  resonators: ResonanceModel[]  // Array of 1-10 oscillators

  step(dt: number, forceStep?: boolean): void {
    // Step all oscillators with same driver plate position
    for (const resonator of this.resonators) {
      resonator.step(dt, forceStep)
    }
  }

  updateDerivedResonators(): void {
    // Called when base oscillator or mode changes
    // Recalculates masses/spring constants for derived oscillators
  }
}
```

### 7. Visual Representation

The simulation provides rich visual feedback for understanding resonance phenomena.

#### Mass Representation (Square Boxes)

Masses are rendered as **square boxes**, not circles:
- **Size**: 20×20 to 50×50 pixels depending on oscillator count
- **Numbered labels**: 1, 2, 3, ... for identification
- **Junction point**: The model position corresponds to where the spring connects to the mass (bottom of square)
- **Mass center**: Positioned 5 pixels above the junction point for realistic appearance
- **Color**: Varies with oscillator index for easy distinction

**Position mapping:**
```typescript
// Model position (0 = equilibrium) maps to junction point
// Visual mass center is offset upward by 5 pixels
junctionY = modelViewTransform.modelToViewY(baseY + position)
massCenterY = junctionY - 5  // 5 pixels above junction
```

#### Spring Representation

Springs use `ParametricSpringNode` extending **upward** from driver plate:
- **Configuration**: 10 loops, 5 pixel radius
- **Line width**: Varies with spring constant (1-5 pixels for visual feedback)
  - Stiffer springs = thicker lines
  - Provides intuitive visual cue about stiffness
- **Dynamic length**: Adjusts based on mass position and plate position
- **Attachment**: Bottom attaches to oscillating driver plate, top to mass junction point

#### Driver System

Three-part visual system:

1. **Control Box**: Gray box at bottom containing frequency/amplitude indicators
   - Static position at bottom of simulation area
   - Visual representation of "driving mechanism"

2. **Connection Rod**: Vertical cylinder connecting control box to driver plate
   - Animates with plate oscillation
   - Provides visual continuity of driving motion
   - Helps users understand the mechanical driving

3. **Driver Plate**: Gray horizontal plate where all springs attach
   - Oscillates up and down: `y_plate = y_base + amplitude × sin(ω×t)`
   - All springs move with this plate
   - Creates the time-varying boundary condition

#### Ruler (Measurement Tool)

Vertical ruler for precise measurement:
- **Range**: 0-50 cm with tick marks
- **Draggable**: Can be repositioned anywhere in simulation area
- **Scale**: 1 cm on ruler = 1 cm in model (verified by ModelViewTransform)
- **Purpose**: Measure oscillation amplitudes, equilibrium positions, plate displacement

#### Layout

```
┌─────────────────────────────────────┐
│                                     │
│        Mass 1  Mass 2  Mass 3       │
│          □      □      □            │
│          |      |      |            │ ← Springs extend upward
│        ─────────────────────        │ ← Driver plate (oscillates)
│              │                      │
│              │                      │ ← Connection rod (animates)
│         ┌────────┐                  │
│         │Control │                  │ ← Control box (static)
│         │  Box   │                  │
│         └────────┘                  │
└─────────────────────────────────────┘
```

### 8. Energy Calculations

#### Kinetic Energy
```typescript
KE = ½ · m · v²
```

#### Potential Energy
```typescript
PE = ½ · k · x² + m · g · x
```

This combines:
- **Elastic potential**: ½kx² (stored in spring deformation)
- **Gravitational potential**: mgx (positive x is upward, so gravitational PE increases with height)

**Note:** With gravity OFF (default), PE simplifies to just ½kx²

#### Total Energy
```typescript
E_total = KE + PE
```

**Energy conservation:**
- Without damping and driving: Total energy is conserved
- With damping only: Energy decreases exponentially
- With plate driving: Energy can be added by the driving mechanism
- At resonance with driving: Energy input matches damping losses (steady-state)

### 9. Resonance Phenomena

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

At resonance, small plate displacements can produce large amplitude oscillations. The effective driving force amplitude is `k·A`, so:
- Stiffer springs (larger k) produce stronger resonance response for the same plate amplitude
- The quality factor Q determines the sharpness of the resonance peak

#### Phase Relationship
The phase lag φ between displacement and driving force depends on the frequency ratio:

```typescript
φ = arctan(2·ζ·ω·ω₀ / (ω₀² - ω²))
```

- **ω << ω₀**: φ ≈ 0 (in phase)
- **ω = ω₀**: φ = π/2 (90° lag)
- **ω >> ω₀**: φ ≈ π (out of phase)

### 10. Presets

Six preset configurations are provided to demonstrate different resonance behaviors:

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

### 11. Preferences Integration

The solver selection is integrated into the preferences system:

```typescript
// In ResonancePreferencesModel
solverTypeProperty: Property<SolverType>

// Persisted to localStorage
// Available in preferences dialog UI
```

Users can select their preferred ODE solver from the simulation preferences panel.

### 12. Usage Example

#### Single Oscillator Usage

```typescript
import { ResonanceModel } from "./common/model/index.js"

// Create model with preferences
const model = new ResonanceModel(preferencesModel)

// Set parameters
model.massProperty.value = 0.25  // kg
model.springConstantProperty.value = 100.0  // N/m
model.dampingProperty.value = 0.5  // N·s/m
model.drivingAmplitudeProperty.value = 0.01  // m (1.0 cm plate displacement)
model.drivingFrequencyProperty.value = 3.2  // Hz (near resonance)
model.drivingEnabledProperty.value = true
model.gravityProperty.value = 0  // Gravity off (default)

// Start simulation
model.isPlayingProperty.value = true

// Step physics (called each frame)
model.step(dt)

// Access computed properties
const f0 = model.naturalFrequencyHzProperty.value  // ≈ 3.2 Hz
const energy = model.totalEnergyProperty.value
const dampingRatio = model.dampingRatioProperty.value

// Apply preset
model.setPreset(ResonancePresets[5])  // Resonance Demo
```

#### Multiple Oscillator Usage (SimModel)

```typescript
import { SimModel } from "./screen-name/model/SimModel.js"
import { ConfigurationMode } from "./screen-name/model/ConfigurationMode.js"

// Create model with multiple oscillators
const simModel = new SimModel(preferencesModel)

// Configure oscillator system
simModel.resonatorCountProperty.value = 5  // 5 oscillators
simModel.configurationModeProperty.value = ConfigurationMode.SAME_MASS

// Set driving parameters (shared by all oscillators)
simModel.drivingFrequencyProperty.value = 2.0  // Hz
simModel.amplitudeCmProperty.value = 1.0  // cm (displayed in UI)

// Select oscillator to view/edit
simModel.resonatorSelectionProperty.value = 1  // View oscillator 2 (0-indexed)

// Access displayed properties (synced with selected oscillator)
const mass = simModel.displayedMassProperty.value
const k = simModel.displayedSpringConstantProperty.value
const f0 = simModel.displayedNaturalFrequencyHzProperty.value

// Step all oscillators
simModel.step(dt)
```

## Implementation Notes

### Unit Conversion System

The simulation handles unit conversion between internal (SI) and display units:

#### Amplitude Conversion (Meters ↔ Centimeters)

```typescript
// Internal storage: meters (0.002 - 0.02 m)
drivingAmplitudeProperty: NumberProperty

// Display property: centimeters (0.2 - 2.0 cm)
amplitudeCmProperty: DerivedProperty

// Bidirectional sync with circular update prevention
private updatingAmplitude = false

amplitudeCmProperty.link(cm => {
  if (!this.updatingAmplitude) {
    this.updatingAmplitude = true
    this.drivingAmplitudeProperty.value = cm / 100
    this.updatingAmplitude = false
  }
})
```

**Why this matters:**
- Users think in centimeters for small displacements
- Physics calculations use SI units (meters)
- Flag prevents infinite update loops
- Increment steps work naturally (0.01 cm is meaningful to users)

### Time Stepping Strategy
- **Fixed substeps**: Solvers use small fixed timesteps internally (0.001s)
- **Frame independence**: Large frame dt is subdivided automatically
- **dt capping**: Maximum 100ms to prevent jumps from tab switching
- **Speed control**: Multipliers applied only during automatic playback

### Coordinate System
- **Positive direction**: Upward (springs extend upward from driver plate)
- **Zero position**: Natural length of spring (20 cm above driver plate at rest)
- **Initial position**: 0 m (equilibrium position)
- **Screen mapping**: Y increases downward, so subtract position offset in view coordinates
- **Gravity**: When enabled, acts in negative direction (pulls mass down)

### Numerical Stability
- RK4 is stable for typical spring constants and masses
- Adaptive methods automatically adjust for stiff problems
- Modified midpoint is particularly good for oscillatory systems

### Performance Considerations
- RK4 with fixed timestep: 4 derivative evaluations per substep
- Adaptive RK45: 7 evaluations per attempt (may retry)
- Typical frame: 0.016s divided into ~16 substeps = 64 evaluations
- Multiple oscillators: Each has independent state and steps separately
- All solvers reuse temporary arrays to minimize allocations
- Spring rendering: ParametricSpringNode efficiently handles dynamic length changes

### Common Pitfalls and Solutions

#### 1. Coordinate System Confusion
**Problem:** Springs pointing wrong direction, masses moving opposite to expectations

**Solution:** Remember that:
- Positive position = mass moves UP (spring stretches)
- Screen Y increases downward, so view coordinate = baseY - position
- Spring attachment point moves with driver plate

#### 2. Circular Property Updates
**Problem:** Infinite loops when syncing properties (e.g., amplitude in m ↔ cm)

**Solution:** Use flag variables to prevent circular updates:
```typescript
private updatingAmplitude = false

property1.link(val => {
  if (!this.updatingAmplitude) {
    this.updatingAmplitude = true
    property2.value = transform(val)
    this.updatingAmplitude = false
  }
})
```

#### 3. Mass Box Positioning
**Problem:** Spring not connecting to mass correctly

**Solution:**
- Junction point is at model position (where spring attaches)
- Mass center is offset 5 pixels above junction for visual appearance
- Use `modelViewTransform.modelToViewY()` for correct positioning

#### 4. Scale Mismatch
**Problem:** Visual displacement doesn't match ruler measurements

**Solution:**
- Use `modelViewTransform.modelToViewDeltaY()` for all position conversions
- Verify model bounds (±0.5 m) map to full view bounds
- Test: 1 cm on ruler should equal 1 cm of mass displacement

#### 5. Driving Force vs Plate Displacement
**Problem:** Treating amplitude as a force rather than displacement

**Solution:**
- Amplitude is plate displacement (m or cm), not force (N)
- Effective driving force is `k × amplitude × sin(ω×t)`
- Stiffer springs produce stronger driving for same amplitude
- Document units clearly in UI (show "cm" not just a number)

#### 6. Initial Values Out of Bounds
**Problem:** Masses start off-screen or in wrong positions

**Solution:**
- Ensure initial position = 0 (equilibrium)
- Verify model bounds are ±0.5 m
- Natural length should be 0.2 m (20 cm)
- Check that view transform maps correctly

#### 7. Multiple Oscillator Synchronization
**Problem:** Oscillators getting out of sync with driver plate

**Solution:**
- All oscillators share the same time base
- Driver plate position calculated once per frame, used by all
- Each oscillator independently integrates its own state
- Verify all oscillators receive same `dt` value

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

### Physics Enhancements
1. **Nonlinear springs**: Add x³ term for large displacements (anharmonic oscillator)
2. **Coupling between oscillators**: Springs connecting masses (coupled oscillators)
3. **Frequency sweep mode**: Automatically vary driving frequency over time
4. **Variable damping**: Velocity-dependent or position-dependent damping models

### Visualization Enhancements
5. **Position vs Time graphs**: Real-time plotting for each oscillator
6. **Phase space diagrams**: Plot velocity vs position (phase portrait)
7. **Amplitude response curves**: Plot steady-state amplitude vs driving frequency
8. **Energy visualization**: Bar charts showing KE, PE, and total energy for each oscillator
9. **Phase relationship indicator**: Visual cue showing phase lag relative to driver

### Analysis Tools
10. **Transient analysis**: Measure and display rise time, settling time, overshoot
11. **Quality factor display**: Show Q = ω₀/Δω for each oscillator
12. **Fourier analysis**: Show frequency spectrum of oscillation
13. **Data export**: Export position/velocity data for external analysis

### Educational Features
14. **Guided scenarios**: Step-by-step exploration of resonance concepts
15. **Interactive tutorials**: Overlay explaining what to observe
16. **Prediction mode**: Hide motion, ask user to predict, then reveal
17. **Comparison mode**: Side-by-side comparison of two configurations

## References

- **Original implementation**: https://github.com/veillette/classicalMechanicsSimulations/
- **Spring Model Reference**: See `SPRING_MODEL_REFERENCE.md`
- **Theory**: Classical Mechanics, Goldstein et al.
- **Numerical Methods**: Numerical Recipes, Press et al.

---

*This implementation guide was created on 2025-11-02 and updated on 2026-01-27 to reflect the current oscillating plate driver model, multiple oscillator system, and visual representation details.*
