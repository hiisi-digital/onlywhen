//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module tests/detection_test
 *
 * Tests for runtime, platform, and architecture detection.
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  arch,
  archName,
  getRuntimeName,
  isArm64,
  isBrowser,
  isBun,
  isDarwin,
  isDeno,
  isLinux,
  isNode,
  isWindows,
  isX64,
  platform,
  platformName,
  runtime,
} from "../src/detection.ts";

// =============================================================================
// Runtime Detection Tests
// =============================================================================

describe("Runtime Detection", () => {
  it("should detect exactly one runtime as true", () => {
    const runtimes = [isDeno, isNode, isBun, isBrowser];
    const trueCount = runtimes.filter((r) => r).length;

    // In Deno test environment, exactly one should be true
    // (unless in an unknown environment where all could be false)
    assertEquals(trueCount <= 1, true, "At most one runtime should be detected");
  });

  it("should detect Deno in Deno environment", () => {
    // We're running in Deno, so isDeno should be true
    assertEquals(isDeno, true);
    assertEquals(isNode, false);
    assertEquals(isBun, false);
    assertEquals(isBrowser, false);
  });

  it("should return correct runtime name", () => {
    const name = getRuntimeName();
    assertEquals(name, "deno");
  });
});

// =============================================================================
// Platform Detection Tests
// =============================================================================

describe("Platform Detection", () => {
  it("should detect exactly one platform as true (or unknown)", () => {
    const platforms = [isDarwin, isLinux, isWindows];
    const trueCount = platforms.filter((p) => p).length;

    assertEquals(trueCount <= 1, true, "At most one platform should be detected");
  });

  it("should have a valid platformName value", () => {
    const validPlatforms = ["darwin", "linux", "windows", "unknown"];
    assertEquals(validPlatforms.includes(platformName), true);
  });

  it("platform booleans should match platformName string", () => {
    if (platformName === "darwin") {
      assertEquals(isDarwin, true);
      assertEquals(isLinux, false);
      assertEquals(isWindows, false);
    } else if (platformName === "linux") {
      assertEquals(isDarwin, false);
      assertEquals(isLinux, true);
      assertEquals(isWindows, false);
    } else if (platformName === "windows") {
      assertEquals(isDarwin, false);
      assertEquals(isLinux, false);
      assertEquals(isWindows, true);
    }
  });
});

// =============================================================================
// Architecture Detection Tests
// =============================================================================

describe("Architecture Detection", () => {
  it("should detect at most one architecture as true", () => {
    const architectures = [isX64, isArm64];
    const trueCount = architectures.filter((a) => a).length;

    assertEquals(trueCount <= 1, true, "At most one architecture should be detected");
  });

  it("should have a valid archName value", () => {
    const validArchs = ["x86_64", "aarch64", "arm", "x86", "unknown"];
    assertEquals(validArchs.includes(archName), true);
  });

  it("arch booleans should match archName string", () => {
    if (archName === "x86_64") {
      assertEquals(isX64, true);
      assertEquals(isArm64, false);
    } else if (archName === "aarch64") {
      assertEquals(isX64, false);
      assertEquals(isArm64, true);
    }
  });
});

// =============================================================================
// Export Existence Tests
// =============================================================================

describe("Detection Exports", () => {
  it("should export all runtime detection booleans", () => {
    assertExists(isDeno);
    assertExists(isNode);
    assertExists(isBun);
    assertExists(isBrowser);
  });

  it("should export all platform detection values", () => {
    assertExists(platformName);
    assertExists(isDarwin);
    assertExists(isLinux);
    assertExists(isWindows);
  });

  it("should export all architecture detection values", () => {
    assertExists(archName);
    assertExists(isX64);
    assertExists(isArm64);
  });

  it("should export getRuntimeName function", () => {
    assertExists(getRuntimeName);
    assertEquals(typeof getRuntimeName, "function");
  });
});

// =============================================================================
// Namespace Object Tests
// =============================================================================

describe("Platform Namespace", () => {
  it("should have all platform booleans", () => {
    assertExists(platform.darwin);
    assertExists(platform.linux);
    assertExists(platform.windows);
  });

  it("should match individual exports", () => {
    assertEquals(platform.darwin, isDarwin);
    assertEquals(platform.linux, isLinux);
    assertEquals(platform.windows, isWindows);
  });

  it("should be frozen", () => {
    assertEquals(Object.isFrozen(platform), true);
  });
});

describe("Runtime Namespace", () => {
  it("should have all runtime booleans", () => {
    assertExists(runtime.deno);
    assertExists(runtime.node);
    assertExists(runtime.bun);
    assertExists(runtime.browser);
  });

  it("should match individual exports", () => {
    assertEquals(runtime.deno, isDeno);
    assertEquals(runtime.node, isNode);
    assertEquals(runtime.bun, isBun);
    assertEquals(runtime.browser, isBrowser);
  });

  it("should be frozen", () => {
    assertEquals(Object.isFrozen(runtime), true);
  });
});

describe("Architecture Namespace", () => {
  it("should have all architecture booleans", () => {
    assertExists(arch.x64);
    assertExists(arch.arm64);
  });

  it("should match individual exports", () => {
    assertEquals(arch.x64, isX64);
    assertEquals(arch.arm64, isArm64);
  });

  it("should be frozen", () => {
    assertEquals(Object.isFrozen(arch), true);
  });
});
