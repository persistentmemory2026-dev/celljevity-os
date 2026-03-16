import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

interface DocumentsProps {
  userId: string;
}

export function Documents({ userId }: DocumentsProps) {
  const [category, setCategory] = useState<string>("all");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documents = useQuery(
    api.documents.list,
    { userId, category: category === "all" ? undefined : category }
  );
  const removeDocument = useMutation(api.documents.remove);

  const categories = ["all", "invoice", "quote", "lab-report", "other"];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${import.meta.env.VITE_CONVEX_URL}/api/uploadDocument?userId=${userId}&category=other`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Upload failed");

      alert("File uploaded successfully!");
      // Refetch will happen automatically via Convex reactivity
    } catch (error) {
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      await removeDocument({ documentId: docId as any });
      alert("Document deleted successfully!");
    } catch (error) {
      alert("Failed to delete document.");
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Document Vault</h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {uploading ? "Uploading..." : "+ Upload Document"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              category === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat === "all" ? "All Documents" : cat}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents?.map((doc) => (
          <div
            key={doc._id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                {getFileIcon(doc.mimeType)}
              </div>
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {doc.category}
              </span>
            </div>

            <h3 className="font-medium text-gray-900 mb-1 truncate" title={doc.originalName}>
              {doc.originalName}
            </h3>

            <div className="text-sm text-gray-500 space-y-1 mb-4">
              <p>{formatFileSize(doc.size)}</p>
              <p>Uploaded {formatDate(doc.createdAt)}</p>
            </div>

            <div className="flex gap-2">
              <a
                href={`${import.meta.env.VITE_CONVEX_URL}/api/downloadDocument?token=${doc.shareToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-center text-sm font-medium transition"
              >
                Download
              </a>
              <button
                onClick={() => handleDelete(doc._id)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {(!documents || documents.length === 0) && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">📁</div>
          <p className="text-lg mb-2">No documents yet</p>
          <p className="text-sm">Upload your first document to get started</p>
        </div>
      )}
    </div>
  );
}
