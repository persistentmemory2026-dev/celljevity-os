# Celljevity Longevity OS — InsForge Migration Design

## Context

The Celljevity Longevity OS is a GDPR-compliant healthcare SaaS managing patients through longevity treatment lifecycles. It currently runs as an Express.js + React monorepo on Replit with PostgreSQL, session-based auth, local file storage, and Drizzle ORM.

**Why migrate:** Full platform reset to reduce backend complexity, gain managed infrastructure (auth, storage, real-time, AI), fix 30+ UX/security issues found in audit, and simplify the role model.

**Target:** InsForge BaaS with React template. Replace the entire Express backend with InsForge SDK + edge functions. Redesign the UI from scratch.

---

## Decisions

| Decision | Choice |
|----------|--------|
| Template | InsForge React (Vite) |
| Approach | Incremental migration — feature-by-feature vertical slices |
| Roles | 2: Patient and Staff (was 4) |
| Auth | Email/password + Google OAuth via InsForge |
| CRM | Dropped (leads, quotes removed) |
| Treatment plans | NEW — staff creates from service catalog, exports as invoice PDF |
| AI features | Yes — biomarker interpretation, document summarization, health insights, intake assistant |
| Real-time | Yes — live notifications for both roles |
| CSS | Tailwind v3.4 (InsForge requirement, downgrade from v4) |
| i18n | Keep i18next with namespaced translation files |

---

## 1. Database Schema

### 1.1 Tables (10 total)

#### profiles (NEW — replaces users table)
```sql
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        app_role NOT NULL DEFAULT 'patient',
  first_name  text NOT NULL DEFAULT '',
  last_name   text NOT NULL DEFAULT '',
  avatar_url  text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```
Auto-created via trigger on `auth.users` insert. Role escalation prevented by `prevent_role_self_escalation()` trigger.

#### patients
```sql
CREATE TABLE public.patients (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  celljevity_id     text NOT NULL UNIQUE,
  date_of_birth     date,
  phone             text,
  address           text,
  journey_stage     journey_stage NOT NULL DEFAULT 'ACQUISITION',
  medical_history_summary text,
  assigned_staff_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```
Change: merged `assigned_coordinator_id` + `assigned_provider_id` → single `assigned_staff_id`. `assigned_staff_id` uses `ON DELETE SET NULL` so that when a staff member is deleted from `auth.users`, patient records are preserved and the assignment is cleared instead of blocking deletion or leaving dangling references.

#### documents
```sql
CREATE TABLE public.documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  uploaded_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  document_type   document_type NOT NULL,
  file_name       text NOT NULL,
  storage_key     text NOT NULL,  -- InsForge Storage key
  storage_url     text,           -- InsForge Storage URL for display
  mime_type       text,
  file_size       integer,
  ai_summary      jsonb,          -- cached AI document summary
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```
`uploaded_by` is nullable with `ON DELETE SET NULL` so that when a staff member (or patient) who uploaded documents is deleted from `auth.users`, document rows are preserved for the patient and the uploader reference is cleared, avoiding orphaned rows and allowing normal cleanup (e.g. patient deletion) to proceed.

#### biomarker_results
```sql
CREATE TABLE public.biomarker_results (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  test_date           date NOT NULL,
  biomarker_type      biomarker_type NOT NULL,
  value_numeric       numeric(12,4) NOT NULL,
  unit                text NOT NULL,
  reference_range_min numeric(12,4),
  reference_range_max numeric(12,4),
  status_flag         biomarker_status NOT NULL DEFAULT 'NORMAL',
  entered_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
```
`entered_by` is nullable with `ON DELETE SET NULL` so staff deletion from `auth.users` does not block or orphan biomarker rows; historical records are preserved with the reference cleared.

#### intake_forms
```sql
CREATE TABLE public.intake_forms (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  personal_profile  jsonb DEFAULT '{}',
  medical_history   jsonb DEFAULT '{}',
  consent_data      jsonb DEFAULT '{}',
  is_complete       boolean NOT NULL DEFAULT false,
  completed_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```

#### consent_records (append-only — no UPDATE/DELETE)
```sql
CREATE TABLE public.consent_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  consent_type  consent_type NOT NULL,
  version       text NOT NULL DEFAULT '1.0',
  granted       boolean NOT NULL DEFAULT false,
  ip_address    inet,
  jurisdiction  text,
  granted_at    timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

#### treatment_plans (NEW)
```sql
CREATE TABLE public.treatment_plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title           text NOT NULL,
  notes           text,
  status          treatment_status NOT NULL DEFAULT 'DRAFT',  -- DRAFT, SENT, PAID
  currency        text NOT NULL DEFAULT 'EUR',
  total_amount    numeric(12,2) NOT NULL DEFAULT 0,
  due_date        date,
  paid_at         timestamptz,
  billing_address text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```
`created_by` is nullable with `ON DELETE SET NULL` so staff deletion does not block removal from `auth.users`; plan records are preserved with the creator reference cleared.

#### treatment_plan_items (NEW)
```sql
CREATE TABLE public.treatment_plan_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id             uuid NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  service_id          uuid REFERENCES public.service_catalog(id),
  custom_description  text,
  quantity            integer NOT NULL DEFAULT 1,
  unit_price          numeric(12,2) NOT NULL,
  line_total          numeric(12,2) NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);
```

#### service_catalog (unchanged)
```sql
CREATE TABLE public.service_catalog (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category            service_category NOT NULL,
  name                text NOT NULL,
  default_description text,
  base_price_eur      numeric(12,2) NOT NULL,
  is_active           boolean NOT NULL DEFAULT true,
  is_partner_service  boolean NOT NULL DEFAULT false,
  partner_name        text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
```

#### audit_logs (immutable, no direct access)
```sql
CREATE TABLE public.audit_logs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid REFERENCES auth.users(id),
  action                text NOT NULL,
  target_resource_type  text,
  target_resource_id    text,
  details               jsonb DEFAULT '{}',
  ip_address            inet,
  user_agent            text,
  created_at            timestamptz NOT NULL DEFAULT now()
);
```
Write via `log_audit_event()` SECURITY DEFINER. Read via `read_audit_logs()` staff-only function.

#### ai_responses (NEW — cache)
```sql
CREATE TABLE public.ai_responses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  feature     text NOT NULL,  -- biomarker_interpretation, document_summary, health_insights, intake_assistant
  prompt_hash text NOT NULL,
  response    jsonb NOT NULL,
  model_used  text NOT NULL,
  token_count integer,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);
CREATE INDEX idx_ai_responses_lookup ON public.ai_responses(patient_id, feature, prompt_hash);
CREATE INDEX idx_ai_responses_expires_at ON public.ai_responses(expires_at);
```
Expired rows are removed by a scheduled job that calls `cleanup_expired_ai_responses()` (see §1.3). The index on `expires_at` makes cleanup queries efficient and keeps the table bounded.

### 1.2 Enum Types

```sql
CREATE TYPE app_role AS ENUM ('patient', 'staff');
CREATE TYPE journey_stage AS ENUM ('ACQUISITION', 'INTAKE', 'DIAGNOSTICS', 'PLANNING', 'TREATMENT', 'FOLLOW_UP');
CREATE TYPE document_type AS ENUM ('LAB_RESULT', 'DOCTOR_LETTER', 'SIGNED_CONSENT', 'BIOPSY_REPORT', 'INVOICE_PDF', 'IMAGING', 'OTHER');
CREATE TYPE biomarker_type AS ENUM ('DNA_METHYLATION_AGE', 'TELOMERE_LENGTH', 'NK_CELL_COUNT', 'TUMOR_MARKER_CA125', 'TUMOR_MARKER_PSA', 'LDL_CHOLESTEROL', 'HDL_CHOLESTEROL', 'TRIGLYCERIDES', 'FASTING_GLUCOSE', 'HBA1C', 'CRP', 'VITAMIN_D', 'TESTOSTERONE', 'ESTRADIOL', 'IGF1', 'DHEA_S', 'CORTISOL', 'TSH', 'FREE_T3', 'FREE_T4', 'LIVER_ALT', 'LIVER_AST', 'KIDNEY_CREATININE', 'KIDNEY_GFR', 'OTHER');
CREATE TYPE biomarker_status AS ENUM ('OPTIMAL', 'NORMAL', 'WARNING', 'CRITICAL');
CREATE TYPE consent_type AS ENUM ('DATA_PROCESSING', 'MEDICAL_DATA_SHARING', 'MARKETING_COMMUNICATIONS', 'TERMS_AND_CONDITIONS', 'TREATMENT_CONSENT');
CREATE TYPE service_category AS ENUM ('EXOSOMES', 'PROMETHEUS', 'NK_CELLS', 'DIAGNOSTICS', 'OTHER');
CREATE TYPE treatment_status AS ENUM ('DRAFT', 'SENT', 'PAID');
```

### 1.3 SECURITY DEFINER Helper Functions

```sql
-- Get current user's role (prevents RLS recursion on profiles)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'staff'); $$;

-- Get current user's patient ID
CREATE OR REPLACE FUNCTION public.get_my_patient_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM public.patients WHERE user_id = auth.uid(); $$;

-- Auto-create profile + patient record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_celljevity_id text;
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''), NEW.raw_user_meta_data->>'avatar_url');
  -- Auto-create patient record with generated celljevity_id
  v_celljevity_id := 'CLJ-' || to_char(now(), 'YYYYMMDD') || '-' || substring(gen_random_uuid()::text, 1, 8);
  INSERT INTO public.patients (user_id, celljevity_id)
  VALUES (NEW.id, v_celljevity_id);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Prevent self-role-escalation (exception: bootstrap — self-promotion to staff when zero staff exist)
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.id = auth.uid() AND NEW.role IS DISTINCT FROM OLD.role THEN
    IF NEW.role = 'staff' AND OLD.role = 'patient'
       AND (SELECT count(*) FROM public.profiles WHERE role = 'staff') = 0
    THEN
      NULL;  -- allow first staff bootstrap
    ELSE
      RAISE EXCEPTION 'Cannot change your own role';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER prevent_self_role_change BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();

-- Audit log writer
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text, p_target_resource_type text DEFAULT NULL,
  p_target_resource_id text DEFAULT NULL, p_details jsonb DEFAULT '{}',
  p_ip_address inet DEFAULT NULL, p_user_agent text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, target_resource_type, target_resource_id, details, ip_address, user_agent)
  VALUES (auth.uid(), p_action, p_target_resource_type, p_target_resource_id, p_details, p_ip_address, p_user_agent)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

-- Audit log reader (staff-only)
CREATE OR REPLACE FUNCTION public.read_audit_logs(
  p_limit integer DEFAULT 100, p_offset integer DEFAULT 0,
  p_target_resource_type text DEFAULT NULL, p_target_resource_id text DEFAULT NULL
) RETURNS SETOF public.audit_logs LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_staff() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY SELECT * FROM public.audit_logs
    WHERE (p_target_resource_type IS NULL OR target_resource_type = p_target_resource_type)
      AND (p_target_resource_id IS NULL OR target_resource_id = p_target_resource_id)
    ORDER BY created_at DESC LIMIT p_limit OFFSET p_offset;
END; $$;

-- GDPR data export
CREATE OR REPLACE FUNCTION public.export_my_data()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_patient_id uuid; v_result jsonb;
BEGIN
  SELECT id INTO v_patient_id FROM public.patients WHERE user_id = auth.uid();
  IF v_patient_id IS NULL THEN RETURN '{}'::jsonb; END IF;
  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(p) FROM public.profiles p WHERE p.id = auth.uid()),
    'patient', (SELECT row_to_json(pt) FROM public.patients pt WHERE pt.id = v_patient_id),
    'intake_forms', (SELECT jsonb_agg(row_to_json(i)) FROM public.intake_forms i WHERE i.patient_id = v_patient_id),
    'biomarker_results', (SELECT jsonb_agg(row_to_json(b)) FROM public.biomarker_results b WHERE b.patient_id = v_patient_id),
    'consent_records', (SELECT jsonb_agg(row_to_json(c)) FROM public.consent_records c WHERE c.patient_id = v_patient_id),
    'documents', (SELECT jsonb_agg(row_to_json(d)) FROM public.documents d WHERE d.patient_id = v_patient_id),
    'treatment_plans', (SELECT jsonb_agg(row_to_json(tp)) FROM public.treatment_plans tp WHERE tp.patient_id = v_patient_id)
  ) INTO v_result;
  PERFORM log_audit_event('DATA_EXPORT', 'patient', v_patient_id::text);
  RETURN v_result;
END; $$;

-- Role changes: staff can set any other user's role; self-promotion to staff only when zero staff (bootstrap)
CREATE OR REPLACE FUNCTION public.set_user_role(p_target_user_id uuid, p_role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF is_staff() AND p_target_user_id <> auth.uid() THEN
    UPDATE public.profiles SET role = p_role, updated_at = now() WHERE id = p_target_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  ELSIF p_target_user_id = auth.uid() AND p_role = 'staff' THEN
    IF (SELECT count(*) FROM public.profiles WHERE role = 'staff') <> 0 THEN
      RAISE EXCEPTION 'Self-promotion to staff only allowed when no staff exist (bootstrap)';
    END IF;
    UPDATE public.profiles SET role = 'staff', updated_at = now() WHERE id = p_target_user_id;
  ELSE
    RAISE EXCEPTION 'Not allowed to set this role';
  END IF;
END; $$;

-- Delete expired AI cache rows (call from scheduled job; see §3.1)
CREATE OR REPLACE FUNCTION public.cleanup_expired_ai_responses()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_deleted integer;
BEGIN
  WITH deleted AS (
    DELETE FROM public.ai_responses WHERE expires_at <= now() RETURNING id
  )
  SELECT count(*)::integer INTO v_deleted FROM deleted;
  RETURN v_deleted;
END; $$;
```

**Scheduling:** Run `SELECT public.cleanup_expired_ai_responses();` periodically (e.g. hourly via InsForge cron, pg_cron, or an edge scheduled function) so expired cache entries are removed and table growth stays bounded.

### 1.4 RLS Policies

**Pattern:** Patients see own data, staff sees all. Applied consistently across all patient-linked tables.

```sql
-- PROFILES
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_select_staff" ON public.profiles FOR SELECT USING (is_staff());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_staff" ON public.profiles FOR UPDATE USING (is_staff());

-- PATIENTS
CREATE POLICY "patients_select_own" ON public.patients FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "patients_select_staff" ON public.patients FOR SELECT USING (is_staff());
-- No direct UPDATE policy for patients. Patients use update_own_patient_profile() instead,
-- which restricts editable columns (excludes journey_stage, assigned_staff_id — staff-only per §6.2).
-- See §1.5 for function definition.
CREATE POLICY "patients_insert_own" ON public.patients FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "patients_insert_staff" ON public.patients FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "patients_update_staff" ON public.patients FOR UPDATE USING (is_staff());
CREATE POLICY "patients_delete_staff" ON public.patients FOR DELETE USING (is_staff());

-- DOCUMENTS (patient reads own, staff reads/writes all, patient can upload own)
CREATE POLICY "documents_select_own" ON public.documents FOR SELECT USING (patient_id = get_my_patient_id());
CREATE POLICY "documents_select_staff" ON public.documents FOR SELECT USING (is_staff());
CREATE POLICY "documents_insert_own" ON public.documents FOR INSERT WITH CHECK (patient_id = get_my_patient_id());
CREATE POLICY "documents_insert_staff" ON public.documents FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "documents_update_staff" ON public.documents FOR UPDATE USING (is_staff());
CREATE POLICY "documents_delete_staff" ON public.documents FOR DELETE USING (is_staff());

-- BIOMARKER_RESULTS (patient reads own, only staff writes)
CREATE POLICY "biomarker_select_own" ON public.biomarker_results FOR SELECT USING (patient_id = get_my_patient_id());
CREATE POLICY "biomarker_select_staff" ON public.biomarker_results FOR SELECT USING (is_staff());
CREATE POLICY "biomarker_insert_staff" ON public.biomarker_results FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "biomarker_update_staff" ON public.biomarker_results FOR UPDATE USING (is_staff());
CREATE POLICY "biomarker_delete_staff" ON public.biomarker_results FOR DELETE USING (is_staff());

-- INTAKE_FORMS
CREATE POLICY "intake_select_own" ON public.intake_forms FOR SELECT USING (patient_id = get_my_patient_id());
CREATE POLICY "intake_select_staff" ON public.intake_forms FOR SELECT USING (is_staff());
CREATE POLICY "intake_insert_own" ON public.intake_forms FOR INSERT WITH CHECK (patient_id = get_my_patient_id());
CREATE POLICY "intake_insert_staff" ON public.intake_forms FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "intake_update_own" ON public.intake_forms FOR UPDATE USING (patient_id = get_my_patient_id()) WITH CHECK (patient_id = get_my_patient_id());
CREATE POLICY "intake_update_staff" ON public.intake_forms FOR UPDATE USING (is_staff());

-- CONSENT_RECORDS (append-only: no UPDATE/DELETE for anyone)
CREATE POLICY "consent_select_own" ON public.consent_records FOR SELECT USING (patient_id = get_my_patient_id());
CREATE POLICY "consent_select_staff" ON public.consent_records FOR SELECT USING (is_staff());
CREATE POLICY "consent_insert_own" ON public.consent_records FOR INSERT WITH CHECK (patient_id = get_my_patient_id());
CREATE POLICY "consent_insert_staff" ON public.consent_records FOR INSERT WITH CHECK (is_staff());

-- TREATMENT_PLANS (patient reads own, staff full CRUD)
CREATE POLICY "plans_select_own" ON public.treatment_plans FOR SELECT USING (patient_id = get_my_patient_id());
CREATE POLICY "plans_select_staff" ON public.treatment_plans FOR SELECT USING (is_staff());
CREATE POLICY "plans_insert_staff" ON public.treatment_plans FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "plans_update_staff" ON public.treatment_plans FOR UPDATE USING (is_staff());
CREATE POLICY "plans_delete_staff" ON public.treatment_plans FOR DELETE USING (is_staff());

-- TREATMENT_PLAN_ITEMS (inherits access through plan_id join)
CREATE POLICY "plan_items_select_own" ON public.treatment_plan_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.treatment_plans tp WHERE tp.id = plan_id AND tp.patient_id = get_my_patient_id()));
CREATE POLICY "plan_items_select_staff" ON public.treatment_plan_items FOR SELECT USING (is_staff());
CREATE POLICY "plan_items_insert_staff" ON public.treatment_plan_items FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "plan_items_update_staff" ON public.treatment_plan_items FOR UPDATE USING (is_staff());
CREATE POLICY "plan_items_delete_staff" ON public.treatment_plan_items FOR DELETE USING (is_staff());

-- SERVICE_CATALOG (all authenticated read, staff manages)
CREATE POLICY "catalog_select" ON public.service_catalog FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "catalog_insert_staff" ON public.service_catalog FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "catalog_update_staff" ON public.service_catalog FOR UPDATE USING (is_staff());
CREATE POLICY "catalog_delete_staff" ON public.service_catalog FOR DELETE USING (is_staff());

-- AI_RESPONSES (patient reads own, staff reads all)
CREATE POLICY "ai_select_own" ON public.ai_responses FOR SELECT USING (patient_id = get_my_patient_id());
CREATE POLICY "ai_select_staff" ON public.ai_responses FOR SELECT USING (is_staff());
CREATE POLICY "ai_insert_own" ON public.ai_responses FOR INSERT WITH CHECK (patient_id = get_my_patient_id() OR is_staff());
CREATE POLICY "ai_delete_staff" ON public.ai_responses FOR DELETE USING (is_staff());

-- AUDIT_LOGS: No RLS. Access controlled via REVOKE + SECURITY DEFINER functions.
REVOKE ALL ON public.audit_logs FROM anon, authenticated;
```

### 1.5 Patient Self-Update Function

```sql
-- Patients may only update their own demographic fields.
-- journey_stage and assigned_staff_id are staff-only (§6.2 step 7).
CREATE OR REPLACE FUNCTION public.update_own_patient_profile(
  p_date_of_birth date DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_medical_history_summary text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.patients SET
    date_of_birth = COALESCE(p_date_of_birth, date_of_birth),
    phone = COALESCE(p_phone, phone),
    address = COALESCE(p_address, address),
    medical_history_summary = COALESCE(p_medical_history_summary, medical_history_summary),
    updated_at = now()
  WHERE user_id = auth.uid();
END; $$;
```

---

## 2. Frontend Architecture

### 2.1 Project Structure

Starting from InsForge React template:
```
src/
  components/
    layout/           -- AppLayout, Sidebar, TopBar, PageHeader, MobileNav
    ui/               -- shadcn/ui primitives (migrated from current project)
    shared/           -- DataTable, StatCard, EmptyState, StatusBadge, ErrorBoundary, QueryError, ConfirmDialog
    skeletons/        -- TableSkeleton, CardSkeleton, ChartSkeleton, PageSkeleton
    ai/               -- BiomarkerInsight, DocumentSummary, HealthInsightsWidget, IntakeAssistant
    notifications/    -- NotificationBell, NotificationProvider
  pages/
    Auth/             -- Login, Register, ForgotPassword, ResetPassword
    Patient/          -- Dashboard, Biomarkers, Documents, Intake, Consent, TreatmentPlan, Settings
    Staff/            -- Dashboard, PatientList, PatientDetail, TreatmentPlans, Services, Users, AuditLogs, Settings
  lib/
    api/
      client.ts       -- InsForge SDK client setup
      hooks/          -- useAuth, useBiomarkers, useDocuments, useConsent, useIntake, usePatients, useUsers, useServices, useAuditLogs, useTreatmentPlans, useAi
      errors.ts       -- Typed error codes + ApiError class
      types.ts        -- Shared TypeScript interfaces
    validations/      -- Zod schemas: auth, intake, patient, user, service, biomarker, document, treatmentPlan
  config/
    navigation.ts     -- Config-driven nav items per role
  providers/
    AuthProvider.tsx
    NotificationProvider.tsx
  i18n/
    locales/en/       -- Namespaced: common, auth, patient, staff, biomarkers, documents, intake, consent, ai
```

### 2.2 Page Routes

**Public:**
- `/login`, `/register`, `/forgot-password`, `/reset-password`

**Patient (role: patient):**
- `/` — Dashboard
- `/biomarkers` — Biomarker tracking + AI interpretation
- `/documents` — Document vault + AI summarization
- `/intake` — Multi-step intake wizard + AI assistant
- `/consent` — GDPR consent management + data export
- `/treatment-plan` — View treatment plan + download invoice PDF
- `/settings` — Profile, password change, notification preferences

**Staff (role: staff):**
- `/staff` — Dashboard with patient stats
- `/staff/patients` — Patient list with search, filters, pagination
- `/staff/patients/:id` — Patient detail (tabs: overview, biomarkers, documents, consent, treatment plan)
- `/staff/treatment-plans` — Create/manage treatment plans
- `/staff/services` — Service catalog CRUD
- `/staff/users` — User management
- `/staff/audit` — Audit log viewer
- `/staff/settings` — Admin settings

### 2.3 Data Layer

InsForge SDK adapter hooks replace Orval-generated React Query hooks:

```typescript
// Example: src/lib/api/hooks/useBiomarkers.ts
export function useBiomarkers(patientId: string) {
  return useQuery({
    queryKey: ['biomarkers', patientId],
    queryFn: async () => {
      const { data, error } = await insforge.database
        .from('biomarker_results')
        .select('*')
        .eq('patient_id', patientId)
        .order('test_date', { ascending: false });
      if (error) throw new ApiError(mapErrorCode(error), error.message);
      return data;
    }
  });
}
```

### 2.4 UX Fixes Included

| Issue | Fix |
|-------|-----|
| Missing error states (Consent, Documents, CRM) | QueryError component on every data fetch |
| Missing loading states | Skeleton components per layout type |
| No pagination | DataTable with server-side pagination on all lists |
| Incomplete password reset | Full flow via InsForge auth (code or magic link) |
| Weak form validation | Zod schemas: password strength, phone format, file type + size |
| String-matching errors | Typed ApiError with error codes |
| Missing aria-labels | All icon buttons, loaders, nav items get proper ARIA |
| No error boundaries | 3-layer: global, route, component |
| Silent download failures | Specific error messages with retry |
| Missing skip-to-content | Added to AppLayout |

### 2.5 Reusable Components

- **DataTable** — sorting, pagination, empty/loading/error states (replaces 5+ duplicated table implementations)
- **StatCard** — metric display with icon
- **StatusBadge** — typed badges for biomarker status, treatment status, consent status
- **EmptyState** — icon + message + CTA
- **ErrorBoundary** — catches rendering errors with retry
- **QueryError** — inline error for failed data fetches
- **PasswordInput** — visibility toggle + strength indicator
- **PhoneInput** — format validation
- **FileDropzone** — type + size validation
- **ConfirmDialog** — reusable confirmation dialog

---

## 3. AI Features

### 3.1 Shared Infrastructure

- All AI calls go through InsForge's `insforge.ai.chat.completions.create()`
- Model selection: check `/api/ai/configurations` first, prefer `anthropic/claude-3.5-haiku` for fast tasks, `anthropic/claude-sonnet-4.5` for complex interpretation
- Medical system prompt injected on every call (no diagnostic claims, always disclaimers)
- Responses cached in `ai_responses` table with 24hr TTL; expired rows are removed by a scheduled job calling `cleanup_expired_ai_responses()` (see §1.3 and index `idx_ai_responses_expires_at`).
- Rate limiting: 20/hr patients, 100/hr staff (via edge function)

### 3.2 Features

**Biomarker Interpretation** (`/biomarkers` page)
- On-demand "Get AI Analysis" button
- Sends all readings with reference ranges
- Returns: plain-language explanation, trend direction, recommendations per biomarker
- Collapsible cards below biomarker charts

**Document Summarization** (`/documents` page)
- "Summarize" button on LAB_RESULT, DOCTOR_LETTER, BIOPSY_REPORT
- Returns: key findings, patient-friendly summary, flagged values with severity
- Cached per document, shown inline

**Health Insights Widget** (Patient Dashboard)
- Holistic health overview from all biomarkers + medical history
- Shows: trajectory (improving/stable/declining), areas of concern, recommended actions
- Auto-invalidated when new biomarkers arrive

**Intake Assistant** (`/intake` wizard)
- After medical history step, "Get AI Suggestions" button
- Returns: follow-up questions, pre-fill suggestions, drug interaction flags
- Side panel with accept/dismiss per suggestion

---

## 4. Real-time Notifications

### 4.1 Channel Architecture

| Channel | Subscribers | Events |
|---------|------------|--------|
| `patient:{id}:notifications` | The patient | biomarker added, document reviewed, journey stage changed |
| `staff:notifications` | All staff | intake submitted, document uploaded, consent changed |

### 4.2 Database Triggers

PostgreSQL triggers on `biomarker_results`, `documents`, `intake_forms`, `consent_records` call `realtime.publish(channel, event, payload)` to auto-publish events. Each trigger uses `SECURITY DEFINER` and follows this pattern:

```sql
CREATE OR REPLACE FUNCTION public.notify_biomarker_added()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Invalidate cached health_insights so next dashboard visit gets fresh analysis (§4.4)
  DELETE FROM public.ai_responses
    WHERE patient_id = NEW.patient_id AND feature = 'health_insights';

  -- Publish realtime notifications (best-effort; failure must not roll back the INSERT)
  BEGIN
    PERFORM realtime.publish(
      'patient:' || NEW.patient_id::text || ':notifications',
      'BIOMARKER_ADDED',
      jsonb_build_object('id', NEW.id, 'type', NEW.biomarker_type, 'status', NEW.status_flag)
    );
    PERFORM realtime.publish('staff:notifications', 'BIOMARKER_ADDED',
      jsonb_build_object('patient_id', NEW.patient_id, 'type', NEW.biomarker_type));
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'realtime.publish failed in notify_biomarker_added: %', SQLERRM;
  END;

  RETURN NEW;
END; $$;

CREATE TRIGGER biomarker_realtime AFTER INSERT ON biomarker_results
  FOR EACH ROW EXECUTE FUNCTION notify_biomarker_added();
```

Similar triggers exist for `documents` (AFTER INSERT), `intake_forms` (AFTER UPDATE when `is_complete` changes to true), and `consent_records` (AFTER INSERT). All sibling triggers must wrap `realtime.publish()` calls in `BEGIN ... EXCEPTION WHEN OTHERS` blocks to prevent realtime failures from rolling back the originating DML.

### 4.3 Frontend

- `NotificationProvider` context manages WebSocket lifecycle
- `NotificationBell` in top bar shows unread count
- High-priority events trigger immediate toast (sonner)
- Notifications in-memory for MVP; persistent storage as follow-up

### 4.4 AI Cache Invalidation

Biomarker insert trigger also deletes cached `health_insights` AI responses for the patient, forcing fresh analysis on next dashboard visit.

---

## 5. Storage

### 5.1 InsForge Storage Buckets

| Bucket | Visibility | Purpose |
|--------|-----------|---------|
| `patient-documents` | Private | All uploaded documents (lab results, letters, imaging, etc.) |
| `avatars` | Public | User profile photos |

### 5.2 Bucket Policies

```sql
-- patient-documents bucket: patients upload/read own docs, staff accesses all
-- Upload: patient can only upload to paths matching their patient ID
-- Download: patient can only download from paths matching their patient ID
-- Staff: full access to all paths
```

InsForge storage policies use path-based access control. File paths follow the convention: `{patient_id}/{document_id}/{filename}`. RLS on the `documents` table provides the authorization layer — the storage key is only accessible if the user can read the `documents` row.

### 5.3 Upload Flow

1. Frontend calls `insforge.storage.from('patient-documents').uploadAuto(file)`
2. Gets back `{ url, key }`
3. Saves both to `documents` table
4. Download uses stored `key`: `insforge.storage.from('patient-documents').download(key)`

Replaces the old token-based local filesystem approach entirely.

---

## 6. Auth Flow

### 6.1 InsForge Auth Setup

- Email/password with email verification (code method)
- Google OAuth
- Session management via InsForge (httpOnly cookies)

### 6.2 Registration Flow

1. User registers with email + password + first_name + last_name
2. InsForge sends verification code to email
3. User enters code on same page
4. `handle_new_user()` trigger creates profile with role='patient'
5. `handle_new_user()` trigger also creates a `patients` row with auto-generated `celljevity_id` and `journey_stage = 'ACQUISITION'`
6. Patient can immediately access their dashboard (empty but functional)
7. Staff later assigns themselves via `assigned_staff_id` and advances the journey stage

**Note:** The `patients` row is auto-created on registration so that `get_my_patient_id()` always returns a value for patient-role users. This prevents empty/error states on all patient pages.

### 6.3 Staff Account Creation

Role changes go through `set_user_role(target_user_id, role)` so that the first staff can be created without a circular dependency:

- **By existing staff:** Create user via InsForge auth admin API, then call `SELECT set_user_role(new_user_id, 'staff');` (staff can set any other user's role).
- **Bootstrap (first staff):** When no staff exist, a patient can self-promote by calling `SELECT set_user_role(auth.uid(), 'staff');`; this succeeds only when there are zero staff. Use for initial setup or migrations.

---

## 7. Implementation Sequence

### Phase 1: Project Setup
1. Create InsForge project with React template
2. Set up InsForge SDK client
3. Run all SQL: enums → helper functions (including set_user_role, cleanup_expired_ai_responses) → tables → triggers → RLS → grants
4. Create storage buckets (patient-documents, avatars)
5. Configure auth (email/password + Google OAuth)
6. Migrate shadcn/ui components to new project
7. Set up Tailwind v3.4, i18next, React Router

### Phase 2: Auth + Layout
8. Build auth pages (Login, Register, ForgotPassword, ResetPassword) with RHF+Zod
9. Build AppLayout with Sidebar, TopBar, NotificationBell placeholder
10. Implement AuthProvider with InsForge SDK
11. Config-driven navigation
12. Error boundaries (global + route level)

### Phase 3: Patient Core Pages
13. Patient Dashboard with journey tracker + stat cards + skeletons
14. Biomarkers page with DataTable, charts, pagination
15. Documents page with FileDropzone, download, pagination
16. Intake wizard with multi-step RHF forms
17. Consent page with append-only management + GDPR export

### Phase 4: Staff Pages
18. Staff Dashboard with patient stats
19. Patient list with DataTable, search, filters
20. Patient detail with tabs (overview, biomarkers, documents, consent, treatment plan)
21. User management CRUD
22. Service catalog CRUD
23. Audit log viewer with pagination

### Phase 5: Treatment Plans
24. Treatment plan builder (staff selects services, sets quantities/prices)
25. Patient treatment plan view
26. PDF invoice export (jspdf)

### Phase 6: AI Features
27. Biomarker interpretation
28. Document summarization
29. Health insights dashboard widget
30. Intake form assistant
31. Schedule AI cache cleanup: run `cleanup_expired_ai_responses()` hourly (InsForge cron or edge scheduled function)

### Phase 7: Real-time
32. Database triggers for event publishing
33. NotificationProvider + WebSocket connection
34. NotificationBell UI
35. AI cache invalidation (trigger on biomarker insert)

### Phase 8: Polish
36. Accessibility audit (WCAG 2.1 AA)
37. Full i18n pass for new/changed strings
38. Performance: code splitting per route, lazy loading
39. Seed script for staff accounts (use set_user_role for first staff or bootstrap)

---

## 8. Verification Plan

### Per-Phase Testing
- **Auth**: Register, login, logout, password reset, Google OAuth, email verification
- **Schema**: Verify RLS with test queries as patient vs staff; verify first-staff bootstrap via `set_user_role(auth.uid(), 'staff')` when zero staff
- **Storage**: Upload/download documents, verify bucket permissions
- **Pages**: Each page loads with skeleton → data, handles errors, shows empty states
- **Forms**: Submit with valid/invalid data, verify Zod validation messages
- **Treatment plans**: Create plan, add items, export PDF, verify totals
- **AI**: Trigger each AI feature, verify disclaimer present, check caching
- **Real-time**: Trigger events, verify notifications arrive for correct role
- **Accessibility**: Run axe-core audit, keyboard-only navigation test
- **GDPR**: Test data export function, verify consent append-only behavior

### End-to-End Flow
1. Register as patient → verify email → complete intake
2. Staff logs in → sees intake notification → reviews patient
3. Staff adds biomarker results → patient sees notification
4. Patient views AI interpretation → sees disclaimer + insights
5. Staff creates treatment plan → patient views it → exports PDF
6. Patient requests GDPR export → downloads all data as JSON
