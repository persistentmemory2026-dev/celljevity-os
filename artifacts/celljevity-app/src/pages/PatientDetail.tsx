import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { PageId } from "../App";
import { formatDate } from "@/lib/utils";
import { BIOMARKER_DEFINITIONS, BIOMARKER_CATEGORIES, type BiomarkerDefinition } from "@convex/biomarkerDefinitions";
import { generateBiomarkerReportPDF } from "@/lib/pdf";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader,
  ResponsiveDialogTitle, ResponsiveDialogFooter,
} from "@/components/ResponsiveDialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceArea, RadialBarChart, RadialBar, BarChart, Bar, Cell, ReferenceLine } from "recharts";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, Plane, Hotel, Syringe, Stethoscope, Car, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { EtherealBiomarkerCard } from "@/components/dashboard/EtherealBiomarkerCard";

interface PatientDetailProps {
  userId: string;
  patientId: string;
  onNavigate: (page: PageId, ctx?: string | Record<string, unknown>) => void;
}

const treatmentStatusColors: Record<string, string> = {
  scheduled: "bg-info/10 text-info border border-info/20",
  "in-progress": "bg-warning/10 text-warning border border-warning/20",
  completed: "bg-success/10 text-success border border-success/20",
  cancelled: "bg-destructive/10 text-destructive border border-destructive/20",
};

const itineraryStatusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border border-border",
  confirmed: "bg-info/10 text-info border border-info/20",
  "in-progress": "bg-warning/10 text-warning border border-warning/20",
  completed: "bg-success/10 text-success border border-success/20",
  cancelled: "bg-destructive/10 text-destructive border border-destructive/20",
};

const ITEM_TYPE_ICONS: Record<string, React.ReactNode> = {
  travel: <Plane className="h-5 w-5 text-info" />,
  accommodation: <Hotel className="h-5 w-5 text-chart-3" />,
  treatment: <Syringe className="h-5 w-5 text-primary" />,
  consultation: <Stethoscope className="h-5 w-5 text-success" />,
  transfer: <Car className="h-5 w-5 text-warning" />,
  free: <Sun className="h-5 w-5 text-chart-1" />,
};

function PatientAccessButton({
  userId,
  patientId,
  patientEmail,
  loginStatus,
  createPatientLogin,
  toast,
}: {
  userId: string;
  patientId: string;
  patientEmail?: string;
  loginStatus: { hasLogin: boolean; email: string | null } | undefined;
  createPatientLogin: any;
  toast: any;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);

  const createInvite = useMutation(api.invites.createInvite);
  const inviteStatus = useQuery(api.invites.getInviteStatus, {
    callerId: userId as Id<"users">,
    patientId: patientId as Id<"patients">,
  });

  if (loginStatus?.hasLogin) {
    return (
      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
        Has Login
      </Badge>
    );
  }

  if (!patientEmail) {
    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
        No email
      </Badge>
    );
  }

  const handleSendInvite = async () => {
    setSendingInvite(true);
    try {
      const result = await createInvite({
        callerId: userId as Id<"users">,
        patientId: patientId as Id<"patients">,
      });
      toast({ title: `Invite sent to ${result.email}` });
    } catch (e: any) {
      toast({ title: e.message || "Failed to send invite", variant: "destructive" });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCreate = async () => {
    if (!password || password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      await createPatientLogin({
        callerId: userId as Id<"users">,
        patientId: patientId as Id<"patients">,
        password,
      });
      setCreatedCreds({ email: patientEmail!, password });
      toast({ title: "Patient login created successfully" });
    } catch (e: any) {
      toast({ title: e.message || "Failed to create login", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSendInvite} disabled={sendingInvite}>
          {sendingInvite ? "Sending..." : inviteStatus?.hasActiveInvite ? "Resend Invite" : "Send Invite"}
        </Button>
        {inviteStatus?.hasActiveInvite && inviteStatus.sentAt && (
          <span className="text-xs text-muted-foreground">
            Sent {new Date(inviteStatus.sentAt).toLocaleDateString()}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Set Password
        </Button>
      </div>
      <ResponsiveDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPassword(""); setCreatedCreds(null); } }}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Set Patient Password</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          {createdCreds ? (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">Login created. Share these credentials with the patient:</p>
              <div className="bg-secondary rounded-lg p-4 space-y-2 font-mono text-sm">
                <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{createdCreds.email}</span></div>
                <div><span className="text-muted-foreground">Password:</span> <span className="text-foreground">{createdCreds.password}</span></div>
              </div>
              <ResponsiveDialogFooter>
                <Button onClick={() => { setOpen(false); setPassword(""); setCreatedCreds(null); }}>Done</Button>
              </ResponsiveDialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div>
                <Label>Patient Email</Label>
                <Input value={patientEmail} disabled className="mt-1" />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set a temporary password"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Minimum 6 characters. Share securely with the patient.</p>
              </div>
              <ResponsiveDialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? "Creating..." : "Create Login"}
                </Button>
              </ResponsiveDialogFooter>
            </div>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}

export function PatientDetail({ userId, patientId, onNavigate }: PatientDetailProps) {
  const hasIds = !!(userId && patientId);
  const callerId = userId as Id<"users">;
  const pId = patientId as Id<"patients">;
  const { toast } = useToast();

  const patient = useQuery(api.patients.get, hasIds ? { callerId, patientId: pId } : "skip");
  const treatments = useQuery(api.treatments.listByPatient, hasIds ? { callerId, patientId: pId } : "skip");
  const biomarkers = useQuery(api.biomarkers.listByPatient, hasIds ? { callerId, patientId: pId } : "skip");
  const documents = useQuery(api.documents.listByPatient, hasIds ? { userId: callerId, patientId: pId } : "skip");
  const itineraries = useQuery(api.itineraries.listByPatient, hasIds ? { callerId, patientId: pId } : "skip");
  const activeServices = useQuery(api.services.list, {});
  const emailLogs = useQuery(api.emailLog.listByPatient, hasIds ? { callerId, patientId: pId } : "skip");
  const loginStatus = useQuery(api.users.getPatientLoginStatus, hasIds ? { callerId, patientId: pId } : "skip");
  const createPatientLogin = useMutation(api.users.createPatientLogin);

  if (patient === undefined) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Button variant="outline" size="sm" className="w-fit" onClick={() => onNavigate("patients")}>
          &larr; Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {patient.email && <><a href={`mailto:${patient.email}`} className="text-primary hover:underline">{patient.email}</a>{" | "}</>}
            {patient.phone && <><a href={`tel:${patient.phone}`} className="text-primary hover:underline">{patient.phone}</a>{" | "}</>}
            Status: {patient.status}
          </p>
        </div>
        <div className="sm:ml-auto">
          <PatientAccessButton
            userId={userId}
            patientId={patientId}
            patientEmail={patient.email}
            loginStatus={loginStatus}
            createPatientLogin={createPatientLogin}
            toast={toast}
          />
        </div>
      </div>

      <Tabs defaultValue="stammdaten">
        <div className="overflow-x-auto -mx-4 sm:-mx-8 px-4 sm:px-8 mb-6 scrollbar-none">
          <TabsList className="w-max min-h-[44px]">
            <TabsTrigger value="stammdaten">Profile</TabsTrigger>
            <TabsTrigger value="treatments">Treatments</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="biomarkers">Biomarkers</TabsTrigger>
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="emails">Emails</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="stammdaten">
          <StammdatenTab patient={patient} userId={userId} />
        </TabsContent>

        <TabsContent value="treatments">
          <TreatmentsTab
            userId={userId}
            patientId={patientId}
            treatments={treatments}
            services={activeServices}
          />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab
            userId={userId}
            patientId={patientId}
            documents={documents}
            treatments={treatments}
          />
        </TabsContent>

        <TabsContent value="biomarkers">
          <BiomarkersTab
            userId={userId}
            patientId={patientId}
            biomarkers={biomarkers}
            treatments={treatments}
            patient={patient}
          />
        </TabsContent>

        <TabsContent value="itinerary">
          <ItineraryTab
            userId={userId}
            patientId={patientId}
            itineraries={itineraries}
            treatments={treatments}
          />
        </TabsContent>

        <TabsContent value="emails">
          <EmailsTab patient={patient} emailLogs={emailLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Tab 1: Stammdaten ───────────────────────────────────────────────

function StammdatenTab({ patient, userId }: { patient: any; userId: string }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const updatePatient = useMutation(api.patients.update);
  const { toast } = useToast();
  const [form, setForm] = useState({ ...patient });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePatient({
        callerId: userId as Id<"users">,
        patientId: patient._id,
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
        language: form.language || undefined,
      });
      toast({ title: "Patient updated" });
      setEditing(false);
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Update failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const fields: Array<{ label: string; key: string; type?: string }> = [
    { label: "First Name", key: "firstName" },
    { label: "Last Name", key: "lastName" },
    { label: "Email", key: "email", type: "email" },
    { label: "Phone", key: "phone" },
    { label: "Date of Birth", key: "dateOfBirth", type: "date" },
    { label: "Gender", key: "gender" },
    { label: "Language", key: "language", type: "language" },
    { label: "Street", key: "street" },
    { label: "City", key: "city" },
    { label: "Postal Code", key: "postalCode" },
    { label: "Country", key: "country" },
    { label: "Insurance Number", key: "insuranceNumber" },
  ];

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-lg font-semibold">Patient Information</h2>
        {!editing ? (
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setForm({ ...patient }); setEditing(true); }}>Edit</Button>
        ) : (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setEditing(false)}>Cancel</Button>
            <Button className="flex-1 sm:flex-none" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(({ label, key, type }) => (
          <div key={key}>
            <Label className="text-muted-foreground text-sm">{label}</Label>
            {type === "language" ? (
              editing ? (
                <Select value={form[key] || "en"} onValueChange={(v) => setForm({ ...form, [key]: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="nl">Nederlands</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="it">Italiano</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="font-medium">{{ en: "English", de: "Deutsch", nl: "Nederlands", fr: "Français", es: "Español", it: "Italiano", pt: "Português" }[patient[key] as string] || "English"}</p>
              )
            ) : editing ? (
              <Input
                type={type || "text"}
                value={form[key] || ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            ) : (
              <p className="font-medium">{patient[key] || "-"}</p>
            )}
          </div>
        ))}
      </div>
      {(patient.notes || editing) && (
        <div className="mt-4">
          <Label className="text-muted-foreground text-sm">Notes</Label>
          {editing ? (
            <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          ) : (
            <p className="whitespace-pre-wrap">{patient.notes || "-"}</p>
          )}
        </div>
      )}

      {/* AgentMail Inbox Info */}
      <div className="mt-6 border-t border-border/50 pt-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">E-Mail Inbox</h3>
        {patient.agentmailAddress ? (
          <div className="flex items-center gap-2">
            <code className="bg-secondary px-3 py-1.5 rounded text-sm text-primary font-mono">
              {patient.agentmailAddress}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(patient.agentmailAddress);
                toast({ title: "Copied", description: "Email address copied to clipboard" });
              }}
            >
              Copy
            </Button>
          </div>
        ) : patient.email ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block w-4 h-4 border-2 border-muted-foreground/40 border-t-primary rounded-full animate-spin" />
            Inbox wird erstellt...
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Keine E-Mail-Adresse hinterlegt</p>
        )}
      </div>
    </div>
  );
}

// ─── Tab 2: Treatments ───────────────────────────────────────────────

function TreatmentsTab({ userId, patientId, treatments, services }: {
  userId: string; patientId: string; treatments: any; services: any;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const createTreatment = useMutation(api.treatments.create);
  const updateTreatment = useMutation(api.treatments.update);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleCreate = async () => {
    if (!serviceId) return;
    setSaving(true);
    try {
      await createTreatment({
        callerId: userId as Id<"users">,
        patientId: patientId as Id<"patients">,
        serviceId: serviceId as Id<"services">,
        scheduledDate: scheduledDate || undefined,
        notes: notes || undefined,
      });
      toast({ title: "Treatment added" });
      setCreateOpen(false);
      setServiceId("");
      setScheduledDate("");
      setNotes("");
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (treatmentId: string, newStatus: string) => {
    try {
      await updateTreatment({
        callerId: userId as Id<"users">,
        treatmentId: treatmentId as Id<"treatments">,
        status: newStatus,
      });
      toast({ title: `Status updated to ${newStatus}` });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  const nextStatus: Record<string, string> = {
    scheduled: "in-progress",
    "in-progress": "completed",
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-lg font-semibold">Treatments</h2>
        <Button className="w-full sm:w-auto" onClick={() => setCreateOpen(true)}>+ Add Treatment</Button>
      </div>

      {isMobile ? (
        <div className="space-y-4">
          {!treatments || treatments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 glass-card rounded-xl">No treatments yet. Add a treatment to get started.</div>
          ) : (
            treatments.map((t: any) => (
              <div key={t._id} className="glass-card rounded-xl p-4">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="font-semibold">{t.serviceName}</h3>
                  <Badge className={treatmentStatusColors[t.status] || ""}>{t.status}</Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-4 space-y-1">
                  <p>Scheduled: {t.scheduledDate ? formatDate(t.scheduledDate) : "-"}</p>
                  <p>Completed: {t.completedDate ? formatDate(t.completedDate) : "-"}</p>
                </div>
                <div className="flex justify-end gap-2">
                  {nextStatus[t.status] && (
                    <Button variant="outline" className="min-h-[44px]" size="sm" onClick={() => handleStatusChange(t._id, nextStatus[t.status])}>
                      {nextStatus[t.status] === "in-progress" ? "Start" : "Complete"}
                    </Button>
                  )}
                  {t.status !== "cancelled" && t.status !== "completed" && (
                    <Button variant="outline" className="min-h-[44px] text-destructive" size="sm" onClick={() => handleStatusChange(t._id, "cancelled")}>Cancel</Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
      <div className="glass-card rounded-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!treatments || treatments.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No treatments yet. Add a treatment to get started.</TableCell></TableRow>
            ) : (
              treatments.map((t: any) => (
                <TableRow key={t._id}>
                  <TableCell className="font-medium">{t.serviceName}</TableCell>
                  <TableCell><Badge className={treatmentStatusColors[t.status] || ""}>{t.status}</Badge></TableCell>
                  <TableCell>{t.scheduledDate ? formatDate(t.scheduledDate) : "-"}</TableCell>
                  <TableCell>{t.completedDate ? formatDate(t.completedDate) : "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {nextStatus[t.status] && (
                        <Button variant="outline" size="sm" onClick={() => handleStatusChange(t._id, nextStatus[t.status])}>
                          {nextStatus[t.status] === "in-progress" ? "Start" : "Complete"}
                        </Button>
                      )}
                      {t.status !== "cancelled" && t.status !== "completed" && (
                        <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleStatusChange(t._id, "cancelled")}>Cancel</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      )}

      <ResponsiveDialog open={createOpen} onOpenChange={setCreateOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader><ResponsiveDialogTitle>Add Treatment</ResponsiveDialogTitle></ResponsiveDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Service</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  {services?.map((s: any) => (
                    <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Scheduled Date</Label><Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} /></div>
            <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
          </div>
          <ResponsiveDialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !serviceId}>{saving ? "Adding..." : "Add"}</Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}

// ─── Tab 3: Reports ──────────────────────────────────────────────────

function ReportsTab({ userId, patientId, documents, treatments }: {
  userId: string; patientId: string; documents: any; treatments: any;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("lab-report");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const removeDocument = useMutation(api.documents.remove);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const createDocument = useMutation(api.documents.create);
  const { toast } = useToast();

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast({ variant: "destructive", title: "Invalid file type", description: `Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ variant: "destructive", title: "File too large", description: "Maximum file size is 25 MB." });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      // 1. Get upload URL from Convex
      const uploadUrl = await generateUploadUrl({ userId: userId as Id<"users"> });
      // 2. POST file directly to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();
      // 3. Create document record
      await createDocument({
        userId: userId as Id<"users">,
        filename: storageId,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        storageId,
        category: uploadCategory as "invoice" | "quote" | "lab-report" | "other",
        relatedPatientId: patientId as Id<"patients">,
      });
      toast({ title: "File uploaded", description: file.name });
    } catch {
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeDocument({ documentId: deleteTarget as Id<"documents">, userId: userId as Id<"users"> });
      toast({ title: "Document deleted" });
    } catch {
      toast({ variant: "destructive", title: "Delete failed" });
    } finally {
      setDeleteTarget(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-lg font-semibold">Reports & Documents</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={uploadCategory} onValueChange={setUploadCategory}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="lab-report">Lab Report</SelectItem>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading..." : "+ Upload"}
          </Button>
        </div>
        <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" />
      </div>

      {!documents || documents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground glass-card rounded-xl">
          <p className="text-lg mb-2">No documents yet</p>
          <p className="text-sm">Upload a report to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc: any) => (
            <div key={doc._id} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{doc.mimeType?.includes("pdf") ? "\uD83D\uDCC4" : "\uD83D\uDCCE"}</span>
                <Badge variant="outline">{doc.category}</Badge>
              </div>
              <h3 className="font-medium text-sm truncate mb-1">{doc.originalName}</h3>
              <p className="text-xs text-muted-foreground mb-3">{formatFileSize(doc.size)} &middot; {doc.createdAt ? formatDate(doc.createdAt) : ""}</p>
              <div className="flex gap-2">
                <a
                  href={doc.url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 bg-info/10 text-info border border-info/20 rounded-lg text-center text-xs font-medium hover:bg-info/20 transition-all duration-200"
                >
                  Download
                </a>
                <button onClick={() => setDeleteTarget(doc._id)} className="px-3 py-1.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/20 transition-all duration-200 text-xs">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Tab 4: Biomarkers ───────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  Aging: "\u23F3", Inflammation: "\uD83D\uDD25", Metabolic: "\u26A1", Hormonal: "\uD83E\uDDEC",
  Thyroid: "\uD83E\uDDB7", Cardiovascular: "\u2764\uFE0F", Lipids: "\uD83E\uDDE2", Vitamins: "\u2600\uFE0F",
  Liver: "\uD83E\uDEAB", Kidney: "\uD83E\uDEB8", Hematology: "\uD83E\uDE78", Immune: "\uD83D\uDEE1\uFE0F",
};

function getValueStatus(value: number, refLow?: number | null, refHigh?: number | null): "green" | "yellow" | "red" | "neutral" {
  if (refLow == null || refHigh == null) return "neutral";
  if (value < refLow || value > refHigh) return "red";
  const margin = (refHigh - refLow) * 0.1;
  if (value < refLow + margin || value > refHigh - margin) return "yellow";
  return "green";
}

const STATUS_COLORS = {
  green: { text: "text-success", bg: "bg-success", dot: "bg-success", border: "border-success/30" },
  yellow: { text: "text-warning", bg: "bg-warning", dot: "bg-warning", border: "border-warning/30" },
  red: { text: "text-destructive", bg: "bg-destructive", dot: "bg-destructive", border: "border-destructive/30" },
  neutral: { text: "text-muted-foreground", bg: "bg-muted", dot: "bg-muted-foreground", border: "border-border" },
};

function CategoryGaugeCard({ category, inRange, total, onClick }: {
  category: string; inRange: number; total: number; onClick: () => void;
}) {
  const percent = total > 0 ? Math.round((inRange / total) * 100) : 0;
  const color = percent > 80 ? "var(--success)" : percent >= 50 ? "var(--warning)" : "var(--destructive)";
  const data = [{ value: percent, fill: color }];

  return (
    <button onClick={onClick} className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-muted transition-all duration-300 text-center relative overflow-hidden group">
      <div className="w-16 h-16 shrink-0 relative z-10">
        <RadialBarChart
          width={64} height={64} cx={32} cy={32}
          innerRadius={20} outerRadius={30} barSize={7}
          data={data} startAngle={90} endAngle={-270}
        >
          <RadialBar dataKey="value" background={{ fill: "var(--muted)" }} cornerRadius={4} />
          <text x={32} y={32} textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-xs font-bold">
            {percent}%
          </text>
        </RadialBarChart>
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-base">{CATEGORY_ICONS[category] || "\uD83D\uDCCA"}</span>
          <span className="text-sm font-medium text-foreground">{category}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{inRange}/{total} in range</p>
      </div>
    </button>
  );
}



function BiomarkerDetailChart({ code, name, unit, data, refLow, refHigh, onClose }: {
  code: string; name: string; unit: string;
  data: any[]; refLow?: number; refHigh?: number; onClose: () => void;
}) {
  const [range, setRange] = useState<string>("all");

  const filtered = data.filter((d: any) => {
    if (range === "all") return true;
    const months = range === "3m" ? 3 : range === "6m" ? 6 : 12;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    return new Date(d.measuredAt) >= cutoff;
  });

  const chartData = filtered
    .sort((a: any, b: any) => a.measuredAt.localeCompare(b.measuredAt))
    .map((b: any) => ({ date: b.measuredAt, value: b.value, confidence: b.confidence, source: b.source }));

  return (
    <div className="glass-card rounded-xl p-5 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div>
          <h3 className="font-semibold text-foreground">{name}</h3>
          <p className="text-xs text-muted-foreground">
            {unit} {refLow != null && refHigh != null && `\u00B7 Ref: ${refLow}\u2013${refHigh}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {["3m", "6m", "1y", "all"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${range === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground ml-2">Close</Button>
        </div>
      </div>

      {chartData.length >= 2 ? (
        <ChartContainer config={{ value: { label: name, color: "var(--primary)" } }} className="h-64 w-full">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tickFormatter={(d: string) => new Date(d).toLocaleDateString("de-DE", { month: "short", day: "numeric" })} className="text-[10px]" />
            <YAxis domain={["auto", "auto"]} className="text-[10px]" />
            {refLow != null && refHigh != null && (
              <ReferenceArea y1={refLow} y2={refHigh} fill="var(--success)" fillOpacity={0.1} label={{ value: "Normal", position: "insideTopRight", className: "fill-success text-[10px]" }} />
            )}
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-popover border border-border rounded-lg p-2.5 shadow-md text-xs">
                    <p className="font-medium">{new Date(d.date).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}</p>
                    <p className="text-foreground font-bold mt-1">{d.value} {unit}</p>
                    {d.confidence != null && <p className="text-muted-foreground">Confidence: {Math.round(d.confidence * 100)}%</p>}
                    {d.source && <p className="text-muted-foreground">Source: {d.source}</p>}
                  </div>
                );
              }}
            />
            <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4, fill: "var(--primary)" }} activeDot={{ r: 6 }} />
          </LineChart>
        </ChartContainer>
      ) : chartData.length === 1 ? (
        <div className="h-24 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{chartData[0].value} {unit}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatDate(chartData[0].date)} &middot; Single measurement</p>
          </div>
        </div>
      ) : (
        <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
          No data in selected range
        </div>
      )}
    </div>
  );
}

function ExtractionJobsList({ jobs }: { jobs: any[] | undefined }) {
  if (!jobs || jobs.length === 0) return null;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: "bg-success/10 text-success border-success/20",
      processing: "bg-info/10 text-info border-info/20",
      review: "bg-warning/10 text-warning border-warning/20",
      failed: "bg-destructive/10 text-destructive border-destructive/20",
      pending: "bg-muted text-muted-foreground border-border",
    };
    return map[status] || map.pending;
  };

  return (
    <div className="space-y-2">
      {jobs.map((job: any) => (
        <div key={job._id} className="flex items-center justify-between glass-card rounded-lg px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{job.fileName}</p>
            <p className="text-xs text-muted-foreground">{formatDate(job.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {job.resultCount != null && (
              <span className="text-xs text-muted-foreground">{job.resultCount} results</span>
            )}
            <Badge variant="outline" className={statusBadge(job.status)}>{job.status}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function BiomarkersTab({ userId, patientId, biomarkers, treatments, patient }: {
  userId: string; patientId: string; biomarkers: any; treatments: any; patient: any;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [measuredAt, setMeasuredAt] = useState(new Date().toISOString().split("T")[0]);
  const [batchValues, setBatchValues] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const hasIds = !!(userId && patientId);
  const callerId = userId as Id<"users">;
  const pId = patientId as Id<"patients">;
  const extractionJobs = useQuery(api.extractionJobs.listByPatient, hasIds ? { callerId, patientId: pId } : "skip");

  const createBatch = useMutation(api.biomarkers.createBatch);
  const removeBiomarker = useMutation(api.biomarkers.remove);
  const { toast } = useToast();

  // ── Data processing ──────────────────────────────────────────────────
  const latestByCode: Record<string, any> = {};
  const allByCode: Record<string, any[]> = {};
  biomarkers?.forEach((b: any) => {
    if (!latestByCode[b.biomarkerCode] || b.measuredAt > latestByCode[b.biomarkerCode].measuredAt) {
      latestByCode[b.biomarkerCode] = b;
    }
    if (!allByCode[b.biomarkerCode]) allByCode[b.biomarkerCode] = [];
    allByCode[b.biomarkerCode].push(b);
  });

  // Group biomarkers by category (dynamic from actual data)
  const categoryMap: Record<string, { code: string; name: string; unit: string; latest: any; refLow?: number; refHigh?: number }[]> = {};
  for (const code of Object.keys(latestByCode)) {
    const latest = latestByCode[code];
    const def = BIOMARKER_DEFINITIONS.find((d) => d.code === code);
    const category = def?.category || latest.category || "Other";
    if (!categoryMap[category]) categoryMap[category] = [];
    categoryMap[category].push({
      code,
      name: def?.name || latest.biomarkerName || code,
      unit: def?.unit || latest.unit || "",
      latest,
      refLow: def?.refRangeLow ?? latest.refRangeLow,
      refHigh: def?.refRangeHigh ?? latest.refRangeHigh,
    });
  }

  // Sort categories by BIOMARKER_CATEGORIES order, "Other" last
  const sortedCategories = Object.keys(categoryMap).sort((a, b) => {
    const ai = BIOMARKER_CATEGORIES.indexOf(a as any);
    const bi = BIOMARKER_CATEGORIES.indexOf(b as any);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  // Category health stats
  const getCategoryHealth = (category: string) => {
    const markers = categoryMap[category] || [];
    let inRange = 0;
    let total = 0;
    for (const m of markers) {
      if (m.refLow != null && m.refHigh != null) {
        total++;
        const status = getValueStatus(m.latest.value, m.refLow, m.refHigh);
        if (status === "green") inRange++;
      }
    }
    return { inRange, total };
  };

  const getSparklineData = (code: string) => {
    return (allByCode[code] || [])
      .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
      .map((b) => ({ date: b.measuredAt, value: b.value }));
  };

  const selectedDef = selectedCode ? BIOMARKER_DEFINITIONS.find((d) => d.code === selectedCode) : null;

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleBatchSave = async () => {
    const results = Object.entries(batchValues)
      .filter(([, val]) => val && !isNaN(parseFloat(val)))
      .map(([code, val]) => {
        const def = BIOMARKER_DEFINITIONS.find((d: BiomarkerDefinition) => d.code === code)!;
        return {
          biomarkerCode: code, biomarkerName: def.name, value: parseFloat(val),
          unit: def.unit, refRangeLow: def.refRangeLow, refRangeHigh: def.refRangeHigh,
        };
      });
    if (results.length === 0) { toast({ title: "Enter at least one value", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await createBatch({ callerId: userId as Id<"users">, patientId: patientId as Id<"patients">, measuredAt, results });
      toast({ title: "Results saved", description: `${results.length} biomarkers recorded` });
      setAddOpen(false);
      setBatchValues({});
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeBiomarker({ callerId: userId as Id<"users">, resultId: deleteTarget._id });
      toast({ title: "Result deleted" });
    } catch { toast({ variant: "destructive", title: "Delete failed" }); }
    finally { setDeleteTarget(null); }
  };

  const scrollToCategory = (cat: string) => {
    document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Render ───────────────────────────────────────────────────────────
  if (!biomarkers || biomarkers.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">No biomarker data yet.</p>
        <Button onClick={() => setAddOpen(true)}>+ Add Results</Button>
        {/* Add Results Dialog (same as below) */}
        <ResponsiveDialog open={addOpen} onOpenChange={setAddOpen}>
          <ResponsiveDialogContent className="max-w-2xl">
            <ResponsiveDialogHeader><ResponsiveDialogTitle>Add Biomarker Results</ResponsiveDialogTitle></ResponsiveDialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div><Label>Date Measured</Label><Input type="date" value={measuredAt} onChange={(e) => setMeasuredAt(e.target.value)} /></div>
              {BIOMARKER_CATEGORIES.map((cat: string) => {
                const markers = BIOMARKER_DEFINITIONS.filter((d: BiomarkerDefinition) => d.category === cat);
                return (
                  <div key={cat}>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">{cat}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {markers.map((d: BiomarkerDefinition) => (
                        <div key={d.code} className="flex items-center gap-2">
                          <Label className="text-xs w-32 shrink-0">{d.name}</Label>
                          <Input type="number" step="any" placeholder={`${d.refRangeLow}-${d.refRangeHigh} ${d.unit}`}
                            value={batchValues[d.code] || ""}
                            onChange={(e) => setBatchValues({ ...batchValues, [d.code]: e.target.value })}
                            className="h-8 text-sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <ResponsiveDialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleBatchSave} disabled={saving}>{saving ? "Saving..." : "Save All"}</Button>
            </ResponsiveDialogFooter>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </div>
    );
  }

  return (
    <div>
      {/* 1. Health Score Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {sortedCategories.map((cat) => {
          const { inRange, total } = getCategoryHealth(cat);
          return (
            <CategoryGaugeCard key={cat} category={cat} inRange={inRange} total={total} onClick={() => scrollToCategory(cat)} />
          );
        })}
      </div>

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <p className="text-sm text-muted-foreground">
          {Object.keys(latestByCode).length} biomarkers across {sortedCategories.length} categories
        </p>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => {
              generateBiomarkerReportPDF({
                patientName: `${patient.firstName} ${patient.lastName}`,
                dateOfBirth: patient.dateOfBirth,
                gender: patient.gender,
                biomarkers: biomarkers ?? [],
              });
            }}
          >
            Export PDF
          </Button>
          <Button onClick={() => setAddOpen(true)}>+ Add Results</Button>
        </div>
      </div>

      {/* 2. Detail Chart (shown when a biomarker is selected) */}
      {selectedCode && allByCode[selectedCode] && (
        <BiomarkerDetailChart
          code={selectedCode}
          name={selectedDef?.name || latestByCode[selectedCode]?.biomarkerName || selectedCode}
          unit={selectedDef?.unit || latestByCode[selectedCode]?.unit || ""}
          data={allByCode[selectedCode]}
          refLow={selectedDef?.refRangeLow ?? latestByCode[selectedCode]?.refRangeLow}
          refHigh={selectedDef?.refRangeHigh ?? latestByCode[selectedCode]?.refRangeHigh}
          onClose={() => setSelectedCode(null)}
        />
      )}

      {/* 3. Category Panels (accordion) */}
      <Accordion type="multiple" defaultValue={sortedCategories.slice(0, 3)} className="mb-6">
        {sortedCategories.map((cat) => {
          const markers = categoryMap[cat];
          const { inRange, total } = getCategoryHealth(cat);
          return (
            <AccordionItem key={cat} value={cat} id={`cat-${cat}`} className="border-border/50">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <span>{CATEGORY_ICONS[cat] || "\uD83D\uDCCA"}</span>
                  <span className="font-semibold text-foreground">{cat}</span>
                  <Badge variant="outline" className="text-[10px] ml-1">
                    {markers.length} markers
                  </Badge>
                  {total > 0 && (
                    <span className={`text-xs ${inRange === total ? "text-success" : inRange >= total * 0.5 ? "text-warning" : "text-destructive"}`}>
                      {inRange}/{total} in range
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-outline-variant/10 border border-outline-variant/10">
                  {markers.map((m) => (
                    <EtherealBiomarkerCard
                      key={m.code}
                      code={m.code}
                      name={m.name}
                      unit={m.unit}
                      latestValue={m.latest.value}
                      sparkData={getSparklineData(m.code)}
                      refLow={m.refLow}
                      refHigh={m.refHigh}
                      isSelected={selectedCode === m.code}
                      onClick={() => setSelectedCode(selectedCode === m.code ? null : m.code)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* 4. Extraction History */}
      <Collapsible className="mb-6">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between text-sm text-muted-foreground hover:text-foreground">
            Extraction History {extractionJobs && `(${extractionJobs.length})`}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <ExtractionJobsList jobs={extractionJobs} />
        </CollapsibleContent>
      </Collapsible>

      {/* 5. Raw Data Table (collapsed by default) */}
      <Collapsible open={showRawData} onOpenChange={setShowRawData}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between text-sm text-muted-foreground hover:text-foreground">
            Show raw data ({biomarkers?.length || 0} results)
            <ChevronDown className={`h-4 w-4 transition-transform ${showRawData ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="flex gap-2 mb-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {sortedCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="glass-card rounded-xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Biomarker</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {biomarkers
                  .filter((b: any) => {
                    if (categoryFilter === "all") return true;
                    const def = BIOMARKER_DEFINITIONS.find((d) => d.code === b.biomarkerCode);
                    return (def?.category || "Other") === categoryFilter;
                  })
                  .map((b: any) => {
                    const status = getValueStatus(b.value, b.refRangeLow, b.refRangeHigh);
                    const def = BIOMARKER_DEFINITIONS.find((d) => d.code === b.biomarkerCode);
                    return (
                      <TableRow key={b._id}>
                        <TableCell className="text-xs">{formatDate(b.measuredAt)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{def?.category || "Other"}</TableCell>
                        <TableCell className="font-medium text-sm">{b.biomarkerName}</TableCell>
                        <TableCell className={`font-medium ${STATUS_COLORS[status].text}`}>
                          {b.value} {b.unit}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {b.refRangeLow != null && b.refRangeHigh != null ? `${b.refRangeLow}\u2013${b.refRangeHigh}` : "\u2013"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {b.source === "auto" ? "Extracted" : "Manual"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="text-destructive h-7 text-xs" onClick={() => setDeleteTarget(b)}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Add Results Dialog */}
      <ResponsiveDialog open={addOpen} onOpenChange={setAddOpen}>
        <ResponsiveDialogContent className="max-w-2xl">
          <ResponsiveDialogHeader><ResponsiveDialogTitle>Add Biomarker Results</ResponsiveDialogTitle></ResponsiveDialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div><Label>Date Measured</Label><Input type="date" value={measuredAt} onChange={(e) => setMeasuredAt(e.target.value)} /></div>
            {BIOMARKER_CATEGORIES.map((cat: string) => {
              const markers = BIOMARKER_DEFINITIONS.filter((d: BiomarkerDefinition) => d.category === cat);
              return (
                <div key={cat}>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">{cat}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {markers.map((d: BiomarkerDefinition) => (
                      <div key={d.code} className="flex items-center gap-2">
                        <Label className="text-xs w-32 shrink-0">{d.name}</Label>
                        <Input type="number" step="any" placeholder={`${d.refRangeLow}-${d.refRangeHigh} ${d.unit}`}
                          value={batchValues[d.code] || ""}
                          onChange={(e) => setBatchValues({ ...batchValues, [d.code]: e.target.value })}
                          className="h-8 text-sm" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <ResponsiveDialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleBatchSave} disabled={saving}>{saving ? "Saving..." : "Save All"}</Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete biomarker result</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {deleteTarget?.biomarkerName} result from {deleteTarget?.measuredAt ? formatDate(deleteTarget.measuredAt) : ""}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Tab 5: Itinerary ────────────────────────────────────────────────

function ItineraryTab({ userId, patientId, itineraries, treatments }: {
  userId: string; patientId: string; itineraries: any; treatments: any;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState<string | null>(null);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [itinNotes, setItinNotes] = useState("");

  // Item form
  const [itemType, setItemType] = useState("treatment");
  const [itemTitle, setItemTitle] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemDate, setItemDate] = useState("");
  const [itemStartTime, setItemStartTime] = useState("");
  const [itemEndTime, setItemEndTime] = useState("");
  const [itemLocation, setItemLocation] = useState("");
  const [itemTreatmentId, setItemTreatmentId] = useState("");

  const createItinerary = useMutation(api.itineraries.create);
  const updateItinerary = useMutation(api.itineraries.update);
  const removeItinerary = useMutation(api.itineraries.remove);
  const createItem = useMutation(api.itineraryItems.create);
  const updateItem = useMutation(api.itineraryItems.update);
  const removeItem = useMutation(api.itineraryItems.remove);
  const { toast } = useToast();

  const items = useQuery(
    api.itineraryItems.listByItinerary,
    selectedItinerary
      ? { callerId: userId as Id<"users">, itineraryId: selectedItinerary as Id<"itineraries"> }
      : "skip"
  );

  const selectedItin = itineraries?.find((i: any) => i._id === selectedItinerary);

  const handleCreateItinerary = async () => {
    if (!title || !startDate || !endDate) return;
    setSaving(true);
    try {
      await createItinerary({
        callerId: userId as Id<"users">,
        patientId: patientId as Id<"patients">,
        title,
        startDate,
        endDate,
        notes: itinNotes || undefined,
      });
      toast({ title: "Itinerary created" });
      setCreateOpen(false);
      setTitle("");
      setStartDate("");
      setEndDate("");
      setItinNotes("");
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedItinerary || !itemTitle || !itemDate) return;
    const existingItems = items || [];
    const sameDateItems = existingItems.filter((i: any) => i.date === itemDate);
    setSaving(true);
    try {
      await createItem({
        callerId: userId as Id<"users">,
        itineraryId: selectedItinerary as Id<"itineraries">,
        type: itemType,
        title: itemTitle,
        description: itemDesc || undefined,
        date: itemDate,
        startTime: itemStartTime || undefined,
        endTime: itemEndTime || undefined,
        location: itemLocation || undefined,
        treatmentId: itemTreatmentId ? (itemTreatmentId as Id<"treatments">) : undefined,
        sortOrder: sameDateItems.length,
      });
      toast({ title: "Item added" });
      setAddItemOpen(false);
      setItemTitle("");
      setItemDesc("");
      setItemDate("");
      setItemStartTime("");
      setItemEndTime("");
      setItemLocation("");
      setItemTreatmentId("");
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleItemStatusChange = async (itemId: string, status: string) => {
    try {
      await updateItem({ callerId: userId as Id<"users">, itemId: itemId as Id<"itineraryItems">, status });
    } catch {
      toast({ variant: "destructive", title: "Update failed" });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await removeItem({ callerId: userId as Id<"users">, itemId: itemId as Id<"itineraryItems"> });
      toast({ title: "Item removed" });
    } catch {
      toast({ variant: "destructive", title: "Delete failed" });
    }
  };

  const handleItineraryStatusChange = async (itinId: string, status: string) => {
    try {
      await updateItinerary({ callerId: userId as Id<"users">, itineraryId: itinId as Id<"itineraries">, status });
      toast({ title: `Itinerary ${status}` });
    } catch {
      toast({ variant: "destructive", title: "Update failed" });
    }
  };

  // Group items by date
  const itemsByDate: Record<string, any[]> = {};
  items?.forEach((item: any) => {
    if (!itemsByDate[item.date]) itemsByDate[item.date] = [];
    itemsByDate[item.date].push(item);
  });
  const sortedDates = Object.keys(itemsByDate).sort();

  if (selectedItinerary && selectedItin) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedItinerary(null)}>&larr; Back</Button>
          <div>
            <h2 className="text-lg font-semibold">{selectedItin.title}</h2>
            <p className="text-sm text-muted-foreground">{formatDate(selectedItin.startDate)} - {formatDate(selectedItin.endDate)}</p>
          </div>
          <Badge className={itineraryStatusColors[selectedItin.status] || ""}>{selectedItin.status}</Badge>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {selectedItin.status === "draft" && (
              <Button variant="outline" size="sm" onClick={() => handleItineraryStatusChange(selectedItin._id, "confirmed")}>Confirm</Button>
            )}
            {selectedItin.status === "confirmed" && (
              <Button variant="outline" size="sm" onClick={() => handleItineraryStatusChange(selectedItin._id, "in-progress")}>Start</Button>
            )}
            {selectedItin.status === "in-progress" && (
              <Button variant="outline" size="sm" onClick={() => handleItineraryStatusChange(selectedItin._id, "completed")}>Complete</Button>
            )}
          </div>
          <Button onClick={() => { setItemDate(selectedItin.startDate); setAddItemOpen(true); }}>+ Add Item</Button>
        </div>

        {/* Timeline */}
        {sortedDates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground glass-card rounded-xl">
            <p>No items yet. Add items to build the itinerary.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((date) => (
              <div key={date} className="glass-card rounded-xl p-4">
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                  {new Date(date).toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </h3>
                <div className="space-y-2">
                  {itemsByDate[date].map((item: any) => (
                    <div key={item._id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-secondary text-foreground rounded-lg">
                      {ITEM_TYPE_ICONS[item.type] || <Plane className="h-5 w-5 text-muted-foreground" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{item.title}</p>
                          <Badge variant="outline" className="text-xs">{item.type}</Badge>
                          <Badge className={`text-xs ${
                            item.status === "confirmed" ? "bg-info/10 text-info border border-info/20" :
                            item.status === "completed" ? "bg-success/10 text-success border border-success/20" :
                            item.status === "cancelled" ? "bg-destructive/10 text-destructive border border-destructive/20" :
                            "bg-muted text-muted-foreground border border-border"
                          }`}>{item.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.startTime && `${item.startTime}`}
                          {item.endTime && ` - ${item.endTime}`}
                          {item.location && ` | ${item.location}`}
                        </p>
                        {item.description && <p className="text-xs text-muted-foreground/70 mt-1">{item.description}</p>}
                      </div>
                      <div className="flex gap-1">
                        {item.status === "pending" && (
                          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleItemStatusChange(item._id, "confirmed")}>Confirm</Button>
                        )}
                        {item.status === "confirmed" && (
                          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleItemStatusChange(item._id, "completed")}>Done</Button>
                        )}
                        <Button variant="outline" size="sm" className="text-xs h-7 text-destructive" onClick={() => handleDeleteItem(item._id)}>X</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Item Dialog */}
        <ResponsiveDialog open={addItemOpen} onOpenChange={setAddItemOpen}>
          <ResponsiveDialogContent>
            <ResponsiveDialogHeader><ResponsiveDialogTitle>Add Itinerary Item</ResponsiveDialogTitle></ResponsiveDialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Type</Label>
                <Select value={itemType} onValueChange={setItemType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ITEM_TYPE_ICONS).map(([type, icon]) => (
                      <SelectItem key={type} value={type}><span className="inline-flex items-center gap-2">{icon} {type.charAt(0).toUpperCase() + type.slice(1)}</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Title</Label><Input value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} /></div>
              <div><Label>Description</Label><Textarea value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} rows={2} /></div>
              <div><Label>Date</Label><Input type="date" value={itemDate} onChange={(e) => setItemDate(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Time</Label><Input type="time" value={itemStartTime} onChange={(e) => setItemStartTime(e.target.value)} /></div>
                <div><Label>End Time</Label><Input type="time" value={itemEndTime} onChange={(e) => setItemEndTime(e.target.value)} /></div>
              </div>
              <div><Label>Location</Label><Input value={itemLocation} onChange={(e) => setItemLocation(e.target.value)} placeholder="e.g. Klinik Celljevity" /></div>
              {itemType === "treatment" && treatments && treatments.length > 0 && (
                <div>
                  <Label>Link Treatment</Label>
                  <Select value={itemTreatmentId} onValueChange={setItemTreatmentId}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      {treatments.map((t: any) => (
                        <SelectItem key={t._id} value={t._id}>{t.serviceName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <ResponsiveDialogFooter>
              <Button variant="outline" onClick={() => setAddItemOpen(false)}>Cancel</Button>
              <Button onClick={handleAddItem} disabled={saving || !itemTitle || !itemDate}>{saving ? "Adding..." : "Add"}</Button>
            </ResponsiveDialogFooter>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </div>
    );
  }

  // Itinerary list view
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Travel & Visit Plans</h2>
        <Button onClick={() => setCreateOpen(true)}>+ New Itinerary</Button>
      </div>

      {!itineraries || itineraries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground glass-card rounded-xl">
          <p className="text-lg mb-2">No itineraries yet.</p>
          <p className="text-sm">Create a travel plan for this patient</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {itineraries.map((itin: any) => (
            <div
              key={itin._id}
              className="glass-card rounded-xl p-4 cursor-pointer hover:shadow-md transition"
              onClick={() => setSelectedItinerary(itin._id)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{itin.title}</h3>
                <Badge className={itineraryStatusColors[itin.status] || ""}>{itin.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(itin.startDate)} - {formatDate(itin.endDate)}
              </p>
              {itin.notes && <p className="text-sm text-muted-foreground/70 mt-2 truncate">{itin.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Create Itinerary Dialog */}
      <ResponsiveDialog open={createOpen} onOpenChange={setCreateOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader><ResponsiveDialogTitle>New Itinerary</ResponsiveDialogTitle></ResponsiveDialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Prometheus Protocol - April 2026" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
              <div><Label>End Date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={itinNotes} onChange={(e) => setItinNotes(e.target.value)} rows={3} /></div>
          </div>
          <ResponsiveDialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateItinerary} disabled={saving || !title || !startDate || !endDate}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}

// ─── Tab 6: Emails ──────────────────────────────────────────────────

function EmailsTab({ patient, emailLogs }: { patient: any; emailLogs: any }) {
  const isMobile = useIsMobile();
  if (emailLogs === undefined) {
    return (
      <div className="glass-card rounded-xl p-6 space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    sent: "bg-info/10 text-info border border-info/20",
    delivered: "bg-success/10 text-success border border-success/20",
    received: "bg-success/10 text-success border border-success/20",
    bounced: "bg-warning/10 text-warning border border-warning/20",
    failed: "bg-destructive/10 text-destructive border border-destructive/20",
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">E-Mail Verlauf</h2>
        {patient.agentmailAddress && (
          <Badge variant="outline" className="font-mono text-xs">
            {patient.agentmailAddress}
          </Badge>
        )}
      </div>

      {emailLogs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-2 opacity-50">&#x2709;</p>
          <p>Noch keine E-Mails</p>
        </div>
      ) : isMobile ? (
        <div className="space-y-4">
          {emailLogs.map((log: any) => (
            <div key={log._id} className="glass-card rounded-xl p-4">
              <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="font-medium text-foreground">{log.subject}</h3>
                <Badge variant="outline" className={`text-xs ${statusColors[log.status] ?? "bg-secondary"}`}>
                  {log.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mb-3 space-y-1">
                <p>
                  <span className="font-medium">{log.direction === "inbound" ? "From:" : "To:"}</span>{" "}
                  {log.direction === "inbound" ? log.from : log.to}
                </p>
                <p>{formatDate(log.createdAt)}</p>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  {log.direction === "inbound" ? "⬇️ Inbound" : "⬆️ Outbound"}
                </span>
                {log.hasAttachments && <span>📎 Attachment</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Betreff</TableHead>
              <TableHead>Von / An</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {emailLogs.map((log: any) => (
              <TableRow key={log._id}>
                <TableCell className="text-center text-lg">
                  {log.direction === "inbound" ? "⬇️" : "⬆️"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(log.createdAt)}
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {log.subject}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                  {log.direction === "inbound" ? log.from : log.to}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${statusColors[log.status] ?? "bg-secondary"}`}>
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {log.hasAttachments && "📎"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
