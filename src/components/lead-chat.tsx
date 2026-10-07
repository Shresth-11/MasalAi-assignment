"use client";

import React, { useRef, useEffect, useState } from "react";
import { useChat } from "ai/react";
import { Lead, LeadAnalysis, LeadMessage } from "@/db/schema";
import { Button } from "./ui/button";
import { Send, Copy, Check, MessageSquare } from "lucide-react";

interface LeadChatProps {
  leadId: string;
  lead?: Lead | null;
  analysis?: LeadAnalysis | null;
  initialMessages?: LeadMessage[];
}

const QUICK_CHIPS = [
  "What should I emphasize on the call?",
  "Make my reply more assertive",
  "Shorter version for WhatsApp",
  "How to handle their price objection?",
];

export function LeadChat({ leadId, lead, analysis, initialMessages = [] }: LeadChatProps) {
  const { messages, input, handleInputChange, handleSubmit, append, isLoading, error } = useChat({
    api: "/api/chat",
    body: {
      leadId,
      leadFallback: lead,
      analysisFallback: analysis,
    },
    initialMessages: initialMessages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleChipClick = (chipText: string) => {
    append({
      role: "user",
      content: chipText,
    });
  };

  const copyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-sm overflow-hidden min-h-0">
      {/* Chat Header */}
      <div className="border-b border-slate-200 px-3 py-2 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-slate-700" />
          <h3 className="text-xs font-semibold text-slate-900">Lead assistant</h3>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">Lead context only</span>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs min-h-0">
        {messages.length === 0 ? (
          <div className="py-6 text-center text-slate-400 px-4">
            <p className="text-xs text-slate-600 font-medium">Ask questions about this lead</p>
            <p className="text-xs text-slate-400 mt-0.5 mb-3">
              Answers are grounded in this customer's budget, timeline, and requirements.
            </p>
            <div className="flex flex-wrap gap-1 justify-center">
              {QUICK_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipClick(chip)}
                  className="px-2 py-0.5 rounded-sm text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isUser = m.role === "user";
            const msgKey = m.id || `msg_${idx}`;

            return (
              <div key={msgKey} className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] group relative">
                  <div className="text-[10px] text-slate-400 mb-0.5">
                    {isUser ? "You" : "Assistant"}
                  </div>
                  <div
                    className={`rounded-sm p-2.5 leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-slate-900 text-white text-xs"
                        : "bg-slate-50 text-slate-800 border border-slate-200 text-xs"
                    }`}
                  >
                    {m.content}
                  </div>
                  {!isUser && (
                    <button
                      onClick={() => copyMessage(m.content, msgKey)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 -bottom-4 text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-0.5 bg-white px-1 rounded-sm border border-slate-200"
                    >
                      {copiedMsgId === msgKey ? <Check className="h-2.5 w-2.5 text-emerald-600" /> : <Copy className="h-2.5 w-2.5" />}
                      <span>{copiedMsgId === msgKey ? "Copied" : "Copy"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-2 items-center text-slate-400 text-xs">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
            <span className="text-[11px] text-slate-400 ml-1">Drafting...</span>
          </div>
        )}

        {error && (
          <div className="p-2 rounded-sm bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            Error: {error.message}. Please retry.
          </div>
        )}
      </div>

      {/* Quick Chips Horizontal Strip */}
      <div className="px-2.5 py-1.5 border-t border-slate-100 bg-white flex items-center gap-1 overflow-x-auto shrink-0">
        {QUICK_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => handleChipClick(chip)}
            className="whitespace-nowrap px-2 py-0.5 text-xs font-medium rounded-sm border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 shrink-0"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-slate-200 bg-slate-50/50 flex gap-1.5 shrink-0">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question about this lead..."
          disabled={isLoading}
          className="flex-1 rounded-sm border border-slate-300 px-2.5 py-1 text-xs text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:border-slate-800 disabled:opacity-50"
        />
        <Button type="submit" variant="primary" size="sm" disabled={isLoading || !input.trim()}>
          <Send className="h-3 w-3" />
        </Button>
      </form>
    </div>
  );
}
