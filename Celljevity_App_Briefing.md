# Celljevity Longevity OS — User Briefing & Slide Deck Guide

---

## Slide 1: Title

**Celljevity Longevity OS**
A GDPR-compliant healthcare platform for patient management, biomarker tracking, service catalog, quoting & invoicing, and document management.

---

## Slide 2: Who Is It For?

Four user roles with tailored access:

| Role | Access |
|------|--------|
| **Super Admin** | Full system access — user management, service configuration, all features |
| **Medical Provider** | Patient care, treatments, biomarkers, documents |
| **Care Coordinator** | Patient coordination, quotes, itineraries, communication |
| **Patient** | Personal portal access (future scope) |

---

## Slide 3: Logging In

- Navigate to the app URL in your browser
- Enter your **email** and **password**
- Your session is remembered — you stay logged in until you sign out
- Role-based navigation appears automatically after login

---

## Slide 4: The Dashboard — Your Home Screen

After login, you land on the **Dashboard**, which gives you an at-a-glance overview:

- **Total Quotes** — number of quotes created
- **Total Invoices** — number of invoices generated
- **Total Documents** — files in the document vault
- **Total Patients** — patients in the system
- **Total Revenue** — sum of all paid invoices (EUR)

Additional dashboard features:
- **Onboarding Checklist** (4 steps to get started)
- **Quick Actions** — jump to common tasks
- **Recent Quotes** — your 5 most recent quotes
- **Status Breakdown** — visual chart of quote/invoice statuses

---

## Slide 5: Getting Started — Onboarding Checklist

The dashboard includes a guided setup to help new users:

1. **Browse Services** — explore the service catalog
2. **Add a Patient** — register your first patient
3. **Create a Quote** — build your first quote or invoice
4. **Upload a Document** — store your first file

Each step links directly to the relevant page.

---

## Slide 6: Managing Patients

**Patients** is the central hub for all patient records.

### Viewing Patients
- Searchable list (search by first or last name)
- Filter by status: **All**, **Active**, **Inactive**, **Archived**
- See name, email, date of birth, phone, and status at a glance

### Creating a Patient
Click **"Add Patient"** and fill in:
- First Name & Last Name (required)
- Email, Phone, Date of Birth, Gender
- Address (Street, Postal Code, City, Country)
- Insurance Number
- Notes & Language Preference

### Editing & Archiving
- Click the edit icon to update any patient field
- Archive patients to remove them from the active list without deleting data

---

## Slide 7: Patient Detail — The Full Profile

Click any patient to open their **detailed profile** with 6 tabs:

| Tab | What It Shows |
|-----|---------------|
| **Master Data** | All demographics, contact info, insurance, notes — editable inline |
| **Treatments** | Schedule and track treatments from the service catalog |
| **Documents** | Patient-linked files — upload, filter by category |
| **Biomarkers** | Health metric tracking with charts, trends, and reference ranges |
| **Itinerary** | Medical travel planning with multi-day care journeys |
| **Emails** | Full communication history (inbound & outbound) |

---

## Slide 8: Biomarker Tracking

Track patient health metrics over time:

- **Pre-defined biomarker categories** with standard reference ranges
- **Manual entry** of biomarker values
- **AI-powered extraction** from uploaded lab reports (via Gemini)
- **Chart visualization** showing trends over time
- **Comparison to reference ranges** — see at a glance if values are normal
- **PDF export** of biomarker reports

---

## Slide 9: The Service Catalog

Browse all available medical services:

- **Grid view** with search and category filtering
- Categories: Exosomes, Prometheus, NK Cells, Diagnostics, Other
- Each service card shows: name, category, price (EUR), description
- Click **"Add to Quote"** on any service to jump straight into quote creation

---

## Slide 10: Creating a Quote or Invoice

The **New Quote Wizard** guides you through 3 steps:

### Step 1 — Type & Customer
- Choose: **Quote** or **Invoice**
- Enter customer name (required), email, and phone

### Step 2 — Add Services
- Select services from the catalog dropdown
- Adjust quantities with +/- buttons
- Remove items as needed
- Running total updates in real time

### Step 3 — Review & Finalize
- Review all line items, subtotal, tax (default 19%), and total
- Add optional notes
- Click **Create** to generate

---

## Slide 11: Managing Quotes & Invoices

All quotes and invoices live in the **Quotes** page:

- Filter by: **All**, **Quotes only**, **Invoices only**
- Search by customer name or quote number

### Status Workflow
```
Draft → Sent → Accepted → Paid
         ↘ Cancelled (at any point)
```

### Actions on Each Quote/Invoice
- **View details** — full line-item breakdown in a modal
- **Change status** — move through the workflow
- **Send via email** — triggers an email to the customer
- **Download PDF** — export a formatted PDF
- **Delete** — remove with confirmation

---

## Slide 12: The Document Vault

A secure place to store and organize all files:

### Uploading
- Click **Upload** or drag-and-drop a file
- Supported formats: PDF, PNG, JPG, DOC, DOCX
- Max file size: 25 MB
- Assign a category: Invoice, Quote, Lab Report, Other

### Browsing & Filtering
- Filter by category
- Filter by patient
- Search by filename
- View file details: name, upload date, size, category

### Linking
- Documents can be associated with specific patients
- Documents can be linked to quotes/invoices

---

## Slide 13: Travel Itinerary Planning

For patients requiring coordinated care journeys:

- Create **itineraries** with start and end dates
- Add itinerary items of various types:
  - Travel, Accommodation, Treatment, Consultation, Transfer, Free Time
- Track status: Draft → Confirmed → In Progress → Completed
- Schedule specific dates, times, and locations for each item

---

## Slide 14: Email Communication

Built-in email tracking via AgentMail integration:

- Each patient can be assigned a unique inbox
- View **inbound** and **outbound** emails
- Track email threads and attachments
- Full communication history stored per patient

---

## Slide 15: Admin — User Management

*Super Admin only*

- View all users in a table with name, email, and role
- **Create users** — assign name, email, password, and role
- **Edit users** — update name, email, or role
- **Delete users** — with confirmation dialog

Role badges are color-coded:
- Admin = Red | Coordinator = Green | Provider = Mint | Patient = Gray

---

## Slide 16: Admin — Service Configuration

*Super Admin only*

- Manage the full service catalog
- **Create services** — name, description, price, category, active/inactive toggle
- **Edit services** — update any field
- **Delete services** — with confirmation
- Toggle services **active/inactive** to control visibility in the catalog

---

## Slide 17: Key Workflows at a Glance

### New Patient to Quote
1. Patients → Add Patient
2. Services → Browse & click "Add to Quote"
3. Complete the 3-step quote wizard
4. Send or download the quote

### Treatment Tracking
1. Open Patient Detail → Treatments tab
2. Schedule a treatment from available services
3. Track status changes over time

### Lab Report Processing
1. Documents → Upload a lab report PDF
2. AI extracts biomarker values automatically
3. Review extracted values in the patient's Biomarker tab
4. Approve or manually adjust

---

## Slide 18: Responsive Design

- **Desktop**: Full sidebar navigation with collapsible menu
- **Tablet**: Adaptive grid layouts
- **Mobile**: Top navigation bar with slide-out menu, full-width content
- Works in any modern browser — no app installation required

---

## Slide 19: Design & UX Highlights

- **Dark mode** interface with mint-green accent colors
- **Card-based** layouts for clean information hierarchy
- **Skeleton loaders** during data fetches — no blank screens
- **Toast notifications** for instant feedback on actions
- **Confirmation dialogs** before destructive actions (delete, archive)
- **Empty state guides** that prompt you to create your first item
- **Multi-language support** (English, German, and more)

---

## Slide 20: Summary

Celljevity Longevity OS provides a complete healthcare management solution:

| Feature | Description |
|---------|-------------|
| Patient Management | Full demographics, status tracking, search & filter |
| Biomarker Tracking | Manual entry + AI extraction, charts, reference ranges |
| Service Catalog | Browsable, searchable, category-filtered services |
| Quotes & Invoices | 3-step wizard, status workflow, PDF export, email sending |
| Document Vault | Secure upload, categorization, patient linking |
| Itinerary Planning | Multi-day care journey coordination |
| Email Integration | Full communication history per patient |
| Admin Tools | User & service management with role-based access |
| Responsive | Works on desktop, tablet, and mobile |

---

*Celljevity Longevity OS — Modern healthcare management, simplified.*
