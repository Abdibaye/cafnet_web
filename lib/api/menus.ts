import { api } from "./client";
import type {
  BusinessMenu,
  MenuCategory,
  MenuItem,
  CreateMenuCategoryInput,
  UpdateMenuCategoryInput,
  ReorderCategoriesInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  ReorderItemsInput,
} from "./types";

/**
 * Retrieves the full menu (categories and nested items) for a venue.
 * Accessible to public visitors and authorized managers.
 */
export async function getBusinessMenu(
  businessId: number | string,
): Promise<BusinessMenu> {
  const res = await api.get<BusinessMenu>(
    `/api/v1/businesses/${encodeURIComponent(String(businessId))}/menu`,
  );
  return res.data;
}

/**
 * Adds a new menu category for a business venue.
 * Protected by ReBAC (actor must manage the business).
 */
export async function createMenuCategory(
  businessId: number | string,
  input: CreateMenuCategoryInput,
): Promise<MenuCategory> {
  const res = await api.post<MenuCategory>(
    `/api/v1/businesses/${encodeURIComponent(String(businessId))}/menu/categories`,
    input,
  );
  return res.data;
}

/**
 * Updates an existing menu category's name or sort order.
 * Protected by ReBAC and IDOR verification.
 */
export async function updateMenuCategory(
  businessId: number | string,
  categoryId: string,
  input: UpdateMenuCategoryInput,
): Promise<MenuCategory> {
  const res = await api.patch<MenuCategory>(
    `/api/v1/businesses/${encodeURIComponent(String(businessId))}/menu/categories/${encodeURIComponent(categoryId)}`,
    input,
  );
  return res.data;
}

/**
 * Permanently soft-deletes a menu category and its contained items.
 * Protected by ReBAC and IDOR verification.
 */
export async function deleteMenuCategory(
  businessId: number | string,
  categoryId: string,
): Promise<{ deleted: boolean }> {
  const res = await api.delete<{ deleted: boolean }>(
    `/api/v1/businesses/${encodeURIComponent(String(businessId))}/menu/categories/${encodeURIComponent(categoryId)}`,
  );
  return res.data;
}

/**
 * Updates the display ordering of categories within a business menu atomically.
 * Protected by ReBAC.
 */
export async function reorderMenuCategories(
  businessId: number | string,
  categoryIds: string[],
): Promise<{ reordered: boolean }> {
  const payload: ReorderCategoriesInput = { category_ids: categoryIds };
  const res = await api.put<{ reordered: boolean }>(
    `/api/v1/businesses/${encodeURIComponent(String(businessId))}/menu/categories/reorder`,
    payload,
  );
  return res.data;
}

/**
 * Creates an individual menu offering within a category.
 * Protected by ReBAC and IDOR verification (category must belong to venue).
 */
export async function createMenuItem(
  businessId: number | string,
  input: CreateMenuItemInput,
): Promise<MenuItem> {
  const res = await api.post<MenuItem>(
    `/api/v1/businesses/${encodeURIComponent(String(businessId))}/menu/items`,
    input,
  );
  return res.data;
}

/**
 * Updates mutable fields of an individual menu offering.
 * Protected by ReBAC and IDOR verification.
 */
export async function updateMenuItem(
  businessId: number | string,
  itemId: string,
  input: UpdateMenuItemInput,
): Promise<MenuItem> {
  const res = await api.patch<MenuItem>(
    `/api/v1/businesses/${encodeURIComponent(String(businessId))}/menu/items/${encodeURIComponent(itemId)}`,
    input,
  );
  return res.data;
}

/**
 * Permanently soft-deletes an individual menu offering.
 * Protected by ReBAC and IDOR verification.
 */
export async function deleteMenuItem(
  businessId: number | string,
  itemId: string,
): Promise<{ deleted: boolean }> {
  const res = await api.delete<{ deleted: boolean }>(
    `/api/v1/businesses/${encodeURIComponent(String(businessId))}/menu/items/${encodeURIComponent(itemId)}`,
  );
  return res.data;
}

/**
 * Updates the ordering of items within a category atomically.
 * Protected by ReBAC and IDOR verification.
 */
export async function reorderMenuItems(
  businessId: number | string,
  categoryId: string,
  itemIds: string[],
): Promise<{ reordered: boolean }> {
  const payload: ReorderItemsInput = { item_ids: itemIds };
  const res = await api.put<{ reordered: boolean }>(
    `/api/v1/businesses/${encodeURIComponent(String(businessId))}/menu/categories/${encodeURIComponent(categoryId)}/items/reorder`,
    payload,
  );
  return res.data;
}
