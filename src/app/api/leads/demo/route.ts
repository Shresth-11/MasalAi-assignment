import { NextResponse } from "next/server";
import { DEMO_LEADS_DATA } from "@/lib/demo-leads";
import { leadsRepo } from "@/lib/leads-repo";

export async function POST() {
  try {
    const leadsList = DEMO_LEADS_DATA.map((d) => d.lead);
    const analysesList = DEMO_LEADS_DATA.map((d) => d.analysis);

    await leadsRepo.resetWithDemoLeads(leadsList, analysesList);

    return NextResponse.json({
      success: true,
      message: `Successfully loaded ${leadsList.length} Indian real estate demo leads`,
      count: leadsList.length,
    });
  } catch (err: unknown) {
    console.error("[API/leads/demo] Error:", err);
    return NextResponse.json({ error: "Failed to reload demo leads" }, { status: 500 });
  }
}
