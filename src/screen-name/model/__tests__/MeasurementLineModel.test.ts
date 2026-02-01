/**
 * Tests for MeasurementLineModel and MeasurementLinesModel
 *
 * P1 Priority: Tests for measurement line positioning and constraints.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Bounds2, Vector2 } from "scenerystack/dot";
import {
  MeasurementLineModel,
  MeasurementLinesModel,
} from "../MeasurementLineModel.js";

describe("MeasurementLineModel", () => {
  let dragBounds: Bounds2;
  let model: MeasurementLineModel;

  beforeEach(() => {
    // Drag bounds in model coordinates (positive y = up)
    // Allows heights from 0.1m to 1.0m
    dragBounds = new Bounds2(0, 0.1, 0, 1.0);
    model = new MeasurementLineModel(0.5, dragBounds);
  });

  describe("construction", () => {
    it("should create with initial height", () => {
      expect(model.height).toBeCloseTo(0.5, 5);
    });

    it("should store initial position as Vector2", () => {
      const position = model.positionProperty.value;
      expect(position.x).toBe(0);
      expect(position.y).toBe(0.5); // height 0.5 = y 0.5
    });

    it("should store drag bounds", () => {
      expect(model.dragBoundsProperty.value).toBe(dragBounds);
    });

    it("should create with different initial heights", () => {
      const model1 = new MeasurementLineModel(0.2, dragBounds);
      const model2 = new MeasurementLineModel(0.8, dragBounds);

      expect(model1.height).toBeCloseTo(0.2, 5);
      expect(model2.height).toBeCloseTo(0.8, 5);
    });

    it("should handle zero initial height", () => {
      const zeroModel = new MeasurementLineModel(0, dragBounds);
      expect(zeroModel.height).toBe(0);
    });
  });

  describe("height property", () => {
    it("should return height from y position", () => {
      model.positionProperty.value = new Vector2(0, 0.3);
      expect(model.height).toBeCloseTo(0.3, 5);
    });

    it("should update when position changes", () => {
      model.positionProperty.value = new Vector2(0, 0.7);
      expect(model.height).toBeCloseTo(0.7, 5);
    });

    it("should be read-only (derived from position)", () => {
      const initialHeight = model.height;
      // Height cannot be set directly, only position can be changed
      expect(model.height).toBe(initialHeight);
    });
  });

  describe("positionProperty", () => {
    it("should be observable", () => {
      let notifiedValue: Vector2 | null = null;
      model.positionProperty.link((position) => {
        notifiedValue = position;
      });

      model.positionProperty.value = new Vector2(0, 0.8);

      expect(notifiedValue).not.toBeNull();
      expect(notifiedValue!.y).toBe(0.8);
    });

    it("should allow setting new position", () => {
      model.positionProperty.value = new Vector2(0, 0.25);
      expect(model.positionProperty.value.y).toBe(0.25);
    });
  });

  describe("dragBoundsProperty", () => {
    it("should be observable", () => {
      let notifiedBounds: Bounds2 | null = null;
      model.dragBoundsProperty.link((bounds) => {
        notifiedBounds = bounds;
      });

      const newBounds = new Bounds2(0, 0.05, 0, 2.0);
      model.dragBoundsProperty.value = newBounds;

      expect(notifiedBounds).toBe(newBounds);
    });

    it("should allow updating drag bounds", () => {
      const newBounds = new Bounds2(0, 0.01, 0, 1.5);
      model.dragBoundsProperty.value = newBounds;

      expect(model.dragBoundsProperty.value).toBe(newBounds);
    });
  });

  describe("reset", () => {
    it("should reset position to initial value", () => {
      model.positionProperty.value = new Vector2(0, 0.9);

      model.reset();

      expect(model.height).toBeCloseTo(0.5, 5);
    });

    it("should reset after multiple position changes", () => {
      model.positionProperty.value = new Vector2(0, 0.1);
      model.positionProperty.value = new Vector2(0, 0.9);
      model.positionProperty.value = new Vector2(0, 0.3);

      model.reset();

      expect(model.height).toBeCloseTo(0.5, 5);
    });

    it("should be callable multiple times", () => {
      model.positionProperty.value = new Vector2(0, 0.8);
      model.reset();
      model.reset();
      model.reset();

      expect(model.height).toBeCloseTo(0.5, 5);
    });
  });
});

describe("MeasurementLinesModel", () => {
  let model: MeasurementLinesModel;

  beforeEach(() => {
    model = new MeasurementLinesModel(0.01, 1.0);
  });

  describe("construction", () => {
    it("should create two measurement lines", () => {
      expect(model.line1).toBeDefined();
      expect(model.line2).toBeDefined();
    });

    it("should use default initial heights", () => {
      expect(model.line1.height).toBeCloseTo(0.2, 5);
      expect(model.line2.height).toBeCloseTo(0.4, 5);
    });

    it("should accept custom initial heights", () => {
      const customModel = new MeasurementLinesModel(0.01, 1.0, 0.15, 0.75);

      expect(customModel.line1.height).toBeCloseTo(0.15, 5);
      expect(customModel.line2.height).toBeCloseTo(0.75, 5);
    });

    it("should create valid drag bounds", () => {
      // minHeight = 0.01, maxHeight = 1.0
      // y bounds should be (minHeight, maxHeight) = (0.01, 1.0)
      const bounds = model.dragBounds;

      expect(bounds.minX).toBe(0);
      expect(bounds.maxX).toBe(0);
      expect(bounds.minY).toBe(0.01); // corresponds to minHeight
      expect(bounds.maxY).toBe(1.0); // corresponds to maxHeight
    });

    it("should share drag bounds between both lines", () => {
      expect(model.line1.dragBoundsProperty.value).toEqual(model.dragBounds);
      expect(model.line2.dragBoundsProperty.value).toEqual(model.dragBounds);
    });
  });

  describe("drag bounds calculation", () => {
    it("should create bounds with correct min/max heights", () => {
      const customModel = new MeasurementLinesModel(0.05, 2.0);

      const bounds = customModel.dragBounds;
      expect(bounds.minY).toBe(0.05); // minHeight
      expect(bounds.maxY).toBe(2.0); // maxHeight
    });

    it("should handle small height range", () => {
      const smallRangeModel = new MeasurementLinesModel(0.1, 0.2, 0.1, 0.15);

      expect(smallRangeModel.dragBounds.minY).toBe(0.1);
      expect(smallRangeModel.dragBounds.maxY).toBe(0.2);
    });

    it("should handle large height range", () => {
      const largeRangeModel = new MeasurementLinesModel(0.001, 10.0);

      expect(largeRangeModel.dragBounds.minY).toBeCloseTo(0.001, 5);
      expect(largeRangeModel.dragBounds.maxY).toBe(10.0);
    });
  });

  describe("independent line movement", () => {
    it("should allow line1 to move independently", () => {
      const initialLine2Height = model.line2.height;

      model.line1.positionProperty.value = new Vector2(0, 0.8);

      expect(model.line1.height).toBeCloseTo(0.8, 5);
      expect(model.line2.height).toBeCloseTo(initialLine2Height, 5);
    });

    it("should allow line2 to move independently", () => {
      const initialLine1Height = model.line1.height;

      model.line2.positionProperty.value = new Vector2(0, 0.6);

      expect(model.line1.height).toBeCloseTo(initialLine1Height, 5);
      expect(model.line2.height).toBeCloseTo(0.6, 5);
    });

    it("should allow both lines to move simultaneously", () => {
      model.line1.positionProperty.value = new Vector2(0, 0.3);
      model.line2.positionProperty.value = new Vector2(0, 0.9);

      expect(model.line1.height).toBeCloseTo(0.3, 5);
      expect(model.line2.height).toBeCloseTo(0.9, 5);
    });
  });

  describe("reset", () => {
    it("should reset both lines to initial positions", () => {
      model.line1.positionProperty.value = new Vector2(0, 0.9);
      model.line2.positionProperty.value = new Vector2(0, 0.1);

      model.reset();

      expect(model.line1.height).toBeCloseTo(0.2, 5);
      expect(model.line2.height).toBeCloseTo(0.4, 5);
    });

    it("should be callable multiple times", () => {
      model.line1.positionProperty.value = new Vector2(0, 0.5);

      model.reset();
      model.reset();
      model.reset();

      expect(model.line1.height).toBeCloseTo(0.2, 5);
      expect(model.line2.height).toBeCloseTo(0.4, 5);
    });
  });

  describe("edge cases", () => {
    it("should handle lines at minimum height", () => {
      model.line1.positionProperty.value = new Vector2(0, 0.01);
      expect(model.line1.height).toBeCloseTo(0.01, 5);
    });

    it("should handle lines at maximum height", () => {
      model.line1.positionProperty.value = new Vector2(0, 1.0);
      expect(model.line1.height).toBeCloseTo(1.0, 5);
    });

    it("should handle lines at same height", () => {
      model.line1.positionProperty.value = new Vector2(0, 0.5);
      model.line2.positionProperty.value = new Vector2(0, 0.5);

      expect(model.line1.height).toBeCloseTo(0.5, 5);
      expect(model.line2.height).toBeCloseTo(0.5, 5);
    });
  });
});
