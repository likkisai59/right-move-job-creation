/**
 * utils/emailValidator.js
 * Industry-standard email validation and typo detection utility for Frontend.
 */

const POPULAR_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];

/**
 * Calculates edit distance between two strings (Levenshtein distance algorithm)
 */
function getLevenshteinDistance(s1, s2) {
  if (s1.length < s2.length) return getLevenshteinDistance(s2, s1);
  if (s2.length === 0) return s1.length;
  let previousRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
  for (let i = 0; i < s1.length; i++) {
    const currentRow = [i + 1];
    for (let j = 0; j < s2.length; j++) {
      const insertions = previousRow[j + 1] + 1;
      const deletions = currentRow[j] + 1;
      const substitutions = previousRow[j] + (s1[i] !== s2[j] ? 1 : 0);
      currentRow.push(Math.min(insertions, deletions, substitutions));
    }
    previousRow = currentRow;
  }
  return previousRow[previousRow.length - 1];
}

/**
 * Checks if domain has a typo compared to popular domains.
 * Returns suggested domain string or null.
 */
export function detectDomainTypo(domain) {
  if (!domain) return null;
  const d = domain.toLowerCase().trim();
  if (POPULAR_DOMAINS.includes(d)) return null;

  for (const pop of POPULAR_DOMAINS) {
    if (getLevenshteinDistance(d, pop) <= 2) {
      return pop;
    }
  }
  return null;
}

/**
 * Validates email format and checks for popular domain typos.
 * Returns true if valid, or an error string if invalid.
 */
export function validateEmail(val) {
  if (!val) return true;
  const trimmed = String(val).trim();

  // Step 1: Format check
  if (trimmed.includes('..') || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/.test(trimmed)) {
    return 'Enter a valid email address (e.g. user@example.com)';
  }

  // Step 2: Algorithmic typo check
  const domain = trimmed.split('@')[1];
  const suggested = detectDomainTypo(domain);
  if (suggested) {
    return `Invalid email domain '${domain}'. Did you mean '${suggested}'?`;
  }

  return true;
}
