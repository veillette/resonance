/**
 * Tests for MeasurementLinesNode - View for draggable measurement lines
 *
 * P1 Priority: Tests for measurement line view, drag behavior, and model integration.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MeasurementLinesNode } from "../MeasurementLinesNode.js";
import { Bounds2, Vector2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";

describe("MeasurementLinesNode", () => {
  let node: MeasurementLinesNode;
  let modelViewTransform: ModelViewTransform2;
  let layoutBounds: Bounds2;

  // Test parameters
  const DRIVER_CENTER_X = 400;
  const DRIVER_TOP_Y = 600;
  const DRIVER_WIDTH = 500;
  const VIEW_HEIGHT = 768;

  beforeEach(() => {
    layoutBounds = new Bounds2(0, 0, 1024, VIEW_HEIGHT);

    // Create a simple transform: 1 meter = 400 pixels, y inverted
    modelViewTransform =
      ModelViewTransform2.createSinglePointScaleInvertedYMapping(
        Vector2.ZERO,
        new Vector2(DRIVER_CENTER_X, DRIVER_TOP_Y),
        400, // 1 meter = 400 pixels
      );

    node = new MeasurementLinesNode(
      DRIVER_CENTER_X,
      DRIVER_TOP_Y,
      DRIVER_WIDTH,
      modelViewTransform,
      layoutBounds,
    );
  });

  describe("construction", () => {
    it("should construct without errors", () => {
      expect(node).toBeDefined();
    });

    it("should have two child line nodes", () => {
      expect(node.children.length).toBe(2);
    });

    it("should create internal model", () => {
      expect(node.model).toBeDefined();
      expect(node.model.line1).toBeDefined();
      expect(node.model.line2).toBeDefined();
    });

    it("should set default heights for lines", () => {
      // Default heights are 0.2m and 0.4m
      expect(node.model.line1.height).toBeCloseTo(0.2, 2);
      expect(node.model.line2.height).toBeCloseTo(0.4, 2);
    });
  });

  describe("model integration", () => {
    it("should expose model for external access", () => {
      expect(node.model).toBeDefined();
    });

    it("should have lines with observable position properties", () => {
      expect(node.model.line1.positionProperty).toBeDefined();
      expect(node.model.line2.positionProperty).toBeDefined();
    });

    it("should have lines with observable drag bounds", () => {
      expect(node.model.line1.dragBoundsProperty).toBeDefined();
      expect(node.model.line2.dragBoundsProperty).toBeDefined();
    });

    it("should calculate valid drag bounds", () => {
      const bounds = node.model.dragBounds;

      // minY should be negative maxHeight
      // maxY should be negative minHeight
      expect(bounds.minY).toBeLessThan(0);
      expect(bounds.maxY).toBeLessThan(0);
      expect(bounds.minY).toBeLessThan(bounds.maxY);
    });
  });

  describe("height bounds calculation", () => {
    it("should set minimum height to 1cm (0.01m)", () => {
      // The minimum height constraint is defined in MeasurementLinesNode
      const bounds = node.model.dragBounds;

      // maxY corresponds to minHeight = 0.01
      expect(bounds.maxY).toBeCloseTo(-0.01, 2);
    });

    it("should calculate maximum height from layout bounds", () => {
      // Max height depends on view-to-model conversion of screen height above driver
      const bounds = node.model.dragBounds;

      // minY corresponds to maxHeight, which is calculated from screen height
      // Should be a positive number (negative y)
      expect(bounds.minY).toBeLessThan(-0.01);
    });

    it("should allow dragging through full height range", () => {
      const bounds = node.model.dragBounds;

      // Set line to minimum height
      node.model.line1.positionProperty.value = new Vector2(0, bounds.maxY);
      expect(node.model.line1.height).toBeCloseTo(-bounds.maxY, 2);

      // Set line to maximum height
      node.model.line1.positionProperty.value = new Vector2(0, bounds.minY);
      expect(node.model.line1.height).toBeCloseTo(-bounds.minY, 2);
    });
  });

  describe("line positioning", () => {
    it("should allow moving line1 independently", () => {
      const initialLine2Y = node.model.line2.positionProperty.value.y;

      node.model.line1.positionProperty.value = new Vector2(0, -0.5);

      expect(node.model.line1.height).toBeCloseTo(0.5, 2);
      expect(node.model.line2.positionProperty.value.y).toBe(initialLine2Y);
    });

    it("should allow moving line2 independently", () => {
      const initialLine1Y = node.model.line1.positionProperty.value.y;

      node.model.line2.positionProperty.value = new Vector2(0, -0.6);

      expect(node.model.line2.height).toBeCloseTo(0.6, 2);
      expect(node.model.line1.positionProperty.value.y).toBe(initialLine1Y);
    });

    it("should allow both lines to be at the same height", () => {
      node.model.line1.positionProperty.value = new Vector2(0, -0.3);
      node.model.line2.positionProperty.value = new Vector2(0, -0.3);

      expect(node.model.line1.height).toBeCloseTo(0.3, 2);
      expect(node.model.line2.height).toBeCloseTo(0.3, 2);
    });
  });

  describe("reset", () => {
    it("should reset without errors", () => {
      expect(() => node.reset()).not.toThrow();
    });

    it("should reset both lines to initial positions", () => {
      // Move lines
      node.model.line1.positionProperty.value = new Vector2(0, -0.8);
      node.model.line2.positionProperty.value = new Vector2(0, -0.1);

      // Reset
      node.reset();

      // Should return to defaults (0.2m and 0.4m)
      expect(node.model.line1.height).toBeCloseTo(0.2, 2);
      expect(node.model.line2.height).toBeCloseTo(0.4, 2);
    });

    it("should be callable multiple times", () => {
      node.model.line1.positionProperty.value = new Vector2(0, -0.5);

      node.reset();
      node.reset();
      node.reset();

      expect(node.model.line1.height).toBeCloseTo(0.2, 2);
      expect(node.model.line2.height).toBeCloseTo(0.4, 2);
    });
  });

  describe("visual properties", () => {
    it("should be visible by default", () => {
      expect(node.visible).toBe(true);
    });

    it("should have non-zero bounds", () => {
      // Node should have meaningful bounds from the line children
      expect(node.bounds.isValid()).toBe(true);
    });

    it("should allow visibility to be toggled", () => {
      node.visible = false;
      expect(node.visible).toBe(false);

      node.visible = true;
      expect(node.visible).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle small layout bounds", () => {
      const smallBounds = new Bounds2(0, 0, 200, 200);

      const smallNode = new MeasurementLinesNode(
        100,
        180,
        150,
        modelViewTransform,
        smallBounds,
      );

      expect(smallNode).toBeDefined();
      expect(smallNode.model.line1).toBeDefined();
    });

    it("should handle large layout bounds", () => {
      const largeBounds = new Bounds2(0, 0, 4096, 2160);

      const largeNode = new MeasurementLinesNode(
        2048,
        2000,
        1000,
        modelViewTransform,
        largeBounds,
      );

      expect(largeNode).toBeDefined();
      expect(largeNode.model.line1).toBeDefined();
    });

    it("should handle narrow driver width", () => {
      const narrowNode = new MeasurementLinesNode(
        DRIVER_CENTER_X,
        DRIVER_TOP_Y,
        50, // narrow width
        modelViewTransform,
        layoutBounds,
      );

      expect(narrowNode).toBeDefined();
    });

    it("should handle wide driver width", () => {
      const wideNode = new MeasurementLinesNode(
        DRIVER_CENTER_X,
        DRIVER_TOP_Y,
        900, // wide width
        modelViewTransform,
        layoutBounds,
      );

      expect(wideNode).toBeDefined();
    });
  });

  describe("model-view synchronization", () => {
    it("should update view when model position changes", () => {
      // Get initial child y positions
      const initialLine1Y = node.children[0]!.y;

      // Change model position (higher = more negative y in model)
      node.model.line1.positionProperty.value = new Vector2(0, -0.5);

      // View y should have changed (in view, y increases downward)
      expect(node.children[0]!.y).not.toBe(initialLine1Y);
    });

    it("should maintain x position at driver center", () => {
      // After position change, x should still be at driver center
      node.model.line1.positionProperty.value = new Vector2(0, -0.5);

      expect(node.children[0]!.x).toBe(DRIVER_CENTER_X);
    });
  });
});
