# Cafnet Web Frontend

Modern responsive web application for Cafnet, built with **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS**.

---

## Features

- **Venue & Culinary Discovery**: Dedicated hubs for Cafes (`/cafes`), Restaurants (`/restaurants`), Drinks/Nightlife (`/drinks`), and Cuisines (`/cuisines`).
- **Full-Text & Filter Search**: Instant search across venues, descriptions, tags, and digital menus (`/search`).
- **Interactive Map & Directory**: Responsive map and card views for venue browsing (`/explore`).
- **Table Reservations**: Real-time customer reservation booking, confirmation, and cancellation (`/reservations`, `/reserve`).
- **100% Verified Dining Reviews**: Transparent community reviews strictly validated against completed dining visits (`/reviews`).
- **AI Concierge**: Real-time AI culinary assistant with semantic venue recommendations (`/assistant`).
- **Customer Portal**: Saved places, followed venues, and account management (`/account`, `/saved`, `/following`).
- **Business Management**: Venue management dashboard for menu updates, opening hours, and table bookings (`/business`).
- **Admin Center**: Administrative moderation portal for reviewing venue claims, user submissions, and community reports (`/admin`).

---

## 🤖 AI Food Assistant Implementation Details

The AI Food Assistant (`/assistant`) is an interactive culinary concierge that helps users discover where to eat in Addis Ababa and across Ethiopia based on natural-language cravings, budgets in Ethiopian Birr (ETB), dietary preferences, and specific neighborhoods.

### 1. UI & Interactive Workflow (`components/assistant/FoodAssistantChat.tsx`)
- **Conversational Canvas**: Full-height responsive chat interface handling user prompts and assistant turns with optimistic updates and error recovery.
- **Neighborhood Filter Bar**: Instant filtering across major Addis Ababa hubs (Bole, Kazanchis, Piassa, Sarbet, Atlas, Mexico, Bisrate Gabriel, CMC / Ayat).
- **Quick Prompt Pills**: One-click exploratory prompts covering:
  - *"Best Kitfo in Bole"* (high-demand local specialty)
  - *"Tibs < 300 ETB"* (budget-capped inquiry)
  - *"Fasting Shiro"* (orthodox fasting / vegan dietary needs)
  - *"Specialty Coffee & Wi-Fi"* (work-friendly cafes)
  - Amharic natural queries (e.g., *"በ 350 ብር በታች ምርጥ ምግብ የት ማግኘት እችላለሁ?"*)
- **Progressive Loading Feedback**: Cycles through real-time feedback states while awaiting RAG vector search and LLM generation:
  1. *"Searching verified Addis Ababa restaurant menus..."*
  2. *"Cross-checking verified ETB menu prices..."*
  3. *"Verifying neighborhood locations & opening hours..."*
  4. *"Curating personalized culinary recommendations..."*
- **Dynamic Syntax & Price Highlighting**: Custom parser (`renderFormattedLine`) identifies and renders currency values (`ETB`, `Birr`, `ብር`) as distinct amber badge chips, while bolding venue names.
- **Embedded Recommendation Cards**: When the assistant suggests venues, it renders interactive cards containing:
  - Dish title and verified price in ETB
  - Venue name, neighborhood, and star rating
  - Direct links to book table reservations (`/reserve?business_id=...`) or view full menus (`/business/[slug]`)
- **Interactive Follow-up Chips**: Displays contextual follow-up prompt chips returned by the backend (e.g., *"Show me options near Kazanchis"*, *"Does it have parking?"*) that can be tapped to continue the conversation.

### 2. Client-Side API Integration (`lib/api/assistant.ts`)
The assistant client interfaces directly with the Go backend via typed HTTP endpoints:

```typescript
// Sends user query with optional session continuity and neighborhood filters
export async function chatWithAssistant(
  req: AssistantChatRequest
): Promise<AssistantChatResponse>

// Fetches conversation history for an existing session ID
export async function getAssistantSession(
  sessionID: string
): Promise<AssistantSession>

// Creates a new conversation session
export async function createAssistantSession(
  title?: string
): Promise<AssistantSession>
```

- **Session Continuity**: Preserves the conversation using UUID session IDs stored in component state and URL parameters, allowing back-and-forth context retention.
- **Data Model**: Receives structured `FoodSearchResult` payloads alongside grounded conversational markdown, ensuring that every recommendation is backed by real records in Neon PostgreSQL.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI & State**: React 19, React Context Providers (`LocationProvider`, `CustomerProvider`)
- **Styling**: Tailwind CSS with custom color palettes and responsive tokens
- **API Client**: Strongly-typed native fetch client (`lib/api/client.ts`) with envelope unwrapping and session cookie handling

---

## Getting Started

### 1. Prerequisites
Ensure Node.js 18+ (Node 20+ recommended) is installed.

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Set `NEXT_PUBLIC_API_URL` to your Go backend API address (default: `http://localhost:8080`).

### 3. Install Dependencies & Run
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Testing & Linting
```bash
npm run test
npm run lint
```
