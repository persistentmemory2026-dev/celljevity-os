import { useListPatients, useListLeads } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const STAGES = ['ACQUISITION', 'INTAKE', 'DIAGNOSTICS', 'PLANNING', 'TREATMENT', 'FOLLOW_UP'];

export default function Reports() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: patientsData, isLoading: isLoadingPatients } = useListPatients({ limit: 1000 });
  const { data: leadsData, isLoading: isLoadingLeads } = useListLeads({ limit: 1000 });

  const totalLeads = leadsData?.total || 0;
  const convertedLeads = leadsData?.data?.filter(l => l.status === 'CONVERTED').length || 0;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const totalPatients = patientsData?.total || 0;
  const completedIntake = patientsData?.data?.filter(p => p.journeyStage !== 'INTAKE' && p.journeyStage !== 'ACQUISITION').length || 0;
  const intakeCompletionRate = totalPatients > 0 ? Math.round((completedIntake / totalPatients) * 100) : 0;

  const stageData = STAGES.map(stage => ({
    name: t(`patient.stages.${stage}`),
    stage,
    count: patientsData?.data?.filter(p => p.journeyStage === stage).length || 0
  }));

  const sources = leadsData?.data?.reduce((acc: Record<string, number>, lead) => {
    if (lead.source) {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
    }
    return acc;
  }, {}) || {};

  const sourceData = Object.entries(sources).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  const COLORS = ['#14B8A6', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E'];

  const handleBarClick = (data: { stage?: string }) => {
    if (data?.stage) {
      navigate(`/crm?stage=${data.stage}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <header>
        <h1 className="text-3xl font-display font-bold">{t("reports.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("reports.description")}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("reports.conversionRate")}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold text-foreground">{conversionRate}%</span>
              <span className="text-sm text-muted-foreground">({convertedLeads} / {totalLeads})</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-l-4 border-l-accent">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("reports.intakeCompletion")}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold text-foreground">{intakeCompletionRate}%</span>
              <span className="text-sm text-muted-foreground">({completedIntake} / {totalPatients})</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("patient.stages.TREATMENT")}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-display font-bold text-foreground">
                {patientsData?.data?.filter(p => p.journeyStage === 'TREATMENT').length || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>{t("reports.patientsByStage")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("reports.clickToFilter")}</p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {isLoadingPatients ? (
                <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">{t("common.loading")}</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{fontSize: 10}} 
                      interval={0} 
                      angle={-45} 
                      textAnchor="end" 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" fill="#0f172a" radius={[4, 4, 0, 0]} className="cursor-pointer" onClick={handleBarClick} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>{t("reports.leadsBySource")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {isLoadingLeads ? (
                <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">{t("common.loading")}</div>
              ) : sourceData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">{t("common.noData")}</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {sourceData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '12px'}} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
