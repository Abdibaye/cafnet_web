"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getManagedBusiness } from "@/lib/api/businesses";
import { listBusinessUpdates, deleteBusinessUpdate } from "@/lib/api/updates";
import {
  apiUpdateToViewModel,
  formatUpdateDate,
  getUpdateTypeLabel,
  getUpdateTypeIcon,
  isUpdateExpired,
  type BusinessUpdateViewModel,
} from "@/lib/api/adapters";
import { ApiError } from "@/lib/api/errors";
import type { Business } from "@/lib/api/types";

export default function UpdateListPage({ businessId }: { businessId: string }) {
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [updates, setUpdates] = useState<BusinessUpdateViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState<BusinessUpdateViewModel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorStatus(null);
    setErrorMessage(null);
    try {
      const [biz, rawUpdates] = await Promise.all([
        getManagedBusiness(businessId),
        listBusinessUpdates(businessId, true),
      ]);
      setBusiness(biz);
      setUpdates(rawUpdates.map(apiUpdateToViewModel));
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorStatus(err.status);
        setErrorMessage(err.message);
      } else {
        setErrorStatus(500);
        setErrorMessage("Failed to load business updates");
      }
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener("cafnet:updates-updated", handleUpdate);
    return () => {
      window.removeEventListener("cafnet:updates-updated", handleUpdate);
    };
  }, [loadData]);

  const handleDeleteClick = (update: BusinessUpdateViewModel) => {
    setUpdateToDelete(update);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!updateToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBusinessUpdate(businessId, updateToDelete.id);
      setUpdates((prev) => prev.filter((u) => u.id !== updateToDelete.id));
      setShowDeleteDialog(false);
      setUpdateToDelete(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cafnet:updates-updated"));
      }
    } catch (err) {
      console.error("Failed to delete update:", err);
      alert(err instanceof ApiError ? err.message : "Failed to delete update");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setShowDeleteDialog(false);
    setUpdateToDelete(null);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Loading...</h1>
        <p className="mt-3 text-sm text-on-surface-variant">Preparing your updates</p>
      </div>
    );
  }

  if (errorStatus === 403) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-surface-container-low text-secondary">
          <span className="material-symbols-outlined text-3xl">lock</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-on-surface">Access Denied</h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          You do not have permission to manage updates for this business.
        </p>
        <Link
          href="/business/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-[#0f46b8]"
        >
          Back to Business Center
        </Link>
      </div>
    );
  }

  if (errorStatus === 404 || !business) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Business Not Found</h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          {errorMessage || "The requested business could not be found."}
        </p>
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

      {activeUpdates.length === 0 && expiredUpdates.length === 0 ? (
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
            if (event.target === event.currentTarget && !isDeleting) setShowDeleteDialog(false);
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
                  This update will no longer appear to customers and cannot be undone.
                </p>
              </div>
              <button
                type="button"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low"
                aria-label="Close dialog"
                disabled={isDeleting}
                onClick={handleCancelDelete}
              >
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleCancelDelete}
                className="flex-1 h-11 rounded-xl border border-outline-variant bg-white text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 h-11 rounded-xl bg-error-container text-sm font-semibold text-error hover:bg-error-container/90 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete update"}
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
  onEdit,
  onDelete,
  expired = false,
}: {
  update: BusinessUpdateViewModel;
  onEdit: () => void;
  onDelete: () => void;
  expired?: boolean;
}) {
  return (
    <article className={`border border-outline-variant bg-white p-5 ${expired ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
              {getUpdateTypeIcon(update.type)}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              {getUpdateTypeLabel(update.type)}
            </span>
          </div>
          <h3 className="mt-2 font-bold text-on-surface">{update.title}</h3>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">{update.description}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-on-surface-variant">
            <span>Published {formatUpdateDate(update.publishedAt)}</span>
            {update.eventDate && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">event</span>
                {update.eventDate} {update.eventTime ? `at ${update.eventTime}` : ""}
              </span>
            )}
            {update.validUntil && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                Until {update.validUntil}
              </span>
            )}
            {update.price && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">payments</span>
                {update.price}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="h-10 w-10 rounded-xl border border-outline-variant bg-white text-on-surface-variant hover:border-primary/40 hover:text-primary flex items-center justify-center"
            aria-label="Edit update"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="h-10 w-10 rounded-xl border border-outline-variant bg-white text-on-surface-variant hover:border-error/40 hover:text-error flex items-center justify-center"
            aria-label="Delete update"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}
