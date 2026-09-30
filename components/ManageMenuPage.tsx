"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCustomer } from "@/components/CustomerProvider";
import { useBusinessOwner } from "@/components/BusinessOwnerProvider";
import { getManagedBusiness } from "@/lib/api/businesses";
import {
  getBusinessMenu,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  reorderMenuCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  reorderMenuItems,
} from "@/lib/api/menus";
import {
  apiMenuToViewModel,
  parsePriceToMinorSantims,
  type BusinessMenuViewModel,
  type MenuCategoryViewModel,
  type MenuItemViewModel,
} from "@/lib/api/adapters";
import { ApiError } from "@/lib/api/errors";
import type { Business } from "@/lib/api/types";

type ManageMenuPageProps = {
  businessId: string;
};

export default function ManageMenuPage({ businessId }: ManageMenuPageProps) {
  const numId = Number(businessId);
  const router = useRouter();
  const { showToast } = useCustomer();
  const { ready, isBusinessManaged } = useBusinessOwner();

  // Business state
  const [business, setBusiness] = useState<Business | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  // Menu state
  const [menu, setMenu] = useState<BusinessMenuViewModel | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategoryViewModel | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<MenuCategoryViewModel | null>(null);

  const [activeCategoryIdForItem, setActiveCategoryIdForItem] = useState<string | null>(null);
  const [editingItemInfo, setEditingItemInfo] = useState<{
    category: MenuCategoryViewModel;
    item: MenuItemViewModel;
  } | null>(null);
  const [deletingItemInfo, setDeletingItemInfo] = useState<{
    category: MenuCategoryViewModel;
    item: MenuItemViewModel;
  } | null>(null);

  // Form input states
  const [categoryNameInput, setCategoryNameInput] = useState("");
  const [categoryError, setCategoryError] = useState("");

  const [itemNameInput, setItemNameInput] = useState("");
  const [itemPriceInput, setItemPriceInput] = useState("");
  const [itemDescInput, setItemDescInput] = useState("");
  const [itemErrors, setItemErrors] = useState<{ name?: string; price?: string }>({});

  // Load business metadata with ReBAC verification
  useEffect(() => {
    let cancelled = false;
    async function loadBusiness() {
      setLoadingBusiness(true);
      setErrorStatus(null);
      try {
        const b = await getManagedBusiness(businessId);
        if (!cancelled) {
          setBusiness(b);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setErrorStatus(err.status);
          } else {
            setErrorStatus(500);
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingBusiness(false);
        }
      }
    }

    loadBusiness();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  // Reload menu helper from canonical API
  const reloadMenu = async () => {
    try {
      setLoadingMenu(true);
      setMenuError(null);
      const raw = await getBusinessMenu(businessId);
      setMenu(apiMenuToViewModel(raw));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setErrorStatus(403);
        } else if (err.status === 404) {
          setMenu({ businessId: numId, categories: [] });
        } else {
          setMenuError(err.message || "Failed to load menu");
        }
      } else {
        setMenuError("An unexpected error occurred while loading the menu");
      }
    } finally {
      setLoadingMenu(false);
    }
  };

  useEffect(() => {
    reloadMenu();

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ businessId?: number }>;
      if (!customEvent.detail?.businessId || customEvent.detail.businessId === numId) {
        reloadMenu();
      }
    };

    window.addEventListener("cafnet:menu-updated", handleUpdate);
    return () => window.removeEventListener("cafnet:menu-updated", handleUpdate);
  }, [numId]);

  // Escape key handler for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsAddCategoryOpen(false);
        setEditingCategory(null);
        setDeletingCategory(null);
        setActiveCategoryIdForItem(null);
        setEditingItemInfo(null);
        setDeletingItemInfo(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const notifyMenuUpdated = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cafnet:menu-updated", {
          detail: { businessId: numId },
        })
      );
    }
  };

  if (!ready || loadingBusiness) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-sm text-on-surface-variant">
        Loading menu management...
      </div>
    );
  }

  if (errorStatus === 403) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-surface-container-low text-secondary">
          <span className="material-symbols-outlined text-3xl">lock</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-on-surface">Access restricted</h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          Only verified managers of this business can manage the menu.
        </p>
        <Link
          href="/business/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-[#0f46b8]"
        >
          Go to Business Center
        </Link>
      </div>
    );
  }

  if (!business || errorStatus === 404) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Business not found</h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          This business may no longer be available.
        </p>
        <Link
          href="/business/dashboard"
          className="mt-6 inline-flex text-sm font-semibold text-primary"
        >
          Return to Business Center
        </Link>
      </div>
    );
  }

  const categories = menu?.categories || [];
  const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);

  // --------------------------------------------------------------------------
  // Category Actions
  // --------------------------------------------------------------------------

  const handleOpenAddCategory = () => {
    setCategoryNameInput("");
    setCategoryError("");
    setIsAddCategoryOpen(true);
  };

  const handleOpenEditCategory = (category: MenuCategoryViewModel) => {
    setCategoryNameInput(category.name);
    setCategoryError("");
    setEditingCategory(category);
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = categoryNameInput.trim();
    if (!trimmed) {
      setCategoryError("Category name is required");
      return;
    }
    if (trimmed.length > 80) {
      setCategoryError("Category name must be under 80 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateMenuCategory(numId, editingCategory.id, { name: trimmed });
        showToast("Category renamed");
        setEditingCategory(null);
      } else {
        const nextOrder = categories.length;
        await createMenuCategory(numId, { name: trimmed, sort_order: nextOrder });
        showToast("Category added");
        setIsAddCategoryOpen(false);
      }
      setCategoryNameInput("");
      setCategoryError("");
      notifyMenuUpdated();
      await reloadMenu();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setCategoryError("A category with this name already exists");
      } else if (err instanceof ApiError) {
        setCategoryError(err.message || "Failed to save category");
      } else {
        setCategoryError("Failed to save category. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    setIsSubmitting(true);
    try {
      await deleteMenuCategory(numId, deletingCategory.id);
      showToast("Category deleted");
      setDeletingCategory(null);
      notifyMenuUpdated();
      await reloadMenu();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to delete category";
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveCategory = async (categoryId: string, direction: "up" | "down") => {
    if (!menu) return;
    const cats = [...menu.categories];
    const idx = cats.findIndex((c) => c.id === categoryId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= cats.length) return;

    const [moved] = cats.splice(idx, 1);
    cats.splice(targetIdx, 0, moved);
    const reorderedIds = cats.map((c) => c.id);

    try {
      await reorderMenuCategories(numId, reorderedIds);
      notifyMenuUpdated();
      await reloadMenu();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to reorder categories";
      showToast(msg);
    }
  };

  // --------------------------------------------------------------------------
  // Item Actions
  // --------------------------------------------------------------------------

  const handleOpenAddItem = (categoryId: string) => {
    setItemNameInput("");
    setItemPriceInput("");
    setItemDescInput("");
    setItemErrors({});
    setActiveCategoryIdForItem(categoryId);
  };

  const handleOpenEditItem = (category: MenuCategoryViewModel, item: MenuItemViewModel) => {
    setItemNameInput(item.name);
    setItemPriceInput(item.price);
    setItemDescInput(item.description || "");
    setItemErrors({});
    setEditingItemInfo({ category, item });
  };

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = itemNameInput.trim();
    const priceTrimmed = itemPriceInput.trim();
    const descTrimmed = itemDescInput.trim();

    const errors: { name?: string; price?: string } = {};
    if (!nameTrimmed) errors.name = "Item name is required";
    if (nameTrimmed.length > 100) errors.name = "Item name must be under 100 characters";
    if (!priceTrimmed) errors.price = "Price is required";

    let priceMinor = 0;
    if (priceTrimmed) {
      try {
        priceMinor = parsePriceToMinorSantims(priceTrimmed);
        if (priceMinor > 100000000) {
          errors.price = "Price is above maximum allowed";
        }
      } catch {
        errors.price = "Enter a valid price in ETB (e.g. 150 or 150.50)";
      }
    }

    if (Object.keys(errors).length > 0) {
      setItemErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItemInfo) {
        await updateMenuItem(numId, editingItemInfo.item.id, {
          name: nameTrimmed,
          description: descTrimmed,
          price_etb_minor: priceMinor,
        });
        showToast("Menu item updated");
        setEditingItemInfo(null);
      } else if (activeCategoryIdForItem) {
        const targetCat = categories.find((c) => c.id === activeCategoryIdForItem);
        const nextOrder = targetCat ? targetCat.items.length : 0;
        await createMenuItem(numId, {
          category_id: activeCategoryIdForItem,
          name: nameTrimmed,
          description: descTrimmed,
          price_etb_minor: priceMinor,
          sort_order: nextOrder,
        });
        showToast("Menu item added");
        setActiveCategoryIdForItem(null);
      }

      setItemNameInput("");
      setItemPriceInput("");
      setItemDescInput("");
      setItemErrors({});
      notifyMenuUpdated();
      await reloadMenu();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save menu item";
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteItem = async () => {
    if (!deletingItemInfo) return;
    setIsSubmitting(true);
    try {
      await deleteMenuItem(numId, deletingItemInfo.item.id);
      showToast("Menu item deleted");
      setDeletingItemInfo(null);
      notifyMenuUpdated();
      await reloadMenu();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to delete item";
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveItem = async (categoryId: string, itemId: string, direction: "up" | "down") => {
    if (!menu) return;
    const cat = menu.categories.find((c) => c.id === categoryId);
    if (!cat) return;

    const items = [...cat.items];
    const idx = items.findIndex((i) => i.id === itemId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const [moved] = items.splice(idx, 1);
    items.splice(targetIdx, 0, moved);
    const reorderedIds = items.map((i) => i.id);

    try {
      await reorderMenuItems(numId, categoryId, reorderedIds);
      notifyMenuUpdated();
      await reloadMenu();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to reorder items";
      showToast(msg);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 lg:px-0 lg:py-16">
      {/* Header navigation & title */}
      <div>
        <Link
          href={`/business/dashboard/business/${business.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-[#0f46b8]"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            arrow_back
          </span>
          Back to business
        </Link>
        <div className="mt-6 flex flex-col gap-4 border-b border-outline-variant pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
              Menu management
            </p>
            <h1 className="mt-1 text-3xl font-bold text-on-surface">{business.name}</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              {categories.length} {categories.length === 1 ? "category" : "categories"} ·{" "}
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href={`/business/${business.id}#menu`}
              target="_blank"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-outline-variant bg-white px-4 text-sm font-semibold text-on-surface transition-colors hover:border-primary/40 hover:text-primary"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              View live menu
            </Link>
            <button
              type="button"
              onClick={handleOpenAddCategory}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0f46b8] focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="material-symbols-outlined text-[19px]">add</span>
              Add category
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-8">
        {loadingMenu && !menu ? (
          <div className="rounded-2xl border border-outline-variant bg-white p-12 text-center text-sm text-on-surface-variant">
            Loading menu items...
          </div>
        ) : menuError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-medium text-red-800">{menuError}</p>
            <button
              type="button"
              onClick={reloadMenu}
              className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-red-600 px-4 text-xs font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-12 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-surface-container-low text-secondary">
              <span className="material-symbols-outlined text-3xl">restaurant_menu</span>
            </div>
            <h2 className="mt-4 text-lg font-bold text-on-surface">
              Your customers don&apos;t have menu information yet.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
              Add menu categories like &ldquo;Main Dishes&rdquo;, &ldquo;Drinks&rdquo;, or
              &ldquo;Breakfast&rdquo; to start showcasing your offerings to diners.
            </p>
            <button
              type="button"
              onClick={handleOpenAddCategory}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0f46b8]"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add your first category
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category, catIdx) => (
              <section
                key={category.id}
                className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm"
                aria-labelledby={`cat-title-${category.id}`}
              >
                {/* Category Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low/50 px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-surface-container-high text-xs font-bold text-on-surface-variant">
                      {catIdx + 1}
                    </span>
                    <h2
                      id={`cat-title-${category.id}`}
                      className="text-lg font-bold text-on-surface"
                    >
                      {category.name}
                    </h2>
                    <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-xs font-semibold text-on-surface-variant">
                      {category.items.length} {category.items.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Move Category Up */}
                    <button
                      type="button"
                      disabled={catIdx === 0 || isSubmitting}
                      onClick={() => handleMoveCategory(category.id, "up")}
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-outline-variant/70 text-on-surface-variant transition-colors hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                      title="Move category up"
                      aria-label={`Move ${category.name} category up`}
                    >
                      <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                    </button>
                    {/* Move Category Down */}
                    <button
                      type="button"
                      disabled={catIdx === categories.length - 1 || isSubmitting}
                      onClick={() => handleMoveCategory(category.id, "down")}
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-outline-variant/70 text-on-surface-variant transition-colors hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                      title="Move category down"
                      aria-label={`Move ${category.name} category down`}
                    >
                      <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
                    </button>
                    {/* Rename Category */}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleOpenEditCategory(category)}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-outline-variant/70 px-3 text-xs font-semibold text-on-surface transition-colors hover:bg-white hover:text-primary disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Rename
                    </button>
                    {/* Delete Category */}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setDeletingCategory(category)}
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-outline-variant/70 text-secondary transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Delete category"
                      aria-label={`Delete ${category.name} category`}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                {/* Items in this category */}
                <div className="p-5">
                  {category.items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-outline-variant/80 bg-surface-container-low/30 px-5 py-8 text-center">
                      <p className="text-sm font-medium text-on-surface-variant">
                        No items in &ldquo;{category.name}&rdquo; yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenAddItem(category.id)}
                        className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-[#0f46b8]"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add item
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {category.items.map((item, itemIdx) => (
                        <div
                          key={item.id}
                          className="flex flex-col justify-between gap-3 rounded-xl border border-outline-variant/80 bg-white p-4 transition-all hover:border-outline-variant sm:flex-row sm:items-center"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-on-surface">
                                {item.name}
                              </h3>
                              <span className="inline-flex items-center rounded-md bg-primary-container/40 px-2 py-0.5 text-xs font-bold text-primary">
                                {item.price}
                              </span>
                            </div>
                            {item.description && (
                              <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
                            {/* Move Item Up */}
                            <button
                              type="button"
                              disabled={itemIdx === 0 || isSubmitting}
                              onClick={() => handleMoveItem(category.id, item.id, "up")}
                              className="inline-flex size-8 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary disabled:cursor-not-allowed disabled:opacity-25"
                              title="Move item up"
                              aria-label={`Move ${item.name} up`}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                arrow_upward
                              </span>
                            </button>
                            {/* Move Item Down */}
                            <button
                              type="button"
                              disabled={itemIdx === category.items.length - 1 || isSubmitting}
                              onClick={() => handleMoveItem(category.id, item.id, "down")}
                              className="inline-flex size-8 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary disabled:cursor-not-allowed disabled:opacity-25"
                              title="Move item down"
                              aria-label={`Move ${item.name} down`}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                arrow_downward
                              </span>
                            </button>
                            {/* Edit Item */}
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleOpenEditItem(category, item)}
                              className="inline-flex h-8 items-center gap-1 rounded-md border border-outline-variant/70 px-2.5 text-xs font-semibold text-on-surface transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[15px]">edit</span>
                              Edit
                            </button>
                            {/* Delete Item */}
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => setDeletingItemInfo({ category, item })}
                              className="inline-flex size-8 items-center justify-center rounded-md text-secondary transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              title="Delete item"
                              aria-label={`Delete ${item.name}`}
                            >
                              <span className="material-symbols-outlined text-[17px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add another item button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleOpenAddItem(category.id)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-outline-variant bg-surface-container-low/40 px-3.5 text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-primary-container/20"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          Add item to {category.name}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* ADD / EDIT CATEGORY MODAL */}
      {/* -------------------------------------------------------------------------- */}
      {(isAddCategoryOpen || editingCategory) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h3 id="category-modal-title" className="text-lg font-bold text-on-surface">
                {editingCategory ? "Rename category" : "Add menu category"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddCategoryOpen(false);
                  setEditingCategory(null);
                }}
                className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitCategory} className="mt-4">
              <div>
                <label
                  htmlFor="category-name-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  Category Name
                </label>
                <input
                  id="category-name-input"
                  type="text"
                  autoFocus
                  placeholder="e.g. Traditional Dishes, Breakfast, Drinks"
                  value={categoryNameInput}
                  onChange={(e) => {
                    setCategoryNameInput(e.target.value);
                    if (categoryError) setCategoryError("");
                  }}
                  className={`mt-1.5 h-11 w-full rounded-xl border px-3.5 text-sm outline-none transition-colors ${
                    categoryError
                      ? "border-red-500 focus:border-red-500"
                      : "border-outline-variant focus:border-primary"
                  }`}
                />
                {categoryError && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{categoryError}</p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddCategoryOpen(false);
                    setEditingCategory(null);
                  }}
                  className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0f46b8] disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingCategory
                    ? "Save changes"
                    : "Add category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* DELETE CATEGORY CONFIRMATION MODAL */}
      {/* -------------------------------------------------------------------------- */}
      {deletingCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-category-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 id="delete-category-title" className="mt-4 text-lg font-bold text-on-surface">
              Delete &ldquo;{deletingCategory.name}&rdquo;?
            </h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              {deletingCategory.items.length > 0
                ? `This category contains ${deletingCategory.items.length} menu ${
                    deletingCategory.items.length === 1 ? "item" : "items"
                  }. Deleting the category will permanently remove all items inside it.`
                : "Are you sure you want to remove this category from your menu?"}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDeleteCategory}
                className="h-10 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? "Deleting..." : "Delete category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* ADD / EDIT ITEM MODAL */}
      {/* -------------------------------------------------------------------------- */}
      {(activeCategoryIdForItem || editingItemInfo) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="item-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h3 id="item-modal-title" className="text-lg font-bold text-on-surface">
                {editingItemInfo ? "Edit menu item" : "Add menu item"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setActiveCategoryIdForItem(null);
                  setEditingItemInfo(null);
                }}
                className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitItem} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="item-name-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  Item Name *
                </label>
                <input
                  id="item-name-input"
                  type="text"
                  autoFocus
                  placeholder="e.g. Doro Wat, Cappuccino, Shiro"
                  value={itemNameInput}
                  onChange={(e) => {
                    setItemNameInput(e.target.value);
                    if (itemErrors.name) setItemErrors({ ...itemErrors, name: undefined });
                  }}
                  className={`mt-1.5 h-11 w-full rounded-xl border px-3.5 text-sm outline-none transition-colors ${
                    itemErrors.name
                      ? "border-red-500 focus:border-red-500"
                      : "border-outline-variant focus:border-primary"
                  }`}
                />
                {itemErrors.name && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{itemErrors.name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="item-price-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  Price * (in ETB)
                </label>
                <input
                  id="item-price-input"
                  type="text"
                  placeholder="e.g. 250 ETB or 250"
                  value={itemPriceInput}
                  onChange={(e) => {
                    setItemPriceInput(e.target.value);
                    if (itemErrors.price) setItemErrors({ ...itemErrors, price: undefined });
                  }}
                  className={`mt-1.5 h-11 w-full rounded-xl border px-3.5 text-sm outline-none transition-colors ${
                    itemErrors.price
                      ? "border-red-500 focus:border-red-500"
                      : "border-outline-variant focus:border-primary"
                  }`}
                />
                {itemErrors.price && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{itemErrors.price}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="item-desc-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  Description (optional)
                </label>
                <textarea
                  id="item-desc-input"
                  rows={3}
                  placeholder="Briefly describe the dish or ingredients"
                  value={itemDescInput}
                  onChange={(e) => setItemDescInput(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-outline-variant p-3.5 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategoryIdForItem(null);
                    setEditingItemInfo(null);
                  }}
                  className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0f46b8] disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingItemInfo ? "Save changes" : "Add item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* DELETE ITEM CONFIRMATION MODAL */}
      {/* -------------------------------------------------------------------------- */}
      {deletingItemInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-item-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 id="delete-item-title" className="mt-4 text-lg font-bold text-on-surface">
              Delete &ldquo;{deletingItemInfo.item.name}&rdquo;?
            </h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Are you sure you want to remove this item from &ldquo;
              {deletingItemInfo.category.name}&rdquo;? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingItemInfo(null)}
                className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDeleteItem}
                className="h-10 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? "Deleting..." : "Delete item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
