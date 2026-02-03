/**
 * Keyboard shortcuts help content for Resonance simulation.
 * Displays available keyboard shortcuts in a two-column layout.
 */

import {
  TwoColumnKeyboardHelpContent,
  SliderControlsKeyboardHelpSection,
  BasicActionsKeyboardHelpSection,
} from "scenerystack/scenery-phet";
import resonance from "../ResonanceNamespace.js";

export class KeyboardShortcutsNode extends TwoColumnKeyboardHelpContent {
  public constructor() {
    // Create slider controls section (for frequency, amplitude, mass, etc.)
    const sliderControlsSection = new SliderControlsKeyboardHelpSection();

    // Create basic actions section (tab navigation, escape, etc.)
    const basicActionsSection = new BasicActionsKeyboardHelpSection();

    // Left column has slider controls, right column has basic actions
    super([sliderControlsSection], [basicActionsSection], {
      columnSpacing: 20,
      sectionSpacing: 15,
    });
  }
}

// Register with namespace for debugging accessibility
resonance.register("KeyboardShortcutsNode", KeyboardShortcutsNode);
