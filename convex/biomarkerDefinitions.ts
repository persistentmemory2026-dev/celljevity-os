export type BiomarkerDefinition = {
  code: string;
  name: string;
  unit: string;
  category: string;
  refRangeLow: number;
  refRangeHigh: number;
};

export const BIOMARKER_CATEGORIES = [
  "Aging",
  "Inflammation",
  "Metabolic",
  "Hormonal",
  "Thyroid",
  "Cardiovascular",
  "Lipids",
  "Vitamins",
  "Liver",
  "Kidney",
  "Hematology",
  "Immune",
] as const;

export const BIOMARKER_DEFINITIONS: BiomarkerDefinition[] = [
  // Aging
  { code: "TELOMERE_LENGTH", name: "Telomere Length", unit: "kb", category: "Aging", refRangeLow: 5.0, refRangeHigh: 15.0 },
  { code: "NAD_PLUS", name: "NAD+", unit: "µM", category: "Aging", refRangeLow: 10, refRangeHigh: 40 },

  // Inflammation
  { code: "CRP", name: "C-Reactive Protein", unit: "mg/L", category: "Inflammation", refRangeLow: 0, refRangeHigh: 3.0 },

  // Metabolic
  { code: "HBA1C", name: "HbA1c", unit: "%", category: "Metabolic", refRangeLow: 4.0, refRangeHigh: 5.6 },

  // Hormonal
  { code: "IGF1", name: "IGF-1", unit: "ng/mL", category: "Hormonal", refRangeLow: 100, refRangeHigh: 350 },
  { code: "DHEA_S", name: "DHEA-S", unit: "µg/dL", category: "Hormonal", refRangeLow: 80, refRangeHigh: 560 },
  { code: "TESTOSTERONE", name: "Testosterone", unit: "ng/dL", category: "Hormonal", refRangeLow: 300, refRangeHigh: 1000 },
  { code: "ESTRADIOL", name: "Estradiol", unit: "pg/mL", category: "Hormonal", refRangeLow: 15, refRangeHigh: 350 },

  // Thyroid
  { code: "TSH", name: "TSH", unit: "mIU/L", category: "Thyroid", refRangeLow: 0.4, refRangeHigh: 4.0 },

  // Cardiovascular
  { code: "HOMOCYSTEINE", name: "Homocysteine", unit: "µmol/L", category: "Cardiovascular", refRangeLow: 5, refRangeHigh: 15 },

  // Lipids
  { code: "LDL", name: "LDL Cholesterol", unit: "mg/dL", category: "Lipids", refRangeLow: 0, refRangeHigh: 130 },
  { code: "HDL", name: "HDL Cholesterol", unit: "mg/dL", category: "Lipids", refRangeLow: 40, refRangeHigh: 100 },
  { code: "TRIGLYCERIDES", name: "Triglycerides", unit: "mg/dL", category: "Lipids", refRangeLow: 0, refRangeHigh: 150 },

  // Vitamins
  { code: "VITAMIN_D", name: "Vitamin D", unit: "ng/mL", category: "Vitamins", refRangeLow: 30, refRangeHigh: 80 },

  // Liver
  { code: "ALT", name: "ALT (GPT)", unit: "U/L", category: "Liver", refRangeLow: 7, refRangeHigh: 56 },
  { code: "AST", name: "AST (GOT)", unit: "U/L", category: "Liver", refRangeLow: 10, refRangeHigh: 40 },

  // Kidney
  { code: "EGFR", name: "eGFR", unit: "mL/min", category: "Kidney", refRangeLow: 90, refRangeHigh: 120 },
  { code: "CREATININE", name: "Creatinine", unit: "mg/dL", category: "Kidney", refRangeLow: 0.6, refRangeHigh: 1.2 },

  // Hematology
  { code: "WBC", name: "White Blood Cells", unit: "×10³/µL", category: "Hematology", refRangeLow: 4.0, refRangeHigh: 11.0 },
  { code: "RBC", name: "Red Blood Cells", unit: "×10⁶/µL", category: "Hematology", refRangeLow: 4.0, refRangeHigh: 5.5 },
  { code: "HGB", name: "Hemoglobin", unit: "g/dL", category: "Hematology", refRangeLow: 12.0, refRangeHigh: 17.5 },
  { code: "PLT", name: "Platelets", unit: "×10³/µL", category: "Hematology", refRangeLow: 150, refRangeHigh: 400 },
  { code: "HCT", name: "Hematocrit", unit: "%", category: "Hematology", refRangeLow: 36, refRangeHigh: 50 },
  { code: "MCV", name: "Mean Corpuscular Volume", unit: "fL", category: "Hematology", refRangeLow: 80, refRangeHigh: 100 },
  { code: "MCH", name: "Mean Corpuscular Hemoglobin", unit: "pg", category: "Hematology", refRangeLow: 27, refRangeHigh: 33 },
  { code: "MCHC", name: "Mean Corpuscular Hemoglobin Concentration", unit: "g/dL", category: "Hematology", refRangeLow: 32, refRangeHigh: 36 },

  // Metabolic (additional)
  { code: "GLUCOSE", name: "Glucose (Fasting)", unit: "mg/dL", category: "Metabolic", refRangeLow: 70, refRangeHigh: 100 },
  { code: "BUN", name: "Blood Urea Nitrogen", unit: "mg/dL", category: "Metabolic", refRangeLow: 7, refRangeHigh: 20 },
  { code: "URIC_ACID", name: "Uric Acid", unit: "mg/dL", category: "Metabolic", refRangeLow: 3.0, refRangeHigh: 7.0 },

  // Immune
  { code: "NK_CELLS", name: "NK Cells (CD16+/CD56+)", unit: "%", category: "Immune", refRangeLow: 5, refRangeHigh: 20 },
  { code: "T_CELLS_CD4", name: "T Helper Cells (CD4+)", unit: "%", category: "Immune", refRangeLow: 30, refRangeHigh: 60 },
  { code: "T_CELLS_CD8", name: "T Cytotoxic Cells (CD8+)", unit: "%", category: "Immune", refRangeLow: 15, refRangeHigh: 40 },
  { code: "LYMPHOCYTES", name: "Lymphocytes", unit: "%", category: "Immune", refRangeLow: 20, refRangeHigh: 40 },
  { code: "B_CELLS", name: "B Cells (CD19+)", unit: "%", category: "Immune", refRangeLow: 5, refRangeHigh: 20 },

  // Lipids (additional)
  { code: "TOTAL_CHOLESTEROL", name: "Total Cholesterol", unit: "mg/dL", category: "Lipids", refRangeLow: 0, refRangeHigh: 200 },
];

export function getBiomarkerByCode(code: string): BiomarkerDefinition | undefined {
  return BIOMARKER_DEFINITIONS.find((b) => b.code === code);
}
