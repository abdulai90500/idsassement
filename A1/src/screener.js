import OpenAI from 'openai'
import { z } from 'zod'
import { logAICall } from './logger.js'

// ── Config ─────────────────────────────────────────────────────────────────
const MODEL = 'gpt-4o-mini'
const MOCK_MODE = process.env.MOCK_MODE === 'true' || !process.env.OPENAI_API_KEY

let openai
if (!MOCK_MODE) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

// ── Response schema (Zod) ──────────────────────────────────────────────────
const ScreeningResponseSchema = z.object({
  verdict: z.enum(['include', 'exclude', 'uncertain']),
  reason:  z.string().min(10).max(500),
})

// ── Prompt builder ─────────────────────────────────────────────────────────
/**
 * Build the system + user prompt.
 * The criteria are embedded verbatim so the model cannot hallucinate
 * criteria that were not provided.
 */
function buildPrompt(abstract, criteria) {
  const inclusionList = criteria.inclusion
    .map((c, i) => `  ${i + 1}. ${c}`)
    .join('\n')

  const exclusionList = criteria.exclusion
    .map((c, i) => `  ${i + 1}. ${c}`)
    .join('\n')

  const systemPrompt = `You are a systematic review screening assistant.
Your task is to decide whether a research abstract should be included in a literature review,
based ONLY on the inclusion and exclusion criteria listed below.

IMPORTANT RULES:
- You MUST NOT reference or invent any criteria not listed below.
- If the abstract does not clearly satisfy any inclusion criterion, default to "exclude".
- If the abstract meets some inclusion criteria but you are genuinely uncertain, use "uncertain".
- Your reason must be a single sentence citing only the criteria provided.
- Respond with valid JSON only — no markdown, no prose outside the JSON.

=== INCLUSION CRITERIA ===
${inclusionList}

=== EXCLUSION CRITERIA ===
${exclusionList}

Respond in this exact JSON format:
{
  "verdict": "include" | "exclude" | "uncertain",
  "reason": "<one sentence citing the criteria above>"
}`

  const userPrompt = `Abstract to screen:\n\n${abstract}`

  return { systemPrompt, userPrompt }
}

// ── Mock response (for dev / no API key) ──────────────────────────────────
function getMockResponse(abstract) {
  const lower = abstract.toLowerCase()
  const healthTerms = [
    'trial', 'randomised', 'cohort', 'meta-analysis', 'systematic review',
    'rct', 'intervention', 'patients', 'clinical', 'treatment', 'therapy',
    'mortality', 'morbidity', 'disease', 'diagnosis', 'hospital',
  ]
  const offTopicTerms = [
    'stock', 'price', 'blockchain', 'supply chain', 'real estate',
    'semiconductor', 'gamification', 'minimum wage', 'social media',
    'political', 'urban green space',
  ]

  const hasHealth   = healthTerms.some(t => lower.includes(t))
  const isOffTopic  = offTopicTerms.some(t => lower.includes(t))

  if (isOffTopic) {
    return {
      verdict: 'exclude',
      reason:  'The abstract does not report a clinical health outcome and appears to address economics or technology, which is an exclusion criterion.',
    }
  }
  if (hasHealth) {
    return {
      verdict: 'include',
      reason:  'The abstract reports a clinical health intervention with defined outcomes in human participants, satisfying inclusion criteria 2 and 3.',
    }
  }
  return {
    verdict: 'uncertain',
    reason:  'The abstract has some health-related content but does not clearly meet inclusion criterion 3 (defined clinical outcome).',
  }
}

// ── Anti-hallucination validator ───────────────────────────────────────────
/**
 * After parsing the model's response, verify the reason only cites
 * concepts that exist in the criteria. This is a best-effort check.
 */
function validateReason(reason, criteria) {
  const allCriteriaText = [
    ...criteria.inclusion,
    ...criteria.exclusion,
  ].join(' ').toLowerCase()

  // Extract key words from the reason (ignore stop words)
  const stopWords = new Set(['a', 'an', 'the', 'is', 'are', 'and', 'or', 'of', 'to', 'in', 'for', 'with', 'this'])
  const reasonWords = reason.toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 4 && !stopWords.has(w))

  // If any meaningful word in the reason doesn't appear in criteria text,
  // flag but don't hard-fail (the model may paraphrase legitimately)
  const suspicious = reasonWords.filter(w => !allCriteriaText.includes(w))

  return {
    passed: suspicious.length < 5,
    suspiciousTerms: suspicious,
  }
}

// ── Main export ─────────────────────────────────────────────────────────────
/**
 * Screen a single abstract against a set of criteria using the OpenAI API.
 *
 * @param {string} abstract - The full text of the abstract to screen
 * @param {{ inclusion: string[], exclusion: string[] }} criteria
 * @param {string} [abstractId] - Optional identifier for logging
 * @returns {Promise<{ verdict: string, reason: string, log: Object, isMock: boolean }>}
 */
export async function screenAbstract(abstract, criteria, abstractId = null) {
  const { systemPrompt, userPrompt } = buildPrompt(abstract, criteria)
  const fullPrompt = `[SYSTEM]\n${systemPrompt}\n\n[USER]\n${userPrompt}`

  const startMs = Date.now()
  let rawResponse = ''
  let parsed = null
  let error = null

  if (MOCK_MODE) {
    // Simulate latency for realistic mock
    await new Promise(r => setTimeout(r, 200 + Math.random() * 400))
    parsed = getMockResponse(abstract)
    rawResponse = JSON.stringify(parsed)
  } else {
    try {
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        temperature: 0,       // Deterministic output for reproducibility
        max_tokens:  256,
        response_format: { type: 'json_object' },
      })

      rawResponse = response.choices[0].message.content
      parsed = ScreeningResponseSchema.parse(JSON.parse(rawResponse))
    } catch (err) {
      error = err.message
      // Fail safe: return uncertain rather than crashing
      parsed = {
        verdict: 'uncertain',
        reason:  'An error occurred during AI screening; manual review required.',
      }
    }
  }

  const latencyMs = Date.now() - startMs

  // Anti-hallucination check
  const validation = validateReason(parsed.reason, criteria)
  if (!validation.passed) {
    console.warn(
      `[WARN] Reason may reference non-criteria terms: ${validation.suspiciousTerms.join(', ')}`
    )
  }

  // Responsible-AI log
  const log = logAICall({
    abstractId,
    model:        MODEL,
    modelVersion: MOCK_MODE ? 'mock' : MODEL,
    prompt:       fullPrompt,
    rawResponse,
    verdict:      parsed.verdict,
    reason:       parsed.reason,
    latencyMs,
    isMock:       MOCK_MODE,
    validationPassed: validation.passed,
    ...(error ? { error } : {}),
  })

  return {
    verdict:  parsed.verdict,
    reason:   parsed.reason,
    isMock:   MOCK_MODE,
    log,
  }
}
