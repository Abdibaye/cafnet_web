type HelpfulStorage = Record<string, string[]>; // reviewId -> array of customerIds

const storageKey = "cafnet.mock-review-helpful-votes";

const emptyStorage: HelpfulStorage = {};
const memoryFallbackStorage: HelpfulStorage = {};

export function loadHelpfulVotes(): HelpfulStorage {
  if (typeof window === "undefined") return memoryFallbackStorage;
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return emptyStorage;
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return emptyStorage;

    const validated: HelpfulStorage = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (Array.isArray(value)) {
        validated[key] = value.filter((id): id is string => typeof id === "string");
      }
    }
    return validated;
  } catch {
    return emptyStorage;
  }
}

export function saveHelpfulVotes(state: HelpfulStorage) {
  if (typeof window === "undefined") {
    for (const key of Object.keys(memoryFallbackStorage)) {
      delete memoryFallbackStorage[key];
    }
    Object.assign(memoryFallbackStorage, state);
    return;
  }
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("cafnet:helpful-votes-updated"));
  } catch {
    // Ignore storage write failures
  }
}

export function isReviewHelpfulVoted(reviewId: string, customerId: string): boolean {
  if (!customerId) return false;
  const state = loadHelpfulVotes();
  const voters = state[reviewId] || [];
  return voters.includes(customerId);
}

export function getHelpfulVotesCount(reviewId: string, baseCount: number = 0): number {
  const state = loadHelpfulVotes();
  return baseCount + (state[reviewId] || []).length;
}

export function toggleHelpfulVote(
  reviewId: string,
  customerId: string,
  baseCount: number = 0
): { voted: boolean; currentCount: number } {
  if (!customerId) return { voted: false, currentCount: getHelpfulVotesCount(reviewId, baseCount) };

  const state = loadHelpfulVotes();
  const currentVoters = state[reviewId] || [];
  const exists = currentVoters.includes(customerId);

  let newVoters: string[];
  if (exists) {
    newVoters = currentVoters.filter((id) => id !== customerId);
  } else {
    newVoters = [...currentVoters, customerId];
  }

  const updatedState: HelpfulStorage = {
    ...state,
    [reviewId]: newVoters,
  };

  saveHelpfulVotes(updatedState);
  return { voted: !exists, currentCount: baseCount + newVoters.length };
}
