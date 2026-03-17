import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";

interface AdminUsersProps {
  userId: string;
}

type UserRow = {
  _id: Id<"users">;
  email: string;
  name: string;
  role: string;
};

const ROLES = ["admin", "coordinator", "provider", "patient"] as const;

function roleBadgeColor(role: string) {
  switch (role) {
    case "admin":
      return "bg-destructive/10 text-destructive border-transparent";
    case "coordinator":
      return "bg-primary/10 text-primary border-transparent";
    case "provider":
      return "bg-[hsl(var(--chart-2))]/10 text-[hsl(var(--chart-2))] border-transparent";
    case "patient":
      return "bg-secondary text-muted-foreground border-transparent";
    default:
      return "bg-secondary text-muted-foreground border-transparent";
  }
}

export function AdminUsers({ userId }: AdminUsersProps) {
  const users = useQuery(api.users.listUsers, { callerId: userId as Id<"users"> });
  const createUser = useMutation(api.users.createUser);
  const updateUser = useMutation(api.users.updateUser);
  const deleteUser = useMutation(api.users.deleteUser);
  const { toast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("coordinator");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createUser({
        callerId: userId as Id<"users">,
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      toast({ title: "User created", description: `${newName} has been added.` });
      setCreateOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("coordinator");
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (user: UserRow) => {
    setEditUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await updateUser({
        callerId: userId as Id<"users">,
        userId: editUser._id,
        name: editName,
        email: editEmail,
        role: editRole,
      });
      toast({ title: "User updated", description: `${editName} has been updated.` });
      setEditUser(null);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteUser({
        callerId: userId as Id<"users">,
        userId: deleteTarget._id,
      });
      toast({ title: "User deleted", description: `${deleteTarget.name} has been removed.` });
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (users === undefined) {
    return (
      <div className="p-4 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-display font-bold text-foreground">User Management</h1>
        <Card>
          <div className="p-6 border-b border-border">
            <Skeleton className="h-9 w-32 bg-muted" />
          </div>
          <div className="divide-y divide-border/50">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40 bg-muted" />
                  <Skeleton className="h-3 w-28 bg-muted" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full bg-muted" />
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
        <h1 className="text-3xl font-display font-bold text-foreground">User Management</h1>
        <Button 
          className="bg-primary text-primary-foreground hover:brightness-110 shadow-[0_0_15px_-3px_rgba(120,224,173,0.4)]" 
          onClick={() => setCreateOpen(true)}
        >
          + Add User
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50 border-b border-border">
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground font-medium uppercase text-xs">Name</TableHead>
              <TableHead className="text-muted-foreground font-medium uppercase text-xs">Email</TableHead>
              <TableHead className="text-muted-foreground font-medium uppercase text-xs">Role</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium uppercase text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id} className="hover:bg-secondary/40 transition-colors border-border/50">
                  <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="bg-transparent border-border text-foreground hover:bg-secondary" onClick={() => openEdit(user)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-destructive/10 border-transparent text-destructive hover:text-destructive-foreground hover:bg-destructive"
                        onClick={() => setDeleteTarget(user)}
                        disabled={user._id === userId}
                        title={user._id === userId ? "Cannot delete your own account" : undefined}
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

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md bg-card border-border sm:rounded-2xl text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display">Create User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-foreground">Name</Label>
              <Input className="bg-card text-foreground border-border" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <Label className="text-foreground">Email</Label>
              <Input className="bg-card text-foreground border-border" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div>
              <Label className="text-foreground">Password</Label>
              <Input className="bg-card text-foreground border-border" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Set a password" />
            </div>
            <div>
              <Label className="text-foreground">Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="bg-card text-foreground border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border hover:bg-secondary text-foreground" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground hover:brightness-110" onClick={handleCreate} disabled={saving || !newName || !newEmail || !newPassword}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-w-md bg-card border-border sm:rounded-2xl text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display">Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-foreground">Name</Label>
              <Input className="bg-card text-foreground border-border" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label className="text-foreground">Email</Label>
              <Input className="bg-card text-foreground border-border" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div>
              <Label className="text-foreground">Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="bg-card text-foreground border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border hover:bg-secondary text-foreground" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground hover:brightness-110" onClick={handleUpdate} disabled={saving || !editName || !editEmail}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete User</AlertDialogTitle>
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
