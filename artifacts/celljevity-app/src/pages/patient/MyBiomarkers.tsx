import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { BIOMARKER_DEFINITIONS, BIOMARKER_CATEGORIES } from "@convex/biomarkerDefinitions";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceArea, ReferenceLine } from "recharts";
import { computeBaselineDelta } from "@/lib/biomarkers";
import { useState } from "react";

interface MyBiomarkersProps {
  userId: string;
  linkedPatientId: string;
}

export function MyBiomarkers({ userId, linkedPatientId }: MyBiomarkersProps) {
  const [baselineCodes, setBaselineCodes] = useState<Set<string>>(new Set());

  const toggleBaseline = (code: string) => {
    setBaselineCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const biomarkers = useQuery(api.biomarkers.listByPatient, {
    callerId: userId as Id<"users">,
    patientId: linkedPatientId as Id<"patients">,
  });

  if (biomarkers === undefined) {
    return (
      <div className="px-5 md:px-8 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // Group results by category → biomarkerCode
  const byCategory: Record<string, Record<string, any[]>> = {};
  for (const r of biomarkers) {
    const def = BIOMARKER_DEFINITIONS.find((d) => d.code === r.biomarkerCode);
    const cat = def?.category ?? "Other";
    if (!byCategory[cat]) byCategory[cat] = {};
    if (!byCategory[cat][r.biomarkerCode]) byCategory[cat][r.biomarkerCode] = [];
    byCategory[cat][r.biomarkerCode].push(r);
  }

  // Category health scores (% of biomarkers in range)
  const categoryScores: Record<string, { inRange: number; total: number }> = {};
  for (const [cat, codes] of Object.entries(byCategory)) {
    let inRange = 0;
    let total = 0;
    for (const [code, results] of Object.entries(codes)) {
      const latest = results[0]; // already sorted desc by date
      const def = BIOMARKER_DEFINITIONS.find((d) => d.code === code);
      if (!def) continue;
      total++;
      const low = latest.refRangeLow ?? def.refRangeLow;
      const high = latest.refRangeHigh ?? def.refRangeHigh;
      if (latest.value >= low && latest.value <= high) inRange++;
    }
    categoryScores[cat] = { inRange, total };
  }

  if (biomarkers.length === 0) {
    return (
      <div className="px-5 md:px-8 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">My Biomarkers</h1>
        <div className="text-center py-12 text-muted-foreground">
          No biomarker results available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 md:px-8 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Biomarkers</h1>

      {/* Category Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(categoryScores).map(([cat, { inRange, total }]) => {
          const pct = total > 0 ? Math.round((inRange / total) * 100) : 0;
          return (
            <div key={cat} className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground">{cat}</p>
              <p className={`text-xl font-bold mt-1 ${
                pct >= 80 ? "text-success" : pct >= 50 ? "text-warning" : "text-destructive"
              }`}>
                {pct}%
              </p>
              <p className="text-[10px] text-muted-foreground">{inRange}/{total} in range</p>
            </div>
          );
        })}
      </div>

      {/* Categories with biomarkers */}
      <Accordion type="multiple" defaultValue={Object.keys(byCategory)}>
        {BIOMARKER_CATEGORIES.filter((cat) => byCategory[cat]).map((cat) => (
          <AccordionItem key={cat} value={cat}>
            <AccordionTrigger className="text-sm font-semibold">{cat}</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {Object.entries(byCategory[cat]).map(([code, results]) => {
                  const def = BIOMARKER_DEFINITIONS.find((d) => d.code === code);
                  const latest = results[0];
                  const low = latest.refRangeLow ?? def?.refRangeLow ?? 0;
                  const high = latest.refRangeHigh ?? def?.refRangeHigh ?? 100;
                  const inRange = latest.value >= low && latest.value <= high;

                  // Trend data (sort chronologically for chart)
                  const chartData = [...results]
                    .sort((a: any, b: any) => a.measuredAt.localeCompare(b.measuredAt))
                    .map((r: any) => ({ date: r.measuredAt, value: r.value }));

                  return (
                    <div key={code} className="bg-secondary/30 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {def?.name ?? code}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Ref: {low} — {high} {def?.unit ?? latest.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${inRange ? "text-success" : "text-destructive"}`}>
                            {latest.value} <span className="text-xs font-normal text-muted-foreground">{def?.unit ?? latest.unit}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground">{latest.measuredAt}</p>
                        </div>
                      </div>

                      {/* Mini trend chart */}
                      {chartData.length > 1 && (() => {
                        const showBaseline = baselineCodes.has(code);
                        const baselineValue = chartData[0].value;
                        const currentValue = chartData[chartData.length - 1].value;
                        const delta = computeBaselineDelta(baselineValue, currentValue);

                        return (
                          <>
                            <div className="flex items-center justify-between mt-2 mb-1">
                              <button
                                onClick={() => toggleBaseline(code)}
                                className={`text-sm font-medium px-2 py-0.5 rounded transition-colors ${
                                  showBaseline
                                    ? "bg-[#A81B4E]/10 text-[#A81B4E]"
                                    : "text-[#9B9590] hover:text-[#6B6560]"
                                }`}
                                style={{ fontFamily: "DM Sans", fontWeight: 500, fontSize: "14px" }}
                              >
                                vs Baseline
                              </button>
                              {showBaseline && delta !== null && (
                                <span
                                  style={{ fontFamily: "Geist Mono" }}
                                  className={`text-xs ${delta > 0 ? "text-[#2D7D46]" : delta < 0 ? "text-[#A81B4E]" : "text-[#9B9590]"}`}
                                >
                                  {delta > 0 ? "+" : ""}{delta}%
                                </span>
                              )}
                            </div>
                            <div className="h-24">
                              <ChartContainer config={{ value: { color: inRange ? "var(--chart-up)" : "var(--destructive)" } }} className="h-full w-full">
                                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                  <XAxis dataKey="date" tick={false} axisLine={false} />
                                  <YAxis domain={["auto", "auto"]} hide />
                                  <ReferenceArea y1={low} y2={high} fill="var(--chart-up)" fillOpacity={0.08} />
                                  {showBaseline && (
                                    <ReferenceLine
                                      y={baselineValue}
                                      stroke="#9B9590"
                                      strokeDasharray="6 3"
                                      strokeWidth={1.5}
                                    />
                                  )}
                                  <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={inRange ? "var(--chart-up)" : "var(--destructive)"}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                  />
                                </LineChart>
                              </ChartContainer>
                            </div>
                            {showBaseline && (
                              <p className="text-xs text-[#9B9590] mt-1" style={{ fontFamily: "Geist Mono" }}>
                                Baseline: {baselineValue} → Current: {currentValue} ({delta !== null ? `${delta > 0 ? "+" : ""}${delta}%` : "N/A"})
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
