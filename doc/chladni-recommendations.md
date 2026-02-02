# Chladni Screen Recommendations

This document outlines recommendations for improving the Chladni screen implementation based on code review and architectural analysis.

---

## Code Cleanup

### 1. Remove Redundant Transform Utilities

**Files affected**: `TransformManager.ts`, `ChladniTransformFactory.ts`

`TransformManager.ts` appears to duplicate `ChladniTransformFactory` functionality but isn't actively used in `ChladniScreenView`. Consider:

- Remove `TransformManager.ts` if unused
- Or consolidate the two approaches into a single utility

### 2. Complete Overlay System Implementation

**File**: `view/ChladniOverlayNode.ts`

The abstract `updateDimensions()` method implementation appears incomplete. Review and ensure all overlay subclasses properly handle dimension updates when the plate is resized.

---

## Performance Optimizations

### 3. Particle Memory Allocation

**File**: `model/ParticleManager.ts`

Currently, `initialize()` allocates new `Vector2` objects on every call. For large particle counts (25k), this creates GC pressure.

**Recommendation**: Reuse the existing particle array and update positions in-place rather than creating new objects:

```typescript
// Instead of creating new Vector2 instances
this.particlePositions[i] = new Vector2(...);

// Reuse existing instances
this.particlePositions[i].setXY(x, y);
```

### 4. Canvas Renderer Optimization

**File**: `view/renderers/CanvasParticleRenderer.ts`

The Canvas renderer redraws all particles every frame without dirty rectangle culling.

**Recommendation**: For very high particle counts, consider:

- Implement dirty region tracking for static particles
- Use WebGL exclusively when particle count exceeds 10k
- Add automatic renderer switching based on performance metrics

### 5. Progressive Resonance Curve Computation

**File**: `model/ResonanceCurveCalculator.ts`

The entire frequency range is recomputed when material or excitation position changes.

**Recommendation**: Implement lazy/progressive computation:

- Only compute visible window initially
- Compute additional ranges on demand
- Use web workers for background precomputation

---

## Feature Enhancements

### 6. Configurable Frequency Sweep Rate

**File**: `model/FrequencySweepController.ts`

The sweep rate is currently hardcoded at 66 Hz/s.

**Recommendation**: Add user-configurable sweep options:

- Slow sweep (33 Hz/s) for detailed observation
- Normal sweep (66 Hz/s) - current default
- Fast sweep (132 Hz/s) for quick overview
- Custom range sweep (start/end frequency)

### 7. Automatic Particle Replenishment

**Files**: `model/ParticleManager.ts`, `view/controls/GrainSection.ts`

In "remove" boundary mode, particle count can drop significantly over time.

**Recommendation**:

- Add optional auto-replenish when count drops below 50% of target
- Show warning indicator when particle count is low
- Track and display cumulative particle loss statistics

### 8. Plate Dimension Presets

**File**: `view/ChladniScreenView.ts` (resize handle)

Currently the plate can be freely resized.

**Recommendation**: Add preset aspect ratios for common plate configurations:

- Square (1:1)
- Golden ratio (1.618:1)
- Standard sheet metal sizes
- Display current dimensions in a tooltip during resize

---

## Visualization Enhancements

### 9. Displacement Colormap Visualization

Add an optional colormap overlay showing displacement magnitude across the plate surface. This would be educational for understanding the nodal patterns.

**Implementation approach**:

- Create `DisplacementColormapNode` extending the overlay system
- Use gradient colors (blue-white-red) for negative-zero-positive displacement
- Add toggle in Display Options section

### 10. Modal Shape Visualization Mode

Add a mode to visualize individual modal shapes (m,n patterns) to help users understand how the superposition creates the final pattern.

**Features**:

- Mode selector for specific (m,n) combinations
- Show contribution strength of each mode at current frequency
- Animate between modes to show constructive/destructive interference

### 11. Resonance Curve Enhancements

**File**: `view/ResonanceCurveNode.ts`

- Add peak frequency markers with labels
- Show Q-factor (quality factor) for resonance peaks
- Add option to display logarithmic frequency scale
- Highlight current frequency position more prominently

---

## User Experience Improvements

### 12. Enhanced Excitation Marker Interaction

**File**: `view/ExcitationMarkerNode.ts`

- Add grid snapping when Shift key is held during drag
- Show coordinate readout during drag
- Add symmetry modes (mirror excitation position)

### 13. Control Panel Organization

**File**: `view/ChladniControlPanel.ts`

- Add collapsible sections for advanced options
- Show actual vs. target particle count as percentage
- Group related controls more clearly

### 14. Keyboard Accessibility

Add keyboard controls for:

- Arrow keys to adjust frequency in small increments
- Space to toggle play/pause
- Tab navigation through control sections
- Escape to reset view/zoom

---

## Documentation Improvements

### 15. Physics Documentation

Add inline documentation for:

- `MODE_STEP = 1` rationale (vs. 2 for symmetric excitation)
- `SOURCE_THRESHOLD` value selection criteria
- `ParticleManager.step()` timeScale calculation explanation

### 16. Architecture Decision Records

Document key design decisions:

- Why dual-renderer strategy (Canvas + WebGL)
- Coordinate system choices and Y-inversion handling
- PlaybackStateMachine state transition design

---

## Priority Matrix

| Recommendation                    | Impact | Effort | Priority |
| --------------------------------- | ------ | ------ | -------- |
| Remove redundant TransformManager | Low    | Low    | P3       |
| Particle memory optimization      | Medium | Medium | P2       |
| Configurable sweep rate           | Medium | Low    | P2       |
| Auto particle replenishment       | Medium | Low    | P2       |
| Displacement colormap             | High   | Medium | P1       |
| Modal shape visualization         | High   | High   | P2       |
| Keyboard accessibility            | Medium | Medium | P2       |
| Physics documentation             | Low    | Low    | P3       |
| Progressive curve computation     | Low    | High   | P3       |
| Plate dimension presets           | Low    | Low    | P3       |

---

## Implementation Notes

When implementing these recommendations:

1. **Maintain backward compatibility** - Existing simulation behavior should not change unexpectedly
2. **Follow existing patterns** - Use the established MVC architecture and Property-based reactivity
3. **Consider performance** - Changes should not degrade frame rate, especially with high particle counts
4. **Preserve modularity** - Keep the excellent separation of concerns that exists in the current codebase
