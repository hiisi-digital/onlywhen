/**
 * The decorator applied as a decorator.
 *
 * Everything else calls `createCfgDecorator(cond)` and then invokes the result as an
 * ordinary function, which exercises what it does and never what it is. `@onlywhen(...)`
 * on a class or a method is what the readme shows and what a consumer writes, and until
 * this file nothing in the repository did it, so the decorator's type as a decorator was
 * checked by nothing.
 *
 * @module
 */

import { assertEquals } from "@std/assert";
import { all, arch, onlywhen, platform, runtime } from "../mod.ts";

@onlywhen(true)
class Kept {
  value(): string {
    return "kept";
  }
}

@onlywhen(false)
class Emptied {
  value(): string {
    return "should not run";
  }
}

class Methods {
  @onlywhen(true)
  kept(): string {
    return "kept";
  }

  @onlywhen(false)
  removed(): string {
    return "should not run";
  }

  @onlywhen(all(platform.linux, arch.x64))
  composed(): string {
    return "composed";
  }

  @onlywhen(runtime.deno)
  onDeno(): string {
    return "deno";
  }
}

Deno.test("the decorator applies to a class", () => {
  assertEquals(new Kept().value(), "kept");
});

Deno.test("a class under a false condition is inert", () => {
  // The class still exists and can be constructed; its members do nothing.
  const inert = new Emptied();
  assertEquals(inert.value(), undefined as unknown as string);
});

Deno.test("the decorator applies to a method", () => {
  assertEquals(new Methods().kept(), "kept");
});

Deno.test("a method under a false condition becomes a no-op", () => {
  assertEquals(new Methods().removed(), undefined as unknown as string);
});

Deno.test("a composed condition is accepted where a plain one is", () => {
  // What matters here is that it type-checks and applies. Whether the condition holds
  // depends on the machine, so the result is not asserted.
  const value = new Methods().composed();
  assertEquals(typeof value === "string" || value === undefined, true);
});

Deno.test("a runtime condition is accepted too", () => {
  assertEquals(new Methods().onDeno(), "deno");
});
