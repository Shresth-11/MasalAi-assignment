import { Lead, LeadAnalysis } from "@/db/schema";

const STORAGE_LEADS_KEY = "masal_local_leads";
const STORAGE_ANALYSES_KEY = "masal_local_analyses";

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
 * Clears all locally stored leads and analyses.
 */
export function clearLocalLeads(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_LEADS_KEY);
    localStorage.removeItem(STORAGE_ANALYSES_KEY);
    window.dispatchEvent(new CustomEvent("masal_leads_updated"));
  } catch (e) {
    console.warn("Failed to clear local leads:", e);
  }
}
