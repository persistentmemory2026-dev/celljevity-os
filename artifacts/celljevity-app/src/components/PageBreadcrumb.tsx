import React from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { PageId, NavigationContext } from "../App";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface PageBreadcrumbProps {
  currentPage: PageId;
  navContext: NavigationContext;
  onNavigate: (page: PageId, ctx?: NavigationContext) => void;
  userId: string;
}

const PAGE_LABELS: Record<PageId, string> = {
  dashboard: "Home",
  patients: "Patients",
  "patient-detail": "Patient",
  services: "Services",
  quotes: "Quotes",
  "new-quote": "New Quote",
  documents: "Documents",
  "admin-users": "Users",
  "admin-services": "Services",
  "my-dashboard": "Home",
  "my-treatments": "Treatments",
  "my-biomarkers": "Biomarkers",
  "my-documents": "Documents",
  "my-itinerary": "Itinerary",
  "my-profile": "Profile",
};

const PATIENT_HOME_PAGES: PageId[] = ["my-dashboard", "my-treatments", "my-biomarkers", "my-documents", "my-itinerary", "my-profile"];

export function PageBreadcrumb({ currentPage, navContext, onNavigate, userId }: PageBreadcrumbProps) {
  const patient = useQuery(
    api.patients.get,
    currentPage === "patient-detail" && navContext.patientId
      ? { patientId: navContext.patientId as Id<"patients">, callerId: userId as Id<"users"> }
      : "skip"
  );

  if (currentPage === "dashboard" || currentPage === "my-dashboard") return null;

  const crumbs: Array<{ label: string; page?: PageId; ctx?: NavigationContext }> = [];

  // Patient pages use "Home" as root
  if (PATIENT_HOME_PAGES.includes(currentPage)) {
    crumbs.push({ label: "Home", page: "my-dashboard" });
    crumbs.push({ label: PAGE_LABELS[currentPage] });
  } else {
    crumbs.push({ label: "Home", page: "dashboard" });

    switch (currentPage) {
      case "patient-detail":
        crumbs.push({ label: "Patients", page: "patients" });
        crumbs.push({
          label: patient ? `${patient.firstName} ${patient.lastName}` : "...",
        });
        break;
      case "new-quote":
        crumbs.push({ label: "Quotes", page: "quotes" });
        crumbs.push({ label: "New Quote" });
        break;
      case "admin-users":
      case "admin-services":
        crumbs.push({ label: "Admin" });
        crumbs.push({ label: PAGE_LABELS[currentPage] });
        break;
      default:
        crumbs.push({ label: PAGE_LABELS[currentPage] });
        break;
    }
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <React.Fragment key={i}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast || !crumb.page ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    className="cursor-pointer"
                    onClick={() => onNavigate(crumb.page!, crumb.ctx)}
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
