import { useMemo } from "react";
import { useGetMyProfile, useListBiomarkers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell } from "recharts";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TreatmentDotProps {
  cx?: number;
  cy?: number;
  payload?: { treatment?: string };
}

function TreatmentDot({ cx, cy, payload }: TreatmentDotProps) {
  if (!payload?.treatment || cx === undefined || cy === undefined) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="#f59e0b" stroke="#fff" strokeWidth={2} />
      <text x={cx} y={cy - 14} textAnchor="middle" fill="#f59e0b" fontSize={10} fontWeight="bold">Tx</text>
    </g>
  );
}

interface BiomarkerReading {
  biomarkerType: string;
  testDate: string;
  valueNumeric: number | null;
  unit?: string;
  statusFlag?: string;
  notes?: string;
}

function NoChartData({ message }: { message: string }) {
  return (
    <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
      <BarChart3 className="w-12 h-12 mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export default function Biomarkers() {
  const { t } = useTranslation();
  const { data: profile } = useGetMyProfile();
  const { data: biomarkersList, isLoading } = useListBiomarkers(profile?.id || "", {}, {
    query: { enabled: !!profile?.id }
  });

  const biomarkerRows = useMemo(() => {
    const data = biomarkersList?.data;
    if (!data || data.length === 0) return [];

    const grouped = new Map<string, typeof data>();
    for (const b of data) {
      const key = b.biomarkerType;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(b);
    }

    return Array.from(grouped.entries()).map(([type, readings]) => {
      const sorted = [...readings].sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
      const latest = sorted[0];
      const previous = sorted.length > 1 ? sorted[1] : null;
      const delta = previous && latest.valueNumeric != null && previous.valueNumeric != null
        ? latest.valueNumeric - previous.valueNumeric
        : null;
      const isBaseline = sorted.length === 1;

      const sparkData = [...sorted].reverse().slice(-6).map(r => ({
        v: r.valueNumeric ?? 0,
        d: format(new Date(r.testDate), 'MMM yy'),
      }));

      return { type, latest, delta, isBaseline, sparkData };
    });
  }, [biomarkersList]);

  const ageChartData = useMemo(() => {
    const data = biomarkersList?.data as BiomarkerReading[] | undefined;
    if (!data) return [];
    const ageReadings = data.filter(b => b.biomarkerType === "BIOLOGICAL_AGE" && b.valueNumeric != null);
    if (ageReadings.length === 0) return [];
    return [...ageReadings]
      .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime())
      .map(r => ({
        date: format(new Date(r.testDate), 'yyyy-MM'),
        biological: r.valueNumeric,
        treatment: r.notes || undefined,
      }));
  }, [biomarkersList]);

  const telomereChartData = useMemo(() => {
    const data = biomarkersList?.data as BiomarkerReading[] | undefined;
    if (!data) return [];
    const readings = data.filter(b => b.biomarkerType === "TELOMERE_LENGTH" && b.valueNumeric != null);
    if (readings.length === 0) return [];
    return [...readings]
      .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime())
      .map(r => ({
        d: format(new Date(r.testDate), 'QQQ yyyy'),
        v: r.valueNumeric,
        treatment: r.notes || undefined,
      }));
  }, [biomarkersList]);

  const nkCellChartData = useMemo(() => {
    const data = biomarkersList?.data as BiomarkerReading[] | undefined;
    if (!data) return [];
    const nkReadings = data.filter(b => b.biomarkerType.startsWith("NK_CELL") && b.valueNumeric != null);
    if (nkReadings.length === 0) return [];
    const grouped = new Map<string, BiomarkerReading[]>();
    for (const r of nkReadings) {
      const key = r.biomarkerType;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(r);
    }
    return Array.from(grouped.entries()).map(([type, readings]) => {
      const sorted = [...readings].sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());
      const baseline = sorted[0].valueNumeric ?? 0;
      const current = sorted[sorted.length - 1].valueNumeric ?? 0;
      return { name: type.replace(/_/g, ' '), baseline, current };
    });
  }, [biomarkersList]);

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-display font-bold">{t("biomarkers.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("biomarkers.description")}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>{t("biomarkers.biologicalVsChronological")}</CardTitle>
          </CardHeader>
          <CardContent>
            {ageChartData.length === 0 ? (
              <NoChartData message={t("biomarkers.noAgeData")} />
            ) : (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ageChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number, name: string) => [value, name]}
                      labelFormatter={(label: string) => {
                        const point = ageChartData.find(d => d.date === label);
                        return point?.treatment ? `${label} — ${point.treatment}` : label;
                      }}
                    />
                    <Line type="monotone" dataKey="biological" stroke="#14B8A6" strokeWidth={3} dot={<TreatmentDot />} name={t("patient.biologicalAge")} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>{t("biomarkers.telomereLength")}</CardTitle>
          </CardHeader>
          <CardContent>
            {telomereChartData.length === 0 ? (
              <NoChartData message={t("biomarkers.noTelomereData")} />
            ) : (
              <div className="h-[300px] w-full mt-4 relative">
                <div className="absolute inset-0 z-0 flex flex-col opacity-10">
                  <div className="flex-1 bg-green-500" />
                  <div className="flex-1 bg-yellow-500" />
                  <div className="flex-1 bg-orange-500" />
                  <div className="flex-1 bg-red-500" />
                </div>
                <div className="relative z-10 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={telomereChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="d" tick={{ fontSize: 12 }} />
                      <YAxis domain={[5, 9]} tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelFormatter={(label: string) => {
                          const point = telomereChartData.find(d => d.d === label);
                          return point?.treatment ? `${label} — ${point.treatment}` : label;
                        }}
                      />
                      <ReferenceLine y={7.0} stroke="#22c55e" strokeDasharray="3 3" label={{ value: t("biomarkers.optimal"), position: "right", fill: "#22c55e", fontSize: 11 }} />
                      <Line type="monotone" dataKey="v" stroke="#0f172a" strokeWidth={3} dot={<TreatmentDot />} name="kb" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>{t("biomarkers.nkCellComposition")}</CardTitle>
        </CardHeader>
        <CardContent>
          {nkCellChartData.length === 0 ? (
            <NoChartData message={t("biomarkers.noNkCellData")} />
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nkCellChartData} margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="baseline" name={t("biomarkers.baseline")} radius={[4, 4, 0, 0]} fill="#94a3b8" />
                  <Bar dataKey="current" name={t("biomarkers.current")} radius={[4, 4, 0, 0]}>
                    {nkCellChartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.current > entry.baseline ? "#14B8A6" : "#f43f5e"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>{t("biomarkers.labOverview")}</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl rtl:rounded-tr-xl rtl:rounded-tl-none">{t("common.name")}</th>
                <th className="px-6 py-4">{t("biomarkers.labOverview")}</th>
                <th className="px-6 py-4">{t("common.status")}</th>
                <th className="px-6 py-4">{t("biomarkers.deltaFromPrevious")}</th>
                <th className="px-6 py-4 rounded-tr-xl rtl:rounded-tl-xl rtl:rounded-tr-none">{t("common.date")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{t("common.loading")}</td></tr>
              ) : biomarkerRows.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{t("common.noData")}</td></tr>
              ) : (
                biomarkerRows.map((row) => (
                  <tr key={row.type} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-8">
                          {row.sparkData.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={row.sparkData}>
                                <Line type="monotone" dataKey="v" stroke="#14B8A6" strokeWidth={1.5} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Minus className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium">{row.type.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold font-mono">
                      {row.latest.valueNumeric} <span className="text-muted-foreground text-xs font-sans">{row.latest.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={row.latest.statusFlag === 'OPTIMAL' ? 'success' : row.latest.statusFlag === 'WARNING' ? 'warning' : row.latest.statusFlag === 'CRITICAL' ? 'destructive' : 'default'}>
                        {row.latest.statusFlag === 'OPTIMAL' ? t("biomarkers.optimal") :
                         row.latest.statusFlag === 'NORMAL' ? t("biomarkers.normal") :
                         row.latest.statusFlag === 'WARNING' ? t("biomarkers.warning") :
                         row.latest.statusFlag === 'CRITICAL' ? t("biomarkers.critical") : row.latest.statusFlag}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {row.isBaseline ? (
                        <span className="text-xs text-muted-foreground italic">{t("biomarkers.baselineNote")}</span>
                      ) : row.delta !== null ? (
                        <span className={cn("flex items-center gap-1 text-sm font-medium",
                          row.delta > 0 ? "text-emerald-600" : row.delta < 0 ? "text-red-500" : "text-muted-foreground"
                        )}>
                          {row.delta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : row.delta < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                          {row.delta > 0 ? '+' : ''}{row.delta.toFixed(2)} {t("biomarkers.deltaFromPrevious")}
                        </span>
                      ) : (
                        <Minus className="w-4 h-4 text-muted-foreground" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{format(new Date(row.latest.testDate), 'MMM d, yyyy')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
