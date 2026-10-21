"use client";

import { useEffect, useRef, useState } from "react";
import { chatWithAssistant } from "@/lib/api/assistant";
import { useLocation } from "@/components/LocationProvider";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  follow_up_suggestions?: string[];
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
    query: "Where is the best kitfo near Atlas and what are typical prices?",
    category: "Traditional",
  },
  {
    icon: "savings",
    label: "Budget Shiro",
    query: "Where can I find budget shiro in Kazanchis under 200 ETB?",
    category: "Vegetarian",
  },
  {
    icon: "translate",
    label: "ምርጥ ክትፎ ቦሌ",
    query: "ምርጥ ክትፎ ቦሌ በ 350 ብር በታች የት መብላት እችላለሁ?",
    category: "Amharic Search",
  },
  {
    icon: "lunch_dining",
    label: "Burgers under 400 ETB",
    query: "Which places in Bole serve burgers under 400 ETB?",
    category: "Fast Food",
  },
  {
    icon: "event_seat",
    label: "Table Reservations",
    query: "Which restaurants in Bole accept table reservations on Cafnet?",
    category: "Reservations",
  },
];

function renderFormattedLine(text: string) {
  // Support **bold** markdown formatting
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-on-surface">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function FormattedMessage({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-on-surface">
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
            <ul key={idx} className="list-disc pl-5 space-y-1.5 text-on-surface">
              {lines
                .filter((l) => l.trim() !== "")
                .map((line, lIdx) => (
                  <li key={lIdx}>{renderFormattedLine(line.replace(/^[•\-\*]\s*/, ""))}</li>
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
        follow_up_suggestions: response.follow_up_suggestions || [],
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
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
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
                  Gemini RAG
                </span>
              </div>
              <p className="text-xs text-on-surface-variant line-clamp-1">
                Grounded dining answers from verified Addis Ababa menus and documents
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
        <div className="mx-auto max-w-3xl space-y-6">
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
                  Ask anything about dishes, prices, hours, or neighborhoods across Addis Ababa.
                  Answers are grounded in Cafnet's verified restaurant directory.
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
            return (
              <div key={msg.id} className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary shadow-xs mt-1">
                  <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                </div>

                <div className="flex-1 space-y-3 max-w-full">
                  {/* Natural Language RAG Speech Bubble */}
                  <div className="rounded-2xl rounded-tl-xs border border-outline-variant/70 bg-white p-5 text-on-surface shadow-xs">
                    <FormattedMessage text={msg.content} />

                    {msg.isError && (
                      <div className="mt-4 flex items-center gap-2 border-t border-outline-variant/50 pt-3">
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

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary shadow-xs animate-pulse">
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              </div>
              <div className="rounded-2xl rounded-tl-xs border border-outline-variant/70 bg-white px-5 py-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-2 rounded-full bg-primary animate-bounce" />
                  </div>
                  <span className="text-xs text-on-surface-variant font-medium">
                    Searching verified restaurant documents & generating answer...
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
        <div className="mx-auto max-w-3xl">
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
            Powered by Cafnet Gemini RAG · Grounded in verified restaurant menus · Prices in ETB
          </p>
        </div>
      </div>
    </div>
  );
}
