import { useState } from "react";
import { useListUsers, useCreateUser, useUpdateUser, UserRole } from "@workspace/api-client-react";
import { Card, CardContent, Button, Input, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Label } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Edit2, ShieldAlert, Loader2 } from "lucide-react";

export default function Users() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  
  const { data: usersData, isLoading, refetch } = useListUsers({
    role: roleFilter as UserRole || undefined,
    limit: 100 // simplified for UI without full pagination
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", password: "", role: "CARE_COORDINATOR" as UserRole });
  
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser.mutateAsync({ data: formData });
      toast({ title: "User created" });
      setCreateOpen(false);
      setFormData({ firstName: "", lastName: "", email: "", password: "", role: "CARE_COORDINATOR" });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updates: any = {
        firstName: editData.firstName,
        lastName: editData.lastName,
        role: editData.role,
        isActive: editData.isActive
      };
      if (editData.password) updates.password = editData.password;

      await updateUser.mutateAsync({ userId: editData.id, data: updates });
      toast({ title: "User updated" });
      setEditOpen(false);
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await updateUser.mutateAsync({ userId, data: { isActive: !currentStatus } });
      toast({ title: `User ${!currentStatus ? 'activated' : 'deactivated'}` });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Client-side search filtering (since API doesn't support search param natively on listUsers in the spec, or if it does, it wasn't listed in params)
  const filteredUsers = usersData?.data?.filter(u => 
    !search || 
    u.firstName.toLowerCase().includes(search.toLowerCase()) || 
    u.lastName.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage staff and system access.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Create User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Internal User</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>First Name</Label><Input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
                <div className="space-y-2"><Label>Last Name</Label><Input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div className="space-y-2"><Label>Password (min 8 chars)</Label><Input type="password" required minLength={8} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
              <div className="space-y-2"><Label>Role</Label>
                <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                  <option value="CARE_COORDINATOR">Care Coordinator</option>
                  <option value="MEDICAL_PROVIDER">Medical Provider</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="PATIENT">Patient (Not Recommended here)</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={createUser.isPending}>
                {createUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name or email..." className="pl-9 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="h-10 rounded-xl border border-input bg-white px-3 text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as UserRole)}>
          <option value="">All Roles</option>
          {Object.values(UserRole).map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
      </div>

      <Card className="shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Loading users...</td></tr>
              ) : filteredUsers?.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No users found.</td></tr>
              ) : (
                filteredUsers?.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{user.firstName} {user.lastName}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-white">{user.role.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.isActive ? "success" : "destructive"}>
                        {user.isActive ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setEditData({...user, password: ''}); setEditOpen(true); }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className={user.isActive ? "text-destructive" : "text-emerald-600"}
                        onClick={() => handleToggleActive(user.id, user.isActive ?? true)}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          {editData && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>First Name</Label><Input required value={editData.firstName} onChange={e => setEditData({...editData, firstName: e.target.value})} /></div>
                <div className="space-y-2"><Label>Last Name</Label><Input required value={editData.lastName} onChange={e => setEditData({...editData, lastName: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><Label>Role</Label>
                <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={editData.role} onChange={e => setEditData({...editData, role: e.target.value as UserRole})}>
                  <option value="CARE_COORDINATOR">Care Coordinator</option>
                  <option value="MEDICAL_PROVIDER">Medical Provider</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="PATIENT">Patient</option>
                </select>
              </div>
              <div className="space-y-2"><Label>New Password (Optional)</Label><Input type="password" minLength={8} placeholder="Leave blank to keep current" value={editData.password} onChange={e => setEditData({...editData, password: e.target.value})} /></div>
              
              {editData.role === 'SUPER_ADMIN' && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg text-sm border border-amber-200">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  Warning: Super Admin changes require care.
                </div>
              )}

              <Button type="submit" className="w-full" disabled={updateUser.isPending}>
                {updateUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
