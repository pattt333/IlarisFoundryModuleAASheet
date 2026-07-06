## Why

The GitHub Actions release workflow (`.github/workflows/release-on-tag.yaml`) references `packs/` in its zip creation and artifact upload steps, and runs `npm run pack-all` to compile compendium packs from `_source/` JSON. The compendium packs are no longer managed as `_source/` data in this repository — the `packs/` directory contains pre-compiled LevelDB packs directly, and `npm run pack-all` fails or is unnecessary. The next tagged release will fail at the pack-all step unless the workflow is updated.

## What Changes

- Remove the `npm run pack-all` step (no `_source/` compendium data to compile)
- Remove `packs/` from the zip creation exclusion list and include list
- Remove `packs/*.ldb` from the release artifacts upload
- The `packs/` directory will still be included in `module.zip` as a regular directory (not excluded)

## Capabilities

### New Capabilities

- `release-pipeline`: GitHub Actions workflow triggered on `v*` tags that creates `module.zip` with all module files (including pre-compiled `packs/`), updates `module.json` manifest URLs, and publishes a GitHub Release with `module.json` and `module.zip` as artifacts.

### Modified Capabilities

_None. No existing product specifications are affected._

## Impact

- **Modified file**: `.github/workflows/release-on-tag.yaml`
- **No Hook changes**: CI-only change
- **No module-level code changes**: Workflow infrastructure only
- **No runtime impact**: The module itself is unchanged
