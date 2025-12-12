//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module cfg
 *
 * The main onlywhen object that combines detection, combinators,
 * features, and decorator functionality into a single API.
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
// Main onlywhen Object
// =============================================================================

/**
 * Creates the main onlywhen object that is both callable (as a decorator)
 * and has properties for detection and combinators.
 */
function createOnlywhen(): Cfg {
  // The base function that creates decorators
  const decoratorFactory = (condition: boolean) => createCfgDecorator(condition);

  // Assign all properties to the function
  const onlywhen = Object.assign(decoratorFactory, {
    // Platform detection
    darwin: isDarwin,
    linux: isLinux,
    windows: isWindows,

    // Runtime detection
    deno: isDeno,
    node: isNode,
    bun: isBun,
    browser: isBrowser,

    // Architecture detection
    x64: isX64,
    arm64: isArm64,

    // Combinators
    all,
    any,
    not,

    // Features
    feature: hasFeature,
    get features(): ReadonlySet<string> {
      return getAllFeatures();
    },
  });

  // Freeze to prevent modification
  return Object.freeze(onlywhen) as Cfg;
}

/**
 * The main onlywhen object.
 *
 * Use it for:
 * - Boolean checks: `if (onlywhen.darwin) { ... }`
 * - Short-circuit: `onlywhen.deno && denoCode()`
 * - Combinators: `onlywhen.all(onlywhen.node, onlywhen.linux)`
 * - Decorators: `@onlywhen(onlywhen.darwin)`
 * - Features: `onlywhen.feature("experimental")`
 */
export const onlywhen: Cfg = createOnlywhen();
