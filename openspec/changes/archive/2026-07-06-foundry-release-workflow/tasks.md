## 1. Update module.json manifest URLs

- [x] 1.1 Change `manifest` to `https://github.com/pattt333/IlarisFoundryModuleAASheet/releases/latest/download/module.json`
- [x] 1.2 Change `download` to `https://github.com/pattt333/IlarisFoundryModuleAASheet/releases/latest/download/module.zip`

## 2. Update release workflow

- [x] 2.1 Update zip step to exclude dev-only directories (`.github/`, `openspec/`, `docs/`, `node_modules/`, `utils/`, `_spec/`)
- [x] 2.2 Add step to call Foundry Package Release API (`POST https://foundryvtt.com/_api/packages/release_version/`) with `FOUNDRY_RELEASE_TOKEN`, package `id`, version, specific release manifest URL, and compatibility block
- [x] 2.3 Add step to commit version bump to main branch after release (extract version from tag, update `module.json`, commit + push)
- [x] 2.4 Update release body to include installation instructions

## 3. GitHub Secret

- [x] 3.1 Add `FOUNDRY_RELEASE_TOKEN` to repository secrets (must be done manually on github.com — the `fvttp_...` token from the Foundry package edit page)
