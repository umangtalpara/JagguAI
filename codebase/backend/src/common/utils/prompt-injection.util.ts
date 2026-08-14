export function detectPromptInjection(text: string): boolean {
  if (!text) {
    return false;
  }
  
  const patterns = [
    /ignore\s+(any\s+|previous\s+)?instructions/i,
    /you\s+are\s+now\s+a\s+/i,
    /system\s+prompt/i,
    /instead\s+of\s+your\s+instructions/i,
    /override\s+your\s+rules/i,
    /forget\s+what\s+I\s+said/i,
    /bypass\s+restrictions/i,
    /new\s+system\s+directive/i
  ];
  
  return patterns.some(pattern => pattern.test(text));
}
