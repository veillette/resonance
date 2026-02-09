# Resonance Simulation - Model Description

This document describes the physics model used in the Resonance Simulation. It is designed to help educators understand the underlying mathematical models and physics concepts demonstrated by the simulation.

## Overview

The Resonance Simulation demonstrates the physics of **driven, damped harmonic oscillators**—one of the most important systems in classical mechanics. Students can explore how a mass-spring system responds when driven at different frequencies, discovering the phenomenon of **resonance** where the response amplitude becomes maximum.

The simulation supports 1 to 10 oscillators simultaneously, allowing students to compare systems with different natural frequencies and observe which ones resonate with the driving frequency.

---

## Coordinate Convention

The model uses a **positive-upward** coordinate system:

- **Positive x** = upward (mass displaced above equilibrium)
- **Negative x** = downward (mass displaced below equilibrium)
- **x = 0** = equilibrium position (mass at rest, at the natural spring length above the driver plate)

This matches the standard physics convention where height increases upward.

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

**m · a = −k · (x − x_plate) − b · v − m · g**

Where (positive x = upward):

- **m** = mass of the block (kg)
- **a** = acceleration of the mass (m/s²)
- **k** = spring constant (N/m)
- **x** = position of the mass from equilibrium (m, positive = upward)
- **x_plate** = position of the driver plate = A · sin(ω · t)
- **b** = damping coefficient (N·s/m)
- **v** = velocity of the mass (m/s, positive = upward)
- **g** = gravitational acceleration (m/s², always positive; the −m·g term makes gravity act downward)
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

3. **Gravitational Force**: F_gravity = −m · g
   - Constant downward force (negative in the upward-positive coordinate system)
   - Optional in the simulation (Moon's gravity: 1.62 m/s² when enabled)
   - Shifts the equilibrium position downward but doesn't change the oscillation physics

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

**PE = ½ · k · x² + m · g · x** (with gravity, since positive x = upward)

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

## Spring Presets

The Single Oscillator screen includes quick-access presets for exploring different damping regimes:

### 1. Light and Bouncy

- Mass: 0.1 kg, Spring: 100 N/m, Damping: 0.5 N·s/m
- Natural frequency: ~5.03 Hz
- Damping ratio: ζ ≈ 0.158
- Fast, lightly damped oscillations

### 2. Heavy and Slow (Default)

- Mass: 5.0 kg, Spring: 100 N/m, Damping: 2.0 N·s/m
- Natural frequency: ~0.71 Hz
- Damping ratio: ζ ≈ 0.045
- Slow, heavy oscillations with minimal damping

### 3. Underdamped

- Mass: 0.25 kg, Spring: 100 N/m, Damping: 0.5 N·s/m
- Natural frequency: ~3.18 Hz
- Damping ratio: ζ ≈ 0.050
- Classic underdamped behavior (ζ << 1)

### 4. Critically Damped

- Mass: 0.25 kg, Spring: 100 N/m, Damping: 3.16 N·s/m
- Natural frequency: ~3.18 Hz
- Damping ratio: ζ = 1.0
- Fastest return to equilibrium without oscillation
- Used in car shock absorbers, door closers

### 5. Overdamped

- Mass: 0.25 kg, Spring: 100 N/m, Damping: 5.0 N·s/m
- Natural frequency: ~3.18 Hz (undamped)
- Damping ratio: ζ ≈ 1.58
- Slow return to equilibrium, no oscillation

---

## Advanced Analytical Properties

The simulation provides extensive real-time analytical calculations beyond basic position and velocity:

### Quality Factor

**Q = √(m·k) / b**

The quality factor quantifies the sharpness of resonance:
- Higher Q → sharper resonance peak, less damping
- Q = 10 means the amplitude at resonance is 10× the static displacement
- Half-power bandwidth: Δf = f₀/Q

### Steady-State Response Amplitudes

When driven at frequency ω, the steady-state response has amplitude:

**X₀ = F₀ / √[(k − m·ω²)² + (b·ω)²]**

where F₀ is the driving force amplitude. The simulation provides:
- Steady-state displacement amplitude
- RMS displacement: X₀/√2
- RMS velocity: ω·X₀/√2
- RMS acceleration: ω²·X₀/√2

### Energy Analysis

The simulation tracks time-averaged energies in steady state:

**Kinetic Energy**: ⟨KE⟩ = ¼·m·ω²·X₀²

**Potential Energy**: ⟨PE⟩ = ¼·k·X₀²

**Total Energy**: ⟨E⟩ = ¼·(m·ω² + k)·X₀²

At resonance (ω = ω₀), kinetic and potential energies are equal: ⟨KE⟩ = ⟨PE⟩.

### Power Dissipation

**Driving Power**: ⟨P_drive⟩ = ½·F₀·ω·X₀·sin(φ)

**Damping Power**: ⟨P_damp⟩ = −½·b·ω²·X₀²

At steady state, these balance: ⟨P_drive⟩ + ⟨P_damp⟩ = 0

### Mechanical Impedance

Analogous to electrical impedance (V/I), mechanical impedance relates force to velocity:

**Z = F/v** (complex)

Components:
- **Reactance**: X = m·ω − k/ω (N·s/m)
  - Negative below resonance (spring-like)
  - Zero at resonance
  - Positive above resonance (mass-like)
- **Impedance magnitude**: |Z| = √(b² + X²)
  - Minimum at resonance where |Z| = b
- **Impedance phase**: ∠Z = φ − π/2
  - Zero at resonance (force and velocity in phase)
- **Power factor**: sin(φ) = b/|Z|
  - Unity at resonance (all power is real power)

### Resonance Characteristics

**Peak Response Frequency**: f_peak = f₀·√(1 − 2ζ²) for ζ < 1/√2

The frequency at which amplitude is maximum (slightly below f₀ for damped systems).

**Logarithmic Decrement**: δ = 2π·ζ/√(1 − ζ²)

Natural log of the ratio of successive peak amplitudes in free oscillation.

**Decay Time Constant**: τ = 2m/b

Time for free oscillation amplitude to decay to 1/e (≈37%) of initial value.

---

## Frequency Sweep Feature

The oscillator screens include an automatic frequency sweep function:

- **Sweep Range**: From minimum (0.1 Hz) to maximum (5.0 Hz) driving frequency
- **Sweep Rate**: 0.067 Hz/s (~90 seconds for full range)
- **Speed Synchronization**: Sweep rate scales with simulation speed (slow/normal/fast)
- **Automatic Driving**: Clicking sweep enables driving and starts playback
- **Pause Behavior**: Sweep pauses when simulation is paused
- **End Behavior**: Driving turns off and playback stops at maximum frequency

This feature is ideal for observing how the system response changes through resonance, with the amplitude rising to a peak at the natural frequency and declining on either side.

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
   - Verify the displayed natural frequency property matches your calculation

2. **Exploring Resonance with Frequency Sweep**
   - Select a spring preset (e.g., "Underdamped")
   - Click the frequency sweep button
   - Watch the amplitude grow as driving frequency approaches f₀
   - Observe the amplitude peak at resonance, then decline
   - Note how the phase lag changes from 0° → 90° → 180°

3. **Damping Regime Comparison**
   - Use the preset combo box to select different damping regimes
   - Compare underdamped, critically damped, and overdamped responses
   - For each preset, observe:
     - Free oscillation decay rate
     - Amplitude at resonance (when driven)
     - Quality factor Q value
   - Note: critically damped has fastest return to equilibrium without oscillation

4. **Quality Factor Investigation**
   - Start with high damping (low Q)
   - Run frequency sweep and observe broad, gentle resonance peak
   - Reduce damping (increase Q)
   - Repeat sweep and observe sharper, taller resonance peak
   - Verify relationship: peak amplitude ≈ Q × static displacement

5. **Energy Flow Analysis**
   - Enable driving at resonance (f_drive = f₀)
   - Observe steady-state energy properties:
     - ⟨KE⟩ = ⟨PE⟩ at resonance
     - ⟨P_drive⟩ = −⟨P_damp⟩ (power balance)
   - Change frequency off resonance and observe energy redistribution

6. **Mechanical Impedance Study**
   - Use frequency sweep while watching impedance properties
   - Observe:
     - Reactance X changes from negative to positive through resonance
     - Impedance magnitude |Z| reaches minimum at resonance
     - Power factor reaches unity (100% efficiency) at resonance
   - Compare to electrical RLC circuit behavior

7. **Multiple Oscillator Resonance**
   - Enable multiple oscillators with different natural frequencies
   - Use frequency sweep to automatically scan through the range
   - Watch each oscillator resonate at its natural frequency in sequence
   - Observe which system responds most strongly to which driving frequency

8. **Phase-Space Plots**
   - Open the configurable graph (if available on screen)
   - Plot velocity vs. position to see phase-space ellipses
   - Observe how the ellipse shape changes with driving frequency
   - At resonance, note the maximum ellipse size

---

## References

For further reading on the physics of oscillations and resonance:

- French, A.P. _Vibrations and Waves_ (MIT Introductory Physics Series)
- Crawford, Frank S. _Waves_ (Berkeley Physics Course, Volume 3)
- Feynman, Leighton, and Sands. _The Feynman Lectures on Physics_, Chapter 23
