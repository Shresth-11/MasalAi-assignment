import { Lead, LeadAnalysis } from "@/db/schema";
import { calculateLeadScore } from "@/lib/scoring";

export interface DemoLeadBundle {
  lead: Lead;
  analysis: LeadAnalysis;
}

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

export const DEMO_LEADS_DATA: DemoLeadBundle[] = [
  // 1. HOT LEAD - Gurugram Luxury End-Use (Pre-approved loan)
  (() => {
    const leadId = "lead_demo_01";
    const signals = { budgetFit: 9, timelineUrgency: 9, intentClarity: 10, engagement: 9 };
    const { score, tag } = calculateLeadScore(signals);
    return {
      lead: {
        id: leadId,
        name: "Vikramaditya Singhania",
        phone: "+919811223344",
        location: "Gurugram, Golf Course Ext Road",
        propertyRequirement: "3.5 BHK High-Rise Apartment",
        budget: "₹3.2 Cr - ₹3.6 Cr",
        buyingTimeline: "Immediate (within 20 days)",
        customerMessage: "Looking for a ready-to-move or nearing-possession 3.5 BHK on Golf Course Extension Road. We need middle to high floor, park or clubhouse facing, and min 2 car parkings. HDFC home loan already pre-sanctioned for ₹2.5 Cr. Can visit this Saturday morning with family.",
        score,
        tag,
        status: "NEW",
        lastActivityAt: daysAgo(0.2),
        createdAt: daysAgo(0.5),
        updatedAt: daysAgo(0.2),
      },
      analysis: {
        id: "ana_demo_01",
        leadId,
        summary: "Pre-approved corporate buyer seeking 3.5 BHK on Golf Course Ext Rd with immediate 20-day timeline.",
        intent: "End-use residential luxury upgrade",
        keyRequirements: [
          "3.5 BHK on Golf Course Extension Road",
          "Middle to high floor with park/clubhouse view",
          "Minimum 2 reserved car parkings",
          "Ready to move or possession within 60 days",
        ],
        objections: [
          "Needs clear verification of builder OC (Occupancy Certificate)",
          "Strict about maintenance charges and actual carpet area ratio",
        ],
        recommendedNextAction: "Call to confirm 11:00 AM Saturday site visit for 2 shortlisted DLF & M3M towers.",
        suggestedResponse: "Hello Vikramaditya, thank you for your query. We have 2 immaculate 3.5 BHK options on Golf Course Ext Road with ready OC and park facing balconies within your ₹3.5 Cr range. Since your loan is pre-sanctioned, we can lock a site tour this Saturday at 11 AM. Shall I reserve a slot for your family?",
        budgetFit: signals.budgetFit,
        budgetReason: "₹3.5 Cr budget is healthy and well-aligned with premium Golf Course Ext developments.",
        timelineUrgency: signals.timelineUrgency,
        timelineReason: "Pre-sanctioned bank loan and intent to close within 20 days indicates top urgency.",
        intentClarity: signals.intentClarity,
        intentReason: "Specified exact configuration (3.5 BHK), preferred views, floor height, and parking.",
        engagement: signals.engagement,
        engagementReason: "Proactive, shared financing status, and proposed weekend meeting time.",
        createdAt: daysAgo(0.5),
      },
    };
  })(),

  // 2. HOT LEAD - Bengaluru NRI Tech Leader (Whitefield Penthouse)
  (() => {
    const leadId = "lead_demo_02";
    const signals = { budgetFit: 10, timelineUrgency: 8, intentClarity: 9, engagement: 9 };
    const { score, tag } = calculateLeadScore(signals);
    return {
      lead: {
        id: leadId,
        name: "Arun & Sneha Krishnan",
        phone: "+919845012345",
        location: "Bengaluru, Whitefield / Hope Farm",
        propertyRequirement: "4 BHK Penthouse or Gated Villa",
        budget: "₹4.5 Cr - ₹5.2 Cr",
        buyingTimeline: "Within 30-45 days",
        customerMessage: "Relocating from Singapore to Bengaluru for leadership role at a tech MNC near ITPL. Need a 4 BHK penthouse or standalone gated community villa with private terrace and EV charger provision. We are in Bengaluru from Oct 5th to Oct 12th specifically to finalize and make the booking advance.",
        score,
        tag,
        status: "NEW",
        lastActivityAt: daysAgo(0.4),
        createdAt: daysAgo(1),
        updatedAt: daysAgo(0.4),
      },
      analysis: {
        id: "ana_demo_02",
        leadId,
        summary: "Singapore expat leadership couple finalizing a luxury 4 BHK villa/penthouse during October visit.",
        intent: "Primary end-use relocation from Singapore",
        keyRequirements: [
          "4 BHK Penthouse or Gated Villa in Whitefield/Hope Farm",
          "Private terrace garden and EV charging infrastructure",
          "Gated security with international standard clubhouse",
          "Close proximity to ITPL / tech corridors",
        ],
        objections: [
          "Concerned about Whitefield peak-hour traffic bottlenecks",
          "Requires power backup and Cauvery water connection guarantee",
        ],
        recommendedNextAction: "Share customized video walkthroughs on WhatsApp and block Oct 6th full-day chauffeur itinerary.",
        suggestedResponse: "Namaskara Arun & Sneha, welcome back to Bengaluru. We have curated 3 elite gated villa and penthouse communities near ITPL with private terraces and dedicated EV bays. Would you like our Singapore NRI desk to share digital floor plans ahead of your arrival on Oct 5th?",
        budgetFit: signals.budgetFit,
        budgetReason: "₹4.5 - ₹5.2 Cr budget is more than sufficient for prime Whitefield luxury villa inventory.",
        timelineUrgency: signals.timelineUrgency,
        timelineReason: "Dedicated booking trip planned for first week of October with ready advance.",
        intentClarity: signals.intentClarity,
        intentReason: "Precise requirement for 4 BHK villa/penthouse with specific amenities.",
        engagement: signals.engagement,
        engagementReason: "Transparent communication of relocation timeline, budget, and booking intent.",
        createdAt: daysAgo(1),
      },
    };
  })(),

  // 3. HOT LEAD - Mumbai Powai Sea/Lake View (Urgent lease expiry)
  (() => {
    const leadId = "lead_demo_03";
    const signals = { budgetFit: 8, timelineUrgency: 9, intentClarity: 8, engagement: 8 };
    const { score, tag } = calculateLeadScore(signals);
    return {
      lead: {
        id: leadId,
        name: "Rohit Deshmukh",
        phone: "+919820334455",
        location: "Mumbai, Powai (Hiranandani Vicinity)",
        propertyRequirement: "2.5 BHK / 3 BHK Lake Facing",
        budget: "₹2.6 Cr - ₹2.9 Cr",
        buyingTimeline: "Immediate (Rental lease ends next month)",
        customerMessage: "Current rental agreement in Powai expires on the 31st of next month, landlord refusing extension. Want to purchase immediately in Powai or Kanjurmarg West. Ready possession only. Need 24-hr water and high floor. Down payment ready in liquid mutual funds.",
        score,
        tag,
        status: "CONTACTED",
        lastActivityAt: daysAgo(0.8),
        createdAt: daysAgo(1.2),
        updatedAt: daysAgo(0.8),
      },
      analysis: {
        id: "ana_demo_03",
        leadId,
        summary: "Powai resident forced by rental lease expiry to purchase ready 2.5/3 BHK with liquid funds.",
        intent: "End-use purchase with non-negotiable move-in deadline",
        keyRequirements: [
          "2.5 BHK or 3 BHK in Powai or Kanjurmarg West",
          "Ready-to-move only (Occupancy Certificate compulsory)",
          "High floor lake/greenery view",
          "Liquid down payment readily available",
        ],
        objections: [
          "Zero tolerance for construction delays",
          "Slight price resistance if total all-inclusive exceeds ₹2.9 Cr with stamp duty",
        ],
        recommendedNextAction: "Arrange urgent evening walk-through of ready-to-move inventory in Hiranandani/Runwal.",
        suggestedResponse: "Hi Rohit, completely understand the lease deadline urgency. We have 2 ready-to-move OC-received apartments in Powai and Kanjurmarg West with lake views that fall right inside your ₹2.85 Cr all-inclusive budget. Can we show you the first unit tomorrow at 6:30 PM after office?",
        budgetFit: signals.budgetFit,
        budgetReason: "₹2.6-2.9 Cr is realistic for ready 2.5 BHK units in Powai/Kanjurmarg.",
        timelineUrgency: signals.timelineUrgency,
        timelineReason: "Rental lease ending next month creates non-negotiable purchase trigger.",
        intentClarity: signals.intentClarity,
        intentReason: "Clear on location, configuration, readiness, and funding source.",
        engagement: signals.engagement,
        engagementReason: "Clearly articulated the pain point, timeline, and financing.",
        createdAt: daysAgo(1.2),
      },
    };
  })(),

  // 4. WARM LEAD - Hinglish High Intent Inquiry (Gurugram Sohna Rd)
  (() => {
    const leadId = "lead_demo_04";
    const signals = { budgetFit: 7, timelineUrgency: 6, intentClarity: 7, engagement: 7 };
    const { score, tag } = calculateLeadScore(signals);
    return {
      lead: {
        id: leadId,
        name: "Pradeep Yadav",
        phone: "+919910887766",
        location: "Gurugram, Sohna Road / SPR",
        propertyRequirement: "3 BHK Gated Society",
        budget: "₹1.7 Cr - ₹1.9 Cr",
        buyingTimeline: "Within 2 to 3 months",
        customerMessage: "Bhai 3BHK chahiye near Golf Course Ext or Sohna Road. Family shift karni hai. Budget maximum 1.85 Cr tak stretch kar sakte hain agar project acha ho aur builder reputed ho. Possession 6 months ke andar mil sakti hai kya? Direct call mat karna office me hota hu, WhatsApp par details bhej do pehle.",
        score,
        tag,
        status: "NEW",
        lastActivityAt: daysAgo(0.1),
        createdAt: daysAgo(0.6),
        updatedAt: daysAgo(0.1),
      },
      analysis: {
        id: "ana_demo_04",
        leadId,
        summary: "Family looking for 3 BHK near Sohna Rd/SPR with stretchable ₹1.85 Cr budget, prefers WhatsApp.",
        intent: "Family end-use relocation within 3 months",
        keyRequirements: [
          "3 BHK in reputed gated society on Sohna Road or SPR",
          "Near-term possession (within 6 months)",
          "Budget stretchable up to ₹1.85 Cr",
          "WhatsApp communication preferred over direct calling",
        ],
        objections: [
          "Skeptical about unknown builders and delayed possession promises",
          "Budget of ₹1.85 Cr might be tight for core Golf Course Ext, better suited for SPR/Sohna Rd",
        ],
        recommendedNextAction: "Send curated PDF comparisons on WhatsApp with payment plans for Signature Global / Bestech.",
        suggestedResponse: "Pradeep ji namaskar! Aapke budget (₹1.8-1.85 Cr) me Sohna Road aur Southern Peripheral Road (SPR) par 2 top A-grade builders ke ready-within-6-months 3 BHK options available hain. Maine WhatsApp par brochure aur actual sample flat video share kiya hai. Dekh kar batayein kab convenient hoga discuss karna.",
        budgetFit: signals.budgetFit,
        budgetReason: "₹1.85 Cr is tight for Golf Course Ext, but very solid for premium SPR/Sohna Rd projects.",
        timelineUrgency: signals.timelineUrgency,
        timelineReason: "2-3 months timeline with genuine relocation requirement.",
        intentClarity: signals.intentClarity,
        intentReason: "Clear 3 BHK requirement and specified preferred corridor.",
        engagement: signals.engagement,
        engagementReason: "Expressed budget flexibility and clear communication channel preference.",
        createdAt: daysAgo(0.6),
      },
    };
  })(),

  // 5. WARM LEAD - FOLLOW UP DUE (>2 days inactive) - Bengaluru Sarjapur
  (() => {
    const leadId = "lead_demo_05";
    const signals = { budgetFit: 6, timelineUrgency: 6, intentClarity: 7, engagement: 6 };
    const { score, tag } = calculateLeadScore(signals);
    return {
      lead: {
        id: leadId,
        name: "Deepak & Priya Nambiar",
        phone: "+919740112233",
        location: "Bengaluru, Sarjapur Road",
        propertyRequirement: "3 BHK High Rise",
        budget: "₹1.4 Cr - ₹1.6 Cr",
        buyingTimeline: "1 to 2 months",
        customerMessage: "Both working in Bellandur tech parks. Need 3 BHK within 5 km of Sarjapur Wipro campus. Good school bus connectivity required for kids. Have visited Prestige and Godrej earlier but felt sizes were small. Need genuine 1400+ sq ft carpet.",
        score,
        tag,
        status: "NEW",
        lastActivityAt: daysAgo(2.6), // 2.6 days ago triggers "Follow up due" flag!
        createdAt: daysAgo(3.0),
        updatedAt: daysAgo(2.6),
      },
      analysis: {
        id: "ana_demo_05",
        leadId,
        summary: "Tech couple on Sarjapur Road wanting 1400+ sq ft carpet 3 BHK near schools; inactive for 2+ days.",
        intent: "End-use family home near work and school",
        keyRequirements: [
          "3 BHK with 1400+ sq ft genuine carpet area",
          "Sarjapur Road within 5km of Wipro SEZ",
          "School bus transit access for children",
          "Budget ₹1.4 - ₹1.6 Cr",
        ],
        objections: [
          "Disappointed by compact room dimensions in newly launched tier-1 projects",
          "Price per sqft carpet appreciation concerns",
        ],
        recommendedNextAction: "Follow up immediately: inactivity exceeds 48 hours. Pitch larger carpet resale/nearing-completion inventory.",
        suggestedResponse: "Hello Deepak & Priya, following up on your search near Sarjapur Wipro campus. We noticed your focus on spacious rooms—we have a rare 1,460 sq ft carpet 3 BHK with large bedrooms in a gated community that fits within ₹1.58 Cr. Would you like to review the floor layout?",
        budgetFit: signals.budgetFit,
        budgetReason: "1400 sqft carpet at ₹1.5 Cr is challenging in core Sarjapur; requires targeted secondary inventory.",
        timelineUrgency: signals.timelineUrgency,
        timelineReason: "1 to 2 months timeline, actively scouting competitors.",
        intentClarity: signals.intentClarity,
        intentReason: "Very specific carpet area (1400+ sqft) and location anchor (Wipro).",
        engagement: signals.engagement,
        engagementReason: "Shared feedback on previous builder visits, but has gone quiet for 2+ days.",
        createdAt: daysAgo(3.0),
      },
    };
  })(),

  // 6. WARM LEAD - Hyderabad HITEC City IT Couple
  (() => {
    const leadId = "lead_demo_06";
    const signals = { budgetFit: 7, timelineUrgency: 5, intentClarity: 7, engagement: 6 };
    const { score, tag } = calculateLeadScore(signals);
    return {
      lead: {
        id: leadId,
        name: "Kavitha Reddy",
        phone: "+919849112244",
        location: "Hyderabad, Gachibowli / Financial District",
        propertyRequirement: "3 BHK Gated Community",
        budget: "₹1.8 Cr - ₹2.1 Cr",
        buyingTimeline: "3 to 4 months",
        customerMessage: "Looking for an investment-cum-future living 3 BHK in Financial District or Kokapet. High rental yield is important since we might lease it out for the first 2 years. Want reputed builder like My Home, Rajapushpa or Aparna.",
        score,
        tag,
        status: "NEW",
        lastActivityAt: daysAgo(0.5),
        createdAt: daysAgo(1.5),
        updatedAt: daysAgo(0.5),
      },
      analysis: {
        id: "ana_demo_06",
        leadId,
        summary: "IT investor looking for high rental yield 3 BHK in Kokapet/Financial District with tier-1 builder.",
        intent: "Hybrid: 2-year rental yield followed by personal end-use",
        keyRequirements: [
          "3 BHK in Kokapet / Financial District",
          "Top tier developer (My Home / Rajapushpa / Aparna)",
          "Projected rental yield 3.5%+ with IT tenant demand",
          "Budget ₹1.8 Cr - ₹2.1 Cr",
        ],
        objections: [
          "Current high capital values in Kokapet squeezing rental yields",
          "High maintenance charges impacting net returns",
        ],
        recommendedNextAction: "Send Kokapet rental yield case studies and schedule a 10-minute briefing on upcoming pre-launch phases.",
        suggestedResponse: "Hello Kavitha, great choice targeting Financial District & Kokapet. Average 3 BHK rentals currently range from ₹65k-80k/month in tier-1 societies. We have two pre-launch inventory allocations with Aparna & Rajapushpa right inside your ₹1.95 Cr bracket. Would you like a financial yield breakdown?",
        budgetFit: signals.budgetFit,
        budgetReason: "₹2.0 Cr is reasonable for modern 3 BHK towers in Kokapet extension.",
        timelineUrgency: signals.timelineUrgency,
        timelineReason: "3 to 4 months timeline gives flexibility for investment evaluation.",
        intentClarity: signals.intentClarity,
        intentReason: "Clear builder preferences and financial yield goals.",
        engagement: signals.engagement,
        engagementReason: "Clearly specified target societies and investment criteria.",
        createdAt: daysAgo(1.5),
      },
    };
  })(),

  // 7. WARM LEAD - Pune Baner First-time Buyer
  (() => {
    const leadId = "lead_demo_07";
    const signals = { budgetFit: 6, timelineUrgency: 5, intentClarity: 6, engagement: 5 };
    const { score, tag } = calculateLeadScore(signals);
    return {
      lead: {
        id: leadId,
        name: "Abhishek Kulkarni",
        phone: "+919860445566",
        location: "Pune, Baner / Balewadi",
        propertyRequirement: "2 BHK Smart Apartment",
        budget: "₹85 Lakhs - ₹95 Lakhs",
        buyingTimeline: "2 to 3 months",
        customerMessage: "First time buying an apartment. Working in Hinjewadi Phase 1. Need 2 BHK in Baner or Balewadi with easy highway access. Clean amenities, clubhouse, gym. What is the typical down payment and stamp duty extra in Pune?",
        score,
        tag,
        status: "NEW",
        lastActivityAt: daysAgo(1.0),
        createdAt: daysAgo(2.0),
        updatedAt: daysAgo(1.0),
      },
      analysis: {
        id: "ana_demo_07",
        leadId,
        summary: "First-time tech buyer seeking 2 BHK in Baner/Balewadi under ₹95L with guidance on taxes.",
        intent: "First-time home buyer end-use",
        keyRequirements: [
          "2 BHK in Baner or Balewadi with highway connectivity to Hinjewadi",
          "Under ₹95 Lakhs all-inclusive",
          "Basic modern amenities (clubhouse, gym, power backup)",
          "Requires cost sheet breakdown (stamp duty, registration, GST)",
        ],
        objections: [
          "Apprehensive about hidden charges and extra society corpus funds",
          "Wants guidance on home loan eligibility and tax benefits",
        ],
        recommendedNextAction: "Send a transparent all-inclusive cost calculator and invite for a 1-on-1 consultation.",
        suggestedResponse: "Hello Abhishek, congratulations on taking the first step towards your first home! For Baner/Balewadi, ₹90 Lakhs gives you great options with 20-min commute to Hinjewadi. In Maharashtra, stamp duty is 7% and registration is ₹30,000. I have prepared a transparent all-in cost sheet for you. Can I send it on WhatsApp?",
        budgetFit: signals.budgetFit,
        budgetReason: "₹85-95L is feasible for compact 2 BHK in Balewadi / Baner Annexe.",
        timelineUrgency: signals.timelineUrgency,
        timelineReason: "2 to 3 months allows time for loan sanction and evaluation.",
        intentClarity: signals.intentClarity,
        intentReason: "Identified location and 2 BHK configuration clearly.",
        engagement: signals.engagement,
        engagementReason: "Asked sensible questions about purchase mechanics.",
        createdAt: daysAgo(2.0),
      },
    };
  })(),

  // 8. COLD LEAD - FOLLOW UP DUE (>2 days inactive) - Speculative low intent
  (() => {
    const leadId = "lead_demo_08";
    const signals = { budgetFit: 3, timelineUrgency: 2, intentClarity: 3, engagement: 2 };
    const { score, tag } = calculateLeadScore(signals);
    return {
      lead: {
        id: leadId,
        name: "Rameshwar Prasad",
        phone: "+919876543210",
        location: "Mumbai, Thane / Dombivli",
        propertyRequirement: "Flat or Plot",
        budget: "₹30 Lakhs - ₹40 Lakhs",
        buyingTimeline: "Just looking / Sometime next year",
        customerMessage: "Send whatever is cheapest in Mumbai or Thane. Flat or commercial or plot chalega. Just browsing for now. Send brochures on email.",
        score,
        tag,
        status: "NEW",
        lastActivityAt: daysAgo(2.8), // >2 days inactive
        createdAt: daysAgo(3.5),
        updatedAt: daysAgo(2.8),
      },
      analysis: {
        id: "ana_demo_08",
        leadId,
        summary: "Vague, low-intent inquiry seeking unrealistically cheap Mumbai properties with no firm timeline.",
        intent: "Casual speculative exploration",
        keyRequirements: [
          "Unspecified configuration (flat/plot/commercial)",
          "Extreme low budget (₹30-40 Lakhs)",
          "Thane or Dombivli perimeter",
        ],
        objections: [
          "Extremely unrealistic price expectation for Mumbai/Thane core",
          "No financing or immediate intent to purchase",
        ],
        recommendedNextAction: "Automate email brochure for Kalyan/Dombivli affordable housing; low sales priority.",
        suggestedResponse: "Hello Rameshwar ji, thank you for reaching out. In the ₹30-40 Lakhs range, options in Mumbai/Thane are concentrated in outer MMR areas like Kalyan-Dombivli or Badlapur. We have emailed you a starter catalog of RERA-registered projects there.",
        budgetFit: signals.budgetFit,
        budgetReason: "₹30-40L budget is disconnected from Thane city flat prices; requires outer periphery.",
        timelineUrgency: signals.timelineUrgency,
        timelineReason: "Stated 'just browsing / sometime next year', zero immediate urgency.",
        intentClarity: signals.intentClarity,
        intentReason: "Extremely vague ('flat or plot or commercial chalega').",
        engagement: signals.engagement,
        engagementReason: "One-sentence low-effort submission.",
        createdAt: daysAgo(3.5),
      },
    };
  })(),

  // 9. COLD LEAD - Unrealistic Commercial Budget (Noida Expressway)
  (() => {
    const leadId = "lead_demo_09";
    const signals = { budgetFit: 2, timelineUrgency: 3, intentClarity: 4, engagement: 3 };
    const { score, tag } = calculateLeadScore(signals);
    return {
      lead: {
        id: leadId,
        name: "Sanjay Gujral",
        phone: "+919818998877",
        location: "Noida, Sector 132 / Expressway",
        propertyRequirement: "High Street Retail Shop",
        budget: "₹40 Lakhs - ₹50 Lakhs",
        buyingTimeline: "Exploring 6+ months",
        customerMessage: "Want ground floor lockable retail shop with 12% guaranteed lease rental return on Noida Expressway. Budget strictly 45L. Only call if guaranteed 12% return is on agreement.",
        score,
        tag,
        status: "NEW",
        lastActivityAt: daysAgo(1.4),
        createdAt: daysAgo(2.1),
        updatedAt: daysAgo(1.4),
      },
      analysis: {
        id: "ana_demo_09",
        leadId,
        summary: "Seeking ground floor retail on Noida Expressway with unrealistic 12% guaranteed return under 50L.",
        intent: "High-yield commercial speculation",
        keyRequirements: [
          "Ground floor retail shop on Expressway",
          "Sub-₹50L budget constraint",
          "12% assured return expectation",
        ],
        objections: [
          "12% assured return is not RERA compliant or standard in institutional commercial assets",
          "Ground floor Expressway retail commands ₹1.5 Cr+ minimum",
        ],
        recommendedNextAction: "Politely educate via message regarding realistic commercial yields (6-8%) and ticket sizes.",
        suggestedResponse: "Hello Sanjay, thank you for writing in. For Noida Expressway ground-floor commercial, entry tickets typically begin around ₹1.2 Cr, with compliant pre-leased yields averaging 6.5% to 7.5%. Would you be open to exploring virtual food court spaces in Sector 140A that fit your ₹45L bracket?",
        budgetFit: signals.budgetFit,
        budgetReason: "₹45L cannot buy ground-floor retail on Noida Expressway.",
        timelineUrgency: signals.timelineUrgency,
        timelineReason: "6+ months exploration timeline with rigid conditions.",
        intentClarity: signals.intentClarity,
        intentReason: "Clear on location, but expectations violate market realities.",
        engagement: signals.engagement,
        engagementReason: "Short message with unrealistic contractual demands.",
        createdAt: daysAgo(2.1),
      },
    };
  })(),
];
