//----------------------------------------------------------------------------------------------------
// Copyright (c) 2025                    Hiisi Digital                    ort@hiisi.digital
// SPDX-License-Identifier: MPL-2.0      https://mozilla.org/MPL/2.0      contact@hiisi.digital
//----------------------------------------------------------------------------------------------------

/**
 * @module tests/transform_test
 *
 * Tests for the static analysis transformer.
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { transform } from "../src/transform/mod.ts";

// =============================================================================
// Property Access Tests
// =============================================================================

describe("Transform Property Access", () => {
  it("should transform onlywhen.darwin to true when platform is darwin", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
if (onlywhen.darwin) { console.log("mac"); }`;

    const result = await transform(source, { platform: "darwin" });

    assertStringIncludes(result.code, "if (true)");
    assertEquals(result.transformCount, 1);
    assertEquals(result.transformations[0].type, "property");
    assertEquals(result.transformations[0].replacement, "true");
  });

  it("should transform onlywhen.darwin to false when platform is linux", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
if (onlywhen.darwin) { console.log("mac"); }`;

    const result = await transform(source, { platform: "linux" });

    assertStringIncludes(result.code, "if (false)");
    assertEquals(result.transformCount, 1);
    assertEquals(result.transformations[0].replacement, "false");
  });

  it("should not transform when platform is not specified", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
if (onlywhen.darwin) { console.log("mac"); }`;

    const result = await transform(source, {});

    assertStringIncludes(result.code, "onlywhen.darwin");
    assertEquals(result.transformCount, 0);
  });

  it("should transform multiple platform properties", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
const isMac = onlywhen.darwin;
const isLinux = onlywhen.linux;
const isWindows = onlywhen.windows;`;

    const result = await transform(source, { platform: "darwin" });

    assertStringIncludes(result.code, "isMac = true");
    assertStringIncludes(result.code, "isLinux = false");
    assertStringIncludes(result.code, "isWindows = false");
    assertEquals(result.transformCount, 3);
  });

  it("should transform runtime properties", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
const isDeno = onlywhen.deno;
const isNode = onlywhen.node;
const isBun = onlywhen.bun;
const isBrowser = onlywhen.browser;`;

    const result = await transform(source, { runtime: "node" });

    assertStringIncludes(result.code, "isDeno = false");
    assertStringIncludes(result.code, "isNode = true");
    assertStringIncludes(result.code, "isBun = false");
    assertStringIncludes(result.code, "isBrowser = false");
    assertEquals(result.transformCount, 4);
  });

  it("should transform architecture properties", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
const isX64 = onlywhen.x64;
const isArm64 = onlywhen.arm64;`;

    const result = await transform(source, { arch: "arm64" });

    assertStringIncludes(result.code, "isX64 = false");
    assertStringIncludes(result.code, "isArm64 = true");
    assertEquals(result.transformCount, 2);
  });
});

// =============================================================================
// Import Alias Tests
// =============================================================================

describe("Transform with Import Aliases", () => {
  it("should handle aliased imports", async () => {
    const source = `import { onlywhen as cfg } from "@hiisi/onlywhen";
if (cfg.darwin) { console.log("mac"); }`;

    const result = await transform(source, { platform: "darwin" });

    assertStringIncludes(result.code, "if (true)");
    assertEquals(result.transformCount, 1);
  });

  it("should handle namespace imports", async () => {
    const source = `import * as ow from "@hiisi/onlywhen";
if (ow.onlywhen.darwin) { console.log("mac"); }`;

    const result = await transform(source, { platform: "darwin" });

    assertStringIncludes(result.code, "if (true)");
    assertEquals(result.transformCount, 1);
  });
});

// =============================================================================
// Combinator Tests
// =============================================================================

describe("Transform Combinators", () => {
  it("should evaluate all() with all true arguments", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
const result = onlywhen.all(onlywhen.darwin, onlywhen.arm64);`;

    const result = await transform(source, { platform: "darwin", arch: "arm64" });

    assertStringIncludes(result.code, "result = true");
  });

  it("should evaluate all() with mixed arguments", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
const result = onlywhen.all(onlywhen.darwin, onlywhen.arm64);`;

    const result = await transform(source, { platform: "darwin", arch: "x64" });

    assertStringIncludes(result.code, "result = false");
  });

  it("should evaluate any() with one true argument", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
const result = onlywhen.any(onlywhen.darwin, onlywhen.linux);`;

    const result = await transform(source, { platform: "darwin" });

    assertStringIncludes(result.code, "result = true");
  });

  it("should evaluate any() with all false arguments", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
const result = onlywhen.any(onlywhen.darwin, onlywhen.linux);`;

    const result = await transform(source, { platform: "windows" });

    assertStringIncludes(result.code, "result = false");
  });

  it("should evaluate not() correctly", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
const notDarwin = onlywhen.not(onlywhen.darwin);`;

    const result = await transform(source, { platform: "darwin" });

    assertStringIncludes(result.code, "notDarwin = false");
  });

  it("should handle nested combinators", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
const result = onlywhen.all(onlywhen.darwin, onlywhen.not(onlywhen.windows));`;

    const result = await transform(source, { platform: "darwin" });

    assertStringIncludes(result.code, "result = true");
  });
});

// =============================================================================
// Feature Flag Tests
// =============================================================================

describe("Transform Feature Flags", () => {
  it("should transform feature check to true when feature is enabled", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
if (onlywhen.feature("experimental")) { console.log("experimental"); }`;

    const result = await transform(source, { features: ["experimental"] });

    assertStringIncludes(result.code, "if (true)");
    assertEquals(result.transformCount, 1);
    assertEquals(result.transformations[0].type, "feature");
  });

  it("should transform feature check to false when feature is not enabled", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
if (onlywhen.feature("experimental")) { console.log("experimental"); }`;

    const result = await transform(source, { features: ["other"] });

    assertStringIncludes(result.code, "if (false)");
    assertEquals(result.transformCount, 1);
  });

  it("should not transform feature check when features is not specified", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
if (onlywhen.feature("experimental")) { console.log("experimental"); }`;

    const result = await transform(source, {});

    assertStringIncludes(result.code, 'onlywhen.feature("experimental")');
    assertEquals(result.transformCount, 0);
  });

  it("should not transform feature check with non-literal argument", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
const name = "experimental";
if (onlywhen.feature(name)) { console.log("experimental"); }`;

    const result = await transform(source, { features: ["experimental"] });

    assertStringIncludes(result.code, "onlywhen.feature(name)");
    assertEquals(result.transformCount, 0);
  });

  it("should transform standalone feature() call to true", async () => {
    const source = `import { feature } from "@hiisi/onlywhen";
if (feature("experimental")) { console.log("experimental"); }`;

    const result = await transform(source, { features: ["experimental"] });

    assertStringIncludes(result.code, "if (true)");
    assertEquals(result.transformCount, 1);
    assertEquals(result.transformations[0].type, "feature");
  });

  it("should transform standalone feature() call to false", async () => {
    const source = `import { feature } from "@hiisi/onlywhen";
if (feature("experimental")) { console.log("experimental"); }`;

    const result = await transform(source, { features: ["other"] });

    assertStringIncludes(result.code, "if (false)");
    assertEquals(result.transformCount, 1);
  });

  it("should handle aliased feature import", async () => {
    const source = `import { feature as hasFlag } from "@hiisi/onlywhen";
if (hasFlag("beta")) { console.log("beta"); }`;

    const result = await transform(source, { features: ["beta"] });

    assertStringIncludes(result.code, "if (true)");
    assertEquals(result.transformCount, 1);
  });
});

// =============================================================================
// Combined Config Tests
// =============================================================================

describe("Transform with Combined Config", () => {
  it("should transform multiple property types", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
const isMacNode = onlywhen.darwin && onlywhen.node;
const isArm = onlywhen.arm64;`;

    const result = await transform(source, {
      platform: "darwin",
      runtime: "node",
      arch: "arm64",
    });

    assertStringIncludes(result.code, "true && true");
    assertStringIncludes(result.code, "isArm = true");
    assertEquals(result.transformCount, 3);
  });

  it("should only transform specified config properties", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
const isMac = onlywhen.darwin;
const isNode = onlywhen.node;`;

    // Only specify platform, not runtime
    const result = await transform(source, { platform: "darwin" });

    assertStringIncludes(result.code, "isMac = true");
    assertStringIncludes(result.code, "onlywhen.node"); // Should remain unchanged
    assertEquals(result.transformCount, 1);
  });
});

// =============================================================================
// No-Op Tests
// =============================================================================

describe("Transform No-Op Cases", () => {
  it("should not transform files without onlywhen imports", async () => {
    const source = `const x = 1;
console.log(x);`;

    const result = await transform(source, { platform: "darwin" });

    assertEquals(result.code.trim(), source.trim());
    assertEquals(result.transformCount, 0);
  });

  it("should not transform non-onlywhen property access", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
const obj = { darwin: true };
const x = obj.darwin;`;

    const result = await transform(source, { platform: "linux" });

    assertStringIncludes(result.code, "obj.darwin");
    assertEquals(result.transformCount, 0);
  });

  it("should not transform unknown properties", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
const x = onlywhen.unknownProperty;`;

    const result = await transform(source, { platform: "darwin" });

    assertStringIncludes(result.code, "onlywhen.unknownProperty");
    assertEquals(result.transformCount, 0);
  });
});

// =============================================================================
// Transform Info Tests
// =============================================================================

// =============================================================================
// Namespace Object Tests
// =============================================================================

describe("Transform Namespace Objects", () => {
  it("should transform platform.darwin to true when platform is darwin", async () => {
    const source = `import { platform } from "@hiisi/onlywhen";
if (platform.darwin) { console.log("mac"); }`;

    const result = await transform(source, { platform: "darwin" });

    assertStringIncludes(result.code, "if (true)");
    assertEquals(result.transformCount, 1);
    assertEquals(result.transformations[0].type, "property");
  });

  it("should transform platform.linux to false when platform is darwin", async () => {
    const source = `import { platform } from "@hiisi/onlywhen";
if (platform.linux) { console.log("linux"); }`;

    const result = await transform(source, { platform: "darwin" });

    assertStringIncludes(result.code, "if (false)");
    assertEquals(result.transformCount, 1);
  });

  it("should transform runtime.node to true when runtime is node", async () => {
    const source = `import { runtime } from "@hiisi/onlywhen";
if (runtime.node) { console.log("node"); }`;

    const result = await transform(source, { runtime: "node" });

    assertStringIncludes(result.code, "if (true)");
    assertEquals(result.transformCount, 1);
  });

  it("should transform arch.x64 to true when arch is x64", async () => {
    const source = `import { arch } from "@hiisi/onlywhen";
if (arch.x64) { console.log("x64"); }`;

    const result = await transform(source, { arch: "x64" });

    assertStringIncludes(result.code, "if (true)");
    assertEquals(result.transformCount, 1);
  });

  it("should transform multiple namespace properties", async () => {
    const source = `import { platform, runtime, arch } from "@hiisi/onlywhen";
const isMac = platform.darwin;
const isNode = runtime.node;
const isArm = arch.arm64;`;

    const result = await transform(source, {
      platform: "darwin",
      runtime: "deno",
      arch: "arm64",
    });

    assertStringIncludes(result.code, "isMac = true");
    assertStringIncludes(result.code, "isNode = false");
    assertStringIncludes(result.code, "isArm = true");
    assertEquals(result.transformCount, 3);
  });

  it("should handle aliased namespace imports", async () => {
    const source = `import { platform as os } from "@hiisi/onlywhen";
if (os.darwin) { console.log("mac"); }`;

    const result = await transform(source, { platform: "darwin" });

    assertStringIncludes(result.code, "if (true)");
    assertEquals(result.transformCount, 1);
  });
});

// =============================================================================
// Standalone Combinator Tests
// =============================================================================

describe("Transform Standalone Combinators", () => {
  it("should evaluate standalone all() with namespace args", async () => {
    const source = `import { platform, arch, all } from "@hiisi/onlywhen";
const result = all(platform.darwin, arch.arm64);`;

    const result = await transform(source, { platform: "darwin", arch: "arm64" });

    assertStringIncludes(result.code, "result = true");
  });

  it("should evaluate standalone any() with namespace args", async () => {
    const source = `import { platform, any } from "@hiisi/onlywhen";
const result = any(platform.darwin, platform.linux);`;

    const result = await transform(source, { platform: "linux" });

    assertStringIncludes(result.code, "result = true");
  });

  it("should evaluate standalone not() with namespace arg", async () => {
    const source = `import { platform, not } from "@hiisi/onlywhen";
const notMac = not(platform.darwin);`;

    const result = await transform(source, { platform: "darwin" });

    assertStringIncludes(result.code, "notMac = false");
  });

  it("should work with decorators using standalone combinators", async () => {
    const source = `import { onlywhen, platform, arch, all } from "@hiisi/onlywhen";

@onlywhen(all(platform.linux, arch.x64))
class LinuxX64Only {
  method() { return "linux"; }
}`;

    const result = await transform(source, { platform: "darwin", arch: "arm64" });

    // Decorator should be stripped and class stubbed (optimization)
    assertEquals(result.code.includes("@onlywhen"), false);
    assertStringIncludes(result.code, "class LinuxX64Only");
    // Method body should be empty (stubbed)
    assertEquals(result.code.includes('return "linux"'), false);
  });

  it("should handle aliased combinator imports", async () => {
    const source = `import { platform, all as every } from "@hiisi/onlywhen";
const result = every(platform.darwin, platform.darwin);`;

    const result = await transform(source, { platform: "darwin" });

    assertStringIncludes(result.code, "result = true");
  });
});

// =============================================================================
// Transform Info Tests
// =============================================================================

describe("Transform Info", () => {
  it("should include line and column in transformation info", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
if (onlywhen.darwin) { console.log("mac"); }`;

    const result = await transform(source, { platform: "darwin" });

    assertEquals(result.transformations.length, 1);
    assertEquals(result.transformations[0].line, 2);
    assertEquals(typeof result.transformations[0].column, "number");
  });

  it("should include original expression in transformation info", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
const x = onlywhen.darwin;`;

    const result = await transform(source, { platform: "darwin" });

    assertEquals(result.transformations[0].original, "onlywhen.darwin");
  });
});

// =============================================================================
// Decorator Optimization Tests
// =============================================================================

describe("Transform Decorator Optimization", () => {
  it("should remove decorator and keep class when condition is true", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
@onlywhen(onlywhen.darwin)
class MacOnly {
  doSomething() { return 42; }
}`;

    const result = await transform(source, { platform: "darwin" });

    // Decorator should be removed
    assertEquals(result.code.includes("@onlywhen"), false);
    // Class should still exist with its method
    assertStringIncludes(result.code, "class MacOnly");
    assertStringIncludes(result.code, "doSomething");
    // Should have a decorator transformation
    const decoratorTransform = result.transformations.find((t) => t.type === "decorator");
    assertEquals(decoratorTransform !== undefined, true);
  });

  it("should remove decorator and stub class when condition is false", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
@onlywhen(onlywhen.darwin)
class MacOnly {
  doSomething() { return 42; }
}`;

    const result = await transform(source, { platform: "linux" });

    // Decorator should be removed
    assertEquals(result.code.includes("@onlywhen"), false);
    // Class should still exist but methods should be stubbed (empty body)
    assertStringIncludes(result.code, "class MacOnly");
    assertStringIncludes(result.code, "doSomething");
    // Method body should be empty (no "return 42")
    assertEquals(result.code.includes("return 42"), false);
  });

  it("should remove decorator and keep method when condition is true", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
class App {
  @onlywhen(onlywhen.node)
  nodeMethod() { return "node"; }
}`;

    const result = await transform(source, { runtime: "node" });

    // Decorator should be removed
    assertEquals(result.code.includes("@onlywhen"), false);
    // Method should still have its body
    assertStringIncludes(result.code, "nodeMethod");
    assertStringIncludes(result.code, 'return "node"');
  });

  it("should remove decorator and stub method when condition is false", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
class App {
  @onlywhen(onlywhen.node)
  nodeMethod() { return "node"; }
}`;

    const result = await transform(source, { runtime: "deno" });

    // Decorator should be removed
    assertEquals(result.code.includes("@onlywhen"), false);
    // Method should exist but be stubbed
    assertStringIncludes(result.code, "nodeMethod");
    assertEquals(result.code.includes('return "node"'), false);
  });

  it("should handle decorator with namespace condition", async () => {
    const source = `import { onlywhen, platform } from "@hiisi/onlywhen";
@onlywhen(platform.darwin)
class MacFeatures {
  feature() { return "mac"; }
}`;

    const result = await transform(source, { platform: "darwin" });

    assertEquals(result.code.includes("@onlywhen"), false);
    assertStringIncludes(result.code, "class MacFeatures");
    assertStringIncludes(result.code, 'return "mac"');
  });

  it("should handle decorator with combinator condition", async () => {
    const source = `import { onlywhen, platform, arch, all } from "@hiisi/onlywhen";
@onlywhen(all(platform.darwin, arch.arm64))
class M1Only {
  method() { return "m1"; }
}`;

    const result = await transform(source, { platform: "darwin", arch: "arm64" });

    assertEquals(result.code.includes("@onlywhen"), false);
    assertStringIncludes(result.code, "class M1Only");
    assertStringIncludes(result.code, 'return "m1"');
  });

  it("should stub class when combinator condition is false", async () => {
    const source = `import { onlywhen, platform, arch, all } from "@hiisi/onlywhen";
@onlywhen(all(platform.darwin, arch.arm64))
class M1Only {
  method() { return "m1"; }
}`;

    const result = await transform(source, { platform: "darwin", arch: "x64" });

    assertEquals(result.code.includes("@onlywhen"), false);
    assertStringIncludes(result.code, "class M1Only");
    assertEquals(result.code.includes('return "m1"'), false);
  });

  it("should handle decorator with feature condition", async () => {
    const source = `import { onlywhen, feature } from "@hiisi/onlywhen";
@onlywhen(feature("experimental"))
class ExperimentalFeature {
  run() { return "experimental"; }
}`;

    const result = await transform(source, { features: ["experimental"] });

    assertEquals(result.code.includes("@onlywhen"), false);
    assertStringIncludes(result.code, "class ExperimentalFeature");
    assertStringIncludes(result.code, 'return "experimental"');
  });

  it("should preserve constructor in stubbed class", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
@onlywhen(onlywhen.darwin)
class WithConstructor {
  constructor(private name: string) {
    console.log(name);
  }
  greet() { return this.name; }
}`;

    const result = await transform(source, { platform: "linux" });

    assertEquals(result.code.includes("@onlywhen"), false);
    assertStringIncludes(result.code, "class WithConstructor");
    assertStringIncludes(result.code, "constructor");
    // Constructor body should be empty
    assertEquals(result.code.includes("console.log"), false);
  });

  it("should preserve properties in stubbed class without initializers", async () => {
    const source = `import { onlywhen } from "@hiisi/onlywhen";
@onlywhen(onlywhen.darwin)
class WithProperty {
  value: number = 42;
  method() { return this.value; }
}`;

    const result = await transform(source, { platform: "linux" });

    assertEquals(result.code.includes("@onlywhen"), false);
    assertStringIncludes(result.code, "class WithProperty");
    assertStringIncludes(result.code, "value");
    // Property initializer should be removed
    assertEquals(result.code.includes("= 42"), false);
  });
});
