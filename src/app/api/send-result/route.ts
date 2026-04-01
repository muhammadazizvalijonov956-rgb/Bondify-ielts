import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { attemptId, attempt } = await req.json();

    if (!attempt || !attempt.userEmail) {
      return NextResponse.json({ message: "No email provided" });
    }

    const organization = attempt.organization || "Bondify";
    const senderName = organization === "ADC" ? "ADC Testing Center" : "Bondify";
    const subject = organization === "ADC" 
      ? `Your IELTS Mock Test Result (ADC) - ${attempt.testTitle}` 
      : `${attempt.testTitle} - Your Test Result (Bondify)`;

    const band = attempt.estimatedBand || 0;
    const stats = attempt.section === 'full-test' 
        ? `Listening: ${attempt.listeningBand || '—'} | Reading: ${attempt.readingBand || '—'} | Writing: ${attempt.writingBand || '—'} | Speaking: ${attempt.speakingBand || '—'}`
        : `Raw Score: ${attempt.rawScore}/${attempt.maxScore}`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800;">${senderName}</h1>
          <p style="color: #64748b; margin-top: 8px;">Official Performance Report</p>
        </div>

        <div style="background: #f8fafc; border-radius: 24px; padding: 40px; border: 1px solid #f1f5f9; text-align: center; margin-bottom: 32px;">
          <p style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; font-weight: 700; color: #94a3b8; margin: 0 0 16px;">Overall Estimated Band</p>
          <div style="font-size: 64px; font-weight: 900; color: #2563eb; line-height: 1; margin-bottom: 16px;">${band.toFixed(1)}</div>
          <div style="display: inline-block; padding: 6px 16px; background: #dcfce7; color: #166534; border-radius: 99px; font-size: 12px; font-weight: 700;">TEST COMPLETED</div>
        </div>

        <div style="margin-bottom: 32px;">
          <h2 style="font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #334155;">Test Breakdown</h2>
          <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff;">
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #475569;">${attempt.testTitle}</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">${stats}</p>
          </div>
        </div>

        <div style="background: #eff6ff; border-radius: 16px; padding: 20px; border-left: 4px solid #2563eb;">
          <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.6;">
            <strong>Examiner Note:</strong> Keep up the consistent practice. Focus on reviewing your incorrect answers in Part 3 to bridge the gap to higher bands.
          </p>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 32px; border-top: 1px solid #f1f5f9;">
           <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://bondify.vercel.app'}/results/${attempt.id}" style="display: inline-block; background: #0f172a; color: #fff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px;">View Detailed Analysis</a>
           <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">© 2026 ${senderName} · Powered by Bondify</p>
        </div>
      </div>
    `;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('--- EMAIL MOCK (SESSION RESULT) ---');
      console.log('To:', attempt.userEmail);
      console.log('Subject:', subject);
      console.log('Sender:', senderName);
      console.log('-----------------------------------');
      return NextResponse.json({ message: "Email mocked" });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${senderName}" <${process.env.EMAIL_USER}>`,
      to: attempt.userEmail,
      subject: subject,
      html: htmlBody,
    });

    return NextResponse.json({ message: "Result sent" });

  } catch (err: any) {
    console.error("Async result email failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
