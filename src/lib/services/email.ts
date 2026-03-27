// Email Service Abstraction
// This is designed to be free-first. In MVP, you can use Next.js API routes with Nodemailer (using Gmail app passwords)
// or Resend free tier.

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends an email using the configured provider.
 * Usage:
 * await sendEmail({
 *   to: user.email,
 *   subject: "Your IELTS Practice Result",
 *   text: "You scored..."
 * })
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  // If no API keys are present, gracefully mock the behavior to prevent app crashes
  if (!process.env.EMAIL_PROVIDER_KEY) {
    console.log('[Email Mock] Would send email to:', payload.to);
    console.log('[Email Mock] Subject:', payload.subject);
    console.log('[Email Mock] Body:', payload.text);
    return true; // Simulate success
  }

  try {
    // Example: Call Next.js API route that handles actual sending, or use Nodemailer here if executed server-side
    // const res = await fetch('/api/send-email', { method: 'POST', body: JSON.stringify(payload) })
    // return res.ok
    console.log('Real email sending logic goes here');
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}
