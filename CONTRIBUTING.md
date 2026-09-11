# Development workflow

## Commit and push policy

The repository owner requested that modifications be pushed to GitHub as work progresses. Use `main` as the primary working branch and push **each coherent, verified change set** after committing it. Preserve `master` as the original base. A change set can span several files required to make one feature, fix or documentation update complete. Do not push half-written files on every save or deliberately publish a broken intermediate state.

## Repository naming

Use neutral, product-focused names in branch names, commit messages, documentation and other authored repository content. Do not include assistant, agent or model names or add automated authorship/co-author branding. Preserve legally required third-party attribution. Keep only `main` and the original `master` unless the owner requests another branch.

## Verification and publication

1. Check the active branch and working tree. Preserve unrelated user changes and stage only files belonging to the change set.
2. Implement the change and update its relevant documentation/contracts.
3. Run checks appropriate to the change. Application changes require relevant unit/build/browser checks; architecture changes require contract/link validation; migration changes require data recovery tests.
4. Review the diff for unintended changes and credentials; commit with a focused message.
5. Push the active development branch. Verify the remote SHA and inspect the resulting CI status. Fix failures with another focused commit and push.

At the end of each completed change, report the current milestone, what visibly changed (or why the work was internal), verification, pushed commit, live URL, simple testing steps, remaining work and the next suggested command. Keep the status in [the build guide](docs/architecture/08-build-guide.md) aligned with verified completion.

Use ordinary fast-forward pushes. If the remote branch has advanced, fetch and reconcile the work; do not force push or discard someone else's changes. If authentication or policy blocks a push, retain the local commit and report the exact blocker. Do not claim a push succeeded until the remote confirms it.

Pushes to `main` run the web checks and automatically deploy the successful `export/` build to https://rahulsinghparmar.github.io/the-cube/. Pull requests run checks without deployment. Never move or deploy from the preserved `master` branch. Release tags and native app publication remain separate actions. Changes are committed and pushed during active development work; no local background watcher is installed.

## Checks

```sh
npm ci
npm test
npm run build
npx playwright install --with-deps chromium firefox webkit
npm run test:e2e
npm run check:architecture
```

Use Node.js 22.12 or a compatible supported newer runtime. Do not change dependency versions just to match a sample in the architecture plan; verify compatibility and regenerate the lockfile deliberately. Do not commit node_modules, browser downloads, caches, test screenshots or private data. Build assets currently tracked by the repository remain synchronized with source until the build migration changes that policy.

See [the architecture plan](docs/architecture/README.md) for design decisions and [operations](docs/architecture/06-operations.md) for release, backup and rollback gates.
