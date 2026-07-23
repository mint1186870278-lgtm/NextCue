# Definition of Done

**Language:** English  
**Chinese counterpart:** [DEFINITION_OF_DONE_ZH.md](./DEFINITION_OF_DONE_ZH.md)

A task may be marked done only when **all** of the following hold:

## Function and scope

- [ ] Acceptance criteria met
- [ ] Scope not silently expanded; no unrelated churn in the diff

## Architecture

- [ ] Code respects module boundaries (Page/Feature/Client or Router/Service/Repository)
- [ ] No new cross-layer or reverse dependencies
- [ ] Frontend network I/O only via the unified API Client

## Quality gates

- [ ] Typecheck passes
- [ ] Relevant lint passes (frontend ESLint, etc.; backend Ruff; Python typechecker TBD then required)
- [ ] Related tests pass (Vitest/RTL, pytest; Playwright when E2E is in scope)
- [ ] New bugs have a regression test
- [ ] Tests were not deleted/weakened to “pass”
- [ ] `any` was not used to hide contract problems

## Contracts and data

- [ ] API contract updated (OpenAPI / generated client)
- [ ] DB changes have an Alembic migration when applicable
- [ ] Already-applied migrations were not rewritten
- [ ] Server ID written back and used after create when applicable
- [ ] No double-write paths for the same resource

## Security

- [ ] Auth and resource ownership verified (JWT; not client `user_id`)
- [ ] Unauthenticated / forbidden cases covered
- [ ] Logs exclude tokens, full sensitive chats, or inappropriate PII

## UX honesty

- [ ] Error, loading, and empty states handled
- [ ] No Mock/fallback faking success (including fake Review scores/charts)

## Docs and Git

- [ ] Affected docs updated (ZH/EN formal docs factually aligned)
- [ ] Git diff has no unrelated changes
- [ ] Residual risks recorded

## Ban

Do not claim done with “should work” / “in theory”. Attach real commands and results.
---
