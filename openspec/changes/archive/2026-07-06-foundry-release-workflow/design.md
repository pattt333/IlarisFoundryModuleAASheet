## Context

Foundry VTT's [Package Release API](https://foundryvtt.com/article/package-release-api/) lets developers programmatically announce new package versions at `POST https://foundryvtt.com/_api/packages/release_version/`. This avoids manual form submission for every release. The API requires a per-package auth token (`fvttp_...`) obtained from the package edit page on foundryvtt.com.

Foundry also polls the package's manifest URL (from `module.json`) to discover new versions. The convention is `https://github.com/<user>/<repo>/releases/latest/download/module.json`.

## Decisions

### Decision 1: Use `releases/latest/download/` as the canonical manifest URL in module.json

Update `module.json` manifest to `https://github.com/pattt333/IlarisFoundryModuleAASheet/releases/latest/download/module.json` and download to `.../module.zip`.

**Rationale**: This is the standard Foundry VTT convention. Foundry polls this to detect new versions. The release workflow uploads `module.json` and `module.zip` as release artifacts, so `releases/latest/download/` always serves the current version.

### Decision 2: Call the Package Release API after creating the GitHub Release

Add a workflow step that POSTs to `https://foundryvtt.com/_api/packages/release_version/` with:
- `Authorization: fvttp_...` (from `FOUNDRY_RELEASE_TOKEN` secret)
- `id`: `ilaris-alternative-actor-sheet`
- `release.version`: Tag name without `v` prefix (e.g., `1.0.16`)
- `release.manifest`: The **specific release** manifest URL (e.g., `https://github.com/.../releases/download/v1.0.16/module.json`)
- `release.notes`: URL to the GitHub Release page
- `release.compatibility`: From `module.json` compatibility block

**Rationale**: This fully automates the release pipeline — no manual steps needed after pushing a tag.

### Decision 3: Manifest URLs differ between module.json and the API call

- `module.json` manifest field → `releases/latest/download/module.json` (stable, for Foundry polling)
- API body `manifest` → `releases/download/v1.0.16/module.json` (specific release, for the API to archive this version)

**Rationale**: The API docs explicitly say the API `manifest` should point to a specific release, not a `latest` branch. The `module.json` field should remain stable for polling.

### Decision 4: One new GitHub Secret needed

`FOUNDRY_RELEASE_TOKEN` — the `fvttp_...` token from the package page on foundryvtt.com.

**Rationale**: This is the only authentication the API needs. `GITHUB_TOKEN` is auto-provided for GitHub Release creation.
