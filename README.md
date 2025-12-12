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

`onlywhen` picks up on platform, runtime, and architecture. You can combine them,
branch on them, or use them as decorators. Simple enough that tooling can inline
them (static analysis pass in the works).

```typescript
import { onlywhen } from "@hiisi/onlywhen";

// Boolean checks
if (onlywhen.darwin) {
  macSpecificCode();
}

// Short-circuit
onlywhen.deno && denoSpecificCode();

// Combinators
if (onlywhen.all(onlywhen.node, onlywhen.linux)) {
  nodeOnLinuxCode();
}

// Decorators
@onlywhen(onlywhen.darwin)
class MacOnlyFeature {
  // Becomes an inert class on other platforms
}
```

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
import { onlywhen } from "jsr:@hiisi/onlywhen";

// Node.js
import { onlywhen } from "onlywhen";
```

Or add to your project:

```jsonc
// deno.json
{
  "imports": {
    "@hiisi/onlywhen": "jsr:@hiisi/onlywhen@^0.1"
  }
}

// package.json
{
  "dependencies": {
    "onlywhen": "^0.1"
  }
}
```

## Usage

### Platform Detection

```typescript
onlywhen.darwin; // true on macOS
onlywhen.linux; // true on Linux
onlywhen.windows; // true on Windows
```

### Runtime Detection

```typescript
onlywhen.deno; // true in Deno
onlywhen.node; // true in Node.js
onlywhen.bun; // true in Bun
onlywhen.browser; // true in browsers
```

### Architecture Detection

```typescript
onlywhen.x64; // true on x86_64
onlywhen.arm64; // true on aarch64 / Apple Silicon
```

### Combinators

```typescript
// All conditions must be true
onlywhen.all(onlywhen.darwin, onlywhen.arm64);

// At least one must be true
onlywhen.any(onlywhen.node, onlywhen.bun);

// Negation
onlywhen.not(onlywhen.windows);
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
onlywhen.feature("experimental"); // true if listed
onlywhen.features; // Set<string> of all features
```

### Decorators

```typescript
// Class becomes empty if condition is false
@onlywhen(onlywhen.darwin)
class MacFeatures {
  setup() {/* ... */}
}

// Method becomes no-op if condition is false
class App {
  @onlywhen(onlywhen.deno)
  denoMethod() {/* ... */}

  @onlywhen(onlywhen.all(onlywhen.linux, onlywhen.x64))
  linuxX64Method() {/* ... */}

  @onlywhen(onlywhen.feature("experimental"))
  experimentalMethod() {/* ... */}
}
```

### Runtime Matching

```typescript
import { match } from "@hiisi/onlywhen";

const result = match({
  deno: () => Deno.readTextFileSync("file.txt"),
  node: () => require("fs").readFileSync("file.txt", "utf-8"),
  bun: () => Bun.file("file.txt").text(),
  default: () => {
    throw new Error("Unsupported runtime");
  },
});
```

## Comparison to Rust

| Rust                                        | onlywhen                                                |
| :------------------------------------------ | :------------------------------------------------------ |
| `#[cfg(target_os = "macos")]`               | `@onlywhen(onlywhen.darwin)`                            |
| `#[cfg(all(unix, target_arch = "x86_64"))]` | `@onlywhen(onlywhen.all(onlywhen.linux, onlywhen.x64))` |
| `cfg!(target_os = "windows")`               | `onlywhen.windows`                                      |
| `#[cfg(feature = "experimental")]`          | `@onlywhen(onlywhen.feature("experimental"))`           |
| `#[cfg(not(windows))]`                      | `@onlywhen(onlywhen.not(onlywhen.windows))`             |

## Static Analysis Transform

The `@hiisi/onlywhen/transform` module provides build-time transformation of
onlywhen expressions to boolean literals, enabling dead code elimination.

```typescript
import { transform } from "@hiisi/onlywhen/transform";

const source = `
import { onlywhen } from "@hiisi/onlywhen";
if (onlywhen.darwin) { macCode(); }
if (onlywhen.linux) { linuxCode(); }
`;

const result = await transform(source, {
  platform: "darwin",
  runtime: "node",
  arch: "arm64",
  features: ["experimental"],
});

// result.code:
// if (true) { macCode(); }
// if (false) { linuxCode(); }
```

The transform handles:

- Property access: `onlywhen.darwin`, `onlywhen.node`, `onlywhen.x64`
- Combinators: `onlywhen.all(...)`, `onlywhen.any(...)`, `onlywhen.not(...)`
- Feature checks: `onlywhen.feature("name")`
- Import aliases: `import { onlywhen as cfg } from "..."`

Properties not specified in the config are left as runtime checks.

## Support

Whether you use this project, have learned something from it, or just like it,
please consider supporting it by buying me a coffee, so I can dedicate more time
on open-source projects like this :)

<a href="https://buymeacoffee.com/orgrinrt" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

## License

> You can check out the full license [here](https://github.com/hiisi-digital/onlywhen/blob/main/LICENSE)

This project is licensed under the terms of the **Mozilla Public License 2.0**.

`SPDX-License-Identifier: MPL-2.0`
