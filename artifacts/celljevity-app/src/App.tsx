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
import { Sidebar } from "./components/Sidebar";
import { PageBreadcrumb } from "./components/PageBreadcrumb";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

export type PageId = "dashboard" | "services" | "quotes" | "documents" | "new-quote" | "admin-users" | "admin-services" | "patients" | "patient-detail";

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
};

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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<PageId>("dashboard");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [navContext, setNavContext] = useState<NavigationContext>({});
  const [loading, setLoading] = useState(true);

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
      const userData = { ...result, _id: result.userId } as User;
      setUser(userData);
      localStorage.setItem("userId", result.userId);
      setCurrentPage("dashboard");
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
      <div className="min-h-screen flex items-center justify-center bg-background dark text-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dark">
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  const renderPage = () => {
    // Guard admin pages for non-admin users
    if ((currentPage === "admin-users" || currentPage === "admin-services") && user.role !== "admin") {
      return <Dashboard userId={user._id} onNavigate={handleNavigate} />;
    }

    switch (currentPage) {
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
      default:
        return <Dashboard userId={user._id} onNavigate={handleNavigate} />;
    }
  };

  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={300}>
        <div className="min-h-screen bg-background text-foreground dark flex">
          <Sidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            user={user}
            onLogout={handleLogout}
          />
          <main className="flex-1 overflow-auto md:ml-0 ml-0 pt-14 md:pt-0">
            <div className="px-5 md:px-8 pt-6 pb-2">
              <PageBreadcrumb
                currentPage={currentPage}
                navContext={navContext}
                onNavigate={handleNavigate}
                userId={user._id}
              />
            </div>
            <PageErrorBoundary
              key={currentPage}
              onReset={() => setCurrentPage("dashboard")}
            >
              {renderPage()}
            </PageErrorBoundary>
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
