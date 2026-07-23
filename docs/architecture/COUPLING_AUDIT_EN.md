# FocusPal Coupling Audit (Legacy Baseline)

**Language:** English  
**Chinese counterpart:** [COUPLING_AUDIT_ZH.md](./COUPLING_AUDIT_ZH.md)  
**Audit target:** Legacy Baseline in this Canonical Workspace (commit `b84ebe6` and same business code)  
**Nature:** Record coupling; do not refactor inside this document  
**Note:** This workspace is FocusPal development (`origin` → FocusPal). Findings come from the current baseline to guide **in-place** migration. Do **not** probe additional user IDs.

---

## 1. Severity levels

| Level | Meaning |
|-------|---------|
| Critical | Authz/leak risk, data corruption, duplicate writes |
| High | Core flow broken, state drift, contract mismatch |
| Medium | Mixed responsibilities, duplication, hard to test |
| Low | Naming, docs, local readability |

---

## 2. Coupling judgment standard (mandatory)

**File line count is only a Coupling Review Trigger.** It does not by itself prove high coupling, and must not force an automatic split around ~300 lines.

After a trigger, require evidence such as:

- One component mixes UI, networking, state, mapping, and business rules
- One feature change forces edits across unrelated modules
- Multiple sources of truth for the same state
- Components depend on raw backend field details
- API contracts duplicated in many places
- Business logic cannot be tested in isolation
- Circular or reverse dependencies

Each audit record must include:

1. File size (trigger reference)  
2. Number of responsibilities  
3. External dependencies  
4. State ownership  
5. Change blast radius  
6. Testability  
7. Recommended boundary  
8. Handle this round? (all **No** in governance phase)

Split by responsibility, state ownership, and reasons for change.

---

## 3. Critical findings

### C1 — Tasks endpoints lack reliable JWT gate

| Field | Content |
|-------|---------|
| Severity | Critical |
| Statement | Diagnosis found that some Tasks endpoints still accept `user_id` requests without a valid JWT, creating cross-user access/modification risk. We only confirmed the missing reliable auth gate; we did **not** validate leak scope with real third-party user data. |
| Evidence | Legacy frontend passes `user_id` via query/body; observations of unauthenticated requests during diagnosis (no expanded probing) |
| Impact | Authorization model is not trustworthy |
| Recommended boundary | Phase 1: verify Clerk JWT; ownership checks; never trust client `user_id` |
| This round | Do not fix |

### C2 — AI confirm path may double-write

| Field | Content |
|-------|---------|
| Severity | Critical |
| Evidence | Confirm path calls both `sync_tasks` and `tasks/batch` |
| Impact | Duplicate tasks / inconsistent state |
| Recommended boundary | Phase 4: single write after confirm |
| This round | Do not fix |

### C3 — Create success does not write back server ID

| Field | Content |
|-------|---------|
| Severity | Critical |
| Evidence | Create handler ignores server id in response; keeps client temp id |
| Impact | Later update/delete targets wrong resource |
| Recommended boundary | Phase 2: server ID is authoritative and written back |
| This round | Do not fix |

---

## 4. High findings

### H1 — Inconsistent default API base URLs

| Field | Content |
|-------|---------|
| Evidence | One component defaults to local port; others default to remote backend |
| Recommended boundary | Phase 0: unified API Client and env |
| This round | Do not fix |

### H2 — Contract field mismatches

| Field | Content |
|-------|---------|
| Evidence | Timestamps, weekly report, profile, chat envelope differ between frontend expectations and OpenAPI/observed shapes |
| Recommended boundary | Phase 0–2: OpenAPI source of truth + generated TS client + contract tests |
| This round | Do not fix |

### H3 — Pause (and similar) state not persisted

| Field | Content |
|-------|---------|
| Evidence | Pause path updates frontend state only |
| Recommended boundary | Phase 3: Focus Session + persistence |
| This round | Do not fix |

### H4 — Review uses default chart/score as fake success

| Field | Content |
|-------|---------|
| Evidence | On API failure or shape mismatch, UI shows default chart and fixed score |
| Recommended boundary | Phase 5: real data only; explicit error/empty states |
| This round | Do not fix |

---

## 5. Component Coupling Review (trigger + evidence)

Line counts are approximate read-only measurements used as triggers, **not** sufficient proof of high coupling.

### ChatPanel (legacy)

| Dimension | Notes |
|-----------|-------|
| File size | ~1200+ lines (trigger) |
| Responsibilities | UI, send, history assembly, token, parsing, task picker, sync, leftover mock flow |
| External deps | Clerk, same-origin chat proxy, remote sync, dashboard callbacks |
| State ownership | Messages/pendingTasks local; todo list in parent |
| Blast radius | Chat copy, AI contract, task writes, review jump-in |
| Testability | Low (network + UI tangled) |
| Recommended boundary | `features/chat` + API Client; Draft confirm single write |
| Rating | High (mixed duties + double-write risk), not because of line count alone |
| This round | Do not fix |

### ReviewPanel (legacy)

| Dimension | Notes |
|-----------|-------|
| File size | ~900 lines (trigger) |
| Responsibilities | Profile, weekly stats, local filters, charts, push prefs, sign-out |
| External deps | Remote profile/weekly, Clerk, localStorage |
| State ownership | Remote mixed with local fallbacks |
| Testability | Low; failures masked by defaults |
| Recommended boundary | `features/review`; no fake success |
| Rating | High |
| This round | Do not fix |

### TaskModal / dashboard page / TodoList (legacy)

| Dimension | Notes |
|-----------|-------|
| File size | ~400–600 lines each (trigger) |
| Shared issues | Networking + state machine in page/modal; fragile IDs/timestamps; pause not persisted |
| Recommended boundary | `features/tasks` + `features/focus`; unified Client |
| Rating | High / Medium by path |
| This round | Do not fix |

---

## 6. Medium / Low

| Level | Issue | Target phase |
|-------|-------|--------------|
| Medium | No unified API Client; mapping scattered | 0 |
| Medium | Onboarding / chat history local or incomplete | 4 / 6 |
| Low | Legacy Vanilla `src/`, empty demo folder, stale README | docs cleanup / ignore |
| Low | Legacy CI largely non-substantive | 0 |

---

## 7. Historical read-only commands

On the legacy repo: `git remote/status`, directory listing, line counts, `API_URL` search.  
**Do not** probe other user IDs to strengthen conclusions. **Do not** call production write APIs during diagnosis.

---

## 8. Conclusion

Legacy Baseline carries Critical/High engineering risks. Rebuild boundaries **in place** in this Canonical Workspace across Phases 0–7 rather than starting a separate greenfield tree. This audit records only — no business-code edits in the audit task itself.
---
