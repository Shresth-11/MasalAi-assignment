import { NextRequest, NextResponse } from "next/server";
import { leadIntakeSchema } from "@/lib/validations/lead";
import { analyzeLeadWithAi } from "@/lib/ai/client";
import { calculateLeadScore } from "@/lib/scoring";
import { leadsRepo } from "@/lib/leads-repo";
import { Lead, LeadAnalysis } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();

    // 1. Zod input validation
    const parsed = leadIntakeSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const existingLeadId = typeof json.leadId === "string" ? json.leadId : undefined;
    const leadId = existingLeadId || "lead_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

    // 2. Dual-model AI analysis (Groq primary -> Gemini fallback)
    const { analysis, modelUsed, retried } = await analyzeLeadWithAi(input);

    // 3. Pure code scoring calculation (0.30*budget + 0.30*timeline + 0.25*intent + 0.15*engagement)
    const scoreResult = calculateLeadScore({
      budgetFit: analysis.budgetFit,
      timelineUrgency: analysis.timelineUrgency,
      intentClarity: analysis.intentClarity,
      engagement: analysis.engagement,
    });

    const now = new Date();

    // 4. Construct Lead and Analysis database records
    const leadRecord: Lead = {
      id: leadId,
      name: input.name,
      phone: input.phone || null,
      location: input.location,
      propertyRequirement: input.propertyRequirement,
      budget: input.budget,
      buyingTimeline: input.buyingTimeline,
      customerMessage: input.customerMessage,
      score: scoreResult.score,
      tag: scoreResult.tag,
      status: "NEW",
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const analysisRecord: LeadAnalysis = {
      id: "ana_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      leadId,
      summary: analysis.summary,
      intent: analysis.intent,
      keyRequirements: analysis.keyRequirements,
      objections: analysis.objections,
      recommendedNextAction: analysis.recommendedNextAction,
      suggestedResponse: analysis.suggestedResponse,
      budgetFit: analysis.budgetFit,
      budgetReason: analysis.budgetReason,
      timelineUrgency: analysis.timelineUrgency,
      timelineReason: analysis.timelineReason,
      intentClarity: analysis.intentClarity,
      intentReason: analysis.intentReason,
      engagement: analysis.engagement,
      engagementReason: analysis.engagementReason,
      createdAt: now,
    };

    // 5. Persist to repository
    if (existingLeadId) {
      await leadsRepo.updateLead(existingLeadId, {
        score: scoreResult.score,
        tag: scoreResult.tag,
        lastActivityAt: now,
      });
    } else {
      await leadsRepo.createLead(leadRecord);
    }

    await leadsRepo.saveAnalysis(analysisRecord);

    await leadsRepo.addScoreHistory({
      id: "hist_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      leadId,
      score: scoreResult.score,
      tag: scoreResult.tag,
      reason: existingLeadId ? "Lead re-analyzed" : "Initial AI analysis",
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      lead: leadRecord,
      analysis: analysisRecord,
      scoring: scoreResult,
      meta: {
        modelUsed,
        retried,
      },
    });
  } catch (error: unknown) {
    console.error("[API/analyze] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error during lead analysis",
        message: (error as Error)?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
