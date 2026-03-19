import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp } from "lucide-react";

interface VectorTrendProps {
  data: Array<{ date: string; value: number }>;
  label: string;
  unit?: string;
}

export function LongevityVectorTrend({ data, label, unit }: VectorTrendProps) {
  const hasEnoughData = data.length >= 2;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end px-2">
        <div>
          <h3 className="text-lg font-display text-foreground">{label} Trend</h3>
          {hasEnoughData && unit && (
            <p className="text-sm text-muted-foreground mt-1">
              Latest: {data[data.length - 1].value} {unit}
            </p>
          )}
        </div>
        {hasEnoughData && (
          <span className="text-sm font-medium text-muted-foreground">
            {data.length} measurements
          </span>
        )}
      </div>

      <div className="bg-card shadow-sm border border-border w-full h-48 rounded-lg relative overflow-hidden">
        {!hasEnoughData ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <TrendingUp className="w-8 h-8" />
            <p className="text-sm">Need more measurements to show trend</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, bottom: 10, left: 10 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val: string) => {
                  const d = new Date(val);
                  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
                }}
              />
              <YAxis hide domain={["auto", "auto"]} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#trendGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "var(--primary)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
