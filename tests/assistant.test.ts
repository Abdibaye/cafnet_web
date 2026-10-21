import test from "node:test";
import assert from "node:assert/strict";
import { chatWithAssistant, getAssistantSession, createAssistantSession } from "../lib/api/assistant";
import type { AssistantChatResponse, AssistantSession } from "../lib/api/types";

test("assistantApi: chatWithAssistant posts request and normalizes items/results", async () => {
  const originalFetch = global.fetch;

  let capturedUrl = "";
  let capturedMethod = "";
  let capturedBody: any = null;

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedMethod = init?.method || "GET";
    capturedBody = init?.body ? JSON.parse(init.body as string) : null;

    const mockResponse: { status: string; data: AssistantChatResponse } = {
      status: "success",
      data: {
        session_id: "sess-12345",
        message: "Here are top spots for kitfo in Bole under 350 ETB:",
        intent: "food_search",
        search_filter: {
          query: "Kitfo",
          max_price_etb_minor: 35000,
          neighborhood: "Bole",
        },
        canonical_dish: {
          id: "dish-kitfo",
          name: "Kitfo",
          slug: "kitfo",
          description: "Minced beef with mitmita and kibbeh",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        results: [
          {
            business: {
              id: 101,
              name: "Gojo Traditional Kitfo",
              slug: "gojo-traditional",
              category: "restaurant",
              cuisine: "Ethiopian",
              description: "Famous kitfo house",
              short_description: "Famous kitfo",
              location_name: "Bole",
              neighborhood: "Bole",
              phone: "+251911223344",
              price_range: "$$",
              tags: ["kitfo", "traditional"],
              payment_methods: ["cash", "telebirr"],
              reservation_available: true,
              publication_status: "PUBLISHED",
              verification_status: "VERIFIED",
              claim_status: "CLAIMED",
              creation_source: "ADMIN_CREATED",
              is_featured: true,
              gallery_count: 3,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            menu_item: {
              id: "item-001",
              category_id: "cat-001",
              business_id: 101,
              name: "Special Kitfo",
              description: "With ayib and gomen",
              price_etb_minor: 32000,
              sort_order: 1,
              is_available: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            rating: 4.8,
            review_count: 52,
            rank: 95.0,
            matched_by: "exact_dish",
          },
        ],
        items: [],
        follow_up_suggestions: ["Show with Ayib and Gomen", "Show places near Atlas"],
        fallback_used: false,
      },
    };

    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const res = await chatWithAssistant({
      message: "Where can I eat kitfo in Bole under 350 ETB?",
      location: "Bole",
    });

    assert.ok(capturedUrl.includes("/api/v1/assistant/chat"));
    assert.equal(capturedMethod, "POST");
    assert.equal(capturedBody.message, "Where can I eat kitfo in Bole under 350 ETB?");
    assert.equal(capturedBody.location, "Bole");

    assert.equal(res.session_id, "sess-12345");
    assert.equal(res.intent, "food_search");
    assert.ok(res.items.length > 0);
    assert.equal(res.items[0].menu_item.name, "Special Kitfo");
    assert.equal(res.items[0].menu_item.price_etb_minor, 32000);
    assert.equal(res.items[0].business.neighborhood, "Bole");
    assert.equal(res.follow_up_suggestions.length, 2);
  } finally {
    global.fetch = originalFetch;
  }
});

test("assistantApi: getAssistantSession fetches message history", async () => {
  const originalFetch = global.fetch;

  let capturedUrl = "";

  global.fetch = (async (input: RequestInfo | URL) => {
    capturedUrl = String(input);
    const mockSession: { status: string; data: AssistantSession } = {
      status: "success",
      data: {
        id: "sess-999",
        title: "Kitfo in Bole",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [
          {
            id: "msg-1",
            session_id: "sess-999",
            role: "user",
            content: "Kitfo in Bole",
            intent: "food_search",
            results_count: 0,
            created_at: new Date().toISOString(),
          },
          {
            id: "msg-2",
            session_id: "sess-999",
            role: "assistant",
            content: "Here are top spots for kitfo in Bole:",
            intent: "food_search",
            results_count: 1,
            created_at: new Date().toISOString(),
          },
        ],
      },
    };
    return new Response(JSON.stringify(mockSession), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const session = await getAssistantSession("sess-999");
    assert.ok(capturedUrl.includes("/api/v1/assistant/sessions/sess-999"));
    assert.equal(session.id, "sess-999");
    assert.equal(session.messages?.length, 2);
    assert.equal(session.messages[0].role, "user");
    assert.equal(session.messages[1].role, "assistant");
  } finally {
    global.fetch = originalFetch;
  }
});

test("assistantApi: createAssistantSession sends title", async () => {
  const originalFetch = global.fetch;

  let capturedBody: any = null;

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = init?.body ? JSON.parse(init.body as string) : null;
    return new Response(
      JSON.stringify({
        status: "success",
        data: {
          id: "sess-new-1",
          title: "Dinner Plan",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const session = await createAssistantSession("Dinner Plan");
    assert.equal(capturedBody.title, "Dinner Plan");
    assert.equal(session.id, "sess-new-1");
  } finally {
    global.fetch = originalFetch;
  }
});
