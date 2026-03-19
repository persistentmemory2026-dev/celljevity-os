import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { BIOMARKER_DEFINITIONS, BIOMARKER_CATEGORIES } from "@convex/biomarkerDefinitions";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceArea } from "recharts";

interface MyBiomarkersProps {
  userId: string;
  linkedPatientId: string;
}

export function MyBiomarkers({ userId, linkedPatientId }: MyBiomarkersProps) {
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
                      {chartData.length > 1 && (
                        <div className="h-24 mt-2">
                          <ChartContainer config={{ value: { color: inRange ? "var(--chart-up)" : "var(--destructive)" } }} className="h-full w-full">
                            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                              <XAxis dataKey="date" tick={false} axisLine={false} />
                              <YAxis domain={["auto", "auto"]} hide />
                              <ReferenceArea y1={low} y2={high} fill="var(--chart-up)" fillOpacity={0.08} />
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
                      )}
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
