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

import { normaliseArchitecture, normalisePlatform } from "@hiisi/tgts";
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

/**
 * What this package is allowed to assume about the world.
 *
 * Detection is the whole of this package now, so this is its only boundary,
 * and it was the one place with no types at all: `globalThis as any`, with
 * every exported boolean flowing out of it. Naming the shape costs nothing and
 * means a typo in a probe below is a compile error rather than a `false` that
 * looks like a runtime simply not being present.
 *
 * Everything is optional because the entire point is that none of it is there.
 */
interface Ambient {
  readonly Deno?: {
    readonly version?: unknown;
    readonly build?: { readonly arch?: string; readonly os?: string };
  };
  readonly process?: {
    readonly arch?: string;
    readonly platform?: string;
    readonly versions?: { readonly node?: string; readonly bun?: string };
  };
  readonly window?: unknown;
  readonly navigator?: unknown;
}

// read once, because a property access on the global object is not free
const g = globalThis as unknown as Ambient;
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
 * Read one fact about the host, whichever runtime is asking.
 *
 * Deno keeps these under `Deno.build`, node and bun under `process`, and each
 * spells them differently. Both detectors did the same three steps around the
 * same two accessors, so the runtime branch existed twice and a runtime added
 * to one would have been missing from the other.
 */
function detect<T extends string>(
  fromDeno: () => string | undefined,
  fromProcess: () => string | undefined,
  normalise: (raw: string) => T | undefined,
): T | "unknown" {
  const raw = isDeno ? fromDeno() : (isNode || isBun) ? fromProcess() : undefined;
  if (raw === undefined) return "unknown";
  return normalise(raw) ?? "unknown";
}

/**
 * The detected platform, and the detected architecture.
 *
 * One statement rather than two functions. Each was a name wrapped around a
 * single call to `detect`, which is the shape sharing leaves behind: the
 * wrappers had nothing in them but the three arguments, and two wrappers
 * differing only in their arguments are one call site written twice.
 */
const detected = {
  platform: detect(
    () => globalDeno?.build?.os,
    () => globalProcess?.platform,
    normalisePlatform,
  ),
  arch: detect(
    () => globalDeno?.build?.arch,
    () => globalProcess?.arch,
    normaliseArchitecture,
  ),
} as const;

/**
 * The detected platform name as a string.
 * Use `platform.darwin`, `platform.linux`, etc. for boolean checks.
 */
export const platformName: Platform = detected.platform;

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
 * The detected CPU architecture name as a string.
 * Use `arch.x64`, `arch.arm64`, etc. for boolean checks.
 */
export const archName: Architecture = detected.arch;

/**
 * True when running on x86_64 architecture.
 */
export const isX64: boolean = archName === "x64";

/**
 * True when running on aarch64 / ARM64 / Apple Silicon.
 */
export const isArm64: boolean = archName === "arm64";

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
