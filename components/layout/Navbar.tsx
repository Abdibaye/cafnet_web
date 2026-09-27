"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [language, setLanguage] = useState("English");
  const [activeTab, setActiveTab] = useState<string | null>("cuisines");

  const toggleLanguage = () => {
    setLanguage(language === "English" ? "Oromo" : "English");
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-3 flex items-center justify-between text-xs text-on-surface-variant">
           <div className="text-on-surface-variant/80 font-body-sm hidden md:block">
             Ethiopia&apos;s No. 1* Restaurant Listing and Reservation Site.
           </div>
           <div className="flex items-center gap-2 font-label-sm">
             <span className="font-bold text-on-surface">English</span>
             <span className="text-outline/40">/</span>
             <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">
               አማርኛ
             </a>
             <span className="text-outline/40">/</span>
             <button
               onClick={toggleLanguage}
               className="text-on-surface-variant hover:text-primary transition-colors"
             >
               Oromo
             </button>
           </div>
         </div>

       <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between gap-8">
         <Link className="flex items-center shrink-0 py-2" href="/">
             <img
               alt="Cafnet Logo - Royal Blue & Coral"
               className="h-12 w-auto object-contain"
               src="/images/logo.png"
             />
         </Link>

         <nav className="flex items-center justify-center gap-5 lg:gap-8 self-stretch shrink-0">
              <Link
                className={`group relative flex flex-col items-center justify-center gap-1 px-2 transition-colors ${activeTab === "cuisines" ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
                href="/"
                onClick={() => handleTabChange("cuisines")}
              >
                <span className={`material-symbols-outlined text-[22px] ${activeTab === "cuisines" ? "text-primary" : "text-outline group-hover:text-primary"}`}>
                  restaurant_menu
                </span>
                <span className={`text-xs ${activeTab === "cuisines" ? "font-bold" : "font-medium"} whitespace-nowrap`}>
                  Cuisines
                </span>
              </Link>
              <Link
                className={`group relative flex flex-col items-center justify-center gap-1 px-2 transition-colors ${activeTab === "restaurants" ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
                href="/restaurants"
                onClick={() => handleTabChange("restaurants")}
              >
                <span className={`material-symbols-outlined text-[22px] ${activeTab === "restaurants" ? "text-primary" : "text-outline group-hover:text-primary"}`}>
                  restaurant
                </span>
                <span className={`text-xs ${activeTab === "restaurants" ? "font-bold" : "font-medium"} whitespace-nowrap`}>
                  Restaurants
                </span>
              </Link>
               
              <Link
                className={`group relative flex flex-col items-center justify-center gap-1 px-2 transition-colors ${activeTab === "cafes" ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
                href="/cafes"
                onClick={() => handleTabChange("cafes")}
              >
                <span className={`material-symbols-outlined text-[22px] ${activeTab === "cafes" ? "text-primary" : "text-outline group-hover:text-primary"}`}>
                  local_cafe
                </span>
                <span className={`text-xs ${activeTab === "cafes" ? "font-bold" : "font-medium"} whitespace-nowrap`}>
                  Cafés
                </span>
              </Link>
               
               <Link
                className={`group relative flex flex-col items-center justify-center gap-1 px-2 transition-colors ${activeTab === "drinks" ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}
                href="/drinks"
                onClick={() => handleTabChange("drinks")}
              >
                <span className={`material-symbols-outlined text-[22px] ${activeTab === "drinks" ? "text-primary" : "text-outline group-hover:text-primary"}`}>
                  local_bar
                </span>
                <span className={`text-xs ${activeTab === "drinks" ? "font-bold" : "font-medium"} whitespace-nowrap`}>
                  Drinks & More
                </span>
              </Link>
         </nav>

         <div className="flex items-center justify-end gap-5 shrink-0">
           <Link
             className="hidden lg:inline-flex items-center text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
             href="/for-restaurants"
           >
             For Restaurants (List / Claim)
           </Link>
           <button className="flex items-center gap-2 p-2 text-on-surface hover:text-primary transition-colors" aria-label="Open menu">
             <span className="material-symbols-outlined text-[22px]">menu</span>
           </button>
         </div>
       </div>
    </header>
  );
}
