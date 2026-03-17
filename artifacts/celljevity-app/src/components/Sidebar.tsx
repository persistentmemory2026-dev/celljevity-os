import { useState } from "react";
import type { PageId, User } from "../App";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  user: User;
  onLogout: () => void;
}

const navItems: Array<{ id: PageId; label: string; icon: string; description: string }> = [
  { id: "dashboard", label: "Dashboard", icon: "\uD83C\uDFE0", description: "Overview of your activity, key metrics, and quick actions" },
  { id: "patients", label: "Patients", icon: "\uD83E\uDE7A", description: "View, create, and manage patient records" },
  { id: "services", label: "Services", icon: "\uD83E\uDDEC", description: "Browse available treatments and services" },
  { id: "quotes", label: "Quotes & Invoices", icon: "\uD83D\uDCC4", description: "Create and track quotes and invoices" },
  { id: "documents", label: "Documents", icon: "\uD83D\uDCC1", description: "Upload and manage documents securely" },
];

const adminNavItems: Array<{ id: PageId; label: string; icon: string; description: string }> = [
  { id: "admin-users", label: "Users", icon: "\uD83D\uDC65", description: "Manage user accounts and roles" },
  { id: "admin-services", label: "Services", icon: "\u2699\uFE0F", description: "Configure service catalog and pricing" },
];

function SidebarContent({ currentPage, onNavigate, user, onLogout }: SidebarProps) {
  return (
    <>
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          Celljevity
          <span className="w-2 h-2 rounded-full bg-chart-2"></span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1 tracking-wider uppercase text-[10px] font-semibold">Longevity OS</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-2">
        <p className="px-2 mb-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Menu</p>
        {navItems.map((item) => {
          const isActive = currentPage === item.id || (item.id === "patients" && currentPage === "patient-detail");
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-secondary text-foreground shadow-sm shadow-black/20"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <span className={`text-lg flex items-center justify-center w-6 h-6 ${isActive ? '' : 'opacity-70 grayscale'}`}>{item.icon}</span>
                  {item.label}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover text-popover-foreground border-border">{item.description}</TooltipContent>
            </Tooltip>
          );
        })}

        {/* New Quote Button - Minimalist variant to match reference */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onNavigate("new-quote")}
              className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <span>+</span>
              New Quote
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-popover text-popover-foreground border-border">Start building a new quote</TooltipContent>
        </Tooltip>

        {/* Admin Section */}
        {user?.role === "admin" && (
          <div className="mt-8 pt-6">
            <p className="px-2 mb-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>
            <div className="space-y-2">
              {adminNavItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onNavigate(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-secondary text-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        }`}
                      >
                        <span className={`text-lg flex items-center justify-center w-6 h-6 ${isActive ? '' : 'opacity-70 grayscale'}`}>{item.icon}</span>
                        {item.label}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-popover text-popover-foreground border-border">{item.description}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="p-4 mt-auto">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground font-medium shadow-inner border border-border">
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name || "Admin"}</p>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-chart-up shadow-[0_0_4px_var(--chart-up)]"></span>
              Online
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full text-left px-4 py-2 mt-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Logout
        </button>
      </div>
    </>
  );
}

export function Sidebar(props: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (page: PageId) => {
    setMobileOpen(false);
    props.onNavigate(page);
  };

  const handleLogout = () => {
    setMobileOpen(false);
    props.onLogout();
  };

  return (
    <>
      {/* Mobile header bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-background border-b border-border flex items-center px-4 z-40">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="ml-3 font-bold text-foreground">Celljevity</span>
      </div>

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 flex flex-col bg-sidebar border-r-border">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent {...props} onNavigate={handleNavigate} onLogout={handleLogout} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar border-r border-border flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.5)] z-10 relative">
        <SidebarContent {...props} />
      </aside>
    </>
  );
}
