import { mockBusinesses, type MockBusiness } from "./mockBusinesses";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  sortOrder: number;
};

export type MenuCategory = {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItem[];
};

export type BusinessMenu = {
  id: string;
  businessId: number;
  categories: MenuCategory[];
  updatedAt: string;
};

type MenuStorage = {
  menus: Record<number, BusinessMenu>;
};

const storageKey = "cafnet.mock-business-menus";

const emptyStorage: MenuStorage = { menus: {} };

/**
 * Converts legacy MenuCategory from mockBusinesses to the new structured format with IDs and sortOrder
 */
function seedMenuFromMockBusiness(business: MockBusiness): BusinessMenu {
  const categories: MenuCategory[] = (business.menu || []).map((cat, catIdx) => ({
    id: `cat-${business.id}-${catIdx + 1}`,
    name: cat.category,
    sortOrder: catIdx,
    items: (cat.items || []).map((item, itemIdx) => ({
      id: `item-${business.id}-${catIdx + 1}-${itemIdx + 1}`,
      name: item.name,
      description: item.description || "",
      price: item.price,
      sortOrder: itemIdx,
    })),
  }));

  return {
    id: `menu-${business.id}`,
    businessId: business.id,
    categories,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Validates a MenuCategory object
 */
function isValidCategory(cat: unknown): cat is MenuCategory {
  if (!cat || typeof cat !== "object") return false;
  const c = cat as MenuCategory;
  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    typeof c.sortOrder === "number" &&
    Array.isArray(c.items) &&
    c.items.every(isValidItem)
  );
}

/**
 * Validates a MenuItem object
 */
function isValidItem(item: unknown): item is MenuItem {
  if (!item || typeof item !== "object") return false;
  const i = item as MenuItem;
  return (
    typeof i.id === "string" &&
    typeof i.name === "string" &&
    typeof i.description === "string" &&
    typeof i.price === "string" &&
    typeof i.sortOrder === "number"
  );
}

/**
 * Validates a BusinessMenu object
 */
function isValidMenu(menu: unknown): menu is BusinessMenu {
  if (!menu || typeof menu !== "object") return false;
  const m = menu as BusinessMenu;
  return (
    typeof m.id === "string" &&
    typeof m.businessId === "number" &&
    Array.isArray(m.categories) &&
    m.categories.every(isValidCategory)
  );
}

const memoryFallbackStorage: MenuStorage = { menus: {} };

/**
 * Loads menu storage from localStorage with validation and seed migration fallback
 */
export function loadMenuStorage(): MenuStorage {
  if (typeof window === "undefined") {
    return memoryFallbackStorage;
  }
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return emptyStorage;
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object" || !parsed.menus) return emptyStorage;

    const validatedMenus: Record<number, BusinessMenu> = {};
    for (const [key, value] of Object.entries(parsed.menus)) {
      const numKey = Number(key);
      if (!isNaN(numKey) && isValidMenu(value)) {
        validatedMenus[numKey] = value;
      }
    }

    return { menus: validatedMenus };
  } catch {
    return emptyStorage;
  }
}

/**
 * Saves menu storage to localStorage and dispatches reactive event
 */
export function saveMenuStorage(state: MenuStorage, businessId?: number) {
  if (typeof window === "undefined") {
    memoryFallbackStorage.menus = { ...state.menus };
    return;
  }
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
    window.dispatchEvent(
      new CustomEvent("cafnet:menu-updated", {
        detail: { businessId },
      })
    );
  } catch {
    // Ignore storage write failures
  }
}

/**
 * Gets the menu for a business. If not in localStorage, seeds it from mockBusinesses.
 */
export function getBusinessMenu(businessId: number): BusinessMenu | undefined {
  const state = loadMenuStorage();
  if (state.menus[businessId]) {
    return state.menus[businessId];
  }

  // Seed from mockBusinesses
  const seedBusiness = mockBusinesses.find((b) => b.id === businessId);
  if (seedBusiness) {
    const seeded = seedMenuFromMockBusiness(seedBusiness);
    return seeded;
  }

  return undefined;
}

/**
 * Saves a full business menu
 */
export function saveBusinessMenu(businessId: number, menu: BusinessMenu) {
  const state = loadMenuStorage();
  const updatedState: MenuStorage = {
    ...state,
    menus: {
      ...state.menus,
      [businessId]: {
        ...menu,
        businessId,
        updatedAt: new Date().toISOString(),
      },
    },
  };
  saveMenuStorage(updatedState, businessId);
}

/**
 * Resets a business menu to the original seed data
 */
export function resetBusinessMenu(businessId: number): boolean {
  const state = loadMenuStorage();
  if (!state.menus[businessId]) return false;

  const newMenus = { ...state.menus };
  delete newMenus[businessId];
  saveMenuStorage({ menus: newMenus }, businessId);
  return true;
}

// -------------------------------------------------------------
// Category CRUD operations
// -------------------------------------------------------------

export function addCategory(businessId: number, name: string): MenuCategory | undefined {
  const trimmedName = name.trim();
  if (!trimmedName) return undefined;

  let menu = getBusinessMenu(businessId);
  if (!menu) {
    menu = {
      id: `menu-${businessId}`,
      businessId,
      categories: [],
      updatedAt: new Date().toISOString(),
    };
  }

  // Check for duplicate category name (case-insensitive)
  const exists = menu.categories.some(
    (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (exists) return undefined;

  const newCategory: MenuCategory = {
    id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: trimmedName,
    sortOrder: menu.categories.length,
    items: [],
  };

  const updatedMenu: BusinessMenu = {
    ...menu,
    categories: [...menu.categories, newCategory],
  };

  saveBusinessMenu(businessId, updatedMenu);
  return newCategory;
}

export function updateCategory(businessId: number, categoryId: string, name: string): boolean {
  const trimmedName = name.trim();
  if (!trimmedName) return false;

  const menu = getBusinessMenu(businessId);
  if (!menu) return false;

  // Check for duplicate name among other categories
  const duplicate = menu.categories.some(
    (c) => c.id !== categoryId && c.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicate) return false;

  const categoryIndex = menu.categories.findIndex((c) => c.id === categoryId);
  if (categoryIndex === -1) return false;

  const updatedCategories = [...menu.categories];
  updatedCategories[categoryIndex] = {
    ...updatedCategories[categoryIndex],
    name: trimmedName,
  };

  saveBusinessMenu(businessId, { ...menu, categories: updatedCategories });
  return true;
}

export function deleteCategory(businessId: number, categoryId: string): boolean {
  const menu = getBusinessMenu(businessId);
  if (!menu) return false;

  const filteredCategories = menu.categories
    .filter((c) => c.id !== categoryId)
    .map((c, idx) => ({ ...c, sortOrder: idx }));

  if (filteredCategories.length === menu.categories.length) return false;

  saveBusinessMenu(businessId, { ...menu, categories: filteredCategories });
  return true;
}

export function reorderCategories(businessId: number, categoryId: string, direction: "up" | "down"): boolean {
  const menu = getBusinessMenu(businessId);
  if (!menu) return false;

  const index = menu.categories.findIndex((c) => c.id === categoryId);
  if (index === -1) return false;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= menu.categories.length) return false;

  const updatedCategories = [...menu.categories];
  const [moved] = updatedCategories.splice(index, 1);
  updatedCategories.splice(targetIndex, 0, moved);

  // Re-index sortOrder
  const reindexed = updatedCategories.map((c, idx) => ({ ...c, sortOrder: idx }));

  saveBusinessMenu(businessId, { ...menu, categories: reindexed });
  return true;
}

// -------------------------------------------------------------
// Item CRUD operations
// -------------------------------------------------------------

export type ItemInput = {
  name: string;
  description?: string;
  price: string;
};

export function addItem(businessId: number, categoryId: string, input: ItemInput): MenuItem | undefined {
  const trimmedName = input.name.trim();
  const trimmedPrice = input.price.trim();
  if (!trimmedName || !trimmedPrice) return undefined;

  const menu = getBusinessMenu(businessId);
  if (!menu) return undefined;

  const categoryIndex = menu.categories.findIndex((c) => c.id === categoryId);
  if (categoryIndex === -1) return undefined;

  const category = menu.categories[categoryIndex];
  const newItem: MenuItem = {
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: trimmedName,
    description: (input.description || "").trim(),
    price: trimmedPrice,
    sortOrder: category.items.length,
  };

  const updatedCategory = {
    ...category,
    items: [...category.items, newItem],
  };

  const updatedCategories = [...menu.categories];
  updatedCategories[categoryIndex] = updatedCategory;

  saveBusinessMenu(businessId, { ...menu, categories: updatedCategories });
  return newItem;
}

export function updateItem(
  businessId: number,
  categoryId: string,
  itemId: string,
  input: ItemInput
): boolean {
  const trimmedName = input.name.trim();
  const trimmedPrice = input.price.trim();
  if (!trimmedName || !trimmedPrice) return false;

  const menu = getBusinessMenu(businessId);
  if (!menu) return false;

  const categoryIndex = menu.categories.findIndex((c) => c.id === categoryId);
  if (categoryIndex === -1) return false;

  const category = menu.categories[categoryIndex];
  const itemIndex = category.items.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) return false;

  const updatedItem: MenuItem = {
    ...category.items[itemIndex],
    name: trimmedName,
    description: (input.description || "").trim(),
    price: trimmedPrice,
  };

  const updatedItems = [...category.items];
  updatedItems[itemIndex] = updatedItem;

  const updatedCategories = [...menu.categories];
  updatedCategories[categoryIndex] = {
    ...category,
    items: updatedItems,
  };

  saveBusinessMenu(businessId, { ...menu, categories: updatedCategories });
  return true;
}

export function deleteItem(businessId: number, categoryId: string, itemId: string): boolean {
  const menu = getBusinessMenu(businessId);
  if (!menu) return false;

  const categoryIndex = menu.categories.findIndex((c) => c.id === categoryId);
  if (categoryIndex === -1) return false;

  const category = menu.categories[categoryIndex];
  const filteredItems = category.items
    .filter((i) => i.id !== itemId)
    .map((i, idx) => ({ ...i, sortOrder: idx }));

  if (filteredItems.length === category.items.length) return false;

  const updatedCategories = [...menu.categories];
  updatedCategories[categoryIndex] = {
    ...category,
    items: filteredItems,
  };

  saveBusinessMenu(businessId, { ...menu, categories: updatedCategories });
  return true;
}

export function reorderItems(
  businessId: number,
  categoryId: string,
  itemId: string,
  direction: "up" | "down"
): boolean {
  const menu = getBusinessMenu(businessId);
  if (!menu) return false;

  const categoryIndex = menu.categories.findIndex((c) => c.id === categoryId);
  if (categoryIndex === -1) return false;

  const category = menu.categories[categoryIndex];
  const itemIndex = category.items.findIndex((i) => i.id === itemId);
  if (itemIndex === -1) return false;

  const targetIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
  if (targetIndex < 0 || targetIndex >= category.items.length) return false;

  const updatedItems = [...category.items];
  const [moved] = updatedItems.splice(itemIndex, 1);
  updatedItems.splice(targetIndex, 0, moved);

  const reindexed = updatedItems.map((i, idx) => ({ ...i, sortOrder: idx }));

  const updatedCategories = [...menu.categories];
  updatedCategories[categoryIndex] = {
    ...category,
    items: reindexed,
  };

  saveBusinessMenu(businessId, { ...menu, categories: updatedCategories });
  return true;
}

// -------------------------------------------------------------
// Summary helpers
// -------------------------------------------------------------

export type MenuSummary = {
  categoryCount: number;
  itemCount: number;
  hasMenu: boolean;
};

export function getMenuSummary(businessId: number): MenuSummary {
  const menu = getBusinessMenu(businessId);
  if (!menu || menu.categories.length === 0) {
    return { categoryCount: 0, itemCount: 0, hasMenu: false };
  }

  const categoryCount = menu.categories.length;
  const itemCount = menu.categories.reduce((acc, cat) => acc + cat.items.length, 0);

  return {
    categoryCount,
    itemCount,
    hasMenu: categoryCount > 0,
  };
}
