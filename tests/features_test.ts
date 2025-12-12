//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module tests/features_test
 *
 * Tests for feature flag functionality.
 */

import { assertEquals, assertExists } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import {
  disableFeature,
  enabledFeatures,
  enableFeature,
  feature,
  getAllFeatures,
  hasFeature,
} from "../src/features.ts";

// =============================================================================
// Feature Detection Tests
// =============================================================================

describe("Feature Detection", () => {
  it("should export enabledFeatures as a Set", () => {
    assertExists(enabledFeatures);
    assertEquals(enabledFeatures instanceof Set, true);
  });

  it("should return false for non-existent features", () => {
    assertEquals(feature("nonexistent_feature_12345"), false);
    assertEquals(hasFeature("another_nonexistent_feature"), false);
  });

  it("feature() and hasFeature() should be functions", () => {
    assertEquals(typeof feature, "function");
    assertEquals(typeof hasFeature, "function");
  });

  it("getAllFeatures() should return a Set", () => {
    const features = getAllFeatures();
    assertExists(features);
    assertEquals(features instanceof Set, true);
  });
});

// =============================================================================
// Dynamic Feature Management Tests
// =============================================================================

describe("Dynamic Feature Management", () => {
  const testFeature = "__test_feature__";

  beforeEach(() => {
    // Ensure the test feature is not present before each test
    disableFeature(testFeature);
  });

  afterEach(() => {
    // Clean up after each test
    disableFeature(testFeature);
  });

  it("should enable a feature dynamically", () => {
    assertEquals(hasFeature(testFeature), false);

    enableFeature(testFeature);

    assertEquals(hasFeature(testFeature), true);
  });

  it("should disable a feature dynamically", () => {
    enableFeature(testFeature);
    assertEquals(hasFeature(testFeature), true);

    disableFeature(testFeature);

    assertEquals(hasFeature(testFeature), false);
  });

  it("should reflect dynamic changes in getAllFeatures()", () => {
    assertEquals(getAllFeatures().has(testFeature), false);

    enableFeature(testFeature);

    assertEquals(getAllFeatures().has(testFeature), true);

    disableFeature(testFeature);

    assertEquals(getAllFeatures().has(testFeature), false);
  });

  it("should handle enabling the same feature multiple times", () => {
    enableFeature(testFeature);
    enableFeature(testFeature);
    enableFeature(testFeature);

    assertEquals(hasFeature(testFeature), true);

    // Count should still be 1 (Set behavior)
    const count = [...getAllFeatures()].filter((f) => f === testFeature).length;
    assertEquals(count, 1);
  });

  it("should handle disabling non-existent features gracefully", () => {
    // Should not throw
    disableFeature("never_existed_feature");
    assertEquals(hasFeature("never_existed_feature"), false);
  });
});

// =============================================================================
// Feature Integration Tests
// =============================================================================

describe("Feature Integration", () => {
  const featureA = "__feature_a__";
  const featureB = "__feature_b__";

  afterEach(() => {
    disableFeature(featureA);
    disableFeature(featureB);
  });

  it("should support multiple features simultaneously", () => {
    enableFeature(featureA);
    enableFeature(featureB);

    assertEquals(hasFeature(featureA), true);
    assertEquals(hasFeature(featureB), true);

    disableFeature(featureA);

    assertEquals(hasFeature(featureA), false);
    assertEquals(hasFeature(featureB), true);
  });

  it("should work with feature names containing special characters", () => {
    const specialFeature = "__test-feature.with_special:chars__";

    enableFeature(specialFeature);
    assertEquals(hasFeature(specialFeature), true);

    disableFeature(specialFeature);
    assertEquals(hasFeature(specialFeature), false);
  });

  it("should work with empty string feature name", () => {
    enableFeature("");
    assertEquals(hasFeature(""), true);

    disableFeature("");
    assertEquals(hasFeature(""), false);
  });
});
