# Resonance - Physics Simulation

An interactive physics simulation demonstrating resonance phenomena in driven oscillating systems. Built with [SceneryStack](https://scenerystack.org/).

## Overview

This simulation visualizes the behavior of mass-spring systems driven by an oscillating platform and Chladni plate vibration patterns. Users can observe resonance effects, phase relationships, and the influence of various physical parameters on oscillation behavior.

## Screens

### Single Oscillator

A single driven, damped harmonic oscillator attached to an oscillating driver plate. Ideal for exploring the fundamentals of resonance when driving frequency matches the natural frequency.

**Features:**
- **Spring Presets**: Quick configurations (Light and Bouncy, Heavy and Slow, Underdamped, Critically Damped, Overdamped)
- **Frequency Sweep**: Automatic sweep from min to max frequency
- **Configurable Graph**: Plot velocity vs position (phase space) with smooth sub-frame data
- **Trace Mode**: Enhanced grid scrolling synced with simulation speed

### Multiple Oscillators

Multiple oscillators (1-10) with different natural frequencies driven simultaneously. Observe which systems resonate with the driving frequency and compare their behaviors. Includes frequency sweep functionality to observe resonance peaks across the system.

### Phase Analysis

Explore phase relationships between the driving force and oscillator response. Visualize how phase lag changes as driving frequency passes through resonance. Includes configurable phase-space plots for detailed analysis.

### Chladni Patterns

Visualizes Chladni patterns - the beautiful geometric patterns formed by particles on a vibrating plate. When a plate vibrates at specific frequencies, particles migrate to the nodal lines (areas of zero displacement), revealing the resonant mode shapes.

**Features:**

- **Material Selection**: Choose between Copper, Aluminum, Zinc, or Stainless Steel plates
- **Frequency Control**: Adjust driving frequency from 50 Hz to 4000 Hz
- **Particle Count**: Select 1,000 to 25,000 particles for visualization
- **Resonance Curve**: Real-time graph showing resonance peaks
- **Boundary Modes**: Toggle between clamping particles at edges or removing them
- **Measurement Tools**: Optional ruler and grid overlays

## Features

- **Multiple Oscillators**: Support for 1-10 oscillators with configurable parameters
- **Chladni Patterns**: Visualize 2D plate vibration mode shapes
- **Spring Presets**: Pre-configured systems for exploring different damping regimes
- **Frequency Sweep**: Automatic frequency sweep across full range with speed synchronization
- **Real-time Controls**: Adjust mass, spring constant, damping, driving frequency, and amplitude
- **Configuration Modes**: Same mass, same spring constant, mixed, same frequency, or custom
- **Visual Feedback**: Dynamic springs, color-coded elements, natural frequency display
- **Advanced Analytics**: 25+ analytical properties (quality factor, impedance, power factor, energy dissipation, etc.)
- **Configurable Graphs**: Phase-space plots with sub-frame data collection for smooth visualization
- **Enhanced Trace Mode**: Grid scrolling synced with simulation speed, pause behavior, pen dot indicator
- **Multiple Solvers**: RK4, Adaptive RK4/5, and analytical solver options
- **Measurement Tools**: Draggable vertical ruler for precise measurements
- **Accessibility**: Multiple color profiles (default, projector, colorblind-friendly)
- **Internationalization**: English, Spanish, and French language support

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

```bash
git clone https://github.com/veillette/resonance.git
cd resonance
npm install
```

### Development

```bash
npm start
# Open http://localhost:5173
```

### Production Build

```bash
npm run build
# Output in dist/
```

### Testing

```bash
npm test              # Run unit tests (Vitest)
npm run test:fuzz     # Run fuzz tests (Playwright, 60s)
npm run test:coverage # Run tests with coverage report
```

## Physics Background

### Oscillator Resonance

Maximum oscillation amplitude occurs when the driving frequency matches the natural frequency of the oscillator:

```
f₀ = (1/2π) × √(k/m)
```

The driving plate oscillates sinusoidally, creating a time-varying boundary condition for the springs. At resonance, small plate displacements can produce large amplitude oscillations.

### Quality Factor and Damping Regimes

The sharpness of resonance is characterized by the quality factor Q = √(km)/b, where b is the damping coefficient. Higher Q means sharper resonance peaks.

**Damping regimes:**
- **Underdamped** (ζ < 1): Oscillatory response with exponential decay
- **Critically damped** (ζ = 1): Fastest return to equilibrium without oscillation
- **Overdamped** (ζ > 1): Slow return to equilibrium without oscillation

Where damping ratio ζ = b/(2√(mk)).

### Advanced Analytics

The simulation provides extensive analytical properties for deep physics exploration:

- **Steady-state response**: Amplitude X₀, phase φ, RMS values
- **Energy analysis**: Kinetic, potential, and total energy (time-averaged)
- **Power dissipation**: Average driving power and damping power
- **Mechanical impedance**: Reactance, magnitude, phase, power factor
- **Resonance characteristics**: Peak frequency, half-power bandwidth, logarithmic decrement

All properties update in real-time as parameters change, enabling quantitative analysis of resonance phenomena.

### Chladni Patterns

Chladni patterns demonstrate 2D resonance on vibrating plates. Named after physicist Ernst Chladni (1756-1827), these patterns reveal the nodal lines of plate vibration modes.

**Physics:**

- Wave number: `k = √(f/C)` where C is the material dispersion constant
- Modal frequencies: Determined by plate geometry and material properties
- Nodal lines: Regions where the plate displacement is zero

**Pattern Formation:**
Particles on a vibrating plate experience forces proportional to the local displacement. At high-displacement regions (antinodes), particles are pushed away. At low-displacement regions (nodal lines), particles accumulate, revealing the mode shape.

**Material Properties (Dispersion Constants):**
| Material | C (m²/s) |
|----------|----------|
| Copper | 0.178 |
| Aluminum | 0.246 |
| Zinc | 0.166 |
| Stainless Steel | 0.238 |

## Documentation

- **[Developer Guide](CLAUDE.md)** - AI assistant guide for working with the codebase, code patterns, and API usage
- **[Physics Model Guide](doc/model.md)** - Comprehensive physics model, equations, and educational guide
- **[Implementation Notes](doc/implementation-notes.md)** - Technical architecture and design patterns

## Technology

- **SceneryStack** - Physics simulation framework
- **TypeScript** - Type-safe development
- **Vite** - Fast development and building
- **Vitest** - Unit testing
- **Playwright** - End-to-end testing

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built with [SceneryStack](https://scenerystack.org/)
- Simulation design influenced by [PhET Interactive Simulations](https://phet.colorado.edu/)
