/**
 * Tests for PlaybackControlNode - Simulation playback controls
 *
 * Tests the play/pause/step buttons and speed control radio buttons.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PlaybackControlNode } from "../PlaybackControlNode.js";
import { SimModel } from "../../model/SimModel.js";
import { ResonancePreferencesModel } from "../../../preferences/ResonancePreferencesModel.js";
import { Bounds2 } from "scenerystack/dot";

describe("PlaybackControlNode", () => {
  let model: SimModel;
  let playbackNode: PlaybackControlNode;
  let layoutBounds: Bounds2;

  beforeEach(() => {
    model = new SimModel(new ResonancePreferencesModel());
    layoutBounds = new Bounds2(0, 0, 1024, 768);
    playbackNode = new PlaybackControlNode(model, layoutBounds);
  });

  describe("construction", () => {
    it("should construct without errors", () => {
      expect(playbackNode).toBeDefined();
    });

    it("should have child nodes", () => {
      expect(playbackNode.children.length).toBeGreaterThan(0);
    });

    it("should be visible by default", () => {
      expect(playbackNode.visible).toBe(true);
    });

    it("should have non-zero dimensions", () => {
      expect(playbackNode.width).toBeGreaterThan(0);
      expect(playbackNode.height).toBeGreaterThan(0);
    });
  });

  describe("play/pause functionality", () => {
    it("should have isPlayingProperty defined", () => {
      expect(model.resonanceModel.isPlayingProperty).toBeDefined();
      expect(typeof model.resonanceModel.isPlayingProperty.value).toBe(
        "boolean",
      );
    });

    it("should allow playing", () => {
      model.resonanceModel.isPlayingProperty.value = true;
      expect(model.resonanceModel.isPlayingProperty.value).toBe(true);
    });

    it("should allow pausing", () => {
      model.resonanceModel.isPlayingProperty.value = true;
      model.resonanceModel.isPlayingProperty.value = false;
      expect(model.resonanceModel.isPlayingProperty.value).toBe(false);
    });

    it("should toggle play/pause state", () => {
      const initial = model.resonanceModel.isPlayingProperty.value;
      model.resonanceModel.isPlayingProperty.value = !initial;
      expect(model.resonanceModel.isPlayingProperty.value).toBe(!initial);
      model.resonanceModel.isPlayingProperty.value = initial;
      expect(model.resonanceModel.isPlayingProperty.value).toBe(initial);
    });
  });

  describe("time speed control", () => {
    it("should have valid time speed property", () => {
      const speed = model.resonanceModel.timeSpeedProperty.value;
      expect(speed).toBeDefined();
      expect(["slow", "normal"].includes(speed)).toBe(true);
    });

    it("should allow setting slow speed", () => {
      model.resonanceModel.timeSpeedProperty.value = "slow";
      expect(model.resonanceModel.timeSpeedProperty.value).toBe("slow");
    });

    it("should allow setting normal speed", () => {
      model.resonanceModel.timeSpeedProperty.value = "normal";
      expect(model.resonanceModel.timeSpeedProperty.value).toBe("normal");
    });

    it("should toggle between speeds", () => {
      model.resonanceModel.timeSpeedProperty.value = "slow";
      expect(model.resonanceModel.timeSpeedProperty.value).toBe("slow");

      model.resonanceModel.timeSpeedProperty.value = "normal";
      expect(model.resonanceModel.timeSpeedProperty.value).toBe("normal");
    });
  });

  describe("step functionality", () => {
    it("should step model forward", () => {
      const initialTime = model.resonanceModel.timeProperty.value;
      model.resonanceModel.step(0.016, true);
      const afterTime = model.resonanceModel.timeProperty.value;
      expect(afterTime).toBeGreaterThan(initialTime);
    });

    it("should step model backward", () => {
      // First step forward
      model.resonanceModel.step(0.016, true);
      const afterForward = model.resonanceModel.timeProperty.value;

      // Then step backward
      model.resonanceModel.step(-0.016, true);
      const afterBackward = model.resonanceModel.timeProperty.value;

      expect(afterBackward).toBeLessThan(afterForward);
    });

    it("should step all resonators forward", () => {
      model.resonatorCountProperty.value = 3;

      // Get initial times
      const initialTimes = model.resonatorModels.map(
        (r) => r.timeProperty.value,
      );

      // Step all forward
      model.resonatorModels.forEach((r) => r.step(0.016, true));

      // Check times increased
      model.resonatorModels.forEach((r, i) => {
        expect(r.timeProperty.value).toBeGreaterThan(initialTimes[i]);
      });
    });
  });

  describe("layout positioning", () => {
    it("should position relative to layout bounds", () => {
      // PlaybackControlNode should be positioned at the bottom
      expect(playbackNode.bottom).toBeLessThanOrEqual(layoutBounds.maxY);
    });

    it("should work with different layout bounds", () => {
      const smallBounds = new Bounds2(0, 0, 800, 600);
      const smallPlaybackNode = new PlaybackControlNode(model, smallBounds);
      expect(smallPlaybackNode).toBeDefined();
      expect(smallPlaybackNode.bottom).toBeLessThanOrEqual(smallBounds.maxY);
    });

    it("should work with large layout bounds", () => {
      const largeBounds = new Bounds2(0, 0, 1920, 1080);
      const largePlaybackNode = new PlaybackControlNode(model, largeBounds);
      expect(largePlaybackNode).toBeDefined();
      expect(largePlaybackNode.bottom).toBeLessThanOrEqual(largeBounds.maxY);
    });
  });

  describe("model integration", () => {
    it("should reflect model state changes", () => {
      // Change model state
      model.resonanceModel.isPlayingProperty.value = true;
      model.resonanceModel.timeSpeedProperty.value = "slow";

      // Node should still be functional
      expect(playbackNode.visible).toBe(true);
      expect(playbackNode.children.length).toBeGreaterThan(0);
    });

    it("should work with multiple resonators", () => {
      model.resonatorCountProperty.value = 5;

      // Step all resonators
      model.resonatorModels.forEach((r) => r.step(0.016, true));

      // Node should still be functional
      expect(playbackNode.visible).toBe(true);
    });
  });

  describe("construction with different models", () => {
    it("should work with model in playing state", () => {
      const playingModel = new SimModel(new ResonancePreferencesModel());
      playingModel.resonanceModel.isPlayingProperty.value = true;

      const node = new PlaybackControlNode(playingModel, layoutBounds);
      expect(node).toBeDefined();
    });

    it("should work with model at slow speed", () => {
      const slowModel = new SimModel(new ResonancePreferencesModel());
      slowModel.resonanceModel.timeSpeedProperty.value = "slow";

      const node = new PlaybackControlNode(slowModel, layoutBounds);
      expect(node).toBeDefined();
    });
  });
});
