/**
 * Lead Scoring Engine
 * 
 * HYBRID SCORING ARCHITECTURE:
 * 1. LLM extracts discrete 0-10 numerical signals + factual reasons from unstructured lead context.
 * 2. Deterministic code calculates the final weighted score (0-100) and assigns the priority tag.
 * 
 * Why this approach?
 * - Predictable & Explainable: Never lets the LLM hallucinate an arbitrary 95/100 score.
 * - Testable: The formula is pure math and can be unit tested without API mocks.
 * - Auditable: Salespeople can see the exact breakdown and reasons behind every score.
 */

export interface LeadSignals {
  budgetFit: number;        // 0 to 10
  timelineUrgency: number;  // 0 to 10
  intentClarity: number;    // 0 to 10
  engagement: number;       // 0 to 10
}

export interface LeadSignalReasons {
  budgetReason: string;
  timelineReason: string;
  intentReason: string;
  engagementReason: string;
}

export type LeadTag = "HOT" | "WARM" | "COLD";

export interface ScoreCalculationResult {
  score: number; // 0 to 100
  tag: LeadTag;
  weights: {
    budget: number;
    timeline: number;
    intent: number;
    engagement: number;
  };
  breakdown: {
    budgetContribution: number;
    timelineContribution: number;
    intentContribution: number;
    engagementContribution: number;
  };
}

// Weights as strictly defined in specifications:
// 0.30 * budgetFit + 0.30 * timelineUrgency + 0.25 * intentClarity + 0.15 * engagement
export const SCORING_WEIGHTS = {
  budget: 0.30,
  timeline: 0.30,
  intent: 0.25,
  engagement: 0.15,
} as const;

/**
 * Pure function to calculate lead score and tag from raw 0-10 signals.
 */
export function calculateLeadScore(signals: LeadSignals): ScoreCalculationResult {
  // Clamp signals to safe [0, 10] bounds
  const budget = Math.max(0, Math.min(10, Number(signals.budgetFit) || 0));
  const timeline = Math.max(0, Math.min(10, Number(signals.timelineUrgency) || 0));
  const intent = Math.max(0, Math.min(10, Number(signals.intentClarity) || 0));
  const engagement = Math.max(0, Math.min(10, Number(signals.engagement) || 0));

  const budgetContribution = budget * SCORING_WEIGHTS.budget * 10;
  const timelineContribution = timeline * SCORING_WEIGHTS.timeline * 10;
  const intentContribution = intent * SCORING_WEIGHTS.intent * 10;
  const engagementContribution = engagement * SCORING_WEIGHTS.engagement * 10;

  // Scale 0-10 weighted sum to 0-100
  const rawScore = budgetContribution + timelineContribution + intentContribution + engagementContribution;
  const score = Math.round(rawScore);

  let tag: LeadTag = "COLD";
  if (score >= 70) {
    tag = "HOT";
  } else if (score >= 40) {
    tag = "WARM";
  }

  return {
    score,
    tag,
    weights: { ...SCORING_WEIGHTS },
    breakdown: {
      budgetContribution: Math.round(budgetContribution * 10) / 10,
      timelineContribution: Math.round(timelineContribution * 10) / 10,
      intentContribution: Math.round(intentContribution * 10) / 10,
      engagementContribution: Math.round(engagementContribution * 10) / 10,
    },
  };
}
