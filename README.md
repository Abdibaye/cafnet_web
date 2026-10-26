# Cafnet Web Frontend

Modern responsive web application for Cafnet, built with **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS**.

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

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI & State**: React 19, React Context Providers
- **Styling**: Tailwind CSS
- **API Client**: Strongly-typed native fetch client (`lib/api/`) with envelope unwrapping and session cookie handling

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
