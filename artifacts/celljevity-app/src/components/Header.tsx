import { useState, useEffect } from "react";
import type { PageId, User } from "../App";
import { Search, Bell, User as UserIcon, Moon, Sun } from "lucide-react";

const PAGE_TITLES: Partial<Record<PageId, string>> = {
  dashboard: "Dashboard",
  patients: "Patients",
  services: "Services",
  quotes: "Quotes & Invoices",
  documents: "Documents",
  "new-quote": "New Quote",
  "patient-detail": "Patient",
  "admin-users": "Users",
  "admin-services": "Services",
  "my-dashboard": "Overview",
  "my-itinerary": "Itinerary",
  "my-treatments": "Treatments",
  "my-biomarkers": "Biomarkers",
  "my-documents": "Documents",
  "my-profile": "Profile",
};

interface HeaderProps {
  user: User | null;
  currentPage?: PageId;
  onNavigate?: (page: PageId) => void;
}

export function Header({ user, currentPage, onNavigate }: HeaderProps) {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove("dark");
      root.classList.add("light");
      setIsDark(false);
      localStorage.setItem("theme", "light");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
      setIsDark(true);
      localStorage.setItem("theme", "dark");
    }
  };

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 z-40 flex justify-between items-center px-6 md:px-8 bg-background border-b border-border transition-colors">
      
      {/* Page Title (mobile) + Search */}
      <div className="flex items-center gap-4 flex-1">
        {currentPage && (
          <h1 className="md:hidden text-base font-display font-medium text-foreground">
            {PAGE_TITLES[currentPage] || "Celljevity"}
          </h1>
        )}
        <Search className="hidden md:block w-5 h-5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" strokeWidth={1.5} />
        <input
          type="text"
          placeholder="Search..."
          className="hidden md:block bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-foreground w-full max-w-xs placeholder:text-muted-foreground"
        />
      </div>

      {/* Right Actions Section measuring code.html */}
      <div className="flex items-center gap-6">
        
        {/* Theme Toggle (Not in original spec, but user requested) */}
        <button 
          onClick={toggleTheme} 
          className="text-on-surface-variant hover:text-foreground transition-colors"
          title="Toggle Light/Dark Mode"
        >
          {isDark ? <Sun className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} /> : <Moon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />}
        </button>

        {/* Notifications */}
        <div className="relative group cursor-pointer">
          <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
          <div className="absolute top-0 right-[-2px] w-2 h-2 bg-primary rounded-full" />
        </div>
        
        {/* User Profile */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => user?.role === "patient" && onNavigate ? onNavigate("my-profile") : undefined}
        >
          <span className="hidden md:inline-block text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            {user?.name || "Dr. Aris Thorne"}
          </span>
          <div className="w-8 h-8 rounded-full bg-muted overflow-hidden border border-border flex items-center justify-center text-primary">
             {user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-5 h-5" strokeWidth={1.5} />}
          </div>
        </div>
      </div>
    </header>
  );
}
