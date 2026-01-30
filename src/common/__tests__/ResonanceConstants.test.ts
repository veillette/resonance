/**
 * Tests for ResonanceConstants - Validation of magic numbers and layout constants
 *
 * P2 Priority: Validates that constants produce expected geometry and physics ranges.
 */

import { describe, it, expect } from "vitest";
import ResonanceConstants from "../ResonanceConstants.js";

describe("ResonanceConstants", () => {
  describe("physics ranges", () => {
    describe("FREQUENCY_RANGE", () => {
      it("should have positive minimum", () => {
        expect(ResonanceConstants.FREQUENCY_RANGE.min).toBeGreaterThan(0);
      });

      it("should have maximum greater than minimum", () => {
        expect(ResonanceConstants.FREQUENCY_RANGE.max).toBeGreaterThan(
          ResonanceConstants.FREQUENCY_RANGE.min,
        );
      });

      it("should cover typical resonance frequencies (0.1 to 5 Hz)", () => {
        expect(ResonanceConstants.FREQUENCY_RANGE.min).toBeLessThanOrEqual(0.5);
        expect(ResonanceConstants.FREQUENCY_RANGE.max).toBeGreaterThanOrEqual(
          2,
        );
      });

      it("should have reasonable range for user interaction", () => {
        const range =
          ResonanceConstants.FREQUENCY_RANGE.max -
          ResonanceConstants.FREQUENCY_RANGE.min;
        expect(range).toBeGreaterThan(1);
        expect(range).toBeLessThan(100);
      });
    });

    describe("AMPLITUDE_RANGE", () => {
      it("should have positive minimum", () => {
        expect(ResonanceConstants.AMPLITUDE_RANGE.min).toBeGreaterThan(0);
      });

      it("should have maximum greater than minimum", () => {
        expect(ResonanceConstants.AMPLITUDE_RANGE.max).toBeGreaterThan(
          ResonanceConstants.AMPLITUDE_RANGE.min,
        );
      });

      it("should be in meters (small values)", () => {
        // Amplitude range should be 0.002 to 0.02 meters (0.2 cm to 2 cm)
        expect(ResonanceConstants.AMPLITUDE_RANGE.min).toBeLessThan(0.1);
        expect(ResonanceConstants.AMPLITUDE_RANGE.max).toBeLessThan(0.1);
      });

      it("should represent centimeter-scale oscillations", () => {
        // Min should be around 0.2 cm = 0.002 m
        expect(ResonanceConstants.AMPLITUDE_RANGE.min).toBeGreaterThanOrEqual(
          0.001,
        );
        // Max should be around 2 cm = 0.02 m
        expect(ResonanceConstants.AMPLITUDE_RANGE.max).toBeLessThanOrEqual(
          0.05,
        );
      });
    });

    describe("RESONATOR_COUNT_RANGE", () => {
      it("should have minimum of at least 1", () => {
        expect(
          ResonanceConstants.RESONATOR_COUNT_RANGE.min,
        ).toBeGreaterThanOrEqual(1);
      });

      it("should have reasonable maximum (not too many resonators)", () => {
        expect(ResonanceConstants.RESONATOR_COUNT_RANGE.max).toBeGreaterThan(1);
        expect(
          ResonanceConstants.RESONATOR_COUNT_RANGE.max,
        ).toBeLessThanOrEqual(20);
      });

      it("should be integer range", () => {
        expect(
          Number.isInteger(ResonanceConstants.RESONATOR_COUNT_RANGE.min),
        ).toBe(true);
        expect(
          Number.isInteger(ResonanceConstants.RESONATOR_COUNT_RANGE.max),
        ).toBe(true);
      });
    });

    describe("MASS_RANGE", () => {
      it("should have positive minimum", () => {
        expect(ResonanceConstants.MASS_RANGE.min).toBeGreaterThan(0);
      });

      it("should have maximum greater than minimum", () => {
        expect(ResonanceConstants.MASS_RANGE.max).toBeGreaterThan(
          ResonanceConstants.MASS_RANGE.min,
        );
      });

      it("should represent reasonable physical masses (grams to kilograms)", () => {
        // Min should be at least 0.1 kg (100 g)
        expect(ResonanceConstants.MASS_RANGE.min).toBeGreaterThanOrEqual(0.01);
        // Max should be reasonable (< 100 kg)
        expect(ResonanceConstants.MASS_RANGE.max).toBeLessThanOrEqual(100);
      });
    });

    describe("SPRING_CONSTANT_RANGE", () => {
      it("should have positive minimum", () => {
        expect(ResonanceConstants.SPRING_CONSTANT_RANGE.min).toBeGreaterThan(0);
      });

      it("should have maximum greater than minimum", () => {
        expect(ResonanceConstants.SPRING_CONSTANT_RANGE.max).toBeGreaterThan(
          ResonanceConstants.SPRING_CONSTANT_RANGE.min,
        );
      });

      it("should cover typical spring constants (N/m)", () => {
        // Should include soft springs (< 100 N/m)
        expect(
          ResonanceConstants.SPRING_CONSTANT_RANGE.min,
        ).toBeLessThanOrEqual(100);
        // Should include stiff springs (> 1000 N/m)
        expect(
          ResonanceConstants.SPRING_CONSTANT_RANGE.max,
        ).toBeGreaterThanOrEqual(1000);
      });
    });

    describe("DAMPING_RANGE", () => {
      it("should have positive minimum", () => {
        expect(ResonanceConstants.DAMPING_RANGE.min).toBeGreaterThan(0);
      });

      it("should have maximum greater than minimum", () => {
        expect(ResonanceConstants.DAMPING_RANGE.max).toBeGreaterThan(
          ResonanceConstants.DAMPING_RANGE.min,
        );
      });
    });
  });

  describe("physics calculations", () => {
    it("should support resonance frequencies within frequency range", () => {
      // Natural frequency = sqrt(k/m) / (2*pi)
      // With min mass and max k, freq = sqrt(6000/0.1) / (2*pi) ≈ 39 Hz
      // With max mass and min k, freq = sqrt(10/5.0) / (2*pi) ≈ 0.22 Hz
      const minFreq =
        Math.sqrt(
          ResonanceConstants.SPRING_CONSTANT_RANGE.min /
            ResonanceConstants.MASS_RANGE.max,
        ) /
        (2 * Math.PI);
      const maxFreq =
        Math.sqrt(
          ResonanceConstants.SPRING_CONSTANT_RANGE.max /
            ResonanceConstants.MASS_RANGE.min,
        ) /
        (2 * Math.PI);

      // Driving frequency range should overlap with achievable natural frequencies
      expect(minFreq).toBeLessThan(ResonanceConstants.FREQUENCY_RANGE.max);
      expect(maxFreq).toBeGreaterThan(ResonanceConstants.FREQUENCY_RANGE.min);
    });

    it("should have Moon's gravity acceleration", () => {
      expect(ResonanceConstants.GRAVITY_ACCELERATION).toBeCloseTo(1.62, 2);
    });
  });

  describe("driver box dimensions", () => {
    it("should have positive width", () => {
      expect(ResonanceConstants.DRIVER_BOX_WIDTH).toBeGreaterThan(0);
    });

    it("should have positive height", () => {
      expect(ResonanceConstants.DRIVER_BOX_HEIGHT).toBeGreaterThan(0);
    });

    it("should have reasonable aspect ratio", () => {
      const aspectRatio =
        ResonanceConstants.DRIVER_BOX_WIDTH /
        ResonanceConstants.DRIVER_BOX_HEIGHT;
      // Should be wider than tall for a driver box
      expect(aspectRatio).toBeGreaterThan(1);
      expect(aspectRatio).toBeLessThan(20);
    });

    it("should have valid corner radius", () => {
      expect(
        ResonanceConstants.DRIVER_BOX_CORNER_RADIUS,
      ).toBeGreaterThanOrEqual(0);
      // Corner radius should be less than half the smaller dimension
      const maxRadius =
        Math.min(
          ResonanceConstants.DRIVER_BOX_WIDTH,
          ResonanceConstants.DRIVER_BOX_HEIGHT,
        ) / 2;
      expect(ResonanceConstants.DRIVER_BOX_CORNER_RADIUS).toBeLessThan(
        maxRadius,
      );
    });

    it("should have positive line width", () => {
      expect(ResonanceConstants.DRIVER_BOX_LINE_WIDTH).toBeGreaterThan(0);
    });
  });

  describe("driver plate dimensions", () => {
    it("should have positive plate height", () => {
      expect(ResonanceConstants.DRIVER_PLATE_HEIGHT).toBeGreaterThan(0);
    });

    it("should have positive vertical offset", () => {
      expect(ResonanceConstants.DRIVER_PLATE_VERTICAL_OFFSET).toBeGreaterThan(
        0,
      );
    });

    it("should have connection rod dimensions", () => {
      expect(ResonanceConstants.CONNECTION_ROD_WIDTH).toBeGreaterThan(0);
      expect(ResonanceConstants.CONNECTION_ROD_HEIGHT).toBeGreaterThan(0);
      expect(ResonanceConstants.CONNECTION_ROD_MIN_HEIGHT).toBeGreaterThan(0);
    });

    it("should have min rod height less than base height", () => {
      expect(ResonanceConstants.CONNECTION_ROD_MIN_HEIGHT).toBeLessThan(
        ResonanceConstants.CONNECTION_ROD_HEIGHT,
      );
    });
  });

  describe("model-view transform constants", () => {
    it("should have symmetric model bounds", () => {
      expect(ResonanceConstants.MODEL_BOUNDS_MIN).toBe(
        -ResonanceConstants.MODEL_BOUNDS_MAX,
      );
    });

    it("should represent reasonable physical scale (meters)", () => {
      const totalRange =
        ResonanceConstants.MODEL_BOUNDS_MAX -
        ResonanceConstants.MODEL_BOUNDS_MIN;
      // Should be around 1 meter total
      expect(totalRange).toBeGreaterThan(0.1);
      expect(totalRange).toBeLessThan(10);
    });
  });

  describe("spring and mass rendering", () => {
    it("should have valid mass size range", () => {
      expect(ResonanceConstants.MIN_MASS_SIZE).toBeGreaterThan(0);
      expect(ResonanceConstants.MAX_MASS_SIZE).toBeGreaterThan(
        ResonanceConstants.MIN_MASS_SIZE,
      );
    });

    it("should have positive spring parameters", () => {
      expect(ResonanceConstants.SPRING_LOOPS).toBeGreaterThan(0);
      expect(ResonanceConstants.SPRING_RADIUS).toBeGreaterThan(0);
      expect(ResonanceConstants.SPRING_ASPECT_RATIO).toBeGreaterThan(0);
      expect(ResonanceConstants.SPRING_POINTS_PER_LOOP).toBeGreaterThan(0);
    });

    it("should have valid spring line width range", () => {
      expect(ResonanceConstants.SPRING_LINE_WIDTH_MIN).toBeGreaterThan(0);
      expect(ResonanceConstants.SPRING_LINE_WIDTH_MAX).toBeGreaterThanOrEqual(
        ResonanceConstants.SPRING_LINE_WIDTH_MIN,
      );
    });

    it("should have valid min spring scale", () => {
      expect(ResonanceConstants.MIN_SPRING_XSCALE).toBeGreaterThan(0);
      expect(ResonanceConstants.MIN_SPRING_XSCALE).toBeLessThanOrEqual(1);
    });
  });

  describe("ruler constants", () => {
    it("should have positive ruler dimensions", () => {
      expect(ResonanceConstants.RULER_LENGTH_MODEL).toBeGreaterThan(0);
      expect(ResonanceConstants.RULER_THICKNESS_VIEW).toBeGreaterThan(0);
    });

    it("should have valid tick configuration", () => {
      expect(ResonanceConstants.RULER_NUM_MAJOR_TICKS).toBeGreaterThan(1);
      expect(
        ResonanceConstants.RULER_MINOR_TICKS_PER_MAJOR,
      ).toBeGreaterThanOrEqual(0);
    });

    it("should represent 50 cm ruler", () => {
      expect(ResonanceConstants.RULER_LENGTH_MODEL).toBe(0.5);
    });
  });

  describe("control panel constants", () => {
    it("should have positive margins", () => {
      expect(ResonanceConstants.CONTROL_PANEL_X_MARGIN).toBeGreaterThan(0);
      expect(ResonanceConstants.CONTROL_PANEL_Y_MARGIN).toBeGreaterThan(0);
    });

    it("should have valid corner radius", () => {
      expect(
        ResonanceConstants.CONTROL_PANEL_CORNER_RADIUS,
      ).toBeGreaterThanOrEqual(0);
    });

    it("should have positive spacing", () => {
      expect(ResonanceConstants.CONTROL_PANEL_SPACING).toBeGreaterThan(0);
    });
  });

  describe("playback constants", () => {
    it("should have reasonable step dt", () => {
      // Around 16ms for 60fps
      expect(ResonanceConstants.STEP_DT).toBeGreaterThan(0.001);
      expect(ResonanceConstants.STEP_DT).toBeLessThan(0.1);
    });

    it("should have valid play/pause scale", () => {
      expect(ResonanceConstants.PLAY_PAUSE_SCALE).toBeGreaterThan(0);
      expect(ResonanceConstants.PLAY_PAUSE_SCALE).toBeLessThanOrEqual(1);
    });
  });

  describe("font definitions", () => {
    it("should have all required fonts defined", () => {
      expect(ResonanceConstants.LABEL_FONT).toBeDefined();
      expect(ResonanceConstants.TITLE_FONT).toBeDefined();
      expect(ResonanceConstants.TICK_LABEL_FONT).toBeDefined();
      expect(ResonanceConstants.CONTROL_FONT).toBeDefined();
    });
  });

  describe("completeness check", () => {
    it("should export all expected constants", () => {
      // Verify all major constant groups are present
      const expectedKeys = [
        "FREQUENCY_RANGE",
        "AMPLITUDE_RANGE",
        "MASS_RANGE",
        "SPRING_CONSTANT_RANGE",
        "DAMPING_RANGE",
        "DRIVER_BOX_WIDTH",
        "DRIVER_BOX_HEIGHT",
        "MODEL_BOUNDS_MIN",
        "MODEL_BOUNDS_MAX",
        "GRAVITY_ACCELERATION",
        "STEP_DT",
      ];

      expectedKeys.forEach((key) => {
        expect(
          ResonanceConstants[key as keyof typeof ResonanceConstants],
        ).toBeDefined();
      });
    });
  });
});
