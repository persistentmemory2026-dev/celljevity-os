import { useState } from "react";
import { useGetMyProfile, useListConsents, useRevokeConsent, useGdprExport } from "@workspace/api-client-react";
import { Card, CardContent, Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui";
import { ShieldCheck, ShieldAlert, Download, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

interface ConsentRecord {
  id: string;
  consentType: string;
  granted: boolean;
  version: string;
  grantedAt?: string | null;
  revokedAt?: string | null;
}

export default function Consent() {
  const { t } = useTranslation();
  const { data: profile } = useGetMyProfile();
  const { data: consentsData, isLoading, refetch } = useListConsents(
    profile?.id || "",
    {},
    { query: { enabled: !!profile?.id } }
  );

  const [revokeOpen, setRevokeOpen] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState<ConsentRecord | null>(null);
  const [exporting, setExporting] = useState(false);
  
  const revokeConsent = useRevokeConsent();
  const gdprExportQuery = useGdprExport({ query: { enabled: false } });
  const { toast } = useToast();

  const handleRevoke = async () => {
    if (!selectedConsent || !profile?.id) return;
    try {
      await revokeConsent.mutateAsync({
        consentId: selectedConsent.id,
      });
      
      toast({ title: t("consent.consentRevoked"), description: t("consent.consentRevokedDesc") });
      setRevokeOpen(false);
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not revoke consent.";
      toast({ title: t("consent.updateFailed"), description: message, variant: "destructive" });
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await gdprExportQuery.refetch();
      if (result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `celljevity_data_export_${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: t("consent.exportComplete"), description: t("consent.exportCompleteDesc") });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not generate export.";
      toast({ title: t("consent.exportFailed"), description: message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">{t("consent.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("consent.description")}</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {t("consent.exportMyData")}
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-muted-foreground animate-pulse">{t("consent.loadingPermissions")}</div>
        ) : (
          consentsData?.data?.map((consent) => (
            <Card key={consent.id} className="shadow-sm border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {consent.granted ? (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{consent.consentType.replace(/_/g, ' ')}</h3>
                      <p className="text-sm text-muted-foreground">{t("consent.version", { version: consent.version })}</p>
                    </div>
                  </div>
                  <Badge variant={consent.granted ? "success" : "destructive"}>
                    {consent.granted ? t("common.active").toUpperCase() : "REVOKED"}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  {consent.grantedAt && (
                    <div className="text-sm text-muted-foreground">
                      {t("consent.grantedOn", { date: format(new Date(consent.grantedAt), 'MMM d, yyyy') })}
                    </div>
                  )}
                  {consent.revokedAt && (
                    <div className="text-sm text-muted-foreground">
                      {t("consent.revokedOn", { date: format(new Date(consent.revokedAt), 'MMM d, yyyy') })}
                    </div>
                  )}
                  
                  {consent.granted && (
                    <Button 
                      variant="outline" 
                      className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setSelectedConsent(consent);
                        setRevokeOpen(true);
                      }}
                    >
                      {t("consent.revokeConsent")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> {t("consent.revokeConfirmTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm font-medium" dangerouslySetInnerHTML={{
              __html: t("consent.revokeConfirmMessage", { consentType: selectedConsent?.consentType.replace(/_/g, ' ') || "" })
            }} />
            <p className="text-sm text-muted-foreground">
              {t("consent.revokeImplications")}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRevokeOpen(false)}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={revokeConsent.isPending}>
              {revokeConsent.isPending && <Loader2 className="w-4 h-4 ltr:mr-2 rtl:ml-2 animate-spin" />}
              {t("consent.yesRevoke")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
