import { useState } from "react";
import { useGetAuditLogs } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from "@/components/ui";
import { format } from "date-fns";
import { ShieldCheck, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function AuditLogs() {
  const [offset, setOffset] = useState(0);
  const limit = 50;
  
  const { data: auditData, isLoading } = useGetAuditLogs({ limit, offset });

  return (
    <div className="space-y-6 pb-12">
      <header>
        <h1 className="text-3xl font-display font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">System-wide security and activity monitoring.</p>
      </header>

      <Card className="shadow-md">
        <CardHeader className="border-b bg-secondary/10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-primary" /> Event Stream
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
              <tr>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold">User ID</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Resource</th>
                <th className="px-6 py-4 font-semibold">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-xs">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground font-sans">Loading logs...</td></tr>
              ) : auditData?.data?.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground font-sans">No audit logs found.</td></tr>
              ) : (
                auditData?.data?.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap">{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</td>
                    <td className="px-6 py-3 truncate max-w-[150px]" title={log.userId || 'System'}>{log.userId || 'System'}</td>
                    <td className="px-6 py-3 font-semibold text-primary">{log.action}</td>
                    <td className="px-6 py-3">
                      {log.targetResourceType} {log.targetResourceId && <span className="text-muted-foreground ml-1">({log.targetResourceId})</span>}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{log.ipAddress || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t flex items-center justify-between bg-secondary/5">
          <div className="text-sm text-muted-foreground">
            Showing {offset + 1} to {offset + (auditData?.data?.length || 0)}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0}>
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOffset(offset + limit)} disabled={(auditData?.data?.length || 0) < limit}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
