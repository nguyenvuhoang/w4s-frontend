/**
 * Extracts the readable error message by removing known prefixes like [CODE] [TYPE].
 * 
 * Example:
 * "[CTH_CHECK_USER_PHONE_NUMBER] [ERROR] The phone number 0388861300 is currently associated with an existing user."
 * => "The phone number 0388861300 is currently associated with an existing user."
 */
export function extractErrorMessage(rawMessage?: string): string {
  if (!rawMessage) return '';

  // Match and remove prefix like [ANYTHING] [ANYTHING] with optional space
  return rawMessage.replace(/^\[[^\]]+\]\s*\[[^\]]+\]\s*/, '').trim();
}
