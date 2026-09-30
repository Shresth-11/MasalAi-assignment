"use client";

import React, { useState, useEffect } from "react";
import { Lead, LeadAnalysis, LeadMessage, CallDebrief, ScoreHistoryEntry } from "@/db/schema";
import { StatusBadge } from "./ui/badge";
import { Button } from "./ui/button";
import { LeadChat } from "./lead-chat";
import { CallCoachModal } from "./call-coach-modal";
import {
  ArrowLeft,
  Copy,
  Check,
  RotateCw,
  Phone,
  MessageSquare,
  History,
  AlertCircle,
  ExternalLink,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface LeadDetailProps {
  leadId: string;
  onBack: () => void;
  isSplitView?: boolean;
}

export function LeadDetail({ leadId, onBack, isSplitView = false }: LeadDetailProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [analysis, setAnalysis] = useState<LeadAnalysis | null>(null);
  const [messages, setMessages] = useState<LeadMessage[]>([]);
  const [debriefs, setDebriefs] = useState<CallDebrief[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);
  const [copiedResponse, setCopiedResponse] = useState<boolean>(false);
  const [isCallCoachOpen, setIsCallCoachOpen] = useState<boolean>(false);
  const [activeSideTab, setActiveSideTab] = useState<"chat" | "history">("chat");

  const fetchLeadData = async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      if (!res.ok) throw new Error("Failed to load lead details");
      const data = await res.json();
      setLead(data.lead);
      setAnalysis(data.analysis);
      setMessages(data.messages || []);
      setDebriefs(data.debriefs || []);
      setScoreHistory(data.scoreHistory || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadData();
  }, [leadId]);

  const handleReanalyze = async () => {
    if (!lead) return;
    setIsReanalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          name: lead.name,
          phone: lead.phone || "",
          location: lead.location,
          propertyRequirement: lead.propertyRequirement,
          budget: lead.budget,
          buyingTimeline: lead.buyingTimeline,
          customerMessage: lead.customerMessage,
        }),
      });
      if (res.ok) {
        await fetchLeadData();
      }
    } catch (err) {
      console.error("Re-analysis error:", err);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const copySuggestedResponse = () => {
    if (!analysis?.suggestedResponse) return;
    navigator.clipboard.writeText(analysis.suggestedResponse);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-white border border-slate-200 rounded-sm p-4 space-y-3">
        <div className="h-5 w-28 bg-slate-100 rounded-sm animate-pulse" />
        <div className="h-16 bg-slate-100 rounded-sm animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-36 bg-slate-100 rounded-sm animate-pulse" />
          <div className="h-36 bg-slate-100 rounded-sm animate-pulse" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white border border-slate-200 rounded-sm h-full flex flex-col items-center justify-center">
        <AlertCircle className="h-6 w-6 text-slate-400 mb-1.5" />
        <p className="text-xs font-semibold text-slate-800">Lead not found</p>
        <p className="text-xs text-slate-400 mt-0.5 mb-3">Select another lead from the table.</p>
        {!isSplitView && (
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to leads
          </Button>
        )}
      </div>
    );
  }

  const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, "") : "";
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone}?text=${encodeURIComponent(analysis?.suggestedResponse || "")}`
    : `https://wa.me/?text=${encodeURIComponent(analysis?.suggestedResponse || "")}`;

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-sm overflow-hidden select-text">
      {/* Top Header Bar */}
      <div className="border-b border-slate-200 px-3.5 py-2.5 bg-white flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {!isSplitView && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              List
            </Button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-slate-900 truncate">{lead.name}</h1>
              <StatusBadge variant={lead.tag as "HOT" | "WARM" | "COLD"} size="sm">
                {lead.tag} {lead.score}
              </StatusBadge>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 truncate mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                {lead.location}
              </span>
              <span>•</span>
              <span className="font-mono text-[11px]">{lead.phone || "No phone"}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReanalyze}
            isLoading={isReanalyzing}
            title="Re-run lead analysis"
          >
            <RotateCw className="h-3 w-3 text-slate-500" />
            <span className="hidden sm:inline ml-1">Re-analyze</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCallCoachOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Phone className="h-3 w-3 mr-1" />
            <span>Call prep & debrief</span>
          </Button>
        </div>
      </div>

      {/* Main 2-Column Split: Dossier (Left) + Assistant (Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
        {/* LEFT COLUMN: Dossier (7 cols) */}
        <div className="lg:col-span-7 border-r border-slate-200 overflow-y-auto p-3.5 space-y-3 text-xs">
          {/* Next action & summary */}
          <div className="rounded-sm border border-slate-200 bg-slate-50/70 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Recommended next action
              </span>
              <span className="text-[11px] text-slate-500">
                Intent: <strong className="text-slate-700 font-medium">{analysis?.intent}</strong>
              </span>
            </div>
            <p className="text-xs font-medium text-slate-900 leading-snug">
              {analysis?.recommendedNextAction}
            </p>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-600 truncate max-w-[280px]">
                {analysis?.summary}
              </span>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs shrink-0 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Open WhatsApp
              </a>
            </div>
          </div>

          {/* Quick specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2 rounded-sm bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block">Property</span>
              <span className="text-xs font-medium text-slate-800 truncate block mt-0.5">
                {lead.propertyRequirement}
              </span>
            </div>
            <div className="p-2 rounded-sm bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block">Budget</span>
              <span className="text-xs font-semibold text-slate-900 truncate block mt-0.5">
                {lead.budget}
              </span>
            </div>
            <div className="p-2 rounded-sm bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block">Timeline</span>
              <span className="text-xs font-medium text-slate-800 truncate block mt-0.5">
                {lead.buyingTimeline}
              </span>
            </div>
            <div className="p-2 rounded-sm bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block">Priority score</span>
              <span className="text-xs font-semibold text-slate-900 truncate block mt-0.5">
                {lead.score}/100 ({lead.tag})
              </span>
            </div>
          </div>

          {/* Priority Signals Breakdown */}
          <div className="rounded-sm border border-slate-200 bg-white p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                Signal breakdown
              </span>
              <span className="text-[10px] text-slate-400">
                Formula: 30% budget + 30% timeline + 25% intent + 15% engagement
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
              {/* Budget Fit */}
              <div className="p-2 rounded-sm bg-slate-50/70 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-700">Budget fit (30%)</span>
                  <span className="font-mono font-semibold text-slate-900">{analysis?.budgetFit ?? 0}/10</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-1">
                  <div
                    className="bg-slate-700 h-full rounded-full"
                    style={{ width: `${((analysis?.budgetFit ?? 0) / 10) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">{analysis?.budgetReason}</p>
              </div>

              {/* Timeline Urgency */}
              <div className="p-2 rounded-sm bg-slate-50/70 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-700">Timeline urgency (30%)</span>
                  <span className="font-mono font-semibold text-slate-900">{analysis?.timelineUrgency ?? 0}/10</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-1">
                  <div
                    className="bg-slate-700 h-full rounded-full"
                    style={{ width: `${((analysis?.timelineUrgency ?? 0) / 10) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">{analysis?.timelineReason}</p>
              </div>

              {/* Intent Clarity */}
              <div className="p-2 rounded-sm bg-slate-50/70 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-700">Intent clarity (25%)</span>
                  <span className="font-mono font-semibold text-slate-900">{analysis?.intentClarity ?? 0}/10</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-1">
                  <div
                    className="bg-slate-700 h-full rounded-full"
                    style={{ width: `${((analysis?.intentClarity ?? 0) / 10) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">{analysis?.intentReason}</p>
              </div>

              {/* Engagement */}
              <div className="p-2 rounded-sm bg-slate-50/70 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-700">Engagement (15%)</span>
                  <span className="font-mono font-semibold text-slate-900">{analysis?.engagement ?? 0}/10</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-1">
                  <div
                    className="bg-slate-700 h-full rounded-full"
                    style={{ width: `${((analysis?.engagement ?? 0) / 10) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">{analysis?.engagementReason}</p>
              </div>
            </div>
          </div>

          {/* Suggested Reply */}
          <div className="rounded-sm border border-slate-200 bg-white p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                Suggested reply
              </span>
              <button
                onClick={copySuggestedResponse}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 px-2 py-0.5 rounded-sm border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                {copiedResponse ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {copiedResponse ? "Copied" : "Copy text"}
              </button>
            </div>
            <div className="p-2.5 rounded-sm bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed text-xs">
              "{analysis?.suggestedResponse}"
            </div>
          </div>

          {/* Requirements & Concerns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Key Requirements */}
            <div className="rounded-sm border border-slate-200 bg-white p-3">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-2">
                Requirements
              </span>
              <ul className="space-y-1.5 text-slate-800">
                {analysis?.keyRequirements?.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-xs">
                    <span className="text-slate-400 font-mono mt-0.5">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Objections */}
            <div className="rounded-sm border border-slate-200 bg-white p-3">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-2">
                Customer hesitations
              </span>
              <ul className="space-y-1.5 text-slate-800">
                {analysis?.objections?.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-xs">
                    <span className="text-amber-500 font-mono mt-0.5">•</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Customer Message */}
          <div className="rounded-sm border border-slate-200 bg-white p-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Customer inquiry text
            </span>
            <p className="text-slate-700 bg-slate-50 p-2.5 rounded-sm border border-slate-200 whitespace-pre-wrap font-sans text-xs leading-relaxed">
              {lead.customerMessage}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Follow-up Assistant & History (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-full bg-slate-50/50 min-h-0">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-white px-3 shrink-0">
            <button
              onClick={() => setActiveSideTab("chat")}
              className={`py-2 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
                activeSideTab === "chat"
                  ? "border-slate-900 text-slate-900 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Lead assistant</span>
            </button>
            <button
              onClick={() => setActiveSideTab("history")}
              className={`py-2 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
                activeSideTab === "history"
                  ? "border-slate-900 text-slate-900 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Activity & audit ({scoreHistory.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden min-h-0">
            {activeSideTab === "chat" ? (
              <LeadChat leadId={lead.id} initialMessages={messages} />
            ) : (
              <div className="p-3.5 overflow-y-auto h-full space-y-3 text-xs">
                {scoreHistory.length === 0 && debriefs.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No activity recorded yet.</p>
                ) : (
                  <>
                    {/* Score History */}
                    <div className="rounded-sm border border-slate-200 bg-white p-3">
                      <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-2">
                        Score history
                      </span>
                      <div className="space-y-2">
                        {scoreHistory.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between p-2 rounded-sm bg-slate-50 border border-slate-200"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-slate-900">{entry.score}</span>
                              <StatusBadge variant={entry.tag as "HOT" | "WARM" | "COLD"}>
                                {entry.tag}
                              </StatusBadge>
                              <span className="text-slate-600 text-xs truncate max-w-[160px]">
                                {entry.reason}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Debriefs */}
                    {debriefs.length > 0 && (
                      <div className="rounded-sm border border-slate-200 bg-white p-3 space-y-2">
                        <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                          Past call notes
                        </span>
                        {debriefs.map((deb) => (
                          <div key={deb.id} className="p-2.5 rounded-sm bg-slate-50 border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-900">{deb.changeSummary}</span>
                              <span className="text-slate-400 font-mono text-[10px]">
                                {new Date(deb.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-slate-600 text-xs">"{deb.callNotes}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Call Coach Modal */}
      {isCallCoachOpen && (
        <CallCoachModal
          isOpen={isCallCoachOpen}
          onClose={() => setIsCallCoachOpen(false)}
          lead={lead}
          onDebriefComplete={() => {
            fetchLeadData();
          }}
        />
      )}
    </div>
  );
}
