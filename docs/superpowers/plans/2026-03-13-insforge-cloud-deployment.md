# InsForge Cloud Deployment Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the Celljevity Longevity OS to a fresh InsForge cloud instance — database schema, RLS policies, helper functions, triggers, auth config, storage buckets, edge functions, cron schedules, and frontend deployment.

**Architecture:** The Express + Drizzle monorepo backend is fully replaced by InsForge BaaS. The frontend (React/Vite) talks directly to InsForge SDK for auth, database (with RLS), storage, AI, and real-time. Business logic that can't live in RLS/triggers is handled by edge functions.

**Tech Stack:** InsForge BaaS (eu-central), React 19, Vite, Tailwind v3.4, shadcn/ui, React Query, React Hook Form + Zod, i18next, jsPDF

**Source of truth:** Design spec at `docs/superpowers/specs/2026-03-12-insforge-migration-design.md`

**Existing code:** The migration branch (`feature/insforge-migration`) is merged to master. All frontend code lives in the worktree at `.worktrees/insforge-migration/`. Build passes (`npm run build` — 770ms).

**Existing cloud instance:** `Celljevity-os` (wz9awjkn.eu-central.insforge.app) already has the schema deployed. This plan targets a **new** project for clean production deployment.

---

## Chunk 1: Cloud Infrastructure Setup

### Task 1: Create and Link New InsForge Project

**Context:** Create a fresh InsForge project for production deployment. The CLI is already installed and authenticated as `maximilian.zwisler@celljevity.life`.

- [ ] **Step 1: Create new InsForge project**

```bash
insforge create
# When prompted:
#   Name: celljevity-prod
#   Region: eu-central
#   Template: blank
```

- [ ] **Step 2: Verify project is linked**

```bash
insforge current
```

Expected: Shows new project name, appkey, region, and OSS host.

- [ ] **Step 3: Save project config for team reference**

Copy the `oss_host` and `appkey` values from `insforge current` output. These will be needed for env vars.

- [ ] **Step 4: Commit**

```bash
# Don't commit .insforge/project.json — it's gitignored
```

---

### Task 2: Deploy Database Enums and Helper Functions

**Files:**
- Reference: `docs/superpowers/specs/2026-03-12-insforge-migration-design.md` §1.2, §1.3, §1.5

**Context:** Enums and SECURITY DEFINER functions must exist before tables (tables reference enums, triggers reference functions).

- [ ] **Step 1: Create all enum types**

```bash
insforge db query "
CREATE TYPE app_role AS ENUM ('patient', 'staff');
CREATE TYPE journey_stage AS ENUM ('ACQUISITION', 'INTAKE', 'DIAGNOSTICS', 'PLANNING', 'TREATMENT', 'FOLLOW_UP');
CREATE TYPE document_type AS ENUM ('LAB_RESULT', 'DOCTOR_LETTER', 'SIGNED_CONSENT', 'BIOPSY_REPORT', 'INVOICE_PDF', 'IMAGING', 'OTHER');
CREATE TYPE biomarker_type AS ENUM ('DNA_METHYLATION_AGE', 'TELOMERE_LENGTH', 'NK_CELL_COUNT', 'TUMOR_MARKER_CA125', 'TUMOR_MARKER_PSA', 'LDL_CHOLESTEROL', 'HDL_CHOLESTEROL', 'TRIGLYCERIDES', 'FASTING_GLUCOSE', 'HBA1C', 'CRP', 'VITAMIN_D', 'TESTOSTERONE', 'ESTRADIOL', 'IGF1', 'DHEA_S', 'CORTISOL', 'TSH', 'FREE_T3', 'FREE_T4', 'LIVER_ALT', 'LIVER_AST', 'KIDNEY_CREATININE', 'KIDNEY_GFR', 'OTHER');
CREATE TYPE biomarker_status AS ENUM ('OPTIMAL', 'NORMAL', 'WARNING', 'CRITICAL');
CREATE TYPE consent_type AS ENUM ('DATA_PROCESSING', 'MEDICAL_DATA_SHARING', 'MARKETING_COMMUNICATIONS', 'TERMS_AND_CONDITIONS', 'TREATMENT_CONSENT');
CREATE TYPE service_category AS ENUM ('EXOSOMES', 'PROMETHEUS', 'NK_CELLS', 'DIAGNOSTICS', 'OTHER');
CREATE TYPE treatment_status AS ENUM ('DRAFT', 'SENT', 'PAID');
"
```

- [ ] **Step 2: Verify enums exist**

```bash
insforge db query "SELECT typname FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') ORDER BY typname"
```

Expected: 8 enum types listed.

- [ ] **Step 3: Create `is_staff()` helper function**

```bash
insforge db query "
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS \$\$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'staff'); \$\$;
"
```

- [ ] **Step 4: Create `get_my_patient_id()` helper function**

```bash
insforge db query "
CREATE OR REPLACE FUNCTION public.get_my_patient_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS \$\$ SELECT id FROM public.patients WHERE user_id = auth.uid(); \$\$;
"
```

- [ ] **Step 5: Create `handle_new_user()` trigger function**

```bash
insforge db query "
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS \$\$
DECLARE v_celljevity_id text;
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''), NEW.raw_user_meta_data->>'avatar_url');
  v_celljevity_id := 'CLJ-' || to_char(now(), 'YYYYMMDD') || '-' || substring(gen_random_uuid()::text, 1, 8);
  INSERT INTO public.patients (user_id, celljevity_id)
  VALUES (NEW.id, v_celljevity_id);
  RETURN NEW;
END; \$\$;
"
```

- [ ] **Step 6: Create `prevent_role_self_escalation()` function**

```bash
insforge db query "
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS \$\$
BEGIN
  IF NEW.id = auth.uid() AND NEW.role IS DISTINCT FROM OLD.role THEN
    IF NEW.role = 'staff' AND OLD.role = 'patient'
       AND (SELECT count(*) FROM public.profiles WHERE role = 'staff') = 0
    THEN
      NULL;
    ELSE
      RAISE EXCEPTION 'Cannot change your own role';
    END IF;
  END IF;
  RETURN NEW;
END; \$\$;
"
```

- [ ] **Step 7: Create `log_audit_event()` function**

```bash
insforge db query "
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action text, p_target_resource_type text DEFAULT NULL,
  p_target_resource_id text DEFAULT NULL, p_details jsonb DEFAULT '{}',
  p_ip_address inet DEFAULT NULL, p_user_agent text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS \$\$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, target_resource_type, target_resource_id, details, ip_address, user_agent)
  VALUES (auth.uid(), p_action, p_target_resource_type, p_target_resource_id, p_details, p_ip_address, p_user_agent)
  RETURNING id INTO v_id;
  RETURN v_id;
END; \$\$;
"
```

- [ ] **Step 8: Create `read_audit_logs()` function**

```bash
insforge db query "
CREATE OR REPLACE FUNCTION public.read_audit_logs(
  p_limit integer DEFAULT 100, p_offset integer DEFAULT 0,
  p_target_resource_type text DEFAULT NULL, p_target_resource_id text DEFAULT NULL
) RETURNS SETOF public.audit_logs LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS \$\$
BEGIN
  IF NOT is_staff() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY SELECT * FROM public.audit_logs
    WHERE (p_target_resource_type IS NULL OR target_resource_type = p_target_resource_type)
      AND (p_target_resource_id IS NULL OR target_resource_id = p_target_resource_id)
    ORDER BY created_at DESC LIMIT p_limit OFFSET p_offset;
END; \$\$;
"
```

- [ ] **Step 9: Create `export_my_data()` GDPR function**

```bash
insforge db query "
CREATE OR REPLACE FUNCTION public.export_my_data()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS \$\$
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
END; \$\$;
"
```

- [ ] **Step 10: Create `set_user_role()` function**

```bash
insforge db query "
CREATE OR REPLACE FUNCTION public.set_user_role(p_target_user_id uuid, p_role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS \$\$
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
END; \$\$;
"
```

- [ ] **Step 11: Create `cleanup_expired_ai_responses()` function**

```bash
insforge db query "
CREATE OR REPLACE FUNCTION public.cleanup_expired_ai_responses()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS \$\$
DECLARE v_deleted integer;
BEGIN
  WITH deleted AS (
    DELETE FROM public.ai_responses WHERE expires_at <= now() RETURNING id
  )
  SELECT count(*)::integer INTO v_deleted FROM deleted;
  RETURN v_deleted;
END; \$\$;
"
```

- [ ] **Step 12: Create `update_own_patient_profile()` function**

```bash
insforge db query "
CREATE OR REPLACE FUNCTION public.update_own_patient_profile(
  p_date_of_birth date DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_medical_history_summary text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS \$\$
BEGIN
  UPDATE public.patients SET
    date_of_birth = COALESCE(p_date_of_birth, date_of_birth),
    phone = COALESCE(p_phone, phone),
    address = COALESCE(p_address, address),
    medical_history_summary = COALESCE(p_medical_history_summary, medical_history_summary),
    updated_at = now()
  WHERE user_id = auth.uid();
END; \$\$;
"
```

- [ ] **Step 13: Verify all functions exist**

```bash
insforge db functions --json
```

Expected: 9 functions — `is_staff`, `get_my_patient_id`, `handle_new_user`, `prevent_role_self_escalation`, `log_audit_event`, `read_audit_logs`, `export_my_data`, `set_user_role`, `cleanup_expired_ai_responses`, `update_own_patient_profile`.

---

### Task 3: Deploy Database Tables

**Files:**
- Reference: `docs/superpowers/specs/2026-03-12-insforge-migration-design.md` §1.1

**Context:** Create all 11 tables. Order matters — foreign keys reference each other. Profiles and patients first, then dependent tables.

- [ ] **Step 1: Create `profiles` table**

```bash
insforge db query "
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
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
"
```

- [ ] **Step 2: Create `patients` table**

```bash
insforge db query "
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
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
"
```

- [ ] **Step 3: Create `service_catalog` table**

```bash
insforge db query "
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
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
"
```

- [ ] **Step 4: Create `documents` table**

```bash
insforge db query "
CREATE TABLE public.documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  uploaded_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  document_type   document_type NOT NULL,
  file_name       text NOT NULL,
  storage_key     text NOT NULL,
  storage_url     text,
  mime_type       text,
  file_size       integer,
  ai_summary      jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
"
```

- [ ] **Step 5: Create `biomarker_results` table**

```bash
insforge db query "
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
ALTER TABLE public.biomarker_results ENABLE ROW LEVEL SECURITY;
"
```

- [ ] **Step 6: Create `intake_forms` table**

```bash
insforge db query "
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
ALTER TABLE public.intake_forms ENABLE ROW LEVEL SECURITY;
"
```

- [ ] **Step 7: Create `consent_records` table**

```bash
insforge db query "
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
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
"
```

- [ ] **Step 8: Create `treatment_plans` table**

```bash
insforge db query "
CREATE TABLE public.treatment_plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title           text NOT NULL,
  notes           text,
  status          treatment_status NOT NULL DEFAULT 'DRAFT',
  currency        text NOT NULL DEFAULT 'EUR',
  total_amount    numeric(12,2) NOT NULL DEFAULT 0,
  due_date        date,
  paid_at         timestamptz,
  billing_address text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
"
```

- [ ] **Step 9: Create `treatment_plan_items` table**

```bash
insforge db query "
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
ALTER TABLE public.treatment_plan_items ENABLE ROW LEVEL SECURITY;
"
```

- [ ] **Step 10: Create `audit_logs` table**

```bash
insforge db query "
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
REVOKE ALL ON public.audit_logs FROM anon, authenticated;
"
```

Note: audit_logs does NOT use RLS — access is controlled via REVOKE + SECURITY DEFINER functions.

- [ ] **Step 11: Create `ai_responses` table with indexes**

```bash
insforge db query "
CREATE TABLE public.ai_responses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  feature     text NOT NULL,
  prompt_hash text NOT NULL,
  response    jsonb NOT NULL,
  model_used  text NOT NULL,
  token_count integer,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);
ALTER TABLE public.ai_responses ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ai_responses_lookup ON public.ai_responses(patient_id, feature, prompt_hash);
CREATE INDEX idx_ai_responses_expires_at ON public.ai_responses(expires_at);
"
```

- [ ] **Step 12: Verify all 11 tables exist**

```bash
insforge db tables --json
```

Expected: 11 tables — profiles, patients, service_catalog, documents, biomarker_results, intake_forms, consent_records, treatment_plans, treatment_plan_items, audit_logs, ai_responses.

---

### Task 4: Deploy RLS Policies

**Files:**
- Reference: `docs/superpowers/specs/2026-03-12-insforge-migration-design.md` §1.4

**Context:** RLS is already enabled on all tables (from Task 3). Now add the access policies. Pattern: patients see own data, staff sees all.

- [ ] **Step 1: Profiles RLS**

```bash
insforge db query "
CREATE POLICY \"profiles_select_own\" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY \"profiles_select_staff\" ON public.profiles FOR SELECT USING (is_staff());
CREATE POLICY \"profiles_insert_own\" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY \"profiles_update_own\" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY \"profiles_update_staff\" ON public.profiles FOR UPDATE USING (is_staff());
"
```

- [ ] **Step 2: Patients RLS**

```bash
insforge db query "
CREATE POLICY \"patients_select_own\" ON public.patients FOR SELECT USING (user_id = auth.uid());
CREATE POLICY \"patients_select_staff\" ON public.patients FOR SELECT USING (is_staff());
CREATE POLICY \"patients_insert_own\" ON public.patients FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY \"patients_insert_staff\" ON public.patients FOR INSERT WITH CHECK (is_staff());
CREATE POLICY \"patients_update_staff\" ON public.patients FOR UPDATE USING (is_staff());
CREATE POLICY \"patients_delete_staff\" ON public.patients FOR DELETE USING (is_staff());
"
```

- [ ] **Step 3: Documents RLS**

```bash
insforge db query "
CREATE POLICY \"documents_select_own\" ON public.documents FOR SELECT USING (patient_id = get_my_patient_id());
CREATE POLICY \"documents_select_staff\" ON public.documents FOR SELECT USING (is_staff());
CREATE POLICY \"documents_insert_own\" ON public.documents FOR INSERT WITH CHECK (patient_id = get_my_patient_id());
CREATE POLICY \"documents_insert_staff\" ON public.documents FOR INSERT WITH CHECK (is_staff());
CREATE POLICY \"documents_update_staff\" ON public.documents FOR UPDATE USING (is_staff());
CREATE POLICY \"documents_delete_staff\" ON public.documents FOR DELETE USING (is_staff());
"
```

- [ ] **Step 4: Biomarker results RLS**

```bash
insforge db query "
CREATE POLICY \"biomarker_select_own\" ON public.biomarker_results FOR SELECT USING (patient_id = get_my_patient_id());
CREATE POLICY \"biomarker_select_staff\" ON public.biomarker_results FOR SELECT USING (is_staff());
CREATE POLICY \"biomarker_insert_staff\" ON public.biomarker_results FOR INSERT WITH CHECK (is_staff());
CREATE POLICY \"biomarker_update_staff\" ON public.biomarker_results FOR UPDATE USING (is_staff());
CREATE POLICY \"biomarker_delete_staff\" ON public.biomarker_results FOR DELETE USING (is_staff());
"
```

- [ ] **Step 5: Intake forms RLS**

```bash
insforge db query "
CREATE POLICY \"intake_select_own\" ON public.intake_forms FOR SELECT USING (patient_id = get_my_patient_id());
CREATE POLICY \"intake_select_staff\" ON public.intake_forms FOR SELECT USING (is_staff());
CREATE POLICY \"intake_insert_own\" ON public.intake_forms FOR INSERT WITH CHECK (patient_id = get_my_patient_id());
CREATE POLICY \"intake_insert_staff\" ON public.intake_forms FOR INSERT WITH CHECK (is_staff());
CREATE POLICY \"intake_update_own\" ON public.intake_forms FOR UPDATE USING (patient_id = get_my_patient_id()) WITH CHECK (patient_id = get_my_patient_id());
CREATE POLICY \"intake_update_staff\" ON public.intake_forms FOR UPDATE USING (is_staff());
"
```

- [ ] **Step 6: Consent records RLS (append-only)**

```bash
insforge db query "
CREATE POLICY \"consent_select_own\" ON public.consent_records FOR SELECT USING (patient_id = get_my_patient_id());
CREATE POLICY \"consent_select_staff\" ON public.consent_records FOR SELECT USING (is_staff());
CREATE POLICY \"consent_insert_own\" ON public.consent_records FOR INSERT WITH CHECK (patient_id = get_my_patient_id());
CREATE POLICY \"consent_insert_staff\" ON public.consent_records FOR INSERT WITH CHECK (is_staff());
"
```

- [ ] **Step 7: Treatment plans + items RLS**

```bash
insforge db query "
CREATE POLICY \"plans_select_own\" ON public.treatment_plans FOR SELECT USING (patient_id = get_my_patient_id());
CREATE POLICY \"plans_select_staff\" ON public.treatment_plans FOR SELECT USING (is_staff());
CREATE POLICY \"plans_insert_staff\" ON public.treatment_plans FOR INSERT WITH CHECK (is_staff());
CREATE POLICY \"plans_update_staff\" ON public.treatment_plans FOR UPDATE USING (is_staff());
CREATE POLICY \"plans_delete_staff\" ON public.treatment_plans FOR DELETE USING (is_staff());

CREATE POLICY \"plan_items_select_own\" ON public.treatment_plan_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.treatment_plans tp WHERE tp.id = plan_id AND tp.patient_id = get_my_patient_id()));
CREATE POLICY \"plan_items_select_staff\" ON public.treatment_plan_items FOR SELECT USING (is_staff());
CREATE POLICY \"plan_items_insert_staff\" ON public.treatment_plan_items FOR INSERT WITH CHECK (is_staff());
CREATE POLICY \"plan_items_update_staff\" ON public.treatment_plan_items FOR UPDATE USING (is_staff());
CREATE POLICY \"plan_items_delete_staff\" ON public.treatment_plan_items FOR DELETE USING (is_staff());
"
```

- [ ] **Step 8: Service catalog + AI responses RLS**

```bash
insforge db query "
CREATE POLICY \"catalog_select\" ON public.service_catalog FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY \"catalog_insert_staff\" ON public.service_catalog FOR INSERT WITH CHECK (is_staff());
CREATE POLICY \"catalog_update_staff\" ON public.service_catalog FOR UPDATE USING (is_staff());
CREATE POLICY \"catalog_delete_staff\" ON public.service_catalog FOR DELETE USING (is_staff());

CREATE POLICY \"ai_select_own\" ON public.ai_responses FOR SELECT USING (patient_id = get_my_patient_id());
CREATE POLICY \"ai_select_staff\" ON public.ai_responses FOR SELECT USING (is_staff());
CREATE POLICY \"ai_insert_own\" ON public.ai_responses FOR INSERT WITH CHECK (patient_id = get_my_patient_id() OR is_staff());
CREATE POLICY \"ai_delete_staff\" ON public.ai_responses FOR DELETE USING (is_staff());
"
```

- [ ] **Step 9: Verify all policies**

```bash
insforge db policies --json
```

Expected: ~40 policies across all tables.

---

### Task 5: Deploy Database Triggers

**Files:**
- Reference: `docs/superpowers/specs/2026-03-12-insforge-migration-design.md` §1.3, §4.2

- [ ] **Step 1: Create auth trigger (auto-create profile + patient on signup)**

```bash
insforge db query "
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
"
```

- [ ] **Step 2: Create role escalation prevention trigger**

```bash
insforge db query "
CREATE TRIGGER prevent_self_role_change BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();
"
```

- [ ] **Step 3: Create biomarker realtime notification trigger**

```bash
insforge db query "
CREATE OR REPLACE FUNCTION public.notify_biomarker_added()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS \$\$
BEGIN
  DELETE FROM public.ai_responses
    WHERE patient_id = NEW.patient_id AND feature = 'health_insights';
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
END; \$\$;

CREATE TRIGGER biomarker_realtime AFTER INSERT ON biomarker_results
  FOR EACH ROW EXECUTE FUNCTION notify_biomarker_added();
"
```

- [ ] **Step 4: Create document upload notification trigger**

```bash
insforge db query "
CREATE OR REPLACE FUNCTION public.notify_document_uploaded()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS \$\$
BEGIN
  BEGIN
    PERFORM realtime.publish(
      'patient:' || NEW.patient_id::text || ':notifications',
      'DOCUMENT_UPLOADED',
      jsonb_build_object('id', NEW.id, 'type', NEW.document_type, 'file_name', NEW.file_name)
    );
    PERFORM realtime.publish('staff:notifications', 'DOCUMENT_UPLOADED',
      jsonb_build_object('patient_id', NEW.patient_id, 'type', NEW.document_type));
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'realtime.publish failed in notify_document_uploaded: %', SQLERRM;
  END;
  RETURN NEW;
END; \$\$;

CREATE TRIGGER document_realtime AFTER INSERT ON documents
  FOR EACH ROW EXECUTE FUNCTION notify_document_uploaded();
"
```

- [ ] **Step 5: Create intake completion notification trigger**

```bash
insforge db query "
CREATE OR REPLACE FUNCTION public.notify_intake_completed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS \$\$
BEGIN
  IF NEW.is_complete = true AND (OLD.is_complete IS DISTINCT FROM true) THEN
    BEGIN
      PERFORM realtime.publish('staff:notifications', 'INTAKE_COMPLETED',
        jsonb_build_object('patient_id', NEW.patient_id, 'form_id', NEW.id));
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'realtime.publish failed in notify_intake_completed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END; \$\$;

CREATE TRIGGER intake_realtime AFTER UPDATE ON intake_forms
  FOR EACH ROW EXECUTE FUNCTION notify_intake_completed();
"
```

- [ ] **Step 6: Create consent change notification trigger**

```bash
insforge db query "
CREATE OR REPLACE FUNCTION public.notify_consent_changed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS \$\$
BEGIN
  BEGIN
    PERFORM realtime.publish('staff:notifications', 'CONSENT_CHANGED',
      jsonb_build_object('patient_id', NEW.patient_id, 'consent_type', NEW.consent_type, 'granted', NEW.granted));
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'realtime.publish failed in notify_consent_changed: %', SQLERRM;
  END;
  RETURN NEW;
END; \$\$;

CREATE TRIGGER consent_realtime AFTER INSERT ON consent_records
  FOR EACH ROW EXECUTE FUNCTION notify_consent_changed();
"
```

- [ ] **Step 7: Verify all triggers**

```bash
insforge db triggers --json
```

Expected: 6 triggers — `on_auth_user_created`, `prevent_self_role_change`, `biomarker_realtime`, `document_realtime`, `intake_realtime`, `consent_realtime`.

---

### Task 6: Configure Storage Buckets and Realtime Channels

- [ ] **Step 1: Create storage buckets**

```bash
insforge storage create-bucket patient-documents --private
insforge storage create-bucket avatars
```

- [ ] **Step 2: Verify buckets**

```bash
insforge storage buckets
```

Expected: 2 buckets — `patient-documents` (private), `avatars` (public).

- [ ] **Step 3: Create realtime channel patterns**

```bash
insforge db query "
INSERT INTO realtime.channels (pattern, description, enabled) VALUES
  ('patient:%:notifications', 'Per-patient notification channel', true),
  ('staff:notifications', 'Global staff notification channel', true);
"
```

- [ ] **Step 4: Verify channels**

```bash
insforge db query "SELECT pattern, enabled FROM realtime.channels"
```

---

## Chunk 2: Frontend Configuration and Deployment

### Task 7: Configure Frontend Environment

**Files:**
- Modify: `.worktrees/insforge-migration/.env` (or create `.env.local`)
- Reference: `.worktrees/insforge-migration/src/lib/insforge.ts`

**Context:** Point the frontend at the new InsForge project. The SDK client reads from `VITE_INSFORGE_URL` and `VITE_INSFORGE_ANON_KEY`.

- [ ] **Step 1: Get the new project's connection details**

```bash
insforge current --json
```

Note the `oss_host` and `appkey` values.

- [ ] **Step 2: Create `.env.local` with new project credentials**

Create `.env.local` in the project root (not committed to git):

```env
VITE_INSFORGE_URL=https://<appkey>.<region>.insforge.app
VITE_INSFORGE_ANON_KEY=<anon-key-from-insforge-current>
```

- [ ] **Step 3: Verify the SDK client uses these vars**

Read `src/lib/insforge.ts` — it should contain:

```typescript
import { createClient } from '@insforge/sdk'

export const insforge = createClient({
  baseUrl: import.meta.env.VITE_INSFORGE_URL,
  anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY,
})
```

- [ ] **Step 4: Build to verify env vars resolve**

```bash
npm run build
```

Expected: Clean build, no errors.

---

### Task 8: Seed Service Catalog Data

**Context:** The service catalog needs seed data for the treatment plan builder to work. These are the Celljevity longevity services.

- [ ] **Step 1: Seed service catalog**

```bash
insforge db query "
INSERT INTO public.service_catalog (category, name, default_description, base_price_eur, is_active, is_partner_service, partner_name) VALUES
  ('EXOSOMES', 'Exosome Therapy - Standard', 'Standard exosome infusion therapy session', 3500.00, true, false, null),
  ('EXOSOMES', 'Exosome Therapy - Premium', 'Premium exosome therapy with enhanced concentration', 5500.00, true, false, null),
  ('EXOSOMES', 'Exosome Booster', 'Follow-up booster exosome session', 2000.00, true, false, null),
  ('PROMETHEUS', 'Prometheus Protocol - Full', 'Complete Prometheus longevity protocol', 8000.00, true, false, null),
  ('PROMETHEUS', 'Prometheus Protocol - Maintenance', 'Maintenance phase Prometheus protocol', 4500.00, true, false, null),
  ('NK_CELLS', 'NK Cell Therapy - Initial', 'Initial NK cell expansion and infusion', 6000.00, true, true, 'BioCell Labs'),
  ('NK_CELLS', 'NK Cell Therapy - Booster', 'NK cell booster infusion', 3500.00, true, true, 'BioCell Labs'),
  ('NK_CELLS', 'NK Cell Count Analysis', 'Comprehensive NK cell panel analysis', 450.00, true, true, 'BioCell Labs'),
  ('DIAGNOSTICS', 'DNA Methylation Age Test', 'Epigenetic age analysis via DNA methylation', 350.00, true, true, 'TruAge Labs'),
  ('DIAGNOSTICS', 'Telomere Length Analysis', 'Telomere length measurement and analysis', 300.00, true, true, 'TruAge Labs'),
  ('DIAGNOSTICS', 'Full Blood Panel', 'Comprehensive blood biomarker panel', 250.00, true, false, null),
  ('DIAGNOSTICS', 'Hormone Panel', 'Complete hormone level analysis', 280.00, true, false, null),
  ('DIAGNOSTICS', 'Metabolic Panel', 'Metabolic health markers assessment', 220.00, true, false, null),
  ('DIAGNOSTICS', 'Inflammation Markers', 'CRP, cytokines, and inflammation biomarkers', 180.00, true, false, null),
  ('OTHER', 'Consultation - Initial', 'Initial consultation with longevity specialist', 150.00, true, false, null),
  ('OTHER', 'Consultation - Follow-up', 'Follow-up consultation', 100.00, true, false, null);
"
```

- [ ] **Step 2: Verify seed data**

```bash
insforge db query "SELECT category, name, base_price_eur FROM public.service_catalog ORDER BY category, name"
```

Expected: 16 services across 5 categories.

---

### Task 9: Set Up AI Cache Cleanup Schedule

**Context:** The `ai_responses` table needs expired rows cleaned up periodically. Run `cleanup_expired_ai_responses()` hourly.

- [ ] **Step 1: Deploy a cleanup edge function**

Create `insforge/functions/cleanup-ai-cache/index.ts`:

```typescript
export default async function handler(req: Request) {
  // This function is called by the cron schedule
  // It uses the service role to bypass RLS
  const { createClient } = await import('@insforge/sdk');
  const client = createClient({
    baseUrl: Deno.env.get('INSFORGE_URL')!,
    anonKey: Deno.env.get('INSFORGE_SERVICE_ROLE_KEY')!,
  });
  const { data, error } = await client.database.rpc('cleanup_expired_ai_responses');
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ deleted: data }), { status: 200 });
}
```

```bash
insforge functions deploy cleanup-ai-cache
```

- [ ] **Step 2: Create the hourly schedule**

```bash
insforge schedules create \
  --name "Cleanup expired AI cache" \
  --cron "0 * * * *" \
  --url "$(insforge current --json | jq -r .oss_host)/functions/cleanup-ai-cache" \
  --method POST \
  --headers '{"Authorization": "Bearer ${{secrets.API_TOKEN}}"}'
```

- [ ] **Step 3: Verify schedule**

```bash
insforge schedules list
```

Expected: One active schedule for hourly cleanup.

---

### Task 10: Bootstrap First Staff Account and Deploy Frontend

- [ ] **Step 1: Register a user via the app or InsForge auth**

Navigate to the app's registration page or use the SDK to create the first user.

- [ ] **Step 2: Bootstrap first staff account**

After registering, the user has role='patient'. Promote to staff (only works when zero staff exist):

```bash
insforge db query "SELECT set_user_role('<user-uuid>', 'staff')"
```

Get the user UUID from:
```bash
insforge db query "SELECT id, email FROM auth.users LIMIT 5"
```

- [ ] **Step 3: Build frontend**

```bash
npm run build
```

- [ ] **Step 4: Deploy to InsForge hosting**

```bash
insforge deployments deploy ./dist --env "{\"VITE_INSFORGE_URL\": \"$(insforge current --json | jq -r .oss_host)\", \"VITE_INSFORGE_ANON_KEY\": \"$(insforge current --json | jq -r .api_key)\"}"
```

- [ ] **Step 5: Verify deployment**

```bash
insforge deployments list
```

Visit the deployment URL and verify:
1. Login page loads
2. Registration works (creates profile + patient automatically)
3. Staff login shows staff dashboard
4. Patient login shows patient dashboard

---

## Chunk 3: Smoke Test Verification

### Task 11: End-to-End Smoke Test

**Context:** Verify all critical paths work against the new cloud instance per the verification plan in §8 of the design spec.

- [ ] **Step 1: Auth flow**

1. Register a new patient account
2. Verify email verification code arrives
3. Enter code and verify login succeeds
4. Verify profile and patient records auto-created
5. Logout and login again

- [ ] **Step 2: Staff flow**

1. Login as bootstrapped staff account
2. Verify patient list shows registered patient
3. Assign self as staff to patient (`assigned_staff_id`)
4. Advance patient journey stage to INTAKE

- [ ] **Step 3: Intake flow**

1. Login as patient
2. Navigate to intake page
3. Fill personal profile and medical history
4. Complete intake form
5. Verify journey stage advances to DIAGNOSTICS

- [ ] **Step 4: Biomarkers flow**

1. Login as staff
2. Add biomarker result for patient
3. Verify auto-computed status flag
4. Login as patient — verify biomarker visible

- [ ] **Step 5: Documents flow**

1. Login as patient
2. Upload a document
3. Verify it appears in document list
4. Login as staff — verify document visible

- [ ] **Step 6: Treatment plans flow**

1. Login as staff
2. Create treatment plan for patient
3. Add line items from service catalog
4. Verify total auto-calculates
5. Login as patient — verify plan visible

- [ ] **Step 7: GDPR data export**

1. Login as patient
2. Trigger data export (calls `export_my_data()`)
3. Verify JSON contains profile, patient, intake, biomarkers, consent, documents

- [ ] **Step 8: Consent flow**

1. Login as patient
2. Grant a consent record
3. Verify it appears in consent list
4. Grant a revocation (append new record with `granted=false`)

- [ ] **Step 9: Real-time notifications**

1. Open patient dashboard in one browser
2. Login as staff in another browser
3. Staff adds biomarker → patient sees notification toast

- [ ] **Step 10: AI features**

1. Login as patient with biomarker data
2. Click "Get AI Analysis" on biomarkers page
3. Verify AI response appears with medical disclaimer
4. Verify response is cached in `ai_responses` table
