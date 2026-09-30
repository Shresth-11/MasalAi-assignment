import { NextRequest } from "next/server";
import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import { leadsRepo } from "@/lib/leads-repo";

export async function POST(req: NextRequest) {
  try {
    const { messages, leadId } = await req.json();

    if (!leadId) {
      return new Response("Missing leadId", { status: 400 });
    }

    const [lead, analysis] = await Promise.all([
      leadsRepo.getLeadById(leadId),
      leadsRepo.getAnalysisByLeadId(leadId),
    ]);

    if (!lead) {
      return new Response("Lead not found", { status: 404 });
    }

    const latestUserMessage = messages[messages.length - 1];

    if (latestUserMessage && latestUserMessage.role === "user") {
      await leadsRepo.addMessage({
        id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        leadId,
        role: "user",
        content: latestUserMessage.content,
        createdAt: new Date(),
      });
    }

    const systemPrompt = `You are a real-time sales co-pilot helping a commercial real estate agent close this specific lead.
CRITICAL CONSTRAINT: You ONLY know and advise on this specific lead. You MUST NOT hallucinate or invent project details, prices, or amenities that are not stated in the lead profile below. If information is missing, advise the agent to ask the customer during their discovery call.

LEAD PROFILE:
- Customer Name: ${lead.name}
- Phone: ${lead.phone || "Not provided"}
- Location of Interest: ${lead.location}
- Property Requirement: ${lead.propertyRequirement}
- Stated Budget: ${lead.budget}
- Timeline: ${lead.buyingTimeline}
- Calculated Lead Score: ${lead.score}/100 (${lead.tag})
- Customer's Raw Inquiry: "${lead.customerMessage}"

CURRENT AI ANALYSIS & SIGNALS:
- One-line Summary: ${analysis?.summary || "N/A"}
- Intent Category: ${analysis?.intent || "N/A"}
- Key Requirements: ${analysis?.keyRequirements?.join("; ") || "N/A"}
- Anticipated Objections: ${analysis?.objections?.join("; ") || "N/A"}
- Recommended Next Step: ${analysis?.recommendedNextAction || "N/A"}
- Suggested Initial Response: ${analysis?.suggestedResponse || "N/A"}

STYLE GUIDELINES:
- Keep advice actionable, concise, and realistic for Indian real estate sales.
- When drafting messages, write in professional, friendly English or polite Hinglish where natural.
- Avoid generic marketing buzzwords; be direct, polite, and consultative.`;

    const groqApiKey = process.env.GROQ_API_KEY;
    const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    let modelInstance = null;

    if (groqApiKey && !groqApiKey.includes("your_groq_api_key")) {
      const groqCandidates = ["llama-3.3-70b-versatile", "qwen/qwen3.8-27b", "llama-3.1-8b-instant"];
      for (const mId of groqCandidates) {
        try {
          modelInstance = groq(mId);
          break;
        } catch {
          // continue
        }
      }
    }

    if (!modelInstance && geminiApiKey && !geminiApiKey.includes("your_gemini_api_key")) {
      const geminiCandidates = ["gemini-3.8-flash", "gemini-1.5-flash", "gemini-flash-latest"];
      for (const mId of geminiCandidates) {
        try {
          modelInstance = google(mId);
          break;
        } catch {
          // continue
        }
      }
    }

    if (!modelInstance) {
      const encoder = new TextEncoder();
      const mockReply = getFallbackChatResponse(latestUserMessage?.content || "", lead, analysis);
      
      await leadsRepo.addMessage({
        id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        leadId,
        role: "assistant",
        content: mockReply,
        createdAt: new Date(),
      });

      const stream = new ReadableStream({
        async start(controller) {
          const parts = mockReply.split(" ");
          for (const part of parts) {
            controller.enqueue(encoder.encode(`0:${JSON.stringify(part + " ")}\n`));
            await new Promise((r) => setTimeout(r, 25));
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Vercel-AI-Data-Stream": "v1",
        },
      });
    }

    try {
      const result = streamText({
        model: modelInstance,
        system: systemPrompt,
        messages: messages.map((m: { role: "user" | "assistant" | "system"; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
        async onFinish(event) {
          if (event.text) {
            await leadsRepo.addMessage({
              id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
              leadId,
              role: "assistant",
              content: event.text,
              createdAt: new Date(),
            });
          }
        },
      });

      return result.toDataStreamResponse();
    } catch (streamErr) {
      console.warn("[API/chat] Stream failed, using fallback:", streamErr);
      const encoder = new TextEncoder();
      const mockReply = getFallbackChatResponse(latestUserMessage?.content || "", lead, analysis);
      const stream = new ReadableStream({
        async start(controller) {
          const parts = mockReply.split(" ");
          for (const part of parts) {
            controller.enqueue(encoder.encode(`0:${JSON.stringify(part + " ")}\n`));
            await new Promise((r) => setTimeout(r, 20));
          }
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Vercel-AI-Data-Stream": "v1",
        },
      });
    }
  } catch (err: unknown) {
    console.error("[API/chat] Unhandled error:", err);
    return new Response(JSON.stringify({ error: "Failed to process chat" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function getFallbackChatResponse(query: string, lead: any, analysis: any): string {
  const q = query.toLowerCase();
  if (q.includes("emphasize") || q.includes("call")) {
    return `For ${lead.name} (${lead.tag} - Score ${lead.score}/100):\n1. Emphasize verified RERA status and exact possession dates for ${lead.propertyRequirement} in ${lead.location}.\n2. Confirm their timeline (${lead.buyingTimeline}) and ask if their loan or down payment is ready.\n3. Address anticipated objection: "${analysis?.objections?.[0] || 'Budget flexibility'}".`;
  }
  if (q.includes("assertive")) {
    return `Hi ${lead.name}, we have only 2 units matching your exact ${lead.propertyRequirement} criteria in ${lead.location} within ${lead.budget}. Due to high festive demand, I can hold one slot for your family visit this Saturday until 4 PM. Please confirm if 11:30 AM works.`;
  }
  if (q.includes("whatsapp") || q.includes("shorter")) {
    return `Hi ${lead.name}! Found 2 prime ${lead.propertyRequirement} options in ${lead.location} within your ${lead.budget} budget. Can I share the PDF floor plans and video tour here?`;
  }
  return `Based on ${lead.name}'s requirement for ${lead.propertyRequirement} in ${lead.location}, the priority is ${analysis?.recommendedNextAction || 'scheduling an on-site visit'}. Their stated budget of ${lead.budget} and timeline of ${lead.buyingTimeline} make this a high-intent opportunity.`;
}
