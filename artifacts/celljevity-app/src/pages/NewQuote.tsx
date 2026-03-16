import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

interface NewQuoteProps {
  userId: string;
  onNavigate: (page: "dashboard" | "services" | "quotes" | "documents" | "new-quote") => void;
}

interface QuoteItem {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
}

export function NewQuote({ userId, onNavigate }: NewQuoteProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [type, setType] = useState<"quote" | "invoice">("quote");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(19);

  const services = useQuery(api.services.list);
  const createQuote = useMutation(api.quotes.create);

  const addItem = (service: any) => {
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
        userId,
        type,
        customerName,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        items: items.map((i) => ({ serviceId: i.serviceId as any, quantity: i.quantity })),
        notes: notes || undefined,
        taxRate,
      });

      // Generate and download PDF
      downloadPDF(newQuote);

      alert(`${type === "quote" ? "Quote" : "Invoice"} created successfully!`);
      onNavigate("quotes");
    } catch (error: any) {
      alert(error.message || "Failed to create quote");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPDF = (quote: any) => {
    const { subtotal, taxAmount, total } = calculateTotals();
    
    const content = `
${type === "quote" ? "QUOTE" : "INVOICE"}

${quote.quoteNumber}

Customer: ${customerName}
Email: ${customerEmail || "N/A"}
Phone: ${customerPhone || "N/A"}

Items:
${items.map((item) => `
${item.serviceName}
${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.quantity * item.unitPrice)}
`).join("\n")}

Subtotal: ${formatCurrency(subtotal)}
Tax (${taxRate}%): ${formatCurrency(taxAmount)}
Total: ${formatCurrency(total)}

${notes ? `Notes: ${notes}` : ""}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${quote.quoteNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        New {type === "quote" ? "Quote" : "Invoice"}
      </h1>

      {/* Type Selection */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setType("quote")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            type === "quote"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Quote
        </button>
        <button
          onClick={() => setType("invoice")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            type === "invoice"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Invoice
        </button>
      </div>

      {/* Step 1: Customer Info */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Customer name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="+49 123 456789"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!customerName}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next: Select Services
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Services */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services?.map((service) => (
                <div
                  key={service._id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-500">{service.category}</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(service.price)}
                    </p>
                  </div>
                  <button
                    onClick={() => addItem(service)}
                    className="mt-3 w-full py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                  >
                    Add to Quote
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Items */}
          {items.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Items</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.serviceId}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.serviceName}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.unitPrice)} per unit
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.serviceId, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.serviceId, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <p className="font-medium text-gray-900 w-24 text-right">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Tax ({taxRate}%)</span>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={items.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next: Review
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Review & Notes</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Customer</h3>
              <p>{customerName}</p>
              {customerEmail && <p className="text-sm text-gray-600">{customerEmail}</p>}
              {customerPhone && <p className="text-sm text-gray-600">{customerPhone}</p>}
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Items</h3>
              {items.map((item) => (
                <div key={item.serviceId} className="flex justify-between py-2">
                  <span>{item.serviceName} x {item.quantity}</span>
                  <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                rows={4}
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? "Creating..." : `Create ${type === "quote" ? "Quote" : "Invoice"} & Download`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
