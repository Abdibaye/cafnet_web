export type BusinessReportReason =
  | "WRONG_HOURS"
  | "WRONG_PHONE"
  | "WRONG_LOCATION"
  | "WRONG_INFORMATION"
  | "CLOSED"
  | "DUPLICATE"
  | "OTHER";

export type BusinessReportStatus = "PENDING" | "DISMISSED" | "ACTIONED";

export type BusinessReport = {
  id: string;
  businessId: number;
  businessName: string;
  reporterId: string;
  reporterName?: string;
  reason: BusinessReportReason;
  details?: string;
  status: BusinessReportStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
};

export type BusinessReportReasonOption = {
  value: BusinessReportReason;
  label: string;
  icon: string;
  description: string;
};

export const BUSINESS_REPORT_REASONS: BusinessReportReasonOption[] = [
  {
    value: "WRONG_HOURS",
    label: "Wrong opening hours",
    icon: "schedule",
    description: "Business hours listed on the profile do not match reality.",
  },
  {
    value: "WRONG_PHONE",
    label: "Wrong phone number",
    icon: "phone",
    description: "Phone number is invalid, disconnected, or incorrect.",
  },
  {
    value: "WRONG_LOCATION",
    label: "Wrong location",
    icon: "location_on",
    description: "The address, neighborhood, or map location is incorrect.",
  },
  {
    value: "WRONG_INFORMATION",
    label: "Wrong business information",
    icon: "info",
    description: "Cuisine, price range, name, or amenities are incorrect.",
  },
  {
    value: "CLOSED",
    label: "Business appears permanently closed",
    icon: "storefront",
    description: "The venue has ceased operations or shut down.",
  },
  {
    value: "DUPLICATE",
    label: "Duplicate business",
    icon: "content_copy",
    description: "This business is listed more than once on Cafnet.",
  },
  {
    value: "OTHER",
    label: "Other",
    icon: "help_outline",
    description: "Other information accuracy issues with this listing.",
  },
];

export function getReportReasonLabel(reason: BusinessReportReason): string {
  const match = BUSINESS_REPORT_REASONS.find((r) => r.value === reason);
  return match ? match.label : reason;
}

export function getReportReasonIcon(reason: BusinessReportReason): string {
  const match = BUSINESS_REPORT_REASONS.find((r) => r.value === reason);
  return match ? match.icon : "flag";
}

const storageKey = "cafnet.mock-business-reports";

export const mockSeedBusinessReports: BusinessReport[] = [
  {
    id: "breport-101",
    businessId: 1,
    businessName: "Bole Lounge & Restaurant",
    reporterId: "mock-customer-samuel",
    reporterName: "Samuel K.",
    reason: "WRONG_HOURS",
    details: "They close at 11:00 PM on weekdays, not midnight as shown on the profile.",
    status: "PENDING",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
  },
  {
    id: "breport-102",
    businessId: 2,
    businessName: "Tomoca Coffee",
    reporterId: "mock-customer-helen",
    reporterName: "Helen M.",
    reason: "WRONG_PHONE",
    details: "The phone number listed is missing digits or unreachable.",
    status: "PENDING",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
  },
  {
    id: "breport-103",
    businessId: 3,
    businessName: "Kategna Traditional Restaurant",
    reporterId: "mock-customer-abdi",
    reporterName: "Abdi",
    reason: "WRONG_LOCATION",
    details: "The restaurant moved to Cameroon Street, near Edna Mall.",
    status: "ACTIONED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    reviewedBy: "Cafnet Administrator",
    adminNotes: "Updated location and verified address with management.",
  },
  {
    id: "breport-104",
    businessId: 4,
    businessName: "Entoto Tea Room",
    reporterId: "mock-customer-yonas",
    reporterName: "Yonas T.",
    reason: "CLOSED",
    details: "I walked by yesterday and the doors were locked.",
    status: "DISMISSED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    reviewedBy: "Cafnet Administrator",
    adminNotes: "Confirmed venue was only closed temporarily for national holiday.",
  },
];

const memoryFallbackReports: BusinessReport[] = [...mockSeedBusinessReports];

export function loadBusinessReports(): BusinessReport[] {
  if (typeof window === "undefined") return memoryFallbackReports;
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      window.localStorage.setItem(storageKey, JSON.stringify(mockSeedBusinessReports));
      return [...mockSeedBusinessReports];
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((r): r is BusinessReport =>
      Boolean(
        r &&
          typeof r === "object" &&
          typeof r.id === "string" &&
          typeof r.businessId === "number" &&
          typeof r.reporterId === "string" &&
          (r.status === "PENDING" || r.status === "DISMISSED" || r.status === "ACTIONED")
      )
    );
  } catch {
    return [];
  }
}

export function saveBusinessReports(reports: BusinessReport[]): void {
  if (typeof window === "undefined") {
    memoryFallbackReports.length = 0;
    memoryFallbackReports.push(...reports);
    return;
  }
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(reports));
    window.dispatchEvent(new CustomEvent("cafnet:business-reports-updated"));
  } catch {
    // Ignore storage write failures
  }
}

export function getBusinessReports(filter?: {
  status?: BusinessReportStatus;
  businessId?: number;
}): BusinessReport[] {
  const all = loadBusinessReports();
  return all
    .filter((r) => {
      if (filter?.status && r.status !== filter.status) return false;
      if (filter?.businessId && r.businessId !== filter.businessId) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getBusinessReportById(id: string): BusinessReport | undefined {
  const all = loadBusinessReports();
  return all.find((r) => r.id === id);
}

export function getPendingBusinessReportsCount(): number {
  const all = loadBusinessReports();
  return all.filter((r) => r.status === "PENDING").length;
}

export function hasPendingReport(businessId: number, reporterId: string): boolean {
  const all = loadBusinessReports();
  return all.some(
    (r) => r.businessId === businessId && r.reporterId === reporterId && r.status === "PENDING"
  );
}

export function createBusinessReport(data: {
  businessId: number;
  businessName: string;
  reporterId: string;
  reporterName?: string;
  reason: BusinessReportReason;
  details?: string;
}): { success: boolean; report?: BusinessReport; error?: string } {
  if (!data.reporterId) {
    return { success: false, error: "Authentication required to submit a report." };
  }

  if (hasPendingReport(data.businessId, data.reporterId)) {
    return { success: false, error: "You've already reported this issue." };
  }

  const validReasons: BusinessReportReason[] = [
    "WRONG_HOURS",
    "WRONG_PHONE",
    "WRONG_LOCATION",
    "WRONG_INFORMATION",
    "CLOSED",
    "DUPLICATE",
    "OTHER",
  ];

  if (!validReasons.includes(data.reason)) {
    return { success: false, error: "Invalid report reason selected." };
  }

  if (data.reason === "OTHER" && (!data.details || !data.details.trim())) {
    return { success: false, error: "Please provide additional details for 'Other'." };
  }

  const newReport: BusinessReport = {
    id: `breport-${Date.now()}`,
    businessId: data.businessId,
    businessName: data.businessName,
    reporterId: data.reporterId,
    reporterName: data.reporterName || "Community Member",
    reason: data.reason,
    details: data.details ? data.details.trim() : undefined,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };

  const all = loadBusinessReports();
  const next = [newReport, ...all];
  saveBusinessReports(next);

  return { success: true, report: newReport };
}

export function dismissBusinessReport(
  reportId: string,
  reviewedBy: string = "Cafnet Administrator"
): { success: boolean; error?: string } {
  const all = loadBusinessReports();
  const index = all.findIndex((r) => r.id === reportId);
  if (index === -1) {
    return { success: false, error: "Report not found." };
  }

  const current = all[index];
  if (current.status === "DISMISSED") {
    return { success: false, error: "This report has already been dismissed." };
  }
  if (current.status === "ACTIONED") {
    return { success: false, error: "This report has already been actioned." };
  }

  const updated: BusinessReport = {
    ...current,
    status: "DISMISSED",
    reviewedAt: new Date().toISOString(),
    reviewedBy,
  };

  const next = [...all];
  next[index] = updated;
  saveBusinessReports(next);

  return { success: true };
}

export function actionBusinessReport(
  reportId: string,
  reviewedBy: string = "Cafnet Administrator",
  adminNotes?: string
): { success: boolean; error?: string } {
  const all = loadBusinessReports();
  const index = all.findIndex((r) => r.id === reportId);
  if (index === -1) {
    return { success: false, error: "Report not found." };
  }

  const current = all[index];
  if (current.status === "ACTIONED") {
    return { success: false, error: "This report has already been marked as actioned." };
  }

  const updated: BusinessReport = {
    ...current,
    status: "ACTIONED",
    reviewedAt: new Date().toISOString(),
    reviewedBy,
    adminNotes: adminNotes ? adminNotes.trim() : current.adminNotes,
  };

  const next = [...all];
  next[index] = updated;
  saveBusinessReports(next);

  return { success: true };
}
