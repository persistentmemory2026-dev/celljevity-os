import { useState } from "react";
import { useListUsers, useCreateUser, useUpdateUser, UserRole } from "@workspace/api-client-react";
import { Card, CardContent, Button, Input, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Label } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Search, Plus, Edit2, ShieldAlert, Loader2 } from "lucide-react";

interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive?: boolean;
  password?: string;
}

export default function Users() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  
  const { data: usersData, isLoading, refetch } = useListUsers({
    role: roleFilter as UserRole || undefined,
    limit: 100
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", password: "", role: "CARE_COORDINATOR" as UserRole });
  
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<UserRecord | null>(null);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser.mutateAsync({ data: formData });
      toast({ title: t("admin.users.userCreated") });
      setCreateOpen(false);
      setFormData({ firstName: "", lastName: "", email: "", password: "", role: "CARE_COORDINATOR" });
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({ title: t("common.error"), description: message, variant: "destructive" });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData) return;
    try {
      const updates: Record<string, unknown> = {
        firstName: editData.firstName,
        lastName: editData.lastName,
        role: editData.role,
        isActive: editData.isActive
      };
      if (editData.password) updates.password = editData.password;

      await updateUser.mutateAsync({ userId: editData.id, data: updates });
      toast({ title: t("admin.users.userUpdated") });
      setEditOpen(false);
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({ title: t("common.error"), description: message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await updateUser.mutateAsync({ userId, data: { isActive: !currentStatus } });
      toast({ title: t("common.success") });
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({ title: t("common.error"), description: message, variant: "destructive" });
    }
  };

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
          <h1 className="text-3xl font-display font-bold">{t("admin.users.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("admin.users.description")}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> {t("admin.users.createUser")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("admin.users.createUser")}</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{t("auth.firstName")}</Label><Input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
                <div className="space-y-2"><Label>{t("auth.lastName")}</Label><Input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><Label>{t("common.email")}</Label><Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div className="space-y-2"><Label>{t("auth.password")}</Label><Input type="password" required minLength={8} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
              <div className="space-y-2"><Label>{t("admin.users.role")}</Label>
                <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                  <option value="CARE_COORDINATOR">Care Coordinator</option>
                  <option value="MEDICAL_PROVIDER">Medical Provider</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="PATIENT">Patient</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={createUser.isPending}>
                {createUser.isPending && <Loader2 className="w-4 h-4 ltr:mr-2 rtl:ml-2 animate-spin" />} {t("common.create")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t("admin.users.searchPlaceholder")} className="pl-9 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="h-10 rounded-xl border border-input bg-white px-3 text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as UserRole)}>
          <option value="">{t("admin.users.allRoles")}</option>
          {Object.values(UserRole).map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
      </div>

      <Card className="shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left rtl:text-right">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
              <tr>
                <th className="px-6 py-4 font-semibold">{t("common.name")}</th>
                <th className="px-6 py-4 font-semibold">{t("admin.users.role")}</th>
                <th className="px-6 py-4 font-semibold">{t("common.status")}</th>
                <th className="px-6 py-4 text-right rtl:text-left">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">{t("common.loading")}</td></tr>
              ) : filteredUsers?.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">{t("common.noData")}</td></tr>
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
                        {user.isActive ? t("common.active") : t("common.inactive")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left">
                      <Button size="sm" variant="ghost" onClick={() => { setEditData({...user, password: ''} as UserRecord); setEditOpen(true); }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className={user.isActive ? "text-destructive" : "text-emerald-600"}
                        onClick={() => handleToggleActive(user.id, user.isActive ?? true)}
                      >
                        {user.isActive ? t("common.inactive") : t("common.active")}
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
          <DialogHeader><DialogTitle>{t("admin.users.editUser")}</DialogTitle></DialogHeader>
          {editData && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{t("auth.firstName")}</Label><Input required value={editData.firstName} onChange={e => setEditData({...editData, firstName: e.target.value})} /></div>
                <div className="space-y-2"><Label>{t("auth.lastName")}</Label><Input required value={editData.lastName} onChange={e => setEditData({...editData, lastName: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><Label>{t("admin.users.role")}</Label>
                <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={editData.role} onChange={e => setEditData({...editData, role: e.target.value as UserRole})}>
                  <option value="CARE_COORDINATOR">Care Coordinator</option>
                  <option value="MEDICAL_PROVIDER">Medical Provider</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="PATIENT">Patient</option>
                </select>
              </div>
              <div className="space-y-2"><Label>{t("admin.users.newPassword")}</Label><Input type="password" minLength={8} placeholder={t("admin.users.newPasswordPlaceholder")} value={editData.password || ''} onChange={e => setEditData({...editData, password: e.target.value})} /></div>
              
              {editData.role === 'SUPER_ADMIN' && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg text-sm border border-amber-200">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {t("admin.users.adminWarning")}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={updateUser.isPending}>
                {updateUser.isPending && <Loader2 className="w-4 h-4 ltr:mr-2 rtl:ml-2 animate-spin" />} {t("common.save")}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
