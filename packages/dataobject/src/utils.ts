// Simple pluralization helper
// Handles common cases, can be extended as needed
export function pluralize(word: string): string {
  // Handle compound words with hyphens (e.g., agent-status -> agent-statuses)
  if (word.includes('-')) {
    const parts = word.split('-')
    parts[parts.length - 1] = pluralize(parts[parts.length - 1])
    return parts.join('-')
  }

  // Handle compound camelCase words (e.g., agentStatus -> agentStatuses)
  // Find the last uppercase letter and pluralize from there
  const chars = word.split('')
  let lastUpperIdx = -1
  for (let i = chars.length - 1; i >= 0; i--) {
    if (chars[i] >= 'A' && chars[i] <= 'Z') {
      lastUpperIdx = i
      break
    }
  }
  if (lastUpperIdx > 0) {
    const prefix = word.slice(0, lastUpperIdx)
    const suffix = word.slice(lastUpperIdx).toLowerCase()
    return prefix + capitalize(pluralize(suffix))
  }

  // Common irregular plurals
  const irregulars: Record<string, string> = {
    status: 'statuses',
    index: 'indices',
    person: 'people',
    child: 'children',
    man: 'men',
    woman: 'women',
    datum: 'data',
    medium: 'media',
    analysis: 'analyses',
    basis: 'bases',
    crisis: 'crises',
    thesis: 'theses',
  }

  const lower = word.toLowerCase()
  if (irregulars[lower]) {
    // Preserve original case
    if (word[0] === word[0].toUpperCase()) {
      return capitalize(irregulars[lower])
    }
    return irregulars[lower]
  }

  // Words ending in s, x, z, ch, sh -> add 'es'
  if (/[sxz]$/.test(word) || /[cs]h$/.test(word)) {
    return word + 'es'
  }

  // Words ending in consonant + y -> change y to ies
  if (/[^aeiou]y$/i.test(word)) {
    return word.slice(0, -1) + 'ies'
  }

  // Words ending in f or fe -> change to ves
  if (/fe?$/i.test(word)) {
    return word.replace(/fe?$/i, 'ves')
  }

  // Default: add 's'
  return word + 's'
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
