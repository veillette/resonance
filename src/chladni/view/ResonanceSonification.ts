/**
 * ResonanceSonification.ts
 *
 * Provides audio feedback for resonance detection in the Chladni plate simulation.
 * Uses the Web Audio API to generate tones that indicate proximity to resonance peaks.
 *
 * Audio Behavior:
 * - Base pitch follows the simulation frequency (scaled to audible range)
 * - Volume increases as resonance strength increases
 * - Provides clear audio cue when at a resonance peak
 *
 * This follows SceneryStack's audio patterns and respects the global audio enabled state.
 */

import { DerivedProperty, Property, TReadOnlyProperty } from "scenerystack/axon";
import { ChladniModel } from "../model/ChladniModel.js";

/**
 * Threshold for considering the simulation to be "at resonance"
 * Normalized strength above this value triggers the resonance indicator
 */
const RESONANCE_THRESHOLD = 0.7;

/**
 * Minimum strength to produce any sound (below this is silent)
 */
const MIN_STRENGTH_FOR_SOUND = 0.1;

/**
 * Audio frequency range for sonification (Hz)
 * Maps simulation frequency to audible pitch
 */
const MIN_AUDIO_FREQUENCY = 220; // A3
const MAX_AUDIO_FREQUENCY = 880; // A5

/**
 * Volume range (0-1)
 */
const MIN_VOLUME = 0.0;
const MAX_VOLUME = 0.3;

/**
 * Smoothing time for volume changes (seconds)
 * Prevents clicking/popping artifacts
 */
const VOLUME_SMOOTHING_TIME = 0.05;

/**
 * ResonanceSonification provides audio feedback for the Chladni plate simulation.
 * It generates a tone whose volume indicates proximity to resonance peaks.
 */
export class ResonanceSonification {
  private readonly model: ChladniModel;
  private readonly audioEnabledProperty: TReadOnlyProperty<boolean>;

  // Web Audio API components
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  // Derived property for resonance state
  public readonly isAtResonanceProperty: Property<boolean>;
  public readonly normalizedStrengthProperty: Property<number>;

  // Cache for max strength (for normalization)
  private maxStrength: number = 1;
  private strengthSampleCount: number = 0;

  public constructor(
    model: ChladniModel,
    audioEnabledProperty: TReadOnlyProperty<boolean>,
  ) {
    this.model = model;
    this.audioEnabledProperty = audioEnabledProperty;

    // Create derived properties for resonance state
    this.normalizedStrengthProperty = new Property<number>(0);
    this.isAtResonanceProperty = new Property<boolean>(false);

    // Update strength when frequency changes
    model.frequencyProperty.link(() => {
      this.updateResonanceState();
    });

    // Update when material or excitation position changes (affects resonance curve)
    model.materialProperty.link(() => {
      this.resetMaxStrength();
      this.updateResonanceState();
    });

    model.excitationPositionProperty.link(() => {
      this.resetMaxStrength();
      this.updateResonanceState();
    });

    // Start/stop audio based on playback state and audio enabled
    const shouldPlayProperty = new DerivedProperty(
      [model.isPlayingProperty, audioEnabledProperty],
      (isPlaying, audioEnabled) => isPlaying && audioEnabled,
    );

    shouldPlayProperty.link((shouldPlay) => {
      if (shouldPlay) {
        this.startAudio();
      } else {
        this.stopAudio();
      }
    });
  }

  /**
   * Reset max strength tracking (called when resonance curve changes)
   */
  private resetMaxStrength(): void {
    this.maxStrength = 1;
    this.strengthSampleCount = 0;
  }

  /**
   * Update the resonance state based on current frequency
   */
  private updateResonanceState(): void {
    const frequency = this.model.frequencyProperty.value;
    const strength = this.model.strength(frequency);

    // Track max strength for normalization
    this.strengthSampleCount++;
    if (strength > this.maxStrength || this.strengthSampleCount < 10) {
      this.maxStrength = Math.max(this.maxStrength, strength);
    }

    // Normalize strength
    const normalizedStrength =
      this.maxStrength > 0 ? Math.min(strength / this.maxStrength, 1) : 0;

    this.normalizedStrengthProperty.value = normalizedStrength;
    this.isAtResonanceProperty.value = normalizedStrength > RESONANCE_THRESHOLD;

    // Update audio if playing
    if (this.isPlaying && this.gainNode && this.oscillator) {
      this.updateAudioParameters(frequency, normalizedStrength);
    }
  }

  /**
   * Initialize and start the audio
   */
  private startAudio(): void {
    if (this.isPlaying) return;

    try {
      // Create audio context on first use (must be triggered by user interaction)
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      // Resume context if suspended
      if (this.audioContext.state === "suspended") {
        void this.audioContext.resume();
      }

      // Create oscillator
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.type = "sine";

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0;

      // Connect nodes
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Start oscillator
      this.oscillator.start();
      this.isPlaying = true;

      // Update with current state
      this.updateResonanceState();
    } catch (e) {
      // Audio might not be available in some environments
      console.warn("ResonanceSonification: Could not start audio", e);
    }
  }

  /**
   * Stop and clean up audio
   */
  private stopAudio(): void {
    if (!this.isPlaying) return;

    try {
      // Fade out quickly to avoid clicking
      if (this.gainNode && this.audioContext) {
        this.gainNode.gain.linearRampToValueAtTime(
          0,
          this.audioContext.currentTime + 0.02,
        );
      }

      // Stop oscillator after fade
      setTimeout(() => {
        if (this.oscillator) {
          this.oscillator.stop();
          this.oscillator.disconnect();
          this.oscillator = null;
        }
        if (this.gainNode) {
          this.gainNode.disconnect();
          this.gainNode = null;
        }
      }, 30);

      this.isPlaying = false;
    } catch (e) {
      console.warn("ResonanceSonification: Error stopping audio", e);
    }
  }

  /**
   * Update audio parameters based on current frequency and strength
   */
  private updateAudioParameters(
    frequency: number,
    normalizedStrength: number,
  ): void {
    if (!this.oscillator || !this.gainNode || !this.audioContext) return;

    // Map simulation frequency (50-4000 Hz) to audio frequency
    const freqRange = this.model.frequencyRange;
    const freqT = (frequency - freqRange.min) / (freqRange.max - freqRange.min);
    const audioFreq =
      MIN_AUDIO_FREQUENCY + freqT * (MAX_AUDIO_FREQUENCY - MIN_AUDIO_FREQUENCY);

    // Set oscillator frequency
    this.oscillator.frequency.setValueAtTime(
      audioFreq,
      this.audioContext.currentTime,
    );

    // Calculate volume based on strength
    let targetVolume = 0;
    if (normalizedStrength > MIN_STRENGTH_FOR_SOUND) {
      // Map strength to volume with exponential curve for better perception
      const strengthT =
        (normalizedStrength - MIN_STRENGTH_FOR_SOUND) /
        (1 - MIN_STRENGTH_FOR_SOUND);
      targetVolume = MIN_VOLUME + strengthT * strengthT * (MAX_VOLUME - MIN_VOLUME);
    }

    // Smooth volume transition
    this.gainNode.gain.linearRampToValueAtTime(
      targetVolume,
      this.audioContext.currentTime + VOLUME_SMOOTHING_TIME,
    );
  }

  /**
   * Dispose of audio resources
   */
  public dispose(): void {
    this.stopAudio();
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
  }
}
