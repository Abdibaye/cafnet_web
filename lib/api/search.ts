import { api } from "./client";
import type { Pagination, SearchParams, SearchResult } from "./types";

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
