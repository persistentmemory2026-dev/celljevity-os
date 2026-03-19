import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Phone, MapPin, Shield, Globe } from "lucide-react";

interface MyProfileProps {
  userId: string;
}

export function MyProfile({ userId }: MyProfileProps) {
  const patient = useQuery(api.patients.getMyProfile, { callerId: userId as Id<"users"> });

  if (patient === undefined) {
    return (
      <div className="px-5 md:px-8 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const fields: Array<{ icon: React.ElementType; label: string; value: string | null | undefined }> = [
    { icon: User, label: "Full Name", value: `${patient.firstName} ${patient.lastName}` },
    { icon: Mail, label: "Email", value: patient.email },
    { icon: Phone, label: "Phone", value: patient.phone },
    { icon: User, label: "Date of Birth", value: patient.dateOfBirth },
    { icon: User, label: "Gender", value: patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : null },
    { icon: Globe, label: "Language", value: patient.language?.toUpperCase() },
    { icon: Shield, label: "Insurance Number", value: patient.insuranceNumber },
  ];

  const hasAddress = patient.street || patient.city || patient.postalCode || patient.country;

  return (
    <div className="px-5 md:px-8 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

      {/* Avatar + name header */}
      <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
          {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">{patient.firstName} {patient.lastName}</p>
          <p className="text-sm text-muted-foreground">{patient.email ?? "No email"}</p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
            patient.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
          }`}>
            {patient.status}
          </span>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold text-foreground mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((f, i) => (
            f.value ? (
              <div key={i} className="flex items-start gap-3">
                <f.icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <p className="text-sm text-foreground">{f.value}</p>
                </div>
              </div>
            ) : null
          ))}
        </div>
      </div>

      {/* Address */}
      {hasAddress && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Address</h2>
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-sm text-foreground">
              {patient.street && <p>{patient.street}</p>}
              <p>
                {[patient.postalCode, patient.city].filter(Boolean).join(" ")}
              </p>
              {patient.country && <p>{patient.country}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {patient.notes && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-2">Notes</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{patient.notes}</p>
        </div>
      )}
    </div>
  );
}
