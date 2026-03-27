// SMS Service Abstraction
// Disabled by default for MVP to maintain free-first nature of the app.
// Can be implemented later using Twilio or Firebase Phone Verification.

export interface SmsPayload {
  toPhone: string;
  message: string;
}

/**
 * Sends an SMS using the configured provider.
 * To enable: Set SMS_PROVIDER_KEY in standard environment variables.
 */
export async function sendSms(payload: SmsPayload): Promise<boolean> {
  // Gracefully fallback to no-op if no credentials exist
  if (!process.env.SMS_PROVIDER_KEY) {
    console.log('[SMS Mock] Would send SMS to:', payload.toPhone);
    console.log('[SMS Mock] Message:', payload.message);
    return false; // Indicating mock mode / not actually sent
  }

  try {
    // Implement Twilio / Firebase Phone Auth logic here
    console.log('Real SMS logic goes here (e.g. Twilio client call)');
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}
