import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";
import "./index.css";

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ maxWidth: "28rem", width: "100%", backgroundColor: "#fff", borderRadius: "0.5rem", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", padding: "2rem", textAlign: "center" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", marginBottom: "0.5rem" }}>
              Something went wrong
            </h2>
            <p style={{ color: "#6b7280", marginBottom: "0.75rem" }}>
              The application encountered an unexpected error. This may be due to a connection issue with the backend.
            </p>
            {this.state.error && (
              <pre style={{ fontSize: "0.75rem", color: "#ef4444", backgroundColor: "#fef2f2", padding: "0.75rem", borderRadius: "0.375rem", marginBottom: "1rem", textAlign: "left", overflow: "auto", maxHeight: "6rem" }}>
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "0.5rem 1.5rem", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    </RootErrorBoundary>
  </StrictMode>
);
