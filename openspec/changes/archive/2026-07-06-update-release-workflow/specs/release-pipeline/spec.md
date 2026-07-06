# Release Pipeline

## ADDED Requirements

### Requirement: Tagged releases produce module.zip without pack compilation

The GitHub Actions release workflow SHALL trigger on tags matching `v*`, create a `module.zip` containing all module files including `packs/` as-is (no `_source/` compilation), update `module.json` manifest/download URLs to the release tag, and upload `module.json` and `module.zip` as release artifacts.

#### Scenario: Tag v1.1.0 is pushed

- **WHEN** a tag `v1.1.0` is pushed to the repository
- **THEN** the workflow creates `module.zip` with `packs/` included directly, updates `module.json` URLs to point to the release, and publishes a GitHub Release with `module.json` and `module.zip` attached

#### Scenario: No packs directory present

- **WHEN** the workflow runs and `packs/` directory does not exist
- **THEN** `module.zip` is still created with all available files; no pack-related errors occur
