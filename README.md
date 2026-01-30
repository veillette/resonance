# Resonance - Physics Simulation

An interactive physics simulation demonstrating resonance phenomena in driven oscillating systems. Built with [SceneryStack](https://scenerystack.org/).

## Overview

This simulation visualizes the behavior of mass-spring systems driven by an oscillating platform. Users can observe resonance effects, phase relationships, and the influence of various physical parameters on oscillation behavior.

## Features

- **Multiple Oscillators**: Support for 1-10 oscillators with configurable parameters
- **Real-time Controls**: Adjust mass, spring constant, damping, driving frequency, and amplitude
- **Configuration Modes**: Same mass, same spring constant, mixed, same frequency, or custom
- **Visual Feedback**: Dynamic springs, color-coded elements, natural frequency display
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
npm test          # Run unit tests
npm run test:e2e  # Run end-to-end tests
```

## Physics Background

### Resonance

Maximum oscillation amplitude occurs when the driving frequency matches the natural frequency of the oscillator:

```
f₀ = (1/2π) × √(k/m)
```

The driving plate oscillates sinusoidally, creating a time-varying boundary condition for the springs. At resonance, small plate displacements can produce large amplitude oscillations.

### Quality Factor

The sharpness of resonance is characterized by the quality factor Q = √(km)/b, where b is the damping coefficient. Higher Q means sharper resonance peaks.

## Documentation

- **[Implementation Guide](IMPLEMENTATION_GUIDE.md)** - Technical details on physics model, coordinate system, ODE solvers, and visual representation
- **[Developer Guide](claude.md)** - Instructions for extending the simulation, code patterns, and API usage

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
