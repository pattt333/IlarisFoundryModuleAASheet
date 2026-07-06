## Context

The project has 34 specification documents in `docs/_specs/` created during iterative development before OpenSpec adoption. These documents vary in format: some are structured implementation plans with steps, others are narrative descriptions of features, and a few (`MIGRATION_*`) are session logs. The `openspec/specs/` directory is currently empty — there's no canonical spec baseline.

The migration must convert these diverse documents into a uniform OpenSpec format (`### Requirement:` / `#### Scenario:` with WHEN/THEN) while preserving the behavioral intent. Additionally, each spec must be validated against the current codebase to flag any drift.

## Goals / Non-Goals

**Goals:**
- Convert 12 feature specs into `openspec/specs/<capability>/spec.md` in OpenSpec format
- Consolidate 17 dated implementation plans into a single `migration-history` spec
- Merge duplicate specs (`fernkampfoption-auto-add.md` + `.spec.md`)
- Cross-reference each spec against actual code to identify deviations
- Keep `docs/_specs/` intact as historical reference — no deletions

**Non-Goals:**
- Fixing spec-code deviations (that's future change work)
- Migrating `MIGRATION_*` session logs (these are process artifacts, not behavioral specs)
- Rewriting or improving the original spec content beyond format conversion
- Creating new requirements not present in the original specs

## Decisions

### Decision 1: OpenSpec ADDED format for all specs

All 12 new capabilities use `## ADDED Requirements` with no MODIFIED/REMOVED sections, since `openspec/specs/` is empty — there's nothing to modify.

**Rationale**: This is the initial population. All requirements are "new" from OpenSpec's perspective even though they describe existing behavior.

### Decision 2: Keep `docs/_specs/` as historical reference

Original files stay in place. No deletions, no moves.

**Rationale**: Preserves the development history. Future contributors can trace how specs evolved. Also avoids risk of accidental data loss.

### Decision 3: Consolidate migration subdirectories into one spec

The 17 `docs/_specs/<YYYY_MM_DD_*>/` subdirectories each contain a single implementation plan. These are consolidated into `migration-history/spec.md` as a chronological record.

**Rationale**: Each individual plan is too small for its own capability folder. Grouping them makes the history navigable without cluttering the spec directory.

### Decision 4: Skip MIGRATION_* process logs

`MIGRATION_FINDINGS_APPV2.md`, `MIGRATION_PROGRESS_APPV2.md`, `MIGRATION_SESSION_2_PROGRESS.md`, `MIGRATION_TASKS_APPV2.md`, `MIGRATION_V13_COMPLETION_PLAN.md` are session notes and progress trackers, not behavioral specifications.

**Rationale**: These document process, not system behavior. They have no requirements or scenarios to extract. They remain in `docs/_specs/` as-is.

### Decision 5: Code validation via file existence and pattern matching

For each spec, check that referenced files exist and key patterns (Hook names, function exports, CSS class names) appear in the codebase. Flag any missing files or mismatched identifiers.

**Rationale**: Full behavioral verification would require running the module in Foundry. Static analysis provides a useful first-pass check that can be done during migration without a runtime environment.

## Risks / Trade-offs

- **Risk**: Migrated specs may not perfectly capture all edge cases from the original narrative docs → **Mitigation**: Each spec includes a reference back to the original `docs/_specs/` file for full context
- **Risk**: Code validation may produce false positives if identifiers have changed → **Mitigation**: Validation results are advisory, not blocking; tagged as `[CODE-DEVIATION]` comments in the spec
- **Trade-off**: Consolidating 17 dated plans into one spec loses some granularity → Acceptable since these are historical records, not active specs
