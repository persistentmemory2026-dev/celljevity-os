import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Image, File } from "lucide-react";

interface MyDocumentsProps {
  userId: string;
  linkedPatientId: string;
}

const CATEGORIES = ["all", "lab-report", "invoice", "quote", "other"] as const;

function getFileIcon(mimeType: string) {
  if (mimeType === "application/pdf") return FileText;
  if (mimeType.startsWith("image/")) return Image;
  return File;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MyDocuments({ userId, linkedPatientId }: MyDocumentsProps) {
  const [category, setCategory] = useState<string>("all");

  const documents = useQuery(api.documents.listByPatient, {
    userId: userId as Id<"users">,
    patientId: linkedPatientId as Id<"patients">,
  });

  if (documents === undefined) {
    return (
      <div className="px-5 md:px-8 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const filtered = category === "all" ? documents : documents.filter((d: any) => d.category === category);

  return (
    <div className="px-5 md:px-8 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Documents</h1>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              category === c
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {c === "all" ? `All (${documents.length})` : c.replace("-", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No documents found{category !== "all" ? ` in "${category}"` : ""}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc: any) => {
            const Icon = getFileIcon(doc.mimeType);
            return (
              <div key={doc._id} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.originalName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatBytes(doc.size)}
                      {doc.createdAt && ` \u00B7 ${new Date(doc.createdAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">{doc.category}</Badge>
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
