"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBusinessOwner } from "./BusinessOwnerProvider";
import { getBusinessById } from "@/data/mockBusinesses";
import { formatUpdateDate, isUpdateExpired, type BusinessUpdate } from "@/data/businessUpdateStorage";

export default function UpdateListPage({ businessId }: { businessId: string }) {
  const router = useRouter();
  const { ready, getUpdatesByBusiness, getUpdateTypeLabel, getUpdateTypeIcon, deleteExistingUpdate } = useBusinessOwner();
  const business = getBusinessById(businessId);
  
  const [updates, setUpdates] = useState<BusinessUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState<BusinessUpdate | null>(null);

  useEffect(() => {
    if (!ready || !business) return;
    
    const businessUpdates = getUpdatesByBusiness(Number(businessId));
    setUpdates(businessUpdates);
    setLoading(false);
  }, [ready, businessId, getUpdatesByBusiness, business]);

  const handleDeleteClick = (update: BusinessUpdate) => {
    setUpdateToDelete(update);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (updateToDelete) {
      deleteExistingUpdate(updateToDelete.id);
      setUpdates(updates.filter((u) => u.id !== updateToDelete.id));
      setShowDeleteDialog(false);
      setUpdateToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setUpdateToDelete(null);
  };

  if (!ready || !business) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Loading...</h1>
        <p className="mt-3 text-sm text-on-surface-variant">Preparing your updates</p>
      </div>
    );
  }

  const canManage = business.claimStatus === "claimed";

  if (!canManage) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Access Denied</h1>
        <p className="mt-3 text-sm text-on-surface-variant">You do not have permission to manage updates for this business.</p>
        <Link href="/business/dashboard" className="mt-6 inline-flex text-sm font-semibold text-primary">
          Back to Business Center
        </Link>
      </div>
    );
  }

  const activeUpdates = updates.filter((u) => !isUpdateExpired(u));
  const expiredUpdates = updates.filter((u) => isUpdateExpired(u));

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 lg:px-0 lg:py-16">
      <div className="flex flex-col gap-4">
        <Link href={`/business/dashboard/business/${businessId}`} className="text-sm font-semibold text-primary">
          ← Back to business
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Business Updates</p>
          <h1 className="mt-2 text-3xl font-bold text-on-surface">Manage your updates</h1>
          <p className="mt-3 text-sm text-on-surface-variant">
            Share new menus, offers, events, and announcements with customers.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <Link
          href={`/business/dashboard/business/${businessId}/updates/create`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-[#0f46b8]"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
          Create update
        </Link>
      </div>

      {loading ? (
        <div className="mt-12 text-center text-sm text-on-surface-variant">Loading updates...</div>
      ) : activeUpdates.length === 0 && expiredUpdates.length === 0 ? (
        <div className="mt-12 border border-dashed border-outline-variant bg-white px-6 py-12 text-center">
          <span className="material-symbols-outlined text-3xl text-outline" aria-hidden="true">campaign</span>
          <h2 className="mt-4 text-lg font-bold text-on-surface">No updates yet</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-surface-variant">
            Keep customers informed about what's new at your place.
          </p>
          <Link
            href={`/business/dashboard/business/${businessId}/updates/create`}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-[#0f46b8]"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            Create your first update
          </Link>
        </div>
      ) : (
        <>
          {activeUpdates.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-bold text-on-surface">Active updates</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Currently visible to customers</p>
              <div className="mt-6 space-y-4">
                {activeUpdates.map((update) => (
                  <UpdateCard
                    key={update.id}
                    update={update}
                    business={business}
                    onEdit={() => router.push(`/business/dashboard/business/${businessId}/updates/${update.id}/edit`)}
                    onDelete={() => handleDeleteClick(update)}
                  />
                ))}
              </div>
            </section>
          )}

          {expiredUpdates.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-bold text-on-surface">Expired updates</h2>
              <p className="mt-1 text-sm text-on-surface-variant">No longer visible to customers</p>
              <div className="mt-6 space-y-4">
                {expiredUpdates.map((update) => (
                  <UpdateCard
                    key={update.id}
                    update={update}
                    business={business}
                    onEdit={() => router.push(`/business/dashboard/business/${businessId}/updates/${update.id}/edit`)}
                    onDelete={() => handleDeleteClick(update)}
                    expired
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {showDeleteDialog && updateToDelete && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-on-surface/30 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowDeleteDialog(false);
          }}
        >
          <section
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_16px_40px_rgba(20,33,61,0.18)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-update-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delete-update-title" className="text-xl font-bold text-on-surface">
                  Delete this update?
                </h2>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  This update will no longer appear to customers.
                </p>
              </div>
              <button
                type="button"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low"
                aria-label="Close dialog"
                onClick={handleCancelDelete}
              >
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="flex-1 h-11 rounded-xl border border-outline-variant bg-white text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 h-11 rounded-xl bg-error-container text-sm font-semibold text-error hover:bg-error-container/90"
              >
                Delete
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function UpdateCard({
  update,
  business,
  onEdit,
  onDelete,
  expired = false,
}: {
  update: BusinessUpdate;
  business: any;
  onEdit: () => void;
  onDelete: () => void;
  expired?: boolean;
}) {
  const { getUpdateTypeLabel, getUpdateTypeIcon } = useBusinessOwner();

  return (
    <article className={`border border-outline-variant bg-white p-5 ${expired ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-[18px] text-primary`} aria-hidden="true">
              {getUpdateTypeIcon(update.type)}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              {getUpdateTypeLabel(update.type)}
            </span>
          </div>
          <h3 className="mt-2 font-bold text-on-surface">{update.title}</h3>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{update.description}</p>
          <p className="mt-3 text-xs text-on-surface-variant">
            Published {formatUpdateDate(update.publishedAt)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="h-10 w-10 rounded-xl border border-outline-variant bg-white text-on-surface-variant hover:border-primary/40 hover:text-primary"
            aria-label="Edit update"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="h-10 w-10 rounded-xl border border-outline-variant bg-white text-on-surface-variant hover:border-error/40 hover:text-error"
            aria-label="Delete update"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}
