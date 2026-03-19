import React from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { PageId, User } from "../App";
import {
  LogOut,
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  FileBox,
  BrainCircuit,
  ActivitySquare,
  ClipboardList,
  CalendarDays,
  UserCircle,
  Plus
} from "lucide-react";

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  user: User | null;
  onLogout: () => void;
}

const STAFF_LINKS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "patients", label: "Patients", icon: Users },
  { id: "services", label: "Services", icon: Settings },
  { id: "quotes", label: "Quotes & Invoices", icon: FileText },
  { id: "documents", label: "Documents", icon: FileBox },
] as const;

const ADMIN_LINKS = [
  { id: "admin-users", label: "Users", icon: Users },
  { id: "admin-services", label: "Services", icon: Settings },
] as const;

const PATIENT_LINKS = [
  { id: "my-dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "my-itinerary", label: "Itinerary", icon: CalendarDays },
  { id: "my-treatments", label: "Treatments", icon: ActivitySquare },
  { id: "my-biomarkers", label: "Biomarkers", icon: BrainCircuit },
  { id: "my-documents", label: "Documents", icon: ClipboardList },
] as const;

export function Sidebar({ currentPage, onNavigate, user, onLogout }: SidebarProps) {
  const isPatient = user?.role === "patient";

  const mainLinks = isPatient ? PATIENT_LINKS : STAFF_LINKS;

  const NavItem = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => {
    const isActive = currentPage === id;
    
    // Ethereal Design Tokens
    const baseClasses = "w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-all duration-300";
    const inactiveClasses = "text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95";
    const activeClasses = "bg-muted text-foreground relative active:scale-95 border-r-2 border-primary";

    return (
      <button
        onClick={() => onNavigate(id as PageId)}
        className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} group overflow-hidden`}
      >
        <div className="flex items-center gap-4 relative z-10 w-full">
          <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground transition-colors'}`} strokeWidth={isActive ? 2 : 1.5} />
          <span>{label}</span>
        </div>
      </button>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col py-8 px-4 h-screen w-64 fixed left-0 top-0 border-r border-outline-variant/15 bg-background z-50">
        
        {/* App Title Logo Section */}
        <div className="mb-12 px-4">
          <h1 className="text-xl font-display text-foreground">Celljevity</h1>
          <p className="text-xs text-muted-foreground">V.2.0.4</p>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 space-y-1 -mx-4 overflow-y-auto no-scrollbar">
          {mainLinks.map((link) => (
            <NavItem key={link.id} {...link} />
          ))}
          
          {/* Divider */}
          {!isPatient && (
             <div className="h-px w-full bg-outline-variant/10 my-4" />
          )}

          {/* Special Quick Action for Staff */}
          {!isPatient && (
             <button
              onClick={() => onNavigate("new-quote")}
              className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all duration-300 active:scale-95 ${
                currentPage === "new-quote"
                  ? "bg-muted text-foreground border-r-2 border-primary"
                  : "text-primary hover:bg-muted hover:text-primary"
              }`}
            >
              <Plus className="w-5 h-5" strokeWidth={1.5} />
              <span>New Quote</span>
            </button>
          )}

          {/* Admin Navigation */}
          {user?.role === "admin" && (
            <>
              <div className="h-px w-full bg-outline-variant/10 my-4" />
              <div className="px-4 mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Admin</span>
              </div>
              {ADMIN_LINKS.map((link) => (
                <NavItem key={link.id} {...link} />
              ))}
            </>
          )}
        </div>

        {/* User / Settings Footer Section */}
        <div className="mt-auto pt-6 -mx-4">
           <div className="px-4 flex items-center justify-between">
              <button 
                onClick={() => isPatient ? onNavigate("my-profile") : null}
                className="flex items-center gap-3 cursor-pointer hover:opacity-80"
              >
                <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center text-foreground overflow-hidden">
                  <UserCircle className="w-6 h-6" strokeWidth={1} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {user?.role}
                  </p>
                </div>
              </button>
              
              {/* Minimal Logout Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>
    </>
  );
}
