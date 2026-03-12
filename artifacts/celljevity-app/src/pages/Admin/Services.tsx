import { useState } from "react";
import { useListServices, useCreateService, useUpdateService, ServiceCategory } from "@workspace/api-client-react";
import { Card, CardContent, Button, Input, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Label } from "@/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Plus, Edit2, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ServiceFormData {
  name: string;
  category: ServiceCategory;
  defaultDescription: string;
  basePriceEur: number;
  isPartnerService: boolean;
  partnerName: string;
}

interface ServiceRecord extends ServiceFormData {
  id: string;
  isActive: boolean;
}

export default function Services() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ServiceCategory>("EXOSOMES");
  const { data: servicesData, isLoading, refetch } = useListServices({ category: activeTab });

  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", category: "EXOSOMES" as ServiceCategory, defaultDescription: "", basePriceEur: 0, isPartnerService: false, partnerName: "" });

  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<ServiceRecord | null>(null);

  const createService = useCreateService();
  const updateService = useUpdateService();
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createService.mutateAsync({ data: formData });
      toast({ title: t("admin.services.serviceCreated") });
      setCreateOpen(false);
      setFormData({ name: "", category: activeTab, defaultDescription: "", basePriceEur: 0, isPartnerService: false, partnerName: "" });
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({ title: t("common.error"), description: message, variant: "destructive" });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;
    try {
      await updateService.mutateAsync({ 
        serviceId: editData.id, 
        data: {
          name: editData.name,
          category: editData.category,
          defaultDescription: editData.defaultDescription,
          basePriceEur: editData.basePriceEur,
          isActive: editData.isActive,
          isPartnerService: editData.isPartnerService,
          partnerName: editData.partnerName
        } 
      });
      toast({ title: t("admin.services.serviceUpdated") });
      setEditOpen(false);
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({ title: t("common.error"), description: message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (serviceId: string, currentStatus: boolean) => {
    try {
      await updateService.mutateAsync({ serviceId, data: { isActive: !currentStatus } });
      toast({ title: t("common.success") });
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({ title: t("common.error"), description: message, variant: "destructive" });
    }
  };

  const ServiceFormFields = ({ data, setData }: { data: ServiceFormData, setData: (d: ServiceFormData) => void }) => (
    <>
      <div className="space-y-2"><Label>{t("admin.services.serviceName")}</Label><Input required value={data.name} onChange={e => setData({...data, name: e.target.value})} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>{t("admin.services.category")}</Label>
          <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={data.category} onChange={e => setData({...data, category: e.target.value as ServiceCategory})}>
            {Object.values(ServiceCategory).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-2"><Label>{t("admin.services.basePrice")}</Label><Input type="number" step="0.01" required value={data.basePriceEur} onChange={e => setData({...data, basePriceEur: parseFloat(e.target.value)})} /></div>
      </div>
      <div className="space-y-2"><Label>{t("admin.services.defaultDescription")}</Label><Textarea value={data.defaultDescription || ''} onChange={e => setData({...data, defaultDescription: e.target.value})} /></div>
      
      <div className="flex flex-col gap-3 p-4 bg-secondary/20 rounded-xl border">
        <div className="flex items-center space-x-2">
          <Checkbox id="isPartner" checked={data.isPartnerService} onCheckedChange={(c) => setData({...data, isPartnerService: !!c})} />
          <label htmlFor="isPartner" className="text-sm font-medium">{t("admin.services.partnerService")}</label>
        </div>
        {data.isPartnerService && (
          <div className="space-y-2"><Label>{t("admin.services.partnerName")}</Label><Input value={data.partnerName || ''} onChange={e => setData({...data, partnerName: e.target.value})} /></div>
        )}
      </div>
    </>
  );

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">{t("admin.services.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("admin.services.description")}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> {t("admin.services.addService")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("admin.services.addService")}</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <ServiceFormFields data={formData} setData={setFormData} />
              <Button type="submit" className="w-full" disabled={createService.isPending}>
                {createService.isPending && <Loader2 className="w-4 h-4 ltr:mr-2 rtl:ml-2 animate-spin" />} {t("common.save")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Card className="shadow-md overflow-hidden flex flex-col min-h-[600px]">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ServiceCategory)} className="flex flex-col flex-1">
          <div className="px-6 pt-4 border-b bg-secondary/5">
            <TabsList className="h-auto gap-2 bg-transparent">
              {Object.values(ServiceCategory).map(cat => (
                <TabsTrigger key={cat} value={cat} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-2 text-xs">
                  {cat.replace('_', ' ')}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          <TabsContent value={activeTab} className="flex-1 m-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left rtl:text-right">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                  <tr>
                    <th className="px-6 py-4 font-semibold">{t("admin.services.serviceName")}</th>
                    <th className="px-6 py-4 font-semibold">{t("admin.services.basePrice")}</th>
                    <th className="px-6 py-4 font-semibold">{t("admin.services.partnerService")}</th>
                    <th className="px-6 py-4 font-semibold">{t("common.status")}</th>
                    <th className="px-6 py-4 text-right rtl:text-left">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t("common.loading")}</td></tr>
                  ) : servicesData?.data?.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t("common.noData")}</td></tr>
                  ) : (
                    servicesData?.data?.map((service) => (
                      <tr key={service.id} className="hover:bg-secondary/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-foreground">{service.name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-xs">{service.defaultDescription}</div>
                        </td>
                        <td className="px-6 py-4 font-mono font-medium">{formatCurrency(service.basePriceEur, "EUR")}</td>
                        <td className="px-6 py-4">
                          {service.isPartnerService ? (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">{service.partnerName || 'External'}</Badge>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={service.isActive ? "success" : "secondary"}>
                            {service.isActive ? t("common.active") : t("common.inactive")}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right rtl:text-left">
                          <Button size="sm" variant="ghost" onClick={() => { setEditData({...service, basePriceEur: parseFloat(service.basePriceEur)} as ServiceRecord); setEditOpen(true); }}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className={service.isActive ? "text-destructive" : "text-emerald-600"}
                            onClick={() => handleToggleActive(service.id, service.isActive)}
                          >
                            {service.isActive ? t("common.inactive") : t("common.active")}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("admin.services.editService")}</DialogTitle></DialogHeader>
          {editData && (
            <form onSubmit={handleEdit} className="space-y-4">
              <ServiceFormFields data={editData} setData={(d) => setEditData({...editData, ...d})} />
              <Button type="submit" className="w-full" disabled={updateService.isPending}>
                {updateService.isPending && <Loader2 className="w-4 h-4 ltr:mr-2 rtl:ml-2 animate-spin" />} {t("common.save")}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
