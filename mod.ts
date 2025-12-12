//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module onlywhen
 *
 * Conditional code based on platform, runtime, or feature flags.
 *
 * `onlywhen` picks up on platform, runtime, and architecture. You can combine them,
 * branch on them, or use them as decorators. Simple enough that tooling can inline
 * them (static analysis pass in the works).
 *
 * @example Boolean checks
 * ```ts
 * import { onlywhen } from "@hiisi/onlywhen";
 *
 * if (onlywhen.darwin) {
 *   macSpecificCode();
 * }
 * ```
 *
 * @example Short-circuit
 * ```ts
 * onlywhen.deno && denoCode();
 * ```
 *
 * @example Combinators
 * ```ts
 * if (onlywhen.all(onlywhen.node, onlywhen.linux)) {
 *   nodeOnLinuxCode();
 * }
 * ```
 *
 * @example Decorators
 * ```ts
 * @onlywhen(onlywhen.darwin)
 * class MacOnly {}
 * ```
 */

// =============================================================================
// Main Export
// =============================================================================

export { onlywhen } from "./src/cfg.ts";

// =============================================================================
// Detection
// =============================================================================

export {
  arch,
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
} from "./src/detection.ts";

// =============================================================================
// Combinators
// =============================================================================

export { all, any, not } from "./src/combinators.ts";

// =============================================================================
// Features
// =============================================================================

export {
  disableFeature,
  enabledFeatures,
  enableFeature,
  feature,
  getAllFeatures,
  hasFeature,
} from "./src/features.ts";

// =============================================================================
// Decorators
// =============================================================================

export { createCfgDecorator } from "./src/decorators.ts";

// =============================================================================
// Match
// =============================================================================

export { match, matchAsync } from "./src/match.ts";

// =============================================================================
// Types
// =============================================================================

export type {
  Architecture,
  AsyncMatchHandlers,
  Cfg,
  CfgDecorator,
  ClassDecorator,
  FeatureConfig,
  MatchHandlers,
  MethodDecorator,
  Platform,
  RuntimeName,
} from "./src/types.ts";
