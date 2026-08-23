## Runtime Compatibility

Deno, Node and Bun, and a browser for the detection half.

That is the intent. What it rests on, stated plainly, because this file used to
say something stronger and it was not true.

Until 2026-08-22 this carried a table asserting that Deno 1.x and 2.x, Node 18,
20 and 22, and Bun canary and latest all passed, dated 2025-12-12. Every test in
this package is a `Deno.test`, so not one of those seven combinations had ever
been run by anything. The table was not stale. It had never been measured.

The suite runs under Deno. The cross-runtime matrix is being built, and when it
lands this file is generated from the run: which runtimes, which versions, what
date, from the runner rather than typed in by hand. Until then Node and Bun are
intended and unverified, which is what they have been since the beginning.

If you are relying on this package under Node or Bun today, it very probably
works, and nobody has checked.
