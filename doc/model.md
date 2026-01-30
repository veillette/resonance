# Resonance Simulation - Model Description

This document describes the physics model used in the Resonance Simulation. It is designed to help educators understand the underlying mathematical models and physics concepts demonstrated by the simulation.

## Overview

The Resonance Simulation demonstrates the physics of **driven, damped harmonic oscillators**—one of the most important systems in classical mechanics. Students can explore how a mass-spring system responds when driven at different frequencies, discovering the phenomenon of **resonance** where the response amplitude becomes maximum.

The simulation supports 1 to 10 oscillators simultaneously, allowing students to compare systems with different natural frequencies and observe which ones resonate with the driving frequency.

---

## The Physical System

### Setup

The simulation models the following physical arrangement:

```
     ┌─────┐
     │  1  │ ← Mass (square block, labeled 1-10)
     └──┬──┘
        │
       /\/\/\  ← Spring (extends/compresses)
        │
   ═════════════ ← Driver plate (oscillates up and down)
        │
        │ ← Connection rod
        │
     ┌─────┐
     │     │ ← Control box (motor mechanism)
     └─────┘
```

A motor drives a plate that oscillates vertically with a controlled amplitude and frequency. Springs connect the plate to masses above it. When the plate moves, the springs transmit forces to the masses, causing them to oscillate.

This is a **displacement-driven** system—the driving mechanism moves the base of the spring rather than applying a direct force to the mass. This is how many real resonance demonstrations work (tuning forks, driven pendulums, building vibrations from earthquakes).

---

## Physics Equations

### Equation of Motion

For a single oscillator, the equation of motion comes from Newton's second law:

**m · a = F_spring + F_damping + F_gravity**

Expanding each force:

**m · a = −k · (x − x_plate) − b · v + m · g**

Where:

- **m** = mass of the block (kg)
- **a** = acceleration of the mass (m/s²)
- **k** = spring constant (N/m)
- **x** = position of the mass from equilibrium (m)
- **x_plate** = position of the driver plate = A · sin(ω · t)
- **b** = damping coefficient (N·s/m)
- **v** = velocity of the mass (m/s)
- **g** = gravitational acceleration (m/s², optional in simulation)
- **A** = amplitude of plate oscillation (m)
- **ω** = angular frequency of driving = 2π · f (rad/s)

### Forces Explained

1. **Spring Force**: F_spring = −k · (x − x_plate)
   - The spring exerts a restoring force proportional to its stretch
   - When the mass is above the plate position, the spring pulls it down
   - When the mass is below, the spring pushes it up
   - This is **Hooke's Law**

2. **Damping Force**: F_damping = −b · v
   - Opposes the motion (always acts opposite to velocity)
   - Models friction, air resistance, or internal spring losses
   - Without damping, oscillations would continue forever
   - With damping, energy is dissipated and oscillations decay

3. **Gravitational Force**: F_gravity = m · g
   - Constant downward force
   - Optional in the simulation (Moon's gravity: 1.62 m/s² when enabled)
   - Shifts the equilibrium position but doesn't change the oscillation physics

---

## Key Physical Quantities

### Natural Frequency

Every mass-spring system has a **natural frequency**—the frequency at which it oscillates when displaced and released without driving:

**ω₀ = √(k/m)** (in rad/s)

**f₀ = ω₀/(2π) = (1/2π)√(k/m)** (in Hz)

This is determined entirely by the mass and spring constant:

- **Stiffer spring (larger k)** → Higher natural frequency
- **Heavier mass (larger m)** → Lower natural frequency

### Damping Ratio

The **damping ratio** (ζ, zeta) characterizes how quickly oscillations decay:

**ζ = b / (2√(m·k))**

Different damping regimes:

- **ζ < 1 (Underdamped)**: System oscillates with decreasing amplitude
- **ζ = 1 (Critically damped)**: System returns to equilibrium as fast as possible without oscillating
- **ζ > 1 (Overdamped)**: System returns slowly without oscillating

### Resonance

**Resonance** occurs when the driving frequency matches the natural frequency of the system. At resonance:

- The amplitude of oscillation is **maximum**
- For lightly damped systems, this amplitude can be much larger than the driving amplitude
- The mass motion lags behind the driving by 90° (π/2 radians)

The resonance frequency for a damped system is:

**f_resonance = f₀ · √(1 − 2ζ²)** (for ζ < 1/√2)

For light damping (ζ << 1), f_resonance ≈ f₀.

### Phase Lag

The **phase lag** (φ) describes how the mass motion relates to the driving motion:

- **f_drive << f₀**: Mass moves in phase with the plate (φ ≈ 0)
- **f_drive = f₀**: Mass lags by 90° (φ = π/2)
- **f_drive >> f₀**: Mass moves opposite to the plate (φ ≈ π)

---

## Energy in the System

The simulation tracks three forms of energy:

### Kinetic Energy

**KE = ½ · m · v²**

Energy due to the mass's motion. Maximum when passing through equilibrium (v is maximum).

### Potential Energy

**PE = ½ · k · x²** (spring only)

**PE = ½ · k · x² − m · g · x** (with gravity)

Energy stored in the stretched or compressed spring. Maximum at the turning points (x is maximum).

### Total Mechanical Energy

**E = KE + PE**

In an undamped, undriven system, total energy is conserved. With damping, energy decreases over time (dissipated as heat). With driving, energy is continuously added to the system.

At steady-state resonance, the energy input from driving equals the energy dissipated by damping.

---

## Parameter Ranges

The simulation allows students to adjust these parameters:

| Parameter           | Minimum | Maximum | Default | Unit  |
| ------------------- | ------- | ------- | ------- | ----- |
| Mass                | 0.1     | 5.0     | 0.25    | kg    |
| Spring Constant     | 10      | 6000    | 100     | N/m   |
| Damping Coefficient | 0.1     | 5.0     | 0.5     | N·s/m |
| Driving Amplitude   | 0.2     | 2.0     | 1.0     | cm    |
| Driving Frequency   | 0.1     | 5.0     | 1.0     | Hz    |

---

## Multiple Oscillators

The simulation can display 1 to 10 oscillators simultaneously, each with its own mass and spring constant. This allows students to see which systems resonate with the driving frequency.

### Configuration Modes

1. **Same Mass**: All oscillators have equal mass; spring constants vary (k, 2k, 3k, ...)
   - Natural frequencies vary as f₀, f₀/√2, f₀/√3, ...
   - Shows how spring stiffness affects resonance

2. **Same Spring Constant**: All oscillators have equal spring constant; masses vary (m, 2m, 3m, ...)
   - Natural frequencies vary as f₀, f₀/√2, f₀/√3, ...
   - Shows how mass affects resonance

3. **Same Frequency**: Both mass and spring constant vary proportionally (m, 2m, 3m... and k, 2k, 3k...)
   - All oscillators have the **same** natural frequency
   - Shows that resonance depends on the ratio k/m, not absolute values
   - Different masses respond with same frequency but different amplitudes

---

## Preset Configurations

The simulation includes presets that demonstrate key concepts:

### 1. Light and Bouncy

- Mass: 0.5 kg, Spring: 50 N/m, Damping: 0.1 N·s/m
- Natural frequency: ~1.6 Hz
- Very light damping—oscillations persist for a long time

### 2. Heavy and Slow

- Mass: 5.0 kg, Spring: 5 N/m, Damping: 0.5 N·s/m
- Natural frequency: ~0.16 Hz
- Demonstrates how heavy masses oscillate slowly

### 3. Underdamped (ζ = 0.2)

- Mass: 1 kg, Spring: 25 N/m, Damping: 2.0 N·s/m
- Oscillates with decreasing amplitude
- Most common real-world case

### 4. Critically Damped (ζ = 1.0)

- Mass: 1 kg, Spring: 25 N/m, Damping: 10.0 N·s/m
- Returns to equilibrium without oscillating
- Used in car shock absorbers, door closers

### 5. Overdamped (ζ = 2.0)

- Mass: 1 kg, Spring: 25 N/m, Damping: 20.0 N·s/m
- Slow return without oscillation
- Too much damping makes response sluggish

### 6. Resonance Demo

- Mass: 1 kg, Spring: 10 N/m, Damping: 0.3 N·s/m
- Driving frequency matches natural frequency (~0.5 Hz)
- Shows large amplitude response at resonance

---

## Educational Objectives

Students using this simulation can explore:

1. **Natural frequency dependence**: How does changing mass or spring constant affect the oscillation frequency?

2. **Resonance phenomenon**: What happens when the driving frequency matches the natural frequency?

3. **Damping effects**: How does damping affect:
   - The decay of free oscillations?
   - The amplitude at resonance?
   - The sharpness of the resonance peak?

4. **Phase relationships**: How does the phase between driving and response change with frequency?

5. **Energy flow**: Where does energy come from? Where does it go?

6. **Multiple oscillators**: When multiple systems are driven at the same frequency, which ones respond most strongly?

---

## Real-World Applications

The physics demonstrated in this simulation applies to many real systems:

- **Musical instruments**: Resonance in strings, air columns, and soundboards
- **Buildings and bridges**: Structural resonance during earthquakes or wind
- **Radio tuning**: Electronic resonance selects specific frequencies
- **Acoustic resonance**: Sound reinforcement in rooms and concert halls
- **Mechanical systems**: Car suspensions, washing machine vibrations
- **Molecular spectroscopy**: Molecules absorb light at resonant frequencies

---

## Simplifications and Assumptions

To make the simulation tractable, several simplifications are made:

1. **Linear spring**: The spring obeys Hooke's Law perfectly (F = −kx). Real springs become nonlinear at large extensions.

2. **Linear damping**: Damping force is proportional to velocity (F = −bv). Real damping may include turbulent drag (∝ v²) or dry friction.

3. **Point masses**: Masses are treated as points with no rotational motion.

4. **Vertical motion only**: The system moves only in one dimension.

5. **Massless spring**: The spring has no mass (only the block has mass).

6. **No spring-mass contact**: The spring doesn't collide with or push through the plate.

These simplifications capture the essential physics of resonance while keeping the mathematics tractable for students.

---

## Mathematical Background

### Simple Harmonic Motion (SHM)

Without damping or driving, the solution to the equation of motion is:

**x(t) = A · cos(ω₀t + φ)**

where:

- A is the amplitude (determined by initial conditions)
- ω₀ = √(k/m) is the natural angular frequency
- φ is the phase (determined by initial conditions)

### Damped Oscillation

With damping but no driving, the solution for underdamped motion (ζ < 1) is:

**x(t) = A · e^(−γt) · cos(ωd·t + φ)**

where:

- γ = b/(2m) is the damping rate
- ωd = ω₀·√(1 − ζ²) is the damped frequency (slightly lower than ω₀)

The amplitude decays exponentially with time constant τ = 1/γ = 2m/b.

### Driven Steady-State Response

After initial transients die out, the driven system reaches a steady state:

**x(t) = X · sin(ωt − φ)**

The amplitude X depends on the driving frequency:

**X = (k·A) / √[(k − m·ω²)² + (b·ω)²]**

This is maximum when ω ≈ ω₀ (resonance).

---

## Suggested Activities

1. **Finding Natural Frequency**
   - Set driving amplitude to minimum
   - Displace the mass and release
   - Measure the oscillation period and calculate f₀
   - Compare with the theoretical value f₀ = (1/2π)√(k/m)

2. **Exploring Resonance**
   - Enable driving with moderate amplitude
   - Slowly increase driving frequency from below f₀
   - Observe amplitude increase as f_drive approaches f₀
   - Note the phase lag changes through resonance

3. **Damping Comparison**
   - Set up identical oscillators with different damping
   - Observe which decays fastest
   - At resonance, observe which has largest amplitude

4. **Multiple Oscillator Resonance**
   - Enable multiple oscillators with different natural frequencies
   - Sweep driving frequency slowly
   - Watch each oscillator resonate at its natural frequency

5. **Energy Conservation**
   - Disable damping and driving
   - Displace and release the mass
   - Observe KE and PE oscillating while total energy remains constant

---

## References

For further reading on the physics of oscillations and resonance:

- French, A.P. _Vibrations and Waves_ (MIT Introductory Physics Series)
- Crawford, Frank S. _Waves_ (Berkeley Physics Course, Volume 3)
- Feynman, Leighton, and Sands. _The Feynman Lectures on Physics_, Chapter 23
