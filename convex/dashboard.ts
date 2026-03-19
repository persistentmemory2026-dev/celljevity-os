import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireRole } from "./auth";

type ActionItem = {
  type: string;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  patientId?: string;
  patientName?: string;
  actionLabel: string;
  actionTarget?: string;
  treatmentId?: string;
  extractionJobId?: string;
};

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const DAY_MS = 24 * 60 * 60 * 1000;

export const getActionItems = query({
  args: { callerId: v.id("users") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);

    const today = new Date().toISOString().split("T")[0];
    const now = Date.now();
    const items: ActionItem[] = [];

    // 1. Get all active patients
    const patients = await ctx.db
      .query("patients")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .collect();

    const patientMap = new Map(patients.map((p) => [p._id, p]));

    // 2. Get all treatments — find overdue and today's
    const allTreatments = await ctx.db
      .query("treatments")
      .withIndex("by_status", (q: any) => q.eq("status", "scheduled"))
      .collect();

    for (const t of allTreatments) {
      const patient = patientMap.get(t.patientId);
      if (!patient) continue;
      const pName = `${patient.firstName} ${patient.lastName}`;

      if (t.scheduledDate && t.scheduledDate < today) {
        items.push({
          type: "overdue_treatment",
          priority: "critical",
          title: `Overdue: ${t.serviceName}`,
          description: `Scheduled for ${t.scheduledDate}`,
          patientId: t.patientId,
          patientName: pName,
          actionLabel: "Mark In Progress",
          treatmentId: t._id,
        });
      } else if (t.scheduledDate === today) {
        items.push({
          type: "today_treatment",
          priority: "high",
          title: `Today: ${t.serviceName}`,
          description: `Scheduled for today`,
          patientId: t.patientId,
          patientName: pName,
          actionLabel: "Mark In Progress",
          treatmentId: t._id,
        });
      }
    }

    // 3. Today's itinerary items
    const todayItems = await ctx.db
      .query("itineraryItems")
      .withIndex("by_date", (q: any) => q.eq("date", today))
      .collect();

    for (const item of todayItems) {
      const itinerary = await ctx.db.get(item.itineraryId);
      if (!itinerary) continue;
      const patient = patientMap.get(itinerary.patientId);
      if (!patient) continue;
      items.push({
        type: "itinerary_today",
        priority: "medium",
        title: item.title,
        description: `${item.startTime ?? ""} ${item.location ?? ""}`.trim() || "Today",
        patientId: itinerary.patientId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        actionLabel: "View Itinerary",
      });
    }

    // 4. Extraction jobs pending review
    const pendingReview = await ctx.db
      .query("extractionJobs")
      .withIndex("by_status", (q: any) => q.eq("status", "review"))
      .collect();

    for (const job of pendingReview) {
      const patient = patientMap.get(job.patientId);
      items.push({
        type: "extraction_review",
        priority: "high",
        title: `Review: ${job.fileName}`,
        description: `${job.resultCount ?? 0} biomarkers extracted`,
        patientId: job.patientId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown",
        actionLabel: "Review",
        extractionJobId: job._id,
      });
    }

    // 5. Patients not contacted in 14+ days
    for (const p of patients) {
      if (!p.lastContactedAt || now - p.lastContactedAt > 14 * DAY_MS) {
        items.push({
          type: "no_contact",
          priority: "low",
          title: `Follow up: ${p.firstName} ${p.lastName}`,
          description: p.lastContactedAt
            ? `Last contacted ${Math.floor((now - p.lastContactedAt) / DAY_MS)} days ago`
            : "Never contacted",
          patientId: p._id,
          patientName: `${p.firstName} ${p.lastName}`,
          actionLabel: "View Patient",
        });
      }
    }

    // 6. New patients (>7 days) with zero treatments
    const patientIds = new Set(allTreatments.map((t) => t.patientId));
    // Also check in-progress/completed treatments
    const otherTreatments = await ctx.db.query("treatments").collect();
    for (const t of otherTreatments) patientIds.add(t.patientId);

    for (const p of patients) {
      if (now - p.createdAt > 7 * DAY_MS && !patientIds.has(p._id)) {
        items.push({
          type: "no_treatments",
          priority: "medium",
          title: `No treatments: ${p.firstName} ${p.lastName}`,
          description: `Patient created ${Math.floor((now - p.createdAt) / DAY_MS)} days ago`,
          patientId: p._id,
          patientName: `${p.firstName} ${p.lastName}`,
          actionLabel: "Add Treatment",
        });
      }
    }

    // 7. Recent documents (last 7 days)
    const recentDocs = await ctx.db.query("documents").collect();
    const recentUploads = recentDocs.filter(
      (d) => d.createdAt && now - d.createdAt < 7 * DAY_MS
    );
    for (const doc of recentUploads.slice(0, 5)) {
      const patient = doc.relatedPatientId ? patientMap.get(doc.relatedPatientId) : null;
      items.push({
        type: "recent_document",
        priority: "low",
        title: `New document: ${doc.originalName}`,
        description: doc.category,
        patientId: doc.relatedPatientId ?? undefined,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : undefined,
        actionLabel: "View",
      });
    }

    // Sort by priority
    items.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

    return items;
  },
});

export const getThisWeek = query({
  args: { callerId: v.id("users") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireRole(ctx, args.callerId, ["admin", "coordinator", "provider"]);

    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }

    const patients = await ctx.db
      .query("patients")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .collect();
    const patientMap = new Map(patients.map((p) => [p._id, p]));

    const weekItems: Array<{
      date: string;
      items: Array<{
        type: string;
        title: string;
        time?: string;
        patientName: string;
        patientId: string;
      }>;
    }> = [];

    for (const date of dates) {
      const dayItems: Array<{
        type: string;
        title: string;
        time?: string;
        patientName: string;
        patientId: string;
      }> = [];

      // Treatments on this date
      const treatments = await ctx.db
        .query("treatments")
        .withIndex("by_scheduledDate", (q: any) => q.eq("scheduledDate", date))
        .collect();

      for (const t of treatments) {
        if (t.status === "cancelled") continue;
        const patient = patientMap.get(t.patientId);
        if (!patient) continue;
        dayItems.push({
          type: "treatment",
          title: t.serviceName,
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientId: t.patientId,
        });
      }

      // Itinerary items on this date
      const itinItems = await ctx.db
        .query("itineraryItems")
        .withIndex("by_date", (q: any) => q.eq("date", date))
        .collect();

      for (const item of itinItems) {
        if (item.status === "cancelled") continue;
        const itinerary = await ctx.db.get(item.itineraryId);
        if (!itinerary) continue;
        const patient = patientMap.get(itinerary.patientId);
        if (!patient) continue;
        dayItems.push({
          type: item.type,
          title: item.title,
          time: item.startTime ?? undefined,
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientId: itinerary.patientId,
        });
      }

      if (dayItems.length > 0) {
        dayItems.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
        weekItems.push({ date, items: dayItems });
      }
    }

    return weekItems;
  },
});
