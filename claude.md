# Claude Instructions: Writing Resonance Simulations

This document provides instructions for developing simulations about resonances of oscillators using the SceneryStack framework.

## Quick Reference

- **Technical Details**: See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for physics model, coordinate system, ODE solvers, and visual representation details
- **User Overview**: See [README.md](README.md) for features and getting started

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
│   ├── common/          # Shared code
│   │   ├── model/       # Physics models and ODE solvers
│   │   └── ResonanceColors.ts, ResonanceConstants.ts
│   ├── screen-name/     # Main simulation screen
│   │   ├── SimScreen.ts
│   │   ├── model/SimModel.ts
│   │   └── view/SimScreenView.ts
│   ├── i18n/            # Internationalization strings
│   └── preferences/     # User preferences
├── tests/               # Test files
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

### 2. Implement the Model

The model contains:
- **State variables** (Properties from scenerystack/axon)
- **Physics calculations** (see IMPLEMENTATION_GUIDE.md for equations)
- **step() method** - Called every frame with dt (delta time in seconds)
- **reset() method** - Restore initial state

```typescript
import { NumberProperty, Property } from "scenerystack/axon";

export class DampedOscillatorModel {
  public readonly massProperty: NumberProperty;
  public readonly springConstantProperty: NumberProperty;
  public readonly dampingProperty: NumberProperty;
  public readonly positionProperty: NumberProperty;
  public readonly velocityProperty: NumberProperty;

  public constructor() {
    this.massProperty = new NumberProperty(0.25);
    this.springConstantProperty = new NumberProperty(100.0);
    this.dampingProperty = new NumberProperty(0.5);
    this.positionProperty = new NumberProperty(0);
    this.velocityProperty = new NumberProperty(0);
  }

  public reset(): void {
    this.massProperty.reset();
    this.springConstantProperty.reset();
    this.dampingProperty.reset();
    this.positionProperty.reset();
    this.velocityProperty.reset();
  }

  public step(dt: number): void {
    // Physics integration - see IMPLEMENTATION_GUIDE.md for full equations
    const k = this.springConstantProperty.value;
    const b = this.dampingProperty.value;
    const m = this.massProperty.value;

    const springForce = -k * this.positionProperty.value;
    const dampingForce = -b * this.velocityProperty.value;
    const acceleration = (springForce + dampingForce) / m;

    this.velocityProperty.value += acceleration * dt;
    this.positionProperty.value += this.velocityProperty.value * dt;
  }
}
```

### 3. Implement the View

The view contains:
- **UI elements** (sliders, buttons, readouts)
- **Visualizations** (graphs, animations, diagrams)
- **step() method** - Update visual elements each frame
- **reset() method** - Reset view state

```typescript
import { ScreenView, ScreenViewOptions } from "scenerystack/sim";
import { DampedOscillatorModel } from "../model/DampedOscillatorModel.js";
import { ResetAllButton, NumberControl } from "scenerystack/scenery-phet";
import { Circle, Node, VBox } from "scenerystack/scenery";
import { Range } from "scenerystack/dot";

export class DampedOscillatorScreenView extends ScreenView {
  private readonly model: DampedOscillatorModel;
  private readonly massNode: Circle;

  public constructor(model: DampedOscillatorModel, options?: ScreenViewOptions) {
    super(options);
    this.model = model;

    // Create visualization
    this.massNode = new Circle(20, {
      fill: "blue",
      centerX: this.layoutBounds.centerX,
      centerY: this.layoutBounds.centerY,
    });
    this.addChild(this.massNode);

    // Controls panel
    const controls = new VBox({
      spacing: 15,
      align: "left",
      left: 20,
      top: 20,
      children: [
        new NumberControl("Spring Constant", model.springConstantProperty, new Range(10, 1200)),
        new NumberControl("Damping", model.dampingProperty, new Range(0.1, 5)),
      ],
    });
    this.addChild(controls);

    // Reset button
    const resetAllButton = new ResetAllButton({
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - 10,
      bottom: this.layoutBounds.maxY - 10,
    });
    this.addChild(resetAllButton);
  }

  public reset(): void {
    // Reset view-specific state
  }

  public step(dt: number): void {
    const scale = 200; // pixels per meter
    this.massNode.centerY = this.layoutBounds.centerY + this.model.positionProperty.value * scale;
  }
}
```

### 4. Implement the Screen

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
  new DampedOscillatorScreen({ tandem: Tandem.ROOT.createTandem("dampedOscillatorScreen") }),
];
```

## Required Features

### Color Profiles

All colors must use `ProfileColorProperty` for accessibility:

```typescript
import { ProfileColorProperty } from "scenerystack/scenery";

const Colors = {
  spring: new ProfileColorProperty("resonance", "spring", {
    default: "#2196F3",
    projector: "#0D47A1",
  }),
  mass: new ProfileColorProperty("resonance", "mass", {
    default: "#FF5722",
    projector: "#BF360C",
  }),
};

// Use in views
this.massNode = new Circle(20, { fill: Colors.mass });
```

### Internationalization

All strings must be translatable:

```
src/i18n/
├── ResonanceStrings.ts    # Exports string properties
├── StringManager.ts       # Locale management
├── strings_en.json        # English
├── strings_es.json        # Spanish
└── strings_fr.json        # French
```

```typescript
import { ResonanceStrings } from "../i18n/ResonanceStrings";

// Use string properties in UI
const control = new NumberControl(
  ResonanceStrings.controls.springConstantStringProperty,
  model.springConstantProperty,
  new Range(10, 1200)
);
```

### Preferences

Create a preferences model and panels:

```typescript
import { PreferencesModel } from "scenerystack/joist";
import { Property } from "scenerystack/axon";

export class ResonancePreferencesModel extends PreferencesModel {
  public readonly colorProfileProperty: Property<string>;
  public readonly showEnergyProperty: Property<boolean>;

  public constructor() {
    super();
    this.colorProfileProperty = new Property("default");
    this.showEnergyProperty = new Property(true);
  }
}
```

## Common SceneryStack APIs

### Properties (scenerystack/axon)

```typescript
import { NumberProperty, Property, BooleanProperty, DerivedProperty } from "scenerystack/axon";

const amplitude = new NumberProperty(1.0);
const isPlaying = new BooleanProperty(true);

// Observe changes
amplitude.link((value) => console.log(`Amplitude: ${value}`));

// Derived properties
const frequency = new DerivedProperty(
  [massProperty, springConstantProperty],
  (m, k) => Math.sqrt(k / m) / (2 * Math.PI)
);
```

### Scene Graph (scenerystack/scenery)

```typescript
import { Circle, Rectangle, Line, Text, Node, VBox, HBox } from "scenerystack/scenery";

const circle = new Circle(50, { fill: "red", centerX: 100, centerY: 100 });
const text = new Text("Resonance", { font: "20px sans-serif" });
const container = new VBox({ children: [circle, text], spacing: 10 });
```

### UI Controls (scenerystack/scenery-phet)

```typescript
import { NumberControl, ResetAllButton, PlayPauseButton } from "scenerystack/scenery-phet";
import { Range } from "scenerystack/dot";

const control = new NumberControl("Label", property, new Range(0, 10));
const playPause = new PlayPauseButton(isPlayingProperty);
```

## Development Workflow

```bash
npm start        # Development server at http://localhost:5173
npm run build    # Production build to dist/
npm test         # Run tests
npm run lint     # Check code style
```

## Best Practices

1. **Use Properties**: Never use plain variables for observable state
2. **Follow MVC**: Model for physics, View for visualization, Screen to connect
3. **Implement reset()**: Always provide proper reset functionality
4. **Use tandems**: Pass tandem objects for instrumentation
5. **Test stability**: Ensure physics works across parameter ranges
6. **Optimize step()**: These methods run 60 times per second
7. **No hardcoded strings**: All text must be translatable

## Quick Reference Checklist

### Physics Model
- [ ] Uses stable numerical integration (RK4 preferred)
- [ ] Implements Hooke's law, damping, and driving forces
- [ ] Calculates natural frequency correctly
- [ ] See IMPLEMENTATION_GUIDE.md for detailed equations

### Required Features
- [ ] All colors use `ProfileColorProperty`
- [ ] All strings use i18n system
- [ ] Preferences model implemented
- [ ] No hardcoded English strings

### Code Quality
- [ ] Follows MVC pattern
- [ ] Uses Properties for state
- [ ] Maintains import order
- [ ] Implements reset() methods
- [ ] Uses tandems for instrumentation

### Testing
- [ ] Simulation runs without errors
- [ ] Parameters adjust smoothly
- [ ] Color profiles work
- [ ] Locale switching works
- [ ] Reset button works
