import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

interface DashboardProps {
  userId: string;
  onNavigate: (page: "dashboard" | "services" | "quotes" | "documents" | "new-quote") => void;
}

export function Dashboard({ userId, onNavigate }: DashboardProps) {
  const quotes = useQuery(api.quotes.list, { userId, type: "quote" });
  const invoices = useQuery(api.quotes.list, { userId, type: "invoice" });
  const documents = useQuery(api.documents.list, { userId });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const recentQuotes = quotes?.slice(0, 5) || [];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Quotes</p>
              <p className="text-3xl font-bold text-gray-900">{quotes?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
              📄
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Invoices</p>
              <p className="text-3xl font-bold text-gray-900">{invoices?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
              💶
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Documents</p>
              <p className="text-3xl font-bold text-gray-900">{documents?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
              📁
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => onNavigate("new-quote")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Create New Quote
          </button>
          <button
            onClick={() => onNavigate("services")}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            View Services
          </button>
          <button
            onClick={() => onNavigate("documents")}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Upload Document
          </button>
        </div>
      </div>

      {/* Recent Quotes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Quotes</h2>
        </div>
        {recentQuotes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No quotes yet. Create your first quote!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentQuotes.map((quote) => (
              <div key={quote._id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{quote.quoteNumber}</p>
                  <p className="text-sm text-gray-500">{quote.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(quote.total)}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    quote.status === "draft" ? "bg-gray-100 text-gray-700" :
                    quote.status === "sent" ? "bg-blue-100 text-blue-700" :
                    quote.status === "accepted" ? "bg-green-100 text-green-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {quote.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
