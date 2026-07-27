# Debug Workflow

**Language:** English  
**Chinese counterpart:** [DEBUG_WORKFLOW_ZH.md](./DEBUG_WORKFLOW_ZH.md)  
**Rule summary:** `.cursor/rules/20-debug-and-validation.mdc`

---

## Step 1: Define

Write down:

- Expected behavior
- Actual behavior
- Reproduction conditions
- Impact scope
- First seen (if known)
- Environment-specific or not

Template: `BUG_REPORT_TEMPLATE.md`

---

## Step 2: Reproduce

- Minimal stable steps
- Save errors, HTTP status codes, relevant logs
- Do not create test data in production
- Prefer local or test databases

During diagnosis/audit: **no** production POST/PUT/PATCH/DELETE.

---

## Step 3: Trace

Follow the real call chain:

```text
User action
→ UI event
→ Frontend state
→ API Client
→ HTTP request
→ Router
→ Service
→ Repository
→ Database / AI Provider
→ Response
→ Frontend parse
→ UI update
```

---

## Step 4: Isolate

Classify: UI / frontend state / API Client / API contract / auth / backend logic / database / AI Provider / deploy or env.

Change only one critical variable at a time.

---

## Step 5: Fix

- Smallest fix that respects architecture boundaries
- No second parallel temporary path
- No fallback that fakes success
- Do not patch database/contract bugs in the UI layer

---

## Step 6: Regression test

Add at least one test that would catch the same class of bug (unit, contract, or E2E as appropriate).

Do not delete or weaken tests to pass gates; do not hide type errors with `any`.

---

## Step 7: Verify

Confirm all of:

- Original bug fixed
- Adjacent flows intact
- `npm run typecheck` passes
- `npm run lint` passes
- `npm test` passes
- `npm run build` when build config changed; use `npm run check` for the full gate
- Error states still surface correctly
- State correct after refresh and re-login

Report **commands actually run** and their results.

---

## Step 8: Document

Record root cause, change, tests, residual risk, and whether follow-up refactor is needed. Use an ADR for lasting decisions.
---
