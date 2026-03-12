import { useState } from "react";
import { useListPatients, JourneyStage } from "@workspace/api-client-react";
import { Card, CardContent, Badge, Input, Button } from "@/components/ui";
import { Search, Filter, MoreHorizontal, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function CRM() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<JourneyStage | "">("");

  const { data: patientsList, isLoading } = useListPatients({ 
    search: search || undefined,
    stage: stageFilter as JourneyStage || undefined
  });

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
          { label: t("patient.stages.INTAKE"), value: patientsList?.data?.filter(p => p.journeyStage === 'INTAKE').length || 0, color: "text-amber-600" },
          { label: t("patient.stages.TREATMENT"), value: patientsList?.data?.filter(p => p.journeyStage === 'TREATMENT').length || 0, color: "text-emerald-600" },
          { label: t("patient.stages.FOLLOW_UP"), value: patientsList?.data?.filter(p => p.journeyStage === 'FOLLOW_UP').length || 0, color: "text-blue-600" },
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
          {["ACQUISITION", "INTAKE", "DIAGNOSTICS", "PLANNING", "TREATMENT", "FOLLOW_UP"].map(s => (
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
                patientsList?.data?.map((patient) => (
                  <tr key={patient.id} className="hover:bg-secondary/20 transition-colors group">
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
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
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
