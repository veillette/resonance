/**
 * Tests for CircularUpdateGuard utility class
 *
 * P2 Priority: Utility class for preventing circular updates in bidirectional bindings.
 */

import { describe, it, expect, vi } from "vitest";
import { CircularUpdateGuard } from "../CircularUpdateGuard.js";

describe("CircularUpdateGuard", () => {
  describe("single execution", () => {
    it("should execute callback and return true", () => {
      const guard = new CircularUpdateGuard();
      const callback = vi.fn();

      const result = guard.run(callback);

      expect(callback).toHaveBeenCalledOnce();
      expect(result).toBe(true);
    });

    it("should execute callback with correct context", () => {
      const guard = new CircularUpdateGuard();
      let value = 0;

      guard.run(() => {
        value = 42;
      });

      expect(value).toBe(42);
    });
  });

  describe("reentrant call prevention", () => {
    it("should prevent circular updates", () => {
      const guard = new CircularUpdateGuard();
      let innerRan = false;

      guard.run(() => {
        guard.run(() => {
          innerRan = true;
        });
      });

      expect(innerRan).toBe(false);
    });

    it("should return false for reentrant call", () => {
      const guard = new CircularUpdateGuard();
      let innerResult: boolean | undefined;

      guard.run(() => {
        innerResult = guard.run(() => {});
      });

      expect(innerResult).toBe(false);
    });

    it("should prevent deeply nested circular calls", () => {
      const guard = new CircularUpdateGuard();
      const executionOrder: string[] = [];

      guard.run(() => {
        executionOrder.push("level1");
        guard.run(() => {
          executionOrder.push("level2");
          guard.run(() => {
            executionOrder.push("level3");
          });
        });
      });

      expect(executionOrder).toEqual(["level1"]);
    });
  });

  describe("isUpdating flag", () => {
    it("should be false before callback", () => {
      const guard = new CircularUpdateGuard();

      expect(guard.isUpdating).toBe(false);
    });

    it("should be true during callback", () => {
      const guard = new CircularUpdateGuard();
      let duringCallback = false;

      guard.run(() => {
        duringCallback = guard.isUpdating;
      });

      expect(duringCallback).toBe(true);
    });

    it("should be false after callback", () => {
      const guard = new CircularUpdateGuard();

      guard.run(() => {});

      expect(guard.isUpdating).toBe(false);
    });
  });

  describe("exception handling", () => {
    it("should reset flag even if callback throws", () => {
      const guard = new CircularUpdateGuard();

      expect(() => {
        guard.run(() => {
          throw new Error("Test error");
        });
      }).toThrow("Test error");

      expect(guard.isUpdating).toBe(false);
    });

    it("should allow subsequent calls after exception", () => {
      const guard = new CircularUpdateGuard();
      const callback = vi.fn();

      // First call throws
      try {
        guard.run(() => {
          throw new Error("Test error");
        });
      } catch {
        // Expected
      }

      // Second call should work
      const result = guard.run(callback);

      expect(callback).toHaveBeenCalledOnce();
      expect(result).toBe(true);
    });
  });

  describe("multiple guards", () => {
    it("should allow independent guards to run simultaneously", () => {
      const guard1 = new CircularUpdateGuard();
      const guard2 = new CircularUpdateGuard();
      let guard2Ran = false;

      guard1.run(() => {
        guard2.run(() => {
          guard2Ran = true;
        });
      });

      expect(guard2Ran).toBe(true);
    });

    it("should not interfere with each other", () => {
      const guard1 = new CircularUpdateGuard();
      const guard2 = new CircularUpdateGuard();

      guard1.run(() => {
        expect(guard1.isUpdating).toBe(true);
        expect(guard2.isUpdating).toBe(false);
      });
    });
  });

  describe("bidirectional binding use case", () => {
    it("should prevent infinite loops in bidirectional sync", () => {
      const guard = new CircularUpdateGuard();
      let valueA = 0;
      let valueB = 0;
      let syncCountAtoB = 0;
      let syncCountBtoA = 0;

      // Simulate bidirectional binding
      const updateA = (newValue: number) => {
        valueA = newValue;
        guard.run(() => {
          syncCountAtoB++;
          updateB(newValue * 2); // A -> B transform
        });
      };

      const updateB = (newValue: number) => {
        valueB = newValue;
        guard.run(() => {
          syncCountBtoA++;
          updateA(newValue / 2); // B -> A transform
        });
      };

      // Update A, which should sync to B, but not back to A
      updateA(10);

      expect(valueA).toBe(10);
      expect(valueB).toBe(20);
      expect(syncCountAtoB).toBe(1);
      expect(syncCountBtoA).toBe(0); // Guard prevented this
    });
  });

  describe("sequential calls", () => {
    it("should allow sequential non-nested calls", () => {
      const guard = new CircularUpdateGuard();
      const results: boolean[] = [];

      results.push(guard.run(() => {}));
      results.push(guard.run(() => {}));
      results.push(guard.run(() => {}));

      expect(results).toEqual([true, true, true]);
    });

    it("should correctly track isUpdating across sequential calls", () => {
      const guard = new CircularUpdateGuard();
      const states: boolean[] = [];

      states.push(guard.isUpdating); // before first
      guard.run(() => {
        states.push(guard.isUpdating); // during first
      });
      states.push(guard.isUpdating); // after first
      guard.run(() => {
        states.push(guard.isUpdating); // during second
      });
      states.push(guard.isUpdating); // after second

      expect(states).toEqual([false, true, false, true, false]);
    });
  });
});
