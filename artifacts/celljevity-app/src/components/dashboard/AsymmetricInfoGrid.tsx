import type { LucideIcon } from "lucide-react";
import { BarChart3 } from "lucide-react";

export interface InfoCardData {
  icon: LucideIcon;
  title: string;
  value: string;
  unit?: string;
  change?: string;
  status: "success" | "warning" | "muted";
}

interface AsymmetricInfoGridProps {
  cards: InfoCardData[];
}

export function AsymmetricInfoGrid({ cards }: AsymmetricInfoGridProps) {
  if (cards.length === 0) {
    return (
      <div className="bg-card shadow-sm border border-border p-8 rounded-lg flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <BarChart3 className="w-8 h-8" />
        <p className="text-sm">No biomarker data available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
      {cards.slice(0, 3).map((card, i) => (
        <div
          key={card.title}
          className={`bg-card shadow-sm border border-border p-8 rounded-lg space-y-3 ${
            i === 1 ? "md:translate-y-4" : ""
          }`}
        >
          <card.icon className="w-6 h-6 text-primary opacity-80" strokeWidth={1.5} />
          <h4 className="text-sm font-medium text-muted-foreground">{card.title}</h4>
          <p className="text-3xl font-display text-foreground">
            {card.value}{" "}
            {card.unit && (
              <span className="text-sm font-medium text-muted-foreground ml-2">{card.unit}</span>
            )}
            {card.change && (
              <span
                className={`text-sm font-medium ml-2 ${
                  card.status === "success"
                    ? "text-success"
                    : card.status === "warning"
                      ? "text-warning"
                      : "text-muted-foreground"
                }`}
              >
                {card.change}
              </span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
