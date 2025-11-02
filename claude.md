# Claude Instructions: Writing Resonance Simulations

This document provides instructions for developing simulations about resonances of oscillators using the SceneryStack framework.

## Project Overview

This is a physics simulation focused on demonstrating resonance phenomena in oscillating systems. The project uses:
- **SceneryStack**: A simulation framework providing UI, animation, and physics infrastructure
- **TypeScript**: For type-safe development
- **Vite**: For development and building
- **Model-View Pattern**: Clean separation of physics logic and visualization

## Design References and Requirements

### Physics Model Reference
**The model should be based on the spring model from veillette's classical mechanics simulation on GitHub.**
- Repository: `github.com/veillette/classical-mechanics` (or similar mechanics simulation by veillette)
- Study the spring-mass system implementation including:
  - Mass and spring constant handling
  - Force calculations (Hooke's law, damping, driving forces)
  - Numerical integration methods
  - Energy calculations
  - Initial conditions and reset behavior

### Simulation Design Inspiration
**The simulation should draw from the PhET Resonance simulation:**
- Website: https://phet.colorado.edu/en/simulations/resonance
- Key features to incorporate:
  - Multiple driven oscillators with adjustable parameters
  - Visual representation of phase relationships
  - Ability to vary driving frequency and amplitude
  - Damping constant controls
  - Mass and spring constant adjustments per oscillator
  - Transient behavior visualization
  - Phase change observation above/below resonance

### Color Profile Support (REQUIRED)
**The simulation must support color profile modes** like veillette's classical mechanics simulation:
- Implement projector mode for high-contrast projection displays
- Support colorblind-friendly color schemes
- Provide light/dark theme options
- Colors should be configurable via preferences
- Use SceneryStack's `ProfileColorProperty` for adaptive colors
- Test with different color vision deficiency simulations

Example implementation pattern:
```typescript
import { ProfileColorProperty } from "scenerystack/scenery";

// Define colors that adapt to color profiles
const springColorProperty = new ProfileColorProperty('mySimulation', 'springColor', {
  default: '#0077cc',
  projector: '#003366'
});
```

### Internationalization (REQUIRED)
**All strings must be translatable** like veillette's classical mechanics simulation:
- Use SceneryStack's string system for all user-facing text
- No hardcoded English strings in the code
- Support locale switching at runtime
- Follow the pattern from `init.ts` for locale configuration

Example string usage:
```typescript
import { StringProperty } from "scenerystack/axon";

// Instead of: new Text("Spring Constant")
// Use translatable strings:
const springConstantStringProperty = new StringProperty("Spring Constant"); // This should come from a strings file
```

### Preferences Menu (REQUIRED)
**The preferences menu should be very similar to veillette's classical mechanics simulation:**
- Include visual preferences (color profiles, contrast settings)
- Include simulation preferences (units, display options)
- Include sound preferences if audio is used
- Include localization options
- Accessible via toolbar or menu button
- Persist preferences across sessions using SceneryStack's preferences system

The preferences should integrate with SceneryStack's `PreferencesModel` and include:
- Visual preferences panel
- Simulation preferences panel
- Localization preferences panel
- Audio preferences panel (if applicable)

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

## Implementing Required Features

### Implementing Color Profiles

Color profiles ensure the simulation looks good in different contexts (projectors, colorblind users, etc.).

**Step 1: Define color profiles in your model or a separate colors file**
```typescript
import { ProfileColorProperty } from "scenerystack/scenery";

// Define adaptive colors that change with color profile
const Colors = {
  spring: new ProfileColorProperty('resonance', 'spring', {
    default: '#2196F3',      // Blue for normal mode
    projector: '#0D47A1'     // Darker blue for projector mode
  }),
  mass: new ProfileColorProperty('resonance', 'mass', {
    default: '#FF5722',
    projector: '#BF360C'
  }),
  equilibrium: new ProfileColorProperty('resonance', 'equilibrium', {
    default: '#4CAF50',
    projector: '#1B5E20'
  })
};
```

**Step 2: Use ProfileColorProperty in your views**
```typescript
// In your view constructor
this.massNode = new Circle(20, {
  fill: Colors.mass  // This will automatically adapt to the color profile
});

// For lines and strokes
this.springNode = new Line(0, 0, 100, 0, {
  stroke: Colors.spring,
  lineWidth: 3
});
```

**Step 3: Add color profile controls to preferences**
The color profile selection should be available in the Visual preferences panel (see Preferences section below).

### Implementing Internationalization (i18n)

All user-facing text must be translatable and loaded from string files.

**Step 1: Create a strings directory structure**
```
src/
└── strings/
    ├── resonance-strings.ts          # Main strings file
    └── locales/
        ├── en/
        │   └── resonance-strings.json
        ├── es/
        │   └── resonance-strings.json
        └── fr/
            └── resonance-strings.json
```

**Step 2: Define strings in JSON files**
```json
// src/strings/locales/en/resonance-strings.json
{
  "resonance": {
    "title": "Resonance",
    "springConstant": "Spring Constant",
    "dampingCoefficient": "Damping Coefficient",
    "drivingFrequency": "Driving Frequency",
    "mass": "Mass",
    "reset": "Reset All"
  }
}
```

**Step 3: Load and use strings in code**
```typescript
import { getStringProperty } from "scenerystack/joist";

// Get translatable string properties
const springConstantString = getStringProperty('resonance', 'springConstant');
const massString = getStringProperty('resonance', 'mass');

// Use in UI components
const control = new NumberControl(springConstantString, model.springConstant, new Range(1, 20));
```

**Step 4: Configure available locales**
Ensure `init.ts` lists all supported locales:
```typescript
init({
  name: "resonance",
  version: "1.0.0",
  brand: "made-with-scenerystack",
  locale: "en",
  availableLocales: ["en", "es", "fr"],  // Add all supported languages
  splashDataURI: madeWithSceneryStackSplashDataURI,
  allowLocaleSwitching: true
});
```

### Implementing Preferences Menu

The preferences menu provides user-configurable options across multiple categories.

**Step 1: Create a PreferencesModel**
```typescript
// src/preferences/ResonancePreferencesModel.ts
import { PreferencesModel } from "scenerystack/joist";
import { Property } from "scenerystack/axon";

export class ResonancePreferencesModel extends PreferencesModel {
  // Visual preferences
  public readonly colorProfileProperty: Property<string>;
  public readonly contrastProperty: Property<number>;

  // Simulation preferences
  public readonly showEnergyProperty: Property<boolean>;
  public readonly showVectorsProperty: Property<boolean>;
  public readonly unitsProperty: Property<string>;

  public constructor() {
    super();

    this.colorProfileProperty = new Property('default');
    this.contrastProperty = new Property(1.0);
    this.showEnergyProperty = new Property(true);
    this.showVectorsProperty = new Property(false);
    this.unitsProperty = new Property('metric');
  }
}
```

**Step 2: Create Preferences Panels**
```typescript
// src/preferences/VisualPreferencesPanel.ts
import { PreferencesPanel } from "scenerystack/joist";
import { VBox, Text } from "scenerystack/scenery";
import { AquaRadioButtonGroup } from "scenerystack/sun";

export class VisualPreferencesPanel extends PreferencesPanel {
  public constructor(preferencesModel: ResonancePreferencesModel) {
    const colorProfileControl = new AquaRadioButtonGroup(
      preferencesModel.colorProfileProperty,
      [
        { value: 'default', createNode: () => new Text('Default') },
        { value: 'projector', createNode: () => new Text('Projector') },
        { value: 'colorblind', createNode: () => new Text('Colorblind Friendly') }
      ],
      { spacing: 10 }
    );

    const content = new VBox({
      align: 'left',
      spacing: 20,
      children: [
        new Text('Color Profile', { font: '16px sans-serif', fontWeight: 'bold' }),
        colorProfileControl
      ]
    });

    super(content, {
      title: 'Visual'
    });
  }
}
```

```typescript
// src/preferences/SimulationPreferencesPanel.ts
import { PreferencesPanel } from "scenerystack/joist";
import { VBox, Text } from "scenerystack/scenery";
import { Checkbox } from "scenerystack/sun";

export class SimulationPreferencesPanel extends PreferencesPanel {
  public constructor(preferencesModel: ResonancePreferencesModel) {
    const content = new VBox({
      align: 'left',
      spacing: 15,
      children: [
        new Text('Display Options', { font: '16px sans-serif', fontWeight: 'bold' }),
        new Checkbox(preferencesModel.showEnergyProperty, new Text('Show Energy')),
        new Checkbox(preferencesModel.showVectorsProperty, new Text('Show Vectors'))
      ]
    });

    super(content, {
      title: 'Simulation'
    });
  }
}
```

**Step 3: Register preferences with the Sim**
```typescript
// In main.ts
import { ResonancePreferencesModel } from "./preferences/ResonancePreferencesModel.js";
import { VisualPreferencesPanel } from "./preferences/VisualPreferencesPanel.js";
import { SimulationPreferencesPanel } from "./preferences/SimulationPreferencesPanel.js";

onReadyToLaunch(() => {
  const titleStringProperty = new StringProperty("Resonance");

  const screens = [
    new SimScreen({ tandem: Tandem.ROOT.createTandem("simScreen") })
  ];

  // Create preferences model
  const preferencesModel = new ResonancePreferencesModel();

  // Create sim with preferences
  const sim = new Sim(titleStringProperty, screens, {
    preferencesModel: preferencesModel,
    preferencesConfiguration: {
      visualPreferencesPanel: new VisualPreferencesPanel(preferencesModel),
      simulationPreferencesPanel: new SimulationPreferencesPanel(preferencesModel)
    }
  });

  sim.start();
});
```

**Step 4: Use preferences in your simulation**
```typescript
// In your view or model
export class DampedOscillatorScreenView extends ScreenView {
  public constructor(model: DampedOscillatorModel, preferencesModel: ResonancePreferencesModel, options?: ScreenViewOptions) {
    super(options);

    // Listen to preference changes
    preferencesModel.showEnergyProperty.link(showEnergy => {
      this.energyDisplay.visible = showEnergy;
    });

    preferencesModel.showVectorsProperty.link(showVectors => {
      this.vectorDisplay.visible = showVectors;
    });
  }
}
```

### Preferences Persistence

SceneryStack automatically persists preferences to browser localStorage. To customize:

```typescript
import { PreferencesStorage } from "scenerystack/joist";

// Preferences are automatically saved/loaded
// Custom storage keys can be set in PreferencesModel constructor
export class ResonancePreferencesModel extends PreferencesModel {
  public constructor() {
    super({
      storageKey: 'resonance-preferences'  // Custom storage key
    });
  }
}
```

## Resources

- SceneryStack Documentation: Check the scenerystack package for API documentation
- Example Simulations: Study the existing screen-name implementation
- Physics References: Classical mechanics texts for resonance equations

## Tips for Claude

When asked to implement resonance features:

1. **Study the reference implementations FIRST**:
   - Look at veillette's classical mechanics simulation on GitHub for spring model patterns
   - Review the PhET Resonance simulation (https://phet.colorado.edu/en/simulations/resonance) for feature ideas
   - Understand how color profiles, preferences, and i18n work in those simulations

2. **Always follow the MVC pattern**: Model for physics, View for visualization, Screen to connect

3. **Use Properties**: Never use plain variables for state that needs to be observed

4. **Remember the import chain**: Don't break init → assert → splash → brand → main

5. **Include reset()**: Always implement proper reset functionality

6. **Implement REQUIRED features from day one**:
   - Color profiles using `ProfileColorProperty`
   - Internationalization using string files and `getStringProperty`
   - Preferences menu with Visual and Simulation panels
   - NO hardcoded English strings in the code

7. **Use tandems**: Pass tandem objects for instrumentation when creating screens

8. **Test with various parameters**: Ensure stability across wide range of damping/frequency values

9. **Add visual feedback**: Users should see immediate response to parameter changes

10. **Consider performance**: Optimize step() methods as they run 60 times per second

11. **Test accessibility**:
    - Verify color profiles work (default, projector, colorblind)
    - Test locale switching between all supported languages
    - Ensure preferences persist across browser sessions

## Example Resonance Scenarios to Implement

1. **Simple Harmonic Oscillator**: No damping, no driving force
2. **Damped Oscillator**: With damping, observe decay
3. **Driven Oscillator**: With periodic driving force
4. **Resonance Explorer**: Sweep through frequencies to find resonance
5. **Coupled Oscillators**: Multiple masses and springs
6. **RLC Circuit**: Electrical analog of mechanical resonance
7. **Tacoma Narrows Bridge**: Demonstrate destructive resonance

---

## Quick Reference Checklist

Before considering a resonance simulation complete, verify:

### Physics Model
- [ ] Based on spring model patterns from veillette's classical mechanics simulation
- [ ] Implements Hooke's law: F = -kx
- [ ] Includes damping force: F = -bv
- [ ] Includes driving force: F = A·sin(ωt)
- [ ] Uses stable numerical integration (RK4 or Velocity Verlet preferred)
- [ ] Calculates and displays natural frequency: ω₀ = √(k/m)
- [ ] Handles transient and steady-state behavior

### Simulation Features (inspired by PhET Resonance)
- [ ] Multiple oscillators with independent parameters
- [ ] Adjustable driving frequency and amplitude
- [ ] Adjustable damping coefficient
- [ ] Adjustable mass and spring constant
- [ ] Visual representation of phase relationships
- [ ] Shows resonance effects clearly

### Color Profiles (REQUIRED)
- [ ] All colors use `ProfileColorProperty`
- [ ] Default profile defined
- [ ] Projector profile defined (high contrast)
- [ ] Colorblind-friendly profile available
- [ ] Color profile selector in Visual preferences

### Internationalization (REQUIRED)
- [ ] String files created in `src/strings/locales/`
- [ ] At least English (en) locale supported
- [ ] All UI text uses `getStringProperty()`
- [ ] NO hardcoded English strings in code
- [ ] `availableLocales` configured in `init.ts`
- [ ] `allowLocaleSwitching: true` in `init.ts`

### Preferences Menu (REQUIRED)
- [ ] `PreferencesModel` class created
- [ ] Visual preferences panel implemented
- [ ] Simulation preferences panel implemented
- [ ] Preferences accessible from UI
- [ ] Preferences persist across sessions
- [ ] Preferences affect simulation behavior

### Code Quality
- [ ] Follows MVC pattern (Model/View/Screen)
- [ ] Uses Properties for all observable state
- [ ] Maintains import order (init → assert → splash → brand → main)
- [ ] Implements reset() in model and view
- [ ] Uses tandems for instrumentation
- [ ] Optimized step() methods
- [ ] No TypeScript errors
- [ ] Follows naming conventions (PascalCase for classes, camelCase for files)

### Testing
- [ ] Simulation runs without errors
- [ ] All parameters can be adjusted smoothly
- [ ] Resonance behavior is observable
- [ ] Color profiles switch correctly
- [ ] Locale switching works
- [ ] Preferences save and load correctly
- [ ] Reset button works properly
- [ ] Performance is smooth (60 FPS)

---

Remember: The goal is to make physics concepts intuitive and interactive. Good resonance simulations show clear cause-and-effect relationships between parameters and behavior.

**Key Design Principles:**
1. Follow veillette's classical mechanics patterns for the physics model
2. Draw inspiration from PhET Resonance for simulation features
3. Implement color profiles, i18n, and preferences as core requirements, not afterthoughts
4. Make the simulation accessible, translatable, and visually adaptable from the start
