import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderOpen } from "lucide-react";
import type { Id, Doc } from "@convex/_generated/dataModel";

interface DocumentsProps {
  userId: string;
}

export function Documents({ userId }: DocumentsProps) {
  const [category, setCategory] = useState<string>("all");
  const [uploadCategory, setUploadCategory] = useState<string>("other");
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [patientFilter, setPatientFilter] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const patients = useQuery(api.patients.list, { callerId: userId as Id<"users"> });

  const documents = useQuery(
    patientFilter !== "all"
      ? api.documents.listByPatient
      : api.documents.list,
    patientFilter !== "all"
      ? { userId: userId as Id<"users">, patientId: patientFilter as Id<"patients"> }
      : { userId: userId as Id<"users">, category: category === "all" ? undefined : category }
  );
  const removeDocument = useMutation(api.documents.remove);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const createDocument = useMutation(api.documents.create);

  const categories = ["all", "invoice", "quote", "lab-report", "other"];

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast({ variant: "destructive", title: "Invalid file type", description: `Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ variant: "destructive", title: "File too large", description: "Maximum file size is 25 MB." });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      // 1. Get upload URL from Convex
      const uploadUrl = await generateUploadUrl({ userId: userId as Id<"users"> });
      // 2. POST file directly to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();
      // 3. Create document record
      await createDocument({
        userId: userId as Id<"users">,
        filename: storageId,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        storageId,
        category: uploadCategory as "invoice" | "quote" | "lab-report" | "other",
      });

      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await removeDocument({ documentId: deleteTarget as Id<"documents">, userId: userId as Id<"users"> });
      toast({
        title: "Document deleted",
        description: "The document has been removed.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Failed to delete document.",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("de-DE");
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("image")) return "🖼️";
    return "📎";
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-foreground">Document Vault</h1>
        <div className="flex items-center gap-3">
          <Select value={uploadCategory} onValueChange={setUploadCategory}>
            <SelectTrigger className="w-[140px] bg-card border-border text-foreground">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="quote">Quote</SelectItem>
              <SelectItem value="lab-report">Lab Report</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-primary text-primary-foreground hover:brightness-110 shadow-sm disabled:opacity-50 transition"
          >
            {uploading ? "Uploading..." : "+ Upload Document"}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Category & Patient Filter */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                category === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-foreground border border-border hover:bg-secondary"
              }`}
            >
              {cat === "all" ? "All Documents" : cat}
            </button>
          ))}
        </div>
        {patients && patients.length > 0 && (
          <select
            className="px-3 py-2 rounded-lg border border-border text-sm bg-card text-foreground"
            value={patientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
          >
            <option value="all">All patients</option>
            {patients.map((p: any) => (
              <option key={p._id} value={p._id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Loading State */}
      {documents === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <Skeleton className="w-12 h-12 rounded-lg bg-muted" />
                <Skeleton className="h-5 w-16 rounded-full bg-muted" />
              </div>
              <Skeleton className="h-4 w-3/4 bg-muted" />
              <Skeleton className="h-3 w-1/2 bg-muted" />
              <Skeleton className="h-3 w-1/3 bg-muted" />
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1 rounded-lg bg-muted" />
                <Skeleton className="h-9 w-10 rounded-lg bg-muted" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc: Doc<"documents">) => (
              <Card
                key={doc._id}
                className="p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-secondary/80 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                    {getFileIcon(doc.mimeType)}
                  </div>
                  <span className="inline-block px-2 py-1 bg-secondary text-muted-foreground text-xs rounded-full border border-border/50">
                    {doc.category}
                  </span>
                </div>

                <h3 className="font-medium text-foreground mb-1 truncate" title={doc.originalName}>
                  {doc.originalName}
                </h3>

                <div className="text-sm text-muted-foreground space-y-1 mb-4">
                  <p>{formatFileSize(doc.size ?? 0)}</p>
                  <p>Uploaded {doc.createdAt != null && formatDate(doc.createdAt)}</p>
                </div>

                <div className="flex gap-2">
                  <a
                    href={doc.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 text-center text-sm font-medium transition-colors"
                  >
                    Download
                  </a>
                  <button
                    onClick={async () => {
                      const siteUrl = import.meta.env.VITE_CONVEX_URL.replace('.cloud', '.site');
                      const url = `${siteUrl}/downloadDocument?token=${doc.shareToken}`;
                      try {
                        await navigator.clipboard.writeText(url);
                        toast({
                          title: "Share link copied!",
                          description: doc.shareExpiresAt
                            ? `Expires ${formatDate(doc.shareExpiresAt)}`
                            : "Expires in 7 days.",
                        });
                      } catch {
                        toast({
                          variant: "destructive",
                          title: "Copy failed",
                          description: "Could not copy link to clipboard.",
                        });
                      }
                    }}
                    className="px-3 py-2 bg-chart-2/10 text-chart-2 rounded-lg hover:bg-chart-2/20 transition-colors"
                    title="Copy share link"
                  >
                    🔗
                  </button>
                  <button
                    onClick={() => setDeleteTarget(doc._id)}
                    className="px-3 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {documents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 opacity-50 text-muted-foreground flex justify-center"><FolderOpen className="w-12 h-12" /></div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No documents uploaded</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">Securely store and organize patient documents, lab reports, and invoices.</p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary text-primary-foreground hover:brightness-110 shadow-sm"
              >
                Upload Document
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-card border-border sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete document</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-foreground hover:bg-secondary/80 border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
