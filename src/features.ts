//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module features
 *
 * Feature flag management.
 *
 * Features are loaded from `deno.json` or `package.json` at startup,
 * and can be enabled/disabled at runtime for testing or dynamic configuration.
 */

import { isBun, isDeno, isNode } from "./detection.ts";

// =============================================================================
// Feature Set
// =============================================================================

/**
 * The set of currently enabled features.
 * Starts with features loaded from config, can be modified at runtime.
 */
const features: Set<string> = new Set<string>();

// =============================================================================
// Config Loading
// =============================================================================

/**
 * Attempts to read and parse a JSON config file.
 * Returns the features array if found, empty array otherwise.
 */
function loadFeaturesFromConfig(path: string): string[] {
  try {
    if (isDeno) {
      // deno-lint-ignore no-explicit-any
      const Deno = (globalThis as any).Deno;
      const text = Deno.readTextFileSync(path);
      const config = JSON.parse(text);
      return Array.isArray(config?.features) ? config.features : [];
    }

    if (isNode || isBun) {
      // deno-lint-ignore no-explicit-any
      const g = globalThis as any;
      const require = g.require;

      if (typeof require === "function") {
        const fs = require("fs");
        const pathModule = require("path");
        const fullPath = pathModule.resolve(g.process.cwd(), path);

        if (fs.existsSync(fullPath)) {
          const text = fs.readFileSync(fullPath, "utf-8");
          const config = JSON.parse(text);
          return Array.isArray(config?.features) ? config.features : [];
        }
      }
    }
  } catch {
    // File doesn't exist or couldn't be parsed - not an error
  }

  return [];
}

/**
 * Initialize features from config files.
 * Tries deno.json first, then package.json.
 */
function initializeFeatures(): void {
  // Try deno.json first
  const denoFeatures = loadFeaturesFromConfig("deno.json");
  if (denoFeatures.length > 0) {
    for (let i = 0; i < denoFeatures.length; i++) {
      features.add(denoFeatures[i]);
    }
    return;
  }

  // Fall back to package.json
  const packageFeatures = loadFeaturesFromConfig("package.json");
  for (let i = 0; i < packageFeatures.length; i++) {
    features.add(packageFeatures[i]);
  }
}

// Initialize on module load
initializeFeatures();

// =============================================================================
// Public API
// =============================================================================

/**
 * Checks if a feature is enabled.
 *
 * @param name - The feature name to check
 * @returns True if the feature is enabled
 *
 * @example
 * ```ts
 * if (hasFeature("experimental")) {
 *   experimentalCode();
 * }
 * ```
 */
export function hasFeature(name: string): boolean {
  return features.has(name);
}

/**
 * Alias for `hasFeature`. Checks if a feature is enabled.
 *
 * @param name - The feature name to check
 * @returns True if the feature is enabled
 */
export function feature(name: string): boolean {
  return features.has(name);
}

/**
 * Enables a feature at runtime.
 *
 * @param name - The feature name to enable
 *
 * @example
 * ```ts
 * enableFeature("debug");
 * ```
 */
export function enableFeature(name: string): void {
  features.add(name);
}

/**
 * Disables a feature at runtime.
 *
 * @param name - The feature name to disable
 *
 * @example
 * ```ts
 * disableFeature("legacy");
 * ```
 */
export function disableFeature(name: string): void {
  features.delete(name);
}

/**
 * Gets the set of all enabled features.
 * Returns the internal set directly for efficiency.
 *
 * @returns ReadonlySet of enabled feature names
 */
export function getAllFeatures(): ReadonlySet<string> {
  return features;
}

/**
 * The set of enabled features from initial config load.
 * Alias for `getAllFeatures()` for backward compatibility.
 *
 * @deprecated Use `getAllFeatures()` instead
 */
export const enabledFeatures: ReadonlySet<string> = features;
