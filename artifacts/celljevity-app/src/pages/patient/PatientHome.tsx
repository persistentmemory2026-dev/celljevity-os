import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { PageId } from "../../App";
import { Skeleton } from "@/components/ui/skeleton";
import { Beaker, Hourglass, HeartPulse, Zap } from "lucide-react";
import { computeHealthScore, getValueStatus } from "@/lib/biomarkers";
import { BIOMARKER_DEFINITIONS } from "@convex/biomarkerDefinitions";

// Dashboard visualization components
import { HealthScoreGauge } from "@/components/dashboard/BiologicalGauge";
import { FocusProtocols } from "@/components/dashboard/FocusProtocols";
import { LongevityVectorTrend } from "@/components/dashboard/LongevityVectorTrend";
import { AsymmetricInfoGrid } from "@/components/dashboard/AsymmetricInfoGrid";
import type { InfoCardData } from "@/components/dashboard/AsymmetricInfoGrid";
import type { Protocol } from "@/components/dashboard/FocusProtocols";

interface PatientHomeProps {
  userId: string;
  linkedPatientId: string;
  onNavigate: (page: PageId) => void;
}

export function PatientHome({ userId, linkedPatientId, onNavigate }: PatientHomeProps) {
  const patient = useQuery(api.patients.getMyProfile, { callerId: userId as Id<"users"> });
  const treatments = useQuery(api.treatments.listByPatient, {
    callerId: userId as Id<"users">,
    patientId: linkedPatientId as Id<"patients">,
  });
  const biomarkers = useQuery(api.biomarkers.listByPatient, {
    callerId: userId as Id<"users">,
    patientId: linkedPatientId as Id<"patients">,
  });
  const documents = useQuery(api.documents.listByPatient, {
    userId: userId as Id<"users">,
    patientId: linkedPatientId as Id<"patients">,
  });
  const itineraries = useQuery(api.itineraries.listByPatient, {
    callerId: userId as Id<"users">,
    patientId: linkedPatientId as Id<"patients">,
  });

  if (patient === undefined) {
    return (
      <div className="px-5 md:px-8 py-6 space-y-6">
        <Skeleton className="h-10 w-64 bg-surface-container" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl bg-surface-container" />)}
        </div>
        <Skeleton className="h-64 rounded-xl bg-surface-container" />
      </div>
    );
  }

  const upcomingTreatments = treatments?.filter((t: any) => t.status === "scheduled") ?? [];
  const completedTreatments = treatments?.filter((t: any) => t.status === "completed") ?? [];
  const recentTreatments = treatments?.slice(0, 5) ?? [];

  // --- Compute real data for dashboard components ---

  // HealthScoreGauge: compute from latest biomarker per code
  const latestByCode: Record<string, any> = {};
  biomarkers?.forEach((b: any) => {
    if (!latestByCode[b.biomarkerCode] || b.measuredAt > latestByCode[b.biomarkerCode].measuredAt) {
      latestByCode[b.biomarkerCode] = b;
    }
  });
  const latestValues = Object.values(latestByCode);
  const healthScore = computeHealthScore(latestValues);
  const withRanges = latestValues.filter(b => b.refRangeLow != null && b.refRangeHigh != null);
  const inRange = withRanges.filter(b => b.value >= b.refRangeLow! && b.value <= b.refRangeHigh!);

  // FocusProtocols: from active treatments
  const activeProtocols: Protocol[] = (treatments ?? [])
    .filter((t: any) => t.status === "in-progress" || t.status === "scheduled")
    .slice(0, 3)
    .map((t: any) => ({
      name: t.serviceName,
      value: t.status === "in-progress" ? "Active" : "Scheduled",
      progress: t.status === "in-progress" ? 66 : 33,
      color: (t.status === "in-progress" ? "primary" : "secondary") as "primary" | "secondary",
    }));

  // LongevityVectorTrend: pick biomarker with most data points
  const codeCounts: Record<string, number> = {};
  biomarkers?.forEach((b: any) => {
    codeCounts[b.biomarkerCode] = (codeCounts[b.biomarkerCode] || 0) + 1;
  });
  const trendCode = Object.entries(codeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const trendData = trendCode
    ? (biomarkers ?? [])
        .filter((b: any) => b.biomarkerCode === trendCode)
        .sort((a: any, b: any) => a.measuredAt.localeCompare(b.measuredAt))
        .map((b: any) => ({ date: b.measuredAt, value: b.value }))
    : [];
  const trendDef = BIOMARKER_DEFINITIONS.find(d => d.code === trendCode);

  // AsymmetricInfoGrid: top biomarker per category
  const CATEGORY_ICONS = {
    Aging: Hourglass,
    Cardiovascular: HeartPulse,
    Metabolic: Zap,
    Inflammation: HeartPulse,
    Hormonal: Zap,
    Lipids: HeartPulse,
  } as const;

  const categoryCards: InfoCardData[] = ["Aging", "Cardiovascular", "Metabolic"]
    .reduce<InfoCardData[]>((acc, cat) => {
      const defs = BIOMARKER_DEFINITIONS.filter(d => d.category === cat);
      const latest = defs.map(d => latestByCode[d.code]).filter(Boolean);
      if (latest.length === 0) return acc;
      const best = latest[0];
      const def = BIOMARKER_DEFINITIONS.find(d => d.code === best.biomarkerCode);
      const status = getValueStatus(best.value, best.refRangeLow, best.refRangeHigh);
      acc.push({
        icon: CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS] ?? Zap,
        title: def?.name ?? best.biomarkerName,
        value: String(best.value),
        unit: best.unit,
        status: status === "green" ? "success" : status === "red" ? "warning" : "muted",
      });
      return acc;
    }, []);

  return (
    <div className="px-5 md:px-12 py-6 md:py-12 space-y-8 bg-background min-h-screen">
      {/* Header Section */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-display text-foreground mb-2">Welcome back, {patient.firstName}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success"></span>
            Your health dashboard is up to date
          </p>
        </div>
        <div className="text-left md:text-right">
          <span className="text-xs text-muted-foreground block mb-1">Last Updated</span>
          <span className="text-sm font-medium text-foreground">
            {new Date().toLocaleDateString('en-GB')} — {new Date().toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}
          </span>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-8 items-start">

        {/* Health Score Gauge (8 cols) */}
        <div className="col-span-12 lg:col-span-8">
          <HealthScoreGauge score={healthScore} totalMarkers={withRanges.length} inRange={inRange.length} />
        </div>

        {/* Focus Protocols Sidebar (4 cols) */}
        <div className="col-span-12 lg:col-span-4">
          <FocusProtocols protocols={activeProtocols} />
        </div>

        {/* Treatment Overview */}
        <div className="col-span-12 bg-card rounded-2xl p-8 border border-border shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-base font-display text-foreground">Treatment Overview</h3>
            <div className="flex gap-4">
              <span className="text-xs flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-chart-1"></span> Pending
              </span>
              <span className="text-xs flex items-center gap-1.5 text-foreground">
                <span className="w-2 h-2 rounded-full bg-chart-up"></span> Completed
              </span>
            </div>
          </div>
          <div className="h-48 w-full flex items-end justify-between px-4 pb-4 border-b border-border text-center">
              <div className="flex flex-col items-center w-full gap-2 cursor-pointer group" onClick={() => onNavigate("my-treatments")}>
                 <div className="w-full h-16 bg-chart-up/80 group-hover:bg-chart-up rounded-t-sm transition-all relative">
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-chart-up opacity-0 group-hover:opacity-100">{completedTreatments.length}</span>
                 </div>
                 <span className="text-xs text-muted-foreground">Done</span>
              </div>
              <div className="flex flex-col items-center w-full gap-2 cursor-pointer group" onClick={() => onNavigate("my-treatments")}>
                 <div className="w-full h-24 bg-chart-1/50 group-hover:bg-chart-1 rounded-t-sm transition-all relative">
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-chart-1 opacity-0 group-hover:opacity-100">{upcomingTreatments.length}</span>
                 </div>
                 <span className="text-xs text-muted-foreground">Soon</span>
              </div>
              <div className="flex flex-col items-center w-full gap-2 cursor-pointer group" onClick={() => onNavigate("my-documents")}>
                 <div className="w-full h-[40px] bg-secondary/50 group-hover:bg-secondary rounded-t-sm transition-all relative">
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-secondary-foreground opacity-0 group-hover:opacity-100">{documents?.length ?? 0}</span>
                 </div>
                 <span className="text-xs text-muted-foreground">Docs</span>
              </div>
              <div className="flex flex-col items-center w-full gap-2 cursor-pointer group" onClick={() => onNavigate("my-biomarkers")}>
                 <div className="w-full h-[90px] bg-primary/50 group-hover:bg-primary rounded-t-sm transition-all relative">
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-primary opacity-0 group-hover:opacity-100">{biomarkers?.length ?? 0}</span>
                 </div>
                 <span className="text-xs text-muted-foreground">Bio</span>
              </div>
          </div>
          <div className="mt-4 flex justify-between px-6 text-xs text-muted-foreground">
            <span>Activity Distribution</span>
          </div>
        </div>

        {/* Longevity Vector Trend (full width) */}
        <div className="col-span-12">
          <LongevityVectorTrend data={trendData} label={trendDef?.name ?? "Health Score"} unit={trendDef?.unit} />
        </div>

        {/* Asymmetric Info Grid (full width) */}
        <div className="col-span-12">
          <AsymmetricInfoGrid cards={categoryCards} />
        </div>

        {/* Recent Treatments */}
        <div className="col-span-12 bg-card rounded-2xl p-8 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-display text-foreground">Recent Treatments</h3>
            <button className="text-sm text-primary font-medium hover:text-primary/80 transition-colors" onClick={() => onNavigate("my-treatments")}>
              View All
            </button>
          </div>
          <div className="space-y-0">
            {recentTreatments.length === 0 ? (
               <div className="py-8 text-center text-muted-foreground text-sm">
                 No treatments yet
               </div>
            ) : (
              recentTreatments.map((t: any) => (
                <div key={t._id} className="group flex items-center justify-between py-5 border-b border-border last:border-0 hover:bg-muted/50 transition-colors px-4 -mx-4 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 bg-muted flex items-center justify-center rounded-lg ${t.status === 'completed' ? 'text-success' : 'text-muted-foreground'}`}>
                      <Beaker className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.serviceName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.scheduledDate ?? "Date TBD"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden md:block text-right">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        t.status === "completed" ? "bg-success/10 text-success" :
                        t.status === "scheduled" ? "bg-info/10 text-info" :
                        "bg-muted text-muted-foreground"
                      }`}>{t.status}</span>
                    </div>
                    <button className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground group-hover:text-foreground">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
