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
  icon: string;
}

const CATEGORIES: CategoryFilter[] = [
  { id: "all", label: "All", icon: "explore" },
  { id: "traditional", label: "Traditional (ባህላዊ)", icon: "local_fire_department" },
  { id: "meat", label: "Tibs & Grills", icon: "restaurant" },
  { id: "fasting", label: "Fasting & Shiro (የጾም)", icon: "spa" },
  { id: "cafe", label: "Cafés & Coffee", icon: "coffee" },
  { id: "fastfood", label: "Burgers & Casual", icon: "lunch_dining" },
  { id: "reservations", label: "Table Bookings", icon: "event_seat" },
];

const STARTER_PROMPTS = [
  {
    category: "traditional",
    icon: "local_fire_department",
    badge: "Traditional",
    budget: "< 450 ETB",
    label: "Best Kitfo near Atlas",
    query: "Where is the best kitfo near Atlas and what are typical prices?",
    amharic: "አትላስ አካባቢ ምርጥ ክትፎ",
    iconBg: "bg-amber-500/10 text-amber-600",
  },
  {
    category: "traditional",
    icon: "translate",
    badge: "Amharic Search",
    budget: "< 350 ETB",
    label: "ምርጥ ክትፎ ቦሌ",
    query: "ምርጥ ክትፎ ቦሌ በ 350 ብር በታች የት መብላት እችላለሁ?",
    amharic: "በቦሌ ተመጣጣኝ የባህል ምግብ",
    iconBg: "bg-orange-500/10 text-orange-600",
  },
  {
    category: "meat",
    icon: "restaurant",
    badge: "Meat & Grill",
    budget: "< 300 ETB",
    label: "Tibs in Bole",
    query: "Where can I eat sizzling tibs in Bole under 300 ETB?",
    amharic: "ቦሌ ውስጥ ምርጥ ጥብስ በቅናሽ",
    iconBg: "bg-rose-500/10 text-rose-600",
  },
  {
    category: "fasting",
    icon: "spa",
    badge: "Vegetarian / Fasting",
    budget: "< 200 ETB",
    label: "Budget Shiro in Kazanchis",
    query: "Where can I find flavorful budget shiro in Kazanchis under 200 ETB?",
    amharic: "ካዛንቺስ ተጋቢኖ ሽሮ",
    iconBg: "bg-emerald-500/10 text-emerald-600",
  },
  {
    category: "cafe",
    icon: "coffee",
    badge: "Café & Work",
    budget: "Good Wi-Fi",
    label: "Quiet Cafés with Great Coffee",
    query: "Which specialty cafés in Bole or Sarbet have good seating and top-tier Ethiopian coffee?",
    amharic: "ለስራ ምቹ ካፌዎች",
    iconBg: "bg-amber-700/10 text-amber-800",
  },
  {
    category: "fastfood",
    icon: "lunch_dining",
    badge: "Fast Casual",
    budget: "< 400 ETB",
    label: "Burgers under 400 ETB",
    query: "Which places in Bole serve high-rated burgers under 400 ETB?",
    amharic: "ቦሌ ውስጥ ፈጣን በርገር",
    iconBg: "bg-cyan-600/10 text-cyan-700",
  },
  {
    category: "reservations",
    icon: "event_seat",
    badge: "Reservations",
    budget: "Instant Booking",
    label: "Book a Table in Bole",
    query: "Which top restaurants in Bole accept online table reservations on Cafnet?",
    amharic: "ጠረጴዛ ማስያዝ የሚቻልባቸው",
    iconBg: "bg-purple-600/10 text-purple-700",
  },
  {
    category: "fasting",
    icon: "local_florist",
    badge: "Fasting Combo",
    budget: "< 350 ETB",
    label: "Beyaynetu Platter",
    query: "Where can I find the most generous vegetarian Beyaynetu platter in Addis Ababa?",
    amharic: "ምርጥ የጾም በያይነቱ",
    iconBg: "bg-teal-600/10 text-teal-700",
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
  "🥘 Best Kitfo in Bole",
  "🥩 Tibs under 300 ETB",
  "🌱 Fasting Shiro in Kazanchis",
  "☕ Cafés with Wi-Fi",
  "📅 Reserve a table",
  "🇪🇹 በ 300 ብር በታች ምርጥ ምግብ",
];

const LOADING_STEPS = [
  "Searching verified Addis Ababa restaurant menus...",
  "Cross-checking latest ETB menu prices...",
  "Verifying neighborhood locations & hours...",
  "Composing culinary recommendations...",
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
          className="inline-flex items-center rounded-md bg-amber-500/15 px-1.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-300/60 mx-0.5 tracking-tight"
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
    <div className="space-y-3.5 text-sm leading-relaxed text-on-surface">
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
            <ul key={idx} className="list-none space-y-2 pl-1">
              {lines
                .filter((l) => l.trim() !== "")
                .map((line, lIdx) => (
                  <li key={lIdx} className="flex items-start gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
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
    <div className="group flex flex-col justify-between rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-4 transition-all duration-200 hover:border-primary/50 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                {business.cuisine || business.category || "Restaurant"}
              </span>
              {business.verification_status === "VERIFIED" && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700 border border-emerald-200/50">
                  <span className="material-symbols-outlined text-[11px]">verified</span>
                  Verified
                </span>
              )}
            </div>
            <h4 className="mt-1 text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
              {business.name}
            </h4>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px] text-secondary">
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
              <span className="inline-block rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-extrabold text-amber-900 border border-amber-300/60">
                {priceFormatted}
              </span>
            </div>
          )}
        </div>

        {menuItem && (
          <div className="mt-2.5 rounded-lg bg-surface-container-low/70 p-2.5 border border-outline-variant/40">
            <p className="text-xs font-semibold text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary">
                restaurant_menu
              </span>
              {menuItem.name}
            </p>
            {menuItem.description && (
              <p className="mt-0.5 text-[11px] text-on-surface-variant line-clamp-2">
                {menuItem.description}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-outline-variant/40">
        <Link
          href={`/business/${business.slug || business.id}`}
          className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-outline-variant bg-white px-2.5 py-1.5 text-xs font-semibold text-on-surface hover:border-primary hover:text-primary transition-colors"
        >
          <span>View Menu</span>
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
        {business.reservation_available && (
          <Link
            href={`/reserve/${business.slug || business.id}`}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#0f46b8] transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">event_seat</span>
            <span>Reserve</span>
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    <div className="relative flex min-h-[calc(100vh-5rem)] flex-col bg-background">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-primary/5 via-amber-500/5 to-transparent blur-3xl opacity-60" />
      </div>

      {/* Main Conversation Canvas */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-5">
          {/* Active Chat Header Bar (only shown when conversation has started) */}
          {messages.length > 0 && (
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/50 text-xs">
              <span className="font-semibold text-on-surface-variant flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Food Assistant Active
              </span>
              <button
                type="button"
                onClick={handleResetSession}
                className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-white px-2.5 py-1 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:border-outline transition cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-[15px]">refresh</span>
                <span>New Chat</span>
              </button>
            </div>
          )}

          {/* Clean & Focused Empty State (Category Pills + Prompt Grid) */}
          {messages.length === 0 && (
            <div className="pt-2 pb-4">
              {/* Category Pills */}
              <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary text-white shadow-sm shadow-primary/25"
                          : "border border-outline-variant/80 bg-white text-on-surface-variant hover:border-primary/40 hover:text-on-surface"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Starter Prompts Grid */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPrompts.map((starter) => (
                  <button
                    key={starter.query}
                    type="button"
                    onClick={() => handleSendMessage(starter.query)}
                    className="group relative flex flex-col justify-between rounded-2xl border border-outline-variant/70 bg-white p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${starter.iconBg}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {starter.icon}
                          </span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-md bg-surface-container-low px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant border border-outline-variant/50">
                            {starter.budget}
                          </span>
                          <span className="rounded-md bg-primary-container/40 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                            {starter.badge}
                          </span>
                        </div>
                      </div>

                      <h3 className="mt-2.5 text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                        {starter.label}
                      </h3>
                      <p className="mt-1 text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                        "{starter.query}"
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-outline-variant/40 pt-2 text-[11px] text-secondary font-semibold">
                      <span className="truncate">{starter.amharic}</span>
                      <span className="material-symbols-outlined text-[16px] text-primary transition-transform duration-200 group-hover:translate-x-1">
                        arrow_forward
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages List */}
          {messages.map((msg) => {
            if (msg.role === "user") {
              return (
                <div key={msg.id} className="flex justify-end items-end gap-2">
                  <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tr-xs bg-gradient-to-tr from-primary to-[#1848b8] px-4.5 py-3.5 text-white shadow-md">
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <div className="mt-1 text-right text-[10px] text-white/70">
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
              <div key={msg.id} className="flex items-start gap-3 sm:gap-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-[#f97316] text-white shadow-sm mt-1">
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                </div>

                <div className="flex-1 space-y-3.5 max-w-full">
                  {/* Natural Language Speech Bubble */}
                  <div className="rounded-2xl rounded-tl-xs border border-outline-variant/70 bg-white p-5 text-on-surface shadow-xs transition-shadow hover:shadow-sm">
                    <div className="mb-2 flex items-center justify-between border-b border-outline-variant/40 pb-2 text-[11px] text-on-surface-variant font-medium">
                      <span className="flex items-center gap-1.5 font-bold text-primary">
                        <span className="material-symbols-outlined text-[14px]">restaurant</span>
                        Cafnet Culinary Intelligence
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-outline hover:text-on-surface transition cursor-pointer"
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
                      <div className="mt-4 flex items-center gap-2 border-t border-outline-variant/50 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            const lastUser = [...messages]
                              .reverse()
                              .find((m) => m.role === "user");
                            if (lastUser) handleSendMessage(lastUser.content);
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition cursor-pointer shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[14px]">replay</span>
                          Retry Request
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Structured Restaurant Cards Grid */}
                  {msg.results && msg.results.length > 0 && (
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-primary">
                            storefront
                          </span>
                          Verified Restaurant Matches ({msg.results.length})
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    <div className="pt-0.5">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-secondary">
                          lightbulb
                        </span>
                        Suggested follow-ups:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.follow_up_suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleSendMessage(suggestion)}
                            className="group inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-container/30 px-3.5 py-1.5 text-xs font-semibold text-primary hover:border-primary hover:bg-primary hover:text-white transition-all cursor-pointer shadow-2xs hover:shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[14px] group-hover:rotate-45 transition-transform">
                              arrow_outward
                            </span>
                            <span>{suggestion}</span>
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
            <div className="flex items-start gap-3 sm:gap-3.5 animate-in fade-in duration-200">
              <div className="relative flex size-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-[#f97316] text-white shadow-sm mt-1 animate-pulse">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              </div>
              <div className="rounded-2xl rounded-tl-xs border border-primary/20 bg-white/95 p-4.5 shadow-sm max-w-md">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-2 rounded-full bg-primary animate-bounce" />
                  </div>
                  <span className="text-xs font-semibold text-on-surface">
                    {LOADING_STEPS[loadingStepIdx]}
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Bottom Input Dock */}
      <div className="sticky bottom-0 z-20 border-t border-outline-variant/60 bg-white/85 px-4 py-3 backdrop-blur-xl pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Quick Shortcuts Bar during chat */}
          {messages.length > 0 && (
            <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-bold text-on-surface-variant shrink-0 mr-1">
                Quick:
              </span>
              {QUICK_PROMPT_PILLS.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => handleSendMessage(pill.replace(/^[^\w\s\u1200-\u137F]+/, "").trim())}
                  className="inline-flex shrink-0 items-center rounded-full border border-outline-variant/70 bg-white px-2.5 py-1 text-[11px] font-semibold text-on-surface hover:border-primary hover:text-primary transition cursor-pointer shadow-2xs"
                >
                  {pill}
                </button>
              ))}
            </div>
          )}

          {/* Location Area Context & Switcher Dropdown */}
          <div className="mb-2 flex items-center justify-between text-xs text-on-surface-variant relative" ref={locationMenuRef}>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-secondary">
                near_me
              </span>
              <span>Scope:</span>
              <button
                type="button"
                onClick={() => setIsLocationMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-0.5 font-bold text-on-surface hover:text-primary transition cursor-pointer"
              >
                <span>{activeLocation || "All Addis Ababa"}</span>
                <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
              </button>
            </div>

            {activeLocation && (
              <button
                type="button"
                onClick={() => setActiveLocation("")}
                className="hover:underline text-[11px] text-secondary font-semibold cursor-pointer"
              >
                Clear filter
              </button>
            )}

            {isLocationMenuOpen && (
              <div className="absolute left-0 bottom-full mb-1.5 w-52 rounded-2xl border border-outline-variant bg-white p-1.5 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-outline">
                  Select Neighborhood
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
                        className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-primary text-white font-semibold"
                            : "text-on-surface hover:bg-surface-container-low"
                        }`}
                      >
                        <span>{neighborhood}</span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Form and Input Capsule */}
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
                placeholder="Ask e.g. 'Best kitfo in Bole under 350 ETB' or 'ምርጥ ክትፎ ቦሌ'..."
                disabled={isLoading}
                className="w-full rounded-2xl border border-outline-variant/80 bg-surface-container-lowest px-4.5 py-3.5 pr-10 text-sm text-on-surface placeholder:text-on-surface-variant/60 shadow-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-3 focus:ring-primary/20 transition-all"
              />
              {inputQuery && (
                <button
                  type="button"
                  onClick={() => setInputQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer p-1"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-[#2563eb] text-white shadow-md shadow-primary/25 transition-all duration-200 hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
              aria-label="Send query"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>

          {/* Footnote Grounding notice */}
          <p className="mt-2 text-center text-[10px] text-on-surface-variant/70">
            Powered by Cafnet Gemini RAG · Grounded in real restaurant menus & verified ETB prices
          </p>
        </div>
      </div>
    </div>
  );
}
