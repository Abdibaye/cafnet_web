export type ReportReason = "spam" | "offensive" | "fake" | "other";
export type ReportStatus = "PENDING" | "DISMISSED" | "ACTIONED";

export type ReportReasonOption = {
  value: ReportReason;
  label: string;
  description: string;
};

export const REPORT_REASONS: ReportReasonOption[] = [
  {
    value: "spam",
    label: "Spam",
    description: "Commercial ads, promotional links, or repeated promotional messages.",
  },
  {
    value: "offensive",
    label: "Offensive/inappropriate",
    description: "Hate speech, profanity, harassment, discrimination, or abusive language.",
  },
  {
    value: "fake",
    label: "Fake/misleading",
    description: "Dishonest reviews, paid reviews, competitor sabotage, or false visit claims.",
  },
  {
    value: "other",
    label: "Other",
    description: "Other content that violates Cafnet community trust guidelines.",
  },
];

export type ReviewReport = {
  id: string;
  reviewId: string;
  businessId: number;
  businessName: string;
  reviewerName: string;
  reviewerId?: string;
  reviewRating: number;
  reviewText: string;
  verifiedVisit?: boolean;
  reporterId: string;
  reporterName?: string;
  reason: ReportReason;
  explanation?: string;
  status: ReportStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  actionTaken?: "dismissed" | "removed";
};

export type ReviewModerationState = {
  removedReviewIds: string[];
};

const reportsStorageKey = "cafnet.mock-review-reports";
const moderationStorageKey = "cafnet.mock-review-moderation";

const memoryFallbackReports: ReviewReport[] = [];
const memoryFallbackModeration: ReviewModerationState = { removedReviewIds: [] };

export function loadReviewReports(): ReviewReport[] {
  if (typeof window === "undefined") return memoryFallbackReports;
  try {
    const stored = window.localStorage.getItem(reportsStorageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((r): r is ReviewReport =>
      Boolean(
        r &&
          typeof r === "object" &&
          typeof r.id === "string" &&
          typeof r.reviewId === "string" &&
          typeof r.reporterId === "string" &&
          typeof r.status === "string"
      )
    );
  } catch {
    return [];
  }
}

export function saveReviewReports(reports: ReviewReport[]): void {
  if (typeof window === "undefined") {
    memoryFallbackReports.length = 0;
    memoryFallbackReports.push(...reports);
    return;
  }
  try {
    window.localStorage.setItem(reportsStorageKey, JSON.stringify(reports));
    window.dispatchEvent(new CustomEvent("cafnet:review-moderation-updated"));
  } catch {
    // Ignore storage write failures
  }
}

export function loadModerationState(): ReviewModerationState {
  if (typeof window === "undefined") return memoryFallbackModeration;
  try {
    const stored = window.localStorage.getItem(moderationStorageKey);
    if (!stored) return { removedReviewIds: [] };
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.removedReviewIds)) {
      return { removedReviewIds: [] };
    }
    return {
      removedReviewIds: parsed.removedReviewIds.filter((id: unknown): id is string => typeof id === "string"),
    };
  } catch {
    return { removedReviewIds: [] };
  }
}

export function saveModerationState(state: ReviewModerationState): void {
  if (typeof window === "undefined") {
    memoryFallbackModeration.removedReviewIds = [...state.removedReviewIds];
    return;
  }
  try {
    window.localStorage.setItem(moderationStorageKey, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("cafnet:review-moderation-updated"));
    window.dispatchEvent(new CustomEvent("cafnet:reviews-updated"));
  } catch {
    // Ignore storage write failures
  }
}

export function isReviewRemoved(reviewId: string): boolean {
  const modState = loadModerationState();
  return modState.removedReviewIds.includes(reviewId);
}

export function getRemovedReviewIds(): string[] {
  return loadModerationState().removedReviewIds;
}

export function hasCustomerReportedReview(reviewId: string, reporterId: string): boolean {
  if (!reviewId || !reporterId) return false;
  const reports = loadReviewReports();
  return reports.some((r) => r.reviewId === reviewId && r.reporterId === reporterId);
}

export function createReviewReport(params: {
  reviewId: string;
  businessId: number;
  businessName: string;
  reviewerName: string;
  reviewerId?: string;
  reviewRating: number;
  reviewText: string;
  verifiedVisit?: boolean;
  reporterId: string;
  reporterName?: string;
  reason: ReportReason;
  explanation?: string;
}): { success: boolean; report?: ReviewReport; error?: string } {
  if (!params.reviewId || !params.reporterId) {
    return { success: false, error: "Missing required report information." };
  }

  // Duplicate report check
  if (hasCustomerReportedReview(params.reviewId, params.reporterId)) {
    return { success: false, error: "You already reported this review." };
  }

  const reports = loadReviewReports();
  const newReport: ReviewReport = {
    id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    reviewId: params.reviewId,
    businessId: params.businessId,
    businessName: params.businessName || `Business #${params.businessId}`,
    reviewerName: params.reviewerName || "Customer",
    reviewerId: params.reviewerId,
    reviewRating: params.reviewRating,
    reviewText: params.reviewText,
    verifiedVisit: params.verifiedVisit,
    reporterId: params.reporterId,
    reporterName: params.reporterName || "Anonymous Reporter",
    reason: params.reason,
    explanation: params.explanation?.trim() || "",
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };

  const nextReports = [newReport, ...reports];
  saveReviewReports(nextReports);

  return { success: true, report: newReport };
}

export function dismissReport(
  reportId: string,
  adminName: string = "Cafnet Admin"
): { success: boolean; error?: string } {
  const reports = loadReviewReports();
  const reportIndex = reports.findIndex((r) => r.id === reportId);
  if (reportIndex === -1) {
    return { success: false, error: "Report not found." };
  }

  const report = reports[reportIndex];
  if (report.status !== "PENDING") {
    return { success: false, error: "This report has already been reviewed." };
  }

  const updatedReport: ReviewReport = {
    ...report,
    status: "DISMISSED",
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminName,
    actionTaken: "dismissed",
  };

  const updatedReports = [...reports];
  updatedReports[reportIndex] = updatedReport;
  saveReviewReports(updatedReports);

  return { success: true };
}

export function removeReviewByAdmin(
  reviewId: string,
  reportId?: string,
  adminName: string = "Cafnet Admin"
): { success: boolean; error?: string } {
  if (isReviewRemoved(reviewId)) {
    return { success: false, error: "This review has already been removed." };
  }

  // 1. Mark review as removed in moderation state
  const modState = loadModerationState();
  const updatedRemoved = Array.from(new Set([...modState.removedReviewIds, reviewId]));
  saveModerationState({ removedReviewIds: updatedRemoved });

  // 2. Mark report(s) as ACTIONED
  const reports = loadReviewReports();
  const now = new Date().toISOString();
  let updatedAny = false;

  const updatedReports = reports.map((r) => {
    // If specific reportId was targeted OR report is for the same review and still pending
    if ((reportId && r.id === reportId) || (r.reviewId === reviewId && r.status === "PENDING")) {
      updatedAny = true;
      return {
        ...r,
        status: "ACTIONED" as ReportStatus,
        reviewedAt: now,
        reviewedBy: adminName,
        actionTaken: "removed" as const,
      };
    }
    return r;
  });

  if (updatedAny) {
    saveReviewReports(updatedReports);
  }

  return { success: true };
}

export function getReportById(reportId: string): ReviewReport | undefined {
  const reports = loadReviewReports();
  return reports.find((r) => r.id === reportId);
}

export function getReportForReview(reviewId: string): ReviewReport | undefined {
  const reports = loadReviewReports();
  return reports.find((r) => r.reviewId === reviewId);
}

export function getReports(statusFilter?: "ALL" | "PENDING" | "DISMISSED" | "ACTIONED"): ReviewReport[] {
  const reports = loadReviewReports();
  if (!statusFilter || statusFilter === "ALL") return reports;
  return reports.filter((r) => r.status === statusFilter);
}

export function getPendingReportsCount(): number {
  const reports = loadReviewReports();
  return reports.filter((r) => r.status === "PENDING").length;
}
