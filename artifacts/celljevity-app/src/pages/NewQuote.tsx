import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { generateQuotePDF } from "@/lib/pdf";
import type { Id, Doc } from "@convex/_generated/dataModel";
import type { PageId, NavigationContext } from "../App";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface NewQuoteProps {
  userId: string;
  onNavigate: (page: PageId, ctx?: NavigationContext) => void;
  onDirtyChange?: (dirty: boolean) => void;
  navContext?: NavigationContext;
}

interface QuoteItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
}

interface Service {
  _id: string;
  name: string;
  price: number;
  category: string;
}

export function NewQuote({ userId, onNavigate, onDirtyChange, navContext }: NewQuoteProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Form data
  const [type, setType] = useState<"quote" | "invoice">("quote");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(19);

  // Track dirty state
  const isDirty = customerName !== "" || customerEmail !== "" || customerPhone !== "" || items.length > 0 || notes !== "";
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const services = useQuery(api.services.list);
  const patients = useQuery(api.patients.list, { callerId: userId as Id<"users"> });
  const createQuote = useMutation(api.quotes.create);

  // Auto-add service from navContext
  useEffect(() => {
    if (navContext?.serviceId && navContext.serviceName && navContext.servicePrice != null && services) {
      const existing = items.find((i) => i.serviceId === navContext.serviceId);
      if (!existing) {
        setItems([{
          serviceId: navContext.serviceId,
          serviceName: navContext.serviceName,
          quantity: 1,
          unitPrice: navContext.servicePrice,
        }]);
        setStep(2);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navContext?.serviceId, services]);

  const addItem = (service: Service) => {
    const existing = items.find((i) => i.serviceId === service._id);
    if (existing) {
      setItems(
        items.map((i) =>
          i.serviceId === service._id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setItems([
        ...items,
        {
          serviceId: service._id,
          serviceName: service.name,
          quantity: 1,
          unitPrice: service.price,
        },
      ]);
    }
  };

  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(items.filter((i) => i.serviceId !== serviceId));
    } else {
      setItems(
        items.map((i) =>
          i.serviceId === serviceId ? { ...i, quantity } : i
        )
      );
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const newQuote = await createQuote({
        userId: userId as Id<"users">,
        type,
        customerName,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        items: items.map((i) => ({ serviceId: i.serviceId as Id<"services">, quantity: i.quantity })),
        notes: notes || undefined,
        taxRate,
      });

      if (!newQuote) throw new Error("Failed to create quote");

      // Generate and download PDF
      const { subtotal, taxAmount, total } = calculateTotals();
      generateQuotePDF({
        type,
        quoteNumber: newQuote.quoteNumber,
        customerName,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        items: items.map((item) => ({
          serviceName: item.serviceName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
        subtotal,
        taxRate,
        taxAmount,
        total,
        notes: notes || undefined,
      });

      toast({
        title: `${type === "quote" ? "Quote" : "Invoice"} created`,
        description: `${newQuote.quoteNumber} has been created and downloaded.`,
      });
      onNavigate("quotes");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create quote";
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const steps = [
    { num: 1, label: "Customer" },
    { num: 2, label: "Services" },
    { num: 3, label: "Review" },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6 pb-24 md:pb-6">
      <h1 className="text-3xl font-display font-bold text-foreground">
        New {type === "quote" ? "Quote" : "Invoice"}
      </h1>

      {/* Step Indicators */}
      <div className="flex items-center gap-1 sm:gap-3">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-1 sm:gap-3">
            <button
              onClick={() => {
                if (s.num === 1) setStep(1);
                else if (s.num === 2 && customerName) setStep(2);
                else if (s.num === 3 && items.length > 0) setStep(3);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${
                step === s.num
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : step > s.num
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-current/20 flex items-center justify-center text-[10px] sm:text-xs font-bold">
                {step > s.num ? "✓" : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`w-4 sm:w-8 h-0.5 rounded ${step > s.num ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Type Selection */}
      <div className="flex gap-4">
        <Button
          variant={type === "quote" ? "default" : "secondary"}
          onClick={() => setType("quote")}
          className={type !== "quote" ? "text-muted-foreground" : ""}
        >
          Quote
        </Button>
        <Button
          variant={type === "invoice" ? "default" : "secondary"}
          onClick={() => setType("invoice")}
          className={type !== "invoice" ? "text-muted-foreground" : ""}
        >
          Invoice
        </Button>
      </div>

      {/* Step 1: Customer Info */}
      {step === 1 && (
        <Card className="p-6">
          <h2 className="text-xl font-display font-semibold text-foreground mb-4">Customer Information</h2>
          <div className="space-y-4">
            {/* Patient picker */}
            {patients && patients.length > 0 && (
              <div>
                <Label className="text-foreground mb-2 block">Select existing patient</Label>
                <select
                  className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary outline-none"
                  value=""
                  onChange={(e) => {
                    const p = patients.find((pt: any) => pt._id === e.target.value);
                    if (p) {
                      setCustomerName(`${p.firstName} ${p.lastName}`);
                      setCustomerEmail(p.email || "");
                      setCustomerPhone(p.phone || "");
                    }
                  }}
                >
                  <option value="" className="bg-card text-foreground">-- Select a patient --</option>
                  {patients.map((p: any) => (
                    <option key={p._id} value={p._id} className="bg-card text-foreground">
                      {p.firstName} {p.lastName}{p.email ? ` (${p.email})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">Or enter details manually below</p>
              </div>
            )}

            <div>
              <Label className="text-foreground">Name *</Label>
              <Input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-card border-border text-foreground"
                placeholder="Customer name"
                required
              />
            </div>
            <div>
              <Label className="text-foreground">Email</Label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="bg-card border-border text-foreground"
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <Label className="text-foreground">Phone</Label>
              <Input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="bg-card border-border text-foreground"
                placeholder="+49 123 456789"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              variant="default"
              onClick={() => setStep(2)}
              disabled={!customerName}
            >
              Next: Select Services
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Services */}
      {step === 2 && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-display font-semibold text-foreground mb-4">Select Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services?.map((service: Doc<"services">) => (
                <div
                  key={service._id}
                  className="border border-border/50 bg-secondary/20 rounded-xl p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{service.name}</p>
                      <p className="text-sm text-muted-foreground">{service.category}</p>
                    </div>
                    <p className="font-medium text-foreground">
                      {formatCurrency(service.price)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => addItem(service as Service)}
                    className="mt-4 w-full bg-transparent border-primary/50 text-primary hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    Add to Quote
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Selected Items */}
          {items.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xl font-display font-semibold text-foreground mb-4">Selected Items</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.serviceId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border/50 last:border-0 gap-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.serviceName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.unitPrice)} per unit
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.serviceId, item.quantity - 1)}
                          className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg border-border bg-transparent text-foreground hover:bg-secondary"
                        >
                          -
                        </Button>
                        <span className="w-8 text-center text-foreground font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.serviceId, item.quantity + 1)}
                          className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg border-border bg-transparent text-foreground hover:bg-secondary"
                        >
                          +
                        </Button>
                      </div>
                      <p className="font-medium text-foreground w-auto sm:w-24 text-right text-lg sm:text-base">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                  <span className="font-medium text-foreground">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-foreground mt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            </Card>
          )}

          <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:relative md:left-auto md:right-auto p-4 md:p-0 bg-background/80 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none border-t border-border md:border-0 flex justify-between z-20">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button
              variant="default"
              onClick={() => setStep(3)}
              disabled={items.length === 0}
            >
              Next: Review
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-display font-semibold text-foreground mb-4">Review & Notes</h2>

            <div className="mb-6 p-4 bg-secondary/30 border border-border/50 rounded-xl">
              <h3 className="font-medium text-foreground mb-2">Customer</h3>
              <p className="text-muted-foreground">{customerName}</p>
              {customerEmail && <p className="text-sm text-muted-foreground/80">{customerEmail}</p>}
              {customerPhone && <p className="text-sm text-muted-foreground/80">{customerPhone}</p>}
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-foreground mb-2">Items</h3>
              <div className="bg-secondary/10 rounded-xl border border-border/50 p-4 space-y-2">
                {items.map((item) => (
                  <div key={item.serviceId} className="flex justify-between py-1">
                    <span className="text-muted-foreground">{item.serviceName} x {item.quantity}</span>
                    <span className="text-foreground font-medium">{formatCurrency(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-border/50 pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg text-foreground">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-foreground">Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-card border-border text-foreground min-h-[100px]"
                placeholder="Additional notes..."
              />
            </div>
          </Card>

          <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:relative md:left-auto md:right-auto p-4 md:p-0 bg-background/80 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none border-t border-border md:border-0 flex justify-between z-20">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
            >
              Back
            </Button>
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Creating..." : `Create ${type === "quote" ? "Quote" : "Invoice"} & Download`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
