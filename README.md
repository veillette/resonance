# Resonance - Physics Simulation

An interactive physics simulation demonstrating resonance phenomena in driven oscillating systems. Built with [SceneryStack](https://scenerystack.org/), this simulation allows users to explore how multiple oscillators with different parameters respond to a driving force.

## Overview

This simulation visualizes the behavior of mass-spring systems driven by an oscillating platform. Users can observe resonance effects, phase relationships, and the influence of various physical parameters on oscillation behavior.

## Features

### Core Physics
- **Driven Oscillators**: Multiple spring-mass systems attached to a common oscillating driver plate
- **Configurable Parameters**:
  - Mass: 0.1 to 5.0 kg
  - Spring constant: 10 to 1200 N/m
  - Damping: 0.1 to 5.0 N/(m/s)
  - Driving frequency: 0.1 to 5.0 Hz
  - Driving amplitude: 0.2 to 2.0 cm
- **Gravity Toggle**: Optional gravity (9.8 m/s²) can be enabled/disabled
- **Natural Length**: Springs have a natural length of 20 cm when at equilibrium

### Oscillator Configuration Modes
1. **Same Spring Constant**: All oscillators share the same spring constant; masses vary (m, 2m, 3m, ...)
2. **Same Mass**: All oscillators share the same mass; spring constants vary (k, 2k, 3k, ...)
3. **Mixed**: Both masses and spring constants vary proportionally
4. **Same Frequency**: All oscillators have the same natural frequency (constant k/m ratio)
5. **Custom**: Each oscillator can be independently configured

### Interactive Controls
- **Multiple Resonators**: Support for 1-10 oscillators simultaneously
- **Resonator Selection**: Number spinner to select and view/edit individual oscillators
- **Real-time Parameter Adjustment**: Fine-grained control with small increments
  - Amplitude: 0.01 cm steps
  - Frequency: 0.01 Hz steps
  - Mass: 0.01 kg steps
  - Spring constant: 1 N/m steps
  - Damping: 0.1 N/(m/s) steps
- **Playback Controls**: Play/pause, step forward/backward, and speed control (slow/normal)
- **Visual Measurements**: Draggable vertical ruler (0-50 cm) for measuring oscillations

### Visual Features
- **Square Mass Blocks**: Visual representation of masses as labeled squares
- **Dynamic Springs**: Spring thickness varies with spring constant for visual feedback
- **Color-Coded Elements**: Distinct colors for driver, springs, and masses
- **Natural Frequency Display**: Real-time calculation and display of each oscillator's natural frequency

### Accessibility & Internationalization
- **Color Profiles**: Support for default, projector, and colorblind-friendly color schemes
- **Multiple Languages**: English, Spanish (Español), and French (Français)
- **Preferences Menu**: Customizable visual, simulation, and localization settings
- **Persistent Settings**: User preferences saved across sessions

## Getting Started

### Prerequisites
- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/resonance.git
cd resonance

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm start

# Open browser to http://localhost:5173
```

### Building for Production

```bash
# Create optimized production build
npm run build

# Output will be in dist/ directory
```

## Physics Background

### Natural Frequency
Each oscillator has a natural frequency determined by:
```
f₀ = (1/2π) × √(k/m)
```
where k is the spring constant and m is the mass.

### Resonance
Maximum oscillation amplitude occurs when the driving frequency matches (or is close to) the natural frequency of the oscillator. With damping, the resonance peak is:
- **Broader** with higher damping
- **Sharper** with lower damping

### Quality Factor
The sharpness of resonance is characterized by the quality factor:
```
Q = ω₀m/b = √(km)/b
```
where b is the damping coefficient.

### Driving Force Model
The driver plate oscillates sinusoidally:
```
y_plate = A × sin(ω × t)
```
This creates a time-varying boundary condition for the springs, where the spring force depends on the displacement relative to the moving plate.

## Technical Architecture

### Model-View-Controller Pattern
- **Model** (`src/screen-name/model/`): Physics calculations and state management
- **View** (`src/screen-name/view/`): Visual representation and UI
- **Screen** (`src/screen-name/`): Connects model and view

### Key Technologies
- **SceneryStack**: Physics simulation framework
- **TypeScript**: Type-safe development
- **Vite**: Fast development and building
- **Property System**: Reactive data binding for real-time updates

### Coordinate System
- **Model coordinates**: Meters, with origin at center
- **View bounds**: ±0.5 m (1 meter total visible height/width)
- **Scale**: Physical measurements match visual representation (1 cm model = 1 cm on ruler)

## Project Structure

```
resonance/
├── src/
│   ├── init.ts                    # Simulation initialization
│   ├── assert.ts                  # Assertions
│   ├── splash.ts                  # Splash screen
│   ├── brand.ts                   # Branding
│   ├── main.ts                    # Entry point
│   ├── screen-name/               # Main simulation screen
│   │   ├── SimScreen.ts           # Screen controller
│   │   ├── model/
│   │   │   └── SimModel.ts        # Multiple oscillator management
│   │   └── view/
│   │       └── SimScreenView.ts   # Visual representation
│   ├── common/
│   │   ├── model/
│   │   │   ├── ResonanceModel.ts  # Single oscillator physics
│   │   │   ├── BaseModel.ts       # Base model with ODE solver
│   │   │   └── OscillatorConfigMode.ts
│   │   ├── ResonanceColors.ts     # Color profile definitions
│   │   └── ResonanceConstants.ts  # Physical and layout constants
│   ├── i18n/                      # Internationalization
│   │   ├── strings_en.json       # English strings
│   │   ├── strings_es.json       # Spanish strings
│   │   ├── strings_fr.json       # French strings
│   │   ├── ResonanceStrings.ts   # String property exports
│   │   └── StringManager.ts      # Locale management
│   └── preferences/
│       └── ResonancePreferencesModel.ts
├── claude.md                      # Developer documentation
├── package.json
├── tsconfig.json
└── vite.config.js
```

## Configuration

### Default Values
- **Mass**: 0.25 kg
- **Spring Constant**: 100 N/m (natural frequency ~3.2 Hz)
- **Damping**: 0.5 N/(m/s)
- **Driving Amplitude**: 1.0 cm
- **Driving Frequency**: 1.0 Hz
- **Gravity**: OFF (0 m/s²)
- **Natural Length**: 20 cm

### Physics Ranges
All parameters have carefully chosen ranges for realistic simulation:
- Masses that are too small or too large relative to spring constants can produce extreme behavior
- Damping values affect how quickly oscillations decay
- Driving amplitudes are limited to centimeter scale for clear visualization

## Contributing

### Development Guidelines
See `claude.md` for detailed development instructions, including:
- Creating new simulation screens
- Implementing physics models
- Adding UI controls
- Internationalization workflow
- Color profile implementation

### Code Style
- TypeScript for type safety
- Properties for reactive state management
- Model-View separation
- Descriptive variable names
- Comments for complex physics calculations

## License

[Add your license here]

## Acknowledgments

- Built with [SceneryStack](https://scenerystack.org/)
- Physics models inspired by classical mechanics principles
- Simulation design influenced by PhET Interactive Simulations

## Contact

[Add contact information]
