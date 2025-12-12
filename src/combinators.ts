//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module combinators
 *
 * Logical combinators for combining conditions.
 * These mirror Rust's cfg combinators: all(), any(), not().
 *
 * Optimized with fast paths for common cases (0-3 conditions).
 */

// =============================================================================
// Combinators
// =============================================================================

/**
 * Returns true if all conditions are true.
 * Equivalent to Rust's `#[cfg(all(...))]`.
 *
 * Optimized for common cases of 0-3 conditions.
 *
 * @param conditions - Variable number of boolean conditions
 * @returns True if all conditions are true, false otherwise
 *
 * @example
 * ```ts
 * if (all(onlywhen.darwin, onlywhen.arm64)) {
 *   // Apple Silicon Mac only
 * }
 * ```
 */
export function all(...conditions: boolean[]): boolean {
  const len = conditions.length;

  // Fast paths for common cases
  switch (len) {
    case 0:
      return true;
    case 1:
      return conditions[0];
    case 2:
      return conditions[0] && conditions[1];
    case 3:
      return conditions[0] && conditions[1] && conditions[2];
    default:
      // General case: use loop (avoids iterator overhead of .every())
      for (let i = 0; i < len; i++) {
        if (!conditions[i]) return false;
      }
      return true;
  }
}

/**
 * Returns true if any condition is true.
 * Equivalent to Rust's `#[cfg(any(...))]`.
 *
 * Optimized for common cases of 0-3 conditions.
 *
 * @param conditions - Variable number of boolean conditions
 * @returns True if at least one condition is true, false otherwise
 *
 * @example
 * ```ts
 * if (any(onlywhen.node, onlywhen.bun)) {
 *   // Node.js or Bun
 * }
 * ```
 */
export function any(...conditions: boolean[]): boolean {
  const len = conditions.length;

  // Fast paths for common cases
  switch (len) {
    case 0:
      return false;
    case 1:
      return conditions[0];
    case 2:
      return conditions[0] || conditions[1];
    case 3:
      return conditions[0] || conditions[1] || conditions[2];
    default:
      // General case: use loop (avoids iterator overhead of .some())
      for (let i = 0; i < len; i++) {
        if (conditions[i]) return true;
      }
      return false;
  }
}

/**
 * Negates a condition.
 * Equivalent to Rust's `#[cfg(not(...))]`.
 *
 * @param condition - The condition to negate
 * @returns The negated condition
 *
 * @example
 * ```ts
 * if (not(onlywhen.windows)) {
 *   // Not Windows (i.e., POSIX-like)
 * }
 * ```
 */
export function not(condition: boolean): boolean {
  return !condition;
}
