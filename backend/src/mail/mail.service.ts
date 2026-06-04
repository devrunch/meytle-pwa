import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private from: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.from = this.config.get<string>('RESEND_FROM_EMAIL', 'Meytle <noreply@meytle.com>');

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log(`Mail service ready — Resend (from: ${this.from})`);
    } else {
      this.logger.warn('Mail service disabled — set RESEND_API_KEY in .env');
    }
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) return;
    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });
      if (error) {
        this.logger.error(`Resend error for ${to}: ${JSON.stringify(error)}`);
      }
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err}`);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private esc(s: string): string {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // ── Templates ───────────────────────────────────────────────────────────────

  emailOtp(otp: string, name: string): string {
    const n = this.esc(name);
    return `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#0F172A;margin:0 0 8px">Verify your email</h2>
        <p style="color:#64748B;margin:0 0 24px">Hi ${n}, enter this code to verify your Meytle account. It expires in <b>15 minutes</b>.</p>
        <div style="background:#F0FAF8;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
          <p style="font-size:40px;font-weight:800;letter-spacing:12px;color:#0F172A;margin:0;">${otp}</p>
        </div>
        <p style="color:#94A3B8;font-size:12px;margin:0;">If you didn't create a Meytle account, you can ignore this email.</p>
      </div>`;
  }

  bookingRequestCompanion(companionName: string, userName: string, service: string, date: string, appUrl: string): string {
    const [c, u, s, d, url] = [companionName, userName, service, date, appUrl].map((v) => this.esc(v));
    return `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#0F172A;margin:0 0 8px">New booking request 🎉</h2>
        <p style="color:#64748B;margin:0 0 24px">Hi ${c}, <b>${u}</b> wants to book you for <b>${s}</b> on ${d}.</p>
        <a href="${url}/companion/dashboard" style="display:inline-block;background:linear-gradient(135deg,#00D4AA,#4F8CFF);color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:600;font-size:15px;">Review Request</a>
        <p style="color:#94A3B8;font-size:12px;margin-top:24px;">Log in to accept or decline within 24 hours.</p>
      </div>`;
  }

  sessionCompleted(userName: string, companionName: string, date: string): string {
    const [u, c, d] = [userName, companionName, date].map((v) => this.esc(v));
    return `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#0F172A;margin:0 0 8px">Session completed ✅</h2>
        <p style="color:#64748B;margin:0 0 24px">Hi ${u}, your session with <b>${c}</b> on ${d} has ended.</p>
        <p style="color:#64748B;font-size:14px;">We hope you had a great time! Leave a review to help ${c} grow on Meytle.</p>
        <p style="color:#64748B;font-size:13px;margin-top:24px;">— The Meytle Team</p>
      </div>`;
  }

  bookingCancelledCompanion(companionName: string, userName: string, date: string): string {
    const [c, u, d] = [companionName, userName, date].map((v) => this.esc(v));
    return `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#D97706;margin:0 0 8px">Booking cancelled</h2>
        <p style="color:#64748B;margin:0 0 24px">Hi ${c}, <b>${u}</b> has cancelled their booking for ${d}.</p>
        <p style="color:#64748B;font-size:14px;">No payment has been processed. Your slot is now free.</p>
        <p style="color:#64748B;font-size:13px;margin-top:24px;">— The Meytle Team</p>
      </div>`;
  }

  passwordReset(resetUrl: string): string {
    const url = this.esc(resetUrl);
    return `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#0F172A;margin:0 0 8px">Reset your password</h2>
        <p style="color:#64748B;margin:0 0 24px">Click the button below to set a new password. This link expires in <b>1 hour</b>.</p>
        <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#00D4AA,#4F8CFF);color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:600;font-size:15px;">Reset Password</a>
        <p style="color:#94A3B8;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
        <p style="color:#94A3B8;font-size:11px;margin-top:8px;word-break:break-all;">Or copy this link: ${url}</p>
      </div>`;
  }

  bookingConfirmedUser(userName: string, companionName: string, date: string, time: string): string {
    const [u, c, d, t] = [userName, companionName, date, time].map((v) => this.esc(v));
    return `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#0F172A;margin:0 0 8px">Your booking is confirmed! 🎉</h2>
        <p style="color:#64748B;margin:0 0 24px">Hi ${u}, your session with <b>${c}</b> is confirmed.</p>
        <div style="background:#F0FAF8;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 8px;color:#0F172A"><b>📅 Date:</b> ${d}</p>
          <p style="margin:0;color:#0F172A"><b>🕐 Time:</b> ${t}</p>
        </div>
        <p style="color:#64748B;font-size:14px;">When you meet ${c}, open your Meytle app and tap <b>Show OTP</b> to reveal your code. Read it aloud to ${c} — they'll enter it to confirm you've both arrived.</p>
        <p style="color:#64748B;font-size:13px;margin-top:24px;">See you soon! — The Meytle Team</p>
      </div>`;
  }

  noShowUser(userName: string, companionName: string, date: string): string {
    const [u, c, d] = [userName, companionName, date].map((v) => this.esc(v));
    return `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#DC2626;margin:0 0 8px">Booking cancelled — no-show</h2>
        <p style="color:#64748B;margin:0 0 24px">Hi ${u}, your session with <b>${c}</b> on ${d} was automatically cancelled because the OTP was not verified within 45 minutes of the scheduled start time.</p>
        <p style="color:#64748B;font-size:14px;">If you believe this was an error, please contact support.</p>
        <p style="color:#64748B;font-size:13px;margin-top:24px;">— The Meytle Team</p>
      </div>`;
  }

  noShowCompanion(companionName: string, userName: string, date: string): string {
    const [c, u, d] = [companionName, userName, date].map((v) => this.esc(v));
    return `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#DC2626;margin:0 0 8px">Session cancelled — no-show</h2>
        <p style="color:#64748B;margin:0 0 24px">Hi ${c}, your session with <b>${u}</b> on ${d} was automatically cancelled because the OTP was not verified within 45 minutes of the start time.</p>
        <p style="color:#64748B;font-size:14px;">No payment has been processed. If you believe this was an error, please contact support.</p>
        <p style="color:#64748B;font-size:13px;margin-top:24px;">— The Meytle Team</p>
      </div>`;
  }

  bookingDeclinedUser(userName: string, companionName: string, date: string): string {
    const [u, c, d] = [userName, companionName, date].map((v) => this.esc(v));
    return `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#D97706;margin:0 0 8px">Booking request declined</h2>
        <p style="color:#64748B;margin:0 0 24px">Hi ${u}, unfortunately <b>${c}</b> was unable to accept your booking for ${d}.</p>
        <p style="color:#64748B;font-size:14px;">No charge has been made. Feel free to browse other companions on Meytle.</p>
        <p style="color:#64748B;font-size:13px;margin-top:24px;">— The Meytle Team</p>
      </div>`;
  }
}
