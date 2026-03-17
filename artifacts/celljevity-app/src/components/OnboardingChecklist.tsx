import { useState, useEffect } from "react";
import type { PageId, NavigationContext } from "../App";

const STORAGE_KEY = "celljevity_onboarding_dismissed";

interface OnboardingChecklistProps {
  onNavigate: (page: PageId, ctx?: NavigationContext) => void;
  quoteCount: number;
  patientCount: number;
  documentCount: number;
}

export function OnboardingChecklist({
  onNavigate,
  quoteCount,
  patientCount,
  documentCount,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");

  const steps = [
    { label: "Browse available services", done: true, action: () => onNavigate("services") },
    { label: "Add your first patient", done: patientCount > 0, action: () => onNavigate("patients") },
    { label: "Create your first quote", done: quoteCount > 0, action: () => onNavigate("new-quote") },
    { label: "Upload a document", done: documentCount > 0, action: () => onNavigate("documents") },
  ];

  const allDone = steps.every((s) => s.done);

  useEffect(() => {
    if (allDone) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
  }, [allDone]);

  if (dismissed || allDone) return null;

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border/50 p-6 mb-8 text-foreground">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Welcome to Celljevity!</h2>
          <p className="text-sm text-muted-foreground">Here's how to get started:</p>
        </div>
        <button
          onClick={() => {
            setDismissed(true);
            localStorage.setItem(STORAGE_KEY, "true");
          }}
          className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1"
        >
          Dismiss &times;
        </button>
      </div>
      <div className="space-y-3 mt-6">
        {steps.map((step, i) => (
          <button
            key={i}
            onClick={step.action}
            className="flex items-center gap-3 w-full text-left group hover:bg-secondary/20 p-2 -mx-2 rounded-lg transition-colors"
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step.done
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {step.done ? "\u2713" : i + 1}
            </span>
            <span
              className={`text-sm ${
                step.done
                  ? "text-muted-foreground line-through"
                  : "text-foreground group-hover:text-primary"
              }`}
            >
              {step.label}
            </span>
            {!step.done && (
              <span className="text-primary text-xs opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                &rarr;
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
