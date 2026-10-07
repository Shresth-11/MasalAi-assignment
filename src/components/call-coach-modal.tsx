"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lead, LeadAnalysis } from "@/db/schema";
import { Button } from "./ui/button";
import { StatusBadge } from "./ui/badge";
import { saveLocalLead } from "@/lib/local-leads";
import {
  Phone,
  Mic,
  MicOff,
  Copy,
  Check,
  ExternalLink,
  X,
  Volume2,
  VolumeX,
  ShieldAlert,
  ArrowRight,
  FileText,
} from "lucide-react";

interface CallCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  analysis?: LeadAnalysis | null;
  onDebriefComplete: () => void;
}

const SAMPLE_DEBRIEFS = [
  {
    title: "Visit confirmed & budget verified",
    notes: "Spoke with customer for 6 minutes. Confirmed they have an HDFC pre-sanctioned loan for ₹2.5 Cr plus ₹1 Cr liquid mutual fund down payment. They agreed to visit the site this Saturday at 11:30 AM with their spouse. Non-negotiable: must have 2 covered parkings and middle-to-high floor.",
  },
  {
    title: "Price & carpet area hesitation",
    notes: "Customer is hesitant on current pricing of ₹3.5 Cr all-inclusive. Says rival project in Sector 65 is offering 10% lower price per sqft. However, they acknowledged that project doesn't have golf course views. Asked for detailed carpet area breakdown and possession timeline guarantee.",
  },
  {
    title: "Hinglish call notes",
    notes: "Customer se baat hui. Bol rahe hain family shift karni hai by Diwali. Budget stretch karke ₹1.85 Cr tak ja sakte hain agar clubhouse aur park ready ho. Sunday ko sample flat dekhne aane ke liye ready hain. WhatsApp par cost sheet mangi hai.",
  },
];

export function CallCoachModal({ isOpen, onClose, lead, analysis, onDebriefComplete }: CallCoachModalProps) {
  const [activeTab, setActiveTab] = useState<"pre-call" | "post-call">("pre-call");

  // Pre-Call Talk Track State
  const [talkTrack, setTalkTrack] = useState<{
    callOpener: string;
    discoveryQuestions: string[];
    topObjection: string;
    objectionReply: string;
  } | null>(null);
  const [isLoadingTalkTrack, setIsLoadingTalkTrack] = useState(false);
  const [talkTrackError, setTalkTrackError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Audio State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Post-Call Debrief State
  const [callNotes, setCallNotes] = useState("");
  const [isDictating, setIsDictating] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isProcessingDebrief, setIsProcessingDebrief] = useState(false);
  const [checkedCommitments, setCheckedCommitments] = useState<Record<number, boolean>>({});
  const [debriefResult, setDebriefResult] = useState<{
    newScore: number;
    newTag: string;
    changeSummary: string;
    recomputed: {
      score: number;
      tag: string;
    };
    debrief: {
      newObjections: string[];
      commitments: string[];
      whatsappDraft: string;
    };
    whatsappUrl: string;
  } | null>(null);
  const [debriefError, setDebriefError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Web Speech API
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-IN";

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setCallNotes((prev) => (prev ? prev + " " + currentTranscript : currentTranscript));
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsDictating(false);
        };

        recognition.onend = () => {
          setIsDictating(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === "pre-call" && !talkTrack && !isLoadingTalkTrack) {
      loadTalkTrack();
    }
  }, [isOpen, activeTab]);

  const loadTalkTrack = async () => {
    setIsLoadingTalkTrack(true);
    setTalkTrackError(null);
    try {
      const res = await fetch("/api/coach/talk-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          leadFallback: lead,
          analysisFallback: analysis,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTalkTrack(data.talkTrack);
      } else {
        throw new Error(data.error || "Failed to load talk track");
      }
    } catch (err: unknown) {
      setTalkTrackError((err as Error).message || "Could not prepare talk track.");
    } finally {
      setIsLoadingTalkTrack(false);
    }
  };

  const toggleAudioOpener = () => {
    if (typeof window === "undefined" || !window.speechSynthesis || !talkTrack?.callOpener) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(talkTrack.callOpener);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const toggleDictation = () => {
    if (!recognitionRef.current) return;
    if (isDictating) {
      recognitionRef.current.stop();
      setIsDictating(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsDictating(true);
      } catch (err) {
        console.error("Speech recognition start failed:", err);
      }
    }
  };

  const handleDebriefSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callNotes.trim()) return;

    if (isDictating && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsDictating(false);
    }

    setIsProcessingDebrief(true);
    setDebriefError(null);

    try {
      const res = await fetch("/api/coach/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          callNotes,
          leadFallback: lead,
          analysisFallback: analysis,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process call debrief");
      }
      if (data.updatedLead) {
        saveLocalLead(data.updatedLead);
      }
      setDebriefResult(data);
      setCheckedCommitments({});
      onDebriefComplete();
    } catch (err: unknown) {
      setDebriefError((err as Error).message || "Debrief processing error.");
    } finally {
      setIsProcessingDebrief(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isOpen) return null;

  const scoreDiff = debriefResult ? debriefResult.newScore - lead.score : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-sm bg-white border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-sm bg-slate-900 text-white flex items-center justify-center">
              <Phone className="h-3 w-3" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-slate-900">
                  Call prep: {lead.name}
                </h2>
                <StatusBadge variant={lead.tag as "HOT" | "WARM" | "COLD"} size="sm">
                  {lead.tag} ({lead.score}/100)
                </StatusBadge>
              </div>
              <p className="text-xs text-slate-500">
                {lead.propertyRequirement} • Budget: <span className="font-medium text-slate-700">{lead.budget}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-4 shrink-0">
          <button
            onClick={() => setActiveTab("pre-call")}
            className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === "pre-call"
                ? "border-slate-900 text-slate-900 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Talk track
          </button>
          <button
            onClick={() => setActiveTab("post-call")}
            className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "post-call"
                ? "border-slate-900 text-slate-900 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Call debrief</span>
            {debriefResult && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 text-xs">
          {activeTab === "pre-call" ? (
            /* PRE-CALL TALK TRACK */
            <div className="space-y-3.5">
              {isLoadingTalkTrack ? (
                <div className="py-12 text-center text-slate-500">
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-800 border-r-transparent mb-1.5" />
                  <p className="text-xs">Preparing talking points...</p>
                </div>
              ) : talkTrackError ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-sm text-rose-800 text-xs">
                  {talkTrackError}
                  <Button variant="outline" size="sm" onClick={loadTalkTrack} className="mt-2 block">
                    Retry
                  </Button>
                </div>
              ) : talkTrack ? (
                <>
                  {/* Opener */}
                  <div className="rounded-sm border border-slate-200 bg-slate-50/70 p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                        30-second call opener
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={toggleAudioOpener}
                          className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-sm border transition-colors ${
                            isPlayingAudio
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {isPlayingAudio ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                          <span>{isPlayingAudio ? "Stop" : "Listen"}</span>
                        </button>

                        <button
                          onClick={() => copyToClipboard(talkTrack.callOpener, "opener")}
                          className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-sm border border-slate-200 bg-white"
                        >
                          {copiedKey === "opener" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedKey === "opener" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-800 leading-relaxed bg-white p-2.5 rounded-sm border border-slate-200 text-xs">
                      "{talkTrack.callOpener}"
                    </p>
                  </div>

                  {/* 3 Questions */}
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block mb-1.5">
                      Discovery questions
                    </span>
                    <div className="space-y-1.5">
                      {talkTrack.discoveryQuestions.map((q, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 rounded-sm border border-slate-200 bg-white">
                          <span className="h-4 w-4 rounded-sm bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-mono text-[10px] font-semibold mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="text-slate-800 flex-1 leading-snug">{q}</p>
                          <button
                            onClick={() => copyToClipboard(q, `q_${idx}`)}
                            className="text-slate-400 hover:text-slate-700 p-0.5"
                          >
                            {copiedKey === `q_${idx}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Objection */}
                  <div className="rounded-sm border border-slate-200 bg-white p-3 space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block">
                      Likely customer objection
                    </span>
                    <p className="text-slate-900 font-medium">{talkTrack.topObjection}</p>
                    <div className="pt-2 border-t border-slate-100 text-slate-700">
                      <span className="text-[11px] text-slate-500 block mb-0.5">
                        Suggested response:
                      </span>
                      <p className="text-slate-800 bg-slate-50 p-2 rounded-sm border border-slate-200 leading-relaxed">
                        "{talkTrack.objectionReply}"
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            /* POST-CALL DEBRIEF */
            <div className="space-y-3.5">
              {!debriefResult ? (
                <form onSubmit={handleDebriefSubmit} className="space-y-3">
                  {/* Sample chips */}
                  <div className="p-2.5 rounded-sm bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium block mb-1.5">
                      Sample notes:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {SAMPLE_DEBRIEFS.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCallNotes(s.notes)}
                          className="px-2 py-0.5 rounded-sm text-xs bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
                        >
                          {s.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-medium text-slate-800 text-xs">
                        Call notes
                      </label>
                      {isSpeechSupported && (
                        <button
                          type="button"
                          onClick={toggleDictation}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium border transition-colors ${
                            isDictating
                              ? "bg-rose-50 border-rose-300 text-rose-700"
                              : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {isDictating ? <MicOff className="h-3 w-3 text-rose-600" /> : <Mic className="h-3 w-3 text-slate-600" />}
                          <span>{isDictating ? "Listening..." : "Dictate"}</span>
                        </button>
                      )}
                    </div>

                    <textarea
                      rows={5}
                      required
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      placeholder="Paste your notes or summary from the call..."
                      className="w-full rounded-sm border border-slate-300 p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Updates score signals and drafts follow-up message.
                    </p>
                  </div>

                  {debriefError && (
                    <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-sm">
                      {debriefError}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isProcessingDebrief}
                      disabled={!callNotes.trim()}
                    >
                      Update score & draft reply
                    </Button>
                  </div>
                </form>
              ) : (
                /* DEBRIEF RESULT */
                <div className="space-y-3">
                  {/* Score update banner */}
                  <div className="rounded-sm border border-slate-200 bg-slate-50 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-slate-500 block">
                        Score updated
                      </span>
                      <p className="text-xs font-semibold text-slate-900 mt-0.5">
                        {debriefResult.changeSummary}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-600">
                        <span>Original: {lead.score}</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <span>New score: {debriefResult.newScore}</span>
                        <span className="font-semibold text-slate-800">
                          ({scoreDiff >= 0 ? `+${scoreDiff}` : scoreDiff} pts)
                        </span>
                      </div>
                    </div>
                    <StatusBadge variant={debriefResult.newTag as "HOT" | "WARM" | "COLD"} size="md">
                      {debriefResult.newTag} {debriefResult.newScore}
                    </StatusBadge>
                  </div>

                  {/* Customer Commitments */}
                  <div className="rounded-sm border border-slate-200 bg-white p-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
                      Commitments made by customer
                    </span>
                    <div className="space-y-1">
                      {debriefResult.debrief.commitments.map((c, i) => (
                        <label
                          key={i}
                          className="flex items-start gap-2 p-1 rounded-sm hover:bg-slate-50 cursor-pointer text-slate-800"
                        >
                          <input
                            type="checkbox"
                            checked={!!checkedCommitments[i]}
                            onChange={(e) =>
                              setCheckedCommitments((prev) => ({ ...prev, [i]: e.target.checked }))
                            }
                            className="mt-0.5 rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900"
                          />
                          <span className={checkedCommitments[i] ? "line-through text-slate-400" : ""}>
                            {c}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* WhatsApp Message */}
                  <div className="rounded-sm border border-slate-200 bg-white p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Follow-up message
                      </span>
                      <button
                        onClick={() => copyToClipboard(debriefResult.debrief.whatsappDraft, "wa")}
                        className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-[11px]"
                      >
                        {copiedKey === "wa" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedKey === "wa" ? "Copied" : "Copy text"}</span>
                      </button>
                    </div>
                    <p className="p-2.5 bg-slate-50 rounded-sm border border-slate-200 text-slate-800 leading-relaxed text-xs">
                      "{debriefResult.debrief.whatsappDraft}"
                    </p>
                    <div className="flex justify-end pt-1">
                      <a
                        href={debriefResult.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Send on WhatsApp
                      </a>
                    </div>
                  </div>

                  {/* Reset */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <button
                      onClick={() => {
                        setDebriefResult(null);
                        setCallNotes("");
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 underline"
                    >
                      Record another note
                    </button>
                    <Button variant="primary" size="sm" onClick={onClose}>
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
