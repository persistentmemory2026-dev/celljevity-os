# Unified Dashboard UX Spec — Celljevity Longevity OS

**Date:** 2026-03-13
**Status:** Draft
**Target codebase:** `.worktrees/insforge-migration/` (React 19 + Tailwind 3.4 + shadcn/ui)
**Companion spec:** `2026-03-12-insforge-migration-design.md`

---

## 1. Problem Framing

### 1.1 Cognitive Load — Patient Dashboard

The current patient dashboard (`src/pages/Patient/DashboardPage.tsx`) displays journey state **three times**:

1. **JourneyTracker** component (line 38–81) — visual stepper inside a Card
2. **"Journey Stage" StatCard** (line 210–215) — text label of current stage
3. **NextStepCard** (line 83–117) — stage-derived message or CTA

This redundancy forces patients to reconcile three representations of the same information. The JourneyTracker is also wrapped in a Card with a header ("Your Journey"), adding visual weight to what should be ambient context.

### 1.2 Dead-End Stages — Patient Dashboard

The `usePatientStage` hook (`src/hooks/usePatientStage.ts`) defines CTAs for only **2 of 6 stages**:

| Stage | Has CTA? | Current Behavior |
|---|---|---|
| ACQUISITION | Yes | "Start Intake" → `/intake` |
| INTAKE | No | "Your intake is under review..." (passive message) |
| DIAGNOSTICS | No | "Your diagnostic results are being processed..." (passive) |
| PLANNING | No | "Your care team is building your plan..." (passive) |
| TREATMENT | Yes | "View Plan" → `/treatment-plan` |
| FOLLOW_UP | No | "Check back for updates..." (passive) |

4 of 6 stages are dead-ends with no actionable next step, which means most patients see a waiting message with nothing to do.

### 1.3 AI Widget Placement

`HealthInsightsWidget` is rendered on the patient dashboard (line 260–262), making it ambient rather than contextual. It competes for attention with stat cards and biomarker data. The widget would be more useful on the Biomarkers page where patients are already in a health-data mindset.

### 1.4 Staff Dashboard — Stat Card Redundancy

The staff dashboard (`src/pages/Staff/DashboardPage.tsx`) has 3 stat cards (Total Patients, Total Documents, Active Stage) that duplicate information visible in the Patients list and are not actionable beyond "navigate to patients." The "Active Stage" card shows the highest count in any single stage — a metric with no clear clinical value.

### 1.5 Staff PatientDetailPage — Tab Sprawl

`PatientDetailPage.tsx` uses 5 tabs:

1. **Overview** — Patient info + clinical summary (editable)
2. **Biomarkers** — DataTable with add dialog
3. **Documents** — DataTable with upload
4. **Consent** — DataTable (read-only)
5. **Treatment Plan** — Redirect card to `/staff/treatment-plans?patientId=X`

Tab 5 is not a tab — it's a redirect button wrapped in a tab. Tab 4 (Consent) contains a simple read-only table that could be a status row. This creates 5 navigation targets when 2–3 would suffice.

### 1.6 Dashboard / List / Detail Data Overlap (Staff)

Staff see total patient count on the Dashboard stat card, the same count at the top of the Patient list page, and per-patient data on the Detail page. Stage breakdown on Dashboard repeats what the filtered Patient list already shows. The "Recently Updated" section on Dashboard duplicates the default sort of the Patient list.

### 1.7 Navigation Sprawl

Both roles have 7 nav items with no semantic grouping:

- **Patient (7):** Dashboard, Biomarkers, Documents, Intake, Consent, Treatment Plan, Settings
- **Staff (7):** Dashboard, Patients, Treatment Plans, Services, Users, Audit Logs, Settings

Patient nav mixes clinical data (Biomarkers, Documents) with workflow steps (Intake, Consent) and treatment info (Treatment Plan). Staff nav mixes clinical work (Patients, Treatment Plans) with admin (Services, Users, Audit Logs).

---

## 2. User Stories & Success Criteria

### 2.1 Patient Stories

**PS-1: New patient (ACQUISITION)**
> As a new patient, I want a clear first action so I start my health journey immediately.
- Home shows "Start Health Assessment" CTA prominently
- Supporting text explains what the intake involves
- No dead-end messaging

**PS-2: Intake submitted (INTAKE)**
> As a patient who submitted intake, I want something productive to do while waiting.
- Home shows "Upload Additional Documents" CTA → `/my-health` docs tab
- Secondary context: "Intake under review" with expected timeline
- Patient can proactively add health records

**PS-3: Diagnostics in progress (DIAGNOSTICS)**
> As a patient in diagnostics, I want to see what results are available so far.
- Home shows "View Lab Results" CTA → `/my-health` biomarkers tab
- If partial results exist, shows count; if none, explains timeline
- Not a dead-end

**PS-4: Planning phase (PLANNING)**
> As a patient whose plan is being built, I want to review my records while waiting.
- Home shows "Review Your Records" CTA → `/my-health`
- Supporting text: preparation guidance for upcoming treatment

**PS-5: Active treatment (TREATMENT)**
> As a patient on treatment, I want quick access to my plan details.
- Home shows "View Treatment Plan" CTA → `/my-plan`
- Plan summary card visible without click-through

**PS-6: Follow-up (FOLLOW_UP)**
> As a patient in follow-up, I want to see my progress and schedule next steps.
- Home shows "Schedule Follow-Up" CTA → contact/booking action
- Latest biomarker delta (before/after treatment) displayed

### 2.2 Staff Stories

**SS-1: Triage**
> As staff, I want to see which patients need attention right now, ordered by priority.
- Needs-attention queue is the first thing visible on Triage page
- Priority order: unreviewed intakes → diagnostics without biomarkers → planning without treatment plan → unassigned patients
- Each item links directly to the patient

**SS-2: Patient management**
> As staff, I want to edit patient stage and assignment without deep tab navigation.
- Patient detail page shows stage and staff assignment in a persistent sidebar
- Quick-action buttons for common operations (change stage, assign staff)
- No "Edit" toggle required for these fields

**SS-3: Treatment planning**
> As staff, I want treatment plan context inline on the patient detail page.
- Patient detail shows plan summary without navigating away
- Link to full treatment plan builder available inline

**SS-4: Operations**
> As staff, I want admin functions grouped together, not scattered across nav.
- Services, Users, and Audit Logs under single "Operations" nav item
- Tab-based sub-navigation within Operations page

### 2.3 Success Criteria

| Metric | Current | Target |
|---|---|---|
| Patient stages with actionable CTA | 2/6 (33%) | 6/6 (100%) |
| Times journey state displayed per patient dashboard | 3 | 1 (Vitality Line stepper) |
| Patient nav items | 7 | 4 |
| Staff nav items | 7 | 5 |
| Staff PatientDetail tabs | 5 | 0 (2-column layout with 3 collapsible sections) |
| Staff stat cards with clinical value | 1/3 | 0 (moved to Operations) |
| Max high-priority cards before "view more" | Unlimited | 3 |
| Information displayed more than once per page | Yes (stage x3) | No |

---

## 3. Role Workspace IA Remap

### 3.1 Patient Workspace (7 nav → 4 nav)

| Current Nav Item | Current Route | Target Nav Item | Target Route | Change Type | Stage Gate |
|---|---|---|---|---|---|
| Dashboard | `/` | **Home** | `/` | Rename + restructure | — |
| Biomarkers | `/biomarkers` | **My Health** (Tab 1) | `/my-health` | Merge | — |
| Documents | `/documents` | **My Health** (Tab 2) | `/my-health` | Merge | — |
| Intake | `/intake` | _Removed from nav_ | Full-screen modal | Remove from nav | — |
| Consent | `/consent` | **My Plan** (Tab 2) | `/my-plan` | Merge | No stage restriction (preserves current behavior) |
| Treatment Plan | `/treatment-plan` | **My Plan** (Tab 1) | `/my-plan` | Merge | `minStage: TREATMENT` (tab-level, not route-level) |
| Settings | `/settings` | **Settings** | `/settings` | Keep | — |

**Navigation config change:**

```typescript
// BEFORE (navigation.ts)
export const patientNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { label: 'Biomarkers', href: '/biomarkers', icon: 'Activity', minStage: 'DIAGNOSTICS' },
  { label: 'Documents', href: '/documents', icon: 'FileText' },
  { label: 'Intake', href: '/intake', icon: 'ClipboardList' },
  { label: 'Consent', href: '/consent', icon: 'Shield' },
  { label: 'Treatment Plan', href: '/treatment-plan', icon: 'Stethoscope', minStage: 'TREATMENT' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
]

// AFTER
export const patientNavItems: NavItem[] = [
  { label: 'Home', href: '/', icon: 'Home' },
  { label: 'My Health', href: '/my-health', icon: 'HeartPulse' },
  { label: 'My Plan', href: '/my-plan', icon: 'ClipboardCheck' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
]
```

**Tab-level stage gating for `/my-plan`:**

| Tab | `minStage` | Visibility when unavailable | Notes |
|---|---|---|---|
| Consent | _(none)_ | Always visible | Preserves current `/consent` behavior — no stage restriction |
| Treatment Plan | `TREATMENT` | Hidden (not rendered) | Only shown at TREATMENT stage or later |

**Default tab selection:** When both tabs are available (TREATMENT+), default to Treatment Plan. When only Consent is available (pre-TREATMENT), default to Consent. This ensures the most relevant tab is shown first without blocking consent access.

#### 3.1.1 NextActionHub Component

Replaces `NextStepCard` with stage-specific actionable CTAs for all 6 stages:

| Stage | Primary CTA | Button Text | Target Route | Supporting Context |
|---|---|---|---|---|
| ACQUISITION | Start health assessment | "Start Health Assessment" | Opens intake modal | Welcome message + what to expect (3–4 bullet points) |
| INTAKE | Upload additional documents | "Upload Documents" | `/my-health?tab=documents` | "Intake under review" banner + secondary action |
| DIAGNOSTICS | View available lab results | "View Lab Results" | `/my-health?tab=biomarkers` | "Results being processed" + count of available results |
| PLANNING | Review your health records | "Review Records" | `/my-health` | "Team building your plan" + preparation guidance |
| TREATMENT | View treatment plan | "View Treatment Plan" | `/my-plan` | Plan summary card (title, status, total) |
| FOLLOW_UP | Schedule follow-up | "Schedule Follow-Up" | Contact/booking CTA | Latest biomarker delta (before/after comparison) |

**Design:** Full-width card with atmospheric header (see §5.6), stage-specific icon, primary CTA button, and supporting context below. Single component, stage-driven via `usePatientStage` hook.

#### 3.1.2 Patient Dashboard Consolidation

| Current Element | Location | Decision | Target |
|---|---|---|---|
| `PageHeader` ("Welcome back, {name}") | Top | **Keep** | Home page header |
| `IntakeSuccessBanner` | Conditional top | **Keep** | Home page (conditional) |
| `NextStepCard` | Below header | **Replace** | `NextActionHub` (all 6 stages) |
| `JourneyTracker` (in Card wrapper) | Below next step | **Remap** | `VitalityLine` — page-level stepper, no Card wrapper |
| StatCard: "Biomarker Results" | Grid row | **Keep** | Make clickable → `/my-health?tab=biomarkers` |
| StatCard: "Documents" | Grid row | **Keep** | Make clickable → `/my-health?tab=documents` |
| StatCard: "Journey Stage" | Grid row | **Remove** | Redundant with VitalityLine + NextActionHub |
| Card: "Recent Biomarkers" | 2-col grid | **Keep** | Home page |
| `HealthInsightsWidget` | 2-col grid | **Move** | `/my-health` Biomarkers tab (contextual placement) |

**Net change:** 3 stat cards → 2 clickable stat cards. Journey state shown once (VitalityLine). AI widget moves to contextual page.

### 3.2 Staff Workspace (7 nav → 5 nav)

| Current Nav Item | Current Route | Target Nav Item | Target Route | Change Type |
|---|---|---|---|---|
| Dashboard | `/staff` | **Triage** | `/staff` | Rename + restructure |
| Patients | `/staff/patients` | **Patients** | `/staff/patients` | Keep |
| Treatment Plans | `/staff/treatment-plans` | **Treatment Plans** | `/staff/treatment-plans` | Keep |
| Services | `/staff/services` | **Operations** (Tab 1) | `/staff/operations` | Merge |
| Users | `/staff/users` | **Operations** (Tab 2) | `/staff/operations?tab=users` | Merge |
| Audit Logs | `/staff/audit` | **Operations** (Tab 3) | `/staff/operations?tab=audit` | Merge |
| Settings | `/staff/settings` | **Settings** | `/staff/settings` | Keep |

**Navigation config change:**

```typescript
// BEFORE (navigation.ts)
export const staffNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/staff', icon: 'LayoutDashboard' },
  { label: 'Patients', href: '/staff/patients', icon: 'Users' },
  { label: 'Treatment Plans', href: '/staff/treatment-plans', icon: 'Stethoscope' },
  { label: 'Services', href: '/staff/services', icon: 'Package' },
  { label: 'Users', href: '/staff/users', icon: 'UserCog' },
  { label: 'Audit Logs', href: '/staff/audit', icon: 'ScrollText' },
  { label: 'Settings', href: '/staff/settings', icon: 'Settings' },
]

// AFTER
export const staffNavItems: NavItem[] = [
  { label: 'Triage', href: '/staff', icon: 'AlertCircle' },
  { label: 'Patients', href: '/staff/patients', icon: 'Users' },
  { label: 'Treatment Plans', href: '/staff/treatment-plans', icon: 'Stethoscope' },
  { label: 'Operations', href: '/staff/operations', icon: 'Settings2' },
  { label: 'Settings', href: '/staff/settings', icon: 'Settings' },
]
```

#### 3.2.1 TriageHub (replaces Staff Dashboard)

Restructures the current dashboard into a prioritized triage workflow:

**Section 1: Needs Attention Queue** (top of page, priority-ordered)
- Reuses existing `needsAttention` logic from `StaffDashboardPage` (lines 92–135)
- Priority order preserved: unreviewed intakes → diagnostics without biomarkers → planning without treatment plan → unassigned patients
- Each patient name is a link to their detail page
- Shows max 5 per group with "+N more" overflow

**Section 2: Stage Pipeline** (compact horizontal funnel)
- Replaces the current 2×3 grid "Patients by Journey Stage" card
- Horizontal bar/funnel visualization with stage counts
- Each stage segment is clickable → `/staff/patients?stage={STAGE}`
- Color-coded: uses Viridian gradient from early to late stages

**Section 3: Recently Updated** (compact list)
- Last 5 patients, same as current (lines 296–330)
- Compact row format: name, celljevity ID, last updated, stage badge

**Removed elements:**
| Current Element | Decision | Reason |
|---|---|---|
| StatCard: "Total Patients" | **Move** to Operations | Not triage-relevant; available on Patients list |
| StatCard: "Total Documents" | **Move** to Operations | Not triage-relevant |
| StatCard: "Active Stage" | **Remove** | Low-value metric; pipeline view is superior |
| "View All Patients" button in header | **Remove** | Patients nav item serves this purpose |
| "View Audit Logs" button in header | **Remove** | Operations nav item serves this purpose |

#### 3.2.2 PatientDetailPage Remap (5 tabs → 2-column layout)

**Left Sidebar (sticky, ~280px width):**
- Patient identity card: name, celljevity ID, DOB, phone, address
- Journey stage indicator with stage badge + days-in-stage
- Quick actions:
  - Change stage (Select dropdown, inline save)
  - Assign staff (Select dropdown, inline save)
  - No "Edit" / "Cancel" toggle — fields are always interactive

**Main Content (3 collapsible sections):**

**Section 1: Clinical Summary** (default: expanded)
- Merges current Overview tab's "Clinical Summary" card
- Grid layout: current stage + days-in-stage, consent status (N/M granted), biomarker count + last date, treatment plan count
- Consent status row replaces entire Consent tab (tab 4)
- Click consent count → expands inline table of consent records

**Section 2: Records** (default: expanded)
- Sub-tabs: Biomarkers | Documents
- Biomarkers sub-tab: current DataTable + "Add Biomarker" button
- Documents sub-tab: current DataTable + upload controls
- Merges tabs 2 and 3 into sub-tabs within a single collapsible section

**Section 3: Treatment** (default: collapsed if no plans)
- Inline plan summary: title, status badge, total amount, created date
- "Open in Treatment Plan Builder" link → `/staff/treatment-plans?patientId=X`
- Replaces tab 5 (which was just a redirect card)

**Removed tabs:**
| Tab | Decision | Target |
|---|---|---|
| Overview | **Split** | Patient info → left sidebar; Clinical summary → Section 1 |
| Biomarkers | **Merge** | Section 2, Records sub-tab |
| Documents | **Merge** | Section 2, Records sub-tab |
| Consent | **Merge** | Section 1, consent status row with expandable detail |
| Treatment Plan | **Replace** | Section 3, inline summary (not a redirect) |

---

## 4. Consolidation Matrix

### 4.1 Patient Dashboard Elements

| # | Component | Source File | Current Location | Decision | Target Location | Notes |
|---|---|---|---|---|---|---|
| P1 | `PageHeader` | DashboardPage.tsx:175–178 | Dashboard top | **Keep** | Home top | Update title from "Welcome back" to use serif font |
| P2 | `IntakeSuccessBanner` | DashboardPage.tsx:119–133 | Dashboard (conditional) | **Keep** | Home (conditional) | No change to behavior |
| P3 | `NextStepCard` | DashboardPage.tsx:83–117 | Dashboard below header | **Replace** | `NextActionHub` on Home | Expand from 2 CTAs to 6 |
| P4 | `JourneyTracker` | DashboardPage.tsx:38–81 | Dashboard in Card | **Remap** | `VitalityLine` page-level stepper | Remove Card wrapper, add gradient track |
| P5 | StatCard: Biomarker Results | DashboardPage.tsx:198–204 | Dashboard grid | **Keep** | Home grid (clickable) | Add `onClick → /my-health?tab=biomarkers` |
| P6 | StatCard: Documents | DashboardPage.tsx:205–209 | Dashboard grid | **Keep** | Home grid (clickable) | Add `onClick → /my-health?tab=documents` |
| P7 | StatCard: Journey Stage | DashboardPage.tsx:210–215 | Dashboard grid | **Remove** | — | Redundant with VitalityLine + NextActionHub |
| P8 | Card: Recent Biomarkers | DashboardPage.tsx:219–257 | Dashboard 2-col grid | **Keep** | Home below stat cards | No structural change |
| P9 | `HealthInsightsWidget` | DashboardPage.tsx:260–262 | Dashboard 2-col grid | **Move** | `/my-health` Biomarkers tab | Contextual placement |

### 4.2 Patient Navigation Pages

| # | Page | Current Route | Decision | Target |
|---|---|---|---|---|
| P10 | Biomarkers page | `/biomarkers` | **Merge** | `/my-health` Tab 1 (Biomarkers) |
| P11 | Documents page | `/documents` | **Merge** | `/my-health` Tab 2 (Documents) |
| P12 | Intake page | `/intake` | **Remap** | Full-screen modal triggered from Home CTA |
| P13 | Consent page | `/consent` | **Merge** | `/my-plan` Tab 2 (Consent) |
| P14 | Treatment Plan page | `/treatment-plan` | **Merge** | `/my-plan` Tab 1 (Treatment Plan) |
| P15 | Settings page | `/settings` | **Keep** | `/settings` |

### 4.3 Staff Dashboard Elements

| # | Component | Source File | Current Location | Decision | Target Location | Notes |
|---|---|---|---|---|---|---|
| S1 | `PageHeader` | Staff/DashboardPage.tsx:186–198 | Dashboard top | **Remap** | Triage top | Remove action buttons (View All Patients, View Audit Logs) |
| S2 | StatCard: Total Patients | Staff/DashboardPage.tsx:202–207 | Dashboard grid | **Move** | Operations page summary | Not triage-relevant |
| S3 | StatCard: Total Documents | Staff/DashboardPage.tsx:208–214 | Dashboard grid | **Move** | Operations page summary | Not triage-relevant |
| S4 | StatCard: Active Stage | Staff/DashboardPage.tsx:215–222 | Dashboard grid | **Remove** | — | Low-value metric |
| S5 | Card: Needs Attention | Staff/DashboardPage.tsx:226–264 | Dashboard mid | **Keep** | Triage Section 1 | Promoted to top, enhanced priority ordering |
| S6 | Card: Patients by Journey Stage | Staff/DashboardPage.tsx:275–293 | Dashboard mid | **Remap** | Triage Section 2 | Compact horizontal pipeline/funnel |
| S7 | Card: Recently Updated | Staff/DashboardPage.tsx:296–330 | Dashboard bottom | **Keep** | Triage Section 3 | Compact format |

### 4.4 Staff PatientDetailPage Elements

| # | Component | Current Tab | Decision | Target Location |
|---|---|---|---|---|
| S8 | Patient Info card (read mode) | Overview | **Move** | Left sidebar identity card |
| S9 | Patient Info card (edit mode) | Overview | **Remap** | Left sidebar quick actions (always-interactive) |
| S10 | Clinical Summary card | Overview | **Keep** | Main content Section 1 |
| S11 | Biomarker DataTable + Add dialog | Biomarkers | **Move** | Section 2, Records → Biomarkers sub-tab |
| S12 | Documents DataTable + Upload | Documents | **Move** | Section 2, Records → Documents sub-tab |
| S13 | Consent DataTable | Consent | **Merge** | Section 1, consent status row + expandable |
| S14 | Treatment Plan redirect card | Treatment Plan | **Replace** | Section 3, inline plan summary |

### 4.5 Staff Navigation Pages

| # | Page | Current Route | Decision | Target |
|---|---|---|---|---|
| S15 | Staff Dashboard | `/staff` | **Remap** | Triage (`/staff`) |
| S16 | Patient List | `/staff/patients` | **Keep** | `/staff/patients` |
| S17 | Patient Detail | `/staff/patients/:id` | **Restructure** | 2-column layout (see §3.2.2) |
| S18 | Treatment Plans | `/staff/treatment-plans` | **Keep** | `/staff/treatment-plans` |
| S19 | Services | `/staff/services` | **Merge** | `/staff/operations` Tab 1 |
| S20 | Users | `/staff/users` | **Merge** | `/staff/operations` Tab 2 |
| S21 | Audit Logs | `/staff/audit` | **Merge** | `/staff/operations` Tab 3 |
| S22 | Staff Settings | `/staff/settings` | **Keep** | `/staff/settings` |

### 4.6 AI Components

| # | Component | Source File | Current Location | Decision | Target |
|---|---|---|---|---|---|
| A1 | `HealthInsightsWidget` | ai/HealthInsightsWidget.tsx | Patient Dashboard | **Move** | `/my-health` Biomarkers tab |
| A2 | `BiomarkerInsight` | ai/BiomarkerInsight.tsx | Biomarkers page | **Keep** | `/my-health` Biomarkers tab |
| A3 | `DocumentSummary` | ai/DocumentSummary.tsx | Documents page | **Keep** | `/my-health` Documents tab |
| A4 | `IntakeAssistant` | ai/IntakeAssistant.tsx | Intake page | **Keep** | Intake modal |
| A5 | `MedicalDisclaimer` | ai/MedicalDisclaimer.tsx | Various AI outputs | **Keep** | No change |

---

## 5. Frontend Design Direction

### 5.1 Aesthetic Identity

**"Precision wellness."** Calm, exacting, refined — a high-end longevity clinic, not generic SaaS. The visual language communicates clinical authority through typography and warm neutrals, with teal/amber accents creating a sense of vitality and optimism.

The design should feel like stepping into a premium medical consultation room: clean surfaces, deliberate typography, and quiet confidence. Every element earns its place.

### 5.2 Typography

| Usage | Font | Weight | Notes |
|---|---|---|---|
| Display / h1 / h2 | **DM Serif Display** | 400 (regular) | Authoritative transitional serif with scientific precision |
| Body / UI / h3+ | **DM Sans** | 400, 500, 600 | Geometric companion, excellent at small sizes for data-dense views |
| Data values / tables | **DM Sans** | 500 | With `font-variant-numeric: tabular-nums` for aligned columns |

**Typography rules:**
- Max 4 type sizes per view (prevents visual noise)
- Serif (DM Serif Display) used only at h1/h2 level — never in buttons, labels, or body text
- Minimum body size: 14px patient, 12px staff tables
- Line height: 1.5 for body, 1.2 for headings

**Font loading:**
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

**Tailwind config additions:**
```javascript
fontFamily: {
  serif: ['"DM Serif Display"', 'Georgia', 'serif'],
  sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
}
```

### 5.3 Color System

**Core palette (HSL values for CSS custom properties):**

| Token | HSL | Usage |
|---|---|---|
| `--midnight` | `222 47% 15%` | Sidebar background, primary buttons, headings |
| `--midnight-foreground` | `210 40% 98%` | Text on midnight backgrounds |
| `--viridian` | `173 58% 39%` | CTAs, active states, progress indicators, links |
| `--viridian-foreground` | `0 0% 100%` | Text on viridian backgrounds |
| `--saffron` | `38 92% 58%` | Treatment markers, attention indicators, warnings |
| `--saffron-foreground` | `222 47% 15%` | Text on saffron backgrounds |
| `--porcelain` | `210 33% 97%` | Page background surface |
| `--porcelain-deep` | `210 25% 94%` | Subtle surface differentiation |

**Semantic / clinical colors (biomarker status):**

| Status | HSL | Hex Approx. | Usage |
|---|---|---|---|
| OPTIMAL | `152 60% 42%` | #2BAA6E | Optimal biomarker results |
| NORMAL | `210 15% 55%` | #7A8794 | Normal/baseline results (muted, not attention-grabbing) |
| WARNING | `38 92% 50%` | #F5A623 | Amber alert for biomarkers needing attention |
| CRITICAL | `0 72% 51%` | #D94040 | Reserved exclusively for clinical alerts + destructive actions |

**Critical color rule:** `CRITICAL` red is reserved for two contexts only: clinical alert states (biomarker critical status) and destructive UI actions (delete, revoke). Never use red for decorative or informational purposes.

**CSS custom properties (index.css):**

```css
:root {
  /* Existing shadcn variables updated */
  --background: 210 33% 97%;        /* porcelain */
  --foreground: 222 47% 15%;        /* midnight */
  --card: 0 0% 100%;
  --card-foreground: 222 47% 15%;
  --primary: 222 47% 15%;           /* midnight */
  --primary-foreground: 210 40% 98%;
  --secondary: 210 25% 94%;         /* porcelain-deep */
  --secondary-foreground: 222 47% 15%;
  --muted: 210 25% 94%;
  --muted-foreground: 215 16% 47%;
  --accent: 173 58% 39%;            /* viridian */
  --accent-foreground: 0 0% 100%;
  --destructive: 0 72% 51%;         /* clinical red */
  --destructive-foreground: 210 40% 98%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 173 58% 39%;              /* viridian for focus rings */
  --radius: 1rem;                   /* 16px card radius */

  /* Extended tokens */
  --viridian: 173 58% 39%;
  --saffron: 38 92% 58%;
  --midnight: 222 47% 15%;

  /* Clinical status */
  --status-optimal: 152 60% 42%;
  --status-normal: 210 15% 55%;
  --status-warning: 38 92% 50%;
  --status-critical: 0 72% 51%;
}
```

### 5.4 Depth & Elevation

Three shadow levels using Midnight-tinted shadows (not pure black):

```css
:root {
  /* Resting — default card state */
  --shadow-resting: 0 1px 3px hsl(222 47% 15% / 0.06),
                    0 1px 2px hsl(222 47% 15% / 0.04);

  /* Raised — card hover, elevated elements */
  --shadow-raised: 0 4px 12px hsl(222 47% 15% / 0.08),
                   0 2px 4px hsl(222 47% 15% / 0.04);

  /* Floating — modals, popovers, dropdowns */
  --shadow-floating: 0 12px 40px hsl(222 47% 15% / 0.12),
                     0 4px 12px hsl(222 47% 15% / 0.06);
}
```

**Rules:**
- Cards use `--shadow-resting` by default, no border (shadow provides edge definition)
- Inputs use borders (not shadows) — `border-input` variable
- Cards on hover transition to `--shadow-raised`
- Modals, dialogs, and popovers use `--shadow-floating`
- Border radius: `16px` (1rem) for cards, `8px` (0.5rem) for inputs/buttons

### 5.5 Motion (Framer Motion)

Framer Motion is already installed in the project. These specs define the motion language:

**Page transitions:**
```typescript
const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.2, ease: 'easeOut' },
}
```

**Interactive cards:**
```typescript
const cardHover = {
  whileHover: { y: -2 },
  transition: { type: 'spring', stiffness: 400, damping: 25 },
}
```

**Data loading — CSS shimmer skeletons:**
```css
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 0%,
    hsl(var(--muted) / 0.5) 50%,
    hsl(var(--muted)) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Content fade-in (staggered list items):**
```typescript
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
}

const staggerItem = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.15 } },
}

// Max 8 items staggered; beyond that, all appear together
```

**DO NOT animate:**
- Table row content (data appears instantly)
- Form input values
- Numeric values / counters
- Sidebar navigation items (static, always visible)

### 5.6 Distinctive Elements

#### 5.6.1 Vitality Line

Replaces the current `JourneyTracker` component. A page-level stepper (not wrapped in a Card) with a gradient track:

**Visual spec:**
- Horizontal track line with gradient: Midnight → Viridian → Saffron (left to right, following journey progression)
- Stage nodes: 12px circles on the track
  - Completed stages: filled with gradient color at that position
  - Current stage: 12px filled circle with a subtle pulsing glow ring (2px, 20% opacity, `animation: pulse 2s ease-in-out infinite`)
  - Future stages: hollow circle, `border: 2px solid hsl(var(--muted-foreground) / 0.3)`
- Stage labels below nodes: DM Sans 12px, `text-muted-foreground` for past/future, `text-foreground font-medium` for current
- Track height: 3px
- Total component height: ~56px (track + labels + spacing)
- No Card wrapper, no header — renders directly on the page with `margin-bottom: 1.5rem`

```typescript
// Gradient stops for track
const VITALITY_GRADIENT = 'linear-gradient(to right, hsl(var(--midnight)), hsl(var(--viridian)), hsl(var(--saffron)))'
```

#### 5.6.2 Biomarker Status Rings

24px SVG circles that encode biomarker value within reference range as a proportional colored arc:

**Visual spec:**
- 24px × 24px SVG viewport
- Background ring: 2px stroke, `hsl(var(--muted))` — always full circle
- Value arc: 2.5px stroke, color based on status (OPTIMAL green, NORMAL gray, WARNING amber, CRITICAL red)
- Arc proportion: `value_numeric` mapped within `[reference_range_min, reference_range_max]` → 0–100% of circle
  - If no reference range: full ring with status color (fallback to badge-like behavior)
- No text inside the ring (too small) — value shown adjacent

**Usage:** Replace `StatusBadge` for biomarker results in tables and summaries. More information-dense: communicates both the status category (color) and the relative position within reference range (arc length) in 24px.

```typescript
interface StatusRingProps {
  value: number
  min?: number | null
  max?: number | null
  status: 'OPTIMAL' | 'NORMAL' | 'WARNING' | 'CRITICAL'
  size?: number // default 24
}
```

#### 5.6.3 Atmospheric Card Headers

A 4px gradient top border on hero/key cards that creates visual hierarchy:

**Visual spec:**
- 4px height gradient bar at the very top of the card (inside `border-radius`)
- Gradient: `linear-gradient(to right, hsl(var(--viridian)), hsl(var(--viridian) / 0.4))`
- Applied via CSS `::before` pseudo-element or a dedicated wrapper
- Used on maximum 3–5 cards per page (hero cards only):
  - Patient Home: NextActionHub card, Recent Biomarkers card
  - Staff Triage: Needs Attention card
  - Patient Detail: Clinical Summary section header
- Never on every card — the distinction is the point

```css
.card-atmospheric::before {
  content: '';
  display: block;
  height: 4px;
  border-radius: var(--radius) var(--radius) 0 0;
  background: linear-gradient(
    to right,
    hsl(var(--viridian)),
    hsl(var(--viridian) / 0.4)
  );
}
```

### 5.7 Patient vs. Staff Density

| Property | Patient Mode | Staff Mode |
|---|---|---|
| Content max-width | `960px` | `1400px` |
| Body font size | `14px` | `13px` (14px for non-table content) |
| Table font size | `14px` | `12px` |
| Table row height | `44px` | `32px` |
| Card padding | `24px` (p-6) | `16px` (p-4) |
| Spacing between sections | `24px` (space-y-6) | `16px` (space-y-4) |
| Sidebar width | `240px` | `220px` |

Implementation: CSS class on `<body>` or layout wrapper (`data-density="comfortable"` vs `data-density="compact"`), with Tailwind `@apply` or CSS custom properties scoped to density.

---

## 6. Navigation Remap Summary

```
PATIENT (4 items):              STAFF (5 items):
  🏠 Home        /               ⚠️ Triage           /staff
  💚 My Health   /my-health      👥 Patients          /staff/patients
  📋 My Plan     /my-plan        🩺 Treatment Plans   /staff/treatment-plans
  ⚙️ Settings    /settings       🔧 Operations        /staff/operations
                                 ⚙️ Settings          /staff/settings
```

**Route mapping (old → new):**

| Old Route | New Route | Redirect Needed? | Notes |
|---|---|---|---|
| `/` | `/` | No (same path, new content) |
| `/biomarkers` | `/my-health?tab=biomarkers` | Yes |
| `/documents` | `/my-health?tab=documents` | Yes |
| `/intake` | Modal from `/` | Yes (redirect to `/`) |
| `/consent` | `/my-plan?tab=consent` | Yes | `/my-plan` has no route-level stage gate; only the Treatment Plan tab is gated (`minStage: TREATMENT`) |
| `/treatment-plan` | `/my-plan?tab=plan` | Yes | |
| `/settings` | `/settings` | No |
| `/staff` | `/staff` | No (same path, new content) |
| `/staff/patients` | `/staff/patients` | No |
| `/staff/patients/:id` | `/staff/patients/:id` | No (same path, new layout) |
| `/staff/treatment-plans` | `/staff/treatment-plans` | No |
| `/staff/services` | `/staff/operations?tab=services` | Yes |
| `/staff/users` | `/staff/operations?tab=users` | Yes |
| `/staff/audit` | `/staff/operations?tab=audit` | Yes |
| `/staff/settings` | `/staff/settings` | No |

---

## 7. Cognitive Load Guardrails

These constraints apply to all pages in both workspaces:

| Rule | Constraint | Enforcement |
|---|---|---|
| Single primary CTA | Max 1 primary-styled button per viewport | Design review |
| High-priority card limit | Max 3 cards with atmospheric headers before "view more" | Component prop / code review |
| No duplicate information | No data point displayed more than once per page | Consolidation matrix (§4) |
| Exception states pinned | Urgent/error states always at page top, above normal content | Component ordering in JSX |
| AI widgets contextual | AI components render on their data page, not on dashboards | File placement (§4.6) |
| Max stat cards | Max 3 stat cards per page (patient: 2, staff triage: 0) | Design constraint |
| Collapsible sections | Sections beyond the first 2 on any page should be collapsible | `Collapsible` component from shadcn |
| Stage display once | Journey stage shown via VitalityLine only — never in stat cards, headers, or badges simultaneously | Code review |

---

## 8. Phased Implementation

### Phase 1 — Patient Workspace (highest user-facing impact)

| Step | Task | Files Created/Modified | Dependencies |
|---|---|---|---|
| 1.1 | Create `NextActionHub` component with all 6 stage CTAs | `src/components/patient/NextActionHub.tsx` | Update `usePatientStage` hook |
| 1.2 | Update `usePatientStage` to return CTA config for all 6 stages | `src/hooks/usePatientStage.ts` | None |
| 1.3 | Create `VitalityLine` component (page-level stepper with gradient) | `src/components/patient/VitalityLine.tsx` | CSS variables for gradient |
| 1.4 | Create `/my-health` page with tabs: Biomarkers + Documents | `src/pages/Patient/MyHealthPage.tsx` | Existing `useBiomarkers`, `useDocuments` hooks |
| 1.5 | Move `HealthInsightsWidget` to My Health Biomarkers tab | `src/pages/Patient/MyHealthPage.tsx` | Step 1.4 |
| 1.6 | Create `/my-plan` page with tabs: Treatment Plan + Consent | `src/pages/Patient/MyPlanPage.tsx` | Existing hooks |
| 1.7 | Convert Intake from route to full-screen modal dialog | `src/components/patient/IntakeModal.tsx`, modify routing | Existing intake form components |
| 1.8 | Rebuild Home page with NextActionHub + VitalityLine + 2 stat cards + Recent Biomarkers | `src/pages/Patient/DashboardPage.tsx` | Steps 1.1–1.3 |
| 1.9 | Update `navigation.ts` patient nav items (7 → 4) | `src/config/navigation.ts` | Steps 1.4, 1.6 |
| 1.10 | Add route redirects for old paths (`/biomarkers` → `/my-health`, etc.) | Router config | Step 1.9 |

### Phase 2 — Staff Workspace

| Step | Task | Files Created/Modified | Dependencies |
|---|---|---|---|
| 2.1 | Create `TriageHub` page with needs-attention queue + pipeline + recent | `src/pages/Staff/DashboardPage.tsx` (rewrite) | None |
| 2.2 | Create `StagePipeline` component (horizontal funnel) | `src/components/staff/StagePipeline.tsx` | Design tokens |
| 2.3 | Remap `PatientDetailPage` from tabs to 2-column collapsible layout | `src/pages/Staff/PatientDetailPage.tsx` (rewrite) | None |
| 2.4 | Create `PatientSidebar` component (identity + quick actions) | `src/components/staff/PatientSidebar.tsx` | Step 2.3 |
| 2.5 | Create `/staff/operations` page with tabs: Services + Users + Audit Logs | `src/pages/Staff/OperationsPage.tsx` | Existing page components |
| 2.6 | Update `navigation.ts` staff nav items (7 → 5) | `src/config/navigation.ts` | Step 2.5 |
| 2.7 | Add route redirects for old staff paths | Router config | Step 2.6 |

### Phase 3 — Design System

| Step | Task | Files Created/Modified | Dependencies |
|---|---|---|---|
| 3.1 | Font swap: add DM Serif Display + DM Sans, update Tailwind config | `index.html`, `tailwind.config.ts` | None |
| 3.2 | Color system update: CSS custom properties per §5.3 | `src/index.css` | None |
| 3.3 | Shadow/elevation system: add 3 shadow levels | `src/index.css`, `tailwind.config.ts` | Step 3.2 |
| 3.4 | Update Card component: shadow defaults, 16px border-radius, remove default border | `src/components/ui/card.tsx` | Step 3.3 |
| 3.5 | Build `VitalityLine` visual (gradient track, pulse animation) | `src/components/patient/VitalityLine.tsx` | Steps 3.1, 3.2 |
| 3.6 | Build `BiomarkerStatusRing` SVG component | `src/components/shared/BiomarkerStatusRing.tsx` | Step 3.2 |
| 3.7 | Create page transition wrapper with Framer Motion | `src/components/layout/PageTransition.tsx` | None |

### Phase 4 — Polish

| Step | Task | Files Created/Modified | Dependencies |
|---|---|---|---|
| 4.1 | Patient density mode (`data-density="comfortable"`) | `src/index.css`, layout components | Phase 3 |
| 4.2 | Staff density mode (`data-density="compact"`) | `src/index.css`, layout components | Phase 3 |
| 4.3 | Add atmospheric card headers to key cards (max 3–5 per page) | Various page files | Step 3.4 |
| 4.4 | Motion micro-interactions: button press scale, card hover lift | Button and Card components | Step 3.7 |
| 4.5 | Staggered list animations (max 8 items) | List/table components | Step 3.7 |
| 4.6 | Skeleton shimmer update (CSS shimmer with porcelain gradient) | `src/components/skeletons/*` | Step 3.2 |

---

## 9. Acceptance Criteria

- [x] Spec contains prioritized user stories for both roles (§2: 6 patient stories PS-1–PS-6, 4 staff stories SS-1–SS-4)
- [x] Before/after IA map with nav remap (§3: detailed tables with current → target for both roles)
- [x] Every current dashboard element classified as keep/merge/remove/remap (§4: 30 elements across 6 tables)
- [x] Cognitive load guardrails defined with measurable constraints (§7: 8 rules with specific limits)
- [x] Frontend design direction with specific fonts, colors (HSL), motion specs (§5: DM Serif Display + DM Sans, 8 core colors, 4 clinical colors, 3 shadow levels, 4 motion patterns)
- [x] 3 distinctive visual elements specified (§5.6: Vitality Line, Biomarker Status Rings, Atmospheric Card Headers)
- [x] Phased implementation slices — MVP through polish (§8: 4 phases, 24 steps total)
- [x] Implementation-ready for follow-up planning pass (each step has file targets and dependencies)
- [ ] Patients at ACQUISITION, INTAKE, DIAGNOSTICS, PLANNING, and FOLLOW_UP stages can navigate to `/my-plan` and see the Consent tab
- [ ] Treatment Plan tab is only shown/accessible when patient stage is TREATMENT or later
- [ ] `/my-plan` defaults to Consent tab when Treatment Plan tab is unavailable; defaults to Treatment Plan when both tabs are available
