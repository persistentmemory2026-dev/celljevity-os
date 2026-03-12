import { useState, useCallback } from "react";
import { 
  useGetMyProfile, 
  useListDocuments, 
  useUploadDocument, 
  useUploadDocumentContent, 
  useDownloadDocument,
  DocumentType
} from "@workspace/api-client-react";
import { useDropzone } from "react-dropzone";
import { Card, Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui";
import { FileText, UploadCloud, Download, FilePlus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function Documents() {
  const { t } = useTranslation();
  const { data: profile } = useGetMyProfile();
  const { data: documentsData, isLoading, refetch } = useListDocuments(
    { documentType: undefined },
    { query: { enabled: !!profile?.id } }
  );

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>("OTHER");
  const [file, setFile] = useState<File | null>(null);
  
  const uploadDocMetadata = useUploadDocument();
  const uploadDocContent = useUploadDocumentContent();
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      if (acceptedFiles[0].size > MAX_FILE_SIZE) {
        toast({ title: t("documents.fileTooLarge"), description: t("documents.fileTooLargeDesc"), variant: "destructive" });
        return;
      }
      setFile(acceptedFiles[0]);
    }
  }, [toast, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    maxSize: MAX_FILE_SIZE,
    multiple: false
  });

  const handleUpload = async () => {
    if (!file || !profile?.id) return;
    try {
      const metaRes = await uploadDocMetadata.mutateAsync({
        data: {
          documentType: selectedType,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size
        }
      });
      
      if (metaRes.uploadToken) {
        await uploadDocContent.mutateAsync({
           token: metaRes.uploadToken,
           data: file as unknown as Blob
        });
      }

      toast({ title: t("documents.uploadSuccess"), description: t("documents.uploadSuccessDesc") });
      setUploadOpen(false);
      setFile(null);
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({ title: t("documents.uploadFailed"), description: message, variant: "destructive" });
    }
  };

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/api/documents/${documentId}/download`, { credentials: "include" });
      if (!response.ok) throw new Error("Download request failed");
      const downloadInfo = await response.json();
      
      const contentResponse = await fetch(
        `${baseUrl}/api/documents/download/${downloadInfo.downloadToken}`,
        { credentials: "include" }
      );
      if (!contentResponse.ok) throw new Error("File download failed");
      
      const blob = await contentResponse.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: t("documents.downloadFailed"), variant: "destructive" });
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case "LAB_RESULT": return "bg-blue-100 text-blue-800";
      case "DOCTOR_LETTER": return "bg-purple-100 text-purple-800";
      case "SIGNED_CONSENT": return "bg-emerald-100 text-emerald-800";
      case "INVOICE_PDF": return "bg-amber-100 text-amber-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">{t("documents.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("documents.description")}</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <FilePlus className="w-4 h-4" /> {t("documents.uploadDocument")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("documents.uploadNew")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("documents.documentType")}</label>
                <select 
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary/20"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                >
                  <option value="LAB_RESULT">{t("documents.types.LAB_RESULT")}</option>
                  <option value="DOCTOR_LETTER">{t("documents.types.DOCTOR_LETTER")}</option>
                  <option value="SIGNED_CONSENT">{t("documents.types.SIGNED_CONSENT")}</option>
                  <option value="BIOPSY_REPORT">{t("documents.types.BIOPSY_REPORT")}</option>
                  <option value="INVOICE_PDF">{t("documents.types.INVOICE_PDF")}</option>
                  <option value="IMAGING">{t("documents.types.IMAGING")}</option>
                  <option value="OTHER">{t("documents.types.OTHER")}</option>
                </select>
              </div>

              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                  isDragActive ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"
                )}
              >
                <input {...getInputProps()} />
                <UploadCloud className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                {file ? (
                  <div className="text-sm font-medium text-primary">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</div>
                ) : (
                  <div>
                    <p className="text-sm font-medium">{t("documents.dragDrop")}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t("documents.fileLimit")}</p>
                  </div>
                )}
              </div>

              <Button 
                className="w-full" 
                disabled={!file || uploadDocMetadata.isPending || uploadDocContent.isPending}
                onClick={handleUpload}
              >
                {uploadDocMetadata.isPending || uploadDocContent.isPending ? <Loader2 className="w-4 h-4 ltr:mr-2 rtl:ml-2 animate-spin" /> : null}
                {t("documents.secureUpload")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <Card className="shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
              <tr>
                <th className="px-6 py-4 font-semibold rounded-tl-xl rtl:rounded-tr-xl rtl:rounded-tl-none">{t("documents.fileName")}</th>
                <th className="px-6 py-4 font-semibold">{t("documents.type")}</th>
                <th className="px-6 py-4 font-semibold">{t("documents.size")}</th>
                <th className="px-6 py-4 font-semibold">{t("documents.dateUploaded")}</th>
                <th className="px-6 py-4 font-semibold text-right rtl:text-left rounded-tr-xl rtl:rounded-tl-xl rtl:rounded-tr-none">{t("documents.action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground animate-pulse">{t("common.loading")}</td></tr>
              ) : documentsData?.data?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">{t("documents.emptyVault")}</p>
                  </td>
                </tr>
              ) : (
                documentsData?.data?.map((doc) => (
                  <tr key={doc.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      {doc.fileName}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={cn("border-transparent font-medium", getTypeColor(doc.documentType))}>
                        {doc.documentType.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono">
                      {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(2)} MB` : '-'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(doc.uploadDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left">
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.id, doc.fileName)} title="Download">
                        <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
