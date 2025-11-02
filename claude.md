# Claude Instructions: Writing Resonance Simulations

This document provides instructions for developing simulations about resonances of oscillators using the SceneryStack framework.

## Project Overview

This is a physics simulation focused on demonstrating resonance phenomena in oscillating systems. The project uses:
- **SceneryStack**: A simulation framework providing UI, animation, and physics infrastructure
- **TypeScript**: For type-safe development
- **Vite**: For development and building
- **Model-View Pattern**: Clean separation of physics logic and visualization

## Project Structure

```
resonance/
├── src/
│   ├── init.ts          # Simulation configuration
│   ├── assert.ts        # Assertion enablement
│   ├── splash.ts        # Splash screen setup
│   ├── brand.ts         # Branding configuration
│   ├── main.ts          # Entry point, creates Sim instance
│   └── screen-name/     # Each screen represents a different simulation scenario
│       ├── SimScreen.ts      # Screen controller
│       ├── model/
│       │   └── SimModel.ts   # Physics model and state
│       └── view/
│           └── SimScreenView.ts  # Visual representation
├── package.json
├── tsconfig.json
└── vite.config.js
```

## Import Order (CRITICAL)

SceneryStack requires a **strict import order**:
1. `init.ts` - Initialize simulation metadata
2. `assert.ts` - Enable assertions
3. `splash.ts` - Setup splash screen
4. `brand.ts` - Configure branding
5. `main.ts` - Everything else

This chain is established in each file's imports. **Never break this chain.**

## Creating a New Simulation Screen

### 1. Create the Screen Directory Structure

For a screen named "damped-oscillator":
```
src/damped-oscillator/
├── DampedOscillatorScreen.ts
├── model/
│   └── DampedOscillatorModel.ts
└── view/
    └── DampedOscillatorScreenView.ts
```

### 2. Implement the Model (`model/[Name]Model.ts`)

The model contains:
- **State variables** (Properties from scenerystack/axon)
- **Physics calculations**
- **step() method** - Called every frame with dt (delta time in seconds)
- **reset() method** - Restore initial state

Example for a resonance model:
```typescript
import { NumberProperty, Property } from "scenerystack/axon";

export class DampedOscillatorModel {
  // Physics parameters
  public readonly mass = 1.0; // kg
  public readonly springConstant: Property<number>;
  public readonly dampingCoefficient: Property<number>;

  // State variables
  public readonly position: Property<number>;
  public readonly velocity: Property<number>;

  // Driving force parameters
  public readonly drivingFrequency: Property<number>;
  public readonly drivingAmplitude: Property<number>;

  public constructor() {
    this.springConstant = new NumberProperty(10.0); // N/m
    this.dampingCoefficient = new NumberProperty(0.5); // kg/s
    this.position = new NumberProperty(0);
    this.velocity = new NumberProperty(0);
    this.drivingFrequency = new NumberProperty(3.14); // rad/s
    this.drivingAmplitude = new NumberProperty(1.0); // N
  }

  public reset(): void {
    this.springConstant.reset();
    this.dampingCoefficient.reset();
    this.position.reset();
    this.velocity.reset();
    this.drivingFrequency.reset();
    this.drivingAmplitude.reset();
  }

  public step(dt: number): void {
    // Physics simulation using explicit Euler (or RK4 for better accuracy)
    const k = this.springConstant.value;
    const b = this.dampingCoefficient.value;
    const m = this.mass;
    const t = Date.now() / 1000; // Current time for driving force

    // F = F_driving - kx - bv
    const drivingForce = this.drivingAmplitude.value *
                         Math.sin(this.drivingFrequency.value * t);
    const springForce = -k * this.position.value;
    const dampingForce = -b * this.velocity.value;

    const totalForce = drivingForce + springForce + dampingForce;
    const acceleration = totalForce / m;

    // Update velocity and position
    this.velocity.value += acceleration * dt;
    this.position.value += this.velocity.value * dt;
  }
}
```

### 3. Implement the View (`view/[Name]ScreenView.ts`)

The view contains:
- **UI elements** (sliders, buttons, readouts)
- **Visualizations** (graphs, animations, diagrams)
- **step() method** - Update visual elements each frame
- **reset() method** - Reset view state

Example:
```typescript
import { ScreenView, ScreenViewOptions } from "scenerystack/sim";
import { DampedOscillatorModel } from "../model/DampedOscillatorModel.js";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { Circle, Line, Node, Rectangle, Text, VBox } from "scenerystack/scenery";
import { NumberControl } from "scenerystack/scenery-phet";
import { Range } from "scenerystack/dot";

export class DampedOscillatorScreenView extends ScreenView {
  private readonly model: DampedOscillatorModel;
  private readonly oscillatorNode: Node;
  private readonly massNode: Circle;

  public constructor(model: DampedOscillatorModel, options?: ScreenViewOptions) {
    super(options);
    this.model = model;

    // Create visualization
    const equilibriumY = this.layoutBounds.centerY;

    // Spring and mass visualization
    this.massNode = new Circle(20, {
      fill: "blue",
      centerX: this.layoutBounds.centerX,
      centerY: equilibriumY
    });

    this.oscillatorNode = new Node({
      children: [this.massNode]
    });
    this.addChild(this.oscillatorNode);

    // Controls panel
    const controls = new VBox({
      spacing: 15,
      align: "left",
      left: 20,
      top: 20,
      children: [
        new NumberControl("Spring Constant (k)", model.springConstant,
          new Range(1, 20)),
        new NumberControl("Damping (b)", model.dampingCoefficient,
          new Range(0, 2)),
        new NumberControl("Driving Frequency (ω)", model.drivingFrequency,
          new Range(0, 10)),
        new NumberControl("Driving Amplitude", model.drivingAmplitude,
          new Range(0, 5))
      ]
    });
    this.addChild(controls);

    // Reset button
    const resetAllButton = new ResetAllButton({
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - 10,
      bottom: this.layoutBounds.maxY - 10
    });
    this.addChild(resetAllButton);
  }

  public reset(): void {
    // Reset any view-specific state
  }

  public step(dt: number): void {
    // Update visualization based on model state
    const centerY = this.layoutBounds.centerY;
    const scale = 50; // pixels per meter

    this.massNode.centerY = centerY + this.model.position.value * scale;
  }
}
```

### 4. Implement the Screen (`[Name]Screen.ts`)

The screen connects model and view:
```typescript
import { Screen, ScreenOptions } from "scenerystack/sim";
import { DampedOscillatorModel } from "./model/DampedOscillatorModel.js";
import { DampedOscillatorScreenView } from "./view/DampedOscillatorScreenView.js";

export class DampedOscillatorScreen extends Screen<DampedOscillatorModel, DampedOscillatorScreenView> {
  public constructor(options: ScreenOptions) {
    super(
      () => new DampedOscillatorModel(),
      (model) => new DampedOscillatorScreenView(model),
      options
    );
  }
}
```

### 5. Register the Screen in `main.ts`

```typescript
import { DampedOscillatorScreen } from "./damped-oscillator/DampedOscillatorScreen.js";

const screens = [
  new SimScreen({ tandem: Tandem.ROOT.createTandem("simScreen") }),
  new DampedOscillatorScreen({
    tandem: Tandem.ROOT.createTandem("dampedOscillatorScreen")
  })
];
```

## Key Concepts for Resonance Simulations

### Natural Frequency
For a mass-spring system: `ω₀ = √(k/m)`

### Resonance Condition
Maximum amplitude occurs when driving frequency matches natural frequency (with damping modifications).

### Quality Factor (Q)
Measure of resonance sharpness: `Q = ω₀m/b`

### Recommended Features

1. **Multiple Visualization Modes**
   - Position vs Time graph
   - Phase space diagram (position vs velocity)
   - Amplitude vs Frequency response curve
   - Energy visualization

2. **Interactive Controls**
   - Mass slider
   - Spring constant slider
   - Damping coefficient slider
   - Driving frequency slider
   - Driving amplitude slider

3. **Presets**
   - Underdamped oscillation
   - Critically damped
   - Overdamped
   - At resonance
   - Off resonance

4. **Measurements**
   - Display current frequency
   - Show natural frequency
   - Calculate and display Q factor
   - Show energy (kinetic + potential)

## Common SceneryStack APIs

### Properties (from scenerystack/axon)
```typescript
import { NumberProperty, Property, BooleanProperty } from "scenerystack/axon";

const amplitude = new NumberProperty(1.0);
const isPlaying = new BooleanProperty(true);

// Link to observe changes
amplitude.link(value => console.log(`Amplitude: ${value}`));
```

### Scene Graph Nodes (from scenerystack/scenery)
```typescript
import { Circle, Rectangle, Line, Path, Text, Node, VBox, HBox } from "scenerystack/scenery";

const circle = new Circle(50, { fill: "red", centerX: 100, centerY: 100 });
const text = new Text("Resonance", { font: "20px sans-serif" });
const container = new VBox({ children: [circle, text], spacing: 10 });
```

### UI Controls (from scenerystack/scenery-phet)
```typescript
import { NumberControl, ResetAllButton, PlayPauseButton } from "scenerystack/scenery-phet";
import { Range } from "scenerystack/dot";

const control = new NumberControl("Label", property, new Range(0, 10));
```

## Physics Simulation Best Practices

### 1. Use Appropriate Time Integration
- **Explicit Euler**: Simple but can be unstable for stiff systems
- **RK4**: More accurate and stable for oscillatory systems
- **Velocity Verlet**: Excellent for energy conservation

### 2. Handle Time Steps
- The `dt` parameter is in seconds
- Typical values: 0.016 seconds (60 FPS)
- For stability, may need sub-stepping for fast oscillations

### 3. Scale Units Appropriately
- Keep simulation values in reasonable ranges (0.1 to 100)
- Use scaling factors when converting to screen coordinates

### 4. Numerical Stability
- Avoid very small or very large parameter values
- Clamp velocities and positions if needed
- Reset if values become NaN or Infinity

## Development Workflow

### Running the Simulation
```bash
npm start
```
Opens at http://localhost:5173

### Building for Production
```bash
npm run build
```
Creates optimized build in `dist/`

### File Naming Conventions
- Use PascalCase for classes: `DampedOscillatorModel`
- Use camelCase for files matching class names: `DampedOscillatorModel.ts`
- Use kebab-case for directory names: `damped-oscillator/`

## Common Patterns

### Listening to Property Changes
```typescript
model.frequency.link(freq => {
  // Update dependent values
  this.updateResonanceCurve();
});
```

### Creating Graphs
```typescript
import { DynamicSeriesNode } from "scenerystack/griddle";

const graph = new DynamicSeriesNode(model.timeProperty, model.positionProperty, {
  plotStyle: "line"
});
```

### Adding Play/Pause Control
```typescript
import { PlayPauseButton } from "scenerystack/scenery-phet";

const playPauseButton = new PlayPauseButton(model.isPlayingProperty, {
  centerX: this.layoutBounds.centerX,
  top: 20
});
```

## Resources

- SceneryStack Documentation: Check the scenerystack package for API documentation
- Example Simulations: Study the existing screen-name implementation
- Physics References: Classical mechanics texts for resonance equations

## Tips for Claude

When asked to implement resonance features:

1. **Always follow the MVC pattern**: Model for physics, View for visualization, Screen to connect
2. **Use Properties**: Never use plain variables for state that needs to be observed
3. **Remember the import chain**: Don't break init → assert → splash → brand → main
4. **Include reset()**: Always implement proper reset functionality
5. **Use tandems**: Pass tandem objects for instrumentation when creating screens
6. **Test with various parameters**: Ensure stability across wide range of damping/frequency values
7. **Add visual feedback**: Users should see immediate response to parameter changes
8. **Consider performance**: Optimize step() methods as they run 60 times per second

## Example Resonance Scenarios to Implement

1. **Simple Harmonic Oscillator**: No damping, no driving force
2. **Damped Oscillator**: With damping, observe decay
3. **Driven Oscillator**: With periodic driving force
4. **Resonance Explorer**: Sweep through frequencies to find resonance
5. **Coupled Oscillators**: Multiple masses and springs
6. **RLC Circuit**: Electrical analog of mechanical resonance
7. **Tacoma Narrows Bridge**: Demonstrate destructive resonance

---

Remember: The goal is to make physics concepts intuitive and interactive. Good resonance simulations show clear cause-and-effect relationships between parameters and behavior.
