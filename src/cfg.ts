//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module cfg
 *
 * The main `onlywhen` object.
 *
 * Combines detection, combinators, features, and decorator functionality
 * into a single, ergonomic API.
 */

import { all, any, not } from "./combinators.ts";
import { createCfgDecorator } from "./decorators.ts";
import {
  isArm64,
  isBrowser,
  isBun,
  isDarwin,
  isDeno,
  isLinux,
  isNode,
  isWindows,
  isX64,
} from "./detection.ts";
import { getAllFeatures, hasFeature } from "./features.ts";
import type { Cfg } from "./types.ts";

// =============================================================================
// onlywhen Factory
// =============================================================================

/**
 * Creates the main `onlywhen` object.
 *
 * The object is callable (returns a decorator) and has boolean properties
 * for platform/runtime/architecture detection.
 */
function createOnlywhen(): Cfg {
  // The decorator factory function
  const decoratorFactory = (condition: boolean) => createCfgDecorator(condition);

  // Build the object with all properties
  const cfg = Object.assign(decoratorFactory, {
    // Platform detection (cached booleans)
    darwin: isDarwin,
    linux: isLinux,
    windows: isWindows,

    // Runtime detection (cached booleans)
    deno: isDeno,
    node: isNode,
    bun: isBun,
    browser: isBrowser,

    // Architecture detection (cached booleans)
    x64: isX64,
    arm64: isArm64,

    // Combinators (function references)
    all,
    any,
    not,

    // Feature flag access
    feature: hasFeature,

    // Getter for features set
    get features(): ReadonlySet<string> {
      return getAllFeatures();
    },
  });

  // Freeze to prevent modification and enable potential V8 optimizations
  return Object.freeze(cfg) as Cfg;
}

// =============================================================================
// Export
// =============================================================================

/**
 * The main `onlywhen` object.
 *
 * @example Boolean checks
 * ```ts
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
 *
 * @example Feature flags
 * ```ts
 * if (onlywhen.feature("experimental")) {
 *   experimentalCode();
 * }
 * ```
 */
export const onlywhen: Cfg = createOnlywhen();
