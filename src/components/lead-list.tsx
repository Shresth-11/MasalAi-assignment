"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Lead } from "@/db/schema";
import { StatusBadge } from "./ui/badge";
import { Button } from "./ui/button";
import { Search, Plus, RotateCw } from "lucide-react";
import { getLocalLeads, clearLocalLeads } from "@/lib/local-leads";

interface LeadListProps {
  onSelectLead: (leadId: string) => void;
  onOpenNewLeadModal: () => void;
  selectedLeadId?: string | null;
  onLeadsLoaded?: (firstLeadId?: string) => void;
  compactMode?: boolean;
  refreshKey?: number;
}

export function LeadList({
  onSelectLead,
  onOpenNewLeadModal,
  selectedLeadId,
  onLeadsLoaded,
  compactMode = false,
  refreshKey = 0,
}: LeadListProps) {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("ALL");
  const [showFollowUpOnly, setShowFollowUpOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [counts, setCounts] = useState({
    all: 0,
    hot: 0,
    warm: 0,
    cold: 0,
    followUpDue: 0,
  });

  const tableRef = useRef<HTMLTableElement>(null);
  const hasAutoSelectedRef = useRef(false);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      let serverLeads: Lead[] = [];
      try {
        const res = await fetch("/api/leads");
        if (res.ok) {
          const data = await res.json();
          serverLeads = data.leads || [];
        }
      } catch (err) {
        console.warn("Server leads fetch error:", err);
      }

      const localLeads = getLocalLeads();

      // Deduplicate: local leads override server leads by id, new leads take priority
      const leadMap = new Map<string, Lead>();
      for (const lead of localLeads) {
        leadMap.set(lead.id, lead);
      }
      for (const lead of serverLeads) {
        if (!leadMap.has(lead.id)) {
          leadMap.set(lead.id, lead);
        }
      }

      const combined = Array.from(leadMap.values()).sort((a, b) => b.score - a.score);
      setAllLeads(combined);

      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
      setCounts({
        all: combined.length,
        hot: combined.filter((l) => l.tag === "HOT").length,
        warm: combined.filter((l) => l.tag === "WARM").length,
        cold: combined.filter((l) => l.tag === "COLD").length,
        followUpDue: combined.filter((l) => new Date(l.lastActivityAt).getTime() < twoDaysAgo).length,
      });

      if (!hasAutoSelectedRef.current && combined.length > 0 && onLeadsLoaded) {
        hasAutoSelectedRef.current = true;
        onLeadsLoaded(combined[0].id);
      }
    } catch (err) {
      console.error("Error fetching leads:", err);
    } finally {
      setIsLoading(false);
    }
  }, [onLeadsLoaded]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads, refreshKey]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchLeads();
    };
    window.addEventListener("masal_leads_updated", handleUpdate);
    return () => window.removeEventListener("masal_leads_updated", handleUpdate);
  }, [fetchLeads]);

  // Client-side instant filtering across master leads
  useEffect(() => {
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    let filtered = allLeads;

    if (selectedTag !== "ALL") {
      filtered = filtered.filter((l) => l.tag === selectedTag);
    }

    if (showFollowUpOnly) {
      filtered = filtered.filter((l) => new Date(l.lastActivityAt).getTime() < twoDaysAgo);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q) ||
          l.propertyRequirement.toLowerCase().includes(q) ||
          l.budget.toLowerCase().includes(q) ||
          (l.phone && l.phone.toLowerCase().includes(q))
      );
    }

    setLeads(filtered);
  }, [allLeads, selectedTag, showFollowUpOnly, searchQuery]);

  const handleLoadDemoLeads = async () => {
    setIsSeeding(true);
    try {
      clearLocalLeads();
      const res = await fetch("/api/leads/demo", { method: "POST" });
      if (res.ok) {
        await fetchLeads();
      }
    } catch (err) {
      console.error("Failed to load demo leads:", err);
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const currentIdx = leads.findIndex((l) => l.id === selectedLeadId);
        const nextIdx = Math.min(currentIdx + 1, Math.max(0, leads.length - 1));
        if (leads[nextIdx]) onSelectLead(leads[nextIdx].id);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const currentIdx = leads.findIndex((l) => l.id === selectedLeadId);
        const prevIdx = Math.max(currentIdx - 1, 0);
        if (leads[prevIdx]) onSelectLead(leads[prevIdx].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [leads, selectedLeadId, onSelectLead]);

  const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const isFollowUpDue = (dateStr: Date | string) => new Date(dateStr).getTime() < twoDaysAgo;

  const formatRelativeActivity = (dateStr: Date | string) => {
    const time = new Date(dateStr).getTime();
    if (isNaN(time)) return "Recently";
    const diffHours = Math.round((Date.now() - time) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-sm overflow-hidden min-h-0">
      {/* Top Action Bar */}
      <div className="border-b border-slate-200 px-3.5 py-2.5 bg-white flex items-center justify-between gap-2 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-semibold text-slate-900 tracking-tight">Leads</h1>
            <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-sm bg-slate-100 text-slate-600 border border-slate-200">
              {leads.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate hidden sm:block">
            Inbound inquiries ranked by priority score.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadDemoLeads}
            isLoading={isSeeding}
            title="Load the demo lead set"
          >
            <RotateCw className="h-3 w-3 sm:mr-1 text-slate-500" />
            <span className="hidden sm:inline">Load demo set</span>
          </Button>
          <Button variant="primary" size="sm" onClick={onOpenNewLeadModal}>
            <Plus className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">New lead</span>
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="border-b border-slate-200 px-3 py-2 bg-slate-50/70 flex flex-col gap-2 shrink-0">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          <button
            onClick={() => {
              setSelectedTag("ALL");
              setShowFollowUpOnly(false);
            }}
            className={`px-2 py-0.5 text-[11px] font-medium rounded-sm border transition-colors shrink-0 ${
              selectedTag === "ALL" && !showFollowUpOnly
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => {
              setSelectedTag("HOT");
              setShowFollowUpOnly(false);
            }}
            className={`px-2 py-0.5 text-[11px] font-medium rounded-sm border transition-colors shrink-0 ${
              selectedTag === "HOT" && !showFollowUpOnly
                ? "bg-emerald-700 text-white border-emerald-800"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            HOT ({counts.hot})
          </button>
          <button
            onClick={() => {
              setSelectedTag("WARM");
              setShowFollowUpOnly(false);
            }}
            className={`px-2 py-0.5 text-[11px] font-medium rounded-sm border transition-colors shrink-0 ${
              selectedTag === "WARM" && !showFollowUpOnly
                ? "bg-amber-600 text-white border-amber-700"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            WARM ({counts.warm})
          </button>
          <button
            onClick={() => {
              setSelectedTag("COLD");
              setShowFollowUpOnly(false);
            }}
            className={`px-2 py-0.5 text-[11px] font-medium rounded-sm border transition-colors shrink-0 ${
              selectedTag === "COLD" && !showFollowUpOnly
                ? "bg-slate-700 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            COLD ({counts.cold})
          </button>
          <button
            onClick={() => setShowFollowUpOnly((prev) => !prev)}
            className={`px-2 py-0.5 text-[11px] font-medium rounded-sm border transition-colors shrink-0 ${
              showFollowUpOnly
                ? "bg-rose-700 text-white border-rose-800"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
            title="Leads with no activity for 2+ days"
          >
            Follow-up due ({counts.followUpDue})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full">
          <Search className="h-3 w-3 absolute left-2 top-2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter leads..."
            className="w-full pl-7 pr-2.5 py-1 text-xs rounded-sm border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:border-slate-800"
          />
        </div>
      </div>

      {/* Keyboard hotkey hint */}
      <div className="px-3 py-1 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.2 bg-white border border-slate-300 rounded font-mono text-[10px]">↑</kbd>
          <kbd className="px-1 py-0.2 bg-white border border-slate-300 rounded font-mono text-[10px]">↓</kbd>
          <span>Use arrow keys to scan</span>
        </span>
        <span className="text-[10px] text-slate-400">Score scale: 0-100</span>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto min-h-0">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-9 bg-slate-100/70 animate-pulse rounded-sm border border-slate-200/50" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="py-12 text-center text-slate-500 px-4">
            <p className="text-xs font-medium text-slate-700">No leads yet</p>
            <p className="text-xs text-slate-500 mt-1 mb-3">Load the demo set to see how it works.</p>
            <Button variant="primary" size="sm" onClick={handleLoadDemoLeads} isLoading={isSeeding}>
              <RotateCw className="h-3 w-3 mr-1" />
              Load demo set
            </Button>
          </div>
        ) : (
          <table ref={tableRef} className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-semibold text-slate-500 uppercase tracking-wider select-none sticky top-0 z-10 backdrop-blur-xs">
                <th className="py-2 px-2.5 w-20">Score</th>
                <th className="py-2 px-2.5">Name</th>
                {!compactMode && <th className="py-2 px-2.5">Requirement</th>}
                <th className="py-2 px-2.5">Budget</th>
                {!compactMode && <th className="py-2 px-2.5">Timeline</th>}
                <th className="py-2 px-2.5 text-right">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => {
                const followUpDue = isFollowUpDue(lead.lastActivityAt);
                const isSelected = lead.id === selectedLeadId;

                return (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-slate-100/95 font-medium border-l-2 border-l-slate-900"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Score & Tag */}
                    <td className="py-2 px-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 w-5 text-right text-[11px]">
                          {lead.score}
                        </span>
                        <StatusBadge variant={lead.tag as "HOT" | "WARM" | "COLD"} size="sm">
                          {lead.tag}
                        </StatusBadge>
                      </div>
                    </td>

                    {/* Name & Location */}
                    <td className="py-2 px-2.5">
                      <div className="font-medium text-slate-900 truncate max-w-[150px]">
                        {lead.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                        {lead.location}
                      </div>
                    </td>

                    {/* Requirement */}
                    {!compactMode && (
                      <td className="py-2 px-2.5 text-slate-700 truncate max-w-[180px]">
                        {lead.propertyRequirement}
                      </td>
                    )}

                    {/* Budget */}
                    <td className="py-2 px-2.5 text-slate-800 whitespace-nowrap font-medium text-[11px]">
                      {lead.budget}
                    </td>

                    {/* Timeline */}
                    {!compactMode && (
                      <td className="py-2 px-2.5 text-slate-600 whitespace-nowrap text-[11px]">
                        {lead.buyingTimeline}
                      </td>
                    )}

                    {/* Activity & Follow-up Due */}
                    <td className="py-2 px-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {followUpDue && (
                          <StatusBadge variant="attention" size="sm">
                            Due
                          </StatusBadge>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatRelativeActivity(lead.lastActivityAt)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
