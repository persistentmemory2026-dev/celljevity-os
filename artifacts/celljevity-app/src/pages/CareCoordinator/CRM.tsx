import { useState, useMemo } from "react";
import { useListPatients, useListBiomarkers, useListDocuments, useGetIntakeForm, useListQuotes, JourneyStage } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Input, Button } from "@/components/ui";
import { Search, UserPlus, ChevronRight, User, Activity, FileText, ClipboardCheck, Receipt, CheckCircle2, Circle, ArrowLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface PatientRecord {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  celljevityId: string;
  journeyStage: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  careCoordinatorId?: string | null;
  medicalProviderId?: string | null;
  updatedAt?: string;
}

const STAGES = ["ACQUISITION", "INTAKE", "DIAGNOSTICS", "PLANNING", "TREATMENT", "FOLLOW_UP"];

export default function CRM() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const initialStage = searchParams.get("stage") || "";
  const [stageFilter, setStageFilter] = useState<JourneyStage | "">(initialStage as JourneyStage | "");
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);

  const { data: patientsList, isLoading } = useListPatients({ 
    search: search || undefined,
    stage: stageFilter as JourneyStage || undefined
  });

  if (selectedPatient) {
    return <PatientDetailPanel patient={selectedPatient} onClose={() => setSelectedPatient(null)} />;
  }

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">{t("crm.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("crm.description")}</p>
        </div>
        <Link to="/leads">
          <Button className="bg-primary hover:bg-primary/90">
            <UserPlus className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> {t("leads.title")}
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t("crm.totalPatients"), value: patientsList?.total || 0, color: "text-foreground" },
          { label: t("patient.stages.INTAKE"), value: patientsList?.data?.filter((p: PatientRecord) => p.journeyStage === 'INTAKE').length || 0, color: "text-amber-600" },
          { label: t("patient.stages.TREATMENT"), value: patientsList?.data?.filter((p: PatientRecord) => p.journeyStage === 'TREATMENT').length || 0, color: "text-emerald-600" },
          { label: t("patient.stages.FOLLOW_UP"), value: patientsList?.data?.filter((p: PatientRecord) => p.journeyStage === 'FOLLOW_UP').length || 0, color: "text-blue-600" },
        ].map(stat => (
          <Card key={stat.label} className="shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <span className={`text-2xl font-bold font-display ${stat.color}`}>{stat.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder={t("crm.searchPlaceholder")} 
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="h-10 rounded-xl border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-primary/20"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as JourneyStage)}
        >
          <option value="">{t("common.all")}</option>
          {STAGES.map(s => (
            <option key={s} value={s}>{t(`patient.stages.${s}`)}</option>
          ))}
        </select>
      </div>

      <Card className="shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
              <tr>
                <th className="px-6 py-4 font-semibold">{t("common.name")}</th>
                <th className="px-6 py-4 font-semibold">{t("crm.celljevityId")}</th>
                <th className="px-6 py-4 font-semibold">{t("crm.journeyStage")}</th>
                <th className="px-6 py-4 font-semibold">{t("common.phone")}</th>
                <th className="px-6 py-4 text-right rtl:text-left">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t("common.loading")}</td></tr>
              ) : patientsList?.data?.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t("common.noData")}</td></tr>
              ) : (
                patientsList?.data?.map((patient: PatientRecord) => (
                  <tr key={patient.id} className="hover:bg-secondary/20 transition-colors group cursor-pointer" onClick={() => setSelectedPatient(patient)}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{patient.firstName} {patient.lastName}</div>
                      <div className="text-xs text-muted-foreground">{patient.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{patient.celljevityId}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-white">
                        {t(`patient.stages.${patient.journeyStage}`)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{patient.phone || '-'}</td>
                    <td className="px-6 py-4 text-right rtl:text-left">
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                        {t("crm.viewDetail")} <ChevronRight className="w-4 h-4" />
                      </Button>
                    </td>
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

function PatientDetailPanel({ patient, onClose }: { patient: PatientRecord; onClose: () => void }) {
  const { t } = useTranslation();
  const { data: biomarkersData } = useListBiomarkers(patient.id);
  const { data: intakeForm } = useGetIntakeForm(patient.id, { query: { enabled: true } });
  const { data: quotesData } = useListQuotes({ patientId: patient.id });

  const currentStageIdx = STAGES.indexOf(patient.journeyStage);

  const intakeCompletion = useMemo(() => {
    if (!intakeForm) return 0;
    if (intakeForm.isComplete) return 100;
    let steps = 0;
    if (intakeForm.personalProfile) steps++;
    if (intakeForm.medicalHistory) steps++;
    return Math.round((steps / 4) * 100);
  }, [intakeForm]);

  const alertCount = biomarkersData?.data?.filter(b => b.statusFlag === 'WARNING' || b.statusFlag === 'CRITICAL').length || 0;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onClose} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> {t("common.back")}
        </Button>
        <h2 className="text-2xl font-display font-bold">{patient.firstName} {patient.lastName}</h2>
        <Badge variant="outline">{patient.celljevityId}</Badge>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" /> {t("crm.journeyTimeline")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative py-6">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-secondary rounded-full" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent rounded-full transition-all"
              style={{ width: `${(currentStageIdx / (STAGES.length - 1)) * 100}%` }}
            />
            <div className="relative flex justify-between">
              {STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                return (
                  <div key={stage} className="flex flex-col items-center gap-2 w-20">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center bg-white border-2 shadow-sm text-xs font-bold",
                      isCompleted ? "border-accent text-accent" : isCurrent ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground"
                    )}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : isCurrent ? <Circle className="w-3 h-3 fill-current" /> : idx + 1}
                    </div>
                    <span className={cn("text-[10px] font-semibold text-center uppercase", isCurrent ? "text-primary" : "text-muted-foreground")}>
                      {t(`patient.stages.${stage}`)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t("crm.intakeProgress")}</div>
                <div className="text-xl font-bold">{intakeCompletion}%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t("crm.biomarkerAlerts")}</div>
                <div className="text-xl font-bold">{alertCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-accent" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t("crm.activeQuotes")}</div>
                <div className="text-xl font-bold">{quotesData?.data?.length || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t("crm.coordinator")}</div>
                <div className="text-sm font-medium">{patient.careCoordinatorId ? t("crm.assigned") : t("crm.unassigned")}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-4 h-4" /> {t("crm.patientInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t("common.email")}</span>
                <div className="font-medium">{patient.email || '-'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">{t("common.phone")}</span>
                <div className="font-medium">{patient.phone || '-'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">{t("clinical.dateOfBirth")}</span>
                <div className="font-medium">{patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'MMM d, yyyy') : '-'}</div>
              </div>
              <div>
                <span className="text-muted-foreground">{t("crm.lastUpdated")}</span>
                <div className="font-medium">{patient.updatedAt ? format(new Date(patient.updatedAt), 'MMM d, yyyy') : '-'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-4 h-4" /> {t("crm.quotesOverview")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!quotesData?.data?.length ? (
              <div className="text-sm text-muted-foreground py-4 text-center">{t("common.noData")}</div>
            ) : (
              <div className="space-y-2">
                {quotesData.data.slice(0, 5).map(q => (
                  <div key={q.id} className="flex items-center justify-between p-2 rounded-lg border bg-secondary/20">
                    <div className="text-sm">
                      <span className="font-mono text-xs">{q.invoiceNumber}</span>
                      <span className="text-muted-foreground ml-2">{format(new Date(q.issueDate), 'MMM d')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">{formatCurrency(q.totalAmount, q.currency)}</span>
                      <Badge variant={q.status === 'PAID' || q.status === 'ACCEPTED' ? 'success' : q.status === 'DRAFT' ? 'secondary' : 'default'} className="text-xs">
                        {q.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
