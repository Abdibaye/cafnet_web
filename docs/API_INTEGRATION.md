# Cafnet Frontend / Go API Integration Foundation (Backend 08)

This document specifies the integration architecture bridging the Next.js frontend to the Go HTTP REST API (`/api/v1`) running on Neon PostgreSQL.

---

## 1. Architectural Overview

```
Next.js Frontend (React 19 / App Router)
   │
   ├── apiClient / typed modules (lib/api/)
   │     ├── authApi (OTP challenge, session management)
   │     ├── businessesApi (directory list, public profiles)
   │     ├── searchApi (full-text search)
   │     └── customerApi (saved places, followed venues)
   │
   ├── View Model Adapters (lib/api/adapters.ts)
   │     ├── businessToCardItem()
   │     ├── publicProfileToViewModel()
   │     ├── formatHours()
   │     └── formatPriceEtb()
   │
   └── State / Context (components/CustomerProvider.tsx)
         ├── HttpOnly Session Life-cycle
         ├── Optimistic Saved / Followed Collections
         └── OTP Modal Flow with Dev Hint Support
                 │
                 ▼ (credentials: "include")
         Go REST API (Port 8080)
                 │
                 ▼
         Neon PostgreSQL
```

---

## 2. API Client & Transport Layer

### Central Client (`frontend/lib/api/client.ts`)
- **Base URL**: Configured via `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8080`).
- **Credentials**: Strictly uses `credentials: "include"`. Session cookies (`cafnet_session`) are managed exclusively by the browser and are never accessed via JavaScript.
- **Envelope Handling**: Automatically unwraps `{ data: T, pagination?: Pagination }` envelopes returned by the Go backend.
- **Timeouts**: Enforces 15-second default timeouts using native `AbortController`.
- **Typing**: Exposes `api.get<T>`, `api.post<T>`, `api.put<T>`, `api.patch<T>`, and `api.delete<T>`.

### Error System (`frontend/lib/api/errors.ts`)
- `ApiError` encapsulates standard HTTP status codes, machine-readable backend error codes (`code`), error messages, and `request_id`.
- Helper methods provide fast, clean branching:
  - `isUnauthorized()`: 401 / `unauthenticated` / `session_expired`
  - `isForbidden()`: 403 / `forbidden` / `not_business_manager`
  - `isNotFound()`: 404 / `resource_not_found`
  - `isConflict()`: 409 / `conflict` / `illegal_state_transition`
  - `isRateLimited()`: 429 / `rate_limited` / `otp_too_many_attempts`
  - `isNetworkError()`: Status 0 / network failure

---

## 3. Integrated Surfaces & Modules

| Surface / Flow | Frontend Route / Component | Go API Endpoint | HTTP Method | Auth Mode | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OTP Request** | `CustomerProvider.submitPhone()` | `/api/v1/auth/otp/request` | `POST` | Public | **Live API** |
| **OTP Verify** | `CustomerProvider.verifyOtp()` | `/api/v1/auth/otp/verify` | `POST` | Public | **Live API** |
| **Session Identity**| `CustomerProvider.refreshCustomer()` | `/api/v1/auth/me` | `GET` | Required | **Live API** |
| **Sign Out** | `CustomerProvider.logout()` | `/api/v1/auth/logout` | `POST` | Required | **Live API** |
| **Cafés Feed** | `app/cafes/page.tsx` | `/api/v1/businesses?category=cafe` | `GET` | Optional | **Live API** |
| **Restaurants** | `app/restaurants/page.tsx` | `/api/v1/businesses?category=restaurant`| `GET` | Optional | **Live API** |
| **Drinks & Lounges**| `app/drinks/page.tsx` | `/api/v1/businesses?category=drinks` | `GET` | Optional | **Live API** |
| **Explore Feed** | `app/explore/page.tsx` | `/api/v1/businesses` | `GET` | Optional | **Live API** |
| **Full-text Search**| `app/search/page.tsx` | `/api/v1/search?q={query}` | `GET` | Optional | **Live API** |
| **Business Profile**| `app/business/[id]/page.tsx` | `/api/v1/businesses/{id}` | `GET` | Optional | **Live API** |
| **Saved Places** | `app/saved/page.tsx` | `/api/v1/saved` | `GET` | Required | **Live API** |
| **Save Venue** | `CustomerProvider.saveBusiness()` | `/api/v1/saved/{businessID}` | `POST` | Required | **Live API** |
| **Unsave Venue** | `CustomerProvider.unsaveBusiness()` | `/api/v1/saved/{businessID}` | `DELETE` | Required | **Live API** |
| **Following** | `app/following/page.tsx` | `/api/v1/following` | `GET` | Required | **Live API** |
| **Follow Venue** | `CustomerProvider.followBusiness()` | `/api/v1/following/{businessID}`| `POST` | Required | **Live API** |
| **Unfollow Venue** | `CustomerProvider.unfollowBusiness()`| `/api/v1/following/{businessID}`| `DELETE` | Required | **Live API** |

---

## 4. Security & Cookie Invariants

1. **HttpOnly Cookie Authority**:
   - The Go backend sets `cafnet_session` with `HttpOnly`, `Path=/`, and appropriate `SameSite` flags.
   - The frontend never reads or writes this cookie via document.cookie.
   - Authentication status is determined strictly by `GET /api/v1/auth/me`.
2. **CSRF Protection Compliance**:
   - The backend validates origin/referer headers on state-mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`).
   - Browser `fetch` automatically sends `Origin` header matching the client domain (`http://localhost:3000`).
3. **Optimistic Updates with Safe Rollback**:
   - Save and Follow actions update local React state immediately for responsive UI.
   - If the network or server rejects the request, local state is rolled back and an error toast is surfaced.

---

## 5. Scope Isolation & Future Milestones

- **Customer Journey**: Successfully bridged to Go API with resilient fallback to seed data.
- **Business Center (Owner Portal)**: Intentionally preserved on mock storage layer for Backend 09.
- **Admin Center (Governance Portal)**: Intentionally preserved on mock storage layer for Backend 10.
- **Table Reservations & Reviews Writing**: To be integrated in following phases.
