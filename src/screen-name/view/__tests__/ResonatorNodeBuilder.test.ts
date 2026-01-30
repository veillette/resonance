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
import { SimModel } from "../../model/SimModel.js";

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
        (ResonanceConstants.MASS_RANGE.min +
          ResonanceConstants.MASS_RANGE.max) /
        2;
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

    it("should create a spring node", () => {
      const springNode = ResonatorNodeBuilder.createSpringNode(resonatorModel);

      expect(springNode).toBeDefined();
    });

    it("should create spring node with correct initial properties", () => {
      const springNode = ResonatorNodeBuilder.createSpringNode(resonatorModel);

      expect(springNode.loopsProperty.value).toBe(
        ResonanceConstants.SPRING_LOOPS,
      );
      expect(springNode.radiusProperty.value).toBe(
        ResonanceConstants.SPRING_RADIUS,
      );
      expect(springNode.aspectRatioProperty.value).toBe(
        ResonanceConstants.SPRING_ASPECT_RATIO,
      );
    });

    it("should update line width when spring constant changes", () => {
      const springNode = ResonatorNodeBuilder.createSpringNode(resonatorModel);

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
      const springNode = ResonatorNodeBuilder.createSpringNode(resonatorModel);

      expect(springNode.lineWidthProperty.value).toBe(
        ResonanceConstants.SPRING_LINE_WIDTH_MIN,
      );
    });

    it("should have maximum line width at maximum spring constant", () => {
      resonatorModel.springConstantProperty.value =
        ResonanceConstants.SPRING_CONSTANT_RANGE.max;
      const springNode = ResonatorNodeBuilder.createSpringNode(resonatorModel);

      expect(springNode.lineWidthProperty.value).toBe(
        ResonanceConstants.SPRING_LINE_WIDTH_MAX,
      );
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
      const modelViewTransform = ModelViewTransform2.createRectangleMapping(
        modelBounds,
        viewBounds,
      );

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

    it("should create a mass node", () => {
      const massNode = ResonatorNodeBuilder.createMassNode(
        resonatorModel,
        0,
        context,
      );

      expect(massNode).toBeDefined();
    });

    it("should create mass node with correct structure", () => {
      const massNode = ResonatorNodeBuilder.createMassNode(
        resonatorModel,
        2,
        context,
      );

      // Node has children: massBox and massLabel
      expect(massNode.children.length).toBe(2);
    });

    it("should set cursor to vertical resize", () => {
      const massNode = ResonatorNodeBuilder.createMassNode(
        resonatorModel,
        0,
        context,
      );
      expect(massNode.cursor).toBe("ns-resize");
    });

    it("should update mass box size when mass changes", () => {
      const massNode = ResonatorNodeBuilder.createMassNode(
        resonatorModel,
        0,
        context,
      );

      // Get initial bounds
      const initialWidth = massNode.children[0].width;

      // Increase mass
      resonatorModel.massProperty.value = ResonanceConstants.MASS_RANGE.max;

      // Size should increase
      const newWidth = massNode.children[0].width;
      expect(newWidth).toBeGreaterThan(initialWidth);
    });

    it("should create nodes for different resonator indices", () => {
      const nodes = [];
      for (let i = 0; i < 5; i++) {
        nodes.push(
          ResonatorNodeBuilder.createMassNode(resonatorModel, i, context),
        );
      }

      expect(nodes.length).toBe(5);
      nodes.forEach((node) => {
        expect(node).toBeDefined();
      });
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
      for (let i = 0; i < SimModel.MAX_RESONATORS; i++) {
        resonatorModels.push(new ResonanceModel(createMockPreferences()));
      }

      const viewBounds = new Bounds2(0, 0, 1024, 768);
      const modelBounds = new Bounds2(-0.5, -0.5, 0.5, 0.5);
      const modelViewTransform = ModelViewTransform2.createRectangleMapping(
        modelBounds,
        viewBounds,
      );

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

    it("should build MAX_RESONATORS spring nodes", () => {
      const result = ResonatorNodeBuilder.buildResonators(
        resonatorModels,
        context,
      );

      expect(result.springNodes.length).toBe(SimModel.MAX_RESONATORS);
    });

    it("should build MAX_RESONATORS mass nodes", () => {
      const result = ResonatorNodeBuilder.buildResonators(
        resonatorModels,
        context,
      );

      expect(result.massNodes.length).toBe(SimModel.MAX_RESONATORS);
    });

    it("should create spring nodes with proper configuration", () => {
      const result = ResonatorNodeBuilder.buildResonators(
        resonatorModels,
        context,
      );

      result.springNodes.forEach((springNode) => {
        expect(springNode.loopsProperty.value).toBe(
          ResonanceConstants.SPRING_LOOPS,
        );
      });
    });

    it("should create mass nodes with correct cursor", () => {
      const result = ResonatorNodeBuilder.buildResonators(
        resonatorModels,
        context,
      );

      result.massNodes.forEach((massNode) => {
        expect(massNode.cursor).toBe("ns-resize");
      });
    });
  });
});
