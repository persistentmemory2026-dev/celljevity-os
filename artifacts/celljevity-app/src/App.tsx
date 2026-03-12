import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { SessionTimeoutWarning } from "@/components/SessionTimeoutWarning";

import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import ForgotPassword from "@/pages/Auth/ForgotPassword";
import ResetPassword from "@/pages/Auth/ResetPassword";
import PatientDashboard from "@/pages/Patient/Dashboard";
import PatientBiomarkers from "@/pages/Patient/Biomarkers";
import PatientDocuments from "@/pages/Patient/Documents";
import PatientIntake from "@/pages/Patient/Intake";
import PatientConsent from "@/pages/Patient/Consent";
import CoordinatorCRM from "@/pages/CareCoordinator/CRM";
import CoordinatorLeads from "@/pages/CareCoordinator/Leads";
import CoordinatorQuotes from "@/pages/CareCoordinator/Quotes";
import CoordinatorReports from "@/pages/CareCoordinator/Reports";
import ClinicalDashboard from "@/pages/MedicalProvider/Clinical";
import AdminDashboard from "@/pages/Admin/Dashboard";
import AdminUsers from "@/pages/Admin/Users";
import AdminServices from "@/pages/Admin/Services";
import AdminAuditLogs from "@/pages/Admin/AuditLogs";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function getRoleDashboard(role: string) {
  switch (role) {
    case "PATIENT": return "/dashboard";
    case "CARE_COORDINATOR": return "/crm";
    case "MEDICAL_PROVIDER": return "/clinical";
    case "SUPER_ADMIN": return "/admin";
    default: return "/login";
  }
}

function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Redirect to="/login" />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to={getRoleDashboard(user.role)} />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function HomeRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  return <Redirect to={user ? getRoleDashboard(user.role) : "/login"} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/">{() => <HomeRedirect />}</Route>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      <Route path="/dashboard">
        {() => <ProtectedRoute component={PatientDashboard} allowedRoles={["PATIENT"]} />}
      </Route>
      <Route path="/biomarkers">
        {() => <ProtectedRoute component={PatientBiomarkers} allowedRoles={["PATIENT"]} />}
      </Route>
      <Route path="/documents">
        {() => <ProtectedRoute component={PatientDocuments} allowedRoles={["PATIENT"]} />}
      </Route>
      <Route path="/intake">
        {() => <ProtectedRoute component={PatientIntake} allowedRoles={["PATIENT"]} />}
      </Route>
      <Route path="/consent">
        {() => <ProtectedRoute component={PatientConsent} allowedRoles={["PATIENT"]} />}
      </Route>

      <Route path="/crm">
        {() => <ProtectedRoute component={CoordinatorCRM} allowedRoles={["CARE_COORDINATOR", "SUPER_ADMIN"]} />}
      </Route>
      <Route path="/leads">
        {() => <ProtectedRoute component={CoordinatorLeads} allowedRoles={["CARE_COORDINATOR", "SUPER_ADMIN"]} />}
      </Route>
      <Route path="/quotes">
        {() => <ProtectedRoute component={CoordinatorQuotes} allowedRoles={["CARE_COORDINATOR", "SUPER_ADMIN"]} />}
      </Route>
      <Route path="/reports">
        {() => <ProtectedRoute component={CoordinatorReports} allowedRoles={["CARE_COORDINATOR", "SUPER_ADMIN"]} />}
      </Route>

      <Route path="/clinical">
        {() => <ProtectedRoute component={ClinicalDashboard} allowedRoles={["MEDICAL_PROVIDER"]} />}
      </Route>

      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} allowedRoles={["SUPER_ADMIN"]} />}
      </Route>
      <Route path="/admin/users">
        {() => <ProtectedRoute component={AdminUsers} allowedRoles={["SUPER_ADMIN"]} />}
      </Route>
      <Route path="/admin/services">
        {() => <ProtectedRoute component={AdminServices} allowedRoles={["SUPER_ADMIN"]} />}
      </Route>
      <Route path="/admin/audit">
        {() => <ProtectedRoute component={AdminAuditLogs} allowedRoles={["SUPER_ADMIN"]} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <SessionTimeoutWarning />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
