import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AdminServicesProps {
  userId: string;
}

type ServiceRow = {
  _id: Id<"services">;
  name: string;
  description?: string;
  price: number;
  category: string;
  active: boolean;
};

const CATEGORIES = ["Exosomes", "Prometheus", "NK Cells", "Diagnostics", "Other"] as const;

export function AdminServices({ userId }: AdminServicesProps) {
  const services = useQuery(api.services.listAll, { callerId: userId as Id<"users"> });
  const createService = useMutation(api.services.createService);
  const updateService = useMutation(api.services.updateService);
  const deleteService = useMutation(api.services.deleteService);
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [editService, setEditService] = useState<ServiceRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceRow | null>(null);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("Other");
  const [newActive, setNewActive] = useState(true);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editActive, setEditActive] = useState(true);

  const resetCreateForm = () => {
    setNewName("");
    setNewDescription("");
    setNewPrice("");
    setNewCategory("Other");
    setNewActive(true);
  };

  const handleCreate = async () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      toast({ title: "Invalid price", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createService({
        callerId: userId as Id<"users">,
        name: newName,
        description: newDescription || undefined,
        price,
        category: newCategory,
        active: newActive,
      });
      toast({ title: "Service created", description: `${newName} has been added.` });
      setCreateOpen(false);
      resetCreateForm();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create service",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (svc: ServiceRow) => {
    setEditService(svc);
    setEditName(svc.name);
    setEditDescription(svc.description || "");
    setEditPrice(svc.price.toString());
    setEditCategory(svc.category);
    setEditActive(svc.active);
  };

  const handleUpdate = async () => {
    if (!editService) return;
    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) {
      toast({ title: "Invalid price", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await updateService({
        callerId: userId as Id<"users">,
        serviceId: editService._id,
        name: editName,
        description: editDescription || undefined,
        price,
        category: editCategory,
        active: editActive,
      });
      toast({ title: "Service updated", description: `${editName} has been updated.` });
      setEditService(null);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update service",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (svc: ServiceRow) => {
    try {
      await updateService({
        callerId: userId as Id<"users">,
        serviceId: svc._id,
        active: !svc.active,
      });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to toggle status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteService({
        callerId: userId as Id<"users">,
        serviceId: deleteTarget._id,
      });
      toast({ title: "Service deleted", description: `${deleteTarget.name} has been removed.` });
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete service",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (services === undefined) {
    return (
      <div className="p-4 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-display font-bold text-foreground">Service Management</h1>
        <Card>
          <div className="p-6 border-b border-border">
            <Skeleton className="h-9 w-32 bg-muted" />
          </div>
          <div className="divide-y divide-border/50">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48 bg-muted" />
                  <Skeleton className="h-3 w-24 bg-muted" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 bg-muted" />
                  <Skeleton className="h-8 w-16 bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-foreground">Service Management</h1>
        <Button 
          className="bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_15px_-3px_rgba(120,224,173,0.4)]" 
          onClick={() => setCreateOpen(true)}
        >
          + Add Service
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50 border-b border-border">
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground font-medium uppercase text-xs">Name</TableHead>
              <TableHead className="text-muted-foreground font-medium uppercase text-xs">Category</TableHead>
              <TableHead className="text-muted-foreground font-medium uppercase text-xs">Price</TableHead>
              <TableHead className="text-muted-foreground font-medium uppercase text-xs">Status</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium uppercase text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No services found.
                </TableCell>
              </TableRow>
            ) : (
              services.map((svc) => (
                <TableRow key={svc._id} className={`${!svc.active ? "opacity-60" : ""} hover:bg-secondary/40 transition-colors border-border/50`}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{svc.name}</p>
                      {svc.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-xs">{svc.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border/50">{svc.category}</Badge>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{formatCurrency(svc.price)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={svc.active}
                        onCheckedChange={() => handleToggleActive(svc)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {svc.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="bg-transparent border-border text-foreground hover:bg-secondary" onClick={() => openEdit(svc)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-destructive/10 border-transparent text-destructive hover:text-destructive-foreground hover:bg-destructive"
                        onClick={() => setDeleteTarget(svc)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Service Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) { setCreateOpen(false); resetCreateForm(); } else setCreateOpen(true); }}>
        <DialogContent className="max-w-md bg-card border-border sm:rounded-2xl text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display">Create Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-foreground">Name</Label>
              <Input className="bg-card text-foreground border-border" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Service name" />
            </div>
            <div>
              <Label className="text-foreground">Description</Label>
              <Input className="bg-card text-foreground border-border" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Optional description" />
            </div>
            <div>
              <Label className="text-foreground">Price (EUR)</Label>
              <Input className="bg-card text-foreground border-border" type="number" min="0" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label className="text-foreground">Category</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="bg-card text-foreground border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={newActive} onCheckedChange={setNewActive} />
              <Label className="text-foreground">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border hover:bg-secondary text-foreground" onClick={() => { setCreateOpen(false); resetCreateForm(); }}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground hover:brightness-110" onClick={handleCreate} disabled={saving || !newName || !newPrice}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={!!editService} onOpenChange={(open) => !open && setEditService(null)}>
        <DialogContent className="max-w-md bg-card border-border sm:rounded-2xl text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-foreground">Name</Label>
              <Input className="bg-card text-foreground border-border" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label className="text-foreground">Description</Label>
              <Input className="bg-card text-foreground border-border" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <div>
              <Label className="text-foreground">Price (EUR)</Label>
              <Input className="bg-card text-foreground border-border" type="number" min="0" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
            </div>
            <div>
              <Label className="text-foreground">Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger className="bg-card text-foreground border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editActive} onCheckedChange={setEditActive} />
              <Label className="text-foreground">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border hover:bg-secondary text-foreground" onClick={() => setEditService(null)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground hover:brightness-110" onClick={handleUpdate} disabled={saving || !editName || !editPrice}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Service</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete <strong className="text-foreground">{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-foreground border-border hover:bg-secondary/80">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
