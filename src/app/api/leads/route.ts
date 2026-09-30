import { NextRequest, NextResponse } from "next/server";
import { leadsRepo } from "@/lib/leads-repo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag"); // HOT | WARM | COLD
    const followUpOnly = searchParams.get("followUp") === "true";
    const search = searchParams.get("search")?.toLowerCase();

    let allLeads = await leadsRepo.getAllLeads();

    // Check if leads is empty, if so seed from DEMO_LEADS_DATA
    if (allLeads.length === 0) {
      const { DEMO_LEADS_DATA } = await import("@/lib/demo-leads");
      const leadsList = DEMO_LEADS_DATA.map((d) => d.lead);
      const analysesList = DEMO_LEADS_DATA.map((d) => d.analysis);
      await leadsRepo.resetWithDemoLeads(leadsList, analysesList);
      allLeads = await leadsRepo.getAllLeads();
    }

    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;

    let filtered = allLeads;

    if (tag && ["HOT", "WARM", "COLD"].includes(tag.toUpperCase())) {
      filtered = filtered.filter((l) => l.tag === tag.toUpperCase());
    }

    if (followUpOnly) {
      filtered = filtered.filter((l) => new Date(l.lastActivityAt).getTime() < twoDaysAgo);
    }

    if (search) {
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(search) ||
          l.location.toLowerCase().includes(search) ||
          l.propertyRequirement.toLowerCase().includes(search) ||
          l.budget.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      leads: filtered,
      totalCount: allLeads.length,
      counts: {
        all: allLeads.length,
        hot: allLeads.filter((l) => l.tag === "HOT").length,
        warm: allLeads.filter((l) => l.tag === "WARM").length,
        cold: allLeads.filter((l) => l.tag === "COLD").length,
        followUpDue: allLeads.filter((l) => new Date(l.lastActivityAt).getTime() < twoDaysAgo).length,
      },
    });
  } catch (err: unknown) {
    console.error("[API/leads] Error:", err);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}
