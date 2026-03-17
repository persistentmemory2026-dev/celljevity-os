"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { extractBiomarkers } from "./geminiExtractor";

// Public wrapper for manual triggering (e.g. from dashboard or scripts)
export const triggerExtraction = action({
  args: {
    documentId: v.id("documents"),
    storageId: v.id("_storage"),
    patientId: v.id("patients"),
    filename: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.extractionActions.processDocument, args);
    return null;
  },
});

export const processDocument = internalAction({
  args: {
    documentId: v.id("documents"),
    storageId: v.id("_storage"),
    patientId: v.id("patients"),
    filename: v.string(),
  },
  handler: async (ctx, args) => {
    // Create extraction job
    const jobId = await ctx.runMutation(internal.extractionJobs.create, {
      patientId: args.patientId,
      documentId: args.documentId,
      fileName: args.filename,
      status: "extracting",
    });

    try {
      // Download PDF from Convex storage
      const blob = await ctx.storage.get(args.storageId);
      if (!blob) {
        throw new Error("File not found in storage");
      }

      const arrayBuffer = await blob.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);

      // Extract biomarkers via Gemini
      const result = await extractBiomarkers(pdfBuffer, args.filename);

      // Get system user for createdBy
      const systemUser = await ctx.runQuery(api.users.getSystemUser, {});
      if (!systemUser) {
        throw new Error(
          "System user not found. Seed a user with email system@celljevity.internal"
        );
      }

      // Filter to results with valid values
      const validResults = result.results.filter(
        (r) => typeof r.value === "number" && !isNaN(r.value)
      );

      if (validResults.length > 0) {
        // Determine measuredAt date
        const measuredAt =
          result.reportDate && result.reportDate !== "unknown"
            ? result.reportDate
            : new Date().toISOString().split("T")[0];

        // Store extracted data for human review — do NOT auto-insert into patient record
        await ctx.runMutation(internal.extractionJobs.updateStatus, {
          jobId,
          status: "review",
          extractedData: result,
          resultCount: validResults.length,
          confidence: result.overallConfidence,
          measuredAt,
        });
      } else {
        // No valid results extracted
        await ctx.runMutation(internal.extractionJobs.updateStatus, {
          jobId,
          status: "approved",
          extractedData: result,
          resultCount: 0,
          confidence: result.overallConfidence,
        });
      }

      console.log(
        `Extraction complete for ${args.filename}: ${validResults.length} biomarkers extracted`
      );
    } catch (error: any) {
      console.error(`Extraction failed for ${args.filename}:`, error);
      await ctx.runMutation(internal.extractionJobs.updateStatus, {
        jobId,
        status: "failed",
        error: error?.message ?? String(error),
      });
    }
  },
});
