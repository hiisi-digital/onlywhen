# `onlywhen`

<div align="center" style="text-align: center;">

[![GitHub Stars](https://img.shields.io/github/stars/hiisi-digital/onlywhen.svg)](https://github.com/hiisi-digital/onlywhen/stargazers)
[![JSR](https://jsr.io/badges/@hiisi/onlywhen)](https://jsr.io/@hiisi/onlywhen)
[![npm Version](https://img.shields.io/npm/v/onlywhen?logo=npm)](https://www.npmjs.com/package/onlywhen)
[![GitHub Issues](https://img.shields.io/github/issues/hiisi-digital/onlywhen.svg)](https://github.com/hiisi-digital/onlywhen/issues)
![License](https://img.shields.io/github/license/hiisi-digital/onlywhen?color=%23009689)

> Conditional code based on platform, runtime, or feature flags.

</div>

## What it does

Tells you what you're running on, right now, at runtime. Which runtime, which
platform, which architecture. That's the whole job.

```typescript
import { arch, match, platform, runtime } from "@hiisi/onlywhen";

if (platform.darwin) {
  macSpecificThing();
}

runtime.deno && denoSpecificThing();

if (platform.linux && arch.x64) {
  linuxX64Thing();
}

// or dispatch on it, which is usually nicer than a chain of ifs
const cachePath = match(runtime, {
  deno: () => "~/.cache/deno",
  node: () => "~/.npm/_cacache",
  bun: () => "~/.bun/install/cache",
  _: () => "./.cache",
});
```

The vocabulary (`"deno"`, `"darwin"`, `"arm64"`) comes from
[`@hiisi/tgts`](https://jsr.io/@hiisi/tgts), which owns it. This package doesn't
declare its own names for the same things, because it did once and the two
spellings disagreed: `x86_64` here against `x64` there, for the same
architecture, with no conversion between them anybody outside could reach.

## What it does not do, and where that lives instead

This used to carry a `@onlywhen()` decorator, a feature flag api and a compiler
transform. All three were second implementations of things other packages in the
set already own, and they didn't agree with the originals. They're gone as of
0.7.0:

| what you wanted                              | where it is now                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| `@onlywhen(...)` for conditional compilation | `@cfg(...)` from [`@hiisi/cfg-ts`](https://jsr.io/@hiisi/cfg-ts)        |
| `all()`, `any()`, `not()` predicates         | `@hiisi/cfg-ts`                                                         |
| `feature()`, `enableFeature()` and friends   | [`@hiisi/ft-flags`](https://jsr.io/@hiisi/ft-flags)                     |
| stripping code at build time                 | `@hiisi/cfg-ts`, applied by [`@hiisi/otso`](https://jsr.io/@hiisi/otso) |

If you were using any of those, that's a real migration and I'm sorry about it.
The reason it's worth doing: you were getting two answers to one question
depending on which import you reached for, and neither package knew the other
existed. One `@cfg` for everything that decides at build time, and this for the
one question that genuinely can't be answered until you're running.

## Installation

```bash
# npm / yarn / pnpm
npm install onlywhen

# Deno
deno add jsr:@hiisi/onlywhen
```

As a library:

```typescript
// Deno / JSR
import { all, arch, onlywhen, platform, runtime } from "jsr:@hiisi/onlywhen";
```

```typescript
// Node.js
import { all, arch, onlywhen, platform, runtime } from "@hiisi/onlywhen";
```

Or add to your project:

```jsonc
// deno.json
{
  "imports": {
    "@hiisi/onlywhen": "jsr:@hiisi/onlywhen@^0.5"
  }
}

// package.json
{
  "dependencies": {
    "onlywhen": "^0.5"
  }
}
```

## Usage

### Platform Detection

```typescript
import { platform } from "@hiisi/onlywhen";

platform.darwin; // true on macOS
platform.linux; // true on Linux
platform.windows; // true on Windows
```

### Runtime Detection

```typescript
import { runtime } from "@hiisi/onlywhen";

runtime.deno; // true in Deno
runtime.node; // true in Node.js
runtime.bun; // true in Bun
runtime.browser; // true in browsers
```

### Architecture Detection

```typescript
import { arch } from "@hiisi/onlywhen";

arch.x64; // true on x86_64
arch.arm64; // true on aarch64 / Apple Silicon
```

### Combinators

```typescript
import { all, any, arch, not, platform } from "@hiisi/onlywhen";

// All conditions must be true
all(platform.darwin, arch.arm64);

// At least one must be true
any(platform.linux, platform.darwin);

// Negation
not(platform.windows);

// Nesting
all(platform.darwin, not(arch.x64));
```

### Feature Flags

Define features in your `deno.json` or `package.json`:

```json
{
  "features": ["experimental", "legacy_compat"]
}
```

Check them at runtime:

```typescript
import { feature, onlywhen } from "@hiisi/onlywhen";

// Standalone function (preferred)
feature("experimental"); // true if listed

// Or via onlywhen object
onlywhen.feature("experimental"); // also works
onlywhen.features; // Set<string> of all features
```

### Decorators

The decorator implements the legacy TypeScript decorator protocol (`target`,
`propertyKey`, `descriptor`), so `experimentalDecorators` has to be on. Under the
TC39 standard decorators that Deno 2 and TypeScript 5 use by default, the
decorator receives arguments it does not recognise, returns the target unchanged,
and the condition has no runtime effect at all. Nothing is logged when this
happens.

```jsonc
// deno.json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

```typescript
import { all, arch, feature, onlywhen, platform, runtime } from "@hiisi/onlywhen";

// Class becomes empty if condition is false
@onlywhen(platform.darwin)
class MacFeatures {
  setup() {/* ... */}
}

// Method becomes no-op if condition is false
class App {
  @onlywhen(runtime.deno)
  denoMethod() {/* ... */}

  @onlywhen(all(platform.linux, arch.x64))
  linuxX64Method() {/* ... */}

  @onlywhen(feature("experimental"))
  experimentalMethod() {/* ... */}
}
```

Builds that run the static analysis transform below do not need the flag for
decorators the transform can evaluate: those are stripped and stubbed before any
decorator protocol runs.

### Runtime Matching

```typescript
import { match } from "@hiisi/onlywhen";

// Each branch names globals that exist only in its own runtime, so the others need them
// declared to type-check here. `@types/bun` and `@types/node` do this properly.
declare const Bun: { file(path: string): { text(): Promise<string> } };
declare function require(
  name: "fs/promises",
): { readFile(path: string, encoding: string): Promise<string> };

// Every branch returns the same type, because `match` returns one value and not three.
// Bun's `file().text()` is asynchronous, so the other two are read asynchronously too
// rather than one branch quietly returning a promise and the others a string.
const contents: Promise<string> = match({
  deno: () => Deno.readTextFile("file.txt"),
  node: () => require("fs/promises").readFile("file.txt", "utf-8"),
  bun: () => Bun.file("file.txt").text(),
  default: () => {
    throw new Error("Unsupported runtime");
  },
});
```

### String Values

If you need the actual detected values as strings (not booleans):

```typescript
import { archName, getRuntimeName, platformName } from "@hiisi/onlywhen";

console.log(platformName); // "darwin" | "linux" | "windows" | "unknown"
console.log(archName); // "x86_64" | "aarch64" | "arm" | "x86" | "unknown"
console.log(getRuntimeName()); // "deno" | "node" | "bun" | "browser" | "unknown"
```

## Comparison to Rust

| Rust                                                       | onlywhen                                      |
| :--------------------------------------------------------- | :-------------------------------------------- |
| `#[cfg(target_os = "macos")]`                              | `@onlywhen(platform.darwin)`                  |
| `#[cfg(all(target_os = "linux", target_arch = "x86_64"))]` | `@onlywhen(all(platform.linux, arch.x64))`    |
| `cfg!(target_os = "windows")`                              | `platform.windows`                            |
| `#[cfg(feature = "experimental")]`                         | `@onlywhen(onlywhen.feature("experimental"))` |
| `#[cfg(not(windows))]`                                     | `@onlywhen(not(platform.windows))`            |

## Runtime Compatibility

Deno, Node and Bun, and a browser for the detection half.

I have to be straight about what that claim rests on, because until now it
rested on nothing. This section used to carry a table saying Deno 1.x and 2.x,
Node 18, 20 and 22, and Bun canary and latest all passed, dated to a day in
December. Every test in this package is a `Deno.test`, so not one of those seven
had ever been run. The table was not out of date, it was never true.

So: the suite runs under Deno today and the cross-runtime matrix is being built.
When it lands this section says which runtimes actually ran and on what date,
generated from the run rather than typed in. Until then, take Node and Bun as
intended-and-unverified, which is what they have been all along.

## Support

Whether you use this project, have learned something from it, or just like it,
please consider supporting it by buying me a coffee, so I can dedicate more time
on open-source projects like this :)

<a href="https://buymeacoffee.com/orgrinrt" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

## License

> You can check out the full license [here](https://github.com/hiisi-digital/onlywhen/blob/main/LICENSE)

This project is licensed under the terms of the **Mozilla Public License 2.0**.

`SPDX-License-Identifier: MPL-2.0`
