# Spring Model Reference
## Based on veillette's Classical Mechanics Simulations

**Repository:** https://github.com/veillette/classicalMechanicsSimulations/

This document provides a comprehensive analysis of the spring-mass system implementation from Martin Veillette's classical mechanics simulation project, focusing on the single spring model.

---

## 1. Architecture Overview

### Class Structure
```
BaseModel (abstract)
  └── SingleSpringModel
```

The implementation uses a clean separation of concerns:
- **BaseModel**: Handles time management, ODE solver selection, and stepping logic
- **SingleSpringModel**: Implements spring-specific physics (forces, energy, state)
- **ODE Solvers**: Modular numerical integration methods (RK4, Adaptive RK45, etc.)

---

## 2. Mass and Spring Constant Handling

### Properties (TypeScript NumberProperty pattern)
```typescript
massProperty: NumberProperty         // kg, default: 1.0
springConstantProperty: NumberProperty   // N/m, default: 10.0
dampingProperty: NumberProperty      // N·s/m, default: 0.1
gravityProperty: NumberProperty      // m/s², default: 9.8
naturalLengthProperty: NumberProperty    // meters, default: 1.0
```

### State Variables
```typescript
positionProperty: NumberProperty     // displacement from natural length (positive = downward)
velocityProperty: NumberProperty     // m/s
```

### Key Design Decisions
- **Vertical orientation**: Gravity acts downward, positive displacement is downward
- **Natural length reference**: Position measures displacement from unstretched spring length
- **Property pattern**: Uses observable properties that trigger updates when changed

---

## 3. Force Calculations

### Equation of Motion
The acceleration is derived from the sum of forces acting on the mass:

```
F_total = F_spring + F_damping + F_gravity

F_spring = -k * x                    (Hooke's Law, restoring force)
F_damping = -b * v                   (Linear damping, velocity-dependent)
F_gravity = m * g                    (Gravitational force)

a = F_total / m = (-k*x - b*v + m*g) / m
```

### Implementation in getDerivatives()
```typescript
getDerivatives(): number[] {
  const x = positionProperty.value
  const v = velocityProperty.value
  const k = springConstantProperty.value
  const b = dampingProperty.value
  const m = massProperty.value
  const g = gravityProperty.value

  derivatives[0] = v                           // dx/dt = v
  derivatives[1] = (-k*x - b*v + m*g) / m      // dv/dt = a

  return derivatives
}
```

### Force Components
1. **Hooke's Law (-k*x)**: Restoring force proportional to displacement
2. **Damping (-b*v)**: Resistance force proportional to velocity
3. **Gravity (m*g)**: Constant downward force

**Note:** No external driving forces are implemented in this model. For driven oscillations, a periodic force term would need to be added (e.g., `F_drive = F0 * sin(ω*t)`).

---

## 4. Numerical Integration Methods

### Available Solvers
The BaseModel supports multiple ODE solving methods:

1. **RungeKuttaSolver** (RK4) - Default, 4th order accuracy
2. **AdaptiveRK45Solver** - Adaptive 4th/5th order Runge-Kutta
3. **AdaptiveEulerSolver** - Adaptive Euler method
4. **ModifiedMidpointSolver** - Modified midpoint method

### RK4 Implementation Details
The Runge-Kutta 4th order method uses four derivative evaluations:

```
k1 = f(t, y)
k2 = f(t + dt/2, y + k1*dt/2)
k3 = f(t + dt/2, y + k2*dt/2)
k4 = f(t + dt, y + k3*dt)

y_new = y + (k1 + 2*k2 + 2*k3 + k4) * dt/6
```

### Time Stepping Architecture
```typescript
step(dt: number): void {
  // 1. Cap dt to prevent large jumps (max 100ms)
  const cappedDt = Math.min(dt, 0.1)

  // 2. Apply speed multiplier (0.5x, 1.0x, 2.0x)
  const adjustedDt = cappedDt * timeSpeedProperty.value

  // 3. Delegate to ODE solver with fixed substeps
  solver.step(adjustedDt, this)
}
```

### Fixed Substep Strategy
The RK4 solver uses a fixed timestep (default: 0.001s) internally:
- If requested dt > fixed timestep, automatically subdivides into smaller steps
- Ensures numerical stability regardless of frame rate
- Enables frame-rate independent physics

---

## 5. Energy Calculations

### Kinetic Energy
```typescript
kineticEnergyProperty = DerivedProperty.multilink(
  [massProperty, velocityProperty],
  (m, v) => 0.5 * m * v * v
)
```

Formula: **KE = ½mv²**

### Potential Energy
```typescript
potentialEnergyProperty = DerivedProperty.multilink(
  [springConstantProperty, positionProperty, massProperty, gravityProperty],
  (k, x, m, g) => 0.5 * k * x * x - m * g * x
)
```

Formula: **PE = ½kx² - mgx**

This combines:
- **Elastic potential energy**: ½kx² (energy stored in spring deformation)
- **Gravitational potential energy**: -mgx (with reference point at natural length)

**Sign convention:** Since positive x is downward, -mgx gives negative PE when stretched down.

### Total Energy
```typescript
totalEnergyProperty = DerivedProperty.multilink(
  [kineticEnergyProperty, potentialEnergyProperty],
  (KE, PE) => KE + PE
)
```

Formula: **E_total = KE + PE**

**Energy conservation:** In the absence of damping (b=0), total energy should remain constant. With damping, total energy decreases over time.

---

## 6. Initial Conditions and Reset Behavior

### Default Initial Conditions
```typescript
constructor() {
  super()

  // State initialization
  positionProperty.value = 2.0    // 2 meters below natural length
  velocityProperty.value = 0.0    // at rest

  // Default physics parameters
  massProperty.value = 1.0        // 1 kg
  springConstantProperty.value = 10.0  // 10 N/m
  dampingProperty.value = 0.1     // 0.1 N·s/m
  gravityProperty.value = 9.8     // 9.8 m/s²
  naturalLengthProperty.value = 1.0    // 1 meter
}
```

### Reset Method
```typescript
reset(): void {
  positionProperty.reset()
  velocityProperty.reset()
  massProperty.reset()
  springConstantProperty.reset()
  dampingProperty.reset()
  gravityProperty.reset()
  naturalLengthProperty.reset()

  this.resetCommon()  // Base class cleanup (time, play state, etc.)
}
```

### Preset Configurations
The simulation includes five presets demonstrating different damping regimes:

#### 1. Heavy and Slow
- Mass: 5.0 kg
- Spring Constant: 5 N/m
- Damping: 0.5 N·s/m
- Initial Position: 1.0 m
- **Behavior**: Slow, heavy oscillation with moderate damping

#### 2. Light and Bouncy
- Mass: 0.5 kg
- Spring Constant: 50 N/m
- Damping: 0.1 N·s/m
- Initial Position: 1.0 m
- **Behavior**: Fast, energetic oscillation with minimal energy loss

#### 3. Critically Damped
- Mass: 1.0 kg
- Spring Constant: 25 N/m
- Damping: 10.0 N·s/m (= 2√(mk))
- Initial Position: 1.0 m
- **Behavior**: Returns to equilibrium in minimum time without oscillating

#### 4. Underdamped
- Mass: 1.0 kg
- Spring Constant: 25 N/m
- Damping: 2.0 N·s/m (< 2√(mk))
- Initial Position: 1.0 m
- **Behavior**: Oscillates with decreasing amplitude

#### 5. Overdamped
- Mass: 1.0 kg
- Spring Constant: 25 N/m
- Damping: 20.0 N·s/m (> 2√(mk))
- Initial Position: 1.0 m
- **Behavior**: Slowly returns to equilibrium without oscillating

---

## 7. Double Spring Model (Coupled Oscillators)

The repository also includes a double-spring model with two coupled masses:

### Coupling Mechanism
```
Mass 1: m1 * a1 = -k1 * x1 + k2 * (x2 - x1) - b1 * v1 + m1 * g
Mass 2: m2 * a2 = -k2 * (x2 - x1) - b2 * v2 + m2 * g
```

### Key Features
- **k2 * (x2 - x1)**: Coupling force between masses (Newton's 3rd law pair)
- **Coupled differential equations**: Each mass affects the other's motion
- **No external driving force**: System evolves from initial conditions only

---

## 8. Implementation Recommendations for Resonance Project

### For Basic Resonance Simulation
1. **Start with SingleSpringModel structure**
   - Adapt the force calculation to include driving force
   - Add `drivingFrequencyProperty` and `drivingAmplitudeProperty`

2. **Modify getDerivatives() to include driving force**
   ```typescript
   const F_drive = drivingAmplitude * sin(drivingFrequency * time)
   derivatives[1] = (-k*x - b*v + m*g + F_drive) / m
   ```

3. **Use RK4 solver for stability**
   - Fixed timestep (0.001s) ensures accurate resonance behavior
   - Substep strategy handles variable frame rates

4. **Energy tracking**
   - Monitor how driving force adds energy to system
   - Track energy transfer at resonance frequency

### For Advanced Features
1. **Frequency sweep**: Gradually change driving frequency
2. **Phase relationship**: Track phase between driving force and displacement
3. **Amplitude response curve**: Plot amplitude vs. driving frequency
4. **Quality factor (Q)**: Calculate Q = ω₀/(2γ) where γ = b/(2m)

### Code Reuse Strategy
- **BaseModel pattern**: Abstract time management and solver selection
- **Property pattern**: Observable properties for reactive UI updates
- **Modular solvers**: Swap integration methods without changing physics
- **Preset system**: Predefined configurations for different damping regimes

---

## 9. Mathematical Summary

### Differential Equation (Undamped, No Driving Force)
```
m * ẍ + b * ẋ + k * x = m * g
```

### With Driving Force (for Resonance)
```
m * ẍ + b * ẋ + k * x = m * g + F₀ * sin(ωt)
```

### Natural Frequency
```
ω₀ = √(k/m)
```

### Damping Ratio
```
ζ = b / (2√(mk))
```

- ζ < 1: Underdamped (oscillates)
- ζ = 1: Critically damped (optimal return)
- ζ > 1: Overdamped (slow return)

### Resonance Condition
Maximum amplitude occurs when driving frequency ω ≈ ω₀ (for low damping)

---

## 10. File Structure Reference

```
classicalMechanicsSimulations/
├── src/
│   ├── common/
│   │   └── model/
│   │       ├── BaseModel.ts              # Abstract base with time stepping
│   │       ├── ODESolver.ts              # Solver interface
│   │       ├── RungeKuttaSolver.ts       # RK4 implementation
│   │       ├── AdaptiveRK45Solver.ts     # Adaptive RK45
│   │       ├── AdaptiveEulerSolver.ts    # Adaptive Euler
│   │       └── ModifiedMidpointSolver.ts # Midpoint method
│   │
│   ├── single-spring/
│   │   └── model/
│   │       ├── SingleSpringModel.ts      # Core spring physics
│   │       └── SingleSpringPresets.ts    # Configuration presets
│   │
│   └── double-spring/
│       └── model/
│           ├── DoubleSpringModel.ts      # Coupled oscillators
│           └── DoubleSpringPresets.ts    # Coupled presets
```

---

## References

- **Repository**: https://github.com/veillette/classicalMechanicsSimulations/
- **Live Demo**: https://veillette.github.io/classicalMechanicsSimulations/
- **Language**: TypeScript 99.5%
- **Build Tool**: Vite
- **Author**: Martin Veillette

---

*This reference document was generated by analyzing the veillette/classicalMechanicsSimulations repository on 2025-11-02.*
