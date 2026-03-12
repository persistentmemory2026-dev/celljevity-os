import { useState } from "react";
import { useGetMyProfile, useListConsents, useRevokeConsent, useGdprExport } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui";
import { ShieldCheck, ShieldAlert, Download, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Consent() {
  const { data: profile } = useGetMyProfile();
  const { data: consentsData, isLoading, refetch } = useListConsents(
    profile?.id || "",
    {},
    { query: { enabled: !!profile?.id } }
  );

  const [revokeOpen, setRevokeOpen] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState<any>(null);
  
  const revokeConsent = useRevokeConsent();
  const gdprExport = useGdprExport();
  const { toast } = useToast();

  const handleRevoke = async () => {
    if (!selectedConsent || !profile?.id) return;
    try {
      // Assuming useRevokeConsent signature based on Orval pattern
      await revokeConsent.mutateAsync({
        patientId: profile.id,
        consentType: selectedConsent.consentType,
      } as any);
      
      toast({ title: "Consent Revoked", description: "Your privacy preferences have been updated." });
      setRevokeOpen(false);
      refetch();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message || "Could not revoke consent.", variant: "destructive" });
    }
  };

  const handleExport = async () => {
    if (!profile?.id) return;
    try {
      const result = await gdprExport.mutateAsync({ patientId: profile.id } as any);
      
      // If it returns JSON directly
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `celljevity_data_export_${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: "Export Complete", description: "Your data has been downloaded." });
    } catch (err: any) {
      toast({ title: "Export Failed", description: err.message || "Could not generate export.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Consent & Privacy</h1>
          <p className="text-muted-foreground mt-1">Manage your data permissions and privacy settings.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport} disabled={gdprExport.isPending}>
          {gdprExport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export My Data
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-muted-foreground animate-pulse">Loading permissions...</div>
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
                      <p className="text-sm text-muted-foreground">Version {consent.version}</p>
                    </div>
                  </div>
                  <Badge variant={consent.granted ? "success" : "destructive"}>
                    {consent.granted ? "ACTIVE" : "REVOKED"}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  {consent.grantedAt && (
                    <div className="text-sm text-muted-foreground">
                      Granted on: {format(new Date(consent.grantedAt), 'MMM d, yyyy')}
                    </div>
                  )}
                  {consent.revokedAt && (
                    <div className="text-sm text-muted-foreground">
                      Revoked on: {format(new Date(consent.revokedAt), 'MMM d, yyyy')}
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
                      Revoke Consent
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
              <AlertTriangle className="w-5 h-5" /> Revoke Consent
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm font-medium">
              Are you sure you want to revoke your consent for <strong>{selectedConsent?.consentType.replace(/_/g, ' ')}</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              Revoking this consent may limit your access to certain features or services. Some data processing may still occur if required by law or necessary for the performance of a contract.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRevokeOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={revokeConsent.isPending}>
              {revokeConsent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Yes, Revoke Consent
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
