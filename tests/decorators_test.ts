//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module tests/decorators_test
 *
 * Tests for the cfg decorator functionality.
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { createCfgDecorator } from "../src/decorators.ts";

// =============================================================================
// Class Decorator Tests
// =============================================================================

describe("Class Decorator", () => {
  it("should return original class when condition is true", () => {
    const decorator = createCfgDecorator(true);

    class OriginalClass {
      value = 42;

      getValue(): number {
        return this.value;
      }
    }

    const DecoratedClass = decorator(OriginalClass);

    assertEquals(DecoratedClass, OriginalClass);

    const instance = new (DecoratedClass as typeof OriginalClass)();
    assertEquals(instance.value, 42);
    assertEquals(instance.getValue(), 42);
  });

  it("should return modified class when condition is false", () => {
    const decorator = createCfgDecorator(false);

    class OriginalClass {
      value = 42;

      getValue(): number {
        return this.value;
      }
    }

    const DecoratedClass = decorator(OriginalClass);

    // Should not be the same class
    assertEquals(DecoratedClass !== OriginalClass, true);

    // Instance should exist but methods become no-ops
    const instance = new (DecoratedClass as typeof OriginalClass)();
    assertExists(instance);
  });

  it("should preserve class name when condition is false", () => {
    const decorator = createCfgDecorator(false);

    class MyNamedClass {
      doSomething(): string {
        return "something";
      }
    }

    const DecoratedClass = decorator(MyNamedClass) as typeof MyNamedClass;

    assertEquals(DecoratedClass.name, "MyNamedClass");
  });

  it("should allow instanceof checks when condition is false", () => {
    const decorator = createCfgDecorator(false);

    class BaseClass {
      method(): void {
        // Implementation
      }
    }

    const DecoratedClass = decorator(BaseClass) as typeof BaseClass;
    const instance = new DecoratedClass();

    // instanceof should still work due to prototype chain
    assertEquals(instance instanceof DecoratedClass, true);
  });
});

// =============================================================================
// Method Decorator Tests
// =============================================================================

describe("Method Decorator", () => {
  it("should preserve method when condition is true", () => {
    const decorator = createCfgDecorator(true);

    class TestClass {
      methodCalled = false;

      testMethod(): string {
        this.methodCalled = true;
        return "called";
      }
    }

    const descriptor: PropertyDescriptor = {
      value: TestClass.prototype.testMethod,
      writable: true,
      enumerable: false,
      configurable: true,
    };

    const result = decorator(TestClass.prototype, "testMethod", descriptor) as PropertyDescriptor;

    assertEquals(result.value, TestClass.prototype.testMethod);
  });

  it("should replace method with no-op when condition is false", () => {
    const decorator = createCfgDecorator(false);

    const originalMethod = function (): string {
      return "original";
    };

    const descriptor: PropertyDescriptor = {
      value: originalMethod,
      writable: true,
      enumerable: false,
      configurable: true,
    };

    const result = decorator({}, "testMethod", descriptor) as PropertyDescriptor;

    // Method should be replaced
    assertEquals(result.value !== originalMethod, true);

    // New method should return undefined (no-op)
    const returnValue = result.value();
    assertEquals(returnValue, undefined);
  });

  it("should handle methods with arguments when condition is false", () => {
    const decorator = createCfgDecorator(false);

    const originalMethod = function (a: number, b: string): string {
      return `${a}-${b}`;
    };

    const descriptor: PropertyDescriptor = {
      value: originalMethod,
      writable: true,
      enumerable: false,
      configurable: true,
    };

    const result = decorator({}, "testMethod", descriptor) as PropertyDescriptor;

    // Should not throw when called with arguments
    const returnValue = result.value(42, "test");
    assertEquals(returnValue, undefined);
  });

  it("should handle async methods", () => {
    const decorator = createCfgDecorator(true);

    const asyncMethod = async function (): Promise<string> {
      await Promise.resolve();
      return "async result";
    };

    const descriptor: PropertyDescriptor = {
      value: asyncMethod,
      writable: true,
      enumerable: false,
      configurable: true,
    };

    const result = decorator({}, "asyncMethod", descriptor) as PropertyDescriptor;

    // Should preserve async method
    assertEquals(result.value, asyncMethod);
  });
});

// =============================================================================
// Decorator Factory Tests
// =============================================================================

describe("Decorator Factory", () => {
  it("should create different decorators for different conditions", () => {
    const trueDecorator = createCfgDecorator(true);
    const falseDecorator = createCfgDecorator(false);

    class TestClass {
      value = 1;
    }

    const TrueDecoratedClass = trueDecorator(TestClass);
    const FalseDecoratedClass = falseDecorator(TestClass);

    // True decorator returns original
    assertEquals(TrueDecoratedClass, TestClass);

    // False decorator returns modified
    assertEquals(FalseDecoratedClass !== TestClass, true);
  });

  it("should be callable multiple times", () => {
    const decorator1 = createCfgDecorator(true);
    const decorator2 = createCfgDecorator(true);
    const decorator3 = createCfgDecorator(false);

    assertExists(decorator1);
    assertExists(decorator2);
    assertExists(decorator3);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe("Decorator Edge Cases", () => {
  it("should handle class with no methods", () => {
    const decorator = createCfgDecorator(false);

    class EmptyClass {}

    const DecoratedClass = decorator(EmptyClass) as typeof EmptyClass;

    assertExists(DecoratedClass);
    const instance = new DecoratedClass();
    assertExists(instance);
  });

  it("should handle class with constructor parameters when condition is true", () => {
    const decorator = createCfgDecorator(true);

    class ParameterizedClass {
      name: string;
      age: number;

      constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
      }

      greet(): string {
        return `Hello, ${this.name}`;
      }
    }

    // When condition is true, decorator returns original class unchanged
    // Cast to any to work around strict constructor type checking
    // deno-lint-ignore no-explicit-any
    const DecoratedClass = decorator(ParameterizedClass as any) as typeof ParameterizedClass;
    assertEquals(DecoratedClass, ParameterizedClass);

    const instance = new DecoratedClass("Alice", 30);

    assertEquals(instance.name, "Alice");
    assertEquals(instance.age, 30);
    assertEquals(instance.greet(), "Hello, Alice");
  });

  it("should handle descriptor without value property", () => {
    const decorator = createCfgDecorator(true);

    const descriptor: PropertyDescriptor = {
      get: () => "getter value",
      set: () => {},
      enumerable: true,
      configurable: true,
    };

    // Should not throw and should return descriptor as-is
    const result = decorator({}, "prop", descriptor);
    assertExists(result);
  });
});
