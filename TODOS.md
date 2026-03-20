# TODOS

## P1 — Critical

_(none currently)_

## P2 — Important

### Biomarker Alert System
**What:** Flag abnormal biomarker values (outside reference range) as critical action items in the coordinator dashboard.
**Why:** Currently action items are operational (overdue treatments, pending reviews). Adding clinical intelligence (abnormal CRP, low Vitamin D) makes the command center medically useful, not just administratively useful.
**Pros:** High clinical value, zero new tables, uses existing reference ranges from biomarkerDefinitions.
**Cons:** Requires defining severity thresholds beyond simple in/out of range (slightly out vs dangerously out).
**Context:** The `dashboard.getActionItems` query already aggregates from 5 tables. Adding biomarker range checks is a ~20-line addition to that query. Reference ranges exist in `convex/biomarkerDefinitions.ts` (37 biomarkers, 12 categories).
**Effort:** S (human: 2 days / CC: 30 min)
**Priority:** P2
**Depends on:** Dashboard action items query (exists)

### GDPR Email Unsubscribe
**What:** Add unsubscribe mechanism for non-essential emails (re-engagement, marketing).
**Why:** GDPR requires opt-out capability for non-essential communications. Current transactional emails (appointment confirmations, treatment summaries) are covered under "legitimate interest," but marketing-style emails (re-engagement, newsletters) require explicit consent and unsubscribe.
**Pros:** GDPR compliance, patient trust, avoids legal risk.
**Cons:** Adds email preference schema + unsubscribe link handling.
**Context:** The email system (`emailActions.ts`) currently sends all emails unconditionally. Need: (1) email preferences field on patients table, (2) unsubscribe link in non-transactional emails, (3) preference management in patient profile.
**Effort:** M (human: 1 week / CC: 30 min)
**Priority:** P2
**Depends on:** Transactional email workflows (in progress)
**Blocked by:** Must be done BEFORE implementing re-engagement or marketing emails

### Observability Foundation
**What:** Add error tracking (Sentry or similar) and structured logging to Convex functions.
**Why:** Zero observability on a healthcare product with paying customers means production bugs are invisible until users report them. Can't debug what you can't see.
**Pros:** Catch errors before users report them, production debugging, incident response.
**Cons:** Adds a dependency (Sentry), minor runtime overhead.
**Context:** No logging, metrics, or error tracking exists anywhere in the codebase. Convex functions silently fail. Frontend errors go unreported.
**Effort:** M (human: 1 week / CC: 30 min)
**Priority:** P2
**Depends on:** Nothing

## P3 — Nice to Have

### Email Queue Upgrade Path
**What:** Upgrade from Convex scheduler-based email scheduling to a persistent `emailQueue` table with retry logic.
**Why:** The current approach uses `ctx.scheduler.runAfter/runAt` for delayed emails. If Convex's scheduler fails during execution (infrastructure outage), the email is silently lost with no retry. At low volume this is acceptable; at 100+ daily emails or for critical reminders (appointment confirmations that MUST arrive), a persistent queue with retry/dead-letter tracking is needed.
**Pros:** Reliable delivery, retry on failure, audit trail of all scheduled sends, dead-letter queue for failed emails.
**Cons:** New `emailQueue` table, scheduled processor function, migration of existing scheduler calls.
**Context:** This is the natural evolution from Approach A (extend existing pattern) to Approach B (full queue architecture) as described in the eng review. The `sendAndLog` helper already centralizes send+log logic — the queue would wrap it.
**Effort:** M (human: 1.5 weeks / CC: 1 hour)
**Priority:** P3
**Depends on:** Scale — only needed when email volume or reliability requirements increase

### Action Item Pagination
**What:** Add virtual scrolling or "show top 20 + load more" to the coordinator dashboard action items.
**Why:** A clinic with 100+ patients could generate 200+ action items, causing a slow and overwhelming UI.
**Pros:** Better performance and UX at scale.
**Cons:** Adds complexity to a currently simple list render.
**Context:** Currently `Dashboard.tsx` renders all action items from `dashboard.getActionItems` in a flat list. Fine at <50 items, degrades beyond that.
**Effort:** S (human: 1 day / CC: 15 min)
**Priority:** P3
**Depends on:** Scale — only matters at 50+ patients
