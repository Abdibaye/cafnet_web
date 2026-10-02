import test from "node:test";
import assert from "node:assert/strict";
import { ApiError } from "../lib/api/errors";
import { apiClient, api } from "../lib/api/client";
import * as authApi from "../lib/api/auth";
import * as businessesApi from "../lib/api/businesses";
import * as searchApi from "../lib/api/search";
import * as customerApi from "../lib/api/customer";
import * as reservationsApi from "../lib/api/reservations";
import * as reviewsApi from "../lib/api/reviews";
import * as updatesApi from "../lib/api/updates";
import * as reportsApi from "../lib/api/reports";
import * as menusApi from "../lib/api/menus";
import * as mediaApi from "../lib/api/media";
import * as adapters from "../lib/api/adapters";
import {
  formatPriceEtb,
  formatHours,
  formatReservationTimeForApi,
  reservationToViewModel,
  reviewToViewModel,
  reviewSummaryToDistribution,
  businessToCardItem,
  publicProfileToViewModel,
  apiUpdateToStorageUpdate,
  businessToViewModel,
  businessHoursToOpeningHours,
  timeStringTo24Hour,
  openingHoursToBusinessHours,
  businessToEditableData,
  editableDataToUpdateInput,
  apiClaimToViewModel,
  apiSubmissionToViewModel,
  businessToOwnerManaged,
  parsePriceToMinorSantims,
  apiMenuToViewModel,
  computeMenuSummary,
} from "../lib/api/adapters";
import type {
  Business,
  BusinessHours,
  PublicBusinessProfile,
  Reservation,
  Review,
  ReviewSummary,
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

test("authApi handles email/password signup, signin, logout, and getCurrentUser", async () => {
  const originalFetch = globalThis.fetch;

  let signupCalled = false;
  let signinCalled = false;

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    const strUrl = String(url);
    if (strUrl.includes("/api/v1/auth/signup")) {
      signupCalled = true;
      const body = JSON.parse(String(init?.body || "{}"));
      assert.equal(body.name, "Samuel Kebede");
      assert.equal(body.email, "samuel@example.com");
      assert.equal(body.password, "password123");
      return new Response(
        JSON.stringify({
          data: {
            user: {
              id: "usr-email-1",
              email: "samuel@example.com",
              full_name: "Samuel Kebede",
              role: "CUSTOMER",
              is_active: true,
              profile_completed: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }
    if (strUrl.includes("/api/v1/auth/signin")) {
      signinCalled = true;
      const body = JSON.parse(String(init?.body || "{}"));
      assert.equal(body.email, "samuel@example.com");
      assert.equal(body.password, "password123");
      return new Response(
        JSON.stringify({
          data: {
            user: {
              id: "usr-email-1",
              email: "samuel@example.com",
              full_name: "Samuel Kebede",
              role: "CUSTOMER",
              is_active: true,
              profile_completed: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
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
    return new Response(JSON.stringify({ error: { code: "not_found", message: "Not found" } }), { status: 404 });
  }) as typeof fetch;

  try {
    const signupRes = await authApi.signup({
      name: "Samuel Kebede",
      email: "samuel@example.com",
      password: "password123",
    });
    assert.equal(signupCalled, true);
    assert.equal(signupRes.user.email, "samuel@example.com");
    assert.equal(signupRes.user.full_name, "Samuel Kebede");

    const signinRes = await authApi.signin({
      email: "samuel@example.com",
      password: "password123",
    });
    assert.equal(signinCalled, true);
    assert.equal(signinRes.user.email, "samuel@example.com");

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

// ==========================================
// 7. Reservation & Review Adapters
// ==========================================
test("formatReservationTimeForApi converts 12-hour AM/PM to 24-hour time string", () => {
  assert.equal(formatReservationTimeForApi("7:00 PM"), "19:00:00");
  assert.equal(formatReservationTimeForApi("7:30 PM"), "19:30:00");
  assert.equal(formatReservationTimeForApi("12:00 PM"), "12:00:00");
  assert.equal(formatReservationTimeForApi("12:00 AM"), "00:00:00");
  assert.equal(formatReservationTimeForApi("18:45"), "18:45:00");
});

test("reservationToViewModel converts Go domain model to UI view model", () => {
  const sampleRes: Reservation = {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    reservation_code: "CAF-1001",
    business_id: 1,
    customer_user_id: "user-123",
    customer_name: "Abdi User",
    customer_phone: "+251911223344",
    reservation_date: "2026-10-15T00:00:00Z",
    reservation_time: "19:30:00",
    party_size: 4,
    special_request: "Quiet booth please",
    status: "CONFIRMED",
    created_at: "2026-10-01T12:00:00Z",
    updated_at: "2026-10-01T12:00:00Z",
  };

  const vm = reservationToViewModel(sampleRes);
  assert.equal(vm.id, "a1b2c3d4-e5f6-7890-abcd-ef1234567890");
  assert.equal(vm.businessId, 1);
  assert.equal(vm.partySize, 4);
  assert.equal(vm.time, "7:30 PM");
  assert.equal(vm.status, "confirmed");
  assert.equal(vm.date, "2026-10-15");
  assert.equal(vm.specialRequest, "Quiet booth please");
});

test("reviewToViewModel and reviewSummaryToDistribution convert domain reviews accurately", () => {
  const sampleRev: Review = {
    id: "rev-uuid-12345",
    business_id: 1,
    customer_user_id: "user-123",
    reservation_id: "res-uuid-67890",
    rating: 5,
    review_text: "Incredible tibs and coffee ceremony!",
    is_verified_visit: true,
    status: "VISIBLE",
    helpful_count: 14,
    created_at: "2026-10-02T15:30:00Z",
    updated_at: "2026-10-02T15:30:00Z",
  };

  const vm = reviewToViewModel(sampleRev, "Dawit K.");
  assert.equal(vm.id, "rev-uuid-12345");
  assert.equal(vm.businessId, 1);
  assert.equal(vm.rating, 5);
  assert.equal(vm.userName, "Dawit K.");
  assert.equal(vm.userAvatar, "D");
  assert.equal(vm.verifiedVisit, true);
  assert.equal(vm.helpfulCount, 14);

  const summary: ReviewSummary = {
    business_id: 1,
    count: 25,
    average: 4.8,
    distribution: [18, 5, 2, 0, 0],
  };
  const dist = reviewSummaryToDistribution(summary);
  assert.equal(dist.count, 25);
  assert.equal(dist.average, 4.8);
  assert.deepEqual(dist.distribution, [18, 5, 2, 0, 0]);
});

// ==========================================
// 8. Reservations API Endpoints
// ==========================================
test("reservationsApi handles create, list, get, and cancel", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const strUrl = String(input);
    const method = init?.method || "GET";

    if (strUrl.includes("/api/v1/reservations/cancel-uuid-123/cancel") && method === "POST") {
      return new Response(JSON.stringify({ data: { cancelled: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (strUrl.includes("/api/v1/reservations/get-uuid-123") && method === "GET") {
      return new Response(
        JSON.stringify({
          data: {
            id: "get-uuid-123",
            reservation_code: "CAF-2001",
            business_id: 5,
            customer_user_id: "user-456",
            customer_name: "Hana",
            customer_phone: "+251911000000",
            reservation_date: "2026-11-01",
            reservation_time: "19:00:00",
            party_size: 2,
            status: "PENDING",
            created_at: "2026-10-01T00:00:00Z",
            updated_at: "2026-10-01T00:00:00Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    if (strUrl.includes("/api/v1/reservations") && method === "POST") {
      const parsedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          data: {
            id: "new-res-uuid",
            reservation_code: "CAF-3001",
            business_id: parsedBody.business_id,
            customer_user_id: "user-456",
            customer_name: parsedBody.customer_name || "Guest",
            customer_phone: parsedBody.customer_phone || "+251911000000",
            reservation_date: parsedBody.reservation_date,
            reservation_time: parsedBody.reservation_time,
            party_size: parsedBody.party_size,
            special_request: parsedBody.special_request || "",
            status: "PENDING",
            created_at: "2026-10-01T00:00:00Z",
            updated_at: "2026-10-01T00:00:00Z",
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }

    if (strUrl.includes("/api/v1/reservations") && method === "GET") {
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "res-list-uuid-1",
              reservation_code: "CAF-1001",
              business_id: 1,
              customer_user_id: "user-456",
              customer_name: "Hana",
              customer_phone: "+251911000000",
              reservation_date: "2026-11-01",
              reservation_time: "20:00:00",
              party_size: 3,
              status: "CONFIRMED",
              created_at: "2026-10-01T00:00:00Z",
              updated_at: "2026-10-01T00:00:00Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: { code: "not_found" } }), { status: 404 });
  }) as typeof fetch;

  try {
    // 1. Create reservation
    const created = await reservationsApi.createReservation({
      business_id: 1,
      party_size: 4,
      reservation_date: "2026-10-20",
      reservation_time: "19:00:00",
      special_request: "Window table",
    });
    assert.equal(created.id, "new-res-uuid");
    assert.equal(created.status, "PENDING");
    assert.equal(created.party_size, 4);

    // 2. List customer reservations
    const list = await reservationsApi.listCustomerReservations();
    assert.equal(list.length, 1);
    assert.equal(list[0].id, "res-list-uuid-1");

    // 3. Get customer reservation
    const item = await reservationsApi.getCustomerReservation("get-uuid-123");
    assert.equal(item.id, "get-uuid-123");
    assert.equal(item.reservation_code, "CAF-2001");

    // 4. Cancel reservation
    const cancelRes = await reservationsApi.cancelReservation("cancel-uuid-123");
    assert.equal(cancelRes.cancelled, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("reservationsApi handles manager business reservations: list, get, confirm, decline, complete", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const strUrl = String(input);
    const method = init?.method || "GET";

    if (strUrl.includes("/api/v1/businesses/42/reservations/res-mgr-1/confirm") && method === "POST") {
      return new Response(JSON.stringify({ data: { confirmed: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (strUrl.includes("/api/v1/businesses/42/reservations/res-mgr-1/decline") && method === "POST") {
      const parsedBody = JSON.parse(init?.body as string);
      assert.equal(parsedBody.reason, "Fully booked at this hour");
      return new Response(JSON.stringify({ data: { declined: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (strUrl.includes("/api/v1/businesses/42/reservations/res-mgr-1/complete") && method === "POST") {
      return new Response(JSON.stringify({ data: { completed: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (strUrl.includes("/api/v1/businesses/42/reservations/res-mgr-1") && method === "GET") {
      return new Response(
        JSON.stringify({
          data: {
            id: "res-mgr-1",
            reservation_code: "CAF-4201",
            business_id: 42,
            customer_user_id: "user-999",
            customer_name: "Yonas",
            customer_phone: "+251911999888",
            reservation_date: "2026-11-15",
            reservation_time: "18:30:00",
            party_size: 4,
            special_request: "Quiet booth please",
            status: "PENDING",
            created_at: "2026-10-01T00:00:00Z",
            updated_at: "2026-10-01T00:00:00Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    if (strUrl.includes("/api/v1/businesses/42/reservations") && method === "GET") {
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "res-mgr-1",
              reservation_code: "CAF-4201",
              business_id: 42,
              customer_user_id: "user-999",
              customer_name: "Yonas",
              customer_phone: "+251911999888",
              reservation_date: "2026-11-15",
              reservation_time: "18:30:00",
              party_size: 4,
              special_request: "Quiet booth please",
              status: "PENDING",
              created_at: "2026-10-01T00:00:00Z",
              updated_at: "2026-10-01T00:00:00Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: { code: "not_found" } }), { status: 404 });
  }) as typeof fetch;

  try {
    // 1. List business reservations
    const list = await reservationsApi.listBusinessReservations(42);
    assert.equal(list.length, 1);
    assert.equal(list[0].id, "res-mgr-1");
    assert.equal(list[0].business_id, 42);

    // 2. Get single business reservation
    const item = await reservationsApi.getBusinessReservation(42, "res-mgr-1");
    assert.equal(item.id, "res-mgr-1");
    assert.equal(item.customer_name, "Yonas");

    // 3. Confirm reservation
    const confirmRes = await reservationsApi.confirmReservation(42, "res-mgr-1");
    assert.equal(confirmRes.confirmed, true);

    // 4. Decline reservation
    const declineRes = await reservationsApi.declineReservation(42, "res-mgr-1", "Fully booked at this hour");
    assert.equal(declineRes.declined, true);

    // 5. Complete reservation
    const completeRes = await reservationsApi.completeReservation(42, "res-mgr-1");
    assert.equal(completeRes.completed, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ==========================================
// 9. Reviews API Endpoints
// ==========================================
test("reviewsApi handles business reviews, summaries, customer creation, update, delete, helpful, and report", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const strUrl = String(input);
    const method = init?.method || "GET";

    if (strUrl.includes("/api/v1/businesses/10/reviews/summary") && method === "GET") {
      return new Response(
        JSON.stringify({
          data: {
            business_id: 10,
            count: 42,
            average: 4.7,
            distribution: [30, 8, 3, 1, 0],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    if (strUrl.includes("/api/v1/businesses/10/reviews") && method === "GET") {
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "rev-uuid-1",
              business_id: 10,
              customer_user_id: "user-1",
              reservation_id: "res-uuid-1",
              rating: 5,
              review_text: "Delicious pastry and buna!",
              is_verified_visit: true,
              status: "VISIBLE",
              helpful_count: 7,
              created_at: "2026-10-01T00:00:00Z",
              updated_at: "2026-10-01T00:00:00Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    if (strUrl.includes("/api/v1/reviews/mine") && method === "GET") {
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "rev-uuid-my-1",
              business_id: 10,
              customer_user_id: "my-user-id",
              reservation_id: "res-uuid-my-res",
              rating: 4,
              review_text: "Great atmosphere and quick service.",
              is_verified_visit: true,
              status: "VISIBLE",
              helpful_count: 2,
              created_at: "2026-10-01T00:00:00Z",
              updated_at: "2026-10-01T00:00:00Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    if (strUrl.includes("/api/v1/reviews/rev-uuid-1/helpful") && method === "POST") {
      return new Response(JSON.stringify({ data: { helpful: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (strUrl.includes("/api/v1/reviews/rev-uuid-1/helpful") && method === "DELETE") {
      return new Response(JSON.stringify({ data: { helpful: false } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (strUrl.includes("/api/v1/reviews/rev-uuid-1/reports") && method === "POST") {
      return new Response(
        JSON.stringify({
          data: {
            id: "rep-uuid-1",
            review_id: "rev-uuid-1",
            reporter_user_id: "my-user-id",
            reason: "spam",
            explanation: "Suspicious advertising content",
            status: "PENDING",
            created_at: "2026-10-01T00:00:00Z",
            updated_at: "2026-10-01T00:00:00Z",
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }

    if (strUrl.includes("/api/v1/reviews/rev-uuid-my-1") && method === "PATCH") {
      const parsedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          data: {
            id: "rev-uuid-my-1",
            business_id: 10,
            customer_user_id: "my-user-id",
            reservation_id: "res-uuid-my-res",
            rating: parsedBody.rating,
            review_text: parsedBody.review_text,
            is_verified_visit: true,
            status: "VISIBLE",
            helpful_count: 2,
            created_at: "2026-10-01T00:00:00Z",
            updated_at: "2026-10-01T01:00:00Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    if (strUrl.includes("/api/v1/reviews/rev-uuid-my-1") && method === "DELETE") {
      return new Response(JSON.stringify({ data: { deleted: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (strUrl.includes("/api/v1/reviews") && method === "POST") {
      const parsedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          data: {
            id: "rev-uuid-created",
            business_id: 10,
            customer_user_id: "my-user-id",
            reservation_id: parsedBody.reservation_id,
            rating: parsedBody.rating,
            review_text: parsedBody.review_text,
            is_verified_visit: true,
            status: "VISIBLE",
            helpful_count: 0,
            created_at: "2026-10-01T00:00:00Z",
            updated_at: "2026-10-01T00:00:00Z",
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: { code: "not_found" } }), { status: 404 });
  }) as typeof fetch;

  try {
    // 1. List business reviews & summary
    const bizReviews = await reviewsApi.listBusinessReviews(10);
    assert.equal(bizReviews.length, 1);
    assert.equal(bizReviews[0].id, "rev-uuid-1");

    const summary = await reviewsApi.getReviewSummary(10);
    assert.equal(summary.count, 42);
    assert.equal(summary.average, 4.7);

    // 2. Create review
    const createdRev = await reviewsApi.createReview({
      reservation_id: "completed-res-uuid",
      rating: 5,
      review_text: "Best dining experience in Addis Ababa!",
    });
    assert.equal(createdRev.id, "rev-uuid-created");
    assert.equal(createdRev.is_verified_visit, true);

    // 3. Update review
    const updatedRev = await reviewsApi.updateReview("rev-uuid-my-1", {
      rating: 5,
      review_text: "Updated: Absolutely perfect experience.",
    });
    assert.equal(updatedRev.rating, 5);
    assert.equal(updatedRev.review_text, "Updated: Absolutely perfect experience.");

    // 4. Delete review
    const deleteRes = await reviewsApi.deleteReview("rev-uuid-my-1");
    assert.equal(deleteRes.deleted, true);

    // 5. Helpful toggle
    const markRes = await reviewsApi.markReviewHelpful("rev-uuid-1");
    assert.equal(markRes.helpful, true);

    const unmarkRes = await reviewsApi.unmarkReviewHelpful("rev-uuid-1");
    assert.equal(unmarkRes.helpful, false);

    // 6. List my reviews
    const myReviews = await reviewsApi.listMyReviews();
    assert.equal(myReviews.length, 1);
    assert.equal(myReviews[0].customer_user_id, "my-user-id");

    // 7. Report review
    const reportRes = await reviewsApi.reportReview("rev-uuid-1", {
      reason: "spam",
      explanation: "Suspicious advertising content",
    });
    assert.equal(reportRes.status, "PENDING");
    assert.equal(reportRes.reason, "spam");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ==========================================
// 8. Updates & Business Reports API Integration
// ==========================================
test("apiUpdateToStorageUpdate converts API updates to storage format", () => {
  const apiUpdate = {
    id: "upd-123",
    business_id: 42,
    author_user_id: "usr-456",
    update_type: "OFFER" as const,
    title: "Special Lunch Discount",
    description: "20% off all pasta dishes today only!",
    status: "PUBLISHED" as const,
    event_date: "2026-10-01",
    event_time: "12:00 PM",
    price_text: "250 ETB",
    offer_details: "20% off",
    valid_until: "2026-10-01",
    published_at: "2026-09-29T10:00:00Z",
    created_at: "2026-09-29T10:00:00Z",
    updated_at: "2026-09-29T10:00:00Z",
  };

  const adapted = apiUpdateToStorageUpdate(apiUpdate);
  assert.equal(adapted.id, "upd-123");
  assert.equal(adapted.businessId, 42);
  assert.equal(adapted.type, "offer");
  assert.equal(adapted.title, "Special Lunch Discount");
  assert.equal(adapted.description, "20% off all pasta dishes today only!");
  assert.equal(adapted.status, "published");
  assert.equal(adapted.price, "250 ETB");
  assert.equal(adapted.offerDetails, "20% off");
  assert.equal(adapted.eventDate, "2026-10-01");
  assert.equal(adapted.eventTime, "12:00 PM");
});

test("updatesApi and reportsApi correctly invoke backend endpoints", async () => {
  const originalFetch = globalThis.fetch;
  const mockCalls: { url: string; method: string; body?: unknown }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = typeof input === "string" ? input : input.toString();
    const method = init?.method || "GET";
    const body = init?.body ? JSON.parse(init.body as string) : undefined;
    mockCalls.push({ url: urlStr, method, body });

    // 1. GET /api/v1/updates
    if (urlStr.includes("/api/v1/updates?limit=6")) {
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "upd-1",
              business_id: 1,
              author_user_id: "usr-1",
              update_type: "EVENT",
              title: "Live Jazz Night",
              description: "Enjoy jazz music every Friday evening.",
              status: "PUBLISHED",
              published_at: "2026-09-29T12:00:00Z",
              created_at: "2026-09-29T12:00:00Z",
              updated_at: "2026-09-29T12:00:00Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // 2. GET /api/v1/following/updates
    if (urlStr.includes("/api/v1/following/updates")) {
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "upd-2",
              business_id: 2,
              author_user_id: "usr-2",
              update_type: "ANNOUNCEMENT",
              title: "Holiday Schedule Notice",
              description: "We are open on Meskel holiday.",
              status: "PUBLISHED",
              published_at: "2026-09-29T12:00:00Z",
              created_at: "2026-09-29T12:00:00Z",
              updated_at: "2026-09-29T12:00:00Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // 3. GET /api/v1/businesses/1/updates
    if (urlStr.includes("/api/v1/businesses/1/updates")) {
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "upd-1",
              business_id: 1,
              author_user_id: "usr-1",
              update_type: "EVENT",
              title: "Live Jazz Night",
              description: "Enjoy jazz music every Friday evening.",
              status: "PUBLISHED",
              published_at: "2026-09-29T12:00:00Z",
              created_at: "2026-09-29T12:00:00Z",
              updated_at: "2026-09-29T12:00:00Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // 4. POST /api/v1/businesses/1/reports
    if (urlStr.includes("/api/v1/businesses/1/reports") && method === "POST") {
      return new Response(
        JSON.stringify({
          data: {
            id: "rep-uuid-1",
            business_id: 1,
            reporter_user_id: "my-user-id",
            reason: body.reason,
            details: body.details,
            status: "PENDING",
            created_at: "2026-09-29T12:00:00Z",
            updated_at: "2026-09-29T12:00:00Z",
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: { message: "Not found" } }), { status: 404 });
  }) as unknown as typeof fetch;

  try {
    // 1. List active updates
    const active = await updatesApi.listActiveUpdates({ limit: 6 });
    assert.equal(active.length, 1);
    assert.equal(active[0].title, "Live Jazz Night");

    // 2. List following updates
    const following = await updatesApi.listFollowingUpdates();
    assert.equal(following.length, 1);
    assert.equal(following[0].title, "Holiday Schedule Notice");

    // 3. List business updates
    const bizUpdates = await updatesApi.listBusinessUpdates(1);
    assert.equal(bizUpdates.length, 1);
    assert.equal(bizUpdates[0].business_id, 1);

    // 4. Report business
    const rep = await reportsApi.reportBusiness(1, {
      reason: "WRONG_HOURS",
      details: "Closes at 8pm instead of 10pm",
    });
    assert.equal(rep.id, "rep-uuid-1");
    assert.equal(rep.reason, "WRONG_HOURS");
    assert.equal(rep.status, "PENDING");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ==========================================
// 16. Business Center Foundation & Profile Management Adapters
// ==========================================
test("timeStringTo24Hour converts 12-hour strings to HH:MM:SS format", () => {
  assert.equal(timeStringTo24Hour("8:00 AM"), "08:00:00");
  assert.equal(timeStringTo24Hour("10:30 PM"), "22:30:00");
  assert.equal(timeStringTo24Hour("12:00 PM"), "12:00:00");
  assert.equal(timeStringTo24Hour("12:00 AM"), "00:00:00");
  assert.equal(timeStringTo24Hour("14:30:00"), "14:30:00");
  assert.equal(timeStringTo24Hour(""), undefined);
});

test("businessHoursToOpeningHours and openingHoursToBusinessHours convert bi-directionally", () => {
  const backendHours: BusinessHours[] = [
    { id: "1", business_id: 42, day_of_week: 1, opens_at: "08:00:00", closes_at: "22:00:00", is_closed: false },
    { id: "2", business_id: 42, day_of_week: 0, opens_at: "10:00:00", closes_at: "18:00:00", is_closed: true },
  ];

  const uiHours = businessHoursToOpeningHours(backendHours);
  assert.equal(uiHours.length, 7);

  const mon = uiHours.find((h) => h.day === "Monday");
  assert.ok(mon);
  assert.equal(mon?.isClosed, false);
  assert.equal(mon?.open, "8:00 AM");
  assert.equal(mon?.close, "10:00 PM");

  const sun = uiHours.find((h) => h.day === "Sunday");
  assert.ok(sun);
  assert.equal(sun?.isClosed, true);

  const backToBackend = openingHoursToBusinessHours(uiHours, 42);
  assert.equal(backToBackend.length, 7);
  const backMon = backToBackend.find((h) => h.day_of_week === 1);
  assert.equal(backMon?.opens_at, "08:00:00");
  assert.equal(backMon?.closes_at, "22:00:00");
  assert.equal(backMon?.is_closed, false);
});

test("businessToEditableData and editableDataToUpdateInput map domain fields correctly", () => {
  const mockBiz: Business = {
    id: 101,
    name: "Tomoca Coffee",
    slug: "tomoca-coffee",
    category: "cafe",
    cuisine: "Traditional Coffee",
    description: "Famous Addis cafe",
    short_description: "Famous Addis cafe",
    location_name: "Piazza",
    neighborhood: "Piazza",
    phone: "+251911223344",
    website: "https://tomoca.et",
    price_range: "$$",
    tags: ["Wi-Fi available", "Outdoor seating"],
    payment_methods: ["Cash", "Telebirr"],
    reservation_available: false,
    publication_status: "PUBLISHED",
    verification_status: "VERIFIED",
    claim_status: "CLAIMED",
    is_featured: true,
    created_at: "2026-09-01T10:00:00Z",
    updated_at: "2026-09-02T10:00:00Z",
  };

  const editable = businessToEditableData(mockBiz, []);
  assert.equal(editable.businessId, 101);
  assert.equal(editable.name, "Tomoca Coffee");
  assert.equal(editable.phone, "+251911223344");
  assert.equal(editable.location, "Piazza");
  assert.equal(editable.website, "https://tomoca.et");
  assert.equal(editable.tags.length, 2);

  const input = editableDataToUpdateInput({
    name: " Tomoca Coffee Bole ",
    category: "cafe",
    description: " Updated description ",
    phone: "+251911998877",
    location: "Bole",
    priceRange: "$$$",
    website: "https://tomoca.com",
    tags: ["Wi-Fi available"],
  });

  assert.equal(input.name, "Tomoca Coffee Bole");
  assert.equal(input.category, "cafe");
  assert.equal(input.description, "Updated description");
  assert.equal(input.phone, "+251911998877");
  assert.equal(input.location_name, "Bole");
  assert.equal(input.price_range, "$$$");
  assert.equal(input.website, "https://tomoca.com");
  assert.deepEqual(input.tags, ["Wi-Fi available"]);
});

test("apiClaimToViewModel and apiSubmissionToViewModel normalize backend status", () => {
  const claim = apiClaimToViewModel({
    id: "claim-1",
    business_id: 5,
    claimant_user_id: "user-1",
    status: "PENDING",
    submitted_at: "2026-09-20T10:00:00Z",
    created_at: "2026-09-20T10:00:00Z",
    updated_at: "2026-09-20T10:00:00Z",
  });
  assert.equal(claim.id, "claim-1");
  assert.equal(claim.businessId, 5);
  assert.equal(claim.status, "pending");

  const sub = apiSubmissionToViewModel({
    id: "sub-1",
    submitter_user_id: "user-1",
    business_name: "New Rooftop Bar",
    category: "drinks",
    area: "Kazanchis",
    status: "APPROVED",
    submitted_at: "2026-09-20T10:00:00Z",
    reviewed_at: "2026-09-21T10:00:00Z",
    created_business_id: 99,
    created_at: "2026-09-20T10:00:00Z",
    updated_at: "2026-09-20T10:00:00Z",
  });
  assert.equal(sub.id, "sub-1");
  assert.equal(sub.businessName, "New Rooftop Bar");
  assert.equal(sub.status, "approved");
  assert.equal(sub.createdBusinessId, 99);
});

// ==========================================
// 17. Business Management, Claims, and Submissions API Integration
// ==========================================
test("businessesApi and customerApi handle management and submission endpoints", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = String(input);
    const method = init?.method || "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : null;

    // 1. GET /api/v1/businesses/managed
    if (urlStr.includes("/api/v1/businesses/managed") && method === "GET") {
      return new Response(
        JSON.stringify({
          data: [
            {
              id: 42,
              name: "Bole Lounge",
              slug: "bole-lounge",
              category: "drinks",
              cuisine: "Cocktails",
              description: "Upscale lounge",
              short_description: "Upscale lounge",
              location_name: "Bole",
              neighborhood: "Bole",
              phone: "+251911000000",
              price_range: "$$$",
              tags: ["Cocktails"],
              payment_methods: ["Cash", "Card"],
              reservation_available: true,
              publication_status: "PUBLISHED",
              verification_status: "VERIFIED",
              claim_status: "CLAIMED",
              is_featured: false,
              created_at: "2026-09-01T10:00:00Z",
              updated_at: "2026-09-01T10:00:00Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // 2. GET /api/v1/businesses/42/manage
    if (urlStr.includes("/api/v1/businesses/42/manage") && method === "GET") {
      return new Response(
        JSON.stringify({
          data: {
            id: 42,
            name: "Bole Lounge",
            slug: "bole-lounge",
            category: "drinks",
            cuisine: "Cocktails",
            description: "Upscale lounge",
            location_name: "Bole",
            phone: "+251911000000",
            price_range: "$$$",
            tags: ["Cocktails"],
            payment_methods: ["Cash"],
            reservation_available: true,
            publication_status: "PUBLISHED",
            verification_status: "VERIFIED",
            claim_status: "CLAIMED",
            created_at: "2026-09-01T10:00:00Z",
            updated_at: "2026-09-01T10:00:00Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // 3. PATCH /api/v1/businesses/42
    if (urlStr.includes("/api/v1/businesses/42") && method === "PATCH") {
      return new Response(
        JSON.stringify({
          data: {
            id: 42,
            name: body.name || "Bole Lounge",
            category: body.category || "drinks",
            cuisine: "Cocktails",
            description: body.description || "Upscale lounge",
            location_name: body.location_name || "Bole",
            phone: body.phone || "+251911000000",
            price_range: body.price_range || "$$$",
            tags: body.tags || ["Cocktails"],
            payment_methods: ["Cash"],
            reservation_available: true,
            publication_status: "PUBLISHED",
            verification_status: "VERIFIED",
            claim_status: "CLAIMED",
            created_at: "2026-09-01T10:00:00Z",
            updated_at: "2026-09-30T10:00:00Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // 4. GET /api/v1/claims
    if (urlStr.includes("/api/v1/claims") && method === "GET") {
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "claim-uuid-1",
              business_id: 15,
              user_id: "user-1",
              status: "PENDING",
              submitted_at: "2026-09-25T10:00:00Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // 5. POST /api/v1/claims
    if (urlStr.includes("/api/v1/claims") && method === "POST") {
      return new Response(
        JSON.stringify({
          data: {
            id: "claim-uuid-2",
            business_id: body.business_id,
            user_id: "user-1",
            status: "PENDING",
            submitted_at: "2026-09-30T10:00:00Z",
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }

    // 6. GET /api/v1/submissions
    if (urlStr.includes("/api/v1/submissions") && method === "GET") {
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "sub-uuid-1",
              user_id: "user-1",
              business_name: "Entoto Mountain Cafe",
              category: "cafe",
              area: "Entoto",
              status: "PENDING",
              submitted_at: "2026-09-28T10:00:00Z",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // 7. POST /api/v1/submissions
    if (urlStr.includes("/api/v1/submissions") && method === "POST") {
      return new Response(
        JSON.stringify({
          data: {
            id: "sub-uuid-2",
            user_id: "user-1",
            business_name: body.business_name,
            category: body.category,
            area: body.area,
            status: "PENDING",
            submitted_at: "2026-09-30T10:00:00Z",
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: { message: "Not found" } }), { status: 404 });
  }) as unknown as typeof fetch;

  try {
    // 1. Managed businesses
    const managed = await businessesApi.getManagedBusinesses();
    assert.equal(managed.length, 1);
    assert.equal(managed[0].name, "Bole Lounge");

    // 2. Manage detail
    const detail = await businessesApi.getManagedBusiness(42);
    assert.equal(detail.id, 42);
    assert.equal(detail.name, "Bole Lounge");

    // 3. Update managed business
    const updated = await businessesApi.updateManagedBusiness(42, {
      name: "Bole Lounge & Garden",
      description: "Updated VIP lounge",
    });
    assert.equal(updated.name, "Bole Lounge & Garden");
    assert.equal(updated.description, "Updated VIP lounge");

    // 4. Claims
    const claims = await customerApi.getMyClaims();
    assert.equal(claims.length, 1);
    assert.equal(claims[0].business_id, 15);

    const newClaim = await customerApi.submitClaim(20);
    assert.equal(newClaim.business_id, 20);
    assert.equal(newClaim.status, "PENDING");

    // 5. Submissions
    const submissions = await customerApi.getMySubmissions();
    assert.equal(submissions.length, 1);
    assert.equal(submissions[0].business_name, "Entoto Mountain Cafe");

    const newSub = await customerApi.createSubmission({
      business_name: "Piassa Pastry",
      category: "cafe",
      area: "Piazza",
    });
    assert.equal(newSub.business_name, "Piassa Pastry");
    assert.equal(newSub.status, "PENDING");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ==========================================
// 18. Business Menu Management & Money Adapters
// ==========================================

test("parsePriceToMinorSantims safely parses ETB amounts into santims", () => {
  // Integer string
  assert.equal(parsePriceToMinorSantims("125"), 12500);
  assert.equal(parsePriceToMinorSantims("0"), 0);

  // String with ETB suffix / case insensitive / whitespace
  assert.equal(parsePriceToMinorSantims("125 ETB"), 12500);
  assert.equal(parsePriceToMinorSantims("  125.50 etb  "), 12550);
  assert.equal(parsePriceToMinorSantims("250.75"), 25075);
  assert.equal(parsePriceToMinorSantims("1,500 ETB"), 150000);

  // Number input
  assert.equal(parsePriceToMinorSantims(125), 12500);
  assert.equal(parsePriceToMinorSantims(125.5), 12550);
  assert.equal(parsePriceToMinorSantims(0), 0);

  // Error cases
  assert.throws(() => parsePriceToMinorSantims(""), /Price cannot be empty/);
  assert.throws(() => parsePriceToMinorSantims("   "), /Price cannot be empty/);
  assert.throws(() => parsePriceToMinorSantims("abc"), /Invalid price number format/);
  assert.throws(() => parsePriceToMinorSantims("-50"), /Invalid price number format/);
  assert.throws(() => parsePriceToMinorSantims(-10), /Invalid price value/);
  assert.throws(() => parsePriceToMinorSantims(NaN), /Invalid price value/);
});

test("apiMenuToViewModel and computeMenuSummary correctly transform menu models", () => {
  const apiMenu = {
    business_id: 10,
    categories: [
      {
        category: {
          id: "cat-1",
          business_id: 10,
          name: "Hot Drinks",
          sort_order: 0,
          created_at: "2026-09-20T10:00:00Z",
          updated_at: "2026-09-20T10:00:00Z",
        },
        items: [
          {
            id: "item-1",
            category_id: "cat-1",
            business_id: 10,
            name: "Buna",
            description: "Traditional coffee",
            price_etb_minor: 4500,
            sort_order: 0,
            is_available: true,
            created_at: "2026-09-20T10:00:00Z",
            updated_at: "2026-09-20T10:00:00Z",
          },
          {
            id: "item-2",
            category_id: "cat-1",
            business_id: 10,
            name: "Macchiato",
            description: "Double shot",
            price_etb_minor: 6550,
            sort_order: 1,
            is_available: true,
            created_at: "2026-09-20T10:00:00Z",
            updated_at: "2026-09-20T10:00:00Z",
          },
        ],
      },
      {
        category: {
          id: "cat-2",
          business_id: 10,
          name: "Pastries",
          sort_order: 1,
          created_at: "2026-09-20T10:00:00Z",
          updated_at: "2026-09-20T10:00:00Z",
        },
        items: [],
      },
    ],
  };

  const vm = apiMenuToViewModel(apiMenu);
  assert.equal(vm.businessId, 10);
  assert.equal(vm.categories.length, 2);
  assert.equal(vm.categories[0].name, "Hot Drinks");
  assert.equal(vm.categories[0].items.length, 2);
  assert.equal(vm.categories[0].items[0].name, "Buna");
  assert.equal(vm.categories[0].items[0].price, "45 ETB");
  assert.equal(vm.categories[0].items[0].priceEtbMinor, 4500);
  assert.equal(vm.categories[0].items[1].price, "65.50 ETB");
  assert.equal(vm.categories[0].items[1].priceEtbMinor, 6550);
  assert.equal(vm.categories[1].name, "Pastries");
  assert.equal(vm.categories[1].items.length, 0);

  const summary = computeMenuSummary(vm);
  assert.equal(summary.categoryCount, 2);
  assert.equal(summary.itemCount, 2);
  assert.equal(summary.hasMenu, true);

  const emptySummary = computeMenuSummary(null);
  assert.equal(emptySummary.categoryCount, 0);
  assert.equal(emptySummary.itemCount, 0);
  assert.equal(emptySummary.hasMenu, false);
});

test("menusApi executes full CRUD and reordering calls with canonical payloads", async () => {
  const originalFetch = globalThis.fetch;
  const requests: { url: string; method: string; body?: any }[] = [];

  try {
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      requests.push({ url, method, body });

      if (url.includes("/api/v1/businesses/10/menu") && method === "GET") {
        return new Response(
          JSON.stringify({
            data: {
              business_id: 10,
              categories: [],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/api/v1/businesses/10/menu/categories/reorder") && method === "PUT") {
        return new Response(JSON.stringify({ data: { reordered: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/api/v1/businesses/10/menu/categories/cat-1/items/reorder") && method === "PUT") {
        return new Response(JSON.stringify({ data: { reordered: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/api/v1/businesses/10/menu/categories/cat-1") && method === "PATCH") {
        return new Response(
          JSON.stringify({
            data: {
              id: "cat-1",
              business_id: 10,
              name: body.name,
              sort_order: 0,
              created_at: "2026-09-20T10:00:00Z",
              updated_at: "2026-09-20T10:05:00Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/api/v1/businesses/10/menu/categories/cat-1") && method === "DELETE") {
        return new Response(JSON.stringify({ data: { deleted: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/api/v1/businesses/10/menu/categories") && method === "POST") {
        return new Response(
          JSON.stringify({
            data: {
              id: "cat-1",
              business_id: 10,
              name: body.name,
              sort_order: body.sort_order,
              created_at: "2026-09-20T10:00:00Z",
              updated_at: "2026-09-20T10:00:00Z",
            },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/api/v1/businesses/10/menu/items/item-1") && method === "PATCH") {
        return new Response(
          JSON.stringify({
            data: {
              id: "item-1",
              category_id: "cat-1",
              business_id: 10,
              name: body.name,
              price_etb_minor: body.price_etb_minor,
              sort_order: 0,
              is_available: true,
              created_at: "2026-09-20T10:00:00Z",
              updated_at: "2026-09-20T10:05:00Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/api/v1/businesses/10/menu/items/item-1") && method === "DELETE") {
        return new Response(JSON.stringify({ data: { deleted: true } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/api/v1/businesses/10/menu/items") && method === "POST") {
        return new Response(
          JSON.stringify({
            data: {
              id: "item-1",
              category_id: body.category_id,
              business_id: 10,
              name: body.name,
              price_etb_minor: body.price_etb_minor,
              sort_order: body.sort_order,
              is_available: true,
              created_at: "2026-09-20T10:00:00Z",
              updated_at: "2026-09-20T10:00:00Z",
            },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "Not found" } }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    };

    // 1. Get menu
    const menu = await menusApi.getBusinessMenu(10);
    assert.equal(menu.business_id, 10);
    assert.equal(requests[0].method, "GET");

    // 2. Create category
    const cat = await menusApi.createMenuCategory(10, { name: "Breakfast", sort_order: 0 });
    assert.equal(cat.name, "Breakfast");
    assert.equal(requests[1].method, "POST");
    assert.equal(requests[1].body.name, "Breakfast");

    // 3. Update category
    const updatedCat = await menusApi.updateMenuCategory(10, "cat-1", { name: "All-Day Breakfast" });
    assert.equal(updatedCat.name, "All-Day Breakfast");
    assert.equal(requests[2].method, "PATCH");

    // 4. Reorder categories
    const reorderCatRes = await menusApi.reorderMenuCategories(10, ["cat-2", "cat-1"]);
    assert.equal(reorderCatRes.reordered, true);
    assert.equal(requests[3].method, "PUT");
    assert.deepEqual(requests[3].body.category_ids, ["cat-2", "cat-1"]);

    // 5. Create item
    const item = await menusApi.createMenuItem(10, {
      category_id: "cat-1",
      name: "Eggs & Toast",
      description: "Organic eggs with toasted sourdough",
      price_etb_minor: 18000,
      sort_order: 0,
    });
    assert.equal(item.name, "Eggs & Toast");
    assert.equal(item.price_etb_minor, 18000);
    assert.equal(requests[4].method, "POST");

    // 6. Update item
    const updatedItem = await menusApi.updateMenuItem(10, "item-1", {
      name: "Eggs, Toast & Avocado",
      price_etb_minor: 22000,
    });
    assert.equal(updatedItem.name, "Eggs, Toast & Avocado");
    assert.equal(requests[5].method, "PATCH");

    // 7. Reorder items
    const reorderItemRes = await menusApi.reorderMenuItems(10, "cat-1", ["item-2", "item-1"]);
    assert.equal(reorderItemRes.reordered, true);
    assert.equal(requests[6].method, "PUT");
    assert.deepEqual(requests[6].body.item_ids, ["item-2", "item-1"]);

    // 8. Delete item
    const delItemRes = await menusApi.deleteMenuItem(10, "item-1");
    assert.equal(delItemRes.deleted, true);
    assert.equal(requests[7].method, "DELETE");

    // 9. Delete category
    const delCatRes = await menusApi.deleteMenuCategory(10, "cat-1");
    assert.equal(delCatRes.deleted, true);
    assert.equal(requests[8].method, "DELETE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Business Updates API & adapters integration (Backend 15)", async () => {
  const originalFetch = globalThis.fetch;
  const requests: { url: string; method: string; body?: any }[] = [];

  const fakeUpdates: any[] = [
    {
      id: "upd-1",
      business_id: 25,
      author_user_id: "user-1",
      update_type: "offer",
      title: "Weekend 20% Off",
      description: "Enjoy 20% off all meals this weekend",
      status: "PUBLISHED",
      offer_details: "20% off meals",
      valid_until: "2030-12-31",
      expires_at: "2030-12-31T23:59:59Z",
      published_at: "2026-09-25T10:00:00Z",
      created_at: "2026-09-25T10:00:00Z",
      updated_at: "2026-09-25T10:00:00Z",
    },
    {
      id: "upd-2",
      business_id: 25,
      author_user_id: "user-1",
      update_type: "event",
      title: "Live Jazz Night",
      description: "Acoustic jazz with local musicians",
      status: "PUBLISHED",
      event_date: "2030-05-15",
      event_time: "7:00 PM",
      expires_at: "2030-05-15T23:59:59Z",
      published_at: "2026-09-26T10:00:00Z",
      created_at: "2026-09-26T10:00:00Z",
      updated_at: "2026-09-26T10:00:00Z",
    },
    {
      id: "upd-3",
      business_id: 25,
      author_user_id: "user-1",
      update_type: "price_update",
      title: "New Coffee Pricing",
      description: "Updated prices for specialty drinks",
      status: "PUBLISHED",
      price_text: "120 ETB",
      published_at: "2026-09-27T10:00:00Z",
      created_at: "2026-09-27T10:00:00Z",
      updated_at: "2026-09-27T10:00:00Z",
    },
  ];

  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    const urlStr = url.toString();
    const method = init?.method || "GET";
    let body: any;
    if (init?.body) {
      try {
        body = JSON.parse(init.body as string);
      } catch {
        body = init.body;
      }
    }
    requests.push({ url: urlStr, method, body });

    if (urlStr.includes("/api/v1/businesses/25/updates") && method === "GET") {
      return new Response(JSON.stringify({ data: fakeUpdates }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (urlStr.includes("/api/v1/businesses/25/updates") && method === "POST") {
      return new Response(
        JSON.stringify({
          data: {
            id: "upd-new",
            business_id: 25,
            author_user_id: "user-1",
            update_type: body.update_type,
            title: body.title,
            description: body.description,
            status: "PUBLISHED",
            valid_until: body.valid_until,
            published_at: "2026-09-30T10:00:00Z",
            created_at: "2026-09-30T10:00:00Z",
            updated_at: "2026-09-30T10:00:00Z",
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }

    if (urlStr.includes("/api/v1/businesses/25/updates/upd-1") && method === "PATCH") {
      return new Response(
        JSON.stringify({
          data: {
            ...fakeUpdates[0],
            title: body.title,
            updated_at: "2026-09-30T11:00:00Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (urlStr.includes("/api/v1/businesses/25/updates/upd-1") && method === "DELETE") {
      return new Response(JSON.stringify({ data: { deleted: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "Not found" } }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof fetch;

  try {
    // 1. List business updates
    const updates = await updatesApi.listBusinessUpdates(25, true);
    assert.equal(updates.length, 3);
    assert.equal(requests[0].method, "GET");

    // 2. Adapters
    const vms = updates.map(adapters.apiUpdateToViewModel);
    assert.equal(vms[0].title, "Weekend 20% Off");
    assert.equal(vms[0].type, "offer");
    assert.equal(vms[0].offerDetails, "20% off meals");
    assert.equal(adapters.isUpdateExpired(vms[0]), false);

    // 3. Expiration detection
    const expiredVm = {
      ...vms[0],
      expiresAt: "2020-01-01T00:00:00Z",
    };
    assert.equal(adapters.isUpdateExpired(expiredVm), true);

    // 4. UI label & icon helpers
    assert.equal(adapters.getUpdateTypeLabel("new_menu"), "New Menu");
    assert.equal(adapters.getUpdateTypeLabel("offer"), "Offer");
    assert.equal(adapters.getUpdateTypeLabel("event"), "Event");
    assert.equal(adapters.getUpdateTypeLabel("price_update"), "Price Update");
    assert.equal(adapters.getUpdateTypeLabel("announcement"), "Announcement");

    assert.equal(adapters.getUpdateTypeIcon("new_menu"), "restaurant_menu");
    assert.equal(adapters.getUpdateTypeIcon("offer"), "local_offer");
    assert.equal(adapters.getUpdateTypeIcon("event"), "event");

    // 5. Create business update
    const created = await updatesApi.createBusinessUpdate(25, {
      update_type: "offer",
      title: "Midweek Special",
      description: "Free dessert with every entree",
      valid_until: "2030-11-30",
    });
    assert.equal(created.id, "upd-new");
    assert.equal(created.title, "Midweek Special");
    assert.equal(requests[1].method, "POST");

    // 6. Update business update
    const patched = await updatesApi.updateBusinessUpdate(25, "upd-1", {
      title: "Weekend 25% Off Super Sale",
    });
    assert.equal(patched.title, "Weekend 25% Off Super Sale");
    assert.equal(requests[2].method, "PATCH");

    // 7. Delete business update
    const delRes = await updatesApi.deleteBusinessUpdate(25, "upd-1");
    assert.equal(delRes.deleted, true);
    assert.equal(requests[3].method, "DELETE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Admin Center API integration (Backend 17)", async () => {
  const originalFetch = globalThis.fetch;
  const requests: { url: string; method: string; body?: any }[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const strUrl = String(input);
    const method = init?.method || "GET";
    const body = init?.body ? JSON.parse(init.body as string) : undefined;
    requests.push({ url: strUrl, method, body });

    if (strUrl.includes("/api/v1/admin/stats")) {
      return new Response(
        JSON.stringify({
          data: {
            total_businesses: 42,
            published_businesses: 38,
            verified_businesses: 25,
            claimed_businesses: 18,
            total_submissions: 10,
            pending_submissions: 2,
            total_claims: 8,
            pending_claims: 1,
            total_reviews: 150,
            removed_reviews: 3,
            total_review_reports: 5,
            pending_review_reports: 1,
            total_business_reports: 4,
            pending_business_reports: 1,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (strUrl.includes("/api/v1/admin/submissions/sub-1/approve") && method === "POST") {
      return new Response(
        JSON.stringify({
          data: { id: 101, name: "New Approved Cafe", slug: "new-approved-cafe" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (strUrl.includes("/api/v1/admin/claims/claim-1/approve") && method === "POST") {
      return new Response(
        JSON.stringify({
          data: { approved: true },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (strUrl.includes("/api/v1/admin/reviews/rev-1/moderate") && method === "POST") {
      return new Response(
        JSON.stringify({
          data: { moderated: true },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (strUrl.includes("/api/v1/admin/businesses/101/verification") && method === "POST") {
      return new Response(
        JSON.stringify({
          data: { updated: true },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (strUrl.includes("/api/v1/admin/businesses/101/publication") && method === "POST") {
      return new Response(
        JSON.stringify({
          data: { updated: true },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: { code: "not_found" } }), { status: 404 });
  }) as typeof fetch;

  try {
    const { adminApi } = await import("@/lib/api");

    // 1. Get stats
    const stats = await adminApi.getAdminStats();
    assert.equal(stats.total_submissions, 10);
    assert.equal(stats.pending_submissions, 2);

    // 2. Approve submission
    const createdBiz = await adminApi.approveSubmission("sub-1");
    assert.equal(createdBiz.id, 101);

    // 3. Approve claim
    const claimRes = await adminApi.approveClaim("claim-1", "Verified business license");
    assert.equal(claimRes.approved, true);

    // 4. Moderate review
    const modRes = await adminApi.moderateReview("rev-1", "REMOVED_BY_ADMIN", "Inappropriate content");
    assert.equal(modRes.moderated, true);

    // 5. Toggle verification
    const verRes = await adminApi.setBusinessVerification(101, "VERIFIED");
    assert.equal(verRes.updated, true);

    // 6. Toggle publication
    const pubRes = await adminApi.setBusinessPublication(101, "PUBLISHED");
    assert.equal(pubRes.updated, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ==========================================
// 22. User Account Creation & Onboarding (Backend 18)
// ==========================================
test("User Account Creation & Onboarding API integration (Backend 18)", async () => {
  const originalFetch = globalThis.fetch;

  let patchCalled = false;
  let sentPayload: unknown = null;

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    const strUrl = String(url);
    const method = init?.method || "GET";

    if (strUrl.includes("/api/v1/account/profile") && method === "PATCH") {
      patchCalled = true;
      sentPayload = JSON.parse(String(init?.body));
      const payloadObj = sentPayload as { full_name?: string; avatar_url?: string };

      if (!payloadObj.full_name || payloadObj.full_name.length < 2) {
        return new Response(
          JSON.stringify({
            error: {
              code: "invalid_input",
              message: "full name must be at least 2 characters",
            },
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          data: {
            id: "user-uuid-18",
            phone: "+251911223344",
            full_name: payloadObj.full_name,
            avatar_url: payloadObj.avatar_url,
            role: "CUSTOMER",
            is_active: true,
            profile_completed: true,
            created_at: "2026-09-30T12:00:00Z",
            updated_at: "2026-09-30T12:05:00Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    if (strUrl.includes("/api/v1/auth/me") && method === "GET") {
      return new Response(
        JSON.stringify({
          data: {
            id: "user-uuid-18",
            phone: "+251911223344",
            full_name: "Customer 3344",
            role: "CUSTOMER",
            is_active: true,
            profile_completed: false,
            created_at: "2026-09-30T12:00:00Z",
            updated_at: "2026-09-30T12:00:00Z",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: { code: "not_found" } }), { status: 404 });
  }) as typeof fetch;

  try {
    // 1. Initial /auth/me returns new user with incomplete profile
    const initialUser = await authApi.getCurrentUser();
    assert.equal(initialUser?.id, "user-uuid-18");
    assert.equal(initialUser?.full_name, "Customer 3344");
    assert.equal(initialUser?.profile_completed, false);

    // 2. Profile update validation failure (too short)
    await assert.rejects(
      async () => {
        await authApi.updateProfile({ full_name: "A" });
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 400);
        assert.equal(err.code, "invalid_input");
        return true;
      },
    );

    // 3. Successful profile completion / onboarding
    const updated = await authApi.updateProfile({
      full_name: "Samuel Kebede",
      avatar_url: "https://example.com/avatar.jpg",
    });

    assert.equal(patchCalled, true);
    assert.deepEqual(sentPayload, {
      full_name: "Samuel Kebede",
      avatar_url: "https://example.com/avatar.jpg",
    });
    assert.equal(updated.id, "user-uuid-18");
    assert.equal(updated.full_name, "Samuel Kebede");
    assert.equal(updated.avatar_url, "https://example.com/avatar.jpg");
    assert.equal(updated.profile_completed, true);

    // 4. getProfile resolves properly
    const profile = await authApi.getProfile();
    assert.equal(profile?.id, "user-uuid-18");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ==========================================
// 23. Backend 20: Real Business Lifecycle & Business Center
// ==========================================
test("businessesApi: submitBusiness calls POST /api/v1/businesses/submissions", async () => {
  const originalFetch = globalThis.fetch;
  try {
    let capturedUrl = "";
    let capturedMethod = "";
    let capturedBody: any = null;

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method || "GET";
      if (init?.body) capturedBody = JSON.parse(String(init.body));

      return new Response(
        JSON.stringify({
          data: {
            id: "sub-b20-1",
            submitter_user_id: "user-123",
            business_name: "Tomoca Coffee",
            category: "cafe",
            area: "Bole",
            status: "PENDING",
            submitted_at: new Date().toISOString(),
          },
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      );
    }) as any;

    const res = await businessesApi.submitBusiness({
      business_name: "Tomoca Coffee",
      category: "cafe",
      area: "Bole",
    });

    assert.equal(capturedUrl, "http://localhost:8080/api/v1/businesses/submissions");
    assert.equal(capturedMethod, "POST");
    assert.equal(capturedBody.business_name, "Tomoca Coffee");
    assert.equal(capturedBody.category, "cafe");
    assert.equal(capturedBody.area, "Bole");
    assert.equal(res.id, "sub-b20-1");
    assert.equal(res.status, "PENDING");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("businessesApi: getBusinessCenterManaged calls GET /api/v1/business-center/managed", async () => {
  const originalFetch = globalThis.fetch;
  try {
    let capturedUrl = "";
    let capturedMethod = "";

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedMethod = init?.method || "GET";

      return new Response(
        JSON.stringify({
          data: [
            {
              id: 42,
              name: "Tomoca Coffee",
              category: "cafe",
              claim_status: "CLAIMED",
              verification_status: "VERIFIED",
              created_at: new Date().toISOString(),
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }) as any;

    const res = await businessesApi.getBusinessCenterManaged();

    assert.equal(capturedUrl, "http://localhost:8080/api/v1/business-center/managed");
    assert.equal(capturedMethod, "GET");
    assert.equal(res.length, 1);
    assert.equal(res[0].id, 42);
    assert.equal(res[0].name, "Tomoca Coffee");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("mediaApi: validateImageFile correctly validates image types and sizes", () => {
  // Valid types
  const validJpeg = new File(["dummy content"], "test.jpg", { type: "image/jpeg" });
  assert.equal(mediaApi.validateImageFile(validJpeg).valid, true);

  const validPng = new File(["dummy content"], "test.png", { type: "image/png" });
  assert.equal(mediaApi.validateImageFile(validPng).valid, true);

  const validWebp = new File(["dummy content"], "test.webp", { type: "image/webp" });
  assert.equal(mediaApi.validateImageFile(validWebp).valid, true);

  // Invalid types
  const invalidSvg = new File(["<svg></svg>"], "test.svg", { type: "image/svg+xml" });
  assert.equal(mediaApi.validateImageFile(invalidSvg).valid, false);
  assert.match(mediaApi.validateImageFile(invalidSvg).error || "", /Unsupported image format/);

  const invalidPdf = new File(["dummy"], "doc.pdf", { type: "application/pdf" });
  assert.equal(mediaApi.validateImageFile(invalidPdf).valid, false);
  assert.match(mediaApi.validateImageFile(invalidPdf).error || "", /Unsupported image format/);

  // Size over limit (10MB + 1)
  const oversizedFile = {
    name: "huge.jpg",
    type: "image/jpeg",
    size: 10 * 1024 * 1024 + 1,
  } as File;
  assert.equal(mediaApi.validateImageFile(oversizedFile).valid, false);
  assert.match(mediaApi.validateImageFile(oversizedFile).error || "", /File is too large/);
});

test("mediaApi: createUpload, completeUpload, and media management endpoints", async () => {
  const originalFetch = globalThis.fetch;
  const requests: { url: string; method: string; body?: any }[] = [];

  try {
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = input.toString();
      const method = init?.method || "GET";
      const body = init?.body ? JSON.parse(init.body as string) : undefined;
      requests.push({ url: urlStr, method, body });

      if (urlStr.includes("/media/uploads") && !urlStr.includes("/complete")) {
        return new Response(
          JSON.stringify({
            status: "success",
            data: {
              upload_url: "https://fly.storage.tigris.dev/cafnet-media/submissions/sub-1/cover.jpg?presigned=true",
              media_id: "med-123",
              object_key: "submissions/sub-1/cover.jpg",
              expires_at: "2026-10-02T16:00:00Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (urlStr.includes("/media/uploads/med-123/complete")) {
        return new Response(
          JSON.stringify({
            status: "success",
            data: {
              media: {
                id: "med-123",
                target_type: "submission",
                target_id: "sub-1",
                media_type: "business_cover",
                object_key: "submissions/sub-1/cover.jpg",
                content_type: "image/jpeg",
                file_size: 1024,
                status: "READY",
                url: "https://fly.storage.tigris.dev/cafnet-media/submissions/sub-1/cover.jpg",
                created_at: "2026-10-02T15:00:00Z",
                updated_at: "2026-10-02T15:00:00Z",
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (urlStr.includes("/businesses/42/media") && method === "GET") {
        return new Response(
          JSON.stringify({
            status: "success",
            data: {
              cover: {
                id: "med-cover",
                url: "https://fly.storage.tigris.dev/cafnet-media/businesses/42/cover.jpg",
              },
              gallery: [
                {
                  id: "med-gal-1",
                  url: "https://fly.storage.tigris.dev/cafnet-media/businesses/42/gal1.jpg",
                  sort_order: 0,
                },
              ],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (urlStr.includes("/businesses/42/media/cover")) {
        return new Response(
          JSON.stringify({ status: "success", data: { media_id: "med-gal-1" } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (urlStr.includes("/businesses/42/media/gallery/reorder")) {
        return new Response(
          JSON.stringify({ status: "success", data: { reordered: true } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (urlStr.includes("/media/med-gal-1") && method === "DELETE") {
        return new Response(
          JSON.stringify({ status: "success", data: { deleted: true } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (urlStr.includes("/menu/items/item-1/image") && method === "DELETE") {
        return new Response(
          JSON.stringify({ status: "success", data: { deleted: true } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify({ status: "error", message: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }) as any;

    // 1. Create Presigned Upload
    const uploadRes = await mediaApi.createUpload({
      target_type: "submission",
      target_id: "sub-1",
      media_type: "business_cover",
      content_type: "image/jpeg",
      file_size: 1024,
    });
    assert.equal(uploadRes.media_id, "med-123");
    assert.match(uploadRes.upload_url, /presigned=true/);

    // 2. Complete Upload
    const completeRes = await mediaApi.completeUpload("med-123");
    assert.equal(completeRes.id, "med-123");
    assert.equal(completeRes.status, "READY");

    // 3. Get Business Media
    const bizMedia = await mediaApi.getBusinessMedia(42);
    assert.equal(bizMedia.cover?.id, "med-cover");
    assert.equal(bizMedia.gallery.length, 1);

    // 4. Set Business Cover
    await mediaApi.setBusinessCover(42, "med-gal-1");
    const setCoverReq = requests.find((r) => r.url.includes("/businesses/42/media/cover"));
    assert.ok(setCoverReq);
    assert.equal(setCoverReq.body.media_id, "med-gal-1");

    // 5. Reorder Business Gallery
    await mediaApi.reorderBusinessGallery(42, ["med-gal-1"]);
    const reorderReq = requests.find((r) => r.url.includes("/businesses/42/media/gallery/reorder"));
    assert.ok(reorderReq);
    assert.deepEqual(reorderReq.body.media_ids, ["med-gal-1"]);

    // 6. Delete Media
    await mediaApi.deleteMedia("med-gal-1");
    const delReq = requests.find((r) => r.url.includes("/media/med-gal-1") && r.method === "DELETE");
    assert.ok(delReq);

    // 7. Delete Menu Item Media
    await mediaApi.deleteMenuItemMedia(42, "item-1");
    const delItemReq = requests.find(
      (r) => r.url.includes("/menu/items/item-1/image") && r.method === "DELETE",
    );
    assert.ok(delItemReq);
  } finally {
    globalThis.fetch = originalFetch;
  }
});





