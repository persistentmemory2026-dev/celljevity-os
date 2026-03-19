import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceArea } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

function getValueStatus(value: number, refLow?: number | null, refHigh?: number | null): "green" | "yellow" | "red" | "neutral" {
  if (refLow == null || refHigh == null) return "neutral";
  if (value < refLow || value > refHigh) return "red";
  const margin = (refHigh - refLow) * 0.1;
  if (value < refLow + margin || value > refHigh - margin) return "yellow";
  return "green";
}

const CATEGORY_MAP = {
  green: {
    color: "success",
    glow: "",
    label: "Optimal",
    bgColor: "bg-success/20",
    fillHex: "currentColor"
  },
  yellow: {
    color: "warning",
    glow: "",
    label: "Action Needed",
    bgColor: "bg-warning/20",
    fillHex: "currentColor"
  },
  red: {
    color: "destructive",
    glow: "",
    label: "Critical",
    bgColor: "bg-destructive/20",
    fillHex: "currentColor"
  },
  neutral: {
    color: "muted-foreground",
    glow: "",
    label: "Measured",
    bgColor: "bg-muted",
    fillHex: "currentColor"
  }
};

interface EtherealBiomarkerCardProps {
  code: string;
  name: string;
  unit: string;
  latestValue: number;
  sparkData: { date: string; value: number }[];
  refLow?: number | null;
  refHigh?: number | null;
  isSelected?: boolean;
  onClick?: () => void;
  icon?: string;
}

export function EtherealBiomarkerCard({
  name,
  unit,
  latestValue,
  sparkData,
  refLow,
  refHigh,
  isSelected,
  onClick,
  icon = "biotech"
}: EtherealBiomarkerCardProps) {
  const status = getValueStatus(latestValue, refLow, refHigh);
  const theme = CATEGORY_MAP[status];
  
  const hasMultiplePoints = sparkData.length >= 2;

  // Calculate percentage change if we have enough points
  let percentageChange = null;
  if (sparkData.length >= 2) {
    const sorted = [...sparkData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latest = sorted[sorted.length - 1].value;
    const previous = sorted[sorted.length - 2].value;
    if (previous !== 0) {
      const change = ((latest - previous) / previous) * 100;
      percentageChange = change.toFixed(1);
    }
  }

  return (
    <div
      onClick={onClick}
      className={`bg-card p-6 rounded-lg space-y-6 group transition-all duration-300 cursor-pointer border shadow-sm ${
        isSelected ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground">
            {name}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full bg-${theme.color} ${theme.glow}`}></span>
            <span className={`text-xs font-medium text-${theme.color} uppercase`}>
              {theme.label}
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined text-muted-foreground/50">{icon}</span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-display text-foreground">
          {latestValue} <span className="text-lg opacity-60">{unit}</span>
        </span>
        {percentageChange && (
          <span className={`text-xs ${parseFloat(percentageChange) > 0 ? "text-success" : "text-destructive"}`}>
            {parseFloat(percentageChange) > 0 ? "+" : ""}{percentageChange}%
          </span>
        )}
      </div>

      <div className="h-10 flex items-center relative">
        {hasMultiplePoints ? (
           <ChartContainer config={{ value: { label: name, color: theme.fillHex } }} className="h-full w-full">
            <LineChart data={sparkData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              {/* Optional Ref Area */}
              {refLow != null && refHigh != null && (
                <ReferenceArea y1={refLow} y2={refHigh} fill={theme.fillHex} fillOpacity={0.08} />
              )}
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={theme.fillHex} 
                strokeWidth={1.5} 
                dot={false} 
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <BulletBar value={latestValue} refLow={refLow} refHigh={refHigh} theme={theme} />
        )}
      </div>
    </div>
  );
}

function BulletBar({ value, refLow, refHigh, theme }: { value: number; refLow?: number | null; refHigh?: number | null; theme: any }) {
  if (refLow == null || refHigh == null) {
    return <div className="h-8 w-full bg-muted rounded-full" />;
  }
  const range = refHigh - refLow;
  const displayMin = refLow - range * 0.3;
  const displayMax = refHigh + range * 0.3;
  const totalRange = displayMax - displayMin;
  const refLeftPct = ((refLow - displayMin) / totalRange) * 100;
  const refWidthPct = (range / totalRange) * 100;
  const valuePct = Math.max(0, Math.min(100, ((value - displayMin) / totalRange) * 100));

  return (
    <div className="h-8 w-full bg-muted rounded-full relative overflow-hidden">
      <div 
        className={`absolute inset-y-0 ${theme.bgColor}`} 
        style={{ left: `${Math.max(0, refLeftPct)}%`, width: `${Math.min(100, refWidthPct)}%` }} 
      />
      <div 
        className={`absolute inset-y-0 left-0 bg-${theme.color}`} 
        style={{ width: `${valuePct}%` }}
      />
    </div>
  );
}
