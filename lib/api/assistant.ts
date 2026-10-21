import { api } from "./client";
import type {
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantSession,
} from "./types";

/**
 * Sends a natural language food discovery prompt to the AI assistant.
 * Returns grounded restaurant menu recommendations with real prices and business info.
 */
export async function chatWithAssistant(
  req: AssistantChatRequest,
): Promise<AssistantChatResponse> {
  const res = await api.post<AssistantChatResponse>("/api/v1/assistant/chat", req);
  const data = res.data;
  const items = (data.items && data.items.length > 0)
    ? data.items
    : (data.results && data.results.length > 0)
      ? data.results
      : [];
  return {
    ...data,
    items,
    results: items,
  };
}

/**
 * Retrieves the message history and state of an existing assistant conversation session.
 */
export async function getAssistantSession(
  sessionID: string,
): Promise<AssistantSession> {
  const res = await api.get<AssistantSession>(`/api/v1/assistant/sessions/${encodeURIComponent(sessionID)}`);
  return res.data;
}

/**
 * Explicitly initializes a new assistant chat session.
 */
export async function createAssistantSession(
  title?: string,
): Promise<AssistantSession> {
  const res = await api.post<AssistantSession>("/api/v1/assistant/sessions", { title });
  return res.data;
}
