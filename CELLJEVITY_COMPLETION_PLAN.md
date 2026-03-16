# Celljevity OS - Fertigstellungsplan

## 📊 Aktueller Status

**GitHub Repo:** https://github.com/persistentmemory2026-dev/celljevity-os

### ✅ Bereits vorhanden:
- [x] Monorepo Struktur (pnpm workspaces)
- [x] Express 5 API Server Grundgerüst
- [x] React 19 + Vite 7 Frontend Setup
- [x] PostgreSQL + Drizzle ORM Konfiguration
- [x] Session-basierte Auth Middleware
- [x] RBAC (Role-Based Access Control) Middleware
- [x] Audit Logging Middleware (GDPR-konform)
- [x] Mockup Sandbox für UI-Komponenten
- [x] TypeScript 5.9 Konfiguration

### ❌ Fehlend/Kritisch:
- [ ] Datenbank Schema (13 Tabellen)
- [ ] API Routes/Endpoints
- [ ] Frontend Pages & Components
- [ ] Database Seed Daten
- [ ] API Spec (OpenAPI)
- [ ] Generated API Client
- [ ] Tests
- [ ] Deployment Konfiguration

---

## 🎯 Fertigstellungsplan

### Phase 1: Datenbank & Backend Foundation (Woche 1)

#### 1.1 Datenbank Schema (Kritisch)
**Datei:** `lib/db/src/schema/`

Zu erstellende Tabellen:
1. **users** - id, email, password_hash, role, created_at, updated_at
2. **patients** - id, user_id, celljevity_id, journey_stage, created_at
3. **leads** - id, email, source, status, converted_at, created_at
4. **service_catalog** - id, name, category, description, price, active
5. **quotes** - id, patient_id, quote_number, status, total_amount, created_at
6. **invoice_line_items** - id, quote_id, service_id, quantity, unit_price
7. **documents** - id, patient_id, category, filename, storage_key, uploaded_at
8. **document_tokens** - id, document_id, token, expires_at, used_at
9. **audit_logs** - id, user_id, action, entity_type, entity_id, before, after, created_at
10. **security_events** - id, user_id, event_type, ip_address, user_agent, created_at
11. **biomarker_results** - id, patient_id, test_type, results_json, test_date, created_at
12. **intake_forms** - id, patient_id, form_version, form_data, submitted_at
13. **consent_records** - id, patient_id, consent_type, granted, revoked_at, created_at

#### 1.2 API Routes
**Datei:** `artifacts/api-server/src/routes/`

Zu erstellende Endpoints:
- `POST /auth/login` - Login mit Session
- `POST /auth/logout` - Logout
- `GET /auth/me` - Aktueller User
- `GET /patients` - Patientenliste (mit Filter/Pagination)
- `POST /patients` - Neuen Patienten anlegen
- `GET /patients/:id` - Patientendetails
- `PUT /patients/:id` - Patient aktualisieren
- `GET /services` - Service Catalog
- `POST /quotes` - Angebot erstellen
- `GET /quotes/:id` - Angebot anzeigen
- `GET /documents` - Dokumentenliste
- `POST /documents` - Dokument hochladen
- `GET /biomarkers/:patientId` - Biomarker Daten
- `POST /biomarkers` - Biomarker hinzufügen

#### 1.3 Database Seeding
**Datei:** `lib/db/src/seed.ts`

- Admin User erstellen
- Beispiel Services im Catalog
- Test-Patienten
- Beispiel Biomarker-Daten

---

### Phase 2: API Spezifikation & Client (Woche 1-2)

#### 2.1 OpenAPI Spec
**Datei:** `lib/api-spec/openapi.yaml`

- Alle Endpoints dokumentieren
- Request/Response Schemas
- Auth Requirements
- Error Responses

#### 2.2 Generated API Client
**Befehl:** `pnpm --filter @workspace/api-spec codegen`

- React Query Hooks generieren
- Zod Schemas validieren
- TypeScript Types

---

### Phase 3: Frontend Implementation (Woche 2-3)

#### 3.1 Auth & Layout
**Dateien:** `artifacts/celljevity-app/src/`

- Login Page
- Auth Context/Provider
- Layout mit Navigation
- Role-based Navigation Items

#### 3.2 Patient Management
- Patientenliste (Table mit Filter)
- Patient Detail View
- Patient Anlegen Form
- Patient Bearbeiten

#### 3.3 Service Catalog
- Services Liste
- Service Detail
- Preisübersicht

#### 3.4 Quotes & Invoices
- Angebot erstellen Wizard
- Angebotsübersicht
- PDF Export (Invoice)

#### 3.5 Document Vault
- Dokumentenübersicht
- Upload Dialog
- Download mit Token
- Kategorie-Filter

#### 3.6 Biomarker Tracking
- Biomarker Dashboard
- Charts (Verlauf)
- Neue Messung eintragen
- PDF Report Export

#### 3.7 Intake Forms
- Digitale Formulare
- Dynamic Forms (basierend auf Service)
- Form Validation

---

### Phase 4: Sicherheit & Compliance (Woche 3)

#### 4.1 GDPR Features
- Consent Management UI
- Daten-Export (Right to portability)
- Daten-Löschung (Right to be forgotten)
- Audit Log Viewer (Admin)

#### 4.2 Security Hardening
- Rate Limiting
- CSRF Protection
- Input Sanitization
- Secure Headers

---

### Phase 5: Testing & Deployment (Woche 4)

#### 5.1 Testing
- Unit Tests (Vitest)
- API Integration Tests
- E2E Tests (Playwright)

#### 5.2 Deployment
- Fly.io Konfiguration
- Environment Variables
- Database Migration Strategy
- Backup Setup

---

## 🛠️ Tech Stack Details

### Backend
- **Runtime:** Node.js 24
- **Framework:** Express 5
- **Database:** PostgreSQL 15+
- **ORM:** Drizzle ORM
- **Auth:** express-session + connect-pg-simple + bcrypt
- **Validation:** Zod v4
- **Build:** esbuild

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui (Radix primitives)
- **State Management:** React Query (TanStack Query)
- **Routing:** React Router v7
- **Forms:** React Hook Form + Zod

### Monorepo
- **Package Manager:** pnpm 9+
- **Workspaces:** 5 Packages
  - `@workspace/db` - Database schema & connection
  - `@workspace/api-server` - Express backend
  - `@workspace/celljevity-app` - React frontend
  - `@workspace/api-spec` - OpenAPI spec
  - `@workspace/api-client-react` - Generated React Query hooks

---

## 📋 Prioritäten

### P0 (Kritisch - MVP Blocker)
1. Datenbank Schema erstellen
2. Core API Endpoints (Auth, Patients, Services)
3. Basic Frontend (Login, Patient List)
4. Database Seeding

### P1 (Wichtig - MVP Complete)
5. Quotes & Invoices
6. Document Vault
7. Biomarker Tracking
8. Intake Forms

### P2 (Nice to have)
9. GDPR Export/Delete
10. Advanced Analytics
11. Email Notifications
12. Mobile Optimization

---

## 🚀 Schnellstart (für Entwicklung)

```bash
# 1. Repo klonen
git clone https://github.com/persistentmemory2026-dev/celljevity-os.git
cd celljevity-os

# 2. Dependencies installieren
pnpm install

# 3. Environment setup
cp .env.example .env
# DATABASE_URL, SESSION_SECRET eintragen

# 4. Datenbank setup
pnpm --filter @workspace/db push

# 5. Seed Daten
pnpm run db:seed

# 6. Development starten
# Terminal 1:
pnpm --filter @workspace/api-server dev

# Terminal 2:
pnpm --filter @workspace/celljevity-app dev
```

---

## 📊 Geschätzter Aufwand

| Phase | Aufwand | Timeline |
|-------|---------|----------|
| Phase 1: Database & Backend | 3-4 Tage | Woche 1 |
| Phase 2: API Spec & Client | 2-3 Tage | Woche 1-2 |
| Phase 3: Frontend | 5-7 Tage | Woche 2-3 |
| Phase 4: Security & GDPR | 2-3 Tage | Woche 3 |
| Phase 5: Testing & Deploy | 2-3 Tage | Woche 4 |
| **Gesamt** | **14-20 Tage** | **4 Wochen** |

---

## ❓ Offene Fragen

1. **Zahlungsintegration?** (Stripe?)
2. **Email Service?** (SendGrid? AWS SES?)
3. **File Storage?** (S3? Cloudflare R2?)
4. **Monitoring?** (Sentry? Datadog?)
5. **Backup Strategy?** (automated? manual?)
6. **Multi-language Support?** (i18n für DE/EN?)

---

**Nächster Schritt:** Phase 1.1 - Datenbank Schema erstellen?
