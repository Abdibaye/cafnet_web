"use client";

import { useState, useEffect } from "react";

const heroImages = [
  "/images/hero_image/Aynet.webp",
  "/images/hero_image/sanbusa.webp",
  "/images/hero_image/kaywet.webp",
];

export default function HeroSection() {
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("Now");
  const [people, setPeople] = useState("2 people");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleSearch = () => {
    console.log("Searching for:", { location, time, people });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative -mt-20 pt-28 pb-12 overflow-hidden min-h-[500px]">
      {/* Background Image Slider */}
      <div className="absolute inset-0 z-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat"
            }}
          ></div>
        ))}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-12">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="font-display-hero text-3xl sm:text-4xl md:text-5xl lg:text-[44px] leading-tight text-white font-extrabold tracking-tight drop-shadow-lg">
            Discover somewhere worth eating.
          </h1>
        </div>

        {/* AIRBNB-INSPIRED DISCOVERY SEARCH BAR */}
        <div className="max-w-5xl mx-auto mb-8">
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-md flex flex-col md:flex-row items-stretch overflow-hidden">
            <div className="flex-1 flex items-center px-4 py-3 md:py-2.5 min-w-0">
              <span className="material-symbols-outlined text-[20px] text-outline mr-2 md:hidden">search</span>
              <input
                className="w-full bg-transparent border-0 p-0 text-on-surface text-body-md text-sm md:text-base focus:ring-0 focus:outline-none placeholder:text-outline/70 font-normal"
                placeholder="Location, cuisine, restaurant name, etc."
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="hidden md:block w-px bg-surface-container self-stretch"></div>
            <div className="hidden md:block w-px bg-surface-container self-stretch"></div>
            
            <div className="hidden md:flex items-center justify-between px-3.5 py-3 md:py-2.5 cursor-pointer hover:bg-surface-container-low/60 transition-colors border-t md:border-t-0 border-surface-container gap-2 shrink-0">
              <span className="text-body-md text-sm text-on-surface-variant whitespace-nowrap">{time}</span>
              <span className="material-symbols-outlined text-[18px] text-outline">arrow_drop_down</span>
            </div>
            
            <div className="hidden md:block w-px bg-surface-container self-stretch"></div>
            
            <div className="hidden md:flex items-center justify-between px-3.5 py-3 md:py-2.5 cursor-pointer hover:bg-surface-container-low/60 transition-colors border-t md:border-t-0 border-surface-container gap-2 shrink-0">
              <span className="text-body-md text-sm text-on-surface-variant whitespace-nowrap">{people}</span>
              <span className="material-symbols-outlined text-[18px] text-outline">arrow_drop_down</span>
            </div>
            
            <button
              className="hidden md:flex bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-7 py-3 md:py-3.5 flex items-center justify-center gap-2 font-label-md font-bold transition-colors cursor-pointer shrink-0"
              type="button"
              onClick={handleSearch}
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Image Navigation Dots */}
        <div className="flex justify-center gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentImageIndex ? "bg-[#2563EB] w-6" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
