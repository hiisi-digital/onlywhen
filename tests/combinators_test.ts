//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module tests/combinators_test
 *
 * Tests for logical combinators: all, any, not.
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { all, any, not } from "../src/combinators.ts";

// =============================================================================
// all() Tests
// =============================================================================

describe("all()", () => {
  it("should return true when all conditions are true", () => {
    assertEquals(all(true, true, true), true);
    assertEquals(all(true, true), true);
    assertEquals(all(true), true);
  });

  it("should return false when any condition is false", () => {
    assertEquals(all(true, false, true), false);
    assertEquals(all(false, true), false);
    assertEquals(all(false, false, false), false);
    assertEquals(all(false), false);
  });

  it("should return true for empty arguments", () => {
    // Array.every returns true for empty arrays
    assertEquals(all(), true);
  });

  it("should work with single argument", () => {
    assertEquals(all(true), true);
    assertEquals(all(false), false);
  });

  it("should work with many arguments", () => {
    assertEquals(all(true, true, true, true, true), true);
    assertEquals(all(true, true, true, true, false), false);
  });
});

// =============================================================================
// any() Tests
// =============================================================================

describe("any()", () => {
  it("should return true when at least one condition is true", () => {
    assertEquals(any(true, false, false), true);
    assertEquals(any(false, true), true);
    assertEquals(any(true), true);
  });

  it("should return false when all conditions are false", () => {
    assertEquals(any(false, false, false), false);
    assertEquals(any(false, false), false);
    assertEquals(any(false), false);
  });

  it("should return false for empty arguments", () => {
    // Array.some returns false for empty arrays
    assertEquals(any(), false);
  });

  it("should work with single argument", () => {
    assertEquals(any(true), true);
    assertEquals(any(false), false);
  });

  it("should work with many arguments", () => {
    assertEquals(any(false, false, false, false, true), true);
    assertEquals(any(false, false, false, false, false), false);
  });
});

// =============================================================================
// not() Tests
// =============================================================================

describe("not()", () => {
  it("should negate true to false", () => {
    assertEquals(not(true), false);
  });

  it("should negate false to true", () => {
    assertEquals(not(false), true);
  });

  it("should be equivalent to logical NOT", () => {
    assertEquals(not(true), !true);
    assertEquals(not(false), !false);
  });
});

// =============================================================================
// Combinator Composition Tests
// =============================================================================

describe("Combinator Composition", () => {
  it("should allow nesting all() and any()", () => {
    // all(any(true, false), any(false, true)) = all(true, true) = true
    assertEquals(all(any(true, false), any(false, true)), true);

    // any(all(true, false), all(true, true)) = any(false, true) = true
    assertEquals(any(all(true, false), all(true, true)), true);
  });

  it("should allow combining with not()", () => {
    // all(not(false), true) = all(true, true) = true
    assertEquals(all(not(false), true), true);

    // any(not(true), false) = any(false, false) = false
    assertEquals(any(not(true), false), false);
  });

  it("should handle complex expressions", () => {
    // Simulating: (darwin AND arm64) OR (linux AND x64)
    const darwinArm64 = all(true, true); // true
    const linuxX64 = all(false, true); // false
    assertEquals(any(darwinArm64, linuxX64), true);

    // Simulating: NOT windows AND (node OR bun)
    const notWindows = not(false); // true
    const nodeOrBun = any(false, true); // true
    assertEquals(all(notWindows, nodeOrBun), true);
  });

  it("should handle De Morgan's laws", () => {
    // not(all(a, b)) === any(not(a), not(b))
    const a = true;
    const b = false;
    assertEquals(not(all(a, b)), any(not(a), not(b)));

    // not(any(a, b)) === all(not(a), not(b))
    assertEquals(not(any(a, b)), all(not(a), not(b)));
  });
});
