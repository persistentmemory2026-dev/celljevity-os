import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetMyProfile, useListBiomarkers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import { motion } from "framer-motion";
import { Activity, ArrowRight, CheckCircle2, Circle, AlertCircle, FileText, Calendar, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const STAGES = ["ACQUISITION", "INTAKE", "DIAGNOSTICS", "PLANNING", "TREATMENT", "FOLLOW_UP"];

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profile, isLoading } = useGetMyProfile();

  const { data: biomarkersData } = useListBiomarkers(profile?.id || "", { limit: 100 }, { 
    query: { enabled: !!profile?.id } 
  });

  const bioSummary = useMemo(() => {
    const data = biomarkersData?.data;
    if (!data || data.length === 0) return null;

    const ageReadings = data.filter(b => b.biomarkerType === "BIOLOGICAL_AGE" && b.valueNumeric != null);
    const telomereReadings = data.filter(b => b.biomarkerType === "TELOMERE_LENGTH" && b.valueNumeric != null);

    const latestAge = ageReadings.length > 0
      ? [...ageReadings].sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())[0]
      : null;

    const latestTelomere = telomereReadings.length > 0
      ? [...telomereReadings].sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())[0]
      : null;

    return { latestAge, latestTelomere };
  }, [biomarkersData]);

  if (isLoading || !profile) return <div className="p-8 text-center text-muted-foreground animate-pulse">{t("common.loading")}</div>;

  const currentStageIdx = STAGES.indexOf(profile.journeyStage);
  const cycleNumber = Math.max(1, Math.floor(currentStageIdx / STAGES.length) + 1);
  const isFollowUp = profile.journeyStage === "FOLLOW_UP";

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground">{t("patient.welcome", { name: user?.firstName })}</h1>
        <p className="text-muted-foreground mt-1">{t("patient.journeyDescription")}</p>
      </header>

      <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            {t("patient.myJourney")}
            <Badge variant="outline" className="ml-2 text-xs">
              {t("patient.cycle", { number: cycleNumber })}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative py-8">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-secondary rounded-full" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${(currentStageIdx / (STAGES.length - 1)) * 100}%` }}
            />
            
            <div className="relative flex justify-between">
              {STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                
                return (
                  <div key={stage} className="flex flex-col items-center gap-3 w-24">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 shadow-sm transition-all duration-300",
                      isCompleted ? "border-accent text-accent" : 
                      isCurrent ? "border-primary bg-primary text-primary-foreground shadow-md scale-110" : 
                      "border-muted-foreground/30 text-muted-foreground"
                    )}>
                      {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : 
                       isCurrent ? <Circle className="w-4 h-4 fill-current" /> : 
                       <span className="text-sm font-bold">{idx + 1}</span>}
                    </div>
                    <span className={cn(
                      "text-xs font-semibold text-center uppercase tracking-wider",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}>
                      {t(`patient.stages.${stage}`)}
                    </span>
                  </div>
                );
              })}
            </div>

            {isFollowUp && (
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-primary">
                <RefreshCw className="w-4 h-4" />
                <span className="text-[10px] font-semibold uppercase">{t("patient.loopBack")}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-destructive/20 shadow-md">
            <CardHeader className="bg-destructive/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="w-5 h-5 text-destructive" />
                {t("patient.actionItems")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {profile.journeyStage === "INTAKE" && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
                  <FileText className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">{t("patient.completeIntake")}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{t("patient.intakeRequired")}</p>
                    <Link to="/intake">
                      <Button variant="link" className="px-0 h-auto text-xs mt-2">{t("patient.startWizard")}</Button>
                    </Link>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">{t("patient.initialConsultation")}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{t("patient.pendingScheduling")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-semibold">{t("clinical.keyBiomarkers")}</h3>
            <Link to="/biomarkers">
              <Button variant="outline" size="sm">{t("patient.viewAll")}</Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div whileHover={{ y: -4 }}>
              <Card className="shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("patient.biologicalAge")}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      {bioSummary?.latestAge ? (
                        <>
                          <span className="text-3xl font-display font-bold">{bioSummary.latestAge.valueNumeric}</span>
                          <span className="text-sm text-muted-foreground">{bioSummary.latestAge.unit || t("biomarkers.years")}</span>
                        </>
                      ) : (
                        <span className="text-lg text-muted-foreground">{t("biomarkers.awaitingData")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {bioSummary?.latestAge?.statusFlag && (
                      <Badge variant={bioSummary.latestAge.statusFlag === 'OPTIMAL' ? 'success' : bioSummary.latestAge.statusFlag === 'WARNING' ? 'warning' : 'default'} className="mb-2">
                        {bioSummary.latestAge.statusFlag === 'OPTIMAL' ? t("biomarkers.optimal") :
                         bioSummary.latestAge.statusFlag === 'WARNING' ? t("biomarkers.warning") :
                         bioSummary.latestAge.statusFlag}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -4 }}>
              <Card className="shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("patient.telomereLength")}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      {bioSummary?.latestTelomere ? (
                        <>
                          <span className="text-3xl font-display font-bold">{bioSummary.latestTelomere.valueNumeric}</span>
                          <span className="text-sm text-muted-foreground">{bioSummary.latestTelomere.unit || "kb"}</span>
                        </>
                      ) : (
                        <span className="text-lg text-muted-foreground">{t("biomarkers.awaitingData")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {bioSummary?.latestTelomere?.statusFlag && (
                      <Badge variant={bioSummary.latestTelomere.statusFlag === 'OPTIMAL' ? 'success' : bioSummary.latestTelomere.statusFlag === 'WARNING' ? 'warning' : 'default'} className="mb-2">
                        {bioSummary.latestTelomere.statusFlag === 'OPTIMAL' ? t("biomarkers.optimal") :
                         bioSummary.latestTelomere.statusFlag === 'WARNING' ? t("biomarkers.warning") :
                         bioSummary.latestTelomere.statusFlag}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
