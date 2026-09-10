# Development workflow

## Commit and push policy

The repository owner requested that modifications be pushed to GitHub as work progresses. For this workstream, use `codex/phase-one-foundation` and push **each coherent, verified change set** after committing it. A change set can span several files required to make one feature, fix or documentation update complete. Do not push half-written files on every save or deliberately publish a broken intermediate state.

1. Check the active branch and working tree. Preserve unrelated user changes and stage only files belonging to the change set.
2. Implement the change and update its relevant documentation/contracts.
3. Run checks appropriate to the change. Application changes require relevant unit/build/browser checks; architecture changes require contract/link validation; migration changes require data recovery tests.
4. Review the diff for unintended changes and credentials; commit with a focused message.
5. Push the active development branch. Verify the remote SHA and inspect the resulting CI status. Fix failures with another focused commit and push.

Use ordinary fast-forward pushes. If the remote branch has advanced, fetch and reconcile the work; do not force push or discard someone else's changes. If authentication or policy blocks a push, retain the local commit and report the exact blocker. Do not claim a push succeeded until the remote confirms it.

This push policy does not automatically merge into `master`, deploy production, publish release tags or submit native apps. Those actions follow the release plan. It is a contributor workflow, not a background watcher or automation; changes are pushed during active development work.

## Checks

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run check:architecture
```

Use Node.js 22 or a compatible supported newer runtime. Do not change dependency versions just to match a sample in the architecture plan; verify compatibility and regenerate the lockfile deliberately. Do not commit node_modules, browser downloads, caches, test screenshots or private data. Build assets currently tracked by the repository remain synchronized with source until the build migration changes that policy.

See [the architecture plan](docs/architecture/README.md) for design decisions and [operations](docs/architecture/06-operations.md) for release, backup and rollback gates.
