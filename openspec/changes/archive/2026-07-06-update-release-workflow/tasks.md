## 1. Remove pack-all Step

- [x] 1.1 Remove step 4 "Run Pack Script" (`npm run pack-all`) from `.github/workflows/release-on-tag.yaml` — DONE, step removed, remaining steps renumbered 4→5→6

## 2. Update Zip Creation

- [x] 2.1 Remove `-x packs/**/_source/*` exclusion from the zip command — DONE, exclusion line removed
- [x] 2.2 Verify `packs/` is included in the zip file list — CONFIRMED, `packs/` remains in file list

## 3. Update Release Artifacts

- [x] 3.1 Remove `packs/*.ldb` from the `artifacts` list — DONE, removed from ncipollo/release-action config
- [x] 3.2 Verify artifacts list contains only `module.json, module.zip` — CONFIRMED

## 4. Final Review

- [x] 4.1 Review complete workflow YAML for syntax correctness — PASSED, valid YAML with 6 steps
- [x] 4.2 Verify no remaining references to `_source`, `pack-all`, or `*.ldb` — CONFIRMED, zero remaining references
- [x] 4.3 Confirm `npm install` step is retained — CONFIRMED, step 3 unchanged
