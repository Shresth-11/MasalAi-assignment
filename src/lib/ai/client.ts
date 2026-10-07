import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import { leadAnalysisAiSchema, LeadAnalysisAiOutput, LeadIntakeInput } from "@/lib/validations/lead";
import { buildLeadAnalysisPrompt } from "@/lib/ai/prompts";

export interface AnalysisExecutionResult {
  analysis: LeadAnalysisAiOutput;
  modelUsed: "groq" | "gemini-fallback" | "heuristic-fallback";
  retried: boolean;
}

export async function analyzeLeadWithAi(input: LeadIntakeInput): Promise<AnalysisExecutionResult> {
  const { systemPrompt, userPrompt } = buildLeadAnalysisPrompt(input);
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  let retried = false;

  // 1. Try Groq (Primary Provider)
  if (groqApiKey && !groqApiKey.includes("your_groq_api_key")) {
    const groqCandidateModels = ["qwen/qwen3.8-27b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
    for (const modelId of groqCandidateModels) {
      try {
        const groqModel = groq(modelId);
        const { object } = await generateObject({
          model: groqModel,
          schema: leadAnalysisAiSchema,
          system: systemPrompt,
          prompt: userPrompt,
        });

        return {
          analysis: object,
          modelUsed: "groq",
          retried: false,
        };
      } catch (groqError: unknown) {
        console.warn(`[AI Engine] Groq model ${modelId} failed:`, (groqError as Error)?.message);
        if ((groqError as Error)?.name === "JSONParseError" && !retried) {
          try {
            retried = true;
            const groqModel = groq(modelId);
            const { object } = await generateObject({
              model: groqModel,
              schema: leadAnalysisAiSchema,
              system: systemPrompt + "\nCRITICAL: Strictly return valid JSON matching schema.",
              prompt: userPrompt,
            });
            return {
              analysis: object,
              modelUsed: "groq",
              retried: true,
            };
          } catch {
            // continue
          }
        }
      }
    }
  }

  // 2. Try Gemini (Automatic Fallback)
  if (geminiApiKey && !geminiApiKey.includes("your_gemini_api_key")) {
    const geminiCandidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-1.5-flash"];
    for (const modelId of geminiCandidateModels) {
      try {
        console.log(`[AI Engine] Engaging Gemini fallback with ${modelId}...`);
        const geminiModel = google(modelId);
        const { object } = await generateObject({
          model: geminiModel,
          schema: leadAnalysisAiSchema,
          system: systemPrompt,
          prompt: userPrompt,
        });

        return {
          analysis: object,
          modelUsed: "gemini-fallback",
          retried,
        };
      } catch (geminiError: unknown) {
        console.warn(`[AI Engine] Gemini ${modelId} failed:`, (geminiError as Error)?.message);
      }
    }
  }

  // 3. Heuristic Fallback
  console.log("[AI Engine] Generating domain analysis via fallback engine...");
  const fallbackAnalysis = generateDomainHeuristicAnalysis(input);
  return {
    analysis: fallbackAnalysis,
    modelUsed: "heuristic-fallback",
    retried,
  };
}

function generateDomainHeuristicAnalysis(input: LeadIntakeInput): LeadAnalysisAiOutput {
  const msgLower = input.customerMessage.toLowerCase();
  const timelineLower = input.buyingTimeline.toLowerCase();
  const budgetLower = input.budget.toLowerCase();

  const isUrgent = timelineLower.includes("immediate") || timelineLower.includes("30") || timelineLower.includes("urgent") || msgLower.includes("jaldi") || msgLower.includes("asap");
  const isCasual = timelineLower.includes("year") || timelineLower.includes("explor") || msgLower.includes("just checking") || msgLower.includes("dekh rahe");

  const isHighBudget = budgetLower.includes("cr") || budgetLower.includes("crore") || parseInt(budgetLower) > 80;
  const isLowBudget = budgetLower.includes("lakh") && parseInt(budgetLower) < 40;

  const budgetFit = isLowBudget ? 3 : isHighBudget ? 9 : 7;
  const budgetReason = isLowBudget
    ? `Budget of ${input.budget} appears low for ${input.propertyRequirement} in ${input.location}.`
    : `Budget of ${input.budget} aligns comfortably with prevailing rates in ${input.location}.`;

  const timelineUrgency = isUrgent ? 9 : isCasual ? 3 : 6;
  const timelineReason = isUrgent
    ? "Buyer expressed urgent timeline to close within 30 days."
    : isCasual
    ? "Casual exploration stage without near-term deadline."
    : `Standard buying timeline stated as "${input.buyingTimeline}".`;

  const intentClarity = input.propertyRequirement.length > 5 && input.location.length > 3 ? 8 : 4;
  const intentReason = intentClarity >= 7
    ? `Explicitly specified ${input.propertyRequirement} in ${input.location}.`
    : "Vague specifications requiring discovery questions.";

  const engagement = input.customerMessage.length > 80 ? 8 : input.customerMessage.length > 30 ? 6 : 3;
  const engagementReason = engagement >= 7
    ? "Provided detailed context and requirements in inquiry message."
    : "Brief initial inquiry with limited background context.";

  const isInvestment = msgLower.includes("invest") || msgLower.includes("roi") || msgLower.includes("rental");
  const intent = isInvestment ? "Rental yield / Capital appreciation investment" : "End-use residential purchase";

  return {
    summary: `${input.name} is seeking a ${input.propertyRequirement} in ${input.location} with a ${input.budget} budget.`,
    intent,
    keyRequirements: [
      `${input.propertyRequirement} in ${input.location}`,
      `Stated budget limit: ${input.budget}`,
      `Preferred timeline: ${input.buyingTimeline}`,
      "Floor preference and parking verification required",
    ],
    objections: [
      `Possibility of price negotiation on ${input.budget} ceiling`,
      `Verification of RERA certificate and actual possession dates in ${input.location}`,
    ],
    recommendedNextAction: isUrgent
      ? "Call immediately to schedule an on-site visit this weekend."
      : "Send 2 verified project brochures on WhatsApp matching their criteria.",
    suggestedResponse: `Hello ${input.name}, thank you for reaching out regarding ${input.propertyRequirement} in ${input.location}. We have 2 high-quality RERA-approved options matching your ${input.budget} budget. Would you be open for a quick 2-minute call today to confirm your floor preference?`,
    budgetFit,
    budgetReason,
    timelineUrgency,
    timelineReason,
    intentClarity,
    intentReason,
    engagement,
    engagementReason,
  };
}
