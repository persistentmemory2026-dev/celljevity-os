import { useListUsers, useListPatients, useListServices, useGetAuditLogs } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { Users, User, Settings, ShieldCheck, Activity, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data: usersData, isLoading: isUsersLoading } = useListUsers({ limit: 1 });
  const { data: patientsData, isLoading: isPatientsLoading } = useListPatients({ limit: 1 });
  const { data: servicesData, isLoading: isServicesLoading } = useListServices({ });
  const { data: auditData, isLoading: isAuditLoading } = useGetAuditLogs({ limit: 5 });

  return (
    <div className="space-y-6 pb-12">
      <header>
        <h1 className="text-3xl font-display font-bold">{t("admin.dashboard.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("admin.dashboard.description")}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("admin.dashboard.totalUsers")}</p>
              <div className="text-3xl font-display font-bold mt-1">
                {isUsersLoading ? "..." : usersData?.total || 0}
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("admin.dashboard.activePatients")}</p>
              <div className="text-3xl font-display font-bold mt-1">
                {isPatientsLoading ? "..." : patientsData?.total || 0}
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("admin.dashboard.services")}</p>
              <div className="text-3xl font-display font-bold mt-1">
                {isServicesLoading ? "..." : servicesData?.data?.filter(s => s.isActive).length || 0}
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>{t("admin.quickManagement")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/users">
              <Button variant="outline" className="w-full justify-start h-14 text-base font-normal group">
                <Users className="w-5 h-5 ltr:mr-3 rtl:ml-3 text-muted-foreground group-hover:text-primary" /> 
                {t("admin.users.title")}
                <ArrowRight className="w-4 h-4 ltr:ml-auto rtl:mr-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </Link>
            <Link to="/admin/services">
              <Button variant="outline" className="w-full justify-start h-14 text-base font-normal group">
                <Settings className="w-5 h-5 ltr:mr-3 rtl:ml-3 text-muted-foreground group-hover:text-primary" /> 
                {t("admin.services.title")}
                <ArrowRight className="w-4 h-4 ltr:ml-auto rtl:mr-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </Link>
            <Link to="/admin/audit">
              <Button variant="outline" className="w-full justify-start h-14 text-base font-normal group">
                <ShieldCheck className="w-5 h-5 ltr:mr-3 rtl:ml-3 text-muted-foreground group-hover:text-primary" /> 
                {t("admin.audit.title")}
                <ArrowRight className="w-4 h-4 ltr:ml-auto rtl:mr-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>{t("admin.recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isAuditLoading ? (
              <div className="text-sm text-muted-foreground text-center py-4">{t("common.loading")}</div>
            ) : auditData?.data?.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">{t("common.noData")}</div>
            ) : (
              <div className="space-y-4">
                {auditData?.data?.map(log => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-primary/40 shrink-0" />
                    <div>
                      <p className="font-medium">{log.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {log.userId || 'System'} &bull; {new Date(log.timestamp).toLocaleString()}
                      </p>
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
