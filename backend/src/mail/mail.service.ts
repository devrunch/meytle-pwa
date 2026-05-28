import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private from: string = 'Meytle <noreply@meytle.app>';

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('SMTP_PORT', 587),
        secure: false,
        auth: { user, pass },
      });
      this.from = `Meytle <${user}>`;
      this.logger.log(`Mail service ready — SMTP ${host}`);
    } else {
      this.logger.warn(
        'Mail service disabled — set SMTP_HOST, SMTP_USER, SMTP_PASS in .env',
      );
    }
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) return;
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err}`);
    }
  }

  // ── Templates ───────────────────────────────────────────────────────────────

  bookingConfirmedUser(userName: string, companionName: string, date: string, time: string): string {
    return `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#0F172A;margin:0 0 8px">Your booking is confirmed! 🎉</h2>
        <p style="color:#64748B;margin:0 0 24px">Hi ${userName}, your session with <b>${companionName}</b> is confirmed.</p>
        <div style="background:#F0FAF8;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 8px;color:#0F172A"><b>📅 Date:</b> ${date}</p>
          <p style="margin:0;color:#0F172A"><b>🕐 Time:</b> ${time}</p>
        </div>
        <p style="color:#64748B;font-size:14px;">When you meet ${companionName}, open your Meytle app and tap <b>Start Session</b> to reveal your OTP. Read it aloud to ${companionName} — they'll enter it to confirm you've both arrived.</p>
        <p style="color:#64748B;font-size:13px;margin-top:24px;">See you soon! — The Meytle Team</p>
      </div>`;
  }

  noShowUser(userName: string, companionName: string, date: string): string {
    return `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#DC2626;margin:0 0 8px">Booking cancelled — no-show</h2>
        <p style="color:#64748B;margin:0 0 24px">Hi ${userName}, your session with <b>${companionName}</b> on ${date} was automatically cancelled because the OTP was not verified within 45 minutes of the scheduled start time.</p>
        <p style="color:#64748B;font-size:14px;">If you believe this was an error, please contact support.</p>
        <p style="color:#64748B;font-size:13px;margin-top:24px;">— The Meytle Team</p>
      </div>`;
  }

  noShowCompanion(companionName: string, userName: string, date: string): string {
    return `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#DC2626;margin:0 0 8px">Session cancelled — no-show</h2>
        <p style="color:#64748B;margin:0 0 24px">Hi ${companionName}, your session with <b>${userName}</b> on ${date} was automatically cancelled because the OTP was not verified within 45 minutes of the start time.</p>
        <p style="color:#64748B;font-size:14px;">No payment has been processed. If you believe this was an error, please contact support.</p>
        <p style="color:#64748B;font-size:13px;margin-top:24px;">— The Meytle Team</p>
      </div>`;
  }

  bookingDeclinedUser(userName: string, companionName: string, date: string): string {
    return `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#D97706;margin:0 0 8px">Booking request declined</h2>
        <p style="color:#64748B;margin:0 0 24px">Hi ${userName}, unfortunately <b>${companionName}</b> was unable to accept your booking for ${date}.</p>
        <p style="color:#64748B;font-size:14px;">No charge has been made. Feel free to browse other companions on Meytle.</p>
        <p style="color:#64748B;font-size:13px;margin-top:24px;">— The Meytle Team</p>
      </div>`;
  }
}
