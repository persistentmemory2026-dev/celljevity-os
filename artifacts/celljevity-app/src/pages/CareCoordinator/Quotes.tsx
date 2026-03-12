import { useState, useMemo } from "react";
import { 
  useListQuotes, useCreateQuote, useUpdateQuote, useGetQuote,
  useAddLineItem, useUpdateLineItem, useDeleteLineItem,
  useListServices, useListPatients,
  QuoteStatus, ServiceCategory, QuoteDetail, QuoteDetailLineItemsItem
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Plus, Search, FileText, Download, Edit, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "@/lib/utils";

export default function Quotes() {
  const { t } = useTranslation();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const { data: quotesData, isLoading, refetch } = useListQuotes({ patientId: selectedPatientId || undefined });
  const { data: patientsData } = useListPatients({ limit: 100 });
  const { data: servicesData } = useListServices({ activeOnly: true });

  const [createOpen, setCreateOpen] = useState(false);
  const [newQuoteData, setNewQuoteData] = useState({ patientId: "", currency: "EUR", exchangeRateUsed: 1 });
  
  const [viewQuoteId, setViewQuoteId] = useState<string | null>(null);
  
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const addLineItem = useAddLineItem();
  const updateLineItem = useUpdateLineItem();
  const deleteLineItem = useDeleteLineItem();
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createQuote.mutateAsync({ data: newQuoteData });
      toast({ title: t("quotes.quoteCreated") });
      setCreateOpen(false);
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: t("common.error"), description: message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">{t("quotes.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("quotes.description")}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> {t("quotes.newQuote")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("quotes.createQuote")}</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("quotes.patient")}</label>
                <select 
                  required
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  value={newQuoteData.patientId}
                  onChange={e => setNewQuoteData({...newQuoteData, patientId: e.target.value})}
                >
                  <option value="">{t("quotes.selectPatient")}</option>
                  {patientsData?.data?.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.celljevityId})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("quotes.currency")}</label>
                  <select 
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    value={newQuoteData.currency}
                    onChange={e => setNewQuoteData({...newQuoteData, currency: e.target.value})}
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CHF">CHF (£)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("quotes.exchangeRate")}</label>
                  <Input 
                    type="number" step="0.01" required 
                    value={newQuoteData.exchangeRateUsed}
                    onChange={e => setNewQuoteData({...newQuoteData, exchangeRateUsed: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createQuote.isPending}>
                {createQuote.isPending && <Loader2 className="w-4 h-4 ltr:mr-2 rtl:ml-2 animate-spin" />} {t("quotes.createQuote")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {viewQuoteId ? (
        <QuoteBuilder 
          quoteId={viewQuoteId} 
          onClose={() => { setViewQuoteId(null); refetch(); }} 
          services={servicesData?.data || []}
        />
      ) : (
        <Card className="shadow-md">
          <div className="p-4 border-b flex items-center gap-4 bg-secondary/10">
            <div className="flex-1 max-w-sm">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("quotes.filterByPatient")}</label>
              <select 
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm"
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
              >
                <option value="">{t("common.all")}</option>
                {patientsData?.data?.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t("quotes.quoteInvoice")}</th>
                  <th className="px-6 py-4 font-semibold">{t("quotes.patient")}</th>
                  <th className="px-6 py-4 font-semibold">{t("common.date")}</th>
                  <th className="px-6 py-4 font-semibold">{t("quotes.amount")}</th>
                  <th className="px-6 py-4 font-semibold">{t("common.status")}</th>
                  <th className="px-6 py-4 text-right rtl:text-left">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t("common.loading")}</td></tr>
                ) : quotesData?.data?.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t("common.noData")}</td></tr>
                ) : (
                  quotesData?.data?.map((quote) => {
                    const patient = patientsData?.data?.find(p => p.id === quote.patientId);
                    return (
                      <tr key={quote.id} className="hover:bg-secondary/20 transition-colors group">
                        <td className="px-6 py-4 font-mono text-sm">{quote.invoiceNumber}</td>
                        <td className="px-6 py-4 font-medium">{patient ? `${patient.firstName} ${patient.lastName}` : quote.patientId}</td>
                        <td className="px-6 py-4 text-muted-foreground">{format(new Date(quote.issueDate), 'MMM d, yyyy')}</td>
                        <td className="px-6 py-4 font-medium">{formatCurrency(quote.totalAmount, quote.currency)}</td>
                        <td className="px-6 py-4">
                          <Badge variant={quote.status === 'ACCEPTED' || quote.status === 'PAID' ? 'success' : quote.status === 'DRAFT' ? 'secondary' : 'default'}>
                            {quote.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="ghost" onClick={() => setViewQuoteId(quote.id)}>
                            <Edit className="w-4 h-4 mr-2" /> Manage
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

interface ServiceItem {
  id: string;
  name: string;
  basePriceEur: string;
  defaultDescription?: string;
  category: string;
}

interface LineItemUpdate {
  customDescription?: string;
  quantity?: number;
  unitPrice?: number;
}

function QuoteBuilder({ quoteId, onClose, services }: { quoteId: string, onClose: () => void, services: ServiceItem[] }) {
  const { t } = useTranslation();
  const { data: quoteDetail, isLoading, refetch } = useGetQuote(quoteId);
  const updateQuote = useUpdateQuote();
  const addLineItem = useAddLineItem();
  const updateLineItem = useUpdateLineItem();
  const deleteLineItem = useDeleteLineItem();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<ServiceCategory>("EXOSOMES");

  const handleAddService = async (service: ServiceItem) => {
    if (!quoteDetail) return;
    try {
      await addLineItem.mutateAsync({
        quoteId,
        data: {
          serviceId: service.id,
          unitPrice: parseFloat(service.basePriceEur),
          quantity: 1,
          customDescription: service.name
        }
      });
      toast({ title: t("quotes.itemAdded") });
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: t("common.error"), description: message, variant: "destructive" });
    }
  };

  const handleUpdateItem = async (itemId: string, updates: LineItemUpdate) => {
    try {
      await updateLineItem.mutateAsync({
        quoteId,
        itemId,
        data: updates
      });
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: t("common.error"), description: message, variant: "destructive" });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteLineItem.mutateAsync({ quoteId, itemId });
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: t("common.error"), description: message, variant: "destructive" });
    }
  };

  const handleStatusUpdate = async (status: QuoteStatus) => {
    try {
      await updateQuote.mutateAsync({ quoteId, data: { status } });
      toast({ title: t("quotes.statusUpdated") });
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: t("common.error"), description: message, variant: "destructive" });
    }
  };

  const exportPDF = () => {
    if (!quoteDetail) return;
    const doc = new jsPDF();
    doc.setFont("helvetica");
    
    doc.setFontSize(22);
    doc.text(t("auth.brandTitle"), 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(t("quotes.pdfSubtitle"), 14, 26);
    
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(quoteDetail.status === 'DRAFT' ? t("quotes.pdfQuote") : t("quotes.pdfInvoice"), 150, 20);
    doc.setFontSize(10);
    doc.text(`# ${quoteDetail.invoiceNumber}`, 150, 26);
    doc.text(`${t("common.date")}: ${format(new Date(quoteDetail.issueDate), 'MMM d, yyyy')}`, 150, 32);

    doc.setFontSize(12);
    doc.text(`${t("quotes.pdfBillTo")}:`, 14, 45);
    doc.setFontSize(10);
    doc.text(`${t("quotes.patient")} ID: ${quoteDetail.patientId}`, 14, 52);

    const tableData = quoteDetail.lineItems.map(item => [
      item.customDescription || item.serviceName || '',
      item.quantity.toString(),
      formatCurrency(item.unitPrice, quoteDetail.currency),
      formatCurrency(item.lineTotal, quoteDetail.currency)
    ]);

    autoTable(doc, {
      startY: 65,
      head: [[t("quotes.description_label"), t("quotes.qty"), t("quotes.unitPrice"), t("quotes.total")]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
    });

    const tableEndY = 65 + (tableData.length + 1) * 10;
    doc.setFontSize(12);
    doc.text(`${t("quotes.totalAmount")}: ${formatCurrency(quoteDetail.totalAmount, quoteDetail.currency)}`, 140, tableEndY + 15);

    doc.save(`Quote_${quoteDetail.invoiceNumber}.pdf`);
  };

  if (isLoading || !quoteDetail) return <div className="p-12 text-center animate-pulse">{t("common.loading")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onClose}>&larr; {t("quotes.backToQuotes")}</Button>
        <div className="flex-1" />
        <Button variant="outline" className="gap-2" onClick={exportPDF}><Download className="w-4 h-4" /> {t("quotes.exportPdf")}</Button>
        <select 
          className="h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm"
          value={quoteDetail.status}
          onChange={(e) => handleStatusUpdate(e.target.value as QuoteStatus)}
        >
          {Object.values(QuoteStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b bg-secondary/10 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle>{t("quotes.lineItems")}</CardTitle>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">{t("quotes.totalAmount")}</div>
                  <div className="text-2xl font-bold font-mono">{formatCurrency(quoteDetail.totalAmount, quoteDetail.currency)}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left rtl:text-right">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                  <tr>
                    <th className="px-4 py-3">{t("quotes.description_label")}</th>
                    <th className="px-4 py-3 w-24">{t("quotes.qty")}</th>
                    <th className="px-4 py-3 w-32">{t("quotes.unitPrice")}</th>
                    <th className="px-4 py-3 w-32">{t("quotes.total")}</th>
                    <th className="px-4 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {quoteDetail.lineItems?.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t("quotes.noItems")}</td></tr>
                  ) : (
                    quoteDetail.lineItems?.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <Input 
                            value={item.customDescription || item.serviceName || ''} 
                            onChange={(e) => handleUpdateItem(item.id, { customDescription: e.target.value })}
                            className="h-8 text-sm bg-transparent border-transparent hover:border-input focus:border-input"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input 
                            type="number" min="1"
                            value={item.quantity} 
                            onChange={(e) => handleUpdateItem(item.id, { quantity: parseInt(e.target.value) })}
                            className="h-8 w-20 text-sm bg-transparent border-transparent hover:border-input focus:border-input"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input 
                            type="number" step="0.01"
                            value={item.unitPrice} 
                            onChange={(e) => handleUpdateItem(item.id, { unitPrice: parseFloat(e.target.value) })}
                            className="h-8 w-24 text-sm bg-transparent border-transparent hover:border-input focus:border-input"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {formatCurrency(item.lineTotal, quoteDetail.currency)}
                        </td>
                        <td className="px-4 py-3 text-right rtl:text-left">
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">{t("quotes.serviceCatalog")}</CardTitle>
            </CardHeader>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ServiceCategory)} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-4 pt-4">
                <TabsList className="grid grid-cols-2 lg:grid-cols-3 h-auto gap-1">
                  {Object.values(ServiceCategory).map(cat => (
                    <TabsTrigger key={cat} value={cat} className="text-xs py-1">{cat.replace('_', ' ')}</TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {Object.values(ServiceCategory).map(cat => (
                  <TabsContent key={cat} value={cat} className="mt-0 space-y-3">
                    {services.filter(s => s.category === cat).map(service => (
                      <div key={service.id} className="p-3 rounded-xl border bg-card hover:border-primary/50 transition-colors group">
                        <div className="font-medium text-sm">{service.name}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.defaultDescription}</div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-mono text-sm font-semibold">{formatCurrency(service.basePriceEur, "EUR")}</span>
                          <Button size="sm" variant="secondary" className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleAddService(service)}>
                            <Plus className="w-3 h-3 ltr:mr-1 rtl:ml-1" /> {t("quotes.add")}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {services.filter(s => s.category === cat).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">{t("common.noData")}</div>
                    )}
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
