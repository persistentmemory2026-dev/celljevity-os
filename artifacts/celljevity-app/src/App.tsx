import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType, allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleDashboard(user.role)} replace />;
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
  return <Navigate to={user ? getRoleDashboard(user.role) : "/login"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/dashboard" element={<ProtectedRoute component={PatientDashboard} allowedRoles={["PATIENT"]} />} />
      <Route path="/biomarkers" element={<ProtectedRoute component={PatientBiomarkers} allowedRoles={["PATIENT"]} />} />
      <Route path="/documents" element={<ProtectedRoute component={PatientDocuments} allowedRoles={["PATIENT"]} />} />
      <Route path="/intake" element={<ProtectedRoute component={PatientIntake} allowedRoles={["PATIENT"]} />} />
      <Route path="/consent" element={<ProtectedRoute component={PatientConsent} allowedRoles={["PATIENT"]} />} />

      <Route path="/crm" element={<ProtectedRoute component={CoordinatorCRM} allowedRoles={["CARE_COORDINATOR", "SUPER_ADMIN"]} />} />
      <Route path="/leads" element={<ProtectedRoute component={CoordinatorLeads} allowedRoles={["CARE_COORDINATOR", "SUPER_ADMIN"]} />} />
      <Route path="/quotes" element={<ProtectedRoute component={CoordinatorQuotes} allowedRoles={["CARE_COORDINATOR", "SUPER_ADMIN"]} />} />
      <Route path="/reports" element={<ProtectedRoute component={CoordinatorReports} allowedRoles={["CARE_COORDINATOR", "SUPER_ADMIN"]} />} />

      <Route path="/clinical" element={<ProtectedRoute component={ClinicalDashboard} allowedRoles={["MEDICAL_PROVIDER"]} />} />

      <Route path="/admin" element={<ProtectedRoute component={AdminDashboard} allowedRoles={["SUPER_ADMIN"]} />} />
      <Route path="/admin/users" element={<ProtectedRoute component={AdminUsers} allowedRoles={["SUPER_ADMIN"]} />} />
      <Route path="/admin/services" element={<ProtectedRoute component={AdminServices} allowedRoles={["SUPER_ADMIN"]} />} />
      <Route path="/admin/audit" element={<ProtectedRoute component={AdminAuditLogs} allowedRoles={["SUPER_ADMIN"]} />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <SessionTimeoutWarning />
          <AppRoutes />
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
