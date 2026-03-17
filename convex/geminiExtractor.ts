"use node";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { BIOMARKER_DEFINITIONS } from "./biomarkerDefinitions";

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}

const extractionSchema = z.object({
  reportDate: z.string().describe("ISO date from report, e.g. 2025-07-20"),
  labName: z.string().nullable().describe("Name of the laboratory"),
  overallConfidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Overall confidence in the extraction accuracy"),
  results: z.array(
    z.object({
      biomarkerCode: z
        .string()
        .describe("Matching code from BIOMARKER_DEFINITIONS, or a new code in UPPER_SNAKE_CASE"),
      biomarkerName: z.string().describe("Human-readable biomarker name"),
      value: z.number().describe("Numeric value of the biomarker"),
      unit: z.string().describe("Unit of measurement"),
      refRangeLow: z.number().nullable().describe("Lower reference range bound"),
      refRangeHigh: z.number().nullable().describe("Upper reference range bound"),
      confidence: z
        .number()
        .min(0)
        .max(1)
        .describe("Confidence for this specific extraction"),
      isKnownBiomarker: z
        .boolean()
        .describe("True if biomarkerCode matches a known BIOMARKER_DEFINITIONS code"),
      rawText: z
        .string()
        .describe("Original text line from the report for this value"),
    })
  ),
});

export type ExtractionResult = z.infer<typeof extractionSchema>;

const knownCodes = BIOMARKER_DEFINITIONS.map(
  (b) => `${b.code} (${b.name}, ${b.unit}, ${b.category})`
).join("\n");

const SYSTEM_PROMPT = `You are a medical laboratory report extraction system. Extract ALL biomarker values from the provided PDF lab report.

KNOWN BIOMARKER CODES (use these codes when a match exists):
${knownCodes}

INSTRUCTIONS:
1. Extract every numeric biomarker result from the report.
2. Match each result to a known biomarker code when possible. Set isKnownBiomarker=true for matches.
3. For biomarkers not in the known list, create a descriptive UPPER_SNAKE_CASE code and set isKnownBiomarker=false.
4. Extract reference ranges when available.
5. The report may be in Chinese, English, or German — handle all languages.
6. Extract the report date (reportDate) from headers/footers.
7. Set confidence scores: 1.0 for clearly legible values, lower for unclear/estimated values.
8. Include the raw text line from the report for each extracted value.
9. If no date is found, use "unknown" for reportDate.`;

export async function extractBiomarkers(
  pdfBuffer: Buffer,
  filename: string
): Promise<ExtractionResult> {
  const client = getClient();
  const jsonSchema = zodToJsonSchema(extractionSchema, "ExtractionResult");

  const base64Pdf = pdfBuffer.toString("base64");

  const response = await client.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Pdf,
            },
          },
          {
            text: `Extract all biomarker values from this lab report (filename: ${filename}). Return structured JSON matching the schema.`,
          },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: jsonSchema.definitions?.["ExtractionResult"] as any ?? jsonSchema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  const parsed = JSON.parse(text);
  return extractionSchema.parse(parsed);
}
