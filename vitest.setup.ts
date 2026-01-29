/**
 * Vitest setup file
 * Configures canvas and Web Audio API support for jsdom environment
 */

import { vi } from "vitest";

// Mock AudioParam for Web Audio API
function createMockAudioParam(initialValue = 0) {
  return {
    value: initialValue,
    defaultValue: initialValue,
    minValue: -3.4028235e38,
    maxValue: 3.4028235e38,
    setValueAtTime: vi.fn().mockReturnThis(),
    linearRampToValueAtTime: vi.fn().mockReturnThis(),
    exponentialRampToValueAtTime: vi.fn().mockReturnThis(),
    setTargetAtTime: vi.fn().mockReturnThis(),
    setValueCurveAtTime: vi.fn().mockReturnThis(),
    cancelScheduledValues: vi.fn().mockReturnThis(),
    cancelAndHoldAtTime: vi.fn().mockReturnThis(),
  };
}

// Mock Web Audio API
class MockAudioContext {
  destination = {
    channelCount: 2,
    channelCountMode: "explicit",
    channelInterpretation: "speakers",
    maxChannelCount: 2,
    numberOfInputs: 1,
    numberOfOutputs: 0,
  };
  sampleRate = 44100;
  currentTime = 0;
  state = "running";
  listener = {
    positionX: createMockAudioParam(),
    positionY: createMockAudioParam(),
    positionZ: createMockAudioParam(),
    forwardX: createMockAudioParam(),
    forwardY: createMockAudioParam(),
    forwardZ: createMockAudioParam(-1),
    upX: createMockAudioParam(),
    upY: createMockAudioParam(1),
    upZ: createMockAudioParam(),
  };

  createGain() {
    return {
      gain: createMockAudioParam(1),
      connect: vi.fn().mockReturnThis(),
      disconnect: vi.fn(),
      context: this,
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 2,
      channelCountMode: "max",
      channelInterpretation: "speakers",
    };
  }

  createOscillator() {
    return {
      type: "sine",
      frequency: createMockAudioParam(440),
      detune: createMockAudioParam(0),
      connect: vi.fn().mockReturnThis(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      context: this,
      numberOfInputs: 0,
      numberOfOutputs: 1,
    };
  }

  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      loopStart: 0,
      loopEnd: 0,
      playbackRate: createMockAudioParam(1),
      detune: createMockAudioParam(0),
      connect: vi.fn().mockReturnThis(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      context: this,
      numberOfInputs: 0,
      numberOfOutputs: 1,
    };
  }

  createDynamicsCompressor() {
    return {
      threshold: createMockAudioParam(-24),
      knee: createMockAudioParam(30),
      ratio: createMockAudioParam(12),
      attack: createMockAudioParam(0.003),
      release: createMockAudioParam(0.25),
      reduction: 0,
      connect: vi.fn().mockReturnThis(),
      disconnect: vi.fn(),
      context: this,
    };
  }

  createConvolver() {
    return {
      buffer: null,
      normalize: true,
      connect: vi.fn().mockReturnThis(),
      disconnect: vi.fn(),
      context: this,
    };
  }

  createBiquadFilter() {
    return {
      type: "lowpass",
      frequency: createMockAudioParam(350),
      detune: createMockAudioParam(0),
      Q: createMockAudioParam(1),
      gain: createMockAudioParam(0),
      connect: vi.fn().mockReturnThis(),
      disconnect: vi.fn(),
      context: this,
    };
  }

  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: () => new Float32Array(length),
      copyFromChannel: vi.fn(),
      copyToChannel: vi.fn(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  decodeAudioData(audioData: ArrayBuffer): Promise<AudioBuffer> {
    return Promise.resolve(
      this.createBuffer(2, 44100, 44100) as unknown as AudioBuffer,
    );
  }

  resume() {
    return Promise.resolve();
  }

  suspend() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }
}

// @ts-expect-error - Mock implementation
global.AudioContext = MockAudioContext;
// @ts-expect-error - Mock implementation
global.webkitAudioContext = MockAudioContext;

// Mock HTMLCanvasElement.getContext to use node-canvas
const originalGetContext = HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.getContext = function (
  contextId: string,
  options?: CanvasRenderingContext2DSettings,
): RenderingContext | null {
  if (contextId === "2d") {
    try {
      // Try to use node-canvas
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createCanvas } = require("canvas");
      const canvas = createCanvas(this.width || 300, this.height || 150);
      return canvas.getContext("2d");
    } catch {
      // Fallback to mock if canvas is not available
      return {
        canvas: this,
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        translate: vi.fn(),
        transform: vi.fn(),
        setTransform: vi.fn(),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createPattern: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        bezierCurveTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        arc: vi.fn(),
        arcTo: vi.fn(),
        ellipse: vi.fn(),
        rect: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        clip: vi.fn(),
        isPointInPath: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        setLineDash: vi.fn(),
        getLineDash: vi.fn(() => []),
      } as unknown as CanvasRenderingContext2D;
    }
  }
  return originalGetContext.call(this, contextId, options);
};

// Mock SVG getBBox and other SVG-related methods
const mockBBox = {
  x: 0,
  y: 0,
  width: 100,
  height: 20,
};

// Add getBBox to SVGElement prototype
if (typeof SVGElement !== "undefined") {
  // @ts-expect-error - Adding mock method
  SVGElement.prototype.getBBox = function () {
    return { ...mockBBox };
  };

  // @ts-expect-error - Adding mock method
  SVGElement.prototype.getComputedTextLength = function () {
    return 100;
  };

  // @ts-expect-error - Adding mock method
  SVGElement.prototype.getSubStringLength = function () {
    return 10;
  };
}

// Mock createElementNS for SVG elements
const originalCreateElementNS = document.createElementNS;
document.createElementNS = function (
  namespaceURI: string | null,
  qualifiedName: string,
) {
  const element = originalCreateElementNS.call(
    document,
    namespaceURI,
    qualifiedName,
  );

  if (namespaceURI === "http://www.w3.org/2000/svg") {
    // @ts-expect-error - Adding mock method
    element.getBBox = function () {
      return { ...mockBBox };
    };
    // @ts-expect-error - Adding mock method
    element.getComputedTextLength = function () {
      return 100;
    };
    // @ts-expect-error - Adding mock method
    element.getSubStringLength = function () {
      return 10;
    };
  }

  return element;
};

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// @ts-expect-error - Mock implementation
global.ResizeObserver = MockResizeObserver;

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// @ts-expect-error - Mock implementation
global.IntersectionObserver = MockIntersectionObserver;
