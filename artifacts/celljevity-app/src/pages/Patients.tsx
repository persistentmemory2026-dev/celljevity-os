import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { PageId } from "../App";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface PatientsProps {
  userId: string;
  onNavigate: (page: PageId, ctx?: string | Record<string, unknown>) => void;
}

const STATUS_TABS = ["all", "active", "inactive", "archived"] as const;

const statusBadgeColor: Record<string, string> = {
  active: "bg-chart-2/10 text-[hsl(var(--chart-2))]",     // Mint
  inactive: "bg-chart-1/10 text-[hsl(var(--chart-1))]",   // Purple
  archived: "bg-secondary text-muted-foreground",         // Muted gray
};

export function Patients({ userId, onNavigate }: PatientsProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<any>(null);
  const [archiveTarget, setArchiveTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const patients = useQuery(api.patients.list, {
    callerId: userId as Id<"users">,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  const createPatient = useMutation(api.patients.create);
  const updatePatient = useMutation(api.patients.update);
  const archivePatient = useMutation(api.patients.archive);

  // Form state
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    dateOfBirth: "", gender: "", street: "", city: "",
    postalCode: "", country: "DE", insuranceNumber: "", notes: "",
  });

  const resetForm = () => setForm({
    firstName: "", lastName: "", email: "", phone: "",
    dateOfBirth: "", gender: "", street: "", city: "",
    postalCode: "", country: "DE", insuranceNumber: "", notes: "",
  });

  const handleCreate = async () => {
    if (!form.firstName || !form.lastName) {
      toast({ title: "First name and last name are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createPatient({
        callerId: userId as Id<"users">,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        street: form.street || undefined,
        city: form.city || undefined,
        postalCode: form.postalCode || undefined,
        country: form.country || undefined,
        insuranceNumber: form.insuranceNumber || undefined,
        notes: form.notes || undefined,
      });
      toast({ title: "Patient created", description: `${form.firstName} ${form.lastName}` });
      setCreateOpen(false);
      resetForm();
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create patient", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (p: any) => {
    setEditPatient(p);
    setForm({
      firstName: p.firstName, lastName: p.lastName, email: p.email || "",
      phone: p.phone || "", dateOfBirth: p.dateOfBirth || "", gender: p.gender || "",
      street: p.street || "", city: p.city || "", postalCode: p.postalCode || "",
      country: p.country || "DE", insuranceNumber: p.insuranceNumber || "", notes: p.notes || "",
    });
  };

  const handleUpdate = async () => {
    if (!editPatient) return;
    setSaving(true);
    try {
      await updatePatient({
        callerId: userId as Id<"users">,
        patientId: editPatient._id,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || undefined,
        phone: form.phone || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        street: form.street || undefined,
        city: form.city || undefined,
        postalCode: form.postalCode || undefined,
        country: form.country || undefined,
        insuranceNumber: form.insuranceNumber || undefined,
        notes: form.notes || undefined,
      });
      toast({ title: "Patient updated" });
      setEditPatient(null);
      resetForm();
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update patient", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    setSaving(true);
    try {
      await archivePatient({ callerId: userId as Id<"users">, patientId: archiveTarget._id });
      toast({ title: "Patient archived", description: `${archiveTarget.firstName} ${archiveTarget.lastName}` });
      setArchiveTarget(null);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to archive patient", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filtered = patients?.filter((p: any) => {
    if (!search) return true;
    const tokens = search.toLowerCase().split(/\s+/).filter(Boolean);
    return tokens.every((t: string) =>
      p.firstName.toLowerCase().includes(t) || p.lastName.toLowerCase().includes(t)
    );
  });

  if (patients === undefined) {
    return (
      <div className="p-4 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-display font-bold text-foreground">Patients</h1>
        <Card>
          <div className="p-6 border-b border-border"><Skeleton className="h-9 w-32 bg-muted" /></div>
          <div className="divide-y divide-border/50">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="space-y-2"><Skeleton className="h-4 w-48 bg-muted" /><Skeleton className="h-3 w-24 bg-muted" /></div>
                <Skeleton className="h-5 w-20 bg-muted" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  const patientForm = (
    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div><Label className="text-foreground">First Name *</Label><Input className="bg-card text-foreground border-border" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
        <div><Label className="text-foreground">Last Name *</Label><Input className="bg-card text-foreground border-border" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label className="text-foreground">Email</Label><Input className="bg-card text-foreground border-border" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><Label className="text-foreground">Phone</Label><Input className="bg-card text-foreground border-border" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label className="text-foreground">Date of Birth</Label><Input className="bg-card text-foreground border-border [color-scheme:dark]" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
        <div>
          <Label className="text-foreground">Gender</Label>
          <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
            <SelectTrigger className="bg-card text-foreground border-border"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label className="text-foreground">Street</Label><Input className="bg-card text-foreground border-border" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} /></div>
      <div className="grid grid-cols-3 gap-4">
        <div><Label className="text-foreground">Postal Code</Label><Input className="bg-card text-foreground border-border" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} /></div>
        <div><Label className="text-foreground">City</Label><Input className="bg-card text-foreground border-border" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
        <div><Label className="text-foreground">Country</Label><Input className="bg-card text-foreground border-border" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
      </div>
      <div><Label className="text-foreground">Insurance Number</Label><Input className="bg-card text-foreground border-border" value={form.insuranceNumber} onChange={(e) => setForm({ ...form, insuranceNumber: e.target.value })} /></div>
      <div><Label className="text-foreground">Notes</Label><Textarea className="bg-card text-foreground border-border" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
    </div>
  );

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-foreground">Patients</h1>
        <Button className="bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_15px_-3px_rgba(120,224,173,0.4)]" onClick={() => { resetForm(); setCreateOpen(true); }}>
          + New Patient
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs bg-card text-foreground border-border"
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab 
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_-3px_rgba(120,224,173,0.4)]" 
                  : "bg-card text-foreground border border-border hover:bg-secondary"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50 border-b border-border">
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground font-medium uppercase text-xs">Name</TableHead>
              <TableHead className="text-muted-foreground font-medium uppercase text-xs">Date of Birth</TableHead>
              <TableHead className="text-muted-foreground font-medium uppercase text-xs">Phone</TableHead>
              <TableHead className="text-muted-foreground font-medium uppercase text-xs">Status</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium uppercase text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {filtered && filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-0">
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-5xl mb-4 opacity-50 grayscale">🩺</div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No patients yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">Add your first patient to start managing their care.</p>
                    <Button
                      onClick={() => { resetForm(); setCreateOpen(true); }}
                      className="bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_15px_-3px_rgba(120,224,173,0.4)]"
                    >
                      Add Patient
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered?.map((p: any) => (
                <TableRow
                  key={p._id}
                  className="cursor-pointer hover:bg-secondary/40 transition-colors border-border/50"
                  onClick={() => onNavigate("patient-detail", p._id)}
                >
                  <TableCell>
                    <p className="font-medium text-foreground">{p.lastName}, {p.firstName}</p>
                    {p.email && <p className="text-sm text-muted-foreground">{p.email}</p>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.dateOfBirth ? formatDate(p.dateOfBirth) : "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`border-0 ${statusBadgeColor[p.status] || ""}`}>{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="sm" className="bg-transparent border-border text-foreground hover:bg-secondary" onClick={() => openEdit(p)}>Edit</Button>
                      {p.status !== "archived" && (
                        <Button variant="outline" size="sm" className="bg-destructive/10 border-transparent text-destructive hover:text-destructive-foreground hover:bg-destructive" onClick={() => setArchiveTarget(p)}>
                          Archive
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) { setCreateOpen(false); resetForm(); } else setCreateOpen(true); }}>
        <DialogContent className="max-w-lg bg-card border-border sm:rounded-2xl text-foreground">
          <DialogHeader><DialogTitle className="font-display">New Patient</DialogTitle></DialogHeader>
          {patientForm}
          <DialogFooter>
            <Button variant="outline" className="border-border hover:bg-secondary text-foreground" onClick={() => { setCreateOpen(false); resetForm(); }}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground hover:brightness-110" onClick={handleCreate} disabled={saving || !form.firstName || !form.lastName}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editPatient} onOpenChange={(open) => { if (!open) { setEditPatient(null); resetForm(); } }}>
        <DialogContent className="max-w-lg bg-card border-border sm:rounded-2xl text-foreground">
          <DialogHeader><DialogTitle className="font-display">Edit Patient</DialogTitle></DialogHeader>
          {patientForm}
          <DialogFooter>
            <Button variant="outline" className="border-border hover:bg-secondary text-foreground" onClick={() => { setEditPatient(null); resetForm(); }}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground hover:brightness-110" onClick={handleUpdate} disabled={saving || !form.firstName || !form.lastName}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent className="bg-card border-border sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Archive Patient</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to archive <strong className="text-foreground">{archiveTarget?.firstName} {archiveTarget?.lastName}</strong>? The patient record will be preserved but marked as archived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-foreground border-border hover:bg-secondary/80">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
