## Why

The current `release-on-tag.yaml` publishes GitHub Releases but doesn't notify Foundry VTT's package listing of new versions. Foundry VTT provides a [Package Release API](https://foundryvtt.com/article/package-release-api/) that lets developers programmatically announce releases — this automates what would otherwise be a manual form submission.

## What Changes

- Update `module.json` manifest/download URLs to use stable `releases/latest/download/` pattern (Foundry polls this for updates)
- Add a step to call the Foundry VTT Package Release API (`POST https://foundryvtt.com/_api/packages/release_version/`) after creating the GitHub Release
- Add a step to commit the version bump back to main branch after release
- Ensure `module.zip` excludes dev-only files (`.github/`, `openspec/`, `docs/`, `node_modules/`, `utils/`)
- **Requires 1 GitHub Secret**: `FOUNDRY_RELEASE_TOKEN` — the `fvttp_...` token from the package page on foundryvtt.com

## Capabilities

### New Capabilities

- `release-workflow`: GitHub Actions workflow that creates a GitHub Release AND notifies Foundry VTT via the Package Release API when a `v*` tag is pushed.

### Modified Capabilities

None.

## Impact

- **Modified files**: `.github/workflows/release-on-tag.yaml`, `module.json` (manifest/download URLs)
- **New GitHub secret needed**: `FOUNDRY_RELEASE_TOKEN`
- **No runtime code changes**
