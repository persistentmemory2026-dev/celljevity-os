import { LucideIcon, LayoutDashboard, Stethoscope, FlaskConical, FileText, FolderOpen, Activity, User } from "lucide-react"
import { type PageId, type User as UserType } from "../App"
import { cn } from "@/lib/utils"

interface NavItem {
  id: PageId
  label: string
  icon: LucideIcon
}

const staffNavItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "patients", label: "Patients", icon: Stethoscope },
  { id: "services", label: "Services", icon: FlaskConical },
  { id: "quotes", label: "Quotes", icon: FileText },
  { id: "documents", label: "Docs", icon: FolderOpen },
]

const patientNavItems: NavItem[] = [
  { id: "my-dashboard", label: "Home", icon: LayoutDashboard },
  { id: "my-treatments", label: "Treatments", icon: Stethoscope },
  { id: "my-biomarkers", label: "Biomarkers", icon: Activity },
  { id: "my-documents", label: "Docs", icon: FolderOpen },
  { id: "my-profile", label: "Profile", icon: User },
]

interface BottomNavProps {
  currentPage: PageId
  onNavigate: (page: PageId) => void
  user?: UserType
}

export function BottomNav({ currentPage, onNavigate, user }: BottomNavProps) {
  const navItems = user?.role === "patient" ? patientNavItems : staffNavItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-background/80 backdrop-blur-md border-t border-border md:hidden pb-[env(safe-area-inset-bottom)]">
      {navItems.map((item) => {
        const isActive = currentPage === item.id
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "flex flex-col items-center justify-center w-full min-h-[56px] py-1 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="w-5 h-5 mb-1" />
            {isActive && <span className="text-[10px] font-medium leading-none">{item.label}</span>}
          </button>
        )
      })}
    </nav>
  )
}
