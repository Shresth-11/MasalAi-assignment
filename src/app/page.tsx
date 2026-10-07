"use client";

import React, { useState } from "react";
import { LeadList } from "@/components/lead-list";
import { LeadDetail } from "@/components/lead-detail";
import { LeadIntakeModal } from "@/components/lead-intake-modal";
import { Columns, Table } from "lucide-react";

export default function HomePage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState<boolean>(false);
  const [isSplitMode, setIsSplitMode] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const handleLeadsLoaded = (firstLeadId?: string) => {
    if (!selectedLeadId && firstLeadId) {
      setSelectedLeadId(firstLeadId);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-2 text-slate-900">
      {/* Top Application Bar */}
      <header className="flex items-center justify-between px-3.5 py-2 bg-white border border-slate-200 rounded-sm shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-sm bg-slate-900 text-white flex items-center justify-center font-semibold text-xs tracking-tight">
              M
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-xs text-slate-900 tracking-tight">Masal LeadOps</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-slate-600 font-medium">Inbound Leads</span>
            </div>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSplitMode((prev) => !prev)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
          >
            {isSplitMode ? (
              <>
                <Columns className="h-3.5 w-3.5 text-slate-500" />
                <span>Split view</span>
              </>
            ) : (
              <>
                <Table className="h-3.5 w-3.5 text-slate-500" />
                <span>Table view</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isSplitMode ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 h-full min-h-0">
            {/* Left Column: Lead List */}
            <div className={`h-full min-h-0 ${selectedLeadId ? "hidden lg:block lg:col-span-5" : "col-span-12"}`}>
              <LeadList
                selectedLeadId={selectedLeadId}
                onSelectLead={(id) => setSelectedLeadId(id)}
                onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
                onLeadsLoaded={handleLeadsLoaded}
                compactMode={true}
                refreshKey={refreshKey}
              />
            </div>

            {/* Right Column: Lead Detail */}
            <div className={`h-full min-h-0 ${selectedLeadId ? "col-span-12 lg:col-span-7" : "hidden lg:block lg:col-span-7"}`}>
              {selectedLeadId ? (
                <LeadDetail
                  leadId={selectedLeadId}
                  onBack={() => setSelectedLeadId(null)}
                  isSplitView={true}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-sm text-center text-slate-400">
                  <p className="text-xs font-medium text-slate-600">Select a lead from the list</p>
                  <p className="text-xs text-slate-400 mt-0.5">Use arrow keys or click any row to view details.</p>
                </div>
              )}
            </div>
          </div>
        ) : selectedLeadId ? (
          <LeadDetail
            leadId={selectedLeadId}
            onBack={() => setSelectedLeadId(null)}
            isSplitView={false}
          />
        ) : (
          <LeadList
            selectedLeadId={selectedLeadId}
            onSelectLead={(id) => setSelectedLeadId(id)}
            onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
            onLeadsLoaded={handleLeadsLoaded}
            compactMode={false}
            refreshKey={refreshKey}
          />
        )}
      </div>

      {/* Intake Modal */}
      {isNewLeadModalOpen && (
        <LeadIntakeModal
          isOpen={isNewLeadModalOpen}
          onClose={() => setIsNewLeadModalOpen(false)}
          onSuccess={(newLeadId) => {
            setSelectedLeadId(newLeadId);
            setRefreshKey((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
}
