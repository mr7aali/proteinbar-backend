import nodemailer from "nodemailer";
import { env } from "../../config/env";

const hasSmtpConfig = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    })
  : nodemailer.createTransport({
      jsonTransport: true
    });

export async function sendLoginCodeEmail({
  email,
  code
}: {
  email: string;
  code: string;
}) {
  const result = await transporter.sendMail({
    from: env.SMTP_FROM_EMAIL
      ? `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`
      : undefined,
    to: email,
    subject: "Your Proteinbar login code",
    text: `Your Proteinbar verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin-bottom: 12px;">Proteinbar Login Code</h2>
        <p>Use the verification code below to continue your login.</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 18px 0;">${code}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  });

  if (!hasSmtpConfig) {
    console.log("NodeMailer fallback payload:", JSON.stringify(result));
  }

  return result;
}
