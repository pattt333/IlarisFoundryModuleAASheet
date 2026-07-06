# Release Workflow

## Purpose

GitHub Actions CI/CD pipeline that automatically creates Foundry VTT-compatible releases and notifies the Foundry package listing when a version tag is pushed.

## Requirements

### Requirement: Stable manifest URL for Foundry VTT polling

The module's `module.json` on the main branch SHALL use `https://github.com/pattt333/IlarisFoundryModuleAASheet/releases/latest/download/module.json` as the manifest URL and `.../module.zip` as the download URL. Foundry VTT polls this URL to discover new versions.

#### Scenario: Foundry checks for updates

- **WHEN** Foundry VTT polls the manifest URL
- **THEN** it receives the latest release's `module.json` which contains the current version number and download link

### Requirement: GitHub Actions calls Foundry Package Release API on tag

When a `v*` tag is pushed, the workflow SHALL POST to `https://foundryvtt.com/_api/packages/release_version/` with the `FOUNDRY_RELEASE_TOKEN` secret, the package ID `ilaris-alternative-actor-sheet`, the version from the tag (without `v` prefix), the specific release manifest URL, and the compatibility block from `module.json`.

#### Scenario: Developer pushes tag v1.0.16

- **WHEN** a tag `v1.0.16` is pushed
- **THEN** Foundry VTT is notified via the API with version `"1.0.16"`, manifest pointing to `releases/download/v1.0.16/module.json`, and the compatibility block `{"minimum": 14, "verified": 14, "maximum": 14}`

#### Scenario: Dry-run before live release

- **WHEN** the `dry-run` parameter is `true`
- **THEN** the API validates the request but does not save the version, returning confirmation

### Requirement: module.zip excludes dev files

The `module.zip` artifact SHALL contain only runtime files: `scripts/`, `styles/`, `templates/`, `packs/`, `assets/`, `languages/`, `module.js`, `module.json`. It SHALL NOT contain `.github/`, `openspec/`, `docs/`, `node_modules/`, `utils/`, or `_spec/` directories.

### Requirement: One GitHub Secret for API authentication

The workflow SHALL use `FOUNDRY_RELEASE_TOKEN` (the `fvttp_...` token from the Foundry package page) as the `Authorization` header for Package Release API calls. No other custom secrets SHALL be required.
