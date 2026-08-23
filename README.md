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

`onlywhen` tells you what you're running on, right now, at runtime. Which
runtime, which platform, which architecture. That's the whole job, and since
0.7.0 it really is the whole job.

```typescript
import { arch, match, platform, runtime } from "@hiisi/onlywhen";

if (platform.darwin) {
  macSpecificThing();
}

runtime.deno && denoSpecificThing();

if (platform.linux && arch.x64) {
  linuxX64Thing();
}

// or dispatch on it, which usually reads better than a chain of ifs
const cachePath = match({
  deno: () => "~/.cache/deno",
  node: () => "~/.npm/_cacache",
  bun: () => "~/.bun/install/cache",
  default: () => "./.cache",
});
```

The names it uses (`"deno"`, `"darwin"`, `"arm64"`) come from
[`@hiisi/tgts`](https://jsr.io/@hiisi/tgts), which owns that vocabulary. This
package doesn't declare its own words for the same things, because it did once
and the two spellings drifted apart: `x86_64` here against `x64` there, for the
same architecture, and nothing outside could convert between them.

## What it doesn't do, and where that went instead

This used to carry a `@onlywhen()` decorator, a feature flag api and a compiler
transform. All three were second implementations of things other packages in
the set already owned, and they didn't agree with the originals. They're gone
as of 0.7.0:

| what you wanted                              | where it lives now                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| `@onlywhen(...)` for conditional compilation | `@cfg(...)` from [`@hiisi/cfg-ts`](https://jsr.io/@hiisi/cfg-ts)        |
| `all()`, `any()`, `not()` predicates         | `@hiisi/cfg-ts`                                                         |
| `feature()`, `enableFeature()` and friends   | [`@hiisi/ft-flags`](https://jsr.io/@hiisi/ft-flags)                     |
| stripping code at build time                 | `@hiisi/cfg-ts`, applied by [`@hiisi/otso`](https://jsr.io/@hiisi/otso) |

If you were using any of those, that's a real migration and I'm sorry about it.
The reason it's worth doing: you were getting two answers to one question
depending on which import you happened to reach for, and neither package knew
the other existed. One `@cfg` for everything that decides at build time, and
this for the one question that genuinely can't be answered until you're
actually running.

## Installation

```bash
# deno
deno add jsr:@hiisi/onlywhen

# node, bun
npm install onlywhen
bun add onlywhen
```

Or straight into the manifest:

```jsonc
// deno.json
{
  "imports": {
    "@hiisi/onlywhen": "jsr:@hiisi/onlywhen@^0.7"
  }
}
```

Do note the jsr and npm names differ right now. jsr requires a scope, npm
doesn't, and the flat `onlywhen` name was already ours there. That's a wart and
it'll get tidied.

## Usage

### Detection

Three namespaces, all booleans, all resolved once when the module loads.

```typescript
import { arch, platform, runtime } from "@hiisi/onlywhen";

platform.darwin; // true on macOS
platform.linux;
platform.windows;

runtime.deno; // true in Deno
runtime.node;
runtime.bun;
runtime.browser;

arch.x64; // true on x86_64
arch.arm64; // true on aarch64 and Apple Silicon
```

If you want the detected value as a string rather than a set of booleans:

```typescript
import { archName, platformName } from "@hiisi/onlywhen";

platformName; // "darwin" | "linux" | "windows" | "unknown"
archName; // "x64" | "arm64" | "unknown"
```

`"unknown"` is a real answer, not a failure. Detection can come up empty on a
runtime nobody has taught it about yet, and saying so is better than guessing.

### Matching

`match` picks one branch and gives you its value. Every branch returns the same
type, because it returns one value and not four.

```typescript
import { match } from "@hiisi/onlywhen";

// each branch names globals that only exist in its own runtime, so the others
// need them declared to type-check here. `@types/node` and `@types/bun` do
// this properly.
declare const Bun: { file(path: string): { text(): Promise<string> } };
declare function require(name: "fs/promises"): {
  readFile(path: string, encoding: string): Promise<string>;
};

const contents: Promise<string> = match({
  deno: () => Deno.readTextFile("file.txt"),
  node: () => require("fs/promises").readFile("file.txt", "utf-8"),
  bun: () => Bun.file("file.txt").text(),
  default: () => {
    throw new Error("unsupported runtime");
  },
});
```

Give it a `default` and you get `T` back. Leave it out and you get
`T | undefined`, because there's a case you haven't handled and the type says
so rather than pretending otherwise. `matchAsync` is the same thing, awaited.

Reaching for `match` at all is worth a second thought though. If the branches
are doing filesystem or process work, [`@hiisi/shimp`](https://jsr.io/@hiisi/shimp)
probably already covers it and you can skip the branching entirely.

## Comparison to Rust

| Rust                           | here                      |
| :----------------------------- | :------------------------ |
| `cfg!(target_os = "windows")`  | `platform.windows`        |
| `cfg!(target_arch = "x86_64")` | `arch.x64`                |
| `#[cfg(target_os = "macos")]`  | `@hiisi/cfg-ts`, not this |

The first two are the honest comparison: `cfg!` is the runtime-value form and
that's what this package is. The attribute form decides at build time and lives
in `cfg-ts`, which is the whole point of the 0.7.0 split.

## Runtime compatibility

Deno, Node and Bun, plus a browser for the detection half.

I have to be straight about what that rests on. This section used to carry a
table claiming Deno 1.x and 2.x, Node 18, 20 and 22, and Bun canary and latest
all passed, dated to a day in December. Every test in this package is a
`Deno.test`, so not one of those seven had ever run. The table wasn't out of
date, it was never true.

So: the suite runs under Deno today, and the cross-runtime matrix is being
built. When it lands, this section says which runtimes actually ran and on what
date, generated from the run rather than typed in by me. Until then take Node
and Bun as intended and unverified, which is what they've been all along.

## Support

Whether you use this project, have learned something from it, or just like it,
please consider supporting it by buying me a coffee, so I can dedicate more time
on open-source projects like this :)

<a href="https://buymeacoffee.com/orgrinrt" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

## License

> You can check out the full license [here](https://github.com/hiisi-digital/onlywhen/blob/main/LICENSE)

This project is licensed under the terms of the **Mozilla Public License 2.0**.

`SPDX-License-Identifier: MPL-2.0`
