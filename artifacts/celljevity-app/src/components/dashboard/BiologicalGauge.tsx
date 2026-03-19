import { motion } from "framer-motion";
import { Upload } from "lucide-react";

interface HealthScoreGaugeProps {
  score: number; // 0-100, or -1 for insufficient data
  totalMarkers: number;
  inRange: number;
}

export function HealthScoreGauge({ score, totalMarkers, inRange }: HealthScoreGaugeProps) {
  const isInsufficient = score === -1;
  const gaugeAngle = isInsufficient ? 0 : (score / 100) * 280;

  return (
    <div className="relative flex justify-center items-center py-16">
      <div className="relative w-80 h-80 rounded-full flex items-center justify-center">
        {/* Thin Gauge Circle */}
        <div className="absolute inset-0 rounded-full border-[0.5px] border-outline-variant/30"></div>

        {/* Gauge Progress Gradient */}
        <div
          className="absolute inset-0 rounded-full opacity-80"
          style={{
            background: isInsufficient
              ? "none"
              : `conic-gradient(from 180deg at 50% 50%, var(--primary) 0deg, transparent ${gaugeAngle}deg)`,
            mask: "radial-gradient(transparent 69%, black 70%)",
            WebkitMask: "radial-gradient(transparent 69%, black 70%)",
          }}
        ></div>

        {/* Inner Content */}
        <div className="text-center z-10">
          {isInsufficient ? (
            <div className="flex flex-col items-center gap-3">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground max-w-[180px]">
                Upload lab results to see your health score
              </p>
            </div>
          ) : (
            <>
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-6xl font-display text-foreground"
              >
                {score}
              </motion.span>
              <div className="flex flex-col mt-2">
                <span className="text-sm font-medium text-primary">Health Score</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {inRange}/{totalMarkers} markers in range
                </span>
              </div>
            </>
          )}
        </div>

        {/* Glow Point */}
        {!isInsufficient && (
          <div className="absolute top-[10%] right-[15%] w-2 h-2 bg-primary rounded-full shadow-sm"></div>
        )}
      </div>
    </div>
  );
}
