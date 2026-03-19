import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    role: v.string(), // admin, coordinator, provider, patient
    linkedPatientId: v.optional(v.id("patients")),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_linkedPatientId", ["linkedPatientId"]),

  services: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    category: v.string(), // Exosomes, Prometheus, NK Cells, Diagnostics, Other
    active: v.boolean(),
  })
    .index("by_category", ["category"])
    .index("by_active", ["active"]),

  quotes: defineTable({
    userId: v.id("users"),
    quoteNumber: v.string(),
    type: v.string(), // quote, invoice
    status: v.string(), // draft, sent, accepted, paid, cancelled

    // Customer Info
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),

    // Totals
    subtotal: v.number(),
    taxRate: v.number(),
    taxAmount: v.number(),
    total: v.number(),

    notes: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_quoteNumber", ["quoteNumber"]),

  quoteItems: defineTable({
    quoteId: v.id("quotes"),
    serviceId: v.id("services"),
    serviceName: v.string(), // Snapshot for PDF
    quantity: v.number(),
    unitPrice: v.number(),
    total: v.number(),
  })
    .index("by_quote", ["quoteId"]),

  documents: defineTable({
    userId: v.id("users"),
    filename: v.string(),
    originalName: v.string(),
    mimeType: v.string(),
    size: v.number(),
    storageId: v.optional(v.id("_storage")), // Convex storage
    category: v.string(), // invoice, quote, lab-report, other
    relatedQuoteId: v.optional(v.id("quotes")),
    relatedPatientId: v.optional(v.id("patients")),
    relatedTreatmentId: v.optional(v.id("treatments")),
    shareToken: v.optional(v.string()),
    shareExpiresAt: v.optional(v.number()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_category", ["category"])
    .index("by_quote", ["relatedQuoteId"])
    .index("by_shareToken", ["shareToken"])
    .index("by_patient", ["relatedPatientId"]),

  patients: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()), // ISO date
    gender: v.optional(v.string()), // male, female, other
    street: v.optional(v.string()),
    city: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    country: v.optional(v.string()), // default "DE"
    insuranceNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    language: v.optional(v.string()), // "en" | "de" | "nl" | "fr" | "es" | "it" | "pt" — default "en"
    agentmailInboxId: v.optional(v.string()), // AgentMail inbox ID
    agentmailAddress: v.optional(v.string()), // e.g. patient-doe-j-abc123@agentmail.to
    status: v.string(), // active, inactive, archived
    lastContactedAt: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_lastName", ["lastName"])
    .index("by_createdBy", ["createdBy"])
    .index("by_agentmailInboxId", ["agentmailInboxId"])
    .index("by_lastContactedAt", ["lastContactedAt"]),

  treatments: defineTable({
    patientId: v.id("patients"),
    serviceId: v.id("services"),
    serviceName: v.string(), // snapshot
    status: v.string(), // scheduled, in-progress, completed, cancelled
    scheduledDate: v.optional(v.string()), // ISO date
    completedDate: v.optional(v.string()), // ISO date
    performedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_patient", ["patientId"])
    .index("by_status", ["status"])
    .index("by_scheduledDate", ["scheduledDate"]),

  biomarkerResults: defineTable({
    patientId: v.id("patients"),
    treatmentId: v.optional(v.id("treatments")),
    documentId: v.optional(v.id("documents")),
    biomarkerCode: v.string(),
    biomarkerName: v.string(),
    value: v.number(),
    unit: v.string(),
    refRangeLow: v.optional(v.number()),
    refRangeHigh: v.optional(v.number()),
    measuredAt: v.string(), // ISO date
    extractionJobId: v.optional(v.id("extractionJobs")),
    confidence: v.optional(v.number()), // 0-1 per result
    source: v.optional(v.string()), // "manual" | "auto-extracted"
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_patient", ["patientId"])
    .index("by_patient_biomarker", ["patientId", "biomarkerCode"])
    .index("by_treatment", ["treatmentId"]),

  extractionJobs: defineTable({
    patientId: v.id("patients"),
    documentId: v.optional(v.id("documents")),
    driveFileId: v.optional(v.string()),
    fileName: v.string(),
    status: v.string(), // pending | extracting | review | approved | failed
    extractedData: v.optional(v.any()), // raw Gemini output
    resultCount: v.optional(v.number()),
    error: v.optional(v.string()),
    confidence: v.optional(v.number()), // 0-1
    measuredAt: v.optional(v.string()), // extracted report date
    reviewedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_patient", ["patientId"])
    .index("by_status", ["status"])
    .index("by_driveFileId", ["driveFileId"]),

  itineraries: defineTable({
    patientId: v.id("patients"),
    title: v.string(),
    status: v.string(), // draft, confirmed, in-progress, completed, cancelled
    startDate: v.string(), // ISO date
    endDate: v.string(), // ISO date
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_patient", ["patientId"])
    .index("by_status", ["status"]),

  emailLog: defineTable({
    direction: v.string(), // "inbound" | "outbound"
    agentmailMessageId: v.string(),
    agentmailThreadId: v.optional(v.string()),
    inboxId: v.string(),
    patientId: v.optional(v.id("patients")),
    quoteId: v.optional(v.id("quotes")),
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    bodyPreview: v.optional(v.string()), // first 200 chars
    hasAttachments: v.boolean(),
    status: v.string(), // "received" | "sent" | "delivered" | "bounced" | "failed"
    processedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_patient", ["patientId"])
    .index("by_quote", ["quoteId"])
    .index("by_status", ["status"])
    .index("by_direction", ["direction"]),

  inviteTokens: defineTable({
    token: v.string(),
    patientId: v.id("patients"),
    email: v.string(),
    createdBy: v.id("users"),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_patientId", ["patientId"]),

  itineraryItems: defineTable({
    itineraryId: v.id("itineraries"),
    type: v.string(), // travel, accommodation, treatment, consultation, transfer, free
    title: v.string(),
    description: v.optional(v.string()),
    date: v.string(), // ISO date
    startTime: v.optional(v.string()), // "HH:mm"
    endTime: v.optional(v.string()), // "HH:mm"
    location: v.optional(v.string()),
    treatmentId: v.optional(v.id("treatments")),
    sortOrder: v.number(),
    status: v.string(), // pending, confirmed, completed, cancelled
    createdAt: v.number(),
  })
    .index("by_itinerary", ["itineraryId"])
    .index("by_date", ["date"]),
});
