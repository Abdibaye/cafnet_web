import { mockBusinesses, type MockBusiness } from "@/data/mockBusinesses";

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function searchableMenuText(business: MockBusiness) {
  return business.menu.flatMap((category) => [
    category.category,
    ...category.items.flatMap((item) => [item.name, item.description]),
  ]).join(" ");
}

function scoreBusiness(business: MockBusiness, query: string) {
  const normalizedQuery = normalize(query);
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  const name = normalize(business.name);
  const category = normalize(`${business.category} ${business.cuisine}`);
  const location = normalize(`${business.location} ${business.neighborhood}`);
  const supportingText = normalize(`${business.tags.join(" ")} ${business.description} ${business.shortDescription} ${searchableMenuText(business)}`);
  const fields = [name, category, location, supportingText];
  const matchesAllTokens = queryTokens.every((token) => fields.some((field) => field.includes(token)));

  if (!matchesAllTokens) return 0;

  let score = 0;
  if (name === normalizedQuery) score += 1000;
  else if (name.includes(normalizedQuery)) score += 700;
  if (category.includes(normalizedQuery)) score += 500;
  if (location.includes(normalizedQuery)) score += 350;
  if (supportingText.includes(normalizedQuery)) score += 200;
  if (score === 0) score = queryTokens.length * 100;

  return score;
}

export function searchBusinesses(query: string, businesses: MockBusiness[] = mockBusinesses) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  return businesses
    .map((business) => ({ business, score: scoreBusiness(business, normalizedQuery) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.business.rating - a.business.rating || a.business.id - b.business.id)
    .map(({ business }) => business);
}