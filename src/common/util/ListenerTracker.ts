import type { TReadOnlyProperty } from 'scenerystack/axon';

/**
 * Tracks property listeners to enable bulk cleanup during dispose.
 * Helps prevent memory leaks when dynamically creating/destroying UI components.
 *
 * Usage:
 * ```ts
 * class MyComponent {
 *   private readonly listenerTracker = new ListenerTracker();
 *
 *   constructor() {
 *     // Use track() instead of property.link()
 *     this.listenerTracker.link(someProperty, value => {
 *       // handle value change
 *     });
 *   }
 *
 *   dispose(): void {
 *     this.listenerTracker.dispose();
 *   }
 * }
 * ```
 */
export class ListenerTracker {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly tracked: Array<{ property: TReadOnlyProperty<any>; listener: ( value: any ) => void }> = [];

  /**
   * Links a listener to a property and tracks it for later cleanup.
   * The listener is called immediately with the current value (like Property.link()).
   */
  public link<T>( property: TReadOnlyProperty<T>, listener: ( value: T ) => void ): void {
    property.link( listener );
    this.tracked.push( { property, listener } );
  }

  /**
   * Links a listener to a property lazily (not called immediately).
   * The listener is tracked for later cleanup.
   */
  public lazyLink<T>( property: TReadOnlyProperty<T>, listener: ( value: T ) => void ): void {
    property.lazyLink( listener );
    this.tracked.push( { property, listener } );
  }

  /**
   * Unlinks all tracked listeners and clears the tracking list.
   */
  public dispose(): void {
    this.tracked.forEach( ( { property, listener } ) => {
      property.unlink( listener );
    } );
    this.tracked.length = 0;
  }
}
