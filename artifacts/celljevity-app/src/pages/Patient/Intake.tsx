import { useState, useEffect, useCallback } from "react";
import { 
  useGetMyProfile, 
  useGetIntakeForm, 
  useCreateIntakeForm, 
  useUpdateIntakeForm, 
  useCompleteIntakeForm,
  useGrantConsent,
  useUploadDocument,
  useUploadDocumentContent,
  ConsentType
} from "@workspace/api-client-react";
import { Card, CardContent, Button, Input, Label, Badge } from "@/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useDropzone } from "react-dropzone";
import { CheckCircle2, ArrowRight, ArrowLeft, UploadCloud, X, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ProfileData {
  dateOfBirth: string;
  phone: string;
  address: string;
  [key: string]: unknown;
}

interface HistoryData {
  allergies: string;
  medications: string;
  conditions: string;
  familyHistory: string;
  [key: string]: unknown;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const STEPS = ["personalProfile", "medicalHistory", "documentUpload", "consentSignature"];

export default function Intake() {
  const { t } = useTranslation();
  const { data: profile } = useGetMyProfile();
  const { data: intakeForm, refetch: refetchIntake } = useGetIntakeForm(profile?.id || "", {
    query: { enabled: !!profile?.id }
  });

  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const createIntake = useCreateIntakeForm();
  const updateIntake = useUpdateIntakeForm();
  const completeIntake = useCompleteIntakeForm();
  const grantConsent = useGrantConsent();
  const uploadDocMetadata = useUploadDocument();
  const uploadDocContent = useUploadDocumentContent();

  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [conditions, setConditions] = useState("");
  const [familyHistory, setFamilyHistory] = useState("");

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [consents, setConsents] = useState({
    DATA_PROCESSING: false,
    MEDICAL_DATA_SHARING: false,
    TERMS_AND_CONDITIONS: false,
    MARKETING: false,
    TREATMENT_CONSENT: false,
  });

  const [signature, setSignature] = useState("");

  useEffect(() => {
    if (intakeForm) {
      if (intakeForm.personalProfile) {
        const pp = intakeForm.personalProfile as ProfileData;
        setDob(pp.dateOfBirth || "");
        setPhone(pp.phone || "");
        setAddress(pp.address || "");
      }
      if (intakeForm.medicalHistory) {
        const mh = intakeForm.medicalHistory as HistoryData;
        setAllergies(mh.allergies || "");
        setMedications(mh.medications || "");
        setConditions(mh.conditions || "");
        setFamilyHistory(mh.familyHistory || "");
      }
      if (intakeForm.isComplete) {
        setCurrentStep(STEPS.length);
      }
    }
  }, [intakeForm]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(f => {
      if (f.size > MAX_FILE_SIZE) {
        toast({ title: t("documents.fileTooLarge"), description: t("documents.fileTooLargeDesc"), variant: "destructive" });
        return false;
      }
      return true;
    });
    setUploadedFiles(prev => [...prev, ...validFiles]);
  }, [toast, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_FILE_SIZE,
    multiple: true
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    try {
      if (currentStep === 0 && !dob) {
        toast({ title: t("intake.dobRequired"), description: t("intake.dobRequiredDesc"), variant: "destructive" });
        return;
      }

      if (!intakeForm && currentStep === 0) {
        await createIntake.mutateAsync({
          data: {
            personalProfile: { dateOfBirth: dob, phone, address }
          }
        });
        refetchIntake();
      } else if (intakeForm) {
        const updates: Record<string, unknown> = {};
        if (currentStep === 0) updates.personalProfile = { dateOfBirth: dob, phone, address };
        if (currentStep === 1) updates.medicalHistory = { allergies, medications, conditions, familyHistory };
        
        if (Object.keys(updates).length > 0) {
          await updateIntake.mutateAsync({
            id: intakeForm.id,
            data: updates
          });
        }
      }

      if (currentStep === 2 && uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          try {
            const metaRes = await uploadDocMetadata.mutateAsync({
              data: {
                documentType: "OTHER",
                fileName: file.name,
                mimeType: file.type,
                fileSize: file.size
              }
            });
            if (metaRes.uploadToken) {
              await uploadDocContent.mutateAsync({
                token: metaRes.uploadToken,
                data: file as unknown as Blob
              });
            }
          } catch {
            toast({ title: t("documents.uploadFailed"), description: file.name, variant: "destructive" });
          }
        }
      }

      if (currentStep === STEPS.length - 1) {
        if (!consents.DATA_PROCESSING || !consents.MEDICAL_DATA_SHARING || !consents.TERMS_AND_CONDITIONS || !consents.TREATMENT_CONSENT) {
          return toast({ title: t("intake.requiredConsents"), description: t("intake.requiredConsentsDesc"), variant: "destructive" });
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
        toast({ title: t("intake.intakeCompleted"), description: t("intake.intakeCompletedDesc") });
      }

      setCurrentStep(s => Math.min(s + 1, STEPS.length));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save progress";
      toast({ title: t("common.error"), description: message, variant: "destructive" });
    }
  };

  if (currentStep === STEPS.length || intakeForm?.isComplete) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto" />
        <h1 className="text-3xl font-display font-bold">{t("intake.completeTitle")}</h1>
        <p className="text-muted-foreground">{t("intake.completeDesc")}</p>
        <Button onClick={() => navigate("/dashboard")}>{t("intake.returnToDashboard")}</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-display font-bold">{t("intake.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("intake.description")}</p>
      </header>

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
              <span className={`text-xs font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                {t(`intake.steps.${step}`)}
              </span>
            </div>
          );
        })}
      </div>

      <Card className="shadow-md">
        <CardContent className="p-8">
          {currentStep === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{t("intake.steps.personalProfile")}</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("intake.dateOfBirth")}</Label>
                  <Input type="date" value={dob} onChange={e => setDob(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("intake.phoneNumber")}</Label>
                  <Input placeholder={t("intake.phonePlaceholder")} value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("intake.addressLabel")}</Label>
                  <Textarea placeholder={t("intake.addressPlaceholder")} value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{t("intake.steps.medicalHistory")}</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("intake.allergies")}</Label>
                  <Textarea placeholder={t("intake.allergiesPlaceholder")} value={allergies} onChange={e => setAllergies(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("intake.medications")}</Label>
                  <Textarea placeholder={t("intake.medicationsPlaceholder")} value={medications} onChange={e => setMedications(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("intake.conditions")}</Label>
                  <Textarea placeholder={t("intake.conditionsPlaceholder")} value={conditions} onChange={e => setConditions(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("intake.familyHistory")}</Label>
                  <Textarea placeholder={t("intake.familyHistoryPlaceholder")} value={familyHistory} onChange={e => setFamilyHistory(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{t("intake.uploadDocs")}</h2>
              <p className="text-sm text-muted-foreground">{t("intake.uploadDocsDesc")}</p>

              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                  isDragActive ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"
                )}
              >
                <input {...getInputProps()} />
                <UploadCloud className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-medium">{t("documents.dragDrop")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("documents.fileLimit")}</p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/20">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <Badge variant="outline" className="text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFile(idx)} className="text-destructive hover:text-destructive/80">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{t("intake.consentPrivacy")}</h2>
              <p className="text-sm text-muted-foreground">{t("intake.consentDesc")}</p>
              
              <div className="space-y-4">
                {[
                  { id: 'DATA_PROCESSING', label: t("intake.dataProcessing"), desc: t("intake.dataProcessingDesc") },
                  { id: 'MEDICAL_DATA_SHARING', label: t("intake.medicalSharing"), desc: t("intake.medicalSharingDesc") },
                  { id: 'TERMS_AND_CONDITIONS', label: t("intake.termsConditions"), desc: t("intake.termsConditionsDesc") },
                  { id: 'TREATMENT_CONSENT', label: t("intake.treatmentConsent"), desc: t("intake.treatmentConsentDesc") },
                  { id: 'MARKETING', label: t("intake.marketing"), desc: t("intake.marketingDesc") }
                ].map((c) => (
                  <div key={c.id} className="flex items-start space-x-3 rtl:space-x-reverse p-4 rounded-xl border bg-secondary/20">
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

              <div className="bg-secondary/30 p-6 rounded-xl border mt-6">
                <Label>{t("intake.typeNameToSign")}</Label>
                <Input className="mt-2 text-lg font-signature" value={signature} onChange={e => setSignature(e.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
        <div className="p-6 border-t bg-secondary/10 flex justify-between rounded-b-2xl">
          <Button variant="outline" onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0}>
            <ArrowLeft className="w-4 h-4 ltr:mr-2 rtl:ml-2" /> {t("common.back")}
          </Button>
          <Button 
            onClick={handleNext}
            disabled={currentStep === STEPS.length - 1 && (!consents.DATA_PROCESSING || !consents.MEDICAL_DATA_SHARING || !consents.TERMS_AND_CONDITIONS || !consents.TREATMENT_CONSENT || !signature.trim())}
          >
            {currentStep === STEPS.length - 1 ? t("intake.submitIntake") : t("intake.continue")} <ArrowRight className="w-4 h-4 ltr:ml-2 rtl:mr-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
