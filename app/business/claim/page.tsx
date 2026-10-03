import { Suspense } from "react";
import BusinessClaimFlow from "@/components/BusinessClaimFlow";

export default function BusinessClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-5 py-20 text-sm text-on-surface-variant">
          Loading business claim...
        </div>
      }
    >
      <BusinessClaimFlow />
    </Suspense>
  );
}
