# Change Plan Template

Use this **before** coding when the task touches API contracts, schema, auth, cross-module deps, data migration, external services, or production behavior. Wait for user confirmation when required by governance rules.

---

## Meta

| Field | Value |
|-------|-------|
| Title | |
| Author | |
| Date | |
| Branch (planned) | |
| Related phase (0–7) | |
| Risk level | Low / Medium / High / Critical |

## Goal

What outcome should be true when this change is done?

## Out of scope

Explicit non-goals for this change set.

## Current behavior / baseline

- Entry files:
- Call chain:
- Baseline commands and results:

## Root cause or design need

Hypothesis + evidence (for bugs) or design rationale (for features).

## Proposed changes

| File / module | Responsibility of the change |
|---------------|------------------------------|
| | |

## Architecture check

- [ ] Stays within allowed dependency direction
- [ ] No new cross-layer calls
- [ ] Server ID / Draft→confirm / JWT ownership respected if applicable

## Test plan

| Scenario | Type (unit/contract/e2e) | Pass criteria |
|----------|--------------------------|---------------|
| | | |

## Rollback / recovery

How to undo or mitigate if something goes wrong.

## Docs to update

-

## User confirmation needed?

- [ ] Yes — paused until confirmed  
- [ ] No — reasons:

## Post-change checklist

Link to Definition of Done. Paste real command outputs after implementation.
---
