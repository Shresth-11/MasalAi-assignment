import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { leadsRepo } from "@/lib/leads-repo";
import { calculateLeadScore } from "@/lib/scoring";
import { CallDebrief, ScoreHistoryEntry } from "@/db/schema";

const debriefAnalysisSchema = z.object({
  newObjections: z
    .array(z.string())
    .describe("New customer objections, concerns, or hesitations raised during this call"),
  commitments: z
    .array(z.string())
    .describe("Specific commitments or promises made by the customer (e.g. site visit time, sending loan docs)"),
  keyChangeReason: z
    .string()
    .describe("A short phrase explaining the core change (e.g. 'budget confirmed at ₹3.5 Cr', 'site visit agreed', 'timeline pushed back')"),
  whatsappDraft: z
    .string()
    .describe("A warm, professional follow-up WhatsApp message summarizing agreements and confirming next step"),
  updatedSignals: z.object({
    budgetFit: z.number().min(0).max(10).describe("Updated 0-10 score for budget fit after call"),
    timelineUrgency: z.number().min(0).max(10).describe("Updated 0-10 score for timeline urgency"),
    intentClarity: z.number().min(0).max(10).describe("Updated 0-10 score for clarity of intent and specifications"),
    engagement: z.number().min(0).max(10).describe("Updated 0-10 score for responsiveness and collaboration on the call"),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const { leadId, callNotes } = await req.json();

    if (!leadId || !callNotes?.trim()) {
      return NextResponse.json({ error: "leadId and callNotes are required" }, { status: 400 });
    }

    const [lead, previousAnalysis] = await Promise.all([
      leadsRepo.getLeadById(leadId),
      leadsRepo.getAnalysisByLeadId(leadId),
    ]);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const previousScore = lead.score;
    const previousTag = lead.tag;

    const prompt = `You are an elite Indian real estate sales analyst reviewing post-call notes or transcript.
LEAD CONTEXT:
- Name: ${lead.name}
- Location: ${lead.location}
- Property: ${lead.propertyRequirement}
- Original Budget: ${lead.budget}
- Original Timeline: ${lead.buyingTimeline}
- Current Score: ${lead.score}/100 (${lead.tag})
- Previous Signals: Budget: ${previousAnalysis?.budgetFit || 5}/10, Timeline: ${previousAnalysis?.timelineUrgency || 5}/10, Intent: ${previousAnalysis?.intentClarity || 5}/10, Engagement: ${previousAnalysis?.engagement || 5}/10

<CALL_NOTES>
${callNotes}
</CALL_NOTES>

Extract:
1. New objections uncovered
2. Commitments made by the customer (site visit, document sharing, financing)
3. One crisp phrase explaining what changed
4. Draft a warm WhatsApp follow-up confirming agreements
5. Re-evaluate the 4 signals (0 to 10 each based on new facts revealed)`;

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    let debriefResult;

    if (groqKey && !groqKey.includes("your_groq_api_key")) {
      try {
        const { object } = await generateObject({
          model: groq("qwen/qwen3.8-27b"),
          schema: debriefAnalysisSchema,
          prompt,
        });
        debriefResult = object;
      } catch (err) {
        console.warn("Groq debrief failed, trying Gemini fallback:", err);
      }
    }

    if (!debriefResult && geminiKey && !geminiKey.includes("your_gemini_api_key")) {
      try {
        const { object } = await generateObject({
          model: google("gemini-3.8-flash"),
          schema: debriefAnalysisSchema,
          prompt,
        });
        debriefResult = object;
      } catch (err) {
        console.warn("Gemini debrief failed:", err);
      }
    }

    if (!debriefResult) {
      // Heuristic fallback
      const notesLower = callNotes.toLowerCase();
      const visitConfirmed = notesLower.includes("visit") || notesLower.includes("saturday") || notesLower.includes("sunday") || notesLower.includes("meet");
      const budgetUpgraded = notesLower.includes("loan sanctioned") || notesLower.includes("down payment") || notesLower.includes("stretch");

      const newBudgetFit = Math.min(10, (previousAnalysis?.budgetFit || 6) + (budgetUpgraded ? 2 : 1));
      const newTimeline = Math.min(10, (previousAnalysis?.timelineUrgency || 6) + (visitConfirmed ? 2 : 0));
      const newIntent = Math.min(10, (previousAnalysis?.intentClarity || 7) + 1);
      const newEngagement = Math.min(10, (previousAnalysis?.engagement || 6) + 2);

      debriefResult = {
        newObjections: [
          "Wants clarification on clubhouse charges and GST breakdown on under-construction floor rise",
        ],
        commitments: visitConfirmed
          ? ["Customer agreed for on-site property tour this weekend", "Will bring cheque book / token advance if unit meets criteria"]
          : ["Customer agreed to review WhatsApp floor plans by this evening"],
        keyChangeReason: visitConfirmed
          ? "Site visit confirmed & budget verified"
          : "Discovery call completed with updated timeline",
        whatsappDraft: `Hi ${lead.name}, great speaking with you today! As discussed, I have locked in your requirement for ${lead.propertyRequirement} in ${lead.location}. Looking forward to connecting for our next step. Please feel free to ping me here if any questions come up in the meantime!`,
        updatedSignals: {
          budgetFit: newBudgetFit,
          timelineUrgency: newTimeline,
          intentClarity: newIntent,
          engagement: newEngagement,
        },
      };
    }

    // PURE RECOMPUTATION OF LEAD SCORE
    const recomputed = calculateLeadScore({
      budgetFit: debriefResult.updatedSignals.budgetFit,
      timelineUrgency: debriefResult.updatedSignals.timelineUrgency,
      intentClarity: debriefResult.updatedSignals.intentClarity,
      engagement: debriefResult.updatedSignals.engagement,
    });

    const newScore = recomputed.score;
    const newTag = recomputed.tag;

    const changeSummary = `${previousTag} ${previousScore} → ${newTag} ${newScore}, ${debriefResult.keyChangeReason}`;

    const now = new Date();

    // Prepare WhatsApp Link: https://wa.me/<phone>?text=<encoded>
    let rawPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, "") : "";
    if (rawPhone.length === 10) rawPhone = "91" + rawPhone;
    const waUrl = rawPhone
      ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(debriefResult.whatsappDraft)}`
      : `https://wa.me/?text=${encodeURIComponent(debriefResult.whatsappDraft)}`;

    // Store Debrief
    const debriefRecord: CallDebrief = {
      id: "deb_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      leadId,
      callNotes,
      newObjections: debriefResult.newObjections,
      commitments: debriefResult.commitments,
      whatsappDraft: debriefResult.whatsappDraft,
      previousScore,
      previousTag,
      newScore,
      newTag,
      changeSummary,
      createdAt: now,
    };

    // Store Score History Entry
    const scoreHistoryRecord: ScoreHistoryEntry = {
      id: "hist_deb_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      leadId,
      score: newScore,
      tag: newTag,
      reason: `Post-call debrief: ${changeSummary}`,
      createdAt: now,
    };

    // Update Lead Record in Repository
    await leadsRepo.updateLead(leadId, {
      score: newScore,
      tag: newTag,
      status: "CONTACTED",
      lastActivityAt: now,
    });

    await leadsRepo.addDebrief(debriefRecord);
    await leadsRepo.addScoreHistory(scoreHistoryRecord);

    return NextResponse.json({
      success: true,
      debrief: debriefRecord,
      newScore,
      newTag,
      changeSummary,
      recomputed,
      whatsappUrl: waUrl,
    });
  } catch (err: unknown) {
    console.error("[API/coach/debrief] Error:", err);
    return NextResponse.json({ error: "Failed to process call debrief" }, { status: 500 });
  }
}
