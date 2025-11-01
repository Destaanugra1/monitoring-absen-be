function normalizeName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function dedupeNames(names) {
  const seen = new Set()
  const result = []
  for (const n of names) {
    const norm = normalizeName(n)
    if (!norm) continue
    if (seen.has(norm)) continue
    seen.add(norm)
    result.push(n.trim())
  }
  return result
}

module.exports = { normalizeName, dedupeNames }
