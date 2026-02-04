# Accessibility Review - Resonance Simulation

This document summarizes the current accessibility features and recommendations for improvements.

## Current Accessibility Features

### PDOM (Parallel DOM) - Comprehensive

The simulation has excellent screen reader support through the Parallel DOM:

**Implemented in:**
- `OscillatorResonatorNodeBuilder.ts` - Springs and masses have accessible names and descriptions
- `OscillatorControlPanel.ts` - All controls labeled
- `OscillatorDriverControlNode.ts` - Driver controls accessible
- `OscillatorPlaybackControlNode.ts` - Playback controls accessible
- `ExcitationMarkerNode.ts` - Draggable marker with keyboard support
- `ChladniVisualizationNode.ts`, `ChladniGridNode.ts`, `ChladniRulerNode.ts` - All overlays labeled
- `DisplacementColormapNode.ts`, `ModalShapeNode.ts` - Visualization overlays accessible
- `ResonanceCurveNode.ts` - Graph accessible

**i18n a11y strings** (`strings_en.json`):
- Complete accessibility strings for all controls
- Dynamic labels with interpolation (e.g., "Mass {{number}}")
- Descriptions explaining what each control does

### Keyboard Navigation - Good

**Implemented:**
- `KeyboardDragListener` for draggable elements (masses, excitation marker)
- `KeyboardShortcutsNode` with standard slider and basic actions help
- Arrow keys for movement, Shift+arrows for fine control
- Tab navigation for focus traversal

**Files:**
- `src/common/view/KeyboardShortcutsNode.ts` - Help dialog
- `src/common/view/OscillatorResonatorNodeBuilder.ts` - Mass keyboard drag
- `src/chladni-patterns/view/ExcitationMarkerNode.ts` - Excitation marker keyboard drag

### Sonification - Implemented

**`ResonanceSonification.ts`** provides audio feedback:
- Base pitch follows simulation frequency (scaled to audible 220-880 Hz)
- Volume increases as resonance strength increases
- Clear audio cue when at a resonance peak (threshold: 0.7 normalized strength)
- Respects global audio enabled state

### Preferences Support - Declared

In `main.ts`:
```typescript
audioOptions: {
  supportsVoicing: true,  // Declared but NOT implemented
  supportsSound: true,
},
visualOptions: {
  supportsProjectorMode: true,
  supportsInteractiveHighlights: true,
},
```

---

## Gaps and Recommendations

### 1. Voicing - NOT IMPLEMENTED (Medium Effort)

**Status**: The sim declares `supportsVoicing: true` but doesn't use SceneryStack's Voicing API.

**What's Missing**:
- No `Voicing` mixin applied to interactive nodes
- No `voicingNameResponse`, `voicingObjectResponse`, `voicingContextResponse`
- No spoken descriptions when elements receive focus

**Recommendation**:
Apply the `Voicing` mixin to key interactive elements:

```typescript
import { Voicing } from "scenerystack/scenery";

// Example: Add voicing to a control
const VoicingNode = Voicing(Node);
class MyVoicingControl extends VoicingNode {
  constructor() {
    super();
    this.voicingNameResponse = "Frequency slider";
    this.voicingObjectResponse = "2.5 hertz";
    this.voicingHintResponse = "Use arrow keys to adjust";
  }
}
```

**Priority**: P2 (Medium effort, good impact for users who prefer spoken feedback)

### 2. Live Regions / Utterance Queue - NOT IMPLEMENTED (Low Effort)

**Status**: No dynamic announcements for state changes.

**What's Missing**:
- No alerts when resonance is detected
- No announcements when frequency sweep completes
- No feedback when parameters change significantly

**Recommendation**:
Use SceneryStack's `utteranceQueue` for important state changes:

```typescript
import { Utterance, utteranceQueue } from "scenerystack/utterance-queue";

// Announce resonance detection
model.isAtResonanceProperty.link((isAtResonance) => {
  if (isAtResonance) {
    const frequency = model.frequencyProperty.value.toFixed(0);
    utteranceQueue.addToBack(
      new Utterance({
        alert: `Resonance peak detected at ${frequency} hertz`,
        alertStableDelay: 500,
      })
    );
  }
});
```

**Priority**: P1 (Low effort, high impact for screen reader users)

**Suggested alerts**:
- "Resonance peak detected at {{frequency}} Hz" (string already exists!)
- "Frequency sweep complete"
- "Particles replenished"
- "Simulation paused" / "Simulation playing"

### 3. Interactive Highlights - VERIFY (No Effort)

**Status**: Declared but should verify working correctly.

SceneryStack's interactive highlights show visual focus indicators for keyboard users. This is enabled via `supportsInteractiveHighlights: true`.

**Action**: Test with keyboard navigation to verify highlights appear on focused elements.

### 4. Additional Keyboard Shortcuts - LOW EFFORT

The existing `KeyboardShortcutsNode` uses generic sections. Could add custom shortcuts:

**Chladni screen** (string already exists in i18n):
- Space = Play/Pause
- Arrows = Frequency adjustment
- R = Reset/Replenish

**Oscillator screens**:
- Space = Play/Pause
- 1-6 = Apply presets
- G = Toggle gravity

### 5. Color Contrast - IMPLEMENTED

Already supports projector mode via `supportsProjectorMode: true` and uses `ProfileColorProperty` throughout for all colors.

---

## Implementation Priority

| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| Utterance alerts for resonance | Low | High | P1 |
| Sweep complete announcement | Low | Medium | P1 |
| Play/pause announcements | Low | Medium | P1 |
| Voicing for sliders | Medium | Medium | P2 |
| Voicing for buttons | Medium | Medium | P2 |
| Custom keyboard shortcuts help | Low | Low | P3 |

---

## Quick Win: Add Resonance Alert

The easiest accessibility improvement is adding an utterance when resonance is detected. The string already exists:

```json
"resonancePeakAlert": "Resonance peak detected at {{frequency}} Hz"
```

This can be added to `ResonanceSonification.ts` (which already tracks `isAtResonanceProperty`) or `ChladniScreenView.ts`.

---

## Files to Modify

| File | Changes |
|------|---------|
| `ChladniScreenView.ts` | Add utterance alerts for resonance, sweep complete |
| `BaseOscillatorScreenView.ts` | Add utterance for play/pause state |
| `ExcitationMarkerNode.ts` | Add voicing responses |
| `FrequencySection.ts` | Add voicing for frequency slider |
| `KeyboardShortcutsNode.ts` | Add custom sections for Chladni shortcuts |

---

## Related Documentation

- [SceneryStack Accessibility Guide](https://scenerystack.org/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [strings_en.json](../src/i18n/strings_en.json) - a11y strings section
