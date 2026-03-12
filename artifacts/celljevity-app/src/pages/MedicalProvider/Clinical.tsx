import { useState, useMemo } from "react";
import { useListPatients, useListBiomarkers, useListDocuments, useGetIntakeForm, downloadDocument } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input } from "@/components/ui";
import { Search, AlertCircle, User, FileText, Activity, Download, ClipboardCheck, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface PatientRecord {
  id: string;
  firstName: string;
  lastName: string;
  celljevityId: string;
  journeyStage: string;
  dateOfBirth?: string | null;
}

export default function Clinical() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const { data: patientsData, isLoading } = useListPatients({ search: search || undefined, limit: 100 });
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const sortedPatients = useMemo(() => {
    if (!patientsData?.data) return [];
    const priorityOrder: Record<string, number> = { DIAGNOSTICS: 0, TREATMENT: 1, PLANNING: 2, FOLLOW_UP: 3, INTAKE: 4, ACQUISITION: 5 };
    return [...patientsData.data].sort((a: PatientRecord, b: PatientRecord) => {
      return (priorityOrder[a.journeyStage] ?? 99) - (priorityOrder[b.journeyStage] ?? 99);
    });
  }, [patientsData]);

  return (
    <div className="space-y-6 pb-12">
      <header>
        <h1 className="text-3xl font-display font-bold">{t("clinical.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("clinical.description")}</p>
      </header>

      {selectedPatientId ? (
        <PatientDetail 
          patientId={selectedPatientId} 
          patient={patientsData?.data?.find((p: PatientRecord) => p.id === selectedPatientId) || null} 
          onClose={() => setSelectedPatientId(null)} 
        />
      ) : (
        <Card className="shadow-md">
          <div className="p-4 border-b bg-secondary/10 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={t("clinical.searchPlaceholder")}
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t("common.name")}</th>
                  <th className="px-6 py-4 font-semibold">{t("crm.celljevityId")}</th>
                  <th className="px-6 py-4 font-semibold">{t("crm.journeyStage")}</th>
                  <th className="px-6 py-4 font-semibold">{t("clinical.clinicalAlerts")}</th>
                  <th className="px-6 py-4 text-right rtl:text-left">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground animate-pulse">{t("common.loading")}</td></tr>
                ) : sortedPatients.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t("common.noData")}</td></tr>
                ) : (
                  sortedPatients.map((patient: PatientRecord) => (
                    <tr key={patient.id} className="hover:bg-secondary/20 transition-colors group cursor-pointer" onClick={() => setSelectedPatientId(patient.id)}>
                      <td className="px-6 py-4 font-medium flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        {patient.firstName} {patient.lastName}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{patient.celljevityId}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-white">{t(`patient.stages.${patient.journeyStage}`)}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        {patient.journeyStage === 'DIAGNOSTICS' && (
                          <Badge variant="warning" className="gap-1"><AlertCircle className="w-3 h-3" /> {t("clinical.labsPendingReview")}</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right rtl:text-left">
                        <Button size="sm" variant="ghost">{t("clinical.viewChart")}</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function PatientDetail({ patientId, patient, onClose }: { patientId: string, patient: PatientRecord | null, onClose: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: biomarkersData } = useListBiomarkers(patientId);
  const { data: documentsData } = useListDocuments({ documentType: undefined }, { query: { queryKey: ['documents', patientId] } });
  const { data: intakeForm } = useGetIntakeForm(patientId, { query: { enabled: true } });
  const alerts = useMemo(() => {
    const all = biomarkersData?.data?.filter(b => b.statusFlag === 'WARNING' || b.statusFlag === 'CRITICAL') || [];
    return [...all].sort((a, b) => {
      if (a.statusFlag === 'CRITICAL' && b.statusFlag !== 'CRITICAL') return -1;
      if (b.statusFlag === 'CRITICAL' && a.statusFlag !== 'CRITICAL') return 1;
      return 0;
    });
  }, [biomarkersData]);

  const intakeSummary = useMemo(() => {
    if (!intakeForm) return null;
    return {
      isComplete: intakeForm.isComplete,
      hasProfile: !!intakeForm.personalProfile,
      hasHistory: !!intakeForm.medicalHistory,
    };
  }, [intakeForm]);

  const handleDownload = async (docId: string, fileName: string) => {
    try {
      const result = await downloadDocument(docId);
      if (result.downloadUrl) {
        const a = document.createElement('a');
        a.href = result.downloadUrl;
        a.download = fileName;
        a.click();
      }
    } catch {
      toast({ title: t("clinical.downloadFailed"), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onClose} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> {t("clinical.backToList")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> {t("clinical.demographics")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">{t("clinical.fullName")}</div>
                <div className="text-lg font-semibold">{patient?.firstName} {patient?.lastName}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">{t("crm.celljevityId")}</div>
                <div className="font-mono text-sm">{patient?.celljevityId}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">{t("clinical.dateOfBirth")}</div>
                <div>{patient?.dateOfBirth ? format(new Date(patient.dateOfBirth), 'MMM d, yyyy') : 'N/A'}</div>
              </div>
            </CardContent>
          </Card>

          {intakeSummary && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardCheck className="w-5 h-5 text-primary" /> {t("clinical.intakeSummary")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>{t("intake.steps.personalProfile")}</span>
                  <Badge variant={intakeSummary.hasProfile ? "success" : "secondary"}>
                    {intakeSummary.hasProfile ? t("clinical.complete") : t("clinical.pending")}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("intake.steps.medicalHistory")}</span>
                  <Badge variant={intakeSummary.hasHistory ? "success" : "secondary"}>
                    {intakeSummary.hasHistory ? t("clinical.complete") : t("clinical.pending")}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("intake.steps.consentSignature")}</span>
                  <Badge variant={intakeSummary.isComplete ? "success" : "secondary"}>
                    {intakeSummary.isComplete ? t("clinical.complete") : t("clinical.pending")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className={cn("shadow-sm", alerts.length > 0 ? "border-destructive/20" : "")}>
            <CardHeader className={cn("pb-4", alerts.length > 0 ? "bg-destructive/5" : "")}>
              <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                <AlertCircle className="w-5 h-5" /> {t("clinical.clinicalAlerts")} ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {alerts.length === 0 ? (
                <div className="text-sm text-muted-foreground">{t("clinical.noAlerts")}</div>
              ) : (
                alerts.map(a => (
                  <div key={a.id} className={cn(
                    "p-3 rounded-lg border text-sm",
                    a.statusFlag === 'CRITICAL' ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{a.biomarkerType.replace(/_/g, ' ')}</span>
                      <Badge variant={a.statusFlag === 'CRITICAL' ? 'destructive' : 'warning'} className="text-xs">
                        {a.statusFlag === 'CRITICAL' ? t("biomarkers.critical") : t("biomarkers.warning")}
                      </Badge>
                    </div>
                    <div className="text-xs mt-1 text-muted-foreground">{t("clinical.value")}: {a.valueNumeric} {a.unit}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> {t("clinical.keyBiomarkers")}
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={biomarkersData?.data?.map(b => ({ d: format(new Date(b.testDate), 'MMM'), v: parseFloat(b.valueNumeric) })) || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="d" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="v" stroke="#14B8A6" strokeWidth={3} dot={{r: 4}} name={t("patient.biologicalAge")} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> {t("clinical.clinicalDocuments")}
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left rtl:text-right">
                <tbody className="divide-y divide-border">
                  {documentsData?.data?.length === 0 ? (
                    <tr><td className="p-6 text-center text-muted-foreground">{t("clinical.noDocuments")}</td></tr>
                  ) : (
                    documentsData?.data?.slice(0, 10).map(doc => (
                      <tr key={doc.id} className="hover:bg-secondary/20">
                        <td className="px-6 py-3 font-medium flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" /> {doc.fileName}
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant="outline">{doc.documentType}</Badge>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {format(new Date(doc.uploadDate), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-3 text-right rtl:text-left">
                          <Button size="sm" variant="ghost" className="gap-1" onClick={() => handleDownload(doc.id, doc.fileName)}>
                            <Download className="w-3 h-3" /> {t("clinical.download")}
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
      </div>
    </div>
  );
}
