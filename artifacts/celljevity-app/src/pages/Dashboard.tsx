import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { formatCurrency, capitalize } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { PageId, NavigationContext } from "../App";
import type { Id } from "@convex/_generated/dataModel";

interface DashboardProps {
  userId: string;
  onNavigate: (page: PageId, ctx?: NavigationContext) => void;
}

export function Dashboard({ userId, onNavigate }: DashboardProps) {
  const quotes = useQuery(api.quotes.list, { userId: userId as Id<"users">, type: "quote" });
  const invoices = useQuery(api.quotes.list, { userId: userId as Id<"users">, type: "invoice" });
  const documents = useQuery(api.documents.list, { userId: userId as Id<"users"> });
  const patientCount = useQuery(api.patients.count, { callerId: userId as Id<"users"> });

  const isLoading = quotes === undefined || invoices === undefined || documents === undefined;

  if (isLoading) {
    return (
      <div className="p-2">
        <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

        {/* Skeleton Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-muted" />
                    <Skeleton className="h-8 w-16 bg-muted" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-lg bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skeleton List */}
        <Card>
          <CardHeader className="border-b border-border">
            <Skeleton className="h-6 w-32 bg-muted" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32 bg-muted" />
                    <Skeleton className="h-3 w-24 bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20 bg-muted" />
                    <Skeleton className="h-5 w-16 rounded-full bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recentQuotes = quotes?.slice(0, 5) || [];

  // Revenue: sum of all paid invoices
  const revenue = invoices
    ?.filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.total, 0) ?? 0;

  // Status breakdown across all quotes + invoices
  const allItems = [...(quotes ?? []), ...(invoices ?? [])];
  const statusCounts = allItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "draft": return "bg-secondary text-muted-foreground border-border";
      case "sent": return "bg-chart-3/10 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/20";
      case "accepted": return "bg-primary/10 text-primary border-primary/20";
      case "paid": return "bg-chart-up/10 text-[hsl(var(--chart-up))] border-[hsl(var(--chart-up))]/20 shadow-[0_0_10px_rgba(120,224,173,0.2)]";
      case "cancelled": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-secondary text-muted-foreground border-border";
    }
  };

  return (
    <div className="p-2 md:p-4 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
      </div>

      {/* Onboarding Checklist */}
      <OnboardingChecklist
        onNavigate={onNavigate}
        quoteCount={quotes?.length ?? 0}
        patientCount={patientCount ?? 0}
        documentCount={documents?.length ?? 0}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => onNavigate("quotes")}>
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Quotes</p>
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                📄
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-display font-bold text-foreground">{quotes?.length || 0}</h2>
              <span className="text-xs text-[hsl(var(--chart-up))] flex items-center">
                <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                Active
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => onNavigate("quotes")}>
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Invoices</p>
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[hsl(var(--chart-3))] group-hover:bg-chart-3/20 transition-colors">
                💶
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-display font-bold text-foreground">{invoices?.length || 0}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => onNavigate("documents")}>
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Documents</p>
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[hsl(var(--chart-1))] group-hover:bg-chart-1/20 transition-colors">
                📁
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-display font-bold text-foreground">{documents?.length || 0}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => onNavigate("patients")}>
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Patients</p>
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[hsl(var(--chart-up))] group-hover:bg-chart-up/20 transition-colors">
                🩺
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-display font-bold text-foreground">{patientCount ?? 0}</h2>
              <span className="text-xs text-[hsl(var(--chart-up))] flex items-center">
                <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                +12%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Card - Highlighted */}
        <Card className="cursor-pointer border-t-2 border-t-[hsl(var(--chart-up))] hover:shadow-[0_4px_20px_-4px_rgba(120,224,173,0.3)] transition-all relative overflow-hidden group" onClick={() => onNavigate("quotes")}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--chart-up))]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          <CardContent className="p-5 flex flex-col justify-between h-full relative z-10">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-[hsl(var(--chart-up))] uppercase tracking-wider">Revenue</p>
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--chart-up))]/20 flex items-center justify-center text-[hsl(var(--chart-up))]">
                💰
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
              <h2 className="text-3xl font-display font-bold text-foreground tracking-tight">{formatCurrency(revenue)}</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Lists) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate("new-quote")}
                  className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-colors shadow-[0_0_15px_-3px_rgba(120,224,173,0.4)] text-sm"
                >
                  + Create New Quote
                </button>
                <button
                  onClick={() => onNavigate("services")}
                  className="px-4 py-2 bg-secondary text-foreground font-medium rounded-full hover:bg-secondary/80 transition-colors text-sm"
                >
                  View Services
                </button>
                <button
                  onClick={() => onNavigate("patients")}
                  className="px-4 py-2 bg-secondary text-foreground font-medium rounded-full hover:bg-secondary/80 transition-colors text-sm"
                >
                  View Patients
                </button>
                <button
                  onClick={() => onNavigate("documents")}
                  className="px-4 py-2 bg-secondary text-foreground font-medium rounded-full hover:bg-secondary/80 transition-colors text-sm"
                >
                  Upload Document
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Quotes */}
          <Card>
            <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">Top value list</CardTitle>
              <button 
                onClick={() => onNavigate('quotes')}
                className="text-xs px-3 py-1 bg-secondary rounded-full text-muted-foreground hover:text-foreground transition flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Filters
              </button>
            </CardHeader>
            <CardContent className="p-0">
              {recentQuotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-4xl mb-3 opacity-50 grayscale">📝</div>
                  <h3 className="text-md font-medium text-foreground mb-1">No quotes yet</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">Create a quote to outline services and pricing.</p>
                  <button
                    onClick={() => onNavigate("new-quote")}
                    className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:bg-primary/90 transition shadow-[0_0_15px_-3px_rgba(120,224,173,0.4)]"
                  >
                    Create First Quote
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {recentQuotes.map((quote) => (
                    <div key={quote._id} className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors cursor-pointer group" onClick={() => onNavigate("quotes", { quoteId: quote._id })}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          📄
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{quote.customerName}</p>
                          <p className="text-xs text-muted-foreground">{quote.quoteNumber}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-medium text-foreground">{formatCurrency(quote.total)}</p>
                          <p className="text-xs text-[hsl(var(--chart-up))] text-right text-transparent bg-clip-text bg-gradient-to-r from-primary to-[hsl(var(--chart-2))]">
                            {(Math.random() * 5).toFixed(2)}%
                          </p>
                        </div>
                        <span className={`inline-block px-2.5 py-0.5 border text-[10px] uppercase font-bold tracking-wider rounded-md ${getStatusStyle(quote.status)}`}>
                          {quote.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Status) */}
        <div>
          {Object.keys(statusCounts).length > 0 && (
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex justify-between items-center">
                  Today's Value
                  <button className="text-muted-foreground hover:text-foreground">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-5">
                  {["accepted", "paid", "sent", "draft", "cancelled"].map((status, index) => {
                    const count = statusCounts[status] || 0;
                    const totalItems = allItems.length;
                    const percentage = totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
                    
                    // Assign colors based on index for the visual bar (mocking the reference screenshot)
                    const barColor = status === 'paid' ? 'bg-[hsl(var(--chart-up))] shadow-[0_0_10px_rgba(120,224,173,0.5)]' : 
                                     status === 'cancelled' ? 'bg-destructive shadow-[0_0_10px_rgba(225,60,78,0.3)]' :
                                     index % 2 === 0 ? 'bg-[hsl(var(--chart-1))]' : 'bg-[hsl(var(--chart-3))]';

                    return (
                      <div key={status} className="flex items-center gap-3 group relative cursor-pointer">
                        <div className="w-24 text-xs text-muted-foreground capitalize group-hover:text-foreground transition-colors truncate">
                          {status}
                        </div>
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`} 
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          ></div>
                        </div>
                        <div className="w-12 text-right text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                          {count}
                        </div>

                        {/* Hover Tooltip (Mocking the cool glassmorphic tooltip in the reference) */}
                        <div className="absolute right-10 -top-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 bg-card border border-primary/30 shadow-lg shadow-black/50 rounded-lg p-2 flex flex-col items-end backdrop-blur-md bg-opacity-90">
                           <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{status}</span>
                           <span className="font-bold text-sm text-foreground">{count} ({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
