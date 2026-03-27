import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('\n=======================================');
      console.log('🚨 EMAIL MOCK MODE ACTIVE 🚨');
      console.log('=======================================');
      console.log('Would send email to:', data.to);
      console.log('Subject:', data.subject);
      console.log('\n[!] NO EMAIL WAS ACTUALLY SENT [!]');
      console.log('To send real emails to your Gmail account, you must:');
      console.log('1. Open your .env.local file');
      console.log('2. Add: EMAIL_USER="your-email@gmail.com"');
      console.log('3. Add: EMAIL_PASS="your-16-char-app-password"');
      console.log('(Generate an app password in your Google Account Security Settings)');
      console.log('=======================================\n');
      return NextResponse.json({ message: "Email mocked successfully" });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Bondify" <${process.env.EMAIL_USER}>`,
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html || `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto;">
          <h2 style="color: #2563eb;">Bondify — Your IELTS Practice Result</h2>
          <pre style="white-space: pre-wrap; font-family: inherit; font-size: 14px;">${data.text}</pre>
          <a href="${data.url || '#'}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 16px; font-weight: bold;">View Detailed Evaluation</a>
          <p style="color: #888; font-size: 12px; margin-top: 32px;">Bondify · IELTS Practice Platform</p>
        </div>
      `
    });

    console.log("Message sent: %s", info.messageId);

    return NextResponse.json({ message: "Email sent successfully" });

  } catch (err: any) {
    console.error("Failed to send email:", err);
    return NextResponse.json({ message: "Server error", error: err.message }, { status: 500 });
  }
}
