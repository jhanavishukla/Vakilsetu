// ==================== AI CASE ANALYZER CONTROLLER ====================
// Security: API key lives only here. Never sent to client. Never logged.

const CASE_PROFILES = [
  {
    filterTag: 'tenancy',
    category: 'Tenancy & Real Estate',
    title: 'Tenancy, Deposit or Housing Dispute',
    viability: 82,
    actionability: 'Strong',
    claimValue: '₹15,000 – ₹50,000',
    filingCosts: '₹450 – ₹900 (Rent Controller)',
    narrative: 'Under the Rent Control Act, a landlord cannot withhold security deposit without a written, itemized breakdown within 21–30 days. Deductions for normal wear-and-tear are legally invalid. Illegal lockouts without a court order are a criminal offence (IPC §448).',
    steps: [
      'Send a Tenant Demand Letter via registered post citing the specific clause breached.',
      'Compile move-in/move-out photographs, WhatsApp threads, and rent receipts.',
      'File a complaint with the local Rent Controller or Civil Court if no response within 15 days.',
      'Consider filing an FIR under IPC §448 if locks were changed without a court order.',
      'Connect with a Tenancy Law advocate to send a formal legal notice (₹500–₹1,500).'
    ]
  },
  {
    filterTag: 'employment',
    category: 'Employment & Labor Law',
    title: 'Unpaid Wages, Freelance Invoice or Wrongful Termination',
    viability: 78,
    actionability: 'Strong',
    claimValue: '₹20,000 – ₹1,50,000',
    filingCosts: '₹0 – ₹600 (Labour Commissioner is free)',
    narrative: 'Freelance agreements and employment contracts are legally enforceable. Withholding payment after services rendered is breach of contract (ICA §73). File at MSME Samadhaan or the Labour Commissioner at zero cost.',
    steps: [
      'Send a formal "Letter of Intent to Sue" giving 7 business days to settle.',
      'Export your signed contract, approval emails, and submitted invoices.',
      'File on MSME Samadhaan portal if the debtor is a registered MSME.',
      'File a wage claim with the Labour Commissioner (no fee required).',
      'If above ₹50,000, file a summary suit under Order 37 CPC in Civil Court.'
    ]
  },
  {
    filterTag: 'consumer',
    category: 'Consumer Protection',
    title: 'Consumer Fraud, Product Defect or Service Deficiency',
    viability: 70,
    actionability: 'Moderate–Strong',
    claimValue: '₹10,000 – ₹2,00,000',
    filingCosts: '₹200 – ₹1,000 (Consumer Forum)',
    narrative: 'The Consumer Protection Act 2019 allows online complaints at edaakhil.nic.in for free (up to ₹5 lakh). You are entitled to replacement/refund AND compensation for mental agony.',
    steps: [
      'File a complaint on the National Consumer Helpline (NCH): 1800-11-4000.',
      'File online at edaakhil.nic.in (District Commission handles up to ₹50 lakh).',
      'Preserve screenshots, delivery confirmations, chat logs, and original invoice.',
      'Send a formal Notice to the company\'s Grievance Officer.',
      'For vehicle defects, get an independent inspection report from an authorized service centre.'
    ]
  },
  {
    filterTag: 'family',
    category: 'Family Law & Matrimonial',
    title: 'Matrimonial Dispute, Divorce or Domestic Violence',
    viability: 72,
    actionability: 'Moderate',
    claimValue: 'Maintenance + Alimony (Case Specific)',
    filingCosts: '₹500 – ₹2,500 (Family Court)',
    narrative: 'Family courts handle divorce, custody, and DV cases. The DV Act 2005 provides fast-track Protection Orders. Dowry harassment is a cognizable offence under IPC §498A.',
    steps: [
      'If in immediate danger, call 100 (Police) or 181 (Women Helpline).',
      'File a DV Act complaint with the Protection Officer at your local District Court.',
      'For divorce, petition in the Family Court where you last resided together.',
      'Preserve all communications, medical reports, and witness contacts.',
      'For child custody, document your parenting routine and capacity.'
    ]
  },
  {
    filterTag: 'criminal',
    category: 'Criminal Law',
    title: 'Criminal Complaint, FIR or Defence',
    viability: 68,
    actionability: 'Urgent – Act Immediately',
    claimValue: 'Criminal Prosecution (No monetary claim)',
    filingCosts: '₹0 (FIR) – ₹5,000+ (Legal Defence)',
    narrative: 'Filing an FIR is your constitutional right (Section 154 CrPC). Police cannot refuse for cognizable offences. If refused, escalate to SP or file directly at the Judicial Magistrate.',
    steps: [
      'File an FIR at the nearest police station — get the FIR number and a free copy.',
      'If police refuse: file a complaint to the SP or at the Judicial Magistrate directly.',
      'Preserve CCTV footage, witness contacts, and all digital evidence.',
      'If arrested: you have the right to inform one person and consult a lawyer before interrogation.',
      'Engage a criminal defence lawyer immediately; approach Legal Aid if needed (free under Sec 12 LSAA).'
    ]
  },
  {
    filterTag: 'contract',
    category: 'Contract & Civil Dispute',
    title: 'Breach of Contract or Money Recovery',
    viability: 68,
    actionability: 'Moderate',
    claimValue: '₹10,000 – ₹5,00,000',
    filingCosts: '₹500 – ₹2,000 (Civil Court)',
    narrative: 'Any oral or written agreement is a contract under the Indian Contract Act 1872. For money recovery, a summary suit under Order 37 CPC is the fastest option. Cheque bounce under Sec 138 NI Act is a criminal matter.',
    steps: [
      'Send a formal Legal Notice via an advocate (₹500–₹1,000) — often resolves without court.',
      'For bounced cheques: file under Sec 138 NI Act within 30 days of dishonour memo.',
      'Collect all evidence: contracts, WhatsApp chats, bank transfer records, witnesses.',
      'File a recovery suit in Civil Court of appropriate jurisdiction.',
      'Consider Lok Adalat for quick settlement — decree is appeal-proof.'
    ]
  }
];

const SYSTEM_PROMPT = `You are a legal intake assistant for VakilSetu, an Indian legal-tech platform.
The user has described a legal problem. Your task is to analyze it and return ONLY a valid JSON object (no markdown, no explanation, no preamble).

Use these exact case categories and their filterTags:
- Tenancy & Real Estate (filterTag: "tenancy")
- Employment & Labor Law (filterTag: "employment")
- Consumer Protection (filterTag: "consumer")
- Family Law & Matrimonial (filterTag: "family")
- Criminal Law (filterTag: "criminal")
- Property & Real Estate Law (filterTag: "contract")
- Cyber Crime & Digital Fraud (filterTag: "consumer")
- Contract & Civil Dispute (filterTag: "contract")

If city is provided, tailor your advocate-matching note to mention local courts in that city.
If budget is provided ("Budget-friendly", "Mid-range", "Premium", "No constraint"), tailor the package recommendation accordingly.

If the user input is in any local language (such as Hindi, Marathi, etc.), translate and write the noticeBodyText in formal legal English.

Return this EXACT JSON structure:
{
  "practiceArea": "<exact category name from above>",
  "title": "<specific case title in 5-8 words>",
  "filterTag": "<exact filterTag from list above>",
  "viabilityScore": <integer 0-100>,
  "actionability": "<one of: Strong | Moderate | Moderate–Strong | Urgent – Act Immediately>",
  "claimValue": "<Indian Rupee estimate or 'Case Specific'>",
  "estimatedCosts": "<cost range + forum name>",
  "narrative": "<2-3 sentence legal assessment, citing relevant Indian law sections>",
  "actionPlan": ["<step 1>", "<step 2>", "<step 3>", "<step 4>", "<step 5>"],
  "matchNote": "<1 sentence on why an advocate from the platform matches this case, mentioning city if provided>",
  "legalNotice": {
    "noticeTitle": "<Formal Title of the Legal Demand Letter, e.g. LEGAL NOTICE FOR RECOVERY OF SECURITY DEPOSIT>",
    "claimantNamePlaceholder": "[Claimant Name / E.g., John Doe]",
    "recipientNamePlaceholder": "[Recipient Name / E.g., Landlord / Company Name]",
    "disputeSummary": "<A concise, 2-3 sentence summary of the dispute facts>",
    "demandedAmount": "<The exact amount being demanded, e.g., ₹15,000>",
    "legalGrounds": "<The relevant Indian laws/sections violated, e.g. Section 108 of the Transfer of Property Act>",
    "remedyDeadlineDays": <integer, number of days given to remedy the breach, e.g., 15>,
    "noticeBodyText": "<A formal legal demand letter body text, in English. It must be addressed to the recipient, describe the breach/default, cite the legal grounds and sections, state the demanded amount/action, give the recipient the specified number of days (remedyDeadlineDays) to settle, and state that legal action will follow if unresolved. Keep the tone professional, firm, and formal.>"
  }
}`;

function stripHtmlTags(str) {
  return str.replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
}

function validateField(value, fieldName, maxLen = 100) {
  if (value === undefined || value === null) return null; // Optional fields default to null
  if (typeof value !== 'string') throw new Error(`${fieldName} must be a string`);
  if (value.length > maxLen) throw new Error(`${fieldName} exceeds ${maxLen} character limit`);
  return value;
}

export async function analyzeCase(req, res) {
  // Method guard
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS: only own origin in production
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;
  if (isProd && allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // FALLBACK MOCK RESPONSE FOR DEMO PURPOSES
    console.warn("ANTHROPIC_API_KEY is missing. Returning mock demo response.");
    return res.status(200).json({
      practiceArea: "Tenancy & Real Estate",
      title: "Tenant Security Deposit Dispute",
      filterTag: "tenancy",
      viabilityScore: 85,
      actionability: "Strong",
      claimValue: "₹25,000",
      estimatedCosts: "₹500 - ₹2,000 (Small Causes Court)",
      narrative: "Based on the provided details, this falls under tenancy dispute laws. Withholding a deposit for pre-existing damages is generally considered an unlawful deduction if documented properly in a move-in inspection. Section 108 of the Transfer of Property Act protects tenants from arbitrary deductions.",
      actionPlan: [
        "Send a formal written demand letter to the landlord",
        "Compile move-in inspection photos and lease agreement",
        "If unresolved, file a petition with the Rent Control Court"
      ],
      matchNote: "We have found specialized tenancy advocates who frequently handle security deposit claims in your local courts.",
      legalNotice: {
        noticeTitle: "LEGAL NOTICE FOR RECOVERY OF SECURITY DEPOSIT",
        claimantNamePlaceholder: "[Your Name]",
        recipientNamePlaceholder: "[Landlord's Name]",
        disputeSummary: "Unlawful withholding of security deposit of ₹25,000 after lease expiration and inspection clearance.",
        demandedAmount: "₹25,000",
        legalGrounds: "Section 108 of the Transfer of Property Act, 1882",
        remedyDeadlineDays: 15,
        noticeBodyText: "Dear Sir/Madam,\n\nUnder instructions from my client, we hereby call upon you to return the security deposit amount of ₹25,000 withheld unlawfully. Under Section 108 of the Transfer of Property Act, you are obligated to return the deposit upon vacant possession, deducting only valid, agreed-upon repair costs. Please take notice that you are required to pay the said sum within 15 days of this notice, failing which we shall proceed with appropriate litigation in the Small Causes Court."
      }
    });
  }

  try {
    // ── INPUT VALIDATION ──────────────────────────────────────────────────
    const { caseText, budget, urgency, city } = req.body;

    if (!caseText || typeof caseText !== 'string' || caseText.trim().length === 0) {
      return res.status(400).json({ error: 'Case description is required.' });
    }
    if (caseText.length > 2000) {
      return res.status(400).json({ error: 'Case description must be under 2000 characters.' });
    }

    let sanitizedBudget, sanitizedCity, sanitizedUrgency;
    try {
      sanitizedBudget = validateField(budget, 'budget');
      sanitizedCity = validateField(city, 'city');
      sanitizedUrgency = validateField(urgency, 'urgency');
    } catch (validationErr) {
      return res.status(400).json({ error: validationErr.message });
    }

    // Sanitize: strip HTML/script tags from caseText
    const sanitizedText = stripHtmlTags(caseText.trim());

    // Log ONLY char count — never the content itself
    const charCount = sanitizedText.length;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[analyze-case] Request received. caseText chars: ${charCount}, city: ${sanitizedCity ? '(set)' : '(none)'}, budget: ${sanitizedBudget || '(none)'}`);
    }

    // ── BUILD USER MESSAGE ────────────────────────────────────────────────
    let userMessage = `Case Description: ${sanitizedText}`;
    if (sanitizedCity) userMessage += `\nCity: ${sanitizedCity}`;
    if (sanitizedBudget) userMessage += `\nBudget Preference: ${sanitizedBudget}`;

    // ── CALL ANTHROPIC ────────────────────────────────────────────────────
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (!anthropicRes.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[analyze-case] Anthropic API error: ${anthropicRes.status}`);
      }
      return res.status(200).json(getKeywordFallback(sanitizedText, sanitizedCity, sanitizedBudget));
    }

    const anthropicData = await anthropicRes.json();
    const rawText = anthropicData?.content?.[0]?.text || '';

    // Parse JSON
    let parsed;
    try {
      const jsonStr = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch (_parseErr) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[analyze-case] Failed to parse Anthropic response as JSON.');
      }
      return res.status(200).json(getKeywordFallback(sanitizedText, sanitizedCity, sanitizedBudget));
    }

    // Validate parsed has the required keys before sending to client
    try {
      const required = ['practiceArea', 'title', 'filterTag', 'viabilityScore', 'actionability', 'claimValue', 'estimatedCosts', 'narrative', 'actionPlan', 'legalNotice'];
      for (const key of required) {
        if (!(key in parsed)) {
          throw new Error(`Missing key: ${key}`);
        }
      }
      const noticeRequired = ['noticeTitle', 'claimantNamePlaceholder', 'recipientNamePlaceholder', 'disputeSummary', 'demandedAmount', 'legalGrounds', 'remedyDeadlineDays', 'noticeBodyText'];
      for (const key of noticeRequired) {
        if (!(key in parsed.legalNotice)) {
          throw new Error(`Missing legalNotice sub-key: ${key}`);
        }
      }
    } catch (validationErr) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[analyze-case] Validation error:', validationErr.message);
      }
      return res.status(200).json(getKeywordFallback(sanitizedText, sanitizedCity, sanitizedBudget));
    }

    return res.status(200).json(parsed);

  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[analyze-case] Unhandled error:', err.message);
    }
    return res.status(500).json({ error: 'An error occurred while analyzing your case. Please try again.' });
  }
}

// ── KEYWORD-BASED FALLBACK (used when Anthropic is unavailable) ────────────
function getKeywordFallback(text, city, budget) {
  const lower = text.toLowerCase();
  const hits = (keywords) => keywords.filter(k => lower.includes(k)).length;

  const scored = CASE_PROFILES.map(p => ({ ...p, score: hits(getKeywords(p.filterTag)) }));
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0].score > 0 ? scored[0] : CASE_PROFILES.find(p => p.filterTag === 'contract');

  let matchNote = `Our platform has pre-vetted advocates specializing in ${best.category}.`;
  if (city) matchNote = `We have advocates experienced in ${best.category} who can assist with proceedings in ${city}.`;
  if (budget === 'Budget-friendly') matchNote += ' Budget-friendly consultation packages available.';

  const legalNotice = {
    noticeTitle: `LEGAL NOTICE FOR DEMAND OF PAYMENT AND COMPLIANCE`,
    claimantNamePlaceholder: "[Claimant's Name]",
    recipientNamePlaceholder: best.filterTag === 'tenancy' ? "[Landlord's Name]" : "[Employer/Opposing Party's Name]",
    disputeSummary: `Unresolved dispute regarding ${best.title.toLowerCase()}.`,
    demandedAmount: best.filterTag === 'tenancy' ? "₹25,000" : (best.filterTag === 'employment' ? "₹50,000" : "Case Specific"),
    legalGrounds: best.filterTag === 'tenancy' ? "Section 108 of the Transfer of Property Act / Rent Control Act" : "Section 73 of the Indian Contract Act / Payment of Wages Act",
    remedyDeadlineDays: 15,
    noticeBodyText: `Dear Sir/Madam,\n\nUnder instructions from my client, we hereby call upon you to settle the outstanding dispute regarding ${best.title.toLowerCase()}. Despite multiple attempts, you have failed to resolve the matter. You are hereby demanded to pay the sum of money or perform the required obligations within 15 days of receipt of this notice, failing which we shall be constrained to initiate legal proceedings under the appropriate provisions of Indian law.`
  };

  return {
    viabilityScore: best.viability,
    practiceArea: best.category,
    estimatedCosts: best.filingCosts,
    actionPlan: best.steps,
    title: best.title,
    filterTag: best.filterTag,
    actionability: best.actionability,
    claimValue: best.claimValue,
    narrative: best.narrative,
    matchNote,
    legalNotice,
    source: 'fallback'
  };
}

function getKeywords(filterTag) {
  const map = {
    tenancy: ['landlord', 'tenant', 'deposit', 'rent', 'lease', 'eviction', 'flat', 'house', 'makan'],
    employment: ['wage', 'salary', 'freelance', 'invoice', 'unpaid', 'job', 'fired', 'employer', 'payment'],
    consumer: ['car', 'dealer', 'warranty', 'defective', 'refund', 'fraud', 'online', 'amazon', 'flipkart', 'cyber', 'upi', 'hack'],
    family: ['divorce', 'wife', 'husband', 'marriage', 'alimony', 'custody', 'domestic', 'dowry'],
    criminal: ['fir', 'police', 'theft', 'assault', 'fraud', 'bail', 'arrested', 'criminal'],
    contract: ['contract', 'agreement', 'breach', 'money', 'loan', 'property', 'land', 'builder', 'rera']
  };
  return map[filterTag] || [];
}
