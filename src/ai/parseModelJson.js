/**
 * Extract a JSON object from a model response (raw or fenced).
 * @param {string} text
 * @returns {unknown}
 */
export function parseJsonFromModelText(text) {
  const raw = String(text ?? '').trim()
  if (!raw) throw new Error('Lege modelresponse')

  try {
    return JSON.parse(raw)
  } catch {
    // continue
  }

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    return JSON.parse(fenced[1].trim())
  }

  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start >= 0 && end > start) {
    return JSON.parse(raw.slice(start, end + 1))
  }

  throw new Error('Geen JSON in modelresponse')
}
