"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { chatWithAssistant } from "@/lib/api/assistant";
import { useLocation } from "@/components/LocationProvider";
import type { FoodSearchResult, CanonicalDish } from "@/lib/api/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  follow_up_suggestions?: string[];
  results?: FoodSearchResult[];
  canonical_dish?: CanonicalDish | null;
  created_at: string;
  isError?: boolean;
}

interface CategoryFilter {
  id: string;
  label: string;
  amharicLabel?: string;
  icon: string;
}

const CATEGORIES: CategoryFilter[] = [
  { id: "all", label: "All Curations", amharicLabel: "ሁሉንም", icon: "restaurant" },
  { id: "traditional", label: "Traditional", amharicLabel: "ባህላዊ", icon: "local_fire_department" },
  { id: "meat", label: "Tibs & Grills", amharicLabel: "ጥብስ", icon: "skillet" },
  { id: "fasting", label: "Fasting & Shiro", amharicLabel: "የጾም / ሽሮ", icon: "spa" },
  { id: "cafe", label: "Cafés & Coffee", amharicLabel: "ቡና እና ካፌ", icon: "coffee" },
  { id: "fastfood", label: "Burgers & Casual", amharicLabel: "በርገር", icon: "lunch_dining" },
  { id: "reservations", label: "Table Bookings", amharicLabel: "ጠረጴዛ", icon: "event_seat" },
];

interface StarterPrompt {
  category: string;
  badge: string;
  budget: string;
  label: string;
  query: string;
  amharic: string;
  icon: string;
  highlight?: string;
}

const STARTER_PROMPTS: StarterPrompt[] = [
  {
    category: "traditional",
    icon: "local_fire_department",
    badge: "Traditional",
    budget: "< 450 ETB",
    label: "Best Kitfo near Atlas",
    query: "Where is the best kitfo near Atlas and what are typical prices?",
    amharic: "አትላስ አካባቢ ምርጥ ክትፎ",
    highlight: "Prime beef, spiced mitmita & ayib",
  },
  {
    category: "traditional",
    icon: "translate",
    badge: "Amharic Search",
    budget: "< 350 ETB",
    label: "ምርጥ ክትፎ ቦሌ",
    query: "ምርጥ ክትፎ ቦሌ በ 350 ብር በታች የት መብላት እችላለሁ?",
    amharic: "በቦሌ ተመጣጣኝ የባህል ምግብ",
    highlight: "ትኩስ እና ተመጣጣኝ ባህላዊ ምርጫ",
  },
  {
    category: "meat",
    icon: "restaurant",
    badge: "Sizzling Meat",
    budget: "< 300 ETB",
    label: "Sizzling Tibs in Bole",
    query: "Where can I eat sizzling tibs in Bole under 300 ETB?",
    amharic: "ቦሌ ውስጥ ምርጥ ጥብስ በቅናሽ",
    highlight: "Clay shekla sizzling beef or lamb",
  },
  {
    category: "fasting",
    icon: "spa",
    badge: "Fasting & Vegan",
    budget: "< 200 ETB",
    label: "Budget Shiro in Kazanchis",
    query: "Where can I find flavorful budget shiro in Kazanchis under 200 ETB?",
    amharic: "ካዛንቺስ ተጋቢኖ ሽሮ",
    highlight: "Clay pot tegabino with fresh chili",
  },
  {
    category: "cafe",
    icon: "coffee",
    badge: "Specialty Café",
    budget: "Wi-Fi & Work",
    label: "Quiet Cafés with Great Coffee",
    query: "Which specialty cafés in Bole or Sarbet have good seating and top-tier Ethiopian coffee?",
    amharic: "ለስራ ምቹ ጸጥ ያሉ ካፌዎች",
    highlight: "Single-origin roast, pour-over, quiet corners",
  },
  {
    category: "fastfood",
    icon: "lunch_dining",
    badge: "Quick Bites",
    budget: "< 400 ETB",
    label: "Top Burgers under 400 ETB",
    query: "Which places in Bole serve high-rated burgers under 400 ETB?",
    amharic: "ቦሌ ውስጥ ጥራት ያለው ፈጣን በርገር",
    highlight: "Smash patties, brioche buns, fresh fries",
  },
  {
    category: "reservations",
    icon: "event_seat",
    badge: "Instant Table",
    budget: "Reservations",
    label: "Book a Dinner Table in Bole",
    query: "Which top restaurants in Bole accept online table reservations on Cafnet?",
    amharic: "ጠረጴዛ ማስያዝ የሚቻልባቸው",
    highlight: "Confirmed seating without the wait",
  },
  {
    category: "fasting",
    icon: "eco",
    badge: "Fasting Feast",
    budget: "< 350 ETB",
    label: "Generous Beyaynetu Platter",
    query: "Where can I find the most generous vegetarian Beyaynetu platter in Addis Ababa?",
    amharic: "ምርጥ የጾም በያይነቱ ቅንብር",
    highlight: "10+ hearty lentil, gomen, and vegetable stews",
  },
];

const POPULAR_NEIGHBORHOODS = [
  "All Addis Ababa",
  "Bole",
  "Kazanchis",
  "Piassa",
  "Sarbet",
  "Atlas",
  "Mexico",
  "Bisrate Gabriel",
  "CMC / Ayat",
];

const QUICK_PROMPT_PILLS = [
  { icon: "local_fire_department", text: "Best Kitfo in Bole", query: "Where is the best kitfo in Bole?" },
  { icon: "skillet", text: "Tibs < 300 ETB", query: "Where can I eat sizzling tibs under 300 ETB?" },
  { icon: "spa", text: "Fasting Shiro", query: "Where can I find the best fasting shiro in Kazanchis?" },
  { icon: "coffee", text: "Specialty Coffee", query: "Quiet cafés with top Ethiopian coffee and Wi-Fi" },
  { icon: "event_seat", text: "Reserve a Table", query: "Top restaurants in Bole that accept table bookings" },
  { icon: "translate", text: "በ 350 ብር በታች ምርጥ ምግብ", query: "በ 350 ብር በታች ምርጥ ምግብ የት ማግኘት እችላለሁ?" },
];

const LOADING_STEPS = [
  "Searching verified Addis Ababa restaurant menus...",
  "Cross-checking verified ETB menu prices...",
  "Verifying neighborhood locations & opening hours...",
  "Curating personalized culinary recommendations...",
];

function renderFormattedLine(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\b\d+(?:[.,]\d+)?\s*(?:ETB|Birr|ብር)\b)/gi);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-on-surface">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (/\b\d+(?:[.,]\d+)?\s*(?:ETB|Birr|ብር)\b/i.test(part)) {
      return (
        <span
          key={i}
          className="inline-flex items-center rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-950 border border-amber-300/70 mx-0.5 tracking-tight shadow-2xs"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

function FormattedMessage({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/);
  return (
    <div className="space-y-3.5 text-[14.5px] leading-relaxed text-on-surface">
      {paragraphs.map((para, idx) => {
        const lines = para.split("\n");
        const isBulletList =
          lines.length > 0 &&
          lines.every(
            (line) =>
              line.trim().startsWith("•") ||
              line.trim().startsWith("-") ||
              line.trim().startsWith("*") ||
              line.trim() === ""
          );

        if (isBulletList) {
          return (
            <ul key={idx} className="list-none space-y-2.5 pl-0.5 my-2">
              {lines
                .filter((l) => l.trim() !== "")
                .map((line, lIdx) => (
                  <li key={lIdx} className="flex items-start gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold mt-0.5">
                      ✓
                    </span>
                    <span className="flex-1 text-on-surface">
                      {renderFormattedLine(line.replace(/^[•\-\*]\s*/, ""))}
                    </span>
                  </li>
                ))}
            </ul>
          );
        }

        return (
          <p key={idx} className="whitespace-pre-wrap">
            {lines.map((line, lIdx) => (
              <span key={lIdx}>
                {renderFormattedLine(line)}
                {lIdx < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function RestaurantCard({ item }: { item: FoodSearchResult }) {
  const business = item.business;
  const menuItem = item.menu_item;
  const priceFormatted = menuItem?.price_etb_minor
    ? `${Math.round(menuItem.price_etb_minor / 100)} ETB`
    : null;

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-outline-variant/80 bg-white p-4.5 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                {business.cuisine || business.category || "Restaurant"}
              </span>
              {business.verification_status === "VERIFIED" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  Verified
                </span>
              )}
            </div>
            <h4 className="mt-1.5 text-base font-bold text-on-surface truncate group-hover:text-primary transition-colors">
              {business.name}
            </h4>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[15px] text-secondary">
                location_on
              </span>
              <span className="truncate">
                {business.neighborhood || business.location_name || "Addis Ababa"}
              </span>
              {business.price_range && (
                <>
                  <span className="text-outline/40">•</span>
                  <span className="font-semibold text-on-surface-variant">
                    {business.price_range}
                  </span>
                </>
              )}
            </div>
          </div>

          {priceFormatted && (
            <div className="text-right shrink-0">
              <span className="inline-block rounded-xl bg-amber-500/15 px-2.5 py-1 text-xs font-extrabold text-amber-950 border border-amber-300/80 shadow-2xs">
                {priceFormatted}
              </span>
            </div>
          )}
        </div>

        {menuItem && (
          <div className="mt-3 rounded-xl bg-surface-container-low/70 p-3 border border-outline-variant/60">
            <p className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-primary">
                restaurant_menu
              </span>
              <span>{menuItem.name}</span>
            </p>
            {menuItem.description && (
              <p className="mt-1 text-[11.5px] text-on-surface-variant leading-relaxed line-clamp-2">
                {menuItem.description}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-outline-variant/50">
        <Link
          href={`/business/${business.slug || business.id}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant bg-white px-3 py-2 text-xs font-bold text-on-surface hover:border-primary hover:text-primary transition-colors shadow-2xs"
        >
          <span>View Menu</span>
          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
        </Link>
        {business.reservation_available && (
          <Link
            href={`/reserve/${business.slug || business.id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0f46b8] transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">event_seat</span>
            <span>Reserve Table</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function FoodAssistantChat() {
  const { location: detectedLocation } = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [sessionID, setSessionID] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [activeLocation, setActiveLocation] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const locationMenuRef = useRef<HTMLDivElement>(null);

  // Sync detected location once available if not already altered
  useEffect(() => {
    if (detectedLocation && !activeLocation) {
      setActiveLocation(detectedLocation);
    }
  }, [detectedLocation, activeLocation]);

  // Loading step cycling animation
  useEffect(() => {
    if (!isLoading) {
      setLoadingStepIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStepIdx((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Auto scroll to latest message
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close location menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        locationMenuRef.current &&
        !locationMenuRef.current.contains(event.target as Node)
      ) {
        setIsLocationMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend !== undefined ? textToSend : inputQuery;
    const query = rawText.trim();
    if (!query || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const newUserMsg: ChatMessage = {
      id: userMessageId,
      role: "user",
      content: query,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    if (textToSend === undefined) {
      setInputQuery("");
    }
    setIsLoading(true);

    try {
      const response = await chatWithAssistant({
        session_id: sessionID || undefined,
        message: query,
        location: activeLocation && activeLocation !== "All Addis Ababa" ? activeLocation : undefined,
      });

      if (response.session_id) {
        setSessionID(response.session_id);
      }

      const botMessageId = `bot-${Date.now()}`;
      const results = response.results || response.items || [];
      const newBotMsg: ChatMessage = {
        id: botMessageId,
        role: "assistant",
        content: response.message,
        follow_up_suggestions: response.follow_up_suggestions || [],
        results: results.length > 0 ? results : undefined,
        canonical_dish: response.canonical_dish || undefined,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newBotMsg]);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect to assistant";
      const errorMsgId = `err-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: errorMsgId,
          role: "assistant",
          content: `We could not complete your request: ${errorMessage}. Please check your connection and try again.`,
          created_at: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSession = () => {
    setMessages([]);
    setSessionID(null);
    setInputQuery("");
    inputRef.current?.focus();
  };

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const filteredPrompts =
    selectedCategory === "all"
      ? STARTER_PROMPTS
      : STARTER_PROMPTS.filter((p) => p.category === selectedCategory);

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col bg-background">
      {/* Warm Ambient Culinary Lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-b from-amber-500/10 via-secondary/5 to-transparent blur-3xl opacity-70" />
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 md:py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Active Conversation Top Bar */}
          {messages.length > 0 && (
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-on-surface">Food Assistant</span>
                <span className="text-outline/60">•</span>
                <span className="text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-secondary">
                    near_me
                  </span>
                  {activeLocation || "All Addis Ababa"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetSession}
                className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant bg-white px-3 py-1.5 text-xs font-bold text-on-surface hover:border-primary hover:text-primary transition shadow-2xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">add_circle</span>
                <span>New Session</span>
              </button>
            </div>
          )}

          {/* =========================================================================
              IMPECCABLE HERO CONCIERGE STATE (when no messages yet)
              ========================================================================= */}
          {messages.length === 0 && (
            <div className="pt-2 pb-8 sm:pt-6">
              {/* Refined Concierge Heading */}
              <div className="text-center max-w-2xl mx-auto mb-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary-container/60 px-3.5 py-1 text-xs font-bold text-secondary mb-4 shadow-2xs">
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  <span>Cafnet Culinary Concierge · Grounded AI</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface">
                  Where would you like to eat?
                </h1>
                <p className="mt-1.5 text-sm sm:text-base font-medium text-secondary">
                  ምርጥ ምግብ የት መብላት ይፈልጋሉ?
                </p>
                <p className="mt-3 text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-xl mx-auto">
                  Instant culinary recommendations grounded in verified Addis Ababa restaurant menus, live ETB prices, and neighborhood gems.
                </p>
              </div>

              {/* Elevated Command Input Capsule */}
              <div className="mx-auto max-w-3xl mb-8">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="relative rounded-3xl border border-outline-variant/90 bg-white p-2 shadow-lg shadow-black/5 transition-all focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10"
                >
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Location Scope Pill inside Search Bar */}
                    <div className="relative shrink-0" ref={locationMenuRef}>
                      <button
                        type="button"
                        onClick={() => setIsLocationMenuOpen((prev) => !prev)}
                        className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-1.5 rounded-2xl bg-surface-container-low px-3.5 py-2.5 text-xs font-bold text-on-surface hover:bg-surface-container transition cursor-pointer"
                        title="Change neighborhood"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary">
                          location_on
                        </span>
                        <span className="truncate max-w-[120px]">
                          {activeLocation || "All Addis Ababa"}
                        </span>
                        <span className="material-symbols-outlined text-[14px] text-outline">
                          keyboard_arrow_down
                        </span>
                      </button>

                      {isLocationMenuOpen && (
                        <div className="absolute left-0 top-full mt-2 w-56 rounded-2xl border border-outline-variant bg-white p-1.5 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-outline">
                            Select Area
                          </div>
                          <div className="max-h-60 overflow-y-auto space-y-0.5">
                            {POPULAR_NEIGHBORHOODS.map((neighborhood) => {
                              const isSelected =
                                (neighborhood === "All Addis Ababa" && !activeLocation) ||
                                activeLocation === neighborhood;
                              return (
                                <button
                                  key={neighborhood}
                                  type="button"
                                  onClick={() => {
                                    setActiveLocation(
                                      neighborhood === "All Addis Ababa" ? "" : neighborhood
                                    );
                                    setIsLocationMenuOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                                    isSelected
                                      ? "bg-primary text-white"
                                      : "text-on-surface hover:bg-surface-container-low"
                                  }`}
                                >
                                  <span>{neighborhood}</span>
                                  {isSelected && (
                                    <span className="material-symbols-outlined text-[15px]">
                                      check
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Query Input */}
                    <div className="relative flex-1">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputQuery}
                        onChange={(e) => setInputQuery(e.target.value)}
                        placeholder="Ask e.g. 'Best kitfo near Atlas under 450 ETB' or 'ምርጥ ክትፎ'..."
                        disabled={isLoading}
                        className="w-full bg-transparent px-3 py-2 text-sm sm:text-base text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
                      />
                      {inputQuery && (
                        <button
                          type="button"
                          onClick={() => setInputQuery("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer p-1"
                          aria-label="Clear query"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading || !inputQuery.trim()}
                      className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-primary px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-[#0f46b8] active:scale-95 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
                    >
                      <span>Ask Assistant</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </form>

                {/* Fast Action Shortcuts */}
                <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Popular:
                  </span>
                  {QUICK_PROMPT_PILLS.slice(0, 4).map((item) => (
                    <button
                      key={item.text}
                      type="button"
                      onClick={() => handleSendMessage(item.query)}
                      className="inline-flex items-center gap-1 rounded-full border border-outline-variant/80 bg-white/80 px-3 py-1 text-xs font-semibold text-on-surface hover:border-primary hover:text-primary transition shadow-2xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px] text-secondary">
                        {item.icon}
                      </span>
                      <span>{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Curated Taste Vibes Section */}
              <div className="mt-8 border-t border-outline-variant/60 pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">
                      Curated Culinary Inspirations
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      Tap any scenario to explore verified restaurants and verified prices
                    </p>
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {CATEGORIES.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-foreground text-white shadow-xs"
                              : "border border-outline-variant/70 bg-white text-on-surface-variant hover:border-outline hover:text-on-surface"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Prompt Cards: Clean, High-Craft Editorial Layout */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredPrompts.map((starter) => (
                    <button
                      key={starter.query}
                      type="button"
                      onClick={() => handleSendMessage(starter.query)}
                      className="group relative flex flex-col justify-between rounded-2xl border border-outline-variant/80 bg-white p-4.5 text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-secondary/40 hover:shadow-md cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-950 border border-amber-300/70">
                            {starter.budget}
                          </span>
                          <span className="rounded-md bg-surface-container px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                            {starter.badge}
                          </span>
                        </div>

                        <h3 className="mt-3 text-sm font-bold text-on-surface group-hover:text-primary transition-colors flex items-center justify-between">
                          <span>{starter.label}</span>
                          <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                            north_east
                          </span>
                        </h3>

                        {starter.highlight && (
                          <p className="mt-1 text-[11px] font-medium text-secondary">
                            {starter.highlight}
                          </p>
                        )}

                        <p className="mt-1.5 text-xs text-on-surface-variant/80 leading-relaxed line-clamp-2">
                          "{starter.query}"
                        </p>
                      </div>

                      <div className="mt-3.5 pt-2.5 border-t border-outline-variant/50 text-[11.5px] font-bold text-on-surface-variant group-hover:text-secondary transition-colors">
                        {starter.amharic}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              CHAT CONVERSATION FLOW (when messages exist)
              ========================================================================= */}
          {messages.map((msg) => {
            if (msg.role === "user") {
              return (
                <div key={msg.id} className="flex justify-end items-end gap-2">
                  <div className="max-w-[85%] sm:max-w-[70%] rounded-3xl rounded-tr-xs bg-foreground px-5 py-3.5 text-white shadow-md">
                    <p className="text-[14.5px] font-medium leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <div className="mt-1.5 text-right text-[10px] text-white/60">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            // Assistant Response Card
            const isCopied = copiedId === msg.id;
            return (
              <div key={msg.id} className="flex items-start gap-3 sm:gap-4 animate-in fade-in duration-200">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-secondary text-white shadow-sm mt-1">
                  <span className="material-symbols-outlined text-[18px]">restaurant</span>
                </div>

                <div className="flex-1 space-y-4 max-w-full">
                  {/* Natural Language Speech Bubble */}
                  <div className="rounded-3xl rounded-tl-xs border border-outline-variant/80 bg-white p-5 sm:p-6 text-on-surface shadow-xs">
                    <div className="mb-3 flex items-center justify-between border-b border-outline-variant/50 pb-2.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-secondary">
                        <span className="material-symbols-outlined text-[15px]">verified</span>
                        <span>Cafnet Food Assistant</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-outline hover:text-on-surface hover:bg-surface-container-low transition cursor-pointer"
                        title="Copy answer"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isCopied ? "check" : "content_copy"}
                        </span>
                        <span>{isCopied ? "Copied" : "Copy"}</span>
                      </button>
                    </div>

                    <FormattedMessage text={msg.content} />

                    {msg.isError && (
                      <div className="mt-4 flex items-center gap-2 border-t border-outline-variant/60 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            const lastUser = [...messages]
                              .reverse()
                              .find((m) => m.role === "user");
                            if (lastUser) handleSendMessage(lastUser.content);
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white hover:bg-primary/90 transition cursor-pointer shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[15px]">replay</span>
                          <span>Retry Query</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Structured Restaurant Cards Grid */}
                  {msg.results && msg.results.length > 0 && (
                    <div>
                      <div className="mb-2.5 flex items-center justify-between text-xs">
                        <span className="font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-secondary">
                            storefront
                          </span>
                          Verified Restaurant Matches ({msg.results.length})
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        {msg.results.map((resItem, idx) => (
                          <RestaurantCard
                            key={`${resItem.business.id}-${resItem.menu_item?.id || idx}`}
                            item={resItem}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up Suggestion Chips */}
                  {msg.follow_up_suggestions && msg.follow_up_suggestions.length > 0 && (
                    <div className="pt-1">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-secondary">
                          lightbulb
                        </span>
                        Continue exploring:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.follow_up_suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleSendMessage(suggestion)}
                            className="group inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-white px-3.5 py-1.5 text-xs font-semibold text-on-surface hover:border-primary hover:text-primary hover:bg-primary-container/30 transition-all cursor-pointer shadow-2xs"
                          >
                            <span>{suggestion}</span>
                            <span className="material-symbols-outlined text-[14px] text-outline group-hover:text-primary group-hover:translate-x-0.5 transition-transform">
                              arrow_forward
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Interactive Loading State */}
          {isLoading && (
            <div className="flex items-start gap-3 sm:gap-4 animate-in fade-in duration-200">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-secondary text-white shadow-sm mt-1 animate-pulse">
                <span className="material-symbols-outlined text-[18px]">restaurant</span>
              </div>
              <div className="rounded-3xl rounded-tl-xs border border-outline-variant/80 bg-white p-5 shadow-xs max-w-md">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-2 rounded-full bg-secondary animate-bounce" />
                  </div>
                  <span className="text-xs font-bold text-on-surface">
                    {LOADING_STEPS[loadingStepIdx]}
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-secondary to-primary animate-pulse" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Bottom Input Dock (shown when conversation is active) */}
      {messages.length > 0 && (
        <div className="sticky bottom-0 z-20 border-t border-outline-variant/70 bg-white/90 px-4 py-3 backdrop-blur-xl pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6">
          <div className="mx-auto max-w-4xl">
            {/* Quick Suggestions Bar */}
            <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-bold text-on-surface-variant shrink-0 mr-1">
                Quick:
              </span>
              {QUICK_PROMPT_PILLS.map((pill) => (
                <button
                  key={pill.text}
                  type="button"
                  onClick={() => handleSendMessage(pill.query)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-outline-variant/80 bg-white px-2.5 py-1 text-[11px] font-semibold text-on-surface hover:border-primary hover:text-primary transition cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[12px] text-secondary">
                    {pill.icon}
                  </span>
                  <span>{pill.text}</span>
                </button>
              ))}
            </div>

            {/* Form Capsule */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask a follow-up or search for another dish..."
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-outline-variant/90 bg-white px-4.5 py-3 pr-10 text-sm text-on-surface placeholder:text-on-surface-variant/60 shadow-xs focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20 transition-all"
                />
                {inputQuery && (
                  <button
                    type="button"
                    onClick={() => setInputQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer p-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !inputQuery.trim()}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/20 transition-all hover:bg-[#0f46b8] active:scale-95 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
                aria-label="Send message"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </form>

            <p className="mt-2 text-center text-[10px] text-on-surface-variant/70">
              Powered by Cafnet Gemini RAG · Grounded in verified Addis Ababa restaurant menus & verified prices
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

