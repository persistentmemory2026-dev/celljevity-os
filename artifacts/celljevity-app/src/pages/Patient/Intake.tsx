import { useState, useEffect } from "react";
import { 
  useGetMyProfile, 
  useGetIntakeForm, 
  useCreateIntakeForm, 
  useUpdateIntakeForm, 
  useCompleteIntakeForm,
  useGrantConsent,
  ConsentType
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from "@/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

const STEPS = ["Personal Profile", "Medical History", "Consents", "Signature"];

export default function Intake() {
  const { data: profile } = useGetMyProfile();
  const { data: intakeForm, refetch: refetchIntake } = useGetIntakeForm(profile?.id || "", {
    query: { enabled: !!profile?.id }
  });

  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const createIntake = useCreateIntakeForm();
  const updateIntake = useUpdateIntakeForm();
  const completeIntake = useCompleteIntakeForm();
  const grantConsent = useGrantConsent();

  // Step 1: Personal Profile
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Step 2: Medical History
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [conditions, setConditions] = useState("");
  const [familyHistory, setFamilyHistory] = useState("");

  // Step 3: Consents
  const [consents, setConsents] = useState({
    DATA_PROCESSING: false,
    MEDICAL_DATA_SHARING: false,
    TERMS_AND_CONDITIONS: false,
    MARKETING: false,
    TREATMENT_CONSENT: false,
  });

  useEffect(() => {
    if (intakeForm) {
      if (intakeForm.personalProfile) {
        setDob((intakeForm.personalProfile as any).dateOfBirth || "");
        setPhone((intakeForm.personalProfile as any).phone || "");
        setAddress((intakeForm.personalProfile as any).address || "");
      }
      if (intakeForm.medicalHistory) {
        setAllergies((intakeForm.medicalHistory as any).allergies || "");
        setMedications((intakeForm.medicalHistory as any).medications || "");
        setConditions((intakeForm.medicalHistory as any).conditions || "");
        setFamilyHistory((intakeForm.medicalHistory as any).familyHistory || "");
      }
      if (intakeForm.isComplete) {
        setCurrentStep(4); // Finished
      }
    }
  }, [intakeForm]);

  const handleNext = async () => {
    try {
      if (!intakeForm && currentStep === 0) {
        // Create
        await createIntake.mutateAsync({
          data: {
            personalProfile: { dateOfBirth: dob, phone, address }
          }
        });
        refetchIntake();
      } else if (intakeForm) {
        // Update
        const updates: any = {};
        if (currentStep === 0) updates.personalProfile = { dateOfBirth: dob, phone, address };
        if (currentStep === 1) updates.medicalHistory = { allergies, medications, conditions, familyHistory };
        
        if (Object.keys(updates).length > 0) {
          await updateIntake.mutateAsync({
            id: intakeForm.id,
            data: updates
          });
        }
      }

      if (currentStep === STEPS.length - 1) {
        // Submit all consents
        if (!consents.DATA_PROCESSING || !consents.MEDICAL_DATA_SHARING || !consents.TERMS_AND_CONDITIONS || !consents.TREATMENT_CONSENT) {
          return toast({ title: "Required Consents", description: "Please accept all required consents.", variant: "destructive" });
        }

        const consentTypes = [
          { type: ConsentType.DATA_PROCESSING, granted: consents.DATA_PROCESSING },
          { type: ConsentType.MEDICAL_DATA_SHARING, granted: consents.MEDICAL_DATA_SHARING },
          { type: ConsentType.TERMS_AND_CONDITIONS, granted: consents.TERMS_AND_CONDITIONS },
          { type: ConsentType.TREATMENT_CONSENT, granted: consents.TREATMENT_CONSENT },
          { type: ConsentType.MARKETING_COMMUNICATIONS, granted: consents.MARKETING },
        ];

        for (const c of consentTypes) {
          await grantConsent.mutateAsync({
            data: {
              consentType: c.type,
              granted: c.granted
            }
          });
        }

        if (intakeForm) {
          await completeIntake.mutateAsync({ id: intakeForm.id });
        }
        toast({ title: "Intake Completed", description: "Your profile has been submitted." });
      }

      setCurrentStep(s => Math.min(s + 1, STEPS.length));
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save progress", variant: "destructive" });
    }
  };

  if (currentStep === STEPS.length || intakeForm?.isComplete) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto" />
        <h1 className="text-3xl font-display font-bold">Intake Complete</h1>
        <p className="text-muted-foreground">Thank you for completing your intake forms. Our clinical team will review your information.</p>
        <Button onClick={() => setLocation("/dashboard")}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-display font-bold">Patient Intake Wizard</h1>
        <p className="text-muted-foreground mt-1">Please complete your profile so we can personalize your journey.</p>
      </header>

      {/* Stepper */}
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-secondary rounded-full -z-10" />
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          return (
            <div key={step} className="flex flex-col items-center gap-2 bg-background px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : isCurrent ? 'border-primary text-primary' : 'border-muted-foreground/30 text-muted-foreground'}`}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span>{idx + 1}</span>}
              </div>
              <span className={`text-xs font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>{step}</span>
            </div>
          );
        })}
      </div>

      <Card className="shadow-md">
        <CardContent className="p-8">
          {currentStep === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Personal Profile</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" value={dob} onChange={e => setDob(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea placeholder="123 Main St..." value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Medical History</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Allergies</Label>
                  <Textarea placeholder="List any allergies..." value={allergies} onChange={e => setAllergies(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Current Medications</Label>
                  <Textarea placeholder="List medications and dosages..." value={medications} onChange={e => setMedications(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Medical Conditions</Label>
                  <Textarea placeholder="Any chronic or past conditions..." value={conditions} onChange={e => setConditions(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Family History</Label>
                  <Textarea placeholder="Relevant family medical history..." value={familyHistory} onChange={e => setFamilyHistory(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Consent & Privacy</h2>
              <p className="text-sm text-muted-foreground">Please review and accept our privacy practices.</p>
              
              <div className="space-y-4">
                {[
                  { id: 'DATA_PROCESSING', label: 'Data Processing Consent (Required)', desc: 'I consent to the processing of my personal data for healthcare services.' },
                  { id: 'MEDICAL_DATA_SHARING', label: 'Medical Data Sharing (Required)', desc: 'I agree to share my medical data with assigned clinical providers.' },
                  { id: 'TERMS_AND_CONDITIONS', label: 'Terms and Conditions (Required)', desc: 'I accept the Celljevity Terms of Service.' },
                  { id: 'TREATMENT_CONSENT', label: 'Treatment Consent (Required)', desc: 'I consent to undergo diagnostic and therapeutic procedures.' },
                  { id: 'MARKETING', label: 'Marketing Communications (Optional)', desc: 'I would like to receive updates on longevity research and offerings.' }
                ].map((c) => (
                  <div key={c.id} className="flex items-start space-x-3 p-4 rounded-xl border bg-secondary/20">
                    <Checkbox 
                      id={c.id} 
                      checked={consents[c.id as keyof typeof consents]} 
                      onCheckedChange={(val) => setConsents({...consents, [c.id]: !!val})} 
                    />
                    <div className="space-y-1 leading-none">
                      <label htmlFor={c.id} className="font-medium cursor-pointer">{c.label}</label>
                      <p className="text-sm text-muted-foreground">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 text-center py-8">
              <h2 className="text-xl font-semibold">Final Review & Signature</h2>
              <p className="text-muted-foreground">By submitting this intake, you confirm that all provided information is accurate to the best of your knowledge.</p>
              <div className="bg-secondary/30 p-6 rounded-xl border mt-6 text-left">
                <Label>Type your full name to sign</Label>
                <Input className="mt-2 text-lg font-signature" placeholder="John Doe" />
              </div>
            </div>
          )}
        </CardContent>
        <div className="p-6 border-t bg-secondary/10 flex justify-between rounded-b-2xl">
          <Button variant="outline" onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button onClick={handleNext}>
            {currentStep === STEPS.length - 1 ? 'Submit Intake' : 'Continue'} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
