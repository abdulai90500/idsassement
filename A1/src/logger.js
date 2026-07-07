import { createWriteStream, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOG_DIR = join(__dirname, '..', 'logs')
const LOG_FILE = join(LOG_DIR, 'ai_calls.jsonl')

// Ensure logs directory exists
mkdirSync(LOG_DIR, { recursive: true })

const logStream = createWriteStream(LOG_FILE, { flags: 'a' })

/**
 * Responsible-AI provenance logger.
 *
 * Every call to the OpenAI API must be logged here so that:
 *   1. The exact model, version, and prompt used can be audited
 *   2. We can reproduce any decision given the same inputs
 *   3. We can detect drift in model behaviour over time
 *
 * Each log entry is a single JSON line (JSONL format) appended to logs/ai_calls.jsonl.
 *
 * @param {Object} entry
 * @param {string}  entry.model         - Full model name e.g. "gpt-4o-mini"
 * @param {string}  entry.modelVersion  - API-reported model version if available
 * @param {string}  entry.prompt        - The exact prompt sent (system + user)
 * @param {string}  entry.rawResponse   - The raw text response from the model
 * @param {string}  entry.verdict       - Parsed verdict: include | exclude | uncertain
 * @param {string}  entry.reason        - One-sentence reason
 * @param {number}  entry.latencyMs     - Request round-trip time in milliseconds
 * @param {boolean} entry.isMock        - True when running in mock mode
 * @param {string}  [entry.abstractId]  - Optional ID of the abstract being screened
 * @param {string}  [entry.error]       - Error message if the call failed
 */
export function logAICall(entry) {
  const record = {
    timestamp: new Date().toISOString(),
    ...entry,
  }
  logStream.write(JSON.stringify(record) + '\n')
  return record
}
