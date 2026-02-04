# Chladni Screen Recommendations

This document outlines recommendations for improving the Chladni screen implementation based on code review and architectural analysis.

---

## Code Cleanup

### 1. Complete Overlay System Implementation

**File**: `view/ChladniOverlayNode.ts`

The abstract `updateDimensions()` method implementation appears incomplete. Review and ensure all overlay subclasses properly handle dimension updates when the plate is resized.

---

## Performance Optimizations

### 2. Particle Memory Allocation ✅ IMPLEMENTED

**File**: `model/ParticleManager.ts`

**Status**: Already implemented with object pooling pattern.

The current implementation:
- Pre-allocates a fixed-size pool of `MAX_PARTICLE_COUNT` Vector2 objects at construction
- Uses `particle.setXY(x, y)` to update positions in-place
- Tracks active particles via `activeCount` rather than array resizing
- Uses swap-remove for O(1) particle deletion instead of splice's O(n)
- Maintains a cached particle view to avoid allocation on every frame

No further action needed.

### 3. Canvas Renderer Optimization

**File**: `view/renderers/CanvasParticleRenderer.ts`

The Canvas renderer redraws all particles every frame without dirty rectangle culling.

**Recommendation**: For very high particle counts, consider:

- Implement dirty region tracking for static particles
- Use WebGL exclusively when particle count exceeds 10k
- Add automatic renderer switching based on performance metrics

### 4. Progressive Resonance Curve Computation

**File**: `model/ResonanceCurveCalculator.ts`

The entire frequency range is recomputed when material or excitation position changes.

**Recommendation**: Implement lazy/progressive computation:

- Only compute visible window initially
- Compute additional ranges on demand
- Use web workers for background precomputation

---

## Feature Enhancements

### 5. Configurable Frequency Sweep Rate ✅ CONSTANTS ADDED

**File**: `model/ChladniConstants.ts`

**Status**: Sweep rate options have been added to constants. UI integration pending.

Added constants:
- `SWEEP_RATE_SLOW` (33 Hz/s): ~120 second sweep for detailed observation
- `SWEEP_RATE_NORMAL` (66 Hz/s): ~60 second sweep (default)
- `SWEEP_RATE_FAST` (132 Hz/s): ~30 second sweep for quick overview
- `SWEEP_RATE_OPTIONS`: Array of options for combo box integration

**Remaining work**: Add UI control in `FrequencySection.ts` to allow users to select sweep rate.

### 6. Automatic Particle Replenishment

**Files**: `model/ParticleManager.ts`, `view/controls/GrainSection.ts`

In "remove" boundary mode, particle count can drop significantly over time.

**Recommendation**:

- Add optional auto-replenish when count drops below 50% of target
- Show warning indicator when particle count is low
- Track and display cumulative particle loss statistics

### 7. Plate Dimension Presets

**File**: `view/ChladniScreenView.ts` (resize handle)

Currently the plate can be freely resized.

**Recommendation**: Add preset aspect ratios for common plate configurations:

- Square (1:1)
- Golden ratio (1.618:1)
- Standard sheet metal sizes
- Display current dimensions in a tooltip during resize

---

## Visualization Enhancements

### 8. Displacement Colormap Visualization ✅ IMPLEMENTED

**File**: `view/DisplacementColormapNode.ts`

**Status**: Already implemented as a complete visualization overlay.

Features:
- Extends `ChladniOverlayNode` for consistent overlay management
- Uses blue-white-red colormap (blue = negative, white = zero/nodal, red = positive)
- Efficient rendering with downsampled ImageData and smooth upscaling
- Automatic normalization based on maximum displacement
- Full accessibility support with PDOM labels

Integration:
- Can be added to `ChladniVisualizationNode` as a child
- Toggle via display options (visibility property)
- Updates via `setPsiFunction()` and `update()` methods

### 9. Modal Shape Visualization Mode

Add a mode to visualize individual modal shapes (m,n patterns) to help users understand how the superposition creates the final pattern.

**Features**:

- Mode selector for specific (m,n) combinations
- Show contribution strength of each mode at current frequency
- Animate between modes to show constructive/destructive interference

### 10. Resonance Curve Enhancements

**File**: `view/ResonanceCurveNode.ts`

- Add peak frequency markers with labels
- Show Q-factor (quality factor) for resonance peaks
- Add option to display logarithmic frequency scale
- Highlight current frequency position more prominently

---

## User Experience Improvements

### 11. Enhanced Excitation Marker Interaction

**File**: `view/ExcitationMarkerNode.ts`

- Add grid snapping when Shift key is held during drag
- Show coordinate readout during drag
- Add symmetry modes (mirror excitation position)

### 12. Control Panel Organization

**File**: `view/ChladniControlPanel.ts`

- Add collapsible sections for advanced options
- Show actual vs. target particle count as percentage
- Group related controls more clearly

### 13. Keyboard Accessibility

Add keyboard controls for:

- Arrow keys to adjust frequency in small increments
- Space to toggle play/pause
- Tab navigation through control sections
- Escape to reset view/zoom

---

## Documentation Improvements

### 14. Physics Documentation ✅ IMPLEMENTED

**File**: `model/ChladniConstants.ts`

**Status**: Detailed inline documentation has been added.

Documented:
- `MODE_STEP = 1`: Full rationale explaining why all modes are included (vs. only even
  modes for center excitation), including the physics of mode shapes φ_mn(x,y)
- `SOURCE_THRESHOLD = 0.001`: Value selection criteria explaining the 0.1% threshold
  balance between computation savings and visual accuracy
- Squared threshold optimization to avoid sqrt() in hot path

**Remaining**: `ParticleManager.step()` timeScale calculation (already has good comments)

### 15. Architecture Decision Records

Document key design decisions:

- Why dual-renderer strategy (Canvas + WebGL)
- Coordinate system choices and Y-inversion handling
- PlaybackStateMachine state transition design

---

## Priority Matrix

| Recommendation                | Impact | Effort | Priority | Status          |
| ----------------------------- | ------ | ------ | -------- | --------------- |
| Displacement colormap         | High   | Medium | P1       | ✅ Done         |
| Particle memory optimization  | Medium | Medium | P2       | ✅ Done         |
| Configurable sweep rate       | Medium | Low    | P2       | 🔶 Constants    |
| Auto particle replenishment   | Medium | Low    | P2       | Open            |
| Modal shape visualization     | High   | High   | P2       | Open            |
| Keyboard accessibility        | Medium | Medium | P2       | Open            |
| Progressive curve computation | Low    | High   | P3       | Open            |
| Plate dimension presets       | Low    | Low    | P3       | Open            |
| Physics documentation         | Low    | Low    | P3       | ✅ Done         |

---

## Implementation Notes

When implementing these recommendations:

1. **Maintain backward compatibility** - Existing simulation behavior should not change unexpectedly
2. **Follow existing patterns** - Use the established MVC architecture and Property-based reactivity
3. **Consider performance** - Changes should not degrade frame rate, especially with high particle counts
4. **Preserve modularity** - Keep the excellent separation of concerns that exists in the current codebase
