import { api } from "./client";
import type { FoodSearchResponse, Pagination, SearchParams, SearchResult } from "./types";

export interface SearchBusinessesResult {
  results: SearchResult[];
  pagination?: Pagination;
}

/**
 * Searches published businesses by text query against name, description, cuisine, neighborhood, and menu items.
 */
export async function searchBusinesses(
  params: SearchParams,
): Promise<SearchBusinessesResult> {
  const queryParams: Record<string, string | number | undefined> = {
    q: params.q,
  };
  if (params.limit !== undefined) queryParams.limit = params.limit;
  if (params.offset !== undefined) queryParams.offset = params.offset;

  const res = await api.get<SearchResult[]>("/api/v1/search", {
    params: queryParams,
  });

  return {
    results: res.data || [],
    pagination: res.pagination,
  };
}

/**
 * Searches food items by text query against canonical dishes, aliases, and menu items.
 * Returns restaurant-oriented food discovery results.
 */
export async function searchFood(
  params: SearchParams,
): Promise<FoodSearchResponse> {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.q !== undefined) queryParams.q = params.q;
  if (params.limit !== undefined) queryParams.limit = params.limit;
  if (params.offset !== undefined) queryParams.offset = params.offset;
  if (params.max_price !== undefined) queryParams.max_price = params.max_price;
  if (params.min_price !== undefined) queryParams.min_price = params.min_price;
  if (params.min_rating !== undefined) queryParams.min_rating = params.min_rating;
  if (params.neighborhood !== undefined) queryParams.neighborhood = params.neighborhood;
  if (params.area !== undefined) queryParams.area = params.area;

  const res = await api.get<FoodSearchResponse>("/api/v1/dishes/search", {
    params: queryParams,
  });

  const data = res.data;
  if (!data) {
    return { canonical_dish: null, items: [], results: [] };
  }
  const items = data.items || data.results || [];
  return {
    canonical_dish: data.canonical_dish || null,
    items,
    results: items,
  };
}
