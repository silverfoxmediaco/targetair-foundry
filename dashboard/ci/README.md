# CI stub for `@target-air/sdk`

`target-air-sdk-stub/` stands in for the Ontology SDK when the build runs in
GitHub Actions. It is never used locally and never ships.

## Why it exists

The real SDK is published to a private Foundry artifact registry. CI has no
credentials for it and will not be given any:

- A token with read and write access to the ontology should not sit in the
  secrets of a public repository.
- Foundry tokens last about a day. A secret that needs rotating daily is not a
  secret, it is a scheduled outage.

## What is real and what is not

**The types are real.** Every `.d.ts` here is copied verbatim from the generated
SDK, so `tsc` in CI checks against exactly the types Foundry produced. Rename a
property in the ontology and regenerate, and CI fails until the code is updated
— which is the whole point of typechecking the integration.

**The runtime is inert.** `index.js` exports empty objects. Nothing in the test
suite calls into the SDK: the tests cover `derive.ts`, which holds every
judgement the dashboard makes and touches no network. The code that *does* call
the SDK is integration surface, and a test built on a hand-written mock of
Foundry's responses would only assert that the mock agrees with itself.

## Keeping it current

These declarations are a snapshot. After regenerating the SDK in Developer
Console and running `npm install`, refresh them:

    cd dashboard
    rm -rf ci/target-air-sdk-stub/ontology ci/target-air-sdk-stub/*.d.ts
    (cd node_modules/@target-air/sdk/esm && find . -name '*.d.ts' -print0 | tar --null -cf - -T -) \
      | (cd ci/target-air-sdk-stub && tar -xf -)

If a new object type or action is added, add it to `index.js` as well, or the
CI build will fail to resolve the import.

Stale declarations here are a real risk: CI would keep passing against types the
ontology no longer has. The mitigation is that local development always installs
the real package, so the drift surfaces the next time anyone builds on their own
machine.
