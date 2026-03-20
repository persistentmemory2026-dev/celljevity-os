# Email Flows — Celljevity Longevity OS

Single source of truth for all transactional email triggers.

## Flow Map

| # | Flow Name | Trigger | Mutation/Action | Recipient | Timing | Guard Rules |
|---|-----------|---------|-----------------|-----------|--------|-------------|
| 1 | **Welcome + Inbox** | Patient created | `patients.create` → `emailActions.createPatientInbox` | Patient email | Immediate | Skip if no email; skip if inbox already exists |
| 2 | **Inbound Processing** | Email received (webhook) | `emailActions.processInboundEmail` | — (inbound) | On receipt | Must match patient by inbox ID |
| 3 | **Quote/Invoice Sent** | Quote status → `"sent"` | `quotes.updateStatus` → `emailActions.sendQuoteEmail` | `quote.customerEmail` | Immediate | Skip if no `customerEmail` |
| 4 | **Patient Invite** | Invite generated | `patients.generateInvite` → `emailActions.sendInviteEmail` | Patient email | Immediate | Skip if no email; link expires in 72h |
| 5 | **Treatment Confirmation** | Treatment created with `scheduledDate` | `treatments.create` → `emailActions.sendTreatmentConfirmation` | Patient email | Immediate | Skip if no `scheduledDate`; skip if no patient email |
| 6 | **Treatment Reminder** | Treatment created with `scheduledDate` | `treatments.create` → `emailActions.sendTreatmentReminder` (scheduled) | Patient email | 24h before `scheduledDate` | Re-fetches treatment; no-op if date changed or status ≠ `"scheduled"` |
| 7 | **Treatment Completed** | Treatment status → `"completed"` | `treatments.update` → `emailActions.sendTreatmentCompleted` | Patient email | Immediate | Skip if no patient email |
| 8 | **Follow-Up** | Treatment completed | `emailActions.sendTreatmentCompleted` → `emailActions.sendFollowUpEmail` (scheduled) | Patient email | 7 days after completion | Re-fetches treatment; no-op if not completed or deleted |
| 9 | **Quote Accepted** | Quote status → `"accepted"` | `quotes.updateStatus` → `emailActions.sendQuoteAccepted` | `quote.customerEmail` | Immediate | Skip if no `customerEmail` |

## Template Details

| Template | Function | Languages | Key Data |
|----------|----------|-----------|----------|
| Welcome | `welcomeEmail()` | en, de, nl, fr, es, it, pt | firstName, lastName, agentmailAddress |
| Quote/Invoice | `quoteEmail()` | en, de, nl, fr, es, it, pt | quoteNumber, type, items, totals |
| Document Received | `documentReceivedNotification()` | en, de, nl, fr, es, it, pt | attachmentCount, senderEmail |
| Invite | `inviteEmail()` | en, de, nl, fr, es, it, pt | firstName, lastName, inviteUrl |
| Treatment Confirmation | `treatmentConfirmationEmail()` | en, de, nl, fr, es, it, pt | firstName, lastName, serviceName, scheduledDate |
| Treatment Reminder | `treatmentReminderEmail()` | en, de, nl, fr, es, it, pt | firstName, lastName, serviceName, scheduledDate |
| Treatment Completed | `treatmentCompletedEmail()` | en, de, nl, fr, es, it, pt | firstName, lastName, serviceName, completedDate, notes |
| Follow-Up | `followUpEmail()` | en, de, nl, fr, es, it, pt | firstName, lastName, serviceName |
| Quote Accepted | `quoteAcceptedEmail()` | en, de, nl, fr, es, it, pt | customerName, quoteNumber, total |

## Mutations That Do NOT Send Emails

| Mutation | Reason |
|----------|--------|
| `treatments.update` (status ≠ `"completed"`) | Only completion triggers email |
| `treatments.remove` | Deletion is internal, no notification |
| `quotes.updateStatus` (status = `"draft"`, `"paid"`, `"cancelled"`) | Only `"sent"` and `"accepted"` trigger emails |
| `quotes.create` | Quote starts as draft, email sent on status change |
| `quotes.remove` | Deletion is internal |
| `patients.update` | Profile updates don't trigger email |
| `biomarkers.create` | Biomarker entry is internal workflow |
| `services.create/update/remove` | Catalog management, no patient notification |

## Infrastructure

- **Email provider:** AgentMail (`agentmail` npm package)
- **Inbox strategy:** Per-patient inboxes (`patient-{lastName}-{initial}-{id}@agentmail.to`), fallback system inboxes for quotes/invites/treatments
- **Logging:** All emails (sent + failed) logged via `internal.emailLog.insert`
- **Scheduling:** Convex `ctx.scheduler.runAfter()` for delayed emails (reminders, follow-ups)
- **Helper functions:** `sendAndLog()` for consistent send + log + error handling, `resolveInbox()` for inbox resolution with fallback

## Adding a New Email Flow

1. Create template function in `convex/emailTemplates.ts` with translations for all 7 languages
2. Add `internalAction` in `convex/emailActions.ts` using `sendAndLog()` helper
3. Add scheduler hook in the relevant mutation (e.g., `ctx.scheduler.runAfter(0, internal.emailActions.yourNewAction, {...})`)
4. Update this document
