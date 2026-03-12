import { useState } from "react";
import { useListPatients, JourneyStage } from "@workspace/api-client-react";
import { Card, CardContent, Badge, Input, Button } from "@/components/ui";
import { Search, Filter, MoreHorizontal, UserPlus } from "lucide-react";
import { Link } from "wouter";

export default function CRM() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<JourneyStage | "">("");

  const { data: patientsList, isLoading } = useListPatients({ 
    search: search || undefined,
    stage: stageFilter as JourneyStage || undefined
  });

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Patient CRM</h1>
          <p className="text-muted-foreground mt-1">Manage pipeline and active patients</p>
        </div>
        <Link href="/leads">
          <Button className="bg-primary hover:bg-primary/90">
            <UserPlus className="w-4 h-4 mr-2" /> View Leads
          </Button>
        </Link>
      </header>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Patients", value: patientsList?.total || 0, color: "text-foreground" },
          { label: "In Intake", value: patientsList?.data?.filter(p => p.journeyStage === 'INTAKE').length || 0, color: "text-amber-600" },
          { label: "In Treatment", value: patientsList?.data?.filter(p => p.journeyStage === 'TREATMENT').length || 0, color: "text-emerald-600" },
          { label: "Follow-up", value: patientsList?.data?.filter(p => p.journeyStage === 'FOLLOW_UP').length || 0, color: "text-blue-600" },
        ].map(stat => (
          <Card key={stat.label} className="shadow-sm">
            <CardContent className="p-4 flex flex-col justify-center">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <span className={`text-2xl font-bold font-display ${stat.color}`}>{stat.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or ID..." 
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="h-10 rounded-xl border border-input bg-white px-3 text-sm focus:ring-2 focus:ring-primary/20"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as JourneyStage)}
        >
          <option value="">All Stages</option>
          <option value="ACQUISITION">Acquisition</option>
          <option value="INTAKE">Intake</option>
          <option value="DIAGNOSTICS">Diagnostics</option>
          <option value="PLANNING">Planning</option>
          <option value="TREATMENT">Treatment</option>
          <option value="FOLLOW_UP">Follow-up</option>
        </select>
      </div>

      {/* Table */}
      <Card className="shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold">Celljevity ID</th>
                <th className="px-6 py-4 font-semibold">Stage</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading CRM data...</td></tr>
              ) : patientsList?.data?.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No patients found.</td></tr>
              ) : (
                patientsList?.data?.map((patient) => (
                  <tr key={patient.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{patient.firstName} {patient.lastName}</div>
                      <div className="text-xs text-muted-foreground">{patient.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{patient.celljevityId}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-white">
                        {patient.journeyStage}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{patient.phone || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
