import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { 
  Activity, 
  FileText, 
  ClipboardList, 
  ShieldCheck, 
  Users, 
  LayoutDashboard, 
  FileSignature, 
  LogOut,
  Menu,
  X,
  Stethoscope,
  Settings
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  if (!user) return <>{children}</>;

  const getNavItems = (): NavItem[] => {
    switch (user.role) {
      case "PATIENT":
        return [
          { label: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
          { label: t("nav.biomarkers"), href: "/biomarkers", icon: Activity },
          { label: t("nav.documents"), href: "/documents", icon: FileText },
          { label: t("nav.intake"), href: "/intake", icon: ClipboardList },
          { label: t("nav.consent"), href: "/consent", icon: ShieldCheck },
        ];
      case "CARE_COORDINATOR":
        return [
          { label: t("nav.crm"), href: "/crm", icon: LayoutDashboard },
          { label: t("nav.leads"), href: "/leads", icon: Users },
          { label: t("nav.quotes"), href: "/quotes", icon: FileSignature },
          { label: t("nav.reports"), href: "/reports", icon: Activity },
        ];
      case "MEDICAL_PROVIDER":
        return [
          { label: t("nav.clinical"), href: "/clinical", icon: Stethoscope },
        ];
      case "SUPER_ADMIN":
        return [
          { label: t("nav.admin"), href: "/admin", icon: LayoutDashboard },
          { label: t("nav.users"), href: "/admin/users", icon: Users },
          { label: t("nav.services"), href: "/admin/services", icon: Settings },
          { label: t("nav.auditLogs"), href: "/admin/audit", icon: ShieldCheck },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-6 flex items-center gap-3">
        <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Celljevity Logo" className="w-8 h-8 rounded-md" />
        <span className="font-display font-bold text-xl tracking-tight text-white">Celljevity OS</span>
      </div>
      
      <div className="px-4 pb-4">
        <div className="bg-sidebar-accent rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-medium text-sm text-white truncate">{user.firstName} {user.lastName}</span>
            <span className="text-xs text-sidebar-foreground/70 truncate capitalize">{user.role.replace('_', ' ').toLowerCase()}</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
              <span className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                isActive 
                  ? "bg-accent text-accent-foreground" 
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
              )}>
                <Icon className="w-5 h-5" />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto space-y-3">
        <LanguageSwitcher />
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent"
          onClick={() => logout()}
        >
          <LogOut className="w-5 h-5 ltr:mr-3 rtl:ml-3" />
          {t("auth.signOut")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <div className="md:hidden flex items-center justify-between p-4 bg-sidebar text-white">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-6 h-6 rounded" />
          <span className="font-display font-bold">Celljevity</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={cn(
        "fixed inset-y-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        "ltr:left-0 rtl:right-0",
        isMobileMenuOpen ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full"
      )}>
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
