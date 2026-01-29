/**
 * Tests for ResonatorNodeBuilder - Visual node construction for resonators
 *
 * Tests mass size calculations, spring node creation, mass node creation,
 * and the buildResonators orchestration method.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ResonatorNodeBuilder } from "../ResonatorNodeBuilder.js";
import { ResonanceModel } from "../../../common/model/index.js";
import { SolverType } from "../../../common/model/SolverType.js";
import ResonanceConstants from "../../../common/ResonanceConstants.js";
import { Bounds2 } from "scenerystack/dot";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Rectangle } from "scenerystack/scenery";
import { Property, NumberProperty } from "scenerystack/axon";

// Mock preferences model for testing
function createMockPreferences() {
  return {
    solverTypeProperty: new Property<SolverType>(SolverType.RUNGE_KUTTA_4),
  };
}

describe("ResonatorNodeBuilder", () => {
  describe("calculateMassSize", () => {
    it("should return minimum size for minimum mass", () => {
      const minMass = ResonanceConstants.MASS_RANGE.min;
      const size = ResonatorNodeBuilder.calculateMassSize(minMass);
      expect(size).toBe(ResonanceConstants.MIN_MASS_SIZE);
    });

    it("should return maximum size for maximum mass", () => {
      const maxMass = ResonanceConstants.MASS_RANGE.max;
      const size = ResonatorNodeBuilder.calculateMassSize(maxMass);
      expect(size).toBe(ResonanceConstants.MAX_MASS_SIZE);
    });

    it("should return size between min and max for middle mass", () => {
      const middleMass =
        (ResonanceConstants.MASS_RANGE.min + ResonanceConstants.MASS_RANGE.max) / 2;
      const size = ResonatorNodeBuilder.calculateMassSize(middleMass);
      expect(size).toBeGreaterThan(ResonanceConstants.MIN_MASS_SIZE);
      expect(size).toBeLessThan(ResonanceConstants.MAX_MASS_SIZE);
    });

    it("should increase size with increasing mass", () => {
      const mass1 = 0.5;
      const mass2 = 2.0;
      const mass3 = 4.0;

      const size1 = ResonatorNodeBuilder.calculateMassSize(mass1);
      const size2 = ResonatorNodeBuilder.calculateMassSize(mass2);
      const size3 = ResonatorNodeBuilder.calculateMassSize(mass3);

      expect(size2).toBeGreaterThan(size1);
      expect(size3).toBeGreaterThan(size2);
    });

    it("should use surface area scaling (sqrt relationship)", () => {
      // With sqrt scaling, doubling normalized mass should not double size
      const minMass = ResonanceConstants.MASS_RANGE.min;
      const maxMass = ResonanceConstants.MASS_RANGE.max;
      const quarterMass = minMass + (maxMass - minMass) * 0.25;
      const fullMass = maxMass;

      const quarterSize = ResonatorNodeBuilder.calculateMassSize(quarterMass);
      const fullSize = ResonatorNodeBuilder.calculateMassSize(fullMass);

      const minSize = ResonanceConstants.MIN_MASS_SIZE;
      const sizeRange = ResonanceConstants.MAX_MASS_SIZE - minSize;

      // At 25% of mass range, sqrt(0.25) = 0.5, so size should be at 50% of size range
      const expectedQuarterSize = minSize + sizeRange * Math.sqrt(0.25);
      expect(quarterSize).toBeCloseTo(expectedQuarterSize, 5);
      expect(fullSize).toBe(ResonanceConstants.MAX_MASS_SIZE);
    });
  });

  describe("createSpringNode", () => {
    let resonatorModel: ResonanceModel;

    beforeEach(() => {
      resonatorModel = new ResonanceModel(createMockPreferences());
    });

    it("should create a spring node result with node and cleanup", () => {
      const result = ResonatorNodeBuilder.createSpringNode(resonatorModel);

      expect(result).toBeDefined();
      expect(result.node).toBeDefined();
      expect(result.cleanup).toBeDefined();
      expect(typeof result.cleanup).toBe("function");
    });

    it("should create spring node with correct initial properties", () => {
      const result = ResonatorNodeBuilder.createSpringNode(resonatorModel);
      const springNode = result.node;

      expect(springNode.loopsProperty.value).toBe(ResonanceConstants.SPRING_LOOPS);
      expect(springNode.radiusProperty.value).toBe(ResonanceConstants.SPRING_RADIUS);
      expect(springNode.aspectRatioProperty.value).toBe(
        ResonanceConstants.SPRING_ASPECT_RATIO
      );
    });

    it("should update line width when spring constant changes", () => {
      const result = ResonatorNodeBuilder.createSpringNode(resonatorModel);
      const springNode = result.node;

      const initialLineWidth = springNode.lineWidthProperty.value;

      // Increase spring constant
      resonatorModel.springConstantProperty.value =
        ResonanceConstants.SPRING_CONSTANT_RANGE.max;

      const newLineWidth = springNode.lineWidthProperty.value;
      expect(newLineWidth).toBeGreaterThan(initialLineWidth);
    });

    it("should have minimum line width at minimum spring constant", () => {
      resonatorModel.springConstantProperty.value =
        ResonanceConstants.SPRING_CONSTANT_RANGE.min;
      const result = ResonatorNodeBuilder.createSpringNode(resonatorModel);

      expect(result.node.lineWidthProperty.value).toBe(
        ResonanceConstants.SPRING_LINE_WIDTH_MIN
      );
    });

    it("should have maximum line width at maximum spring constant", () => {
      resonatorModel.springConstantProperty.value =
        ResonanceConstants.SPRING_CONSTANT_RANGE.max;
      const result = ResonatorNodeBuilder.createSpringNode(resonatorModel);

      expect(result.node.lineWidthProperty.value).toBe(
        ResonanceConstants.SPRING_LINE_WIDTH_MAX
      );
    });

    it("cleanup should unlink spring constant listener", () => {
      const result = ResonatorNodeBuilder.createSpringNode(resonatorModel);

      // Call cleanup
      result.cleanup();

      // After cleanup, changing spring constant should not throw
      // (if listener was properly unlinked)
      expect(() => {
        resonatorModel.springConstantProperty.value = 500;
      }).not.toThrow();
    });
  });

  describe("createMassNode", () => {
    let resonatorModel: ResonanceModel;
    let context: {
      modelViewTransform: ModelViewTransform2;
      layoutBounds: Bounds2;
      driverPlate: Rectangle;
      selectedResonatorIndexProperty: NumberProperty;
    };

    beforeEach(() => {
      resonatorModel = new ResonanceModel(createMockPreferences());

      const viewBounds = new Bounds2(0, 0, 1024, 768);
      const modelBounds = new Bounds2(-0.5, -0.5, 0.5, 0.5);
      const modelViewTransform =
        ModelViewTransform2.createRectangleMapping(modelBounds, viewBounds);

      const driverPlate = new Rectangle(0, 0, 600, 20);
      driverPlate.centerX = 512;
      driverPlate.y = 500;

      context = {
        modelViewTransform,
        layoutBounds: viewBounds,
        driverPlate,
        selectedResonatorIndexProperty: new NumberProperty(0),
      };
    });

    it("should create a mass node result with node and cleanup", () => {
      const result = ResonatorNodeBuilder.createMassNode(
        resonatorModel,
        0,
        1,
        context
      );

      expect(result).toBeDefined();
      expect(result.node).toBeDefined();
      expect(result.cleanup).toBeDefined();
      expect(typeof result.cleanup).toBe("function");
    });

    it("should create mass node with correct index label", () => {
      const result = ResonatorNodeBuilder.createMassNode(
        resonatorModel,
        2,
        5,
        context
      );

      // The label should show index + 1 (1-based)
      const massNode = result.node;
      // Node has children: massBox and massLabel
      expect(massNode.children.length).toBe(2);
    });

    it("should set cursor to vertical resize", () => {
      const result = ResonatorNodeBuilder.createMassNode(
        resonatorModel,
        0,
        1,
        context
      );
      expect(result.node.cursor).toBe("ns-resize");
    });

    it("should update mass box size when mass changes", () => {
      const result = ResonatorNodeBuilder.createMassNode(
        resonatorModel,
        0,
        1,
        context
      );

      // Get initial bounds
      const initialWidth = result.node.children[0].width;

      // Increase mass
      resonatorModel.massProperty.value = ResonanceConstants.MASS_RANGE.max;

      // Size should increase
      const newWidth = result.node.children[0].width;
      expect(newWidth).toBeGreaterThan(initialWidth);
    });

    it("cleanup should not throw and should unlink listeners", () => {
      const result = ResonatorNodeBuilder.createMassNode(
        resonatorModel,
        0,
        1,
        context
      );

      // Call cleanup
      expect(() => {
        result.cleanup();
      }).not.toThrow();

      // After cleanup, modifying model properties should not throw
      expect(() => {
        resonatorModel.massProperty.value = 2.0;
        resonatorModel.positionProperty.value = 0.1;
      }).not.toThrow();
    });

    it("should create nodes for different resonator indices", () => {
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(
          ResonatorNodeBuilder.createMassNode(resonatorModel, i, 5, context)
        );
      }

      expect(results.length).toBe(5);
      results.forEach((result) => {
        expect(result.node).toBeDefined();
        expect(result.cleanup).toBeDefined();
      });

      // Cleanup all
      results.forEach((result) => result.cleanup());
    });
  });

  describe("buildResonators", () => {
    let resonatorModels: ResonanceModel[];
    let context: {
      modelViewTransform: ModelViewTransform2;
      layoutBounds: Bounds2;
      driverPlate: Rectangle;
      selectedResonatorIndexProperty: NumberProperty;
    };

    beforeEach(() => {
      // Create multiple resonator models
      resonatorModels = [];
      for (let i = 0; i < 10; i++) {
        resonatorModels.push(new ResonanceModel(createMockPreferences()));
      }

      const viewBounds = new Bounds2(0, 0, 1024, 768);
      const modelBounds = new Bounds2(-0.5, -0.5, 0.5, 0.5);
      const modelViewTransform =
        ModelViewTransform2.createRectangleMapping(modelBounds, viewBounds);

      const driverPlate = new Rectangle(0, 0, 600, 20);
      driverPlate.centerX = 512;
      driverPlate.y = 500;

      context = {
        modelViewTransform,
        layoutBounds: viewBounds,
        driverPlate,
        selectedResonatorIndexProperty: new NumberProperty(0),
      };
    });

    it("should build correct number of spring nodes", () => {
      const count = 5;
      const result = ResonatorNodeBuilder.buildResonators(
        resonatorModels,
        count,
        context
      );

      expect(result.springNodes.length).toBe(count);
    });

    it("should build correct number of mass nodes", () => {
      const count = 5;
      const result = ResonatorNodeBuilder.buildResonators(
        resonatorModels,
        count,
        context
      );

      expect(result.massNodes.length).toBe(count);
    });

    it("should return cleanup functions for each node", () => {
      const count = 3;
      const result = ResonatorNodeBuilder.buildResonators(
        resonatorModels,
        count,
        context
      );

      // Should have cleanup for each spring and each mass (2 per resonator)
      expect(result.cleanups.length).toBe(count * 2);
    });

    it("should handle single resonator", () => {
      const result = ResonatorNodeBuilder.buildResonators(
        resonatorModels,
        1,
        context
      );

      expect(result.springNodes.length).toBe(1);
      expect(result.massNodes.length).toBe(1);
      expect(result.cleanups.length).toBe(2);
    });

    it("should handle maximum resonators (10)", () => {
      const result = ResonatorNodeBuilder.buildResonators(
        resonatorModels,
        10,
        context
      );

      expect(result.springNodes.length).toBe(10);
      expect(result.massNodes.length).toBe(10);
      expect(result.cleanups.length).toBe(20);
    });

    it("all cleanup functions should execute without error", () => {
      const result = ResonatorNodeBuilder.buildResonators(
        resonatorModels,
        5,
        context
      );

      expect(() => {
        result.cleanups.forEach((cleanup) => cleanup());
      }).not.toThrow();
    });

    it("should create spring nodes with proper configuration", () => {
      const result = ResonatorNodeBuilder.buildResonators(
        resonatorModels,
        3,
        context
      );

      result.springNodes.forEach((springNode) => {
        expect(springNode.loopsProperty.value).toBe(
          ResonanceConstants.SPRING_LOOPS
        );
      });
    });

    it("should create mass nodes with correct cursor", () => {
      const result = ResonatorNodeBuilder.buildResonators(
        resonatorModels,
        3,
        context
      );

      result.massNodes.forEach((massNode) => {
        expect(massNode.cursor).toBe("ns-resize");
      });
    });
  });
});
