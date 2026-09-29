import test from "node:test";
import assert from "node:assert/strict";
import { ApiError } from "../lib/api/errors";
import { apiClient, api } from "../lib/api/client";
import * as authApi from "../lib/api/auth";
import * as businessesApi from "../lib/api/businesses";
import * as searchApi from "../lib/api/search";
import * as customerApi from "../lib/api/customer";
import {
  formatPriceEtb,
  formatHours,
  businessToCardItem,
  publicProfileToViewModel,
} from "../lib/api/adapters";
import type {
  Business,
  BusinessHours,
  PublicBusinessProfile,
} from "../lib/api/types";

// ==========================================
// 1. ApiError Class & Classification
// ==========================================
test("ApiError correctly classifies HTTP status codes and error codes", () => {
  const unauth = new ApiError("Sign in required", 401, "unauthenticated");
  assert.equal(unauth.isUnauthorized(), true);
  assert.equal(unauth.isForbidden(), false);
  assert.equal(unauth.isClientError(), true);
  assert.equal(unauth.isServerError(), false);

  const forbidden = new ApiError("Access denied", 403, "forbidden");
  assert.equal(forbidden.isForbidden(), true);
  assert.equal(forbidden.isUnauthorized(), false);

  const notFound = new ApiError("Business not found", 404, "resource_not_found");
  assert.equal(notFound.isNotFound(), true);

  const conflict = new ApiError("Already booked", 409, "conflict");
  assert.equal(conflict.isConflict(), true);

  const rateLimit = new ApiError("Too many attempts", 429, "rate_limited");
  assert.equal(rateLimit.isRateLimited(), true);

  const network = ApiError.networkError(new Error("Connection refused"));
  assert.equal(network.isNetworkError(), true);
  assert.equal(network.status, 0);

  const fromEnvelope = ApiError.fromResponse(
    400,
    {
      error: {
        code: "invalid_otp",
        message: "The verification code entered is incorrect",
        request_id: "req-12345",
      },
    },
    "req-header-fallback",
  );
  assert.equal(fromEnvelope.status, 400);
  assert.equal(fromEnvelope.code, "invalid_otp");
  assert.equal(fromEnvelope.message, "The verification code entered is incorrect");
  assert.equal(fromEnvelope.requestId, "req-12345");
});

// ==========================================
// 2. Adapters & Formatting Helpers
// ==========================================
test("formatPriceEtb formats minor santims into ETB properly", () => {
  assert.equal(formatPriceEtb(25000), "250 ETB");
  assert.equal(formatPriceEtb(12050), "120.50 ETB");
  assert.equal(formatPriceEtb(0), "0 ETB");
});

test("formatHours formats schedules accurately", () => {
  assert.equal(formatHours([]), "Hours not available");

  const dailyHours: BusinessHours[] = [
    { id: "1", business_id: 10, day_of_week: 0, opens_at: "08:00:00", closes_at: "22:00:00", is_closed: false },
    { id: "2", business_id: 10, day_of_week: 1, opens_at: "08:00:00", closes_at: "22:00:00", is_closed: false },
    { id: "3", business_id: 10, day_of_week: 2, opens_at: "08:00:00", closes_at: "22:00:00", is_closed: false },
    { id: "4", business_id: 10, day_of_week: 3, opens_at: "08:00:00", closes_at: "22:00:00", is_closed: false },
    { id: "5", business_id: 10, day_of_week: 4, opens_at: "08:00:00", closes_at: "22:00:00", is_closed: false },
    { id: "6", business_id: 10, day_of_week: 5, opens_at: "08:00:00", closes_at: "22:00:00", is_closed: false },
    { id: "7", business_id: 10, day_of_week: 6, opens_at: "08:00:00", closes_at: "22:00:00", is_closed: false },
  ];
  assert.equal(formatHours(dailyHours), "Daily: 8:00 AM - 10:00 PM");

  const closedAll: BusinessHours[] = [
    { id: "1", business_id: 10, day_of_week: 0, is_closed: true },
  ];
  assert.equal(formatHours(closedAll), "Closed");
});

test("businessToCardItem converts API business model to UI card item", () => {
  const sampleBiz: Business = {
    id: 101,
    name: "Tomoca Coffee",
    slug: "tomoca-coffee",
    category: "cafe",
    cuisine: "Specialty Buna",
    description: "Legendary Addis Ababa coffee roaster.",
    short_description: "Legendary buna roaster.",
    location_name: "Piazza",
    neighborhood: "Piazza",
    phone: "+251911223344",
    price_range: "$",
    tags: ["Authentic Buna", "Historic"],
    payment_methods: ["Cash", "Telebirr"],
    reservation_available: false,
    publication_status: "PUBLISHED",
    verification_status: "VERIFIED",
    claim_status: "CLAIMED",
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const card = businessToCardItem(sampleBiz);
  assert.equal(card.id, 101);
  assert.equal(card.name, "Tomoca Coffee");
  assert.equal(card.description, "Legendary buna roaster.");
  assert.equal(card.location, "Piazza, 350m");
  assert.equal(card.tags.includes("Authentic Buna"), true);
});

test("publicProfileToViewModel constructs rich view model matching frontend components", () => {
  const profile: PublicBusinessProfile = {
    business: {
      id: 201,
      name: "Habesha Kitchen",
      slug: "habesha-kitchen",
      category: "restaurant",
      cuisine: "Ethiopian",
      description: "Authentic cuisine and cultural evenings.",
      short_description: "Authentic cuisine.",
      location_name: "Bole Medhanialem",
      neighborhood: "Bole",
      phone: "+251911998877",
      price_range: "$$",
      tags: ["Wi-Fi available", "Live music", "Family friendly"],
      payment_methods: ["Telebirr", "Cash"],
      reservation_available: true,
      publication_status: "PUBLISHED",
      verification_status: "VERIFIED",
      claim_status: "CLAIMED",
      is_featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    hours: [
      { id: "h1", business_id: 201, day_of_week: 1, opens_at: "10:00:00", closes_at: "22:00:00", is_closed: false },
    ],
    images: [
      { id: "img1", business_id: 201, image_url: "/images/habesha1.jpg", sort_order: 1, created_at: new Date().toISOString() },
    ],
    menu: {
      business_id: 201,
      categories: [
        {
          category: {
            id: "cat1",
            business_id: 201,
            name: "Main Dishes",
            sort_order: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          items: [
            {
              id: "item1",
              category_id: "cat1",
              business_id: 201,
              name: "Doro Wat",
              description: "Spicy chicken stew",
              price_etb_minor: 35000,
              sort_order: 1,
              is_available: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        },
      ],
    },
    active_updates: [],
    review_summary: {
      business_id: 201,
      count: 42,
      average: 4.9,
      distribution: [35, 5, 2, 0, 0],
    },
    recent_reviews: [],
  };

  const vm = publicProfileToViewModel(profile);
  assert.equal(vm.id, 201);
  assert.equal(vm.name, "Habesha Kitchen");
  assert.equal(vm.verified, true);
  assert.equal(vm.reservationAvailable, true);
  assert.equal(vm.claimStatus, "claimed");
  assert.equal(vm.menu.length, 1);
  assert.equal(vm.menu[0].category, "Main Dishes");
  assert.equal(vm.menu[0].items[0].price, "350 ETB");
  assert.equal(vm.amenities.includes("Wi-Fi available"), true);
  assert.equal(vm.highlights.includes("Live music"), true);
});

// ==========================================
// 3. API Client & Endpoint Wrappers Mocking Fetch
// ==========================================
test("apiClient enforces credentials: include and parses envelopes", async () => {
  const originalFetch = globalThis.fetch;
  let interceptedUrl = "";
  let interceptedInit: RequestInit | undefined;

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    interceptedUrl = String(url);
    interceptedInit = init;
    return new Response(
      JSON.stringify({
        data: { testKey: "testVal" },
        pagination: { limit: 10, offset: 0, has_more: false },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "X-Request-ID": "test-req-id" },
      },
    );
  }) as typeof fetch;

  try {
    const res = await api.get<{ testKey: string }>("/api/v1/test", {
      params: { page: 1, filter: "active" },
    });

    assert.equal(interceptedUrl.includes("/api/v1/test?page=1&filter=active"), true);
    assert.equal(interceptedInit?.credentials, "include");
    assert.equal(res.data.testKey, "testVal");
    assert.equal(res.pagination?.limit, 10);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("authApi handles OTP request, verify, logout, and getCurrentUser", async () => {
  const originalFetch = globalThis.fetch;

  let step = 0;
  globalThis.fetch = (async (url: RequestInfo | URL) => {
    const strUrl = String(url);
    if (strUrl.includes("/api/v1/auth/otp/request")) {
      return new Response(
        JSON.stringify({
          data: {
            challenge_id: "chal-999",
            expires_at: new Date(Date.now() + 300000).toISOString(),
            cooldown_seconds: 60,
            dev_otp: "123456",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (strUrl.includes("/api/v1/auth/otp/verify")) {
      return new Response(
        JSON.stringify({
          data: {
            user: {
              id: "usr-1",
              phone: "+251911223344",
              full_name: "Abebe B.",
              role: "CUSTOMER",
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            is_new_user: false,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (strUrl.includes("/api/v1/auth/logout")) {
      return new Response(
        JSON.stringify({ data: { logged_out: true } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (strUrl.includes("/api/v1/auth/me")) {
      step++;
      if (step === 1) {
        return new Response(
          JSON.stringify({
            data: {
              id: "usr-1",
              phone: "+251911223344",
              full_name: "Abebe B.",
              role: "CUSTOMER",
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          error: { code: "unauthenticated", message: "Credentials required" },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ error: { code: "not_found", message: "Not found" } }), { status: 404 });
  }) as typeof fetch;

  try {
    const otpRes = await authApi.requestOtp("+251911223344");
    assert.equal(otpRes.challenge_id, "chal-999");
    assert.equal(otpRes.dev_otp, "123456");

    const authRes = await authApi.verifyOtp("chal-999", "+251911223344", "123456");
    assert.equal(authRes.user.phone, "+251911223344");

    const me = await authApi.getCurrentUser();
    assert.equal(me?.id, "usr-1");

    const unauthMe = await authApi.getCurrentUser();
    assert.equal(unauthMe, null); // 401 gracefully returns null

    const logoutRes = await authApi.logout();
    assert.equal(logoutRes.logged_out, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("customerApi handles saved and followed places", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    const strUrl = String(url);
    const method = init?.method || "GET";

    if (strUrl.includes("/api/v1/saved/42") && method === "POST") {
      return new Response(JSON.stringify({ data: { saved: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (strUrl.includes("/api/v1/saved/42") && method === "DELETE") {
      return new Response(JSON.stringify({ data: { saved: false } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (strUrl.includes("/api/v1/saved") && method === "GET") {
      return new Response(JSON.stringify({ data: [{ id: 42, name: "Saved Place" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (strUrl.includes("/api/v1/following/42") && method === "POST") {
      return new Response(JSON.stringify({ data: { following: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (strUrl.includes("/api/v1/following") && method === "GET") {
      return new Response(JSON.stringify({ data: [{ id: 42, name: "Followed Place" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: { code: "not_found" } }), { status: 404 });
  }) as typeof fetch;

  try {
    const saveRes = await customerApi.saveBusiness(42);
    assert.equal(saveRes.saved, true);

    const savedList = await customerApi.getSavedBusinesses();
    assert.equal(savedList.length, 1);
    assert.equal(savedList[0].id, 42);

    const unsaveRes = await customerApi.unsaveBusiness(42);
    assert.equal(unsaveRes.saved, false);

    const followRes = await customerApi.followBusiness(42);
    assert.equal(followRes.following, true);

    const followedList = await customerApi.getFollowedBusinesses();
    assert.equal(followedList.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
