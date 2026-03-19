import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { PageId, NavigationContext } from "../App";
import type { Id } from "@convex/_generated/dataModel";
import {
  Users, FileText, Receipt, FolderOpen, Plus, UserPlus,
  AlertCircle, Clock, Calendar, CheckCircle2, ChevronDown, ChevronUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { useState } from "react";

interface DashboardProps {
  userId: string;
  onNavigate: (page: PageId, ctx?: NavigationContext) => void;
}

const PRIORITY_COLORS = {
  critical: "bg-error/10 text-error border-error/20",
  high: "bg-warning/10 text-warning border-warning/20",
  medium: "bg-info/10 text-info border-info/20",
  low: "bg-muted text-muted-foreground border-border",
} as const;

const PRIORITY_ICONS = {
  critical: AlertCircle,
  high: Clock,
  medium: Calendar,
  low: CheckCircle2,
} as const;

export function Dashboard({ userId, onNavigate }: DashboardProps) {
  const quotes = useQuery(api.quotes.list, { userId: userId as Id<"users">, type: "quote" });
  const invoices = useQuery(api.quotes.list, { userId: userId as Id<"users">, type: "invoice" });
  const documents = useQuery(api.documents.list, { userId: userId as Id<"users"> });
  const patientCount = useQuery(api.patients.count, { callerId: userId as Id<"users"> });
  const actionItems = useQuery(api.dashboard.getActionItems, { callerId: userId as Id<"users"> });
  const thisWeek = useQuery(api.dashboard.getThisWeek, { callerId: userId as Id<"users"> });

  const updateTreatment = useMutation(api.treatments.update);

  const [weekExpanded, setWeekExpanded] = useState(true);

  const isLoading = quotes === undefined || invoices === undefined || documents === undefined || patientCount === undefined;

  if (isLoading) {
    return (
      <div className="p-8 md:p-12 max-w-[1280px] mx-auto space-y-12">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 bg-muted" />
          <Skeleton className="h-4 w-48 bg-muted" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl bg-muted" />)}
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Patients", value: patientCount ?? 0, icon: Users, page: "patients" as PageId, color: "text-primary" },
    { label: "Quotes", value: quotes?.length ?? 0, icon: FileText, page: "quotes" as PageId, color: "text-chart-1" },
    { label: "Invoices", value: invoices?.length ?? 0, icon: Receipt, page: "quotes" as PageId, color: "text-chart-up" },
    { label: "Documents", value: documents?.length ?? 0, icon: FolderOpen, page: "documents" as PageId, color: "text-secondary" },
  ];

  async function handleInlineAction(item: any) {
    if (item.treatmentId && (item.type === "overdue_treatment" || item.type === "today_treatment")) {
      await updateTreatment({
        callerId: userId as Id<"users">,
        treatmentId: item.treatmentId as Id<"treatments">,
        status: "in-progress",
      });
    } else if (item.patientId) {
      onNavigate("patient-detail" as PageId, { patientId: item.patientId });
    }
  }

  return (
    <div className="p-6 md:p-12 max-w-[1280px] mx-auto space-y-12">
      {/* Onboarding Checklist */}
      <OnboardingChecklist
        onNavigate={onNavigate}
        quoteCount={quotes?.length ?? 0}
        patientCount={patientCount ?? 0}
        documentCount={documents?.length ?? 0}
      />

      {/* Welcome Header */}
      <div className="space-y-2">
        <h2 className="text-4xl font-display text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.button
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={() => onNavigate(stat.page)}
            className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:bg-muted/50 transition-colors text-left group"
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-4`} />
            <p className="text-3xl font-display text-foreground mb-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Action Items */}
      <div className="space-y-4">
        <h3 className="text-base font-display text-foreground">Action Items</h3>
        {actionItems === undefined ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl bg-muted" />)}
          </div>
        ) : actionItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-8 text-center"
          >
            <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">You're all caught up</p>
            <p className="text-xs text-muted-foreground mt-1">No pending action items</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {actionItems.map((item: any, i: number) => {
              const PriorityIcon = PRIORITY_ICONS[item.priority as keyof typeof PRIORITY_ICONS] ?? CheckCircle2;
              return (
                <motion.div
                  key={`${item.type}-${item.patientId ?? i}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-4"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0 border ${PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS]}`}>
                      <PriorityIcon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      {item.patientName && (
                        <button
                          onClick={() => onNavigate("patient-detail" as PageId, { patientId: item.patientId })}
                          className="text-xs text-primary hover:text-primary/80 mt-1 inline-block"
                        >
                          {item.patientName}
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleInlineAction(item)}
                    className="text-xs font-medium px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap min-h-[44px] md:min-h-0"
                  >
                    {item.actionLabel}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* This Week */}
      <div className="space-y-4">
        <button
          onClick={() => setWeekExpanded(!weekExpanded)}
          className="flex items-center gap-2 text-base font-display text-foreground"
        >
          This Week
          {weekExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {weekExpanded && (
          thisWeek === undefined ? (
            <Skeleton className="h-32 rounded-xl bg-muted" />
          ) : thisWeek.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground">No upcoming items this week</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
              {thisWeek.map((day: any) => (
                <div key={day.date} className="p-4 md:p-5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    {new Date(day.date + "T00:00:00").toLocaleDateString("en-GB", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <div className="space-y-2">
                    {day.items.map((item: any, j: number) => (
                      <div
                        key={j}
                        className="flex items-center gap-3 text-sm cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                        onClick={() => item.patientId && onNavigate("patient-detail" as PageId, { patientId: item.patientId })}
                      >
                        {item.time && (
                          <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">
                            {item.time}
                          </span>
                        )}
                        <span className="text-foreground">{item.title}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{item.patientName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-base font-display text-foreground">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate("patients")}
            className="flex items-center gap-2 px-5 py-3 bg-card border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            New Patient
          </button>
          <button
            onClick={() => onNavigate("new-quote")}
            className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Quote
          </button>
        </div>
      </div>
    </div>
  );
}
