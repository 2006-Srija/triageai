/**
 * Prompt injection detection service.
 * Scans ticket text against known injection patterns (case-insensitive).
 * Returns true if any pattern is matched.
 */
const INJECTION_PATTERNS = [
  'ignore previous instructions',
  'ignore all prior',
  'you are now',
  'system prompt',
  'act as',
  'disregard the above',
  'mark as resolved',
  'reveal your instructions',
  'new instructions:',
  'override',
  'developer mode',
  'jailbreak',
];

export function detectInjection(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  for (const pattern of INJECTION_PATTERNS) {
    if (lower.includes(pattern)) return true;
  }
  return false;
}
