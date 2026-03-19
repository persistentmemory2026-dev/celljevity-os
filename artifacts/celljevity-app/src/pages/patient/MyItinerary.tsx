import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plane, Hotel, Stethoscope, MessageSquare, Car, Clock, Calendar } from "lucide-react";

interface MyItineraryProps {
  userId: string;
  linkedPatientId: string;
}

const typeIcons: Record<string, React.ElementType> = {
  travel: Plane,
  accommodation: Hotel,
  treatment: Stethoscope,
  consultation: MessageSquare,
  transfer: Car,
  free: Clock,
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  confirmed: "bg-info/10 text-info",
  "in-progress": "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
  pending: "bg-muted text-muted-foreground",
};

export function MyItinerary({ userId, linkedPatientId }: MyItineraryProps) {
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null);

  const itineraries = useQuery(api.itineraries.listByPatient, {
    callerId: userId as Id<"users">,
    patientId: linkedPatientId as Id<"patients">,
  });

  // Show active/confirmed itinerary by default, or first one
  const activeItinerary = itineraries?.find((it: any) =>
    it.status === "confirmed" || it.status === "in-progress"
  );
  const displayId = selectedItineraryId ?? activeItinerary?._id ?? itineraries?.[0]?._id ?? null;

  const items = useQuery(
    api.itineraryItems.listByItinerary,
    displayId
      ? { callerId: userId as Id<"users">, itineraryId: displayId as Id<"itineraries"> }
      : "skip"
  );

  if (itineraries === undefined) {
    return (
      <div className="px-5 md:px-8 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (itineraries.length === 0) {
    return (
      <div className="px-5 md:px-8 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">My Itinerary</h1>
        <div className="text-center py-12 text-muted-foreground">
          No itineraries available yet.
        </div>
      </div>
    );
  }

  const currentItinerary = itineraries.find((it: any) => it._id === displayId);

  // Group items by date
  const itemsByDate: Record<string, any[]> = {};
  if (items) {
    for (const item of items) {
      if (!itemsByDate[item.date]) itemsByDate[item.date] = [];
      itemsByDate[item.date].push(item);
    }
  }

  return (
    <div className="px-5 md:px-8 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Itinerary</h1>

      {/* Itinerary selector (if multiple) */}
      {itineraries.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {itineraries.map((it: any) => (
            <button
              key={it._id}
              onClick={() => setSelectedItineraryId(it._id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                it._id === displayId
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {it.title}
            </button>
          ))}
        </div>
      )}

      {/* Itinerary header */}
      {currentItinerary && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-foreground text-lg">{currentItinerary.title}</h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {currentItinerary.startDate} — {currentItinerary.endDate}
              </div>
              {currentItinerary.notes && (
                <p className="text-sm text-muted-foreground mt-2">{currentItinerary.notes}</p>
              )}
            </div>
            <Badge className={statusColors[currentItinerary.status] ?? ""}>
              {currentItinerary.status}
            </Badge>
          </div>
        </div>
      )}

      {/* Timeline */}
      {items === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : Object.keys(itemsByDate).length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No items in this itinerary yet.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(itemsByDate).map(([date, dateItems]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <div className="space-y-2 relative ml-3 border-l-2 border-border pl-4">
                {dateItems.map((item: any) => {
                  const Icon = typeIcons[item.type] ?? Clock;
                  return (
                    <div key={item._id} className="relative">
                      <div className="absolute -left-[22px] top-3 w-3 h-3 rounded-full bg-border border-2 border-background" />
                      <div className="bg-card border border-border rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">{item.title}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColors[item.status] ?? ""}`}>
                                {item.status}
                              </span>
                            </div>
                            {(item.startTime || item.endTime) && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.startTime}{item.endTime && ` — ${item.endTime}`}
                              </p>
                            )}
                            {item.location && (
                              <p className="text-xs text-muted-foreground mt-0.5">{item.location}</p>
                            )}
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
