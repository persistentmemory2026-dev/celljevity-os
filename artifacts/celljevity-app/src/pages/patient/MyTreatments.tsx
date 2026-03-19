import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface MyTreatmentsProps {
  userId: string;
  linkedPatientId: string;
}

const STATUS_FILTERS = ["all", "scheduled", "in-progress", "completed", "cancelled"] as const;

const statusColors: Record<string, string> = {
  scheduled: "bg-info/10 text-info border-info/20",
  "in-progress": "bg-warning/10 text-warning border-warning/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export function MyTreatments({ userId, linkedPatientId }: MyTreatmentsProps) {
  const [filter, setFilter] = useState<string>("all");

  const treatments = useQuery(api.treatments.listByPatient, {
    callerId: userId as Id<"users">,
    patientId: linkedPatientId as Id<"patients">,
  });

  if (treatments === undefined) {
    return (
      <div className="px-5 md:px-8 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2"><Skeleton className="h-8 w-16" /><Skeleton className="h-8 w-20" /><Skeleton className="h-8 w-20" /></div>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  const filtered = filter === "all" ? treatments : treatments.filter((t: any) => t.status === filter);

  return (
    <div className="px-5 md:px-8 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Treatments</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              filter === s
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            {s === "all" && ` (${treatments.length})`}
          </button>
        ))}
      </div>

      {/* Treatment cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No treatments found{filter !== "all" ? ` with status "${filter}"` : ""}.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t: any) => (
            <div key={t._id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{t.serviceName}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                    {t.scheduledDate && (
                      <span>Scheduled: {t.scheduledDate}</span>
                    )}
                    {t.completedDate && (
                      <span>Completed: {t.completedDate}</span>
                    )}
                  </div>
                  {t.notes && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{t.notes}</p>
                  )}
                </div>
                <Badge variant="outline" className={statusColors[t.status] ?? ""}>
                  {t.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
