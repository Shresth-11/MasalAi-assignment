import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { leadsRepo } from "@/lib/leads-repo";
import { Lead, LeadAnalysis } from "@/db/schema";

const talkTrackSchema = z.object({
  callOpener: z
    .string()
    .describe("A crisp, professional 30-second spoken call opener tailored to this buyer"),
  discoveryQuestions: z
    .array(z.string())
    .length(3)
    .describe("Exactly 3 strategic questions to qualify the lead during the call"),
  topObjection: z
    .string()
    .describe("The #1 most probable customer hesitation or objection"),
  objectionReply: z
    .string()
    .describe("A calm, assertive sales counter-reply to resolve that objection"),
});

export async function POST(req: NextRequest) {
  try {
    const { leadId, leadFallback, analysisFallback } = await req.json();
    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }

    let [lead, analysis] = await Promise.all([
      leadsRepo.getLeadById(leadId),
      leadsRepo.getAnalysisByLeadId(leadId),
    ]);

    if (!lead && leadFallback) {
      lead = leadFallback as Lead;
      analysis = (analysisFallback as LeadAnalysis) || null;
      await leadsRepo.createLead(lead as Lead);
      if (analysis) await leadsRepo.saveAnalysis(analysis as LeadAnalysis);
    }

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const prompt = `You are a top real estate sales trainer preparing a sales agent for an immediate phone call.
Buyer Details:
- Name: ${lead.name}
- Location: ${lead.location}
- Property Requirement: ${lead.propertyRequirement}
- Stated Budget: ${lead.budget}
- Stated Timeline: ${lead.buyingTimeline}
- Raw Message: "${lead.customerMessage}"
- Stated Objections: ${analysis?.objections?.join(", ") || "Price/possession timing"}

Create:
1. A 30-second natural call opener (no robotic introductions, reference their exact property request).
2. Exactly 3 sharp discovery questions (confirm financing, decision-making timeline, and non-negotiables).
3. The top anticipated objection and how to counter it smoothly.`;

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    let talkTrackData;

    if (groqKey && !groqKey.includes("your_groq_api_key")) {
      try {
        const { object } = await generateObject({
          model: groq("qwen/qwen3.8-27b"),
          schema: talkTrackSchema,
          prompt,
        });
        talkTrackData = object;
      } catch (err) {
        console.warn("Groq talk track failed, trying Gemini fallback:", err);
      }
    }

    if (!talkTrackData && geminiKey && !geminiKey.includes("your_gemini_api_key")) {
      try {
        const { object } = await generateObject({
          model: google("gemini-3.8-flash"),
          schema: talkTrackSchema,
          prompt,
        });
        talkTrackData = object;
      } catch (err) {
        console.warn("Gemini talk track failed:", err);
      }
    }

    if (!talkTrackData) {
      talkTrackData = {
        callOpener: `Hello ${lead.name}, this is your property advisor. I saw your inquiry for a ${lead.propertyRequirement} in ${lead.location} with a budget of ${lead.budget}. I have two high-quality RERA-cleared options matching your timeline, and wanted to see if you have two quick minutes to discuss your exact floor preference?`,
        discoveryQuestions: [
          `Are you planning to finance this with a home loan, or do you have down payment funds readily available?`,
          `Who else in the family is involved in the final decision, and what is your hard deadline for moving in?`,
          `Between carpet area, floor height, and society amenities, which factor is your absolute #1 priority?`,
        ],
        topObjection: `The stated budget of ${lead.budget} may be slightly stretched by stamp duty, registration, and club amenities.`,
        objectionReply: `I completely respect your budget ceiling. We can look at exclusive builder subvention schemes or negotiate waiver of floor rise charges to ensure your total out-of-pocket stays strictly within your comfort zone.`,
      };
    }

    return NextResponse.json({ success: true, talkTrack: talkTrackData });
  } catch (err: unknown) {
    console.error("[API/coach/talk-track] Error:", err);
    return NextResponse.json({ error: "Failed to generate talk track" }, { status: 500 });
  }
}
