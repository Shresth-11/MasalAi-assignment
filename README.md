# Masal LeadOps: Inbound Lead Prioritization & Intelligence Engine

> A high-density, production-grade intelligence console built for real estate sales teams handling hundreds of inbound leads daily. Prioritizes high-intent buyers, extracts actionable requirements, generates pre-call talk tracks, and enables post-call debriefs with automated WhatsApp follow-ups.

**Live Deployment URL**: [https://masal-ai-assignment-c6tt.vercel.app](https://masal-ai-assignment-c6tt.vercel.app)  
**Public Repository**: [https://github.com/Shresth-11/MasalAi-assignment](https://github.com/Shresth-11/MasalAi-assignment)

---

## 1. Architecture Overview

```
                      [ Inbound Lead / Intake Form ]
                                    │
                                    ▼
                     [ Prompt Guard & Delimiters ]
                   <UNTRUSTED_CUSTOMER_INPUT>...</>
                                    │
                                    ▼
                     [ Dual-Model Failover Service ]
                     Primary: Groq (Llama 3.3 70B)
                                    │ (Failover on 429 / Error)
                                    ▼
                     Fallback: Google Gemini 1.5 Flash
                                    │
                                    ▼
                       [ Strict Zod Output Schema ]
                     (4 discrete signals: 0-10 + reasons)
                                    │
                                    ▼
                     [ Pure Code Scoring Engine ]
              0.30*Budget + 0.30*Timeline + 0.25*Intent + 0.15*Engage
                                    │
                                    ▼
                     [ Neon Postgres + Drizzle ORM ]
                    (Automatic Zero-Setup Memory Fallback)
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          ▼                                                   ▼
  [ Scannable Lead Table ]                            [ Lead Detail Dossier ]
  - HOT / WARM / COLD tags                            - Signal progress meters & reasons
  - "Follow-up due" (>2 days)                         - Streaming Sales Co-pilot (`streamText`)
  - Arrow key navigation                              - Pre-Call Talk Track (Opener + 3 Qs)
  - 1-Click "Load Demo Leads"                         - Post-Call Debrief (Web Speech API mic)
                                                      - One-tap WhatsApp Send (`wa.me`)
```

---

## 2. Models Used & Failover Strategy

1. **Primary Model**: `llama-3.3-70b-versatile` on **Groq** via `@ai-sdk/groq`
   - Chosen for ultra-low latency inference (~300–600ms response time), vital for real-time sales operations.
   - Used for structured object generation (`generateObject`) and chat streaming (`streamText`).
2. **Automatic Fallback Model**: `gemini-1.5-flash` on **Google Generative AI** via `@ai-sdk/google`
   - Triggered automatically on HTTP 429 rate limit errors, API timeouts, or unparseable responses.
   - Built-in 1-time automatic retry if the output violates the strict Zod schema.
3. **Zero-Setup Offline Resilience**:
   - If deployed in an environment without external credentials, an internal domain-heuristic analyzer guarantees the engine remains 100% operational with zero downtime.

---

## 3. Why Scoring is Hybrid (LLM Signals + Pure Code Math)

A common flaw in AI-driven CRM apps is asking the model directly: *"Give this lead a score from 0 to 100"*. This produces hallucinated, unpredictable, and unexplainable scores.

**Masal LeadOps uses a Hybrid Scoring Architecture**:
1. **LLM extracts discrete qualitative signals (0 to 10)**:
   - `budgetFit` (0–10): Is the budget realistic for the requested BHK and micro-market?
   - `timelineUrgency` (0–10): Are they ready to close within 30 days vs casual browsing?
   - `intentClarity` (0–10): Exact configuration, preferred location, and purpose stated?
   - `engagement` (0–10): Depth of communication, questions asked, and responsiveness.
   Each signal requires a factual 1-line reason extracted from the context.
2. **Pure TypeScript code computes the final weighted score**:
   $$\text{Final Score} = (0.30 \times \text{budgetFit} + 0.30 \times \text{timelineUrgency} + 0.25 \times \text{intentClarity} + 0.15 \times \text{engagement}) \times 10$$
3. **Deterministic Tagging**:
   - $\ge 70$: **HOT**
   - $40\text{--}69$: **WARM**
   - $< 40$: **COLD**

**Benefits**:
- **Auditability**: Sales reps and managers can inspect the exact mathematical contributions.
- **Explainability**: In interviews and team reviews, the scoring is 100% testable without mocking LLMs.
- **Consistency**: The same signals will always yield the exact same score.

---

## 4. Key Features

- **Dense, Scannable Lead Table**: Real B2B product density, left-aligned, scannable in seconds. Filter by HOT / WARM / COLD, or "Follow-up due" (leads with no activity for $> 2$ days).
- **Keyboard Navigation**: Use `↑` / `↓` arrow keys to navigate the lead list, and press `Enter` to open.
- **Prompt Injection Defense**: Untrusted customer messages (including Hinglish and long chat logs) are wrapped in `<UNTRUSTED_CUSTOMER_INPUT>` delimiters with explicit instructions to ignore prompt injection attempts.
- **Call Coach**:
  - **Pre-Call Talk Track**: Generates a 30-second conversational opener, 3 discovery questions, and the top anticipated objection with a recommended counter reply.
  - **Post-Call Debrief**: Paste notes or speak via the **browser Web Speech API mic dictation**. Extracts commitments made, recomputes score diff (*"WARM 58 → HOT 76, budget confirmed"*), and produces a pre-filled `https://wa.me/?text=...` WhatsApp link.
- **Context-Grounded Chat Co-pilot**: Per-lead streaming chat with quick suggestion chips (*"What should I emphasize on the call?"*, *"Make my reply more assertive"*, *"Shorter version for WhatsApp"*).

---

## 5. Local Setup & Running Locally

### Prerequisites
- Node.js 18+ (tested on Node v22)
- npm 10+

### Step 1: Clone and Install
```bash
git clone https://github.com/Shresth-11/MasalAi-assignment.git
cd MasalAi-assignment
npm install
```

### Step 2: Configure Environment (Optional)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your free tier keys:
```env
GROQ_API_KEY=gsk_...
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...
DATABASE_URL=postgresql://... (Optional: Neon Postgres URL)
```
> **Note**: If no external API keys are configured, Masal LeadOps automatically activates its deterministic fallback mode with pre-seeded Indian real estate data. It runs **zero-setup out of the box**.

### Step 3: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Key Technical Decisions

| Decision | Rationale |
| :--- | :--- |
| **Next.js App Router + TypeScript** | Full-stack server actions, streaming API routes (`streamText`), and strict compile-time type safety. |
| **Drizzle ORM + Neon Postgres HTTP** | Ultra-lightweight serverless SQL driver that avoids connection pool exhaustion on Vercel serverless functions. |
| **Repository Dual-Store Pattern** | `leads-repo.ts` uses Postgres when configured, but seamlessly falls back to memory store if no database URL is provided. Ensures the application runs reliably out-of-the-box in stateless or test environments. |
| **No AI Visual Tropes** | Avoided glowing blobs, purple gradients, and glassmorphism. Used subtle 1px slate borders, high-contrast tables, and semantic badges only for actionable statuses. |

---

## 7. Known Limitations

1. **No Authentication**: Designed as a single-tenant sales workspace without user login/RBAC.
2. **Free Tier Rate Limits**: Relies on Groq and Gemini free tiers; during extreme bursts, fallback cascades.
3. **Heuristic Weight Calibration**: Signal weights (0.30, 0.30, 0.25, 0.15) are currently hardcoded domain heuristics rather than calibrated on historical conversion datasets.
4. **Prompt Injection Boundary**: While XML delimitation protects against standard injection attacks, sophisticated adversarial text in transcripts requires multi-layer token filtering.

---

## 8. Scaling to 100,000 Leads a Day

If this tool were scaled to handle 100k inbound leads daily across nationwide builder portfolios:
1. **Asynchronous Ingestion Queue (BullMQ + Redis)**: Decouple lead intake from AI analysis. Intake immediately writes raw lead to DB and enqueues a job, returning HTTP 202 in $<50\text{ms}$.
2. **Semantic Caching & Deduping**: Hash customer phone numbers and run vector similarity on messages to prevent duplicate LLM calls on repeated buyer inquiries.
3. **Batch LLM Inference**: Aggregate low-urgency leads into batch completion requests (e.g., Groq Batch or OpenAI Batch API) for 50% cost reduction.
4. **Read Replicas & CQRS**: Direct heavy table queries and status filtering to read replicas while writes are processed via background queue workers.
5. **Calibrated Machine Learning Model**: Train a lightweight gradient boosted tree (XGBoost) on real CRM closed-won outcome data to predict conversion probability, using LLM only for qualitative feature extraction.
