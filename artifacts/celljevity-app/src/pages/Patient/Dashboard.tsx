import { useAuth } from "@/hooks/use-auth";
import { useGetMyProfile, useListBiomarkers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import { motion } from "framer-motion";
import { Activity, ArrowRight, CheckCircle2, Circle, AlertCircle, FileText, Calendar } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const STAGES = ["ACQUISITION", "INTAKE", "DIAGNOSTICS", "PLANNING", "TREATMENT", "FOLLOW_UP"];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useGetMyProfile();
  
  // Fetch latest biomarkers for quick view
  const { data: biomarkersData } = useListBiomarkers(profile?.id || "", { limit: 5 }, { 
    query: { enabled: !!profile?.id } 
  });

  if (isLoading || !profile) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading portal...</div>;

  const currentStageIdx = STAGES.indexOf(profile.journeyStage);

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground">Welcome back, {user?.firstName}</h1>
        <p className="text-muted-foreground mt-1">Here is the latest on your longevity journey.</p>
      </header>

      {/* Journey Timeline */}
      <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            My Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative py-8">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-secondary rounded-full" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${(currentStageIdx / (STAGES.length - 1)) * 100}%` }}
            />
            
            <div className="relative flex justify-between">
              {STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                
                return (
                  <div key={stage} className="flex flex-col items-center gap-3 w-24">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 shadow-sm transition-all duration-300",
                      isCompleted ? "border-accent text-accent" : 
                      isCurrent ? "border-primary bg-primary text-primary-foreground shadow-md scale-110" : 
                      "border-muted-foreground/30 text-muted-foreground"
                    )}>
                      {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : 
                       isCurrent ? <Circle className="w-4 h-4 fill-current" /> : 
                       <span className="text-sm font-bold">{idx + 1}</span>}
                    </div>
                    <span className={cn(
                      "text-xs font-semibold text-center uppercase tracking-wider",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}>
                      {stage.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Longevity Loop Indicator */}
            {profile.journeyStage === "FOLLOW_UP" && (
              <div className="absolute -bottom-6 right-8 flex items-center gap-2 text-accent text-sm font-medium animate-bounce">
                <ArrowRight className="w-4 h-4" /> Ready for next cycle
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Action Items */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-destructive/20 shadow-md">
            <CardHeader className="bg-destructive/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Action Items
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {profile.journeyStage === "INTAKE" && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
                  <FileText className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Complete Intake Form</h4>
                    <p className="text-xs text-muted-foreground mt-1">Required before diagnostics can begin.</p>
                    <Link href="/intake">
                      <Button variant="link" className="px-0 h-auto text-xs mt-2">Start Wizard &rarr;</Button>
                    </Link>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Initial Consultation</h4>
                  <p className="text-xs text-muted-foreground mt-1">Pending scheduling with Care Coordinator.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick View Biomarkers */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-semibold">Key Biomarkers</h3>
            <Link href="/biomarkers">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Biomarker quick-view cards */}
            <motion.div whileHover={{ y: -4 }}>
              <Card className="shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Biological Age</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-display font-bold">42</span>
                      <span className="text-sm text-muted-foreground">years</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge variant="success" className="mb-2">OPTIMAL</Badge>
                    <span className="text-xs text-emerald-600 font-medium">↓ -2.5 yrs vs chrono</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -4 }}>
              <Card className="shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Telomere Length</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-display font-bold">7.2</span>
                      <span className="text-sm text-muted-foreground">kb</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge variant="warning" className="mb-2">WARNING</Badge>
                    <span className="text-xs text-amber-600 font-medium">↓ -0.1 since last</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
