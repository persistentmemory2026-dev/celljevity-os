import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

interface QuotesProps {
  userId: string;
  onNavigate: (page: "dashboard" | "services" | "quotes" | "documents" | "new-quote") => void;
}

export function Quotes({ userId, onNavigate }: QuotesProps) {
  const [activeTab, setActiveTab] = useState<"all" | "quote" | "invoice">("all");
  
  const quotes = useQuery(
    api.quotes.list, 
    { userId, type: activeTab === "all" ? undefined : activeTab }
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("de-DE");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "sent":
        return "bg-blue-100 text-blue-700";
      case "accepted":
        return "bg-green-100 text-green-700";
      case "paid":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Simple PDF export (text file for MVP)
  const downloadPDF = (quote: any) => {
    const content = `
${quote.type === "quote" ? "QUOTE" : "INVOICE"}

${quote.quoteNumber}

Customer: ${quote.customerName}
Email: ${quote.customerEmail || "N/A"}
Phone: ${quote.customerPhone || "N/A"}

Items:
${quote.items?.map((item: any) => `
${item.serviceName}
${item.quantity} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.total)}
`).join("\n") || "No items"}

Subtotal: ${formatCurrency(quote.subtotal)}
Tax (${quote.taxRate}%): ${formatCurrency(quote.taxAmount)}
Total: ${formatCurrency(quote.total)}

${quote.notes ? `Notes: ${quote.notes}` : ""}
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quotes & Invoices</h1>
        <button
          onClick={() => onNavigate("new-quote")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + New Quote
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {["all", "quote", "invoice"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab === "all" ? "All" : tab === "quote" ? "Quotes" : "Invoices"}
          </button>
        ))}
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {(!quotes || quotes.length === 0) ? (
          <div className="p-8 text-center text-gray-500">
            No {activeTab === "all" ? "" : activeTab}s found.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Number</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotes.map((quote) => (
                <tr key={quote._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{quote.quoteNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{quote.customerName}</p>
                      <p className="text-sm text-gray-500">{quote.customerEmail}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(quote.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quote.status)}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {formatCurrency(quote.total)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => downloadPDF(quote)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
