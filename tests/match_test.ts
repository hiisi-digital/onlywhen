//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module tests/match_test
 *
 * Tests for match and matchAsync functions.
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { match, matchAsync } from "../src/match.ts";

// =============================================================================
// match() Tests
// =============================================================================

describe("match()", () => {
  it("should execute deno handler in Deno environment", () => {
    const result = match({
      deno: () => "deno-result",
      node: () => "node-result",
      bun: () => "bun-result",
      browser: () => "browser-result",
    });

    assertEquals(result, "deno-result");
  });

  it("should execute default handler when no specific match", () => {
    const result = match({
      // Only provide handlers for runtimes we're NOT in
      node: () => "node-result",
      bun: () => "bun-result",
      browser: () => "browser-result",
      default: () => "default-result",
    });

    // In Deno without a deno handler, should NOT fall to default
    // because we ARE in Deno and there's no deno handler
    // Wait - we need to check the logic. Let me re-read the implementation.
    // The match function checks isDeno first, and if isDeno && handlers.deno exists, it runs it.
    // If isDeno is true but handlers.deno doesn't exist, it falls through to check isNode, etc.
    // Since we're in Deno, isDeno is true, but there's no deno handler.
    // Then it checks isNode (false), isBun (false), isBrowser (false).
    // Finally it checks handlers.default.
    assertEquals(result, "default-result");
  });

  it("should return undefined when no handlers match", () => {
    const result = match({
      node: () => "node-result",
      bun: () => "bun-result",
    });

    assertEquals(result, undefined);
  });

  it("should handle empty handlers object", () => {
    const result = match({});
    assertEquals(result, undefined);
  });

  it("should pass through return values correctly", () => {
    const result = match({
      deno: () => ({ name: "test", value: 42 }),
    });

    assertEquals(result, { name: "test", value: 42 });
  });

  it("should handle null return values", () => {
    const result = match({
      deno: () => null,
    });

    assertEquals(result, null);
  });

  it("should handle handlers returning different types", () => {
    const numberResult = match<number>({
      deno: () => 42,
      default: () => 0,
    });
    assertEquals(numberResult, 42);

    const stringResult = match<string>({
      deno: () => "hello",
      default: () => "",
    });
    assertEquals(stringResult, "hello");

    const arrayResult = match<number[]>({
      deno: () => [1, 2, 3],
      default: () => [],
    });
    assertEquals(arrayResult, [1, 2, 3]);
  });
});

// =============================================================================
// matchAsync() Tests
// =============================================================================

describe("matchAsync()", () => {
  it("should execute async deno handler in Deno environment", async () => {
    const result = await matchAsync({
      deno: async () => {
        await Promise.resolve();
        return "deno-async-result";
      },
      node: async () => {
        await Promise.resolve();
        return "node-async-result";
      },
    });

    assertEquals(result, "deno-async-result");
  });

  it("should execute async default handler when no specific match", async () => {
    const result = await matchAsync({
      node: async () => {
        await Promise.resolve();
        return "node-result";
      },
      default: async () => {
        await Promise.resolve();
        return "default-async-result";
      },
    });

    assertEquals(result, "default-async-result");
  });

  it("should return undefined when no async handlers match", async () => {
    const result = await matchAsync({
      node: async () => {
        await Promise.resolve();
        return "node-result";
      },
    });

    assertEquals(result, undefined);
  });

  it("should handle empty handlers object", async () => {
    const result = await matchAsync({});
    assertEquals(result, undefined);
  });

  it("should properly await promises", async () => {
    const startTime = Date.now();
    const result = await matchAsync({
      deno: async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "delayed-result";
      },
    });
    const elapsed = Date.now() - startTime;

    assertEquals(result, "delayed-result");
    assertEquals(elapsed >= 10, true);
  });

  it("should handle async handlers returning different types", async () => {
    const numberResult = await matchAsync<number>({
      deno: async () => {
        await Promise.resolve();
        return 42;
      },
    });
    assertEquals(numberResult, 42);

    const objectResult = await matchAsync<{ id: number }>({
      deno: async () => {
        await Promise.resolve();
        return { id: 123 };
      },
    });
    assertEquals(objectResult, { id: 123 });
  });
});

// =============================================================================
// Export Existence Tests
// =============================================================================

describe("Match Exports", () => {
  it("should export match function", () => {
    assertExists(match);
    assertEquals(typeof match, "function");
  });

  it("should export matchAsync function", () => {
    assertExists(matchAsync);
    assertEquals(typeof matchAsync, "function");
  });
});
