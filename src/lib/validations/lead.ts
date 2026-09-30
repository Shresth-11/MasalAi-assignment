import { z } from "zod";

/**
 * Lead Intake validation schema
 * Handles Hinglish text, empty optional fields, and long transcripts.
 */
export const leadIntakeSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  location: z.string().trim().min(2, "Location is required").max(120),
  propertyRequirement: z.string().trim().min(2, "Property requirement is required").max(150),
  budget: z.string().trim().min(2, "Budget is required").max(80),
  buyingTimeline: z.string().trim().min(2, "Timeline is required").max(80),
  customerMessage: z
    .string()
    .trim()
    .min(5, "Customer message should have some context")
    // Safe truncation to 4000 characters for long transcript/WhatsApp chat paste
    .transform((msg) => (msg.length > 4000 ? msg.slice(0, 4000) + "... [truncated for length]" : msg)),
});

export type LeadIntakeInput = z.infer<typeof leadIntakeSchema>;

/**
 * Strict AI Analysis Output schema
 * Validates discrete signals (0-10), reasons, and structured fields.
 */
export const leadAnalysisAiSchema = z.object({
  summary: z
    .string()
    .describe("Crisp, one-line summary of the lead's core profile and intent"),
  intent: z
    .string()
    .describe("Specific intent category: End-use purchase, Rental yield investment, Capital appreciation, Relocation, or Low intent"),
  keyRequirements: z
    .array(z.string())
    .min(1)
    .max(6)
    .describe("List of 2 to 5 specific requirements (e.g. '3 BHK facing park', 'High floor', 'RERA registered')"),
  objections: z
    .array(z.string())
    .max(5)
    .describe("Anticipated customer hesitations, price constraints, or location doubts"),
  recommendedNextAction: z
    .string()
    .describe("Concrete, immediate next action for the real estate agent"),
  suggestedResponse: z
    .string()
    .describe("A natural, professional WhatsApp or SMS reply addressing their inquiry directly"),
  // Discrete scoring signals (0 to 10) with one-line factual justification
  budgetFit: z
    .number()
    .min(0)
    .max(10)
    .describe("Score from 0 to 10 on budget realism relative to their requested property and location"),
  budgetReason: z
    .string()
    .describe("One-line factual reason for the budget fit score"),
  timelineUrgency: z
    .number()
    .min(0)
    .max(10)
    .describe("Score from 0 to 10 on buying urgency (Immediate/30 days = 9-10, 1-3 months = 7-8, Just browsing = 1-3)"),
  timelineReason: z
    .string()
    .describe("One-line factual reason for the timeline score"),
  intentClarity: z
    .number()
    .min(0)
    .max(10)
    .describe("Score from 0 to 10 on clarity of specifications (clear configuration, location, purpose = 8-10, vague = 1-4)"),
  intentReason: z
    .string()
    .describe("One-line factual reason for the intent clarity score"),
  engagement: z
    .number()
    .min(0)
    .max(10)
    .describe("Score from 0 to 10 on customer engagement level, detail in message, or responsiveness"),
  engagementReason: z
    .string()
    .describe("One-line factual reason for the engagement score"),
});

export type LeadAnalysisAiOutput = z.infer<typeof leadAnalysisAiSchema>;
