# Runtime Compatibility Matrix

> This file is automatically updated by CI when tests run on the `main` branch.
> See [`.github/workflows/compatibility.yml`](./.github/workflows/compatibility.yml) for details.

## Current Status

The compatibility matrix will be populated after the first successful CI run on `main`.

To trigger an update manually:

1. Go to the [Actions tab](../../actions) on GitHub
2. Select "Compatibility Matrix" workflow
3. Click "Run workflow"

## Expected Runtimes

| Runtime | Versions       | Platforms             |
| ------- | -------------- | --------------------- |
| Deno    | v1.x, v2.x     | Linux, macOS, Windows |
| Node.js | 18, 20, 22     | Linux, macOS, Windows |
| Bun     | latest, canary | Linux, macOS          |

## Local Testing

You can test compatibility locally:

```bash
# Deno
deno test --allow-read --allow-write --allow-env --allow-run --allow-net

# Node.js (after building npm package)
deno run -A scripts/build-npm.ts
cd npm && node -e "const { onlywhen } = require('./script/mod.js'); console.log('node:', onlywhen.node)"

# Bun (after building npm package)
cd npm && bun -e "import { onlywhen } from './esm/mod.js'; console.log('bun:', onlywhen.bun)"
```

---

<!-- AUTO-GENERATED CONTENT BELOW - DO NOT EDIT MANUALLY -->
