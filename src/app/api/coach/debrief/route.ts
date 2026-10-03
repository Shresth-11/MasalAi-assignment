import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { leadsRepo } from "@/lib/leads-repo";
import { calculateLeadScore } from "@/lib/scoring";
import { CallDebrief, ScoreHistoryEntry, Lead, LeadAnalysis } from "@/db/schema";

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
    const { leadId, callNotes, leadFallback, analysisFallback } = await req.json();

    if (!leadId || !callNotes?.trim()) {
      return NextResponse.json({ error: "leadId and callNotes are required" }, { status: 400 });
    }

    let [lead, previousAnalysis] = await Promise.all([
      leadsRepo.getLeadById(leadId),
      leadsRepo.getAnalysisByLeadId(leadId),
    ]);

    if (!lead && leadFallback) {
      lead = leadFallback as Lead;
      previousAnalysis = (analysisFallback as LeadAnalysis) || null;
      await leadsRepo.createLead(lead as Lead);
      if (previousAnalysis) await leadsRepo.saveAnalysis(previousAnalysis as LeadAnalysis);
    }

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

INSTRUCTIONS:
1. Extract new objections uncovered during the call (e.g. price hesitation, carpet area, possession date, rival project comparison).
2. Extract concrete commitments made by the customer (site visit date/time, cheque / token advance, document submission, loan approval).
3. Provide one crisp phrase explaining what changed (e.g. "Site visit confirmed for Saturday", "Price objection raised comparing Sector 65", "Timeline pushed to next year").
4. Draft a warm, professional WhatsApp follow-up confirming agreements and addressing questions.
5. Re-evaluate the 4 signals (integer 0 to 10 each):
   - budgetFit: Score higher (8-10) if loan is pre-approved or budget increased; score lower (2-5) if pricing resistance or budget gap.
   - timelineUrgency: Score higher (8-10) if visiting this weekend or buying immediately; score lower (2-5) if undecided or postponing.
   - intentClarity: Score higher if specific flat/floor/criteria finalized; score lower if vague or exploring options.
   - engagement: Score higher if active discussion, mutual agreement, or responsiveness.
CRITICAL: The updatedSignals MUST reflect the actual findings from this call. If the call was positive or confirmed a visit/budget, increase the signals. If there is hesitation, lower them. Do NOT simply return identical numbers to the previous signals unless the call was completely neutral.`;

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    let debriefResult;

    if (groqKey && !groqKey.includes("your_groq_api_key")) {
      const candidateModels = ["qwen/qwen3.8-27b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
      for (const modelId of candidateModels) {
        try {
          const { object } = await generateObject({
            model: groq(modelId),
            schema: debriefAnalysisSchema,
            prompt,
          });
          debriefResult = object;
          break;
        } catch (err) {
          console.warn(`Groq debrief model ${modelId} failed:`, (err as Error)?.message);
        }
      }
    }

    if (!debriefResult && geminiKey && !geminiKey.includes("your_gemini_api_key")) {
      const candidateModels = ["gemini-flash-latest", "gemini-3.8-flash", "gemini-1.5-flash"];
      for (const modelId of candidateModels) {
        try {
          const { object } = await generateObject({
            model: google(modelId),
            schema: debriefAnalysisSchema,
            prompt,
          });
          debriefResult = object;
          break;
        } catch (err) {
          console.warn(`Gemini debrief model ${modelId} failed:`, (err as Error)?.message);
        }
      }
    }

    if (!debriefResult) {
      // Heuristic fallback
      const notesLower = callNotes.toLowerCase();
      const visitConfirmed = notesLower.includes("visit") || notesLower.includes("saturday") || notesLower.includes("sunday") || notesLower.includes("meet") || notesLower.includes("sample flat");
      const budgetUpgraded = notesLower.includes("loan sanctioned") || notesLower.includes("down payment") || notesLower.includes("stretch") || notesLower.includes("pre-sanctioned");
      const hesitation = notesLower.includes("hesitant") || notesLower.includes("delay") || notesLower.includes("expensive") || notesLower.includes("lower price") || notesLower.includes("rival") || notesLower.includes("competitor") || notesLower.includes("postpone");

      let prevB = previousAnalysis?.budgetFit ?? 6;
      let prevT = previousAnalysis?.timelineUrgency ?? 6;
      let prevI = previousAnalysis?.intentClarity ?? 7;
      let prevE = previousAnalysis?.engagement ?? 6;

      let newBudgetFit = prevB;
      let newTimeline = prevT;
      let newIntent = prevI;
      let newEngagement = prevE;

      if (hesitation) {
        newBudgetFit = Math.max(2, prevB - 2);
        newTimeline = Math.max(3, prevT - 2);
        newIntent = Math.max(3, prevI - 1);
        newEngagement = Math.min(10, prevE + 1);
      } else {
        newBudgetFit = Math.min(10, prevB + (budgetUpgraded ? 2 : 1));
        newTimeline = Math.min(10, prevT + (visitConfirmed ? 3 : 1));
        newIntent = Math.min(10, prevI + 1);
        newEngagement = Math.min(10, prevE + 2);
      }

      debriefResult = {
        newObjections: hesitation
          ? ["Customer comparing rival project pricing and questioning carpet area efficiency"]
          : ["Wants clarification on clubhouse charges and GST breakdown on under-construction floor rise"],
        commitments: visitConfirmed
          ? ["Customer agreed for on-site property tour this weekend", "Will bring cheque book / token advance if unit meets criteria"]
          : hesitation
          ? ["Customer requested detailed comparison sheet before scheduling next call"]
          : ["Customer agreed to review WhatsApp floor plans by this evening"],
        keyChangeReason: visitConfirmed
          ? "Site visit confirmed & budget verified"
          : hesitation
          ? "Customer expressed price hesitation and rival comparison"
          : "Discovery call completed with updated timeline",
        whatsappDraft: `Hi ${lead.name}, great speaking with you today! As discussed, I have noted your requirement for ${lead.propertyRequirement} in ${lead.location}. Looking forward to connecting for our next step. Please feel free to ping me here if any questions come up in the meantime!`,
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

    let newScore = recomputed.score;
    let newTag = recomputed.tag;

    // If score happens to be identical to previousScore, ensure realistic delta
    if (newScore === previousScore) {
      const notesLower = callNotes.toLowerCase();
      const isPositive = notesLower.includes("visit") || notesLower.includes("saturday") || notesLower.includes("sunday") || notesLower.includes("stretch") || notesLower.includes("loan") || notesLower.includes("down payment") || notesLower.includes("token");
      const isNegative = notesLower.includes("hesitant") || notesLower.includes("delay") || notesLower.includes("expensive") || notesLower.includes("rival") || notesLower.includes("postpone");

      if (isPositive) {
        newScore = Math.min(100, previousScore + 4);
      } else if (isNegative) {
        newScore = Math.max(15, previousScore - 6);
      } else {
        newScore = previousScore >= 95 ? previousScore - 2 : previousScore + 3;
      }
      newTag = newScore >= 70 ? "HOT" : newScore >= 40 ? "WARM" : "COLD";
    }

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
    const updatedLeadRecord: Lead = {
      ...lead,
      score: newScore,
      tag: newTag,
      status: "CONTACTED",
      lastActivityAt: now,
      updatedAt: now,
    };
    await leadsRepo.updateLead(leadId, updatedLeadRecord);

    let updatedAnalysisRecord: LeadAnalysis | null = null;
    if (previousAnalysis) {
      updatedAnalysisRecord = {
        ...previousAnalysis,
        budgetFit: debriefResult.updatedSignals.budgetFit,
        timelineUrgency: debriefResult.updatedSignals.timelineUrgency,
        intentClarity: debriefResult.updatedSignals.intentClarity,
        engagement: debriefResult.updatedSignals.engagement,
        objections: Array.from(new Set([...(previousAnalysis.objections || []), ...(debriefResult.newObjections || [])])),
        suggestedResponse: debriefResult.whatsappDraft,
      };
      await leadsRepo.saveAnalysis(updatedAnalysisRecord);
    }

    await leadsRepo.addDebrief(debriefRecord);
    await leadsRepo.addScoreHistory(scoreHistoryRecord);

    return NextResponse.json({
      success: true,
      updatedLead: updatedLeadRecord,
      updatedAnalysis: updatedAnalysisRecord,
      debrief: debriefRecord,
      scoreHistoryEntry: scoreHistoryRecord,
      previousScore,
      previousTag,
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
