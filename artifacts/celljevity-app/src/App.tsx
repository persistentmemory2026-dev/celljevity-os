import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Services } from "./pages/Services";
import { Quotes } from "./pages/Quotes";
import { NewQuote } from "./pages/NewQuote";
import { Documents } from "./pages/Documents";
import { Sidebar } from "./components/Sidebar";

export type User = {
  _id: string;
  email: string;
  name: string;
  role: string;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<"dashboard" | "services" | "quotes" | "documents" | "new-quote">("dashboard");
  const [loading, setLoading] = useState(true);

  const login = useMutation(api.auth.login);

  // Check for saved session
  useEffect(() => {
    const savedUserId = localStorage.getItem("userId");
    if (savedUserId) {
      // User will be fetched by components
      setUser({ _id: savedUserId, email: "", name: "", role: "admin" } as User);
    }
    setLoading(false);
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard userId={user._id} onNavigate={setCurrentPage} />;
      case "services":
        return <Services />;
      case "quotes":
        return <Quotes userId={user._id} onNavigate={setCurrentPage} />;
      case "new-quote":
        return <NewQuote userId={user._id} onNavigate={setCurrentPage} />;
      case "documents":
        return <Documents userId={user._id} />;
      default:
        return <Dashboard userId={user._id} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        user={user}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
