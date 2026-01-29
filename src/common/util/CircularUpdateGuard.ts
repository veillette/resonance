/**
 * Utility class to prevent circular updates when synchronizing values between
 * properties that need to stay in sync (e.g., bidirectional bindings).
 *
 * Usage:
 * ```ts
 * const guard = new CircularUpdateGuard();
 *
 * propertyA.link(value => {
 *   guard.run(() => {
 *     propertyB.value = transform(value);
 *   });
 * });
 *
 * propertyB.link(value => {
 *   guard.run(() => {
 *     propertyA.value = inverseTransform(value);
 *   });
 * });
 * ```
 */
export class CircularUpdateGuard {
  private _isUpdating = false;

  /**
   * Returns true if currently inside a guarded callback.
   */
  public get isUpdating(): boolean {
    return this._isUpdating;
  }

  /**
   * Executes the callback only if not already inside another guarded call.
   * @param callback - The function to execute
   * @returns true if the callback was executed, false if skipped due to reentrant call
   */
  public run(callback: () => void): boolean {
    if (this._isUpdating) {
      return false;
    }
    this._isUpdating = true;
    try {
      callback();
      return true;
    } finally {
      this._isUpdating = false;
    }
  }
}
