import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const leads = pgTable("leads", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  location: text("location").notNull(),
  propertyRequirement: text("property_requirement").notNull(),
  budget: text("budget").notNull(),
  buyingTimeline: text("buying_timeline").notNull(),
  customerMessage: text("customer_message").notNull(),
  score: integer("score").default(0).notNull(),
  tag: text("tag").default("COLD").notNull(), // HOT, WARM, COLD
  status: text("status").default("NEW").notNull(), // NEW, CONTACTED, QUALIFIED, ARCHIVED
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const leadAnalyses = pgTable("lead_analyses", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  intent: text("intent").notNull(),
  keyRequirements: jsonb("key_requirements").$type<string[]>().notNull(),
  objections: jsonb("objections").$type<string[]>().notNull(),
  recommendedNextAction: text("recommended_next_action").notNull(),
  suggestedResponse: text("suggested_response").notNull(),
  // Signals 0 to 10
  budgetFit: integer("budget_fit").notNull(),
  budgetReason: text("budget_reason").notNull(),
  timelineUrgency: integer("timeline_urgency").notNull(),
  timelineReason: text("timeline_reason").notNull(),
  intentClarity: integer("intent_clarity").notNull(),
  intentReason: text("intent_reason").notNull(),
  engagement: integer("engagement").notNull(),
  engagementReason: text("engagement_reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const leadMessages = pgTable("lead_messages", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user | assistant | system
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const callDebriefs = pgTable("call_debriefs", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  callNotes: text("call_notes").notNull(),
  newObjections: jsonb("new_objections").$type<string[]>().notNull(),
  commitments: jsonb("commitments").$type<string[]>().notNull(),
  whatsappDraft: text("whatsapp_draft").notNull(),
  previousScore: integer("previous_score").notNull(),
  previousTag: text("previous_tag").notNull(),
  newScore: integer("new_score").notNull(),
  newTag: text("new_tag").notNull(),
  changeSummary: text("change_summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const scoreHistory = pgTable("score_history", {
  id: text("id").primaryKey(),
  leadId: text("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  tag: text("tag").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type LeadAnalysis = typeof leadAnalyses.$inferSelect;
export type NewLeadAnalysis = typeof leadAnalyses.$inferInsert;
export type LeadMessage = typeof leadMessages.$inferSelect;
export type CallDebrief = typeof callDebriefs.$inferSelect;
export type ScoreHistoryEntry = typeof scoreHistory.$inferSelect;
