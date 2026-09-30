import { NextRequest, NextResponse } from "next/server";
import { leadsRepo } from "@/lib/leads-repo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const leadId = params.id;
    const lead = await leadsRepo.getLeadById(leadId);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const [analysis, messages, debriefs, scoreHistory] = await Promise.all([
      leadsRepo.getAnalysisByLeadId(leadId),
      leadsRepo.getMessages(leadId),
      leadsRepo.getDebriefs(leadId),
      leadsRepo.getScoreHistory(leadId),
    ]);

    return NextResponse.json({
      lead,
      analysis,
      messages,
      debriefs,
      scoreHistory,
    });
  } catch (err: unknown) {
    console.error("[API/leads/[id]] Error:", err);
    return NextResponse.json({ error: "Failed to fetch lead details" }, { status: 500 });
  }
}
