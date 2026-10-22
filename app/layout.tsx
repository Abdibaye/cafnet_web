import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { CustomerProvider } from "@/components/CustomerProvider";
import { BusinessOwnerProvider } from "@/components/BusinessOwnerProvider";
import { ReservationProvider } from "@/components/ReservationProvider";
import { CustomerReviewProvider } from "@/components/CustomerReviewProvider";
import { LocationProvider } from "@/components/LocationProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cafnet - Ethiopia's No. 1 Restaurant Listing and Reservation Site",
  description: "Find and reserve tables at the best restaurants in Ethiopia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Google Maps JavaScript API – used for reverse geocoding */}
        <script
          async
          defer
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geocoder`}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-surface">
        <CustomerProvider>
          <ReservationProvider>
            <CustomerReviewProvider>
              <BusinessOwnerProvider>
                <LocationProvider>
                  <Navbar />
                  <main className="flex-1 w-full bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] pt-16 md:pb-0 md:pt-20">{children}</main>
                  <Footer />
                  <MobileBottomNav />
                </LocationProvider>
              </BusinessOwnerProvider>
            </CustomerReviewProvider>
          </ReservationProvider>
        </CustomerProvider>
        <Analytics />
      </body>
    </html>
  );
}
