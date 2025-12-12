//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module detection
 *
 * Runtime, platform, and architecture detection utilities.
 * This module provides the core detection logic used by onlywhen.
 */

import type { Architecture, Platform, RuntimeName } from "./types.ts";

// =============================================================================
// Global References (avoiding typeof reference errors)
// =============================================================================

// deno-lint-ignore no-explicit-any
const globalDeno = (globalThis as any).Deno;
// deno-lint-ignore no-explicit-any
const globalProcess = (globalThis as any).process;
// deno-lint-ignore no-explicit-any
const globalWindow = (globalThis as any).window;
// deno-lint-ignore no-explicit-any
const globalNavigator = (globalThis as any).navigator;

// =============================================================================
// Runtime Detection
// =============================================================================

/**
 * Whether the current runtime is Deno.
 */
export const isDeno: boolean = typeof globalDeno !== "undefined" &&
  typeof globalDeno.version !== "undefined";

/**
 * Whether the current runtime is Bun.
 * Note: Bun also sets process.versions.node, so we check for Bun first.
 */
export const isBun: boolean = typeof globalProcess !== "undefined" &&
  typeof globalProcess.versions?.bun !== "undefined";

/**
 * Whether the current runtime is Node.js (but not Bun).
 */
export const isNode: boolean = typeof globalProcess !== "undefined" &&
  typeof globalProcess.versions?.node !== "undefined" &&
  !isBun;

/**
 * Whether the current runtime is a browser.
 */
export const isBrowser: boolean = typeof globalWindow !== "undefined" &&
  typeof globalNavigator !== "undefined" &&
  !isDeno &&
  !isNode &&
  !isBun;

/**
 * Gets the current runtime name.
 */
export function getRuntimeName(): RuntimeName {
  if (isDeno) return "deno";
  if (isBun) return "bun";
  if (isNode) return "node";
  if (isBrowser) return "browser";
  return "unknown";
}

// =============================================================================
// Platform Detection
// =============================================================================

/**
 * Detects the current operating system / platform.
 */
function detectPlatform(): Platform {
  if (isDeno) {
    const os = globalDeno.build?.os;
    if (os === "darwin") return "darwin";
    if (os === "linux") return "linux";
    if (os === "windows") return "windows";
    return "unknown";
  }

  if (isNode || isBun) {
    const platform = globalProcess.platform;
    if (platform === "darwin") return "darwin";
    if (platform === "linux") return "linux";
    if (platform === "win32") return "windows";
    return "unknown";
  }

  if (isBrowser && globalNavigator?.platform) {
    const platform = globalNavigator.platform.toLowerCase();
    if (platform.includes("mac")) return "darwin";
    if (platform.includes("linux")) return "linux";
    if (platform.includes("win")) return "windows";
  }

  return "unknown";
}

/**
 * Detects the current CPU architecture.
 */
function detectArch(): Architecture {
  if (isDeno) {
    const arch = globalDeno.build?.arch;
    if (arch === "x86_64") return "x86_64";
    if (arch === "aarch64") return "aarch64";
    return "unknown";
  }

  if (isNode || isBun) {
    const arch = globalProcess.arch;
    if (arch === "x64") return "x86_64";
    if (arch === "arm64") return "aarch64";
    if (arch === "arm") return "arm";
    if (arch === "ia32" || arch === "x86") return "x86";
    return "unknown";
  }

  return "unknown";
}

// =============================================================================
// Detected Values (evaluated once at module load)
// =============================================================================

/**
 * The detected platform.
 */
export const platform: Platform = detectPlatform();

/**
 * The detected architecture.
 */
export const arch: Architecture = detectArch();

// =============================================================================
// Platform Booleans
// =============================================================================

/**
 * True when running on macOS.
 */
export const isDarwin: boolean = platform === "darwin";

/**
 * True when running on Linux.
 */
export const isLinux: boolean = platform === "linux";

/**
 * True when running on Windows.
 */
export const isWindows: boolean = platform === "windows";

// =============================================================================
// Architecture Booleans
// =============================================================================

/**
 * True when running on x86_64 architecture.
 */
export const isX64: boolean = arch === "x86_64";

/**
 * True when running on aarch64 / ARM64 / Apple Silicon.
 */
export const isArm64: boolean = arch === "aarch64";
