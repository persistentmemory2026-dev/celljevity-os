import { useListUsers, useListPatients, useListServices, useGetAuditLogs } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { Users, User, Settings, ShieldCheck, Activity, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: usersData, isLoading: isUsersLoading } = useListUsers({ limit: 1 });
  const { data: patientsData, isLoading: isPatientsLoading } = useListPatients({ limit: 1 });
  const { data: servicesData, isLoading: isServicesLoading } = useListServices({ });
  const { data: auditData, isLoading: isAuditLoading } = useGetAuditLogs({ limit: 5 });

  return (
    <div className="space-y-6 pb-12">
      <header>
        <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and system management.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
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
              <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
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
              <p className="text-sm font-medium text-muted-foreground">Active Services</p>
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
        {/* Quick Links */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Quick Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start h-14 text-base font-normal group">
                <Users className="w-5 h-5 mr-3 text-muted-foreground group-hover:text-primary" /> 
                Manage Users
                <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </Link>
            <Link href="/admin/services">
              <Button variant="outline" className="w-full justify-start h-14 text-base font-normal group">
                <Settings className="w-5 h-5 mr-3 text-muted-foreground group-hover:text-primary" /> 
                Service Catalog
                <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </Link>
            <Link href="/admin/audit">
              <Button variant="outline" className="w-full justify-start h-14 text-base font-normal group">
                <ShieldCheck className="w-5 h-5 mr-3 text-muted-foreground group-hover:text-primary" /> 
                Security & Audit Logs
                <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Audit Logs */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isAuditLoading ? (
              <div className="text-sm text-muted-foreground text-center py-4">Loading logs...</div>
            ) : auditData?.data?.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">No recent activity.</div>
            ) : (
              <div className="space-y-4">
                {auditData?.data?.map(log => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-primary/40 shrink-0" />
                    <div>
                      <p className="font-medium">{log.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {log.userId ? `User: ${log.userId}` : 'System'} • {new Date(log.timestamp).toLocaleString()}
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
