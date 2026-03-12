import { useAuth } from "@/hooks/use-auth";
import { useGetMyProfile, useListBiomarkers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";

const mockAgeData = [
  { date: '2023-01', biological: 45, chronological: 45 },
  { date: '2023-06', biological: 44, chronological: 45.5 },
  { date: '2024-01', biological: 42, chronological: 46 },
];

export default function Biomarkers() {
  const { data: profile } = useGetMyProfile();
  const { data: biomarkersList, isLoading } = useListBiomarkers(profile?.id || "", {}, {
    query: { enabled: !!profile?.id }
  });

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-display font-bold">Biomarker Trends</h1>
        <p className="text-muted-foreground mt-1">Track your biological performance over time.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Biological Age Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Biological vs Chronological Age</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockAgeData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="biological" stroke="#14B8A6" strokeWidth={3} dot={{r: 4}} name="Biological Age" />
                  <Line type="step" dataKey="chronological" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Chronological Age" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Telomere Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Telomere Length (kb)</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-[300px] w-full mt-4 relative">
                {/* Background color zones */}
                <div className="absolute inset-0 z-0 flex flex-col opacity-10">
                  <div className="flex-1 bg-green-500"></div>
                  <div className="flex-1 bg-yellow-500"></div>
                  <div className="flex-1 bg-orange-500"></div>
                  <div className="flex-1 bg-red-500"></div>
                </div>
                <div className="relative z-10 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[{d:'Q1', v:6.8}, {d:'Q2', v:7.0}, {d:'Q3', v:7.2}]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <XAxis dataKey="d" tick={{fontSize: 12}} />
                      <YAxis domain={[5, 9]} tick={{fontSize: 12}} />
                      <Tooltip />
                      <Line type="monotone" dataKey="v" stroke="#0f172a" strokeWidth={3} dot={{fill: '#0f172a', r: 5}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Lab Overview Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Lab Overview</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl">Biomarker</th>
                <th className="px-6 py-4">Latest Value</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 rounded-tr-xl">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Loading labs...</td></tr>
              ) : biomarkersList?.data?.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No biomarker results available yet.</td></tr>
              ) : (
                biomarkersList?.data?.map((b) => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-medium">{b.biomarkerType.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4 font-bold font-mono">{b.valueNumeric} <span className="text-muted-foreground text-xs font-sans">{b.unit}</span></td>
                    <td className="px-6 py-4">
                      <Badge variant={b.statusFlag === 'OPTIMAL' ? 'success' : b.statusFlag === 'WARNING' ? 'warning' : b.statusFlag === 'CRITICAL' ? 'destructive' : 'default'}>
                        {b.statusFlag}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{format(new Date(b.testDate), 'MMM d, yyyy')}</td>
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
