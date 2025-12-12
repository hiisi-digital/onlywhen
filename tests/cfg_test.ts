//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module tests/cfg_test
 *
 * Integration tests for the main onlywhen object.
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { onlywhen } from "../src/cfg.ts";

// =============================================================================
// Object Structure Tests
// =============================================================================

describe("onlywhen Object Structure", () => {
  it("should be a callable function", () => {
    assertEquals(typeof onlywhen, "function");
  });

  it("should have platform detection properties", () => {
    assertExists(onlywhen.darwin);
    assertExists(onlywhen.linux !== undefined);
    assertExists(onlywhen.windows !== undefined);

    assertEquals(typeof onlywhen.darwin, "boolean");
    assertEquals(typeof onlywhen.linux, "boolean");
    assertEquals(typeof onlywhen.windows, "boolean");
  });

  it("should have runtime detection properties", () => {
    assertExists(onlywhen.deno !== undefined);
    assertExists(onlywhen.node !== undefined);
    assertExists(onlywhen.bun !== undefined);
    assertExists(onlywhen.browser !== undefined);

    assertEquals(typeof onlywhen.deno, "boolean");
    assertEquals(typeof onlywhen.node, "boolean");
    assertEquals(typeof onlywhen.bun, "boolean");
    assertEquals(typeof onlywhen.browser, "boolean");
  });

  it("should have architecture detection properties", () => {
    assertExists(onlywhen.x64 !== undefined);
    assertExists(onlywhen.arm64 !== undefined);

    assertEquals(typeof onlywhen.x64, "boolean");
    assertEquals(typeof onlywhen.arm64, "boolean");
  });

  it("should have combinator methods", () => {
    assertExists(onlywhen.all);
    assertExists(onlywhen.any);
    assertExists(onlywhen.not);

    assertEquals(typeof onlywhen.all, "function");
    assertEquals(typeof onlywhen.any, "function");
    assertEquals(typeof onlywhen.not, "function");
  });

  it("should have feature methods and property", () => {
    assertExists(onlywhen.feature);
    assertExists(onlywhen.features);

    assertEquals(typeof onlywhen.feature, "function");
    assertEquals(onlywhen.features instanceof Set, true);
  });
});

// =============================================================================
// Runtime Detection Tests (in Deno)
// =============================================================================

describe("onlywhen Runtime Detection in Deno", () => {
  it("should detect Deno runtime", () => {
    assertEquals(onlywhen.deno, true);
  });

  it("should not detect other runtimes", () => {
    assertEquals(onlywhen.node, false);
    assertEquals(onlywhen.bun, false);
    assertEquals(onlywhen.browser, false);
  });
});

// =============================================================================
// Combinator Integration Tests
// =============================================================================

describe("onlywhen Combinator Integration", () => {
  it("should use all() combinator correctly", () => {
    assertEquals(onlywhen.all(onlywhen.deno, true), true);
    assertEquals(onlywhen.all(onlywhen.deno, false), false);
    assertEquals(onlywhen.all(onlywhen.node, true), false);
  });

  it("should use any() combinator correctly", () => {
    assertEquals(onlywhen.any(onlywhen.deno, onlywhen.node), true);
    assertEquals(onlywhen.any(onlywhen.node, onlywhen.bun), false);
  });

  it("should use not() combinator correctly", () => {
    assertEquals(onlywhen.not(onlywhen.deno), false);
    assertEquals(onlywhen.not(onlywhen.node), true);
  });

  it("should allow complex combinator expressions", () => {
    // (deno OR node) AND (NOT browser)
    const result = onlywhen.all(
      onlywhen.any(onlywhen.deno, onlywhen.node),
      onlywhen.not(onlywhen.browser),
    );
    assertEquals(result, true);
  });
});

// =============================================================================
// Decorator Factory Tests
// =============================================================================

describe("onlywhen as Decorator Factory", () => {
  it("should return a decorator when called with boolean", () => {
    const decorator = onlywhen(true);
    assertExists(decorator);
    assertEquals(typeof decorator, "function");
  });

  it("should create working class decorator with true condition", () => {
    const decorator = onlywhen(true);

    class TestClass {
      value = 42;
      getValue(): number {
        return this.value;
      }
    }

    const DecoratedClass = decorator(TestClass) as typeof TestClass;
    assertEquals(DecoratedClass, TestClass);
  });

  it("should create modified class decorator with false condition", () => {
    const decorator = onlywhen(false);

    class TestClass {
      value = 42;
    }

    const DecoratedClass = decorator(TestClass);
    assertEquals(DecoratedClass !== TestClass, true);
  });

  it("should work with platform conditions", () => {
    const darwinDecorator = onlywhen(onlywhen.darwin);
    const nodeDecorator = onlywhen(onlywhen.node);

    assertExists(darwinDecorator);
    assertExists(nodeDecorator);
  });

  it("should work with combinator conditions", () => {
    const combinedDecorator = onlywhen(onlywhen.all(onlywhen.deno, onlywhen.not(onlywhen.windows)));
    assertExists(combinedDecorator);
  });
});

// =============================================================================
// Feature Integration Tests
// =============================================================================

describe("onlywhen Feature Integration", () => {
  it("should check features via onlywhen.feature()", () => {
    const result = onlywhen.feature("nonexistent");
    assertEquals(result, false);
  });

  it("should expose features set via onlywhen.features", () => {
    const features = onlywhen.features;
    assertEquals(features instanceof Set, true);
  });
});

// =============================================================================
// Usage Pattern Tests
// =============================================================================

describe("onlywhen Usage Patterns", () => {
  it("should work in if statements", () => {
    let executed = false;

    if (onlywhen.deno) {
      executed = true;
    }

    assertEquals(executed, true);
  });

  it("should work with short-circuit evaluation", () => {
    let executed = false;

    onlywhen.deno && (executed = true);

    assertEquals(executed, true);
  });

  it("should work with ternary expressions", () => {
    const result = onlywhen.deno ? "deno" : "other";
    assertEquals(result, "deno");
  });

  it("should work in complex boolean expressions", () => {
    const isDenoOnUnix = onlywhen.deno && (onlywhen.darwin || onlywhen.linux);
    const isNotWindows = !onlywhen.windows;

    // We're in Deno, and either darwin or linux (CI usually runs on linux/mac)
    if (onlywhen.darwin || onlywhen.linux) {
      assertEquals(isDenoOnUnix, true);
    }
    assertEquals(isNotWindows, !onlywhen.windows);
  });
});

// =============================================================================
// Immutability Tests
// =============================================================================

describe("onlywhen Immutability", () => {
  it("should be frozen", () => {
    assertEquals(Object.isFrozen(onlywhen), true);
  });

  it("should not allow property modification", () => {
    // Attempting to modify should either throw or silently fail
    const originalValue = onlywhen.deno;

    try {
      // @ts-expect-error - Testing runtime behavior
      onlywhen.deno = false;
    } catch {
      // Expected in strict mode
    }

    assertEquals(onlywhen.deno, originalValue);
  });

  it("should not allow adding new properties", () => {
    try {
      // @ts-expect-error - Testing runtime behavior
      onlywhen.newProperty = "test";
    } catch {
      // Expected in strict mode
    }

    // @ts-expect-error - Testing runtime behavior
    assertEquals(onlywhen.newProperty, undefined);
  });
});
