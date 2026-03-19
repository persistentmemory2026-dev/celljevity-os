import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { formatCurrency, formatDate, capitalize } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { generateQuotePDF } from "@/lib/pdf";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from "@/components/ResponsiveDialog";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { FileText } from "lucide-react";
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
import type { Id, Doc } from "@convex/_generated/dataModel";
import type { PageId, NavigationContext } from "../App";

interface QuotesProps {
  userId: string;
  onNavigate: (page: PageId, ctx?: NavigationContext) => void;
  navContext?: NavigationContext;
}

const TAB_VALUES = ["all", "quote", "invoice"] as const;
type TabValue = (typeof TAB_VALUES)[number];

const STATUSES = ["draft", "sent", "accepted", "paid", "cancelled"] as const;

export function Quotes({ userId, onNavigate, navContext }: QuotesProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Auto-open quote from navContext
  useEffect(() => {
    if (navContext?.quoteId) {
      setSelectedQuoteId(navContext.quoteId);
    }
  }, [navContext?.quoteId]);

  const quotes = useQuery(
    api.quotes.list,
    { userId: userId as Id<"users">, type: activeTab === "all" ? undefined : activeTab }
  );

  const selectedQuote = useQuery(
    api.quotes.get,
    selectedQuoteId
      ? { quoteId: selectedQuoteId as Id<"quotes">, userId: userId as Id<"users"> }
      : "skip"
  );

  const updateStatus = useMutation(api.quotes.updateStatus);
  const removeQuote = useMutation(api.quotes.remove);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-secondary text-foreground";
      case "sent":
        return "bg-chart-3/10 text-chart-3";
      case "accepted":
        return "bg-primary/10 text-primary";
      case "paid":
        return "bg-primary/10 text-primary";
      case "cancelled":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-secondary text-foreground";
    }
  };

  const [sendConfirm, setSendConfirm] = useState<{ quoteId: string; email: string } | null>(null);

  const handleStatusChange = async (quoteId: string, newStatus: string, customerEmail?: string) => {
    // Show confirmation when setting to "sent" with an email
    if (newStatus === "sent" && customerEmail) {
      setSendConfirm({ quoteId, email: customerEmail });
      return;
    }
    await doStatusChange(quoteId, newStatus);
  };

  const doStatusChange = async (quoteId: string, newStatus: string) => {
    try {
      await updateStatus({
        quoteId: quoteId as Id<"quotes">,
        userId: userId as Id<"users">,
        status: newStatus as typeof STATUSES[number],
      });
      const msg = newStatus === "sent"
        ? "Angebot per E-Mail gesendet"
        : `Status changed to ${newStatus}.`;
      toast({
        title: newStatus === "sent" ? "E-Mail gesendet" : "Status updated",
        description: msg,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not update status. Please try again.",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeQuote({
        quoteId: deleteTarget as Id<"quotes">,
        userId: userId as Id<"users">,
      });
      toast({
        title: "Deleted",
        description: "Quote has been deleted.",
      });
      setSelectedQuoteId(null);
    } catch {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Could not delete. Please try again.",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const downloadPDF = (quote: Record<string, unknown>) => {
    try {
      generateQuotePDF({
        type: quote.type as "quote" | "invoice",
        quoteNumber: quote.quoteNumber as string,
        customerName: quote.customerName as string,
        customerEmail: quote.customerEmail as string | undefined,
        customerPhone: quote.customerPhone as string | undefined,
        items: Array.isArray(quote.items)
          ? quote.items.map((item: Record<string, unknown>) => ({
              serviceName: item.serviceName as string,
              quantity: item.quantity as number,
              unitPrice: item.unitPrice as number,
              total: item.total as number,
            }))
          : [],
        subtotal: (quote.subtotal as number) ?? (quote.total as number),
        taxRate: (quote.taxRate as number) ?? 0,
        taxAmount: (quote.taxAmount as number) ?? 0,
        total: quote.total as number,
        notes: quote.notes as string | undefined,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Could not generate PDF. Please try again.",
      });
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-foreground">Quotes & Invoices</h1>
        <Button
          variant="default"
          onClick={() => onNavigate("new-quote")}
        >
          + New Quote
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TAB_VALUES.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-foreground border border-border hover:bg-secondary"
            }`}
          >
            {tab === "all" ? "All" : tab === "quote" ? "Quotes" : "Invoices"}
          </button>
        ))}
      </div>

      {/* Search */}
      <div>
        <Input
          placeholder="Search by number, customer name, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm bg-card border-border text-foreground"
        />
      </div>

      {/* Loading State */}
      {quotes === undefined ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-24 bg-muted" />
                <Skeleton className="h-4 w-40 bg-muted" />
                <Skeleton className="h-4 w-20 bg-muted" />
                <Skeleton className="h-4 w-16 bg-muted" />
                <Skeleton className="h-4 w-20 ml-auto bg-muted" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (() => {
        const filteredQuotes = search
          ? quotes.filter((q: Doc<"quotes">) => {
              const s = search.toLowerCase();
              return (
                q.quoteNumber?.toLowerCase().includes(s) ||
                q.customerName?.toLowerCase().includes(s) ||
                q.customerEmail?.toLowerCase().includes(s)
              );
            })
          : quotes;
        return (
        /* Quotes Table / Cards */
        isMobile ? (
          <div className="space-y-4">
            {filteredQuotes.length === 0 ? (
              <Card className="flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 opacity-50 text-muted-foreground"><FileText className="w-12 h-12" /></div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No quotes or invoices yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">Create your first quote to get started with billing and invoicing.</p>
                <Button
                  variant="default"
                  onClick={() => onNavigate("new-quote")}
                  className="min-h-[44px]"
                >
                  New Quote
                </Button>
              </Card>
            ) : (
              filteredQuotes.map((quote: Doc<"quotes">) => (
                <Card key={quote._id} className="overflow-hidden" onClick={() => setSelectedQuoteId(quote._id)}>
                  <CardContent className="p-4 relative">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mb-1 ${quote.type === "invoice" ? "bg-chart-1/10 text-chart-1" : "bg-chart-3/10 text-chart-3"}`}>
                          {quote.type === "invoice" ? "Invoice" : "Quote"} {quote.quoteNumber}
                        </span>
                        <p className="font-medium text-lg text-foreground">{quote.customerName}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end mt-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{quote.createdAt && formatDate(quote.createdAt)}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(quote.status)}`}>
                          {capitalize(quote.status)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-foreground text-lg">{formatCurrency(quote.total ?? 0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
        <Card className="overflow-hidden">
          {filteredQuotes.length === 0 ? (
            <CardContent className="flex flex-col items-center justify-center p-16 text-center">
              <div className="mb-4 opacity-50 text-muted-foreground"><FileText className="w-12 h-12" /></div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No quotes or invoices yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">Create your first quote to get started with billing and invoicing.</p>
              <Button
                variant="default"
                onClick={() => onNavigate("new-quote")}
              >
                New Quote
              </Button>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Number</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Customer</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Total</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredQuotes.map((quote: Doc<"quotes">) => (
                    <tr
                      key={quote._id}
                      className="hover:bg-secondary/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedQuoteId(quote._id)}
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground">{quote.quoteNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${quote.type === "invoice" ? "bg-chart-1/10 text-chart-1" : "bg-chart-3/10 text-chart-3"}`}>
                          {quote.type === "invoice" ? "Invoice" : "Quote"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-foreground">{quote.customerName}</p>
                          <p className="text-sm text-muted-foreground">{quote.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {quote.createdAt != null && formatDate(quote.createdAt)}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={quote.status}
                          onValueChange={(value) => handleStatusChange(quote._id, value, quote.customerEmail)}
                        >
                          <SelectTrigger className={`w-[130px] h-8 text-xs font-medium border-0 ${getStatusColor(quote.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(s)}`}>
                                  {s}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4 text-right font-display font-medium text-foreground">
                        {formatCurrency(quote.total ?? 0)}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => downloadPDF(quote)}
                          className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        )
        );
      })()}

      {/* Quote Detail Dialog */}
      <ResponsiveDialog open={selectedQuoteId !== null} onOpenChange={(open) => { if (!open) setSelectedQuoteId(null); }}>
        <ResponsiveDialogContent className="max-w-2xl bg-card border-border text-foreground sm:rounded-2xl max-h-[85vh] overflow-y-auto">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="font-display">
              {selectedQuote ? `${selectedQuote.type === "invoice" ? "Invoice" : "Quote"} ${selectedQuote.quoteNumber}` : "Loading..."}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription className="text-muted-foreground">
              {selectedQuote?.createdAt != null ? `Created ${formatDate(selectedQuote.createdAt)}` : ""}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          {selectedQuote ? (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-secondary/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Customer</h3>
                <p className="font-medium text-foreground">{selectedQuote.customerName}</p>
                {selectedQuote.customerEmail && (
                  <p className="text-sm"><a href={`mailto:${selectedQuote.customerEmail}`} className="text-primary hover:underline">{selectedQuote.customerEmail}</a></p>
                )}
                {selectedQuote.customerPhone && (
                  <p className="text-sm"><a href={`tel:${selectedQuote.customerPhone}`} className="text-primary hover:underline">{selectedQuote.customerPhone}</a></p>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedQuote.status)}`}>
                  {capitalize(selectedQuote.status)}
                </span>
              </div>

              {/* Line Items */}
              {selectedQuote.items && selectedQuote.items.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Items</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 font-medium text-muted-foreground">Service</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Qty</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Unit Price</th>
                          <th className="text-right py-2 font-medium text-muted-foreground">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedQuote.items.map((item: Record<string, unknown>, i: number) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-2 text-foreground">{item.serviceName as string}</td>
                            <td className="py-2 text-right text-muted-foreground">{item.quantity as number}</td>
                            <td className="py-2 text-right text-muted-foreground">{formatCurrency(item.unitPrice as number)}</td>
                            <td className="py-2 text-right font-medium text-foreground">{formatCurrency(item.total as number)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-border pt-3 space-y-1 text-sm bg-secondary/20 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatCurrency(selectedQuote.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({selectedQuote.taxRate}%)</span>
                  <span className="text-foreground">{formatCurrency(selectedQuote.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold font-display text-base pt-2 border-t border-border mt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(selectedQuote.total)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedQuote.notes && (
                <div className="bg-secondary/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
                  <p className="text-sm text-muted-foreground">{selectedQuote.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => downloadPDF(selectedQuote)}
                >
                  Download PDF
                </Button>
                <Button
                  variant="destructive"
                  className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setDeleteTarget(selectedQuote._id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-lg bg-muted" />
              <Skeleton className="h-32 w-full rounded-lg bg-muted" />
              <Skeleton className="h-16 w-full rounded-lg bg-muted" />
            </div>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Email Send Confirmation */}
      <AlertDialog open={sendConfirm !== null} onOpenChange={(open) => { if (!open) setSendConfirm(null); }}>
        <AlertDialogContent className="bg-card border-border sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Angebot per E-Mail senden?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Das Angebot wird per E-Mail an <strong>{sendConfirm?.email}</strong> gesendet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-foreground hover:bg-secondary/80 border-border">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (sendConfirm) doStatusChange(sendConfirm.quoteId, "sent");
                setSendConfirm(null);
              }}
              className="bg-primary text-primary-foreground hover:brightness-110"
            >
              Senden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-card border-border sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete this quote?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete the quote and all its items. This action cannot be undone.
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
