"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [language, setLanguage] = useState("English");

  const toggleLanguage = () => {
    setLanguage(language === "English" ? "Oromo" : "English");
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/images/logo.png"
                alt="Cafnet Logo - Royal Blue & Coral"
                width={56}
                height={56}
                className="h-14 w-auto"
              />
              <span className="text-xl font-bold text-gray-800 hidden sm:block">
                Ethiopia&apos;s No. 1 Restaurant Listing and Reservation Site.
              </span>
            </Link>
          </div>

          {/* Center - Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/restaurants"
              className="text-purple-600 font-medium border-b-2 border-purple-600 pb-1"
            >
              Restaurants
            </Link>
            <Link
              href="/cafes"
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              Cafés
            </Link>
            <Link
              href="/drinks"
              className="text-gray-600 hover:text-purple-600 transition-colors"
            >
              Drinks & More
            </Link>
          </div>

          {/* Right side - Language, For Restaurants, Profile */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleLanguage}
                className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
              >
                {language}
              </button>
              <span className="text-gray-400">|</span>
              <button
                onClick={toggleLanguage}
                className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
              >
                {language === "English" ? "Oromo" : "English"}
              </button>
            </div>

            <Link
              href="/for-restaurants"
              className="hidden lg:flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors"
            >
              <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
              For Restaurants (List / Claim)
            </Link>

            <button className="p-2 rounded-full border border-gray-300 hover:border-purple-600 transition-colors">
              <Image
                src="/user-icon.png"
                alt="User Profile"
                width={20}
                height={20}
                className="h-5 w-5"
              />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
