import { Lead, LeadAnalysis, CallDebrief, ScoreHistoryEntry } from "@/db/schema";

const STORAGE_LEADS_KEY = "masal_local_leads";
const STORAGE_ANALYSES_KEY = "masal_local_analyses";
const STORAGE_DEBRIEFS_KEY = "masal_local_debriefs";
const STORAGE_HISTORY_KEY = "masal_local_score_history";

/**
 * Retrieves all user-created or updated leads stored locally in the browser.
 */
export function getLocalLeads(): Lead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_LEADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      lastActivityAt: item.lastActivityAt ? new Date(item.lastActivityAt) : new Date(),
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    }));
  } catch (e) {
    console.warn("Failed to parse local leads from localStorage:", e);
    return [];
  }
}

/**
 * Saves or updates a lead and its analysis in browser localStorage.
 * Triggers a custom window event to synchronize UI components immediately.
 */
export function saveLocalLead(lead: Lead, analysis?: LeadAnalysis | null): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalLeads();
    const filtered = existing.filter((l) => l.id !== lead.id);
    const updated = [lead, ...filtered];
    localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(updated));

    if (analysis) {
      saveLocalAnalysis(lead.id, analysis);
    }

    // Notify any listening components (e.g. LeadList) to re-render immediately
    window.dispatchEvent(new CustomEvent("masal_leads_updated", { detail: { leadId: lead.id } }));
  } catch (e) {
    console.warn("Failed to save local lead to localStorage:", e);
  }
}

/**
 * Retrieves the stored analysis for a given lead from localStorage.
 */
export function getLocalAnalysis(leadId: string): LeadAnalysis | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_ANALYSES_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    const analysis = map[leadId];
    if (!analysis) return null;
    return {
      ...analysis,
      createdAt: analysis.createdAt ? new Date(analysis.createdAt) : new Date(),
    };
  } catch (e) {
    console.warn("Failed to parse local analysis from localStorage:", e);
    return null;
  }
}

/**
 * Saves the analysis for a given lead into localStorage.
 */
export function saveLocalAnalysis(leadId: string, analysis: LeadAnalysis): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_ANALYSES_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[leadId] = analysis;
    localStorage.setItem(STORAGE_ANALYSES_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn("Failed to save local analysis to localStorage:", e);
  }
}

/**
 * Retrieves stored debrief records for a given lead from localStorage.
 */
export function getLocalDebriefs(leadId: string): CallDebrief[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_DEBRIEFS_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw);
    const list = map[leadId] || [];
    return list.map((d: any) => ({
      ...d,
      createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
    }));
  } catch (e) {
    console.warn("Failed to parse local debriefs:", e);
    return [];
  }
}

/**
 * Saves a new debrief record for a given lead in localStorage.
 */
export function saveLocalDebrief(leadId: string, debrief: CallDebrief): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_DEBRIEFS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const existing = map[leadId] || [];
    map[leadId] = [debrief, ...existing.filter((d: any) => d.id !== debrief.id)];
    localStorage.setItem(STORAGE_DEBRIEFS_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn("Failed to save local debrief:", e);
  }
}

/**
 * Retrieves stored score history entries for a given lead from localStorage.
 */
export function getLocalScoreHistory(leadId: string): ScoreHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw);
    const list = map[leadId] || [];
    return list.map((h: any) => ({
      ...h,
      createdAt: h.createdAt ? new Date(h.createdAt) : new Date(),
    }));
  } catch (e) {
    console.warn("Failed to parse local score history:", e);
    return [];
  }
}

/**
 * Saves a new score history entry for a given lead in localStorage.
 */
export function saveLocalScoreHistory(leadId: string, entry: ScoreHistoryEntry): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const existing = map[leadId] || [];
    map[leadId] = [entry, ...existing.filter((h: any) => h.id !== entry.id)];
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn("Failed to save local score history:", e);
  }
}

/**
 * Clears all locally stored leads and analyses.
 */
export function clearLocalLeads(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_LEADS_KEY);
    localStorage.removeItem(STORAGE_ANALYSES_KEY);
    localStorage.removeItem(STORAGE_DEBRIEFS_KEY);
    localStorage.removeItem(STORAGE_HISTORY_KEY);
    window.dispatchEvent(new CustomEvent("masal_leads_updated"));
  } catch (e) {
    console.warn("Failed to clear local leads:", e);
  }
}
