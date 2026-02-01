/**
 * PlaybackStateMachine.ts
 *
 * Manages the playback state for the Chladni plate simulation.
 * Provides a clear state machine for animation control with well-defined
 * state transitions.
 *
 * States:
 * - IDLE: Animation is paused, no sweep active
 * - PLAYING: Animation is running, particles moving
 * - SWEEPING: Animation is running with frequency sweep active
 * - PAUSED_SWEEPING: Animation paused but sweep will resume when playing
 */

import { BooleanProperty, Property, DerivedProperty } from "scenerystack/axon";

/**
 * Possible playback states for the simulation.
 */
export enum PlaybackState {
  /** Animation paused, no sweep active */
  IDLE = "idle",
  /** Animation running normally */
  PLAYING = "playing",
  /** Animation running with frequency sweep */
  SWEEPING = "sweeping",
  /** Animation paused but sweep will resume */
  PAUSED_SWEEPING = "paused_sweeping",
}

/**
 * PlaybackStateMachine manages the animation and sweep states with clear
 * state transitions and derived properties for UI binding.
 */
export class PlaybackStateMachine {
  /**
   * The current playback state.
   */
  public readonly stateProperty: Property<PlaybackState>;

  /**
   * Whether animation is currently playing (derived from state).
   * This is the primary property for play/pause button binding.
   */
  public readonly isPlayingProperty: BooleanProperty;

  /**
   * Whether a frequency sweep is active (derived from state).
   * True in both SWEEPING and PAUSED_SWEEPING states.
   */
  public readonly isSweepActiveProperty: Property<boolean>;

  /**
   * Whether the simulation is actively animating (playing or sweeping).
   */
  public readonly isAnimatingProperty: Property<boolean>;

  public constructor() {
    // Initialize state to IDLE
    this.stateProperty = new Property<PlaybackState>(PlaybackState.IDLE);

    // Create isPlayingProperty that stays in sync with state
    this.isPlayingProperty = new BooleanProperty(false);

    // Derive sweep active from state
    this.isSweepActiveProperty = new DerivedProperty(
      [this.stateProperty],
      (state) =>
        state === PlaybackState.SWEEPING ||
        state === PlaybackState.PAUSED_SWEEPING,
    );

    // Derive animating from state
    this.isAnimatingProperty = new DerivedProperty(
      [this.stateProperty],
      (state) =>
        state === PlaybackState.PLAYING || state === PlaybackState.SWEEPING,
    );

    // Keep isPlayingProperty in sync with state changes
    this.stateProperty.link((state) => {
      const shouldBePlaying =
        state === PlaybackState.PLAYING || state === PlaybackState.SWEEPING;
      if (this.isPlayingProperty.value !== shouldBePlaying) {
        this.isPlayingProperty.value = shouldBePlaying;
      }
    });

    // Handle external changes to isPlayingProperty (from play/pause button)
    this.isPlayingProperty.lazyLink((isPlaying) => {
      this.handlePlayingChange(isPlaying);
    });
  }

  /**
   * Handle changes to isPlayingProperty from external sources (UI).
   */
  private handlePlayingChange(isPlaying: boolean): void {
    const currentState = this.stateProperty.value;

    if (isPlaying) {
      // Transitioning to playing
      if (currentState === PlaybackState.IDLE) {
        this.stateProperty.value = PlaybackState.PLAYING;
      } else if (currentState === PlaybackState.PAUSED_SWEEPING) {
        this.stateProperty.value = PlaybackState.SWEEPING;
      }
    } else {
      // Transitioning to paused
      if (currentState === PlaybackState.PLAYING) {
        this.stateProperty.value = PlaybackState.IDLE;
      } else if (currentState === PlaybackState.SWEEPING) {
        this.stateProperty.value = PlaybackState.PAUSED_SWEEPING;
      }
    }
  }

  /**
   * Get the current playback state.
   */
  public get state(): PlaybackState {
    return this.stateProperty.value;
  }

  /**
   * Check if animation is currently playing.
   */
  public get isPlaying(): boolean {
    return this.isPlayingProperty.value;
  }

  /**
   * Check if a sweep is active (including when paused).
   */
  public get isSweepActive(): boolean {
    return this.isSweepActiveProperty.value;
  }

  /**
   * Check if currently in sweeping state (actively sweeping).
   */
  public get isSweeping(): boolean {
    return this.stateProperty.value === PlaybackState.SWEEPING;
  }

  /**
   * Start playing the animation.
   * If a sweep was paused, it resumes.
   */
  public play(): void {
    const currentState = this.stateProperty.value;

    if (currentState === PlaybackState.IDLE) {
      this.stateProperty.value = PlaybackState.PLAYING;
    } else if (currentState === PlaybackState.PAUSED_SWEEPING) {
      this.stateProperty.value = PlaybackState.SWEEPING;
    }
  }

  /**
   * Pause the animation.
   * If sweeping, the sweep is paused but remembered.
   */
  public pause(): void {
    const currentState = this.stateProperty.value;

    if (currentState === PlaybackState.PLAYING) {
      this.stateProperty.value = PlaybackState.IDLE;
    } else if (currentState === PlaybackState.SWEEPING) {
      this.stateProperty.value = PlaybackState.PAUSED_SWEEPING;
    }
  }

  /**
   * Toggle between playing and paused states.
   */
  public togglePlayPause(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Start a frequency sweep.
   * Automatically starts playing if paused.
   */
  public startSweep(): void {
    this.stateProperty.value = PlaybackState.SWEEPING;
  }

  /**
   * Stop the frequency sweep.
   * Continues playing normally if was sweeping.
   */
  public stopSweep(): void {
    const currentState = this.stateProperty.value;

    if (currentState === PlaybackState.SWEEPING) {
      this.stateProperty.value = PlaybackState.PLAYING;
    } else if (currentState === PlaybackState.PAUSED_SWEEPING) {
      this.stateProperty.value = PlaybackState.IDLE;
    }
  }

  /**
   * Called when a sweep completes naturally (reaches max frequency).
   * Transitions from SWEEPING to PLAYING.
   */
  public onSweepComplete(): void {
    if (this.stateProperty.value === PlaybackState.SWEEPING) {
      this.stateProperty.value = PlaybackState.PLAYING;
    } else if (this.stateProperty.value === PlaybackState.PAUSED_SWEEPING) {
      this.stateProperty.value = PlaybackState.IDLE;
    }
  }

  /**
   * Reset the state machine to initial state (IDLE).
   */
  public reset(): void {
    this.stateProperty.value = PlaybackState.IDLE;
    // isPlayingProperty will be updated via the link
  }

  /**
   * Check if a given state transition is valid.
   *
   * @param from - Current state
   * @param to - Target state
   * @returns true if the transition is valid
   */
  public isValidTransition(from: PlaybackState, to: PlaybackState): boolean {
    const validTransitions: Record<PlaybackState, PlaybackState[]> = {
      [PlaybackState.IDLE]: [PlaybackState.PLAYING, PlaybackState.SWEEPING],
      [PlaybackState.PLAYING]: [PlaybackState.IDLE, PlaybackState.SWEEPING],
      [PlaybackState.SWEEPING]: [
        PlaybackState.PLAYING,
        PlaybackState.PAUSED_SWEEPING,
      ],
      [PlaybackState.PAUSED_SWEEPING]: [
        PlaybackState.IDLE,
        PlaybackState.SWEEPING,
      ],
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

  /**
   * Get a human-readable description of the current state.
   */
  public getStateDescription(): string {
    switch (this.stateProperty.value) {
      case PlaybackState.IDLE:
        return "Paused";
      case PlaybackState.PLAYING:
        return "Playing";
      case PlaybackState.SWEEPING:
        return "Sweeping";
      case PlaybackState.PAUSED_SWEEPING:
        return "Sweep Paused";
      default:
        return "Unknown";
    }
  }
}
