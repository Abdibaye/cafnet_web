"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { chatWithAssistant } from "@/lib/api/assistant";
import { formatPriceEtb, businessToCardItem } from "@/lib/api/adapters";
import type { FoodSearchResult, FoodSearchFilter, CanonicalDish } from "@/lib/api/types";
import { useLocation } from "@/components/LocationProvider";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  items?: FoodSearchResult[];
  search_filter?: FoodSearchFilter | null;
  canonical_dish?: CanonicalDish | null;
  follow_up_suggestions?: string[];
  fallback_used?: boolean;
  intent?: string;
  created_at: string;
  isError?: boolean;
}

const STARTER_PROMPTS = [
  {
    icon: "restaurant",
    label: "Tibs in Bole",
    query: "Where can I eat tibs in Bole under 300 ETB?",
    category: "Meat & Grill",
  },
  {
    icon: "local_fire_department",
    label: "Best Kitfo near Atlas",
    query: "Best kitfo near Atlas with good rating",
    category: "Traditional",
  },
  {
    icon: "savings",
    label: "Budget Shiro",
    query: "Budget shiro in Kazanchis under 200 ETB",
    category: "Vegetarian",
  },
  {
    icon: "translate",
    label: "ምርጥ ክትፎ ቦሌ",
    query: "ምርጥ ክትፎ ቦሌ በ 350 ብር በታች",
    category: "Amharic Search",
  },
  {
    icon: "lunch_dining",
    label: "Burgers under 400 ETB",
    query: "Top rated burgers in Bole under 400 ETB",
    category: "Fast Food",
  },
  {
    icon: "local_cafe",
    label: "Coffee in Piazza",
    query: "Traditional coffee or macchiato in Piazza",
    category: "Café & Coffee",
  },
];

export default function FoodAssistantChat() {
  const { location: detectedLocation } = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [sessionID, setSessionID] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeLocation, setActiveLocation] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync detected location once available if not already manually altered
  useEffect(() => {
    if (detectedLocation && !activeLocation) {
      setActiveLocation(detectedLocation);
    }
  }, [detectedLocation, activeLocation]);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
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
        location: activeLocation || undefined,
      });

      if (response.session_id) {
        setSessionID(response.session_id);
      }

      const botMessageId = `bot-${Date.now()}`;
      const newBotMsg: ChatMessage = {
        id: botMessageId,
        role: "assistant",
        content: response.message,
        items: response.items || response.results || [],
        search_filter: response.search_filter,
        canonical_dish: response.canonical_dish,
        follow_up_suggestions: response.follow_up_suggestions || [],
        fallback_used: response.fallback_used,
        intent: response.intent,
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

  return (
    <div className="flex h-full min-h-[calc(100vh-5rem)] flex-col bg-background">
      {/* Top Header / Bar */}
      <div className="sticky top-16 z-20 border-b border-outline-variant/70 bg-white/95 backdrop-blur-md md:top-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-[#387bf7] text-white shadow-sm">
              <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-on-surface sm:text-lg">
                  Cafnet Food Assistant
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Verified Menus
                </span>
              </div>
              <p className="text-xs text-on-surface-variant line-clamp-1">
                Grounded search by dish, budget, and neighborhood across Addis Ababa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleResetSession}
                className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-2.5 py-1.5 text-xs font-semibold text-on-surface-variant hover:border-outline hover:text-on-surface transition-colors cursor-pointer"
                title="Start a new chat session"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span className="hidden sm:inline">New Chat</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Empty State / Welcome Hero */}
          {messages.length === 0 && (
            <div className="py-6 sm:py-10">
              <div className="text-center">
                <div className="mx-auto inline-flex size-16 items-center justify-center rounded-2xl bg-primary-container text-primary shadow-sm mb-4">
                  <span className="material-symbols-outlined text-[34px]">restaurant_menu</span>
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">
                  Where would you like to eat today?
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-on-surface-variant sm:text-base leading-relaxed">
                  Tell me what you are craving, your budget in ETB, or preferred neighborhood.
                  I answer with real restaurant menus and verified prices.
                </p>
              </div>

              {/* Starter Prompts Grid */}
              <div className="mt-8">
                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-secondary">
                  Try asking
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {STARTER_PROMPTS.map((starter) => (
                    <button
                      key={starter.query}
                      type="button"
                      onClick={() => handleSendMessage(starter.query)}
                      className="group flex flex-col justify-between rounded-2xl border border-outline-variant/80 bg-white p-4 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-container text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <span className="material-symbols-outlined text-[18px]">
                            {starter.icon}
                          </span>
                        </span>
                        <div>
                          <span className="text-[11px] font-semibold text-secondary">
                            {starter.category}
                          </span>
                          <p className="mt-0.5 text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                            {starter.label}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-on-surface-variant line-clamp-2 italic">
                        "{starter.query}"
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages List */}
          {messages.map((msg) => {
            if (msg.role === "user") {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs bg-primary px-4 py-3 text-white shadow-sm">
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              );
            }

            // Assistant Message
            const hasItems = msg.items && msg.items.length > 0;
            const filter = msg.search_filter;
            const dishName = msg.canonical_dish?.name || filter?.query;
            const hasCriteria = Boolean(dishName || filter?.neighborhood || filter?.max_price_etb_minor || filter?.min_rating);

            return (
              <div key={msg.id} className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary shadow-xs mt-1">
                  <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                </div>

                <div className="flex-1 space-y-3 max-w-full">
                  {/* Speech Bubble */}
                  <div className="rounded-2xl rounded-tl-xs border border-outline-variant/70 bg-white p-4 text-on-surface shadow-xs">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>

                    {/* Grounding Filter Badges */}
                    {hasCriteria && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-outline-variant/40 pt-2.5">
                        <span className="text-[11px] font-semibold text-on-surface-variant">
                          Understood:
                        </span>
                        {dishName && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-primary-container/70 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            <span className="material-symbols-outlined text-[13px]">restaurant</span>
                            Dish: {dishName}
                          </span>
                        )}
                        {filter?.neighborhood && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-secondary-container/70 px-2 py-0.5 text-[11px] font-semibold text-secondary">
                            <span className="material-symbols-outlined text-[13px]">location_on</span>
                            Area: {filter.neighborhood}
                          </span>
                        )}
                        {Boolean(filter?.max_price_etb_minor) && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200/50">
                            <span className="material-symbols-outlined text-[13px]">payments</span>
                            Budget: Under {(filter!.max_price_etb_minor! / 100).toLocaleString()} ETB
                          </span>
                        )}
                        {Boolean(filter?.min_rating) && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200/50">
                            <span className="material-symbols-outlined text-[13px]">star</span>
                            ★ {filter!.min_rating}+
                          </span>
                        )}
                        {msg.fallback_used && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-variant">
                            Exact match fallback
                          </span>
                        )}
                      </div>
                    )}

                    {msg.isError && (
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const lastUser = [...messages].reverse().find((m) => m.role === "user");
                            if (lastUser) handleSendMessage(lastUser.content);
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">replay</span>
                          Retry
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Grounded Restaurant Cards Grid */}
                  {hasItems && (
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 pt-1">
                      {msg.items!.map((item) => {
                        const biz = item.business;
                        const menuItem = item.menu_item;
                        const area = biz.neighborhood || biz.location_name || "Addis Ababa";
                        const priceFormatted = formatPriceEtb(menuItem.price_etb_minor);
                        const cardItem = businessToCardItem(biz);
                        const rating = item.rating || cardItem.rating || 0;
                        const reviews = item.review_count || cardItem.reviews || 0;

                        return (
                          <div
                            key={`${biz.id}-${menuItem.id}`}
                            className="group flex flex-col justify-between rounded-2xl border border-outline-variant/80 bg-white p-4 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                          >
                            <div>
                              {/* Header: Restaurant name & Rating */}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <Link
                                    href={`/business/${biz.id}`}
                                    className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors hover:underline"
                                  >
                                    {biz.name}
                                  </Link>
                                  <div className="mt-0.5 flex items-center gap-1 text-xs text-on-surface-variant">
                                    <span className="material-symbols-outlined text-[13px] text-secondary">
                                      location_on
                                    </span>
                                    <span>{area}</span>
                                    {biz.cuisine && (
                                      <>
                                        <span>•</span>
                                        <span>{biz.cuisine}</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {rating > 0 && (
                                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200/60">
                                    ★ {rating.toFixed(1)}
                                    {reviews > 0 && (
                                      <span className="text-[10px] text-amber-700/80 font-normal">
                                        ({reviews})
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>

                              {/* Authentic Menu Item Info */}
                              <div className="mt-3.5 rounded-xl bg-surface-container-low/70 p-3 border border-outline-variant/40">
                                <div className="flex items-baseline justify-between gap-2">
                                  <h3 className="text-sm font-bold text-on-surface">
                                    {menuItem.name}
                                  </h3>
                                  <span className="text-sm font-extrabold text-primary whitespace-nowrap">
                                    {priceFormatted}
                                  </span>
                                </div>
                                {menuItem.description && (
                                  <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">
                                    {menuItem.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons & Taxonomy Tag */}
                            <div className="mt-3.5 flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/40">
                              {item.canonical_dish ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-primary-container/40 px-2 py-0.5 text-[10px] font-medium text-primary">
                                  {item.canonical_dish.name}
                                </span>
                              ) : (
                                <span className="text-[10px] text-on-surface-variant">
                                  Menu match
                                </span>
                              )}

                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/business/${biz.id}`}
                                  className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/80 px-2.5 py-1 text-xs font-semibold text-on-surface hover:border-primary/50 hover:text-primary transition-colors"
                                >
                                  View Menu
                                </Link>
                                {biz.reservation_available !== false && (
                                  <Link
                                    href={`/reserve?business_id=${biz.id}`}
                                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
                                  >
                                    Reserve
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Follow-up Suggestion Chips */}
                  {msg.follow_up_suggestions && msg.follow_up_suggestions.length > 0 && (
                    <div className="pt-1">
                      <p className="mb-2 text-[11px] font-semibold text-on-surface-variant">
                        Follow-up suggestions:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.follow_up_suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleSendMessage(suggestion)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-container/40 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              chat_bubble_outline
                            </span>
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary shadow-xs animate-pulse">
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              </div>
              <div className="rounded-2xl rounded-tl-xs border border-outline-variant/70 bg-white px-4 py-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-2 rounded-full bg-primary animate-bounce" />
                  </div>
                  <span className="text-xs text-on-surface-variant font-medium">
                    Searching real restaurant menus & prices...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Sticky Input Bar */}
      <div className="sticky bottom-0 z-20 border-t border-outline-variant/80 bg-white/95 px-4 py-3 backdrop-blur-md pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Location Context indicator */}
          <div className="mb-2 flex items-center justify-between text-xs text-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-secondary">
                near_me
              </span>
              <span>
                Searching area:{" "}
                <span className="font-semibold text-on-surface">
                  {activeLocation || "All Addis Ababa"}
                </span>
              </span>
            </div>
            {activeLocation && (
              <button
                type="button"
                onClick={() => setActiveLocation("")}
                className="hover:underline text-[11px] text-on-surface-variant cursor-pointer"
              >
                Clear location filter
              </button>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask e.g., 'Best kitfo in Bole under 350 ETB' or 'ምርጥ ክትፎ ቦሌ'..."
                disabled={isLoading}
                className="w-full rounded-2xl border border-outline-variant/80 bg-surface-container-lowest px-4 py-3.5 pr-10 text-sm text-on-surface placeholder:text-on-surface-variant/60 shadow-xs focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {inputQuery && (
                <button
                  type="button"
                  onClick={() => setInputQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-sm transition-all duration-200 hover:bg-primary/90 active:scale-95 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
              aria-label="Send message"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>

          <p className="mt-2 text-center text-[11px] text-on-surface-variant/70">
            Powered by Cafnet AI & real restaurant database · Prices in Ethiopian Birr (ETB)
          </p>
        </div>
      </div>
    </div>
  );
}
