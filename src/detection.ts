//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module detection
 *
 * Runtime, platform, and architecture detection utilities.
 *
 * All detection is performed once at module load time and cached.
 * The values are immutable after initialization.
 */

import type {
  Architecture,
  ArchNamespace,
  Platform,
  PlatformNamespace,
  RuntimeName,
  RuntimeNamespace,
} from "./types.ts";

// =============================================================================
// Global References
// =============================================================================

// Cache global references once to avoid repeated property access
// deno-lint-ignore no-explicit-any
const g = globalThis as any;
const globalDeno = g.Deno;
const globalProcess = g.process;
const globalWindow = g.window;
const globalNavigator = g.navigator;

// =============================================================================
// Runtime Detection (evaluated once)
// =============================================================================

/**
 * Whether the current runtime is Deno.
 */
export const isDeno: boolean = globalDeno !== undefined && globalDeno.version !== undefined;

/**
 * Whether the current runtime is Bun.
 * Checked before Node since Bun also sets process.versions.node.
 */
export const isBun: boolean = globalProcess !== undefined &&
  globalProcess.versions?.bun !== undefined;

/**
 * Whether the current runtime is Node.js.
 * Excludes Bun and Deno (Deno 2+ provides process for Node compatibility).
 */
export const isNode: boolean = globalProcess !== undefined &&
  globalProcess.versions?.node !== undefined &&
  !isBun &&
  !isDeno;

/**
 * Whether the current runtime is a browser.
 * Excludes server-side runtimes that may have window/navigator.
 */
export const isBrowser: boolean = globalWindow !== undefined &&
  globalNavigator !== undefined &&
  !isDeno &&
  !isNode &&
  !isBun;

// =============================================================================
// Runtime Name (cached)
// =============================================================================

/**
 * The detected runtime name, computed once.
 */
const detectedRuntimeName: RuntimeName = isDeno
  ? "deno"
  : isBun
  ? "bun"
  : isNode
  ? "node"
  : isBrowser
  ? "browser"
  : "unknown";

/**
 * Gets the current runtime name.
 *
 * @returns The runtime identifier
 */
export function getRuntimeName(): RuntimeName {
  return detectedRuntimeName;
}

// =============================================================================
// Platform Detection (evaluated once)
// =============================================================================

/**
 * Detects the current operating system.
 */
function detectPlatform(): Platform {
  // Deno
  if (isDeno) {
    const os = globalDeno.build?.os;
    if (os === "darwin") return "darwin";
    if (os === "linux") return "linux";
    if (os === "windows") return "windows";
    return "unknown";
  }

  // Node.js or Bun
  if (isNode || isBun) {
    const p = globalProcess.platform;
    if (p === "darwin") return "darwin";
    if (p === "linux") return "linux";
    if (p === "win32") return "windows";
    return "unknown";
  }

  // Browser
  if (isBrowser && globalNavigator?.platform) {
    const p = globalNavigator.platform.toLowerCase();
    if (p.includes("mac")) return "darwin";
    if (p.includes("linux")) return "linux";
    if (p.includes("win")) return "windows";
  }

  return "unknown";
}

/**
 * The detected platform name as a string.
 * Use `platform.darwin`, `platform.linux`, etc. for boolean checks.
 */
export const platformName: Platform = detectPlatform();

/**
 * True when running on macOS.
 */
export const isDarwin: boolean = platformName === "darwin";

/**
 * True when running on Linux.
 */
export const isLinux: boolean = platformName === "linux";

/**
 * True when running on Windows.
 */
export const isWindows: boolean = platformName === "windows";

// =============================================================================
// Architecture Detection (evaluated once)
// =============================================================================

/**
 * Detects the current CPU architecture.
 */
function detectArch(): Architecture {
  // Deno
  if (isDeno) {
    const a = globalDeno.build?.arch;
    if (a === "x86_64") return "x86_64";
    if (a === "aarch64") return "aarch64";
    return "unknown";
  }

  // Node.js or Bun
  if (isNode || isBun) {
    const a = globalProcess.arch;
    if (a === "x64") return "x86_64";
    if (a === "arm64") return "aarch64";
    if (a === "arm") return "arm";
    if (a === "ia32" || a === "x86") return "x86";
    return "unknown";
  }

  return "unknown";
}

/**
 * The detected CPU architecture name as a string.
 * Use `arch.x64`, `arch.arm64`, etc. for boolean checks.
 */
export const archName: Architecture = detectArch();

/**
 * True when running on x86_64 architecture.
 */
export const isX64: boolean = archName === "x86_64";

/**
 * True when running on aarch64 / ARM64 / Apple Silicon.
 */
export const isArm64: boolean = archName === "aarch64";

// =============================================================================
// Namespace Objects (for ergonomic imports)
// =============================================================================

/**
 * Platform detection namespace.
 *
 * Provides a cleaner import style for platform checks (Rust-like):
 *
 * @example
 * ```ts
 * import { onlywhen, platform, arch, all } from "@hiisi/onlywhen";
 *
 * @onlywhen(all(platform.linux, arch.x64))
 * class LinuxX64Only {}
 *
 * if (platform.darwin) {
 *   macSpecificCode();
 * }
 * ```
 */
export const platform: PlatformNamespace = Object.freeze({
  /** `true` when running on macOS */
  darwin: isDarwin,
  /** `true` when running on Linux */
  linux: isLinux,
  /** `true` when running on Windows */
  windows: isWindows,
});

/**
 * Runtime detection namespace.
 *
 * Provides a cleaner import style for runtime checks (Rust-like):
 *
 * @example
 * ```ts
 * import { onlywhen, runtime, all } from "@hiisi/onlywhen";
 *
 * @onlywhen(runtime.deno)
 * class DenoOnly {}
 *
 * if (runtime.node) {
 *   nodeSpecificCode();
 * }
 * ```
 */
export const runtime: RuntimeNamespace = Object.freeze({
  /** `true` when running in Deno */
  deno: isDeno,
  /** `true` when running in Node.js */
  node: isNode,
  /** `true` when running in Bun */
  bun: isBun,
  /** `true` when running in a browser */
  browser: isBrowser,
});

/**
 * Architecture detection namespace.
 *
 * Provides a cleaner import style for architecture checks (Rust-like):
 *
 * @example
 * ```ts
 * import { onlywhen, arch, platform, all } from "@hiisi/onlywhen";
 *
 * @onlywhen(all(platform.linux, arch.arm64))
 * class LinuxArm64Only {}
 *
 * if (arch.x64) {
 *   x64SpecificCode();
 * }
 * ```
 */
export const arch: ArchNamespace = Object.freeze({
  /** `true` when running on x86_64 (AMD64) architecture */
  x64: isX64,
  /** `true` when running on aarch64 (ARM64 / Apple Silicon) architecture */
  arm64: isArm64,
});
