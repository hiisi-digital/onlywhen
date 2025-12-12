//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module decorators
 *
 * Decorator factory for conditional class and method execution.
 * Provides Rust-like #[cfg()] functionality for TypeScript.
 */

import type { CfgDecorator } from "./types.ts";

// =============================================================================
// Decorator Factory
// =============================================================================

/**
 * Creates a decorator that conditionally enables a class or method.
 *
 * When the condition is false:
 * - Class decorators return an empty class
 * - Method decorators replace the method with a no-op
 *
 * @param condition - The boolean condition to evaluate
 * @returns A decorator that enables/disables based on the condition
 *
 * @example
 * ```ts
 * // Class decorator - becomes empty class if condition is false
 * @createCfgDecorator(onlywhen.darwin)
 * class MacFeatures {
 *   setup() { ... }
 * }
 *
 * // Method decorator - becomes no-op if condition is false
 * class App {
 *   @createCfgDecorator(onlywhen.deno)
 *   denoMethod() { ... }
 * }
 * ```
 */
export function createCfgDecorator(condition: boolean): CfgDecorator {
  // deno-lint-ignore no-explicit-any
  return function decorator(target: any, propertyKey?: string | symbol, descriptor?: any): any {
    // Determine if this is a class decorator or method decorator
    if (propertyKey === undefined && descriptor === undefined) {
      // Class decorator
      return handleClassDecorator(condition, target);
    } else if (descriptor !== undefined) {
      // Method decorator
      return handleMethodDecorator(condition, descriptor);
    }

    // Fallback: return as-is
    return target;
  };
}

// =============================================================================
// Class Decorator Handler
// =============================================================================

/**
 * Handles class decoration.
 * If the condition is false, returns an empty class.
 */
function handleClassDecorator<T extends new (...args: unknown[]) => unknown>(
  condition: boolean,
  target: T,
): T {
  if (condition) {
    // Condition is true: return the original class
    return target;
  }

  // Condition is false: return an empty class that maintains the prototype chain
  // This allows instanceof checks to still work, but the class is effectively inert
  const EmptyClass = class extends (target as new (...args: unknown[]) => object) {
    constructor(..._args: unknown[]) {
      // Call parent with no-op behavior
      super();
      // Override all own properties to be no-ops
      const propertyNames = Object.getOwnPropertyNames(target.prototype);
      for (const name of propertyNames) {
        if (name !== "constructor") {
          // deno-lint-ignore no-explicit-any
          (this as any)[name] = function (): void {
            // No-op
          };
        }
      }
    }
  };

  // Copy static properties
  Object.setPrototypeOf(EmptyClass, Object.getPrototypeOf(target));

  // Preserve the class name for debugging
  Object.defineProperty(EmptyClass, "name", {
    value: target.name,
    writable: false,
  });

  return EmptyClass as T;
}

// =============================================================================
// Method Decorator Handler
// =============================================================================

/**
 * Handles method decoration.
 * If the condition is false, replaces the method with a no-op.
 */
function handleMethodDecorator<T>(
  condition: boolean,
  descriptor: TypedPropertyDescriptor<T>,
): TypedPropertyDescriptor<T> {
  if (condition) {
    // Condition is true: return the original descriptor
    return descriptor;
  }

  // Condition is false: replace the method with a no-op
  const originalMethod = descriptor.value;

  if (typeof originalMethod === "function") {
    // deno-lint-ignore no-explicit-any
    descriptor.value = function (this: unknown, ..._args: unknown[]): any {
      // No-op: return undefined
      return undefined;
    } as T;
  }

  return descriptor;
}
