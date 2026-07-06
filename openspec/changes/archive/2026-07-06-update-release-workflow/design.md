## Context

The current `.github/workflows/release-on-tag.yaml` was written when compendium packs were managed as `_source/` JSON files that needed compilation via `npm run pack-all`. The packs are now stored directly as compiled LevelDB in the `packs/` directory — no source compilation step is needed, and `pack-all` would fail or be a no-op.

The workflow currently:
1. Runs `npm install` + `npm run pack-all` (step 3-4)
2. Includes `packs/` in the zip with `_source/` exclusion (step 6)
3. Uploads `packs/*.ldb` as separate release artifacts (step 7)

## Goals / Non-Goals

**Goals:**
- Remove the `npm run pack-all` step since there are no `_source/` packs to compile
- Remove `packs/*.ldb` from separate artifact uploads
- Simplify the zip creation: remove the `_source/` exclusion, include `packs/` normally
- Ensure the workflow produces a valid `module.zip` for Foundry installation

**Non-Goals:**
- Changing how packs are managed (that's a separate decision)
- Adding new workflow steps or triggers
- Modifying the `module.json` URL update logic
- Changing the release action or versioning scheme

## Decisions

### Decision 1: Remove pack-all, keep packs/ in zip

Remove step 4 (`npm run pack-all`) entirely. In the zip creation (step 6), remove the `-x packs/**/_source/*` exclusion and keep `packs/` as a normal included directory.

**Rationale**: Without `_source/` data, `pack-all` is dead code. Including `packs/` in the zip ensures the compiled packs ship with the module.

### Decision 2: Remove packs/*.ldb from separate artifact uploads

Remove `packs/*.ldb` from the `artifacts` list in step 7. Only `module.json` and `module.zip` are uploaded.

**Rationale**: The packs are already in `module.zip`. Separate `.ldb` uploads were for manual installation scenarios that are no longer supported.

### Decision 3: Keep npm install

Retain the `npm install` step even though `pack-all` is removed. This ensures any future build steps or dependency checks still work.

**Rationale**: Minimal change. Removing `npm install` would be a separate concern.

## Risks / Trade-offs

- **Risk**: If packs are accidentally not committed, the release will ship without them → **Mitigation**: Packs are committed to the repo; the zip just packages what's there
- **Trade-off**: Separate `.ldb` uploads are gone — users who relied on them for manual installs need to use `module.zip` instead → Acceptable; `module.zip` is the standard Foundry distribution format
