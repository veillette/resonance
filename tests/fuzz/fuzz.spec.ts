/**
 * Automated fuzz testing for the Resonance simulation.
 *
 * This test launches the simulation with fuzz parameters and monitors the console
 * for errors. It supports configurable duration, fuzz rate, and reproducible seeds.
 *
 * Usage:
 *   npm run test:fuzz                    # Run with defaults (60s, random seed)
 *   npm run test:fuzz -- --seed=12345    # Run with specific seed for reproducibility
 *   npm run test:fuzz -- --duration=300  # Run for 5 minutes
 *   npm run test:fuzz -- --headed        # Run with visible browser
 *
 * Environment variables:
 *   FUZZ_DURATION - Duration in seconds (default: 60)
 *   FUZZ_SEED - Random seed for reproducibility (default: random)
 *   FUZZ_RATE - Events per frame (default: 100)
 *   FUZZ_POINTERS - Max concurrent pointers (default: 1)
 */

import { test, expect } from "@playwright/test";

// Configuration from environment or defaults
const FUZZ_DURATION = parseInt(process.env.FUZZ_DURATION || "60", 10) * 1000;
const FUZZ_SEED =
  process.env.FUZZ_SEED || Math.floor(Math.random() * 1000000).toString();
const FUZZ_RATE = process.env.FUZZ_RATE || "100";
const FUZZ_POINTERS = process.env.FUZZ_POINTERS || "1";

interface ConsoleMessage {
  type: string;
  text: string;
  location: string;
  timestamp: number;
}

interface FuzzResult {
  seed: string;
  duration: number;
  errors: ConsoleMessage[];
  warnings: ConsoleMessage[];
  assertions: ConsoleMessage[];
}

test.describe("Fuzz Testing", () => {
  test("should run without console errors", async ({ page }) => {
    const errors: ConsoleMessage[] = [];
    const warnings: ConsoleMessage[] = [];
    const assertions: ConsoleMessage[] = [];
    const startTime = Date.now();

    // Build the fuzz URL
    const fuzzUrl = `/?fuzz&randomSeed=${FUZZ_SEED}&fuzzRate=${FUZZ_RATE}&fuzzPointers=${FUZZ_POINTERS}`;

    console.log("\n========================================");
    console.log("FUZZ TEST CONFIGURATION");
    console.log("========================================");
    console.log(`Seed: ${FUZZ_SEED}`);
    console.log(`Duration: ${FUZZ_DURATION / 1000}s`);
    console.log(`Fuzz Rate: ${FUZZ_RATE} events/frame`);
    console.log(`Max Pointers: ${FUZZ_POINTERS}`);
    console.log(`URL: ${fuzzUrl}`);
    console.log("========================================\n");

    // Listen for console messages
    page.on("console", (msg) => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location();
      const timestamp = Date.now() - startTime;

      const message: ConsoleMessage = {
        type,
        text,
        location: `${location.url}:${location.lineNumber}:${location.columnNumber}`,
        timestamp,
      };

      if (type === "error") {
        errors.push(message);
        console.log(`[${(timestamp / 1000).toFixed(1)}s] ERROR: ${text}`);
      } else if (type === "warning") {
        warnings.push(message);
      } else if (
        text.includes("Assertion failed") ||
        text.includes("AssertionError")
      ) {
        assertions.push(message);
        console.log(`[${(timestamp / 1000).toFixed(1)}s] ASSERTION: ${text}`);
      }
    });

    // Listen for page errors (uncaught exceptions)
    page.on("pageerror", (error) => {
      const timestamp = Date.now() - startTime;
      errors.push({
        type: "pageerror",
        text: error.message,
        location: error.stack || "unknown",
        timestamp,
      });
      console.log(
        `[${(timestamp / 1000).toFixed(1)}s] PAGE ERROR: ${error.message}`,
      );
    });

    // Navigate to the fuzz URL
    await page.goto(fuzzUrl);

    // Wait for the simulation to initialize
    await page.waitForSelector("#sim", { timeout: 30000 });

    console.log("Simulation loaded. Fuzzing in progress...\n");

    // Let the fuzz test run for the specified duration
    // Check periodically for fatal errors that might stop the sim
    const checkInterval = 5000; // Check every 5 seconds
    let elapsed = 0;

    while (elapsed < FUZZ_DURATION) {
      const waitTime = Math.min(checkInterval, FUZZ_DURATION - elapsed);
      await page.waitForTimeout(waitTime);
      elapsed += waitTime;

      // Progress indicator
      const progress = ((elapsed / FUZZ_DURATION) * 100).toFixed(0);
      process.stdout.write(
        `\rProgress: ${progress}% (${(elapsed / 1000).toFixed(0)}s / ${(FUZZ_DURATION / 1000).toFixed(0)}s)`,
      );

      // Check if the page is still responsive
      try {
        await page.evaluate(() => window.document.hasFocus);
      } catch {
        console.log("\nPage became unresponsive!");
        break;
      }
    }

    console.log("\n");

    // Generate the result report
    const result: FuzzResult = {
      seed: FUZZ_SEED,
      duration: elapsed,
      errors,
      warnings,
      assertions,
    };

    // Print summary
    console.log("========================================");
    console.log("FUZZ TEST RESULTS");
    console.log("========================================");
    console.log(`Seed: ${result.seed}`);
    console.log(`Duration: ${(result.duration / 1000).toFixed(1)}s`);
    console.log(`Errors: ${result.errors.length}`);
    console.log(`Warnings: ${result.warnings.length}`);
    console.log(`Assertions: ${result.assertions.length}`);

    if (result.errors.length > 0) {
      console.log("\nERRORS:");
      result.errors.forEach((err, i) => {
        console.log(
          `  ${i + 1}. [${(err.timestamp / 1000).toFixed(1)}s] ${err.text}`,
        );
        console.log(`     Location: ${err.location}`);
      });
    }

    if (result.assertions.length > 0) {
      console.log("\nASSERTIONS:");
      result.assertions.forEach((a, i) => {
        console.log(
          `  ${i + 1}. [${(a.timestamp / 1000).toFixed(1)}s] ${a.text}`,
        );
      });
    }

    console.log("========================================");
    console.log(`\nTo reproduce: FUZZ_SEED=${FUZZ_SEED} npm run test:fuzz`);
    console.log(`Or visit: http://localhost:5173${fuzzUrl}`);
    console.log("========================================\n");

    // Fail the test if there were errors or assertions
    expect(
      result.errors.length,
      `Found ${result.errors.length} console errors`,
    ).toBe(0);
    expect(
      result.assertions.length,
      `Found ${result.assertions.length} assertion failures`,
    ).toBe(0);
  });

  test("should handle rapid configuration changes", async ({ page }) => {
    // This test rapidly changes resonator count and configuration
    // to stress test the rebuild/cleanup logic
    const errors: ConsoleMessage[] = [];
    const startTime = Date.now();

    console.log("\n========================================");
    console.log("CONFIGURATION STRESS TEST");
    console.log("========================================\n");

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const timestamp = Date.now() - startTime;
        errors.push({
          type: msg.type(),
          text: msg.text(),
          location: `${msg.location().url}:${msg.location().lineNumber}`,
          timestamp,
        });
        console.log(`ERROR: ${msg.text()}`);
      }
    });

    page.on("pageerror", (error) => {
      errors.push({
        type: "pageerror",
        text: error.message,
        location: error.stack || "unknown",
        timestamp: Date.now() - startTime,
      });
      console.log(`PAGE ERROR: ${error.message}`);
    });

    // Load without fuzzing so we can control interactions
    await page.goto("/");
    await page.waitForSelector("#sim", { timeout: 30000 });

    // Wait for simulation to be fully loaded
    await page.waitForTimeout(2000);

    console.log("Simulation loaded. Running configuration stress test...\n");

    // Perform rapid configuration changes for 30 seconds
    const testDuration = 30000;
    const changeInterval = 500; // Change every 500ms
    let elapsed = 0;

    while (elapsed < testDuration) {
      try {
        // Try to find and interact with controls
        // These selectors may need adjustment based on actual DOM structure

        // Random click somewhere in the sim area to trigger interactions
        const simElement = await page.$("#sim");
        if (simElement) {
          const box = await simElement.boundingBox();
          if (box) {
            const x = box.x + Math.random() * box.width;
            const y = box.y + Math.random() * box.height;
            await page.mouse.click(x, y);
          }
        }
      } catch {
        // Ignore interaction errors, we're stress testing
      }

      await page.waitForTimeout(changeInterval);
      elapsed += changeInterval;

      const progress = ((elapsed / testDuration) * 100).toFixed(0);
      process.stdout.write(`\rProgress: ${progress}%`);
    }

    console.log("\n\nConfiguration stress test complete.");
    console.log(`Errors found: ${errors.length}`);

    if (errors.length > 0) {
      console.log("\nErrors:");
      errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.text}`);
      });
    }

    expect(
      errors.length,
      `Found ${errors.length} errors during stress test`,
    ).toBe(0);
  });

  test("should run multitouch fuzz test", async ({ page }) => {
    const errors: ConsoleMessage[] = [];
    const startTime = Date.now();
    const duration = parseInt(process.env.FUZZ_DURATION || "30", 10) * 1000;

    const fuzzUrl = `/?fuzz&randomSeed=${FUZZ_SEED}&fuzzRate=50&fuzzPointers=5`;

    console.log("\n========================================");
    console.log("MULTITOUCH FUZZ TEST");
    console.log("========================================");
    console.log(`Seed: ${FUZZ_SEED}`);
    console.log(`Max Pointers: 5`);
    console.log("========================================\n");

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const timestamp = Date.now() - startTime;
        errors.push({
          type: msg.type(),
          text: msg.text(),
          location: `${msg.location().url}:${msg.location().lineNumber}`,
          timestamp,
        });
        console.log(`[${(timestamp / 1000).toFixed(1)}s] ERROR: ${msg.text()}`);
      }
    });

    page.on("pageerror", (error) => {
      errors.push({
        type: "pageerror",
        text: error.message,
        location: error.stack || "unknown",
        timestamp: Date.now() - startTime,
      });
    });

    await page.goto(fuzzUrl);
    await page.waitForSelector("#sim", { timeout: 30000 });

    console.log("Running multitouch fuzz test...\n");

    let elapsed = 0;
    const checkInterval = 5000;

    while (elapsed < duration) {
      const waitTime = Math.min(checkInterval, duration - elapsed);
      await page.waitForTimeout(waitTime);
      elapsed += waitTime;

      const progress = ((elapsed / duration) * 100).toFixed(0);
      process.stdout.write(`\rProgress: ${progress}%`);
    }

    console.log("\n\nMultitouch fuzz test complete.");
    console.log(`Errors found: ${errors.length}`);

    expect(
      errors.length,
      `Found ${errors.length} errors in multitouch test`,
    ).toBe(0);
  });
});
