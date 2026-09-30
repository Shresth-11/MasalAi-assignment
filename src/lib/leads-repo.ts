import { db, isDbConfigured, leads, leadAnalyses, leadMessages, callDebriefs, scoreHistory } from "@/db";
import { Lead, LeadAnalysis, LeadMessage, CallDebrief, ScoreHistoryEntry } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * In-memory fallback store ensuring standalone local development
 * when an external Postgres instance is not configured.
 */
class MemoryStore {
  leads: Map<string, Lead> = new Map();
  analyses: Map<string, LeadAnalysis> = new Map();
  messages: LeadMessage[] = [];
  debriefs: CallDebrief[] = [];
  scoreHistoryEntries: ScoreHistoryEntry[] = [];

  constructor() {
    this.seedInitial();
  }

  seedInitial() {
    const { DEMO_LEADS_DATA } = require("@/lib/demo-leads");
    for (const bundle of DEMO_LEADS_DATA) {
      this.leads.set(bundle.lead.id, bundle.lead);
      this.analyses.set(bundle.analysis.leadId, bundle.analysis);
      this.scoreHistoryEntries.push({
        id: "hist_init_" + bundle.lead.id,
        leadId: bundle.lead.id,
        score: bundle.lead.score,
        tag: bundle.lead.tag,
        reason: "Initial AI analysis",
        createdAt: bundle.lead.createdAt,
      });
    }
  }
}

// Global singleton across hot reloads in Next.js development
const globalForMemory = globalThis as unknown as { masalaiStore?: MemoryStore };
export const memoryStore = globalForMemory.masalaiStore ?? new MemoryStore();
if (process.env.NODE_ENV !== "production") globalForMemory.masalaiStore = memoryStore;

export const leadsRepo = {
  async getAllLeads(): Promise<Lead[]> {
    if (isDbConfigured && db) {
      try {
        return await db.select().from(leads).orderBy(desc(leads.score));
      } catch (err) {
        console.warn("DB query failed, falling back to memory store:", err);
      }
    }
    return Array.from(memoryStore.leads.values()).sort((a, b) => b.score - a.score);
  },

  async getLeadById(id: string): Promise<Lead | null> {
    if (isDbConfigured && db) {
      try {
        const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
        return rows[0] || null;
      } catch (err) {
        console.warn("DB query failed, falling back to memory store:", err);
      }
    }
    return memoryStore.leads.get(id) || null;
  },

  async createLead(leadData: Lead): Promise<Lead> {
    if (isDbConfigured && db) {
      try {
        const rows = await db.insert(leads).values(leadData).returning();
        return rows[0];
      } catch (err) {
        console.warn("DB insert failed, storing in memory:", err);
      }
    }
    memoryStore.leads.set(leadData.id, leadData);
    return leadData;
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    if (isDbConfigured && db) {
      try {
        const rows = await db
          .update(leads)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(leads.id, id))
          .returning();
        return rows[0] || null;
      } catch (err) {
        console.warn("DB update failed, updating in memory:", err);
      }
    }
    const current = memoryStore.leads.get(id);
    if (!current) return null;
    const updated = { ...current, ...updates, updatedAt: new Date() };
    memoryStore.leads.set(id, updated);
    return updated;
  },

  async getAnalysisByLeadId(leadId: string): Promise<LeadAnalysis | null> {
    if (isDbConfigured && db) {
      try {
        const rows = await db
          .select()
          .from(leadAnalyses)
          .where(eq(leadAnalyses.leadId, leadId))
          .limit(1);
        return rows[0] || null;
      } catch (err) {
        console.warn("DB query failed, falling back to memory store:", err);
      }
    }
    return memoryStore.analyses.get(leadId) || null;
  },

  async saveAnalysis(analysisData: LeadAnalysis): Promise<LeadAnalysis> {
    if (isDbConfigured && db) {
      try {
        // Upsert or delete-insert
        await db.delete(leadAnalyses).where(eq(leadAnalyses.leadId, analysisData.leadId));
        const rows = await db.insert(leadAnalyses).values(analysisData).returning();
        return rows[0];
      } catch (err) {
        console.warn("DB save analysis failed, storing in memory:", err);
      }
    }
    memoryStore.analyses.set(analysisData.leadId, analysisData);
    return analysisData;
  },

  async getMessages(leadId: string): Promise<LeadMessage[]> {
    if (isDbConfigured && db) {
      try {
        return await db
          .select()
          .from(leadMessages)
          .where(eq(leadMessages.leadId, leadId))
          .orderBy(leadMessages.createdAt);
      } catch (err) {
        console.warn("DB query failed, falling back to memory store:", err);
      }
    }
    return memoryStore.messages
      .filter((m) => m.leadId === leadId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async addMessage(messageData: LeadMessage): Promise<LeadMessage> {
    if (isDbConfigured && db) {
      try {
        const rows = await db.insert(leadMessages).values(messageData).returning();
        return rows[0];
      } catch (err) {
        console.warn("DB insert message failed, storing in memory:", err);
      }
    }
    memoryStore.messages.push(messageData);
    return messageData;
  },

  async getDebriefs(leadId: string): Promise<CallDebrief[]> {
    if (isDbConfigured && db) {
      try {
        return await db
          .select()
          .from(callDebriefs)
          .where(eq(callDebriefs.leadId, leadId))
          .orderBy(desc(callDebriefs.createdAt));
      } catch (err) {
        console.warn("DB query failed, falling back to memory store:", err);
      }
    }
    return memoryStore.debriefs
      .filter((d) => d.leadId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addDebrief(debriefData: CallDebrief): Promise<CallDebrief> {
    if (isDbConfigured && db) {
      try {
        const rows = await db.insert(callDebriefs).values(debriefData).returning();
        return rows[0];
      } catch (err) {
        console.warn("DB insert debrief failed, storing in memory:", err);
      }
    }
    memoryStore.debriefs.unshift(debriefData);
    return debriefData;
  },

  async addScoreHistory(entry: ScoreHistoryEntry): Promise<ScoreHistoryEntry> {
    if (isDbConfigured && db) {
      try {
        const rows = await db.insert(scoreHistory).values(entry).returning();
        return rows[0];
      } catch (err) {
        console.warn("DB insert score history failed, storing in memory:", err);
      }
    }
    memoryStore.scoreHistoryEntries.unshift(entry);
    return entry;
  },

  async getScoreHistory(leadId: string): Promise<ScoreHistoryEntry[]> {
    if (isDbConfigured && db) {
      try {
        return await db
          .select()
          .from(scoreHistory)
          .where(eq(scoreHistory.leadId, leadId))
          .orderBy(desc(scoreHistory.createdAt));
      } catch (err) {
        console.warn("DB query failed, falling back to memory store:", err);
      }
    }
    return memoryStore.scoreHistoryEntries
      .filter((e) => e.leadId === leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async resetWithDemoLeads(demoLeads: Lead[], demoAnalyses: LeadAnalysis[]) {
    if (isDbConfigured && db) {
      try {
        await db.delete(callDebriefs);
        await db.delete(leadMessages);
        await db.delete(scoreHistory);
        await db.delete(leadAnalyses);
        await db.delete(leads);

        if (demoLeads.length > 0) {
          await db.insert(leads).values(demoLeads);
        }
        if (demoAnalyses.length > 0) {
          await db.insert(leadAnalyses).values(demoAnalyses);
        }
      } catch (err) {
        console.warn("DB reset failed, resetting in memory:", err);
      }
    }

    memoryStore.leads.clear();
    memoryStore.analyses.clear();
    memoryStore.messages = [];
    memoryStore.debriefs = [];
    memoryStore.scoreHistoryEntries = [];

    for (const lead of demoLeads) {
      memoryStore.leads.set(lead.id, lead);
    }
    for (const analysis of demoAnalyses) {
      memoryStore.analyses.set(analysis.leadId, analysis);
    }
  },
};
