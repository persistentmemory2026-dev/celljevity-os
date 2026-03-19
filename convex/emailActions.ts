"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { createInbox, sendEmail, getAttachment, registerWebhook } from "./agentmail";
import { welcomeEmail, quoteEmail, inviteEmail, treatmentConfirmationEmail, treatmentReminderEmail, treatmentCompletedEmail, followUpEmail, quoteAcceptedEmail } from "./emailTemplates";
import { Id } from "./_generated/dataModel";

async function resolveInbox(patient: { agentmailInboxId?: string; agentmailAddress?: string }, fallbackName: string) {
  if (patient.agentmailInboxId) {
    return { inboxId: patient.agentmailInboxId, fromAddress: patient.agentmailAddress ?? `${fallbackName}@agentmail.to` };
  }
  try {
    const inbox = await createInbox(fallbackName, "Celljevity");
    return { inboxId: inbox.inboxId, fromAddress: `${fallbackName}@agentmail.to` };
  } catch {
    return { inboxId: fallbackName, fromAddress: `${fallbackName}@agentmail.to` };
  }
}

async function sendAndLog(
  ctx: any,
  opts: {
    patientId?: any;
    quoteId?: any;
    inboxId: string;
    fromAddress: string;
    toEmail: string;
    template: { subject: string; html: string; text: string };
  }
) {
  try {
    const result = await sendEmail(opts.inboxId, {
      to: [opts.toEmail],
      subject: opts.template.subject,
      html: opts.template.html,
      text: opts.template.text,
    });
    await ctx.runMutation(internal.emailLog.insert, {
      direction: "outbound",
      agentmailMessageId: result.messageId ?? "",
      agentmailThreadId: result.threadId,
      inboxId: opts.inboxId,
      patientId: opts.patientId,
      quoteId: opts.quoteId,
      from: opts.fromAddress,
      to: opts.toEmail,
      subject: opts.template.subject,
      bodyPreview: opts.template.text.slice(0, 200),
      hasAttachments: false,
      status: "sent",
      createdAt: Date.now(),
    });
  } catch (error: any) {
    console.error(`Failed to send email "${opts.template.subject}":`, error);
    await ctx.runMutation(internal.emailLog.insert, {
      direction: "outbound",
      agentmailMessageId: "",
      inboxId: opts.inboxId ?? "",
      patientId: opts.patientId,
      quoteId: opts.quoteId,
      from: opts.fromAddress,
      to: opts.toEmail,
      subject: opts.template.subject,
      hasAttachments: false,
      status: "failed",
      error: error?.message ?? String(error),
      createdAt: Date.now(),
    });
  }
}

// ─── Flow 1: Patient Welcome + Inbox Creation ──────────────────────

export const createPatientInbox = internalAction({
  args: {
    patientId: v.id("patients"),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.runQuery(internal.patients.getInternal, {
      patientId: args.patientId,
    });
    if (!patient || !patient.email) return;

    // Already has an inbox
    if (patient.agentmailInboxId) return;

    // Generate username: patient-{lastName}-{firstInitial}-{shortId}
    const sanitize = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
    const shortId = args.patientId.slice(-6);
    const username = `patient-${sanitize(patient.lastName)}-${sanitize(patient.firstName[0])}-${shortId}`;
    const displayName = `${patient.firstName} ${patient.lastName}`;

    try {
      const inbox = await createInbox(username, displayName);
      const inboxId = inbox.inboxId;
      const agentmailAddress = `${username}@agentmail.to`;

      // Update patient record
      await ctx.runMutation(api.patients.patchAgentmail, {
        patientId: args.patientId,
        agentmailInboxId: inboxId,
        agentmailAddress,
      });

      // Send welcome email
      const template = welcomeEmail({
        firstName: patient.firstName,
        lastName: patient.lastName,
        agentmailAddress,
      }, patient.language ?? "en");

      const result = await sendEmail(inboxId, {
        to: [patient.email],
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      // Log the email
      await ctx.runMutation(internal.emailLog.insert, {
        direction: "outbound",
        agentmailMessageId: result.messageId ?? "",
        agentmailThreadId: result.threadId,
        inboxId,
        patientId: args.patientId,
        from: agentmailAddress,
        to: patient.email,
        subject: template.subject,
        bodyPreview: template.text.slice(0, 200),
        hasAttachments: false,
        status: "sent",
        createdAt: Date.now(),
      });
    } catch (error: any) {
      console.error("Failed to create patient inbox:", error);
      // Log the failure
      await ctx.runMutation(internal.emailLog.insert, {
        direction: "outbound",
        agentmailMessageId: "",
        inboxId: "",
        from: "",
        to: patient.email,
        subject: "Welcome email",
        hasAttachments: false,
        status: "failed",
        error: error?.message ?? String(error),
        createdAt: Date.now(),
      });
    }
  },
});

// ─── Flow 2: Process Inbound Email (from webhook) ──────────────────

export const processInboundEmail = internalAction({
  args: {
    inboxId: v.string(),
    messageId: v.string(),
    threadId: v.optional(v.string()),
    fromEmail: v.string(),
    toEmail: v.string(),
    subject: v.string(),
    textBody: v.optional(v.string()),
    attachments: v.array(
      v.object({
        attachmentId: v.string(),
        filename: v.string(),
        contentType: v.string(),
        size: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Look up patient by inbox ID
    const patient = await ctx.runQuery(internal.patients.getByInboxId, {
      agentmailInboxId: args.inboxId,
    });

    if (!patient) {
      console.warn(`No patient found for inbox ${args.inboxId}`);
      return;
    }

    // Process each attachment: fetch and store as document
    for (const att of args.attachments) {
      try {
        const blob = await getAttachment(args.inboxId, args.messageId, att.attachmentId, att.contentType);
        const storageId = await ctx.storage.store(blob);

        // Create document record linked to patient
        const documentId: Id<"documents"> = await ctx.runMutation(api.documents.create, {
          userId: patient.createdBy,
          filename: att.filename,
          originalName: att.filename,
          mimeType: att.contentType,
          size: att.size,
          storageId,
          category: "other",
          relatedPatientId: patient._id,
        });

        // Auto-extract biomarkers from PDF attachments
        if (att.contentType === "application/pdf") {
          await ctx.scheduler.runAfter(
            0,
            internal.extractionActions.processDocument,
            {
              documentId,
              storageId,
              patientId: patient._id,
              filename: att.filename,
            }
          );
        }
      } catch (error: any) {
        console.error(`Failed to process attachment ${att.filename}:`, error);
      }
    }

    // Log the inbound email
    await ctx.runMutation(internal.emailLog.insert, {
      direction: "inbound",
      agentmailMessageId: args.messageId,
      agentmailThreadId: args.threadId,
      inboxId: args.inboxId,
      patientId: patient._id,
      from: args.fromEmail,
      to: args.toEmail,
      subject: args.subject,
      bodyPreview: args.textBody?.slice(0, 200),
      hasAttachments: args.attachments.length > 0,
      status: "received",
      processedAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

// ─── Flow 3: Send Quote/Invoice Email ──────────────────────────────

export const sendQuoteEmail = internalAction({
  args: {
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    // Load quote with items
    const quote = await ctx.runQuery(internal.quotes.getInternal, {
      quoteId: args.quoteId,
    });
    if (!quote) {
      console.error("Quote not found:", args.quoteId);
      return;
    }
    if (!quote.customerEmail) {
      console.warn("Quote has no customerEmail, skipping email:", args.quoteId);
      return;
    }

    // Find a suitable inbox: look for a patient with matching email
    let inboxId = "celljevity-quotes@agentmail.to";
    let fromAddress = "celljevity-quotes@agentmail.to";

    const patient = await ctx.runQuery(internal.patients.getByEmail, {
      email: quote.customerEmail,
    });
    if (patient?.agentmailInboxId) {
      inboxId = patient.agentmailInboxId;
      fromAddress = patient.agentmailAddress ?? fromAddress;
    } else {
      // Use a system inbox — create if needed
      try {
        const systemInbox = await createInbox("celljevity-quotes", "Celljevity Quotes");
        inboxId = systemInbox.inboxId;
      } catch {
        // Inbox may already exist — use the default
      }
    }

    const template = quoteEmail({
      quoteNumber: quote.quoteNumber,
      type: quote.type,
      customerName: quote.customerName,
      items: quote.items ?? [],
      subtotal: quote.subtotal,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      total: quote.total,
      notes: quote.notes,
    }, patient?.language ?? "en");

    try {
      const result = await sendEmail(inboxId, {
        to: [quote.customerEmail],
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      await ctx.runMutation(internal.emailLog.insert, {
        direction: "outbound",
        agentmailMessageId: result.messageId ?? "",
        agentmailThreadId: result.threadId,
        inboxId,
        patientId: patient?._id,
        quoteId: args.quoteId,
        from: fromAddress,
        to: quote.customerEmail,
        subject: template.subject,
        bodyPreview: template.text.slice(0, 200),
        hasAttachments: false,
        status: "sent",
        createdAt: Date.now(),
      });
    } catch (error: any) {
      console.error("Failed to send quote email:", error);
      await ctx.runMutation(internal.emailLog.insert, {
        direction: "outbound",
        agentmailMessageId: "",
        inboxId: inboxId ?? "",
        quoteId: args.quoteId,
        from: fromAddress,
        to: quote.customerEmail,
        subject: template.subject,
        hasAttachments: false,
        status: "failed",
        error: error?.message ?? String(error),
        createdAt: Date.now(),
      });
    }
  },
});

// ─── Flow 4: Send Invite Email ───────────────────────────────────────

export const sendInviteEmail = internalAction({
  args: {
    patientId: v.id("patients"),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.runQuery(internal.patients.getInternal, {
      patientId: args.patientId,
    });
    if (!patient || !patient.email) return;

    const siteUrl = process.env.SITE_URL ?? "http://localhost:5173";
    const inviteUrl = `${siteUrl}?invite=${args.token}`;

    const template = inviteEmail(
      { firstName: patient.firstName, lastName: patient.lastName },
      inviteUrl,
      patient.language ?? "en",
    );

    // Find patient's inbox; fall back to system inbox
    let inboxId = patient.agentmailInboxId;
    let fromAddress = patient.agentmailAddress ?? "celljevity-system@agentmail.to";

    if (!inboxId) {
      try {
        const systemInbox = await createInbox("celljevity-invites", "Celljevity Invites");
        inboxId = systemInbox.inboxId;
        fromAddress = "celljevity-invites@agentmail.to";
      } catch {
        // Inbox may already exist — use the fallback name
        inboxId = "celljevity-invites";
        fromAddress = "celljevity-invites@agentmail.to";
      }
    }

    try {
      const result = await sendEmail(inboxId, {
        to: [patient.email],
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      await ctx.runMutation(internal.emailLog.insert, {
        direction: "outbound",
        agentmailMessageId: result.messageId ?? "",
        agentmailThreadId: result.threadId,
        inboxId,
        patientId: args.patientId,
        from: fromAddress,
        to: patient.email,
        subject: template.subject,
        bodyPreview: template.text.slice(0, 200),
        hasAttachments: false,
        status: "sent",
        createdAt: Date.now(),
      });
    } catch (error: any) {
      console.error("Failed to send invite email:", error);
      await ctx.runMutation(internal.emailLog.insert, {
        direction: "outbound",
        agentmailMessageId: "",
        inboxId: inboxId ?? "",
        patientId: args.patientId,
        from: fromAddress,
        to: patient.email,
        subject: template.subject,
        hasAttachments: false,
        status: "failed",
        error: error?.message ?? String(error),
        createdAt: Date.now(),
      });
    }
  },
});

// ─── Setup: Register Webhook ───────────────────────────────────────

export const setupWebhook = action({
  args: {
    convexSiteUrl: v.string(),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    const url = `${args.convexSiteUrl}/agentmail/webhook`;
    const result = await registerWebhook(url, ["message.received"]);
    // Serialize for Convex (strip Date objects)
    return JSON.parse(JSON.stringify(result));
  },
});

// ─── Flow 5: Treatment Confirmation Email ────────────────────────

export const sendTreatmentConfirmation = internalAction({
  args: {
    patientId: v.id("patients"),
    treatmentId: v.id("treatments"),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.runQuery(internal.patients.getInternal, {
      patientId: args.patientId,
    });
    if (!patient || !patient.email) return;

    const treatment = await ctx.runQuery(internal.treatments.getInternal, {
      treatmentId: args.treatmentId,
    });
    if (!treatment) return;

    const { inboxId, fromAddress } = await resolveInbox(patient, "celljevity-treatments");

    const template = treatmentConfirmationEmail({
      firstName: patient.firstName,
      lastName: patient.lastName,
      serviceName: treatment.serviceName,
      scheduledDate: treatment.scheduledDate ?? "",
    }, patient.language ?? "en");

    await sendAndLog(ctx, {
      patientId: args.patientId,
      inboxId,
      fromAddress,
      toEmail: patient.email,
      template,
    });
  },
});

// ─── Flow 6: Treatment Reminder Email ────────────────────────────

export const sendTreatmentReminder = internalAction({
  args: {
    patientId: v.id("patients"),
    treatmentId: v.id("treatments"),
    expectedDate: v.string(),
  },
  handler: async (ctx, args) => {
    const treatment = await ctx.runQuery(internal.treatments.getInternal, {
      treatmentId: args.treatmentId,
    });
    // Guard: only send if treatment still exists, date unchanged, and still scheduled
    if (!treatment || treatment.scheduledDate !== args.expectedDate || treatment.status !== "scheduled") return;

    const patient = await ctx.runQuery(internal.patients.getInternal, {
      patientId: args.patientId,
    });
    if (!patient || !patient.email) return;

    const { inboxId, fromAddress } = await resolveInbox(patient, "celljevity-treatments");

    const template = treatmentReminderEmail({
      firstName: patient.firstName,
      lastName: patient.lastName,
      serviceName: treatment.serviceName,
      scheduledDate: treatment.scheduledDate ?? "",
    }, patient.language ?? "en");

    await sendAndLog(ctx, {
      patientId: args.patientId,
      inboxId,
      fromAddress,
      toEmail: patient.email,
      template,
    });
  },
});

// ─── Flow 7: Treatment Completed Email ───────────────────────────

export const sendTreatmentCompleted = internalAction({
  args: {
    patientId: v.id("patients"),
    treatmentId: v.id("treatments"),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.runQuery(internal.patients.getInternal, {
      patientId: args.patientId,
    });
    if (!patient || !patient.email) return;

    const treatment = await ctx.runQuery(internal.treatments.getInternal, {
      treatmentId: args.treatmentId,
    });
    if (!treatment) return;

    const { inboxId, fromAddress } = await resolveInbox(patient, "celljevity-treatments");

    const template = treatmentCompletedEmail({
      firstName: patient.firstName,
      lastName: patient.lastName,
      serviceName: treatment.serviceName,
      completedDate: treatment.completedDate ?? new Date().toISOString().split("T")[0],
      notes: treatment.notes,
    }, patient.language ?? "en");

    await sendAndLog(ctx, {
      patientId: args.patientId,
      inboxId,
      fromAddress,
      toEmail: patient.email,
      template,
    });

    // Schedule follow-up email in 7 days
    await ctx.scheduler.runAfter(7 * 24 * 60 * 60 * 1000, internal.emailActions.sendFollowUpEmail, {
      patientId: args.patientId,
      treatmentId: args.treatmentId,
    });
  },
});

// ─── Flow 8: Follow-Up Email (7 days after completion) ───────────

export const sendFollowUpEmail = internalAction({
  args: {
    patientId: v.id("patients"),
    treatmentId: v.id("treatments"),
  },
  handler: async (ctx, args) => {
    const treatment = await ctx.runQuery(internal.treatments.getInternal, {
      treatmentId: args.treatmentId,
    });
    // Guard: only send if treatment still exists and is completed
    if (!treatment || treatment.status !== "completed") return;

    const patient = await ctx.runQuery(internal.patients.getInternal, {
      patientId: args.patientId,
    });
    if (!patient || !patient.email) return;

    const { inboxId, fromAddress } = await resolveInbox(patient, "celljevity-treatments");

    const template = followUpEmail({
      firstName: patient.firstName,
      lastName: patient.lastName,
      serviceName: treatment.serviceName,
    }, patient.language ?? "en");

    await sendAndLog(ctx, {
      patientId: args.patientId,
      inboxId,
      fromAddress,
      toEmail: patient.email,
      template,
    });
  },
});

// ─── Flow 9: Quote Accepted Email ────────────────────────────────

export const sendQuoteAccepted = internalAction({
  args: {
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    const quote = await ctx.runQuery(internal.quotes.getInternal, {
      quoteId: args.quoteId,
    });
    if (!quote || !quote.customerEmail) return;

    // Try to find patient for inbox resolution
    const patient = await ctx.runQuery(internal.patients.getByEmail, {
      email: quote.customerEmail,
    });

    const { inboxId, fromAddress } = patient
      ? await resolveInbox(patient, "celljevity-quotes")
      : { inboxId: "celljevity-quotes", fromAddress: "celljevity-quotes@agentmail.to" };

    const template = quoteAcceptedEmail({
      customerName: quote.customerName,
      quoteNumber: quote.quoteNumber,
      total: quote.total,
    }, patient?.language ?? "en");

    await sendAndLog(ctx, {
      quoteId: args.quoteId,
      patientId: patient?._id,
      inboxId,
      fromAddress,
      toEmail: quote.customerEmail,
      template,
    });
  },
});
