#!/usr/bin/env node
/**
 * Upload PDFs to Convex storage and trigger biomarker extraction for a patient.
 *
 * Usage: node scripts/upload-and-extract.mjs <systemUserId> <patientId> <pdf-path-or-directory>
 */
import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import path from "path";

const CONVEX_URL = "https://dashing-fennec-674.eu-west-1.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

const SYSTEM_USER_ID = process.argv[2];
const PATIENT_ID = process.argv[3];
const INPUT_PATH = process.argv[4];

if (!SYSTEM_USER_ID || !PATIENT_ID || !INPUT_PATH) {
  console.error("Usage: node scripts/upload-and-extract.mjs <systemUserId> <patientId> <path>");
  process.exit(1);
}

// Collect PDF files
let pdfFiles = [];
const stat = fs.statSync(INPUT_PATH);
if (stat.isDirectory()) {
  pdfFiles = fs.readdirSync(INPUT_PATH)
    .filter(f => f.toLowerCase().endsWith(".pdf"))
    .map(f => path.join(INPUT_PATH, f));
} else {
  pdfFiles = [INPUT_PATH];
}

console.log(`Found ${pdfFiles.length} PDF(s) to process for patient ${PATIENT_ID}\n`);

for (const pdfPath of pdfFiles) {
  const filename = path.basename(pdfPath);
  const fileBuffer = fs.readFileSync(pdfPath);
  const blob = new Blob([fileBuffer], { type: "application/pdf" });

  console.log(`[${filename}] Uploading (${(fileBuffer.length / 1024).toFixed(0)} KB)...`);

  try {
    // Step 1: Get upload URL
    const uploadUrl = await client.mutation("documents:generateUploadUrl", {
      userId: SYSTEM_USER_ID,
    });

    // Step 2: Upload to storage
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: blob,
    });
    const { storageId } = await uploadResponse.json();
    console.log(`[${filename}] Stored: ${storageId}`);

    // Step 3: Create document record
    const documentId = await client.mutation("documents:create", {
      userId: SYSTEM_USER_ID,
      filename,
      originalName: filename,
      mimeType: "application/pdf",
      size: fileBuffer.length,
      storageId,
      category: "lab-report",
      relatedPatientId: PATIENT_ID,
    });
    console.log(`[${filename}] Document: ${documentId}`);

    // Step 4: Trigger extraction via public action
    await client.action("extractionActions:triggerExtraction", {
      documentId,
      storageId,
      patientId: PATIENT_ID,
      filename,
    });
    console.log(`[${filename}] Extraction triggered!\n`);
  } catch (err) {
    console.error(`[${filename}] Failed: ${err.message}\n`);
  }
}

console.log("All uploads complete. Extractions running in background.");
console.log("Check progress: npx convex logs");
