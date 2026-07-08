/**
 * A1 — Abstract Screening Assistant: CLI demo runner
 *
 * Reads mock abstracts and criteria, screens each abstract,
 * prints results to stdout, and writes every AI call to logs/ai_calls.jsonl.
 *
 * Usage:
 *   node src/index.js                 # screens all 20 abstracts
 *   node src/index.js --id abs-001    # screen a single abstract by ID
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { screenAbstract } from './screener.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadJSON(relPath) {
  return JSON.parse(readFileSync(join(__dirname, '..', relPath), 'utf8'))
}

const abstracts = loadJSON('data/abstracts.mock.json')
const criteria  = loadJSON('data/criteria.mock.json')

// ── Parse CLI args ─────────────────────────────────────────────────────────
const args        = process.argv.slice(2)
const idFlagIdx   = args.indexOf('--id')
const targetId    = idFlagIdx !== -1 ? args[idFlagIdx + 1] : null
const toScreen    = targetId
  ? abstracts.filter(a => a.id === targetId)
  : abstracts

if (toScreen.length === 0) {
  console.error(`No abstracts found${targetId ? ` with id "${targetId}"` : ''}.`)
  process.exit(1)
}

// ── Colour helpers (no deps) ───────────────────────────────────────────────
const clr = {
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  dim:    (s) => `\x1b[2m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
}

function verdictColour(v) {
  if (v === 'include')  return clr.green(v.toUpperCase())
  if (v === 'exclude')  return clr.red(v.toUpperCase())
  return clr.yellow(v.toUpperCase())
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(clr.bold('\n🔬 Sabi Core — Abstract Screening Assistant'))
  console.log(clr.dim(`Screening ${toScreen.length} abstract(s) against criteria: "${criteria.topic}"\n`))
  console.log(clr.dim('─'.repeat(72)))

  const results = []

  for (const entry of toScreen) {
    process.stdout.write(`[${entry.id}] ${clr.cyan(entry.title.slice(0, 60))}... `)
    const start = Date.now()

    const result = await screenAbstract(entry.abstract, criteria, entry.id)

    const ms       = Date.now() - start
    const mockFlag = result.isMock ? clr.dim(' (mock)') : ''
    const correct  = entry.expectedVerdict === result.verdict ? clr.green('✓') : clr.red('✗')

    console.log(`${verdictColour(result.verdict)}${mockFlag} ${correct} ${clr.dim(`${ms}ms`)}`)
    console.log(`   ${clr.dim('Reason:')} ${result.reason}`)
    console.log()

    results.push({
      id:        entry.id,
      expected:  entry.expectedVerdict,
      predicted: result.verdict,
      correct:   entry.expectedVerdict === result.verdict,
    })
  }

  // ── Summary & Evaluation Harness (A4) ────────────────────────────────────
  if (results.length > 1) {
    const correct = results.filter(r => r.correct).length
    const pct     = Math.round((correct / results.length) * 100)

    // Calculate Precision & Recall for the "include" class
    const tp = results.filter(r => r.expected === 'include' && r.predicted === 'include').length
    const fp = results.filter(r => r.expected !== 'include' && r.predicted === 'include').length
    const fn = results.filter(r => r.expected === 'include' && r.predicted !== 'include').length

    const precision = tp + fp > 0 ? (tp / (tp + fp) * 100).toFixed(1) : '0.0'
    const recall    = tp + fn > 0 ? (tp / (tp + fn) * 100).toFixed(1) : '0.0'

    console.log(clr.dim('─'.repeat(72)))
    console.log(clr.bold(`\nResults: ${correct}/${results.length} correct (${pct}%)`))
    console.log(clr.bold(`Precision (include): ${precision}%  |  Recall (include): ${recall}%\n`))

    // Confusion matrix
    const labels = ['include', 'exclude', 'uncertain']
    console.log(clr.bold('Confusion matrix (rows=expected, cols=predicted):'))
    console.log(`${''.padEnd(12)}` + labels.map(l => l.padEnd(12)).join(''))
    for (const expected of labels) {
      const row = labels.map(predicted => {
        const count = results.filter(r => r.expected === expected && r.predicted === predicted).length
        return String(count).padEnd(12)
      }).join('')
      console.log(`${expected.padEnd(12)}${row}`)
    }
    console.log()
    console.log(clr.dim('AI call log written to: logs/ai_calls.jsonl'))
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
