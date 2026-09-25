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
     <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-surface-container shadow-[0_1px_8px_rgba(30,35,42,0.06)]">
        <div className="w-full border-b border-surface-container/60 bg-white">
         <div className="max-w-7xl mx-auto px-6 lg:px-12 py-1.5 flex items-center justify-between text-body-sm text-[12px] text-on-surface-variant">
           <div className="text-on-surface-variant/80 font-body-sm hidden md:block">
             Ethiopia&apos;s No. 1* Restaurant Listing and Reservation Site.
           </div>
           <div className="flex items-center gap-2 font-label-sm">
             <span className="font-bold text-on-surface">English</span>
             <span className="text-outline/40">|</span>
             <a className="text-on-surface-variant hover:text-[#2563EB] transition-colors" href="#">
               አማርኛ
             </a>
             <span className="text-outline/40">|</span>
             <button
               onClick={toggleLanguage}
               className="text-on-surface-variant hover:text-[#2563EB] transition-colors"
             >
               Oromo
             </button>
           </div>
         </div>
       </div>
      
       <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between gap-6">
         <div className="flex-1 flex items-center">
           <Link className="flex items-center shrink-0 py-2" href="/">
             <img
               alt="Cafnet Logo - Royal Blue & Coral"
               className="h-14 w-auto object-contain hidden md:block"
               src="/images/logo.png"
             />
           </Link>
         </div>

         <div className="flex-1 flex items-center justify-center">
            <nav className="flex md:hidden items-end justify-center gap-6 lg:gap-8 self-stretch shrink-0">
              <Link
                className={`group relative flex flex-col items-center justify-center pb-3 pt-2 px-2 transition-all ${activeTab === "cuisines" ? "text-[#2563EB] border-b-2 border-[#2563EB]" : "text-on-surface-variant hover:text-[#2563EB] border-b-2 border-transparent hover:border-surface-container-highest"}`}
                href="/"
                onClick={() => handleTabChange("cuisines")}
              >
                <span className={`material-symbols-outlined text-[26px] mb-1 ${activeTab === "cuisines" ? "text-[#2563EB]" : "text-outline group-hover:text-[#2563EB]"} transition-transform group-hover:scale-110`}>
                  restaurant_menu
                </span>
                <span className={`font-label-md text-[13px] ${activeTab === "cuisines" ? "font-semibold" : "font-medium"} tracking-tight whitespace-nowrap`}>
                  Cuisines
                </span>
              </Link>
              <Link
                className={`group relative flex flex-col items-center justify-center pb-3 pt-2 px-2 transition-all ${activeTab === "restaurants" ? "text-[#2563EB] border-b-2 border-[#2563EB]" : "text-on-surface-variant hover:text-[#2563EB] border-b-2 border-transparent hover:border-surface-container-highest"}`}
                href="/restaurants"
                onClick={() => handleTabChange("restaurants")}
              >
                <span className={`material-symbols-outlined text-[26px] mb-1 ${activeTab === "restaurants" ? "text-[#2563EB]" : "text-outline group-hover:text-[#2563EB]"} transition-transform group-hover:scale-110`}>
                  restaurant
                </span>
                <span className={`font-label-md text-[13px] ${activeTab === "restaurants" ? "font-semibold" : "font-medium"} tracking-tight whitespace-nowrap`}>
                  Restaurants
                </span>
              </Link>
               
              <Link
                className={`group relative flex flex-col items-center justify-center pb-3 pt-2 px-2 transition-all ${activeTab === "cafes" ? "text-[#2563EB] border-b-2 border-[#2563EB]" : "text-on-surface-variant hover:text-[#2563EB] border-b-2 border-transparent hover:border-surface-container-highest"}`}
                href="/cafes"
                onClick={() => handleTabChange("cafes")}
              >
                <span className={`material-symbols-outlined text-[26px] mb-1 ${activeTab === "cafes" ? "text-[#2563EB]" : "text-outline group-hover:text-[#2563EB]"} transition-transform group-hover:scale-110`}>
                  local_cafe
                </span>
                <span className={`font-label-md text-[13px] ${activeTab === "cafes" ? "font-semibold" : "font-medium"} tracking-tight whitespace-nowrap`}>
                  Cafés
                </span>
              </Link>
               
               <Link
                className={`group relative flex flex-col items-center justify-center pb-3 pt-2 px-2 transition-all ${activeTab === "drinks" ? "text-[#2563EB] border-b-2 border-[#2563EB]" : "text-on-surface-variant hover:text-[#2563EB] border-b-2 border-transparent hover:border-surface-container-highest"}`}
                href="/drinks"
                onClick={() => handleTabChange("drinks")}
              >
                <span className={`material-symbols-outlined text-[26px] mb-1 ${activeTab === "drinks" ? "text-[#2563EB]" : "text-outline group-hover:text-[#2563EB]"} transition-transform group-hover:scale-110`}>
                  local_bar
                </span>
                <span className={`font-label-md text-[13px] ${activeTab === "drinks" ? "font-semibold" : "font-medium"} tracking-tight whitespace-nowrap`}>
                  Drinks & More
                </span>
              </Link>
            </nav>

             <nav className="hidden md:flex items-end justify-center gap-6 lg:gap-8 self-stretch shrink-0">
              <Link
                className={`group relative flex flex-col items-center justify-center pb-3 pt-2 px-2 transition-all ${activeTab === "cuisines" ? "text-[#2563EB] border-b-2 border-[#2563EB]" : "text-on-surface-variant hover:text-[#2563EB] border-b-2 border-transparent hover:border-surface-container-highest"}`}
                href="/"
                onClick={() => handleTabChange("cuisines")}
              >
                <span className={`material-symbols-outlined text-[26px] mb-1 ${activeTab === "cuisines" ? "text-[#2563EB]" : "text-outline group-hover:text-[#2563EB]"} transition-transform group-hover:scale-110`}>
                  restaurant_menu
                </span>
                <span className={`font-label-md text-[13px] ${activeTab === "cuisines" ? "font-semibold" : "font-medium"} tracking-tight whitespace-nowrap`}>
                  Cuisines
                </span>
              </Link>
              <Link
                className={`group relative flex flex-col items-center justify-center pb-3 pt-2 px-2 transition-all ${activeTab === "restaurants" ? "text-[#2563EB] border-b-2 border-[#2563EB]" : "text-on-surface-variant hover:text-[#2563EB] border-b-2 border-transparent hover:border-surface-container-highest"}`}
                href="/restaurants"
                onClick={() => handleTabChange("restaurants")}
              >
                <span className={`material-symbols-outlined text-[26px] mb-1 ${activeTab === "restaurants" ? "text-[#2563EB]" : "text-outline group-hover:text-[#2563EB]"} transition-transform group-hover:scale-110`}>
                  restaurant
                </span>
                <span className={`font-label-md text-[13px] ${activeTab === "restaurants" ? "font-semibold" : "font-medium"} tracking-tight whitespace-nowrap`}>
                  Restaurants
                </span>
              </Link>
               
              <Link
                className={`group relative flex flex-col items-center justify-center pb-3 pt-2 px-2 transition-all ${activeTab === "cafes" ? "text-[#2563EB] border-b-2 border-[#2563EB]" : "text-on-surface-variant hover:text-[#2563EB] border-b-2 border-transparent hover:border-surface-container-highest"}`}
                href="/cafes"
                onClick={() => handleTabChange("cafes")}
              >
                <span className={`material-symbols-outlined text-[26px] mb-1 ${activeTab === "cafes" ? "text-[#2563EB]" : "text-outline group-hover:text-[#2563EB]"} transition-transform group-hover:scale-110`}>
                  local_cafe
                </span>
                <span className={`font-label-md text-[13px] ${activeTab === "cafes" ? "font-semibold" : "font-medium"} tracking-tight whitespace-nowrap`}>
                  Cafés
                </span>
              </Link>
               
               <Link
                className={`group relative flex flex-col items-center justify-center pb-3 pt-2 px-2 transition-all ${activeTab === "drinks" ? "text-[#2563EB] border-b-2 border-[#2563EB]" : "text-on-surface-variant hover:text-[#2563EB] border-b-2 border-transparent hover:border-surface-container-highest"}`}
                href="/drinks"
                onClick={() => handleTabChange("drinks")}
              >
                <span className={`material-symbols-outlined text-[26px] mb-1 ${activeTab === "drinks" ? "text-[#2563EB]" : "text-outline group-hover:text-[#2563EB]"} transition-transform group-hover:scale-110`}>
                  local_bar
                </span>
                <span className={`font-label-md text-[13px] ${activeTab === "drinks" ? "font-semibold" : "font-medium"} tracking-tight whitespace-nowrap`}>
                  Drinks & More
                </span>
              </Link>
            </nav>
         </div>

         <div className="flex-1 flex items-center justify-end gap-4 shrink-0">
           <Link
             className="hidden sm:inline-flex items-center font-label-md text-label-md text-on-surface-variant hover:text-[#2563EB] transition-colors"
             href="/for-restaurants"
           >
             For Restaurants (List / Claim)
           </Link>
           <button className="flex items-center gap-2 p-1.5 pr-2 rounded-full border border-surface-container hover:shadow-sm transition-all text-on-surface">
             <span className="material-symbols-outlined text-[20px] text-outline ml-1">menu</span>
             <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container flex items-center justify-center">
               <img
                 alt="Profile"
                 className="w-full h-full object-cover"
                 src="/images/logo.png"
               />
             </div>
           </button>
         </div>
       </div>
    </header>
  );
}
