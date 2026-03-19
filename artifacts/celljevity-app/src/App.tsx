import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Services } from "./pages/Services";
import { Quotes } from "./pages/Quotes";
import { NewQuote } from "./pages/NewQuote";
import { Documents } from "./pages/Documents";
import { AdminUsers } from "./pages/AdminUsers";
import { AdminServices } from "./pages/AdminServices";
import { Patients } from "./pages/Patients";
import { PatientDetail } from "./pages/PatientDetail";
import { PatientHome } from "./pages/patient/PatientHome";
import { MyTreatments } from "./pages/patient/MyTreatments";
import { MyBiomarkers } from "./pages/patient/MyBiomarkers";
import { MyDocuments } from "./pages/patient/MyDocuments";
import { MyItinerary } from "./pages/patient/MyItinerary";
import { MyProfile } from "./pages/patient/MyProfile";
import { AcceptInvite } from "./pages/AcceptInvite";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { BottomNav } from "./components/BottomNav";
import { PageBreadcrumb } from "./components/PageBreadcrumb";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";

export type PageId =
  | "dashboard" | "services" | "quotes" | "documents" | "new-quote"
  | "admin-users" | "admin-services" | "patients" | "patient-detail"
  | "my-dashboard" | "my-treatments" | "my-biomarkers" | "my-documents" | "my-itinerary" | "my-profile";

export type NavigationContext = {
  patientId?: string;
  quoteId?: string;
  serviceId?: string;
  serviceName?: string;
  servicePrice?: number;
};

export type User = {
  _id: string;
  email: string;
  name: string;
  role: string;
  linkedPatientId?: string;
};

const PATIENT_PAGES: PageId[] = ["my-dashboard", "my-treatments", "my-biomarkers", "my-documents", "my-itinerary", "my-profile"];
const STAFF_PAGES: PageId[] = ["dashboard", "services", "quotes", "documents", "new-quote", "admin-users", "admin-services", "patients", "patient-detail"];

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-lg p-8 text-center text-foreground">
            <h2 className="text-xl font-semibold mb-2">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-6">
              An unexpected error occurred. Please try reloading the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

class PageErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset?: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onReset?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { children: React.ReactNode }) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 bg-background">
          <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-lg p-8 text-center text-foreground">
            <h2 className="text-xl font-semibold mb-2">
              Page failed to load
            </h2>
            <p className="text-muted-foreground mb-6">
              Something went wrong loading this page. Try navigating to another page using the sidebar.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onReset?.();
              }}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function getInviteToken(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("invite");
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<PageId>("dashboard");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [navContext, setNavContext] = useState<NavigationContext>({});
  const [loading, setLoading] = useState(true);
  const [inviteToken, setInviteToken] = useState<string | null>(getInviteToken);

  const login = useMutation(api.auth.login);

  const savedUserId = localStorage.getItem("userId");
  const meResult = useQuery(
    api.auth.getMe,
    savedUserId ? { userId: savedUserId as Id<"users"> } : "skip"
  );

  // Restore session from stored userId
  useEffect(() => {
    if (meResult === undefined && savedUserId) {
      // Still loading
      return;
    }

    if (meResult && savedUserId) {
      setUser({
        _id: meResult.userId ?? savedUserId,
        email: meResult.email ?? "",
        name: meResult.name ?? "",
        role: meResult.role ?? "patient",
        linkedPatientId: meResult.linkedPatientId ?? undefined,
      } as User);
    } else if (meResult === null && savedUserId) {
      // Stored userId is invalid, clear it
      localStorage.removeItem("userId");
      setUser(null);
    }

    setLoading(false);
  }, [meResult, savedUserId]);

  // If there's no saved userId, stop loading immediately
  useEffect(() => {
    if (!savedUserId) {
      setLoading(false);
    }
  }, [savedUserId]);

  const handleLogin = async (email: string, password: string) => {
    const result = await login({ email, password });
    if (result) {
      const userData: User = {
        _id: result.userId,
        email: result.email,
        name: result.name,
        role: result.role,
        linkedPatientId: result.linkedPatientId ?? undefined,
      };
      setUser(userData);
      localStorage.setItem("userId", result.userId);
      // Navigate patient users to patient dashboard
      setCurrentPage(result.role === "patient" ? "my-dashboard" : "dashboard");
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("userId");
    setCurrentPage("dashboard");
  };

  const isDirtyRef = useRef(false);

  const handleNavigate = (page: PageId, ctx?: NavigationContext | string) => {
    if (currentPage === "new-quote" && isDirtyRef.current) {
      if (!window.confirm("Discard unsaved changes?")) return;
    }
    isDirtyRef.current = false;
    setCurrentPage(page);
    if (typeof ctx === "string") {
      // Backward compat: patientId as string
      setSelectedPatientId(ctx);
      setNavContext({ patientId: ctx });
    } else if (ctx) {
      setNavContext(ctx);
      if (ctx.patientId) setSelectedPatientId(ctx.patientId);
    } else {
      setNavContext({});
    }
  };

  const handleDirtyChange = useCallback((dirty: boolean) => {
    isDirtyRef.current = dirty;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && inviteToken) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <AcceptInvite
          token={inviteToken}
          onAccepted={(userData) => {
            setUser(userData);
            setInviteToken(null);
            // Clear invite param from URL
            window.history.replaceState({}, "", window.location.pathname);
            setCurrentPage("my-dashboard");
          }}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  const isPatient = user.role === "patient";
  const defaultPage = isPatient ? "my-dashboard" : "dashboard";

  const renderPage = () => {
    // Guard: patients can only access patient pages
    if (isPatient && STAFF_PAGES.includes(currentPage)) {
      return <PatientHome userId={user._id} linkedPatientId={user.linkedPatientId!} onNavigate={handleNavigate} />;
    }
    // Guard: staff cannot access patient pages
    if (!isPatient && PATIENT_PAGES.includes(currentPage)) {
      return <Dashboard userId={user._id} onNavigate={handleNavigate} />;
    }
    // Guard admin pages for non-admin users
    if ((currentPage === "admin-users" || currentPage === "admin-services") && user.role !== "admin") {
      return <Dashboard userId={user._id} onNavigate={handleNavigate} />;
    }

    switch (currentPage) {
      // Staff pages
      case "dashboard":
        return <Dashboard userId={user._id} onNavigate={handleNavigate} />;
      case "services":
        return <Services onNavigate={handleNavigate} />;
      case "quotes":
        return <Quotes userId={user._id} onNavigate={handleNavigate} navContext={navContext} />;
      case "new-quote":
        return <NewQuote userId={user._id} onNavigate={handleNavigate} onDirtyChange={handleDirtyChange} navContext={navContext} />;
      case "documents":
        return <Documents userId={user._id} />;
      case "admin-users":
        return <AdminUsers userId={user._id} />;
      case "admin-services":
        return <AdminServices userId={user._id} />;
      case "patients":
        return (
          <Patients
            userId={user._id}
            onNavigate={handleNavigate}
          />
        );
      case "patient-detail":
        return selectedPatientId ? (
          <PatientDetail
            userId={user._id}
            patientId={selectedPatientId}
            onNavigate={handleNavigate}
          />
        ) : (
          <Patients userId={user._id} onNavigate={handleNavigate} />
        );

      // Patient pages
      case "my-dashboard":
        return <PatientHome userId={user._id} linkedPatientId={user.linkedPatientId!} onNavigate={handleNavigate} />;
      case "my-treatments":
        return <MyTreatments userId={user._id} linkedPatientId={user.linkedPatientId!} />;
      case "my-biomarkers":
        return <MyBiomarkers userId={user._id} linkedPatientId={user.linkedPatientId!} />;
      case "my-documents":
        return <MyDocuments userId={user._id} linkedPatientId={user.linkedPatientId!} />;
      case "my-itinerary":
        return <MyItinerary userId={user._id} linkedPatientId={user.linkedPatientId!} />;
      case "my-profile":
        return <MyProfile userId={user._id} />;

      default:
        return isPatient
          ? <PatientHome userId={user._id} linkedPatientId={user.linkedPatientId!} onNavigate={handleNavigate} />
          : <Dashboard userId={user._id} onNavigate={handleNavigate} />;
    }
  };

  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={300}>
        <div className="h-screen w-full overflow-hidden bg-background text-foreground">
          <Sidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            user={user}
            onLogout={handleLogout}
          />
          <Header user={user} currentPage={currentPage} onNavigate={handleNavigate} />
          <main className="ml-0 md:ml-64 pt-16 h-screen overflow-y-auto bg-background relative">
            <div className="px-5 md:px-8 py-4">
              <PageBreadcrumb
                currentPage={currentPage}
                navContext={navContext}
                onNavigate={handleNavigate}
                userId={user._id}
              />
            </div>
            <div className="pb-24 md:pb-8">
              <PageErrorBoundary
                key={currentPage}
                onReset={() => setCurrentPage(defaultPage)}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPage}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {renderPage()}
                  </motion.div>
                </AnimatePresence>
              </PageErrorBoundary>
            </div>
          </main>
          <BottomNav currentPage={currentPage} onNavigate={handleNavigate} user={user} />
        </div>
        <Toaster />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
