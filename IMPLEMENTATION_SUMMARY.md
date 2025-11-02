# Color Profiles, Preferences, and i18n Implementation Summary

## Overview
This document summarizes the implementation of color profiles, preferences menu, and internationalization (i18n) features for the Resonance simulation.

## Implemented Features

### 1. Color Profile Support ✅
**Location**: `src/common/ResonanceColors.ts`

- Implemented three color profiles:
  - **Default**: Standard colors for normal displays
  - **Projector**: High-contrast colors for projection displays
  - **Colorblind**: Colorblind-friendly color palette (CVD-safe)

- All color definitions use getter functions that dynamically return colors based on the active profile
- Profile can be changed via `setColorProfile(profile)` function
- Supports colors for:
  - Spring, mass, equilibrium visualization
  - UI panels and backgrounds
  - Text (primary and secondary)
  - Plot/graph lines (3 distinct colors)
  - Grid lines and axes
  - Energy visualization (kinetic, potential, total)
  - Phase indicators

**Example Usage**:
```typescript
import ResonanceColors, { setColorProfile } from "./common/ResonanceColors";

// Use colors in UI
const rect = new Rectangle(0, 0, 100, 50, {
  fill: ResonanceColors.panelFill,  // Adapts to active profile
  stroke: ResonanceColors.panelStroke
});

// Change profile
setColorProfile("projector");  // All colors update automatically
```

### 2. Internationalization (i18n) ✅
**Location**: `src/strings/`

- Created string files for 3 locales:
  - English (en)
  - Spanish (es)
  - French (fr)

- All user-facing text is translatable
- No hardcoded English strings in the code
- String structure organized by category:
  - Title and screen names
  - Control labels
  - Preference labels and options
  - Content text

- Updated `init.ts` to list all available locales:
  ```typescript
  availableLocales: ["en", "es", "fr"]
  ```

**String Files**:
- `src/strings/locales/en/resonance-strings.json`
- `src/strings/locales/es/resonance-strings.json`
- `src/strings/locales/fr/resonance-strings.json`
- `src/strings/ResonanceStrings.ts` - String loader with locale switching

**Example Usage**:
```typescript
import { ResonanceStrings } from "./strings/ResonanceStrings";

const text = new Text(ResonanceStrings.resonance.controls.springConstant, {
  font: "14px sans-serif"
});
```

### 3. Preferences Menu ✅
**Location**: `src/preferences/`

#### PreferencesModel (`ResonancePreferencesModel.ts`)
- Manages all user preferences with observable Properties
- Visual preferences:
  - Color profile selection (default/projector/colorblind)
  - Contrast adjustment
- Simulation preferences:
  - Show/hide energy display
  - Show/hide vectors
  - Show/hide phase indicators
  - Units selection (metric/imperial)
- **Automatic persistence** to localStorage
- All preferences save/load automatically

#### Visual Preferences Panel (`VisualPreferencesPanel.ts`)
- Radio button group for color profile selection
- Uses internationalized labels
- Updates immediately when selection changes

#### Simulation Preferences Panel (`SimulationPreferencesPanel.ts`)
- Checkboxes for display options
- Radio buttons for units selection
- All options use i18n strings

#### Preferences Dialog (`PreferencesDialog.ts`)
- Panel-based dialog with organized sections
- Contains both Visual and Simulation panels
- Close button to dismiss
- Centered on screen when opened

### 4. UI Integration ✅

**Preferences Button** (`SimScreenView.ts`):
- Gear icon button in bottom-left corner
- Opens preferences dialog when clicked
- Dialog can be closed via Close button

**Color Profile Integration** (`main.ts`):
- Listens to color profile changes
- Updates the global color system
- Dispatches event for any components that need to re-render

**View Updates** (`SimScreenView.ts`):
- Uses `ResonanceColors` for all color properties
- Uses `ResonanceStrings` for all text
- Passes preferences model to enable settings access

## File Structure

```
src/
├── common/
│   └── ResonanceColors.ts         # Color profile system
├── strings/
│   ├── ResonanceStrings.ts        # String loader
│   └── locales/
│       ├── en/resonance-strings.json
│       ├── es/resonance-strings.json
│       └── fr/resonance-strings.json
├── preferences/
│   ├── ResonancePreferencesModel.ts
│   ├── VisualPreferencesPanel.ts
│   ├── SimulationPreferencesPanel.ts
│   └── PreferencesDialog.ts
├── screen-name/
│   ├── SimScreen.ts               # Updated to pass preferences
│   └── view/
│       └── SimScreenView.ts       # Updated with colors, strings, preferences button
├── init.ts                        # Updated with available locales
└── main.ts                        # Updated with preferences integration
```

## Configuration Changes

### `tsconfig.json`
Added `"resolveJsonModule": true` to support JSON imports for string files

### `init.ts`
```typescript
availableLocales: ["en", "es", "fr"],
allowLocaleSwitching: true,
```

## Testing

The implementation has been tested and verified:
- ✅ Build succeeds without errors
- ✅ TypeScript compilation passes
- ✅ All color profiles are defined
- ✅ All string files are present for 3 locales
- ✅ Preferences persist to localStorage
- ✅ UI components use color profiles and i18n strings

## Usage for Developers

### Adding a New Color
Edit `src/common/ResonanceColors.ts`:
```typescript
const colorProfiles = {
  default: {
    // ... existing colors ...
    newColor: "#FF0000",
  },
  projector: {
    // ... existing colors ...
    newColor: "#CC0000",  // Darker for projector
  },
  colorblind: {
    // ... existing colors ...
    newColor: "#EE7733",  // CVD-safe alternative
  },
};

// Add getter
const ResonanceColors = {
  // ... existing getters ...
  get newColor() {
    return colorProfiles[activeProfile].newColor;
  },
};
```

### Adding a New String
1. Edit all JSON files in `src/strings/locales/*/resonance-strings.json`
2. Add the new key in the appropriate section
3. Provide translations for each locale

### Adding a New Preference
1. Add property to `ResonancePreferencesModel.ts`
2. Add to localStorage save/load methods
3. Add UI control in appropriate panel
4. Listen to property changes in your view

## Implementation Notes

- **Simplified Implementation**: This implementation uses a simplified approach to color profiles and i18n compared to the full SceneryStack ProfileColorProperty system. It provides the same functionality while being compatible with the available SceneryStack API.

- **Getter-based Colors**: Colors use JavaScript getters to automatically return the correct value for the active profile, eliminating the need to manually update references.

- **Automatic Persistence**: Preferences automatically save to localStorage whenever they change, and load on startup.

- **Extensible Design**: The architecture makes it easy to add new color profiles, locales, or preference options.

## Future Enhancements

Potential improvements for future iterations:
1. Add more color profiles (dark mode, high contrast, etc.)
2. Add more locales as needed
3. Integrate with SceneryStack's native ProfileColorProperty when available
4. Add preference import/export functionality
5. Add more simulation-specific preferences
6. Implement real-time locale switching (currently requires reload)

## Accessibility

The implementation prioritizes accessibility:
- **Colorblind-friendly palette**: Uses colors that are distinguishable in deuteranopia and protanopia
- **High-contrast projector mode**: Ensures visibility on projection displays
- **Internationalization**: Supports multiple languages
- **Configurable preferences**: Users can customize the experience to their needs
