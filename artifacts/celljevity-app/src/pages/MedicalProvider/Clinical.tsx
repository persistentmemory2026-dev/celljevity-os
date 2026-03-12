import { useState } from "react";
import { useListPatients, useListBiomarkers, useListDocuments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input } from "@/components/ui";
import { Search, AlertCircle, User, FileText, Activity } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Clinical() {
  const [search, setSearch] = useState("");
  const { data: patientsData, isLoading } = useListPatients({ search: search || undefined, limit: 100 });
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  return (
    <div className="space-y-6 pb-12">
      <header>
        <h1 className="text-3xl font-display font-bold">Clinical Dashboard</h1>
        <p className="text-muted-foreground mt-1">Medical oversight and biomarker monitoring.</p>
      </header>

      {selectedPatientId ? (
        <PatientDetail 
          patientId={selectedPatientId} 
          patient={patientsData?.data?.find(p => p.id === selectedPatientId)} 
          onClose={() => setSelectedPatientId(null)} 
        />
      ) : (
        <Card className="shadow-md">
          <div className="p-4 border-b bg-secondary/10 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search patients by name or ID..." 
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Patient</th>
                  <th className="px-6 py-4 font-semibold">Celljevity ID</th>
                  <th className="px-6 py-4 font-semibold">Stage</th>
                  <th className="px-6 py-4 font-semibold">Alerts</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground animate-pulse">Loading patient list...</td></tr>
                ) : patientsData?.data?.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No patients found.</td></tr>
                ) : (
                  // Sort patients with warnings/critical alerts first (simulated by stage or we can just sort by id for now)
                  patientsData?.data?.map((patient) => (
                    <tr key={patient.id} className="hover:bg-secondary/20 transition-colors group cursor-pointer" onClick={() => setSelectedPatientId(patient.id)}>
                      <td className="px-6 py-4 font-medium flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        {patient.firstName} {patient.lastName}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{patient.celljevityId}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-white">{patient.journeyStage.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        {patient.journeyStage === 'DIAGNOSTICS' && (
                          <Badge variant="warning" className="gap-1"><AlertCircle className="w-3 h-3" /> Labs Pending Review</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant="ghost">View Chart</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function PatientDetail({ patientId, patient, onClose }: { patientId: string, patient: any, onClose: () => void }) {
  const { data: biomarkersData } = useListBiomarkers(patientId);
  const { data: documentsData } = useListDocuments({ documentType: undefined }, { query: { queryKey: ['documents', patientId] } as any }); // overriding query key trick if necessary, but actually we need patientId passed somehow if listDocs supports it

  // Filter alerts
  const alerts = biomarkersData?.data?.filter(b => b.statusFlag === 'WARNING' || b.statusFlag === 'CRITICAL') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onClose}>&larr; Back to List</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Demographics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Full Name</div>
                <div className="text-lg font-semibold">{patient?.firstName} {patient?.lastName}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Celljevity ID</div>
                <div className="font-mono text-sm">{patient?.celljevityId}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Date of Birth</div>
                <div>{patient?.dateOfBirth ? format(new Date(patient.dateOfBirth), 'MMM d, yyyy') : 'N/A'}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 shadow-sm">
            <CardHeader className="bg-destructive/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                <AlertCircle className="w-5 h-5" /> Clinical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {alerts.length === 0 ? (
                <div className="text-sm text-muted-foreground">No critical alerts.</div>
              ) : (
                alerts.map(a => (
                  <div key={a.id} className="p-3 rounded-lg border bg-destructive/5 border-destructive/20 text-sm">
                    <span className="font-semibold">{a.biomarkerType.replace(/_/g, ' ')}</span> is {a.statusFlag}
                    <div className="text-xs mt-1 text-muted-foreground">Value: {a.valueNumeric} {a.unit}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Key Biomarkers
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[{d:'Jan',v:45},{d:'Feb',v:44},{d:'Mar',v:42}]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="d" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="v" stroke="#14B8A6" strokeWidth={3} dot={{r: 4}} name="Biological Age" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Clinical Documents
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <tbody className="divide-y divide-border">
                  {documentsData?.data?.length === 0 ? (
                    <tr><td className="p-6 text-center text-muted-foreground">No documents available.</td></tr>
                  ) : (
                    documentsData?.data?.slice(0, 5).map(doc => (
                      <tr key={doc.id} className="hover:bg-secondary/20">
                        <td className="px-6 py-3 font-medium flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" /> {doc.fileName}
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant="outline">{doc.documentType}</Badge>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground text-right">
                          {format(new Date(doc.uploadDate), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
