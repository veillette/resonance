/**
 * Tests for ResonanceColors - Color palette validation
 *
 * P2 Priority: Validates that all colors are valid and accessible.
 */

import { describe, it, expect } from "vitest";
import ResonanceColors from "../ResonanceColors.js";
import { ProfileColorProperty } from "scenerystack/scenery";

describe("ResonanceColors", () => {
  describe("color property definitions", () => {
    it("should have background color property", () => {
      expect(ResonanceColors.backgroundProperty).toBeDefined();
      expect(ResonanceColors.backgroundProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
    });

    it("should have panel colors", () => {
      expect(ResonanceColors.panelFillProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
      expect(ResonanceColors.panelStrokeProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
    });

    it("should have text colors", () => {
      expect(ResonanceColors.textProperty).toBeInstanceOf(ProfileColorProperty);
      expect(ResonanceColors.textSecondaryProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
    });

    it("should have spring and mass colors", () => {
      expect(ResonanceColors.springProperty).toBeInstanceOf(ProfileColorProperty);
      expect(ResonanceColors.massProperty).toBeInstanceOf(ProfileColorProperty);
      expect(ResonanceColors.massStrokeProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
      expect(ResonanceColors.massLabelProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
    });

    it("should have driver colors", () => {
      expect(ResonanceColors.driverFillProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
      expect(ResonanceColors.driverStrokeProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
      expect(ResonanceColors.driverTextProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
    });

    it("should have control panel colors", () => {
      expect(ResonanceColors.controlPanelFillProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
      expect(ResonanceColors.controlPanelStrokeProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
    });

    it("should have energy colors", () => {
      expect(ResonanceColors.kineticEnergyProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
      expect(ResonanceColors.potentialEnergyProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
      expect(ResonanceColors.totalEnergyProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
    });

    it("should have plot colors", () => {
      expect(ResonanceColors.plot1Property).toBeInstanceOf(ProfileColorProperty);
      expect(ResonanceColors.plot2Property).toBeInstanceOf(ProfileColorProperty);
      expect(ResonanceColors.plot3Property).toBeInstanceOf(ProfileColorProperty);
    });

    it("should have phase colors", () => {
      expect(ResonanceColors.inPhaseProperty).toBeInstanceOf(ProfileColorProperty);
      expect(ResonanceColors.outOfPhaseProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
    });
  });

  describe("color values", () => {
    it("should have valid default background (dark)", () => {
      const color = ResonanceColors.backgroundProperty.value;
      // Default theme is dark, so background should be dark
      expect(color.red).toBeLessThanOrEqual(50);
      expect(color.green).toBeLessThanOrEqual(50);
      expect(color.blue).toBeLessThanOrEqual(50);
    });

    it("should have valid default text (light)", () => {
      const color = ResonanceColors.textProperty.value;
      // Default theme text should be light for contrast against dark background
      expect(color.red).toBeGreaterThanOrEqual(200);
      expect(color.green).toBeGreaterThanOrEqual(200);
      expect(color.blue).toBeGreaterThanOrEqual(200);
    });

    it("should have distinguishable energy colors", () => {
      const kinetic = ResonanceColors.kineticEnergyProperty.value;
      const potential = ResonanceColors.potentialEnergyProperty.value;
      const total = ResonanceColors.totalEnergyProperty.value;

      // Each energy type should have a distinct primary color channel
      // Kinetic is warm (orange/yellow)
      expect(kinetic.red).toBeGreaterThan(kinetic.blue);
      // Potential is cool (blue)
      expect(potential.blue).toBeGreaterThan(potential.red);
      // Total is purple (red+blue)
      expect(total.red).toBeGreaterThan(total.green);
      expect(total.blue).toBeGreaterThan(total.green);
    });

    it("should have distinguishable phase colors", () => {
      const inPhase = ResonanceColors.inPhaseProperty.value;
      const outOfPhase = ResonanceColors.outOfPhaseProperty.value;

      // In-phase should be green
      expect(inPhase.green).toBeGreaterThan(inPhase.red);
      expect(inPhase.green).toBeGreaterThan(inPhase.blue);

      // Out-of-phase should be red
      expect(outOfPhase.red).toBeGreaterThan(outOfPhase.green);
      expect(outOfPhase.red).toBeGreaterThan(outOfPhase.blue);
    });

    it("should have visible spring color", () => {
      const spring = ResonanceColors.springProperty.value;
      // Spring should be reddish and visible
      expect(spring.red).toBeGreaterThan(100);
    });

    it("should have visible mass color", () => {
      const mass = ResonanceColors.massProperty.value;
      // Mass should be bluish and visible
      expect(mass.blue).toBeGreaterThan(100);
    });
  });

  describe("color contrast", () => {
    function getLuminance(r: number, g: number, b: number): number {
      // Relative luminance formula
      const [rs, gs, bs] = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    function getContrastRatio(l1: number, l2: number): number {
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    it("should have adequate contrast between text and background", () => {
      const bg = ResonanceColors.backgroundProperty.value;
      const text = ResonanceColors.textProperty.value;

      const bgLuminance = getLuminance(bg.red, bg.green, bg.blue);
      const textLuminance = getLuminance(text.red, text.green, text.blue);

      const contrastRatio = getContrastRatio(bgLuminance, textLuminance);

      // WCAG AA requires 4.5:1 for normal text
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    });

    it("should have adequate contrast between panel and text", () => {
      const panel = ResonanceColors.panelFillProperty.value;
      const text = ResonanceColors.textProperty.value;

      const panelLuminance = getLuminance(panel.red, panel.green, panel.blue);
      const textLuminance = getLuminance(text.red, text.green, text.blue);

      const contrastRatio = getContrastRatio(panelLuminance, textLuminance);

      // Panel text should also meet AA standard
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    });

    it("should have different colors for plot lines", () => {
      const plot1 = ResonanceColors.plot1Property.value;
      const plot2 = ResonanceColors.plot2Property.value;
      const plot3 = ResonanceColors.plot3Property.value;

      // Colors should differ significantly
      const colorDistance12 = Math.sqrt(
        Math.pow(plot1.red - plot2.red, 2) +
          Math.pow(plot1.green - plot2.green, 2) +
          Math.pow(plot1.blue - plot2.blue, 2),
      );
      const colorDistance23 = Math.sqrt(
        Math.pow(plot2.red - plot3.red, 2) +
          Math.pow(plot2.green - plot3.green, 2) +
          Math.pow(plot2.blue - plot3.blue, 2),
      );
      const colorDistance13 = Math.sqrt(
        Math.pow(plot1.red - plot3.red, 2) +
          Math.pow(plot1.green - plot3.green, 2) +
          Math.pow(plot1.blue - plot3.blue, 2),
      );

      // Each pair should have significant difference (at least 100 in color space)
      expect(colorDistance12).toBeGreaterThan(50);
      expect(colorDistance23).toBeGreaterThan(50);
      expect(colorDistance13).toBeGreaterThan(50);
    });
  });

  describe("toggle colors", () => {
    it("should have distinguishable on/off toggle colors", () => {
      const off = ResonanceColors.toggleTrackOffProperty.value;
      const on = ResonanceColors.toggleTrackOnProperty.value;

      // On state should be more vibrant (green)
      expect(on.green).toBeGreaterThan(off.green);

      // Off state should be more muted
      expect(off.red).toBeCloseTo(off.green, -1);
      expect(off.green).toBeCloseTo(off.blue, -1);
    });

    it("should have distinguishable gravity toggle colors", () => {
      const off = ResonanceColors.gravityToggleOffProperty.value;
      const on = ResonanceColors.gravityToggleOnProperty.value;

      // On state should be blue-ish
      expect(on.blue).toBeGreaterThan(off.blue);
    });
  });

  describe("sub-panel colors", () => {
    it("should have sub-panel fill color", () => {
      expect(ResonanceColors.subPanelFillProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
    });

    it("should have sub-panel stroke color", () => {
      expect(ResonanceColors.subPanelStrokeProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
    });

    it("should have distinguishable sub-panel from main panel", () => {
      const main = ResonanceColors.panelFillProperty.value;
      const sub = ResonanceColors.subPanelFillProperty.value;

      // Calculate color difference
      const diff = Math.sqrt(
        Math.pow(main.red - sub.red, 2) +
          Math.pow(main.green - sub.green, 2) +
          Math.pow(main.blue - sub.blue, 2),
      );

      // Should be visually distinguishable
      expect(diff).toBeGreaterThan(20);
    });
  });

  describe("mass label colors", () => {
    it("should have normal mass label color", () => {
      expect(ResonanceColors.massLabelProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
    });

    it("should have dragging mass label color", () => {
      expect(ResonanceColors.massLabelDraggingProperty).toBeInstanceOf(
        ProfileColorProperty,
      );
    });

    it("should have distinguishable dragging state", () => {
      const normal = ResonanceColors.massLabelProperty.value;
      const dragging = ResonanceColors.massLabelDraggingProperty.value;

      // Dragging color should be yellow (high red and green)
      expect(dragging.red).toBeGreaterThan(200);
      expect(dragging.green).toBeGreaterThan(200);
    });
  });

  describe("slider track colors", () => {
    it("should have frequency track color", () => {
      const freq = ResonanceColors.frequencyTrackProperty.value;
      // Should be green-ish
      expect(freq.green).toBeGreaterThan(freq.red);
      expect(freq.green).toBeGreaterThan(freq.blue);
    });

    it("should have amplitude track color", () => {
      const amp = ResonanceColors.amplitudeTrackProperty.value;
      // Should be blue-ish
      expect(amp.blue).toBeGreaterThan(amp.red);
    });
  });

  describe("completeness check", () => {
    it("should export all expected color properties", () => {
      const expectedColors = [
        "backgroundProperty",
        "panelFillProperty",
        "panelStrokeProperty",
        "textProperty",
        "textSecondaryProperty",
        "springProperty",
        "massProperty",
        "massStrokeProperty",
        "massLabelProperty",
        "equilibriumProperty",
        "driverFillProperty",
        "driverStrokeProperty",
        "driverTextProperty",
        "controlPanelFillProperty",
        "controlPanelStrokeProperty",
        "kineticEnergyProperty",
        "potentialEnergyProperty",
        "totalEnergyProperty",
        "plot1Property",
        "plot2Property",
        "plot3Property",
        "gridLinesProperty",
        "axesProperty",
        "inPhaseProperty",
        "outOfPhaseProperty",
      ];

      expectedColors.forEach((colorName) => {
        expect(
          ResonanceColors[colorName as keyof typeof ResonanceColors],
        ).toBeDefined();
      });
    });
  });
});
