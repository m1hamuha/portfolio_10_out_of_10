const DANGEROUS_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|rules?|commands?)/gi,
  /system\s*:/gi,
  /<\|system\|/gi,
  /<\|user\|/gi,
  /<\|assistant\|/gi,
  /```system/gi,
  /roleplay\s+as/gi,
  /you\s+are\s+now/gi,
  /forget\s+(everything|all|your)/gi,
  /new\s+instructions/gi,
  /override/gi,
  /jailbreak/gi,
  / DAN[:\s]/gi,
];

const MAX_INPUT_LENGTH = 10000;

export function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input.slice(0, MAX_INPUT_LENGTH);

  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[FILTERED]');
  }

  return sanitized.trim();
}

export function sanitizeForPrompt(input: string): string {
  const sanitized = sanitizeUserInput(input);
  return sanitized
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}
