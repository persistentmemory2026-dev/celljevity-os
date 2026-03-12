import { useState } from "react";
import { useListLeads, useCreateLead, useUpdateLead, useConvertLead, LeadSource, LeadStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, UserCheck, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Leads() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "">("");
  
  const { data: leadsData, isLoading, refetch } = useListLeads({
    search: search || undefined,
    status: statusFilter as LeadStatus || undefined,
    source: sourceFilter as LeadSource || undefined,
  });

  const [addOpen, setAddOpen] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phone: "", source: "WEBSITE" as LeadSource, notes: "" });
  
  const [convertOpen, setConvertOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState("");

  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const convertLead = useConvertLead();
  const { toast } = useToast();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLead.mutateAsync({ data: formData });
      toast({ title: "Lead created", description: "The new lead has been added." });
      setAddOpen(false);
      setFormData({ firstName: "", lastName: "", email: "", phone: "", source: "WEBSITE", notes: "" });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not create lead.", variant: "destructive" });
    }
  };

  const handleConvert = async () => {
    if (!selectedLead) return;
    try {
      const res = await convertLead.mutateAsync({ id: selectedLead.id });
      setTempPassword(res.temporaryPassword || "");
      toast({ title: "Lead converted", description: "Lead is now a Patient.", variant: "default" });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Conversion failed.", variant: "destructive" });
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await updateLead.mutateAsync({ id: leadId, data: { status: newStatus } });
      toast({ title: "Status updated" });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "NEW": return "bg-blue-100 text-blue-800";
      case "CONTACTED": return "bg-amber-100 text-amber-800";
      case "QUALIFIED": return "bg-emerald-100 text-emerald-800";
      case "CONVERTED": return "bg-purple-100 text-purple-800";
      case "LOST": return "bg-slate-100 text-slate-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Lead Management</h1>
          <p className="text-muted-foreground mt-1">Track and convert prospective patients.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Lead</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Lead</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-sm font-medium">First Name</label><Input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-sm font-medium">Last Name</label><Input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><label className="text-sm font-medium">Email</label><Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Phone</label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Source</label>
                <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value as LeadSource})}>
                  {Object.values(LeadSource).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2"><label className="text-sm font-medium">Notes</label><Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
              <Button type="submit" className="w-full" disabled={createLead.isPending}>
                {createLead.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Lead
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search leads..." className="pl-9 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="h-10 rounded-xl border border-input bg-white px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as LeadStatus)}>
          <option value="">All Statuses</option>
          {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="h-10 rounded-xl border border-input bg-white px-3 text-sm" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as LeadSource)}>
          <option value="">All Sources</option>
          {Object.values(LeadSource).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Card className="shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Name & Contact</th>
                <th className="px-6 py-4 font-semibold">Source</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading leads...</td></tr>
              ) : leadsData?.data?.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No leads found.</td></tr>
              ) : (
                leadsData?.data?.map((lead) => (
                  <tr key={lead.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{lead.firstName} {lead.lastName}</div>
                      <div className="text-xs text-muted-foreground">{lead.email} {lead.phone ? `| ${lead.phone}` : ''}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">{lead.source?.replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <select 
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-none outline-none ${getStatusColor(lead.status || '')}`}
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id!, e.target.value as LeadStatus)}
                        disabled={lead.status === 'CONVERTED'}
                      >
                        {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">{format(new Date(lead.createdAt || ''), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 text-right">
                      {lead.status === 'QUALIFIED' && (
                        <Button size="sm" variant="outline" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => { setSelectedLead(lead); setConvertOpen(true); }}>
                          <UserCheck className="w-4 h-4 mr-1" /> Convert
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={convertOpen && !tempPassword} onOpenChange={setConvertOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Convert to Patient</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            This will create a patient profile for <strong>{selectedLead?.firstName} {selectedLead?.lastName}</strong> and generate a Celljevity ID. A welcome email will be sent automatically.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConvertOpen(false)}>Cancel</Button>
            <Button onClick={handleConvert} disabled={convertLead.isPending}>
              {convertLead.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Confirm Conversion
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!tempPassword} onOpenChange={() => { setTempPassword(""); setConvertOpen(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Patient Created Successfully</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Please securely share these credentials with the patient. This password will only be shown once.</p>
            <div className="p-4 bg-secondary/30 rounded-xl border space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Email:</span>
                <span className="font-mono text-sm">{selectedLead?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Temporary Password:</span>
                <span className="font-mono font-bold text-primary">{tempPassword}</span>
              </div>
            </div>
            <Button className="w-full" onClick={() => { navigator.clipboard.writeText(tempPassword); toast({title:"Copied!"}); }}>
              Copy Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
