/**
 * Email service using Resend API
 * Server-side only - never expose API key to client
 */

import type { Registration } from "@/lib/camp";

// Email configuration
export const EMAIL_CONFIG = {
  fromEmail: "noreply@childrenfoundationgambia.org",
  fromName: "CFG Children and Youth Summer Camp",
};

// Configurable WhatsApp link - stored as environment variable or fallback
export function getWhatsAppGroupLink(): string {
  return process.env.WHATSAPP_GROUP_LINK || "";
}

/**
 * Escape HTML special characters to prevent injection
 */
function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Send email via Resend API
 */
async function sendEmailViaResend(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("[Email] RESEND_API_KEY is not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromEmail}>`,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[Email] Resend API error:", error);
      return { success: false, error: JSON.stringify(error) };
    }

    const data = (await response.json()) as { id?: string };
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Generate HTML for approval email
 */
function generateApprovalEmailHtml(registration: Registration): string {
  const whatsappLink = getWhatsAppGroupLink();
  const fullName = escapeHtml(registration.full_name);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Approved</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .greeting { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
          .message { margin-bottom: 20px; line-height: 1.8; }
          .details { background: white; padding: 20px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #667eea; }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations!</h1>
          </div>
          <div class="content">
            <p class="greeting">Dear ${fullName},</p>
            
            <p class="message">
              We are pleased to inform you that your application for the <strong>CFG Children and Youth Summer Camp</strong> has been <strong>accepted</strong>.
            </p>
            
            <div class="details">
              <p><strong>Camp Details:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>When:</strong> 3rd to 11th September 2026</li>
                <li><strong>Where:</strong> Kwinella Senior Secondary School</li>
              </ul>
            </div>
            
            <p class="message">
              We are excited to welcome you to this year's camp! As an accepted participant, you will be added to the official WhatsApp group where important updates, announcements, schedules, and other camp information will be shared.
            </p>
            
            <p class="message">
              ${
                whatsappLink
                  ? `Please join the WhatsApp group using the link below to stay updated on all preparations ahead of the camp:<br><br><a href="${escapeHtml(whatsappLink)}" class="cta-button">Join WhatsApp Group</a>`
                  : `Please watch your email for the WhatsApp group link which will be shared shortly.`
              }
            </p>
            
            <p class="message">
              We look forward to welcoming you to the CFG Children and Youth Summer Camp!
            </p>
            
            <p style="margin-top: 30px; font-style: italic;">
              Warm regards,<br>
              <strong>CFG Children and Youth Summer Camp Team</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from the CFG Children and Youth Summer Camp application system.</p>
            <p>If you have any questions, please contact us at info@childrenfoundationgambia.org</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML for rejection email
 */
function generateRejectionEmailHtml(registration: Registration): string {
  const fullName = escapeHtml(registration.full_name);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Status Update</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .greeting { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
          .message { margin-bottom: 20px; line-height: 1.8; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Application Status Update</h1>
          </div>
          <div class="content">
            <p class="greeting">Dear ${fullName},</p>
            
            <p class="message">
              Thank you for your interest in the <strong>CFG Children and Youth Summer Camp</strong>. We appreciate you taking the time to complete and submit your application.
            </p>
            
            <p class="message">
              After careful review of all applications, we regret to inform you that we are unable to offer you a place at this year's camp. This was a difficult decision, as we received many strong applications from qualified candidates.
            </p>
            
            <p class="message">
              We encourage you to apply again for future editions of the camp. Your enthusiasm and interest in our programs are valued, and we hope to welcome you in the future.
            </p>
            
            <p class="message">
              If you have any questions about your application or would like feedback, please feel free to contact us at <strong>info@childrenfoundationgambia.org</strong>.
            </p>
            
            <p style="margin-top: 30px; font-style: italic;">
              Best regards,<br>
              <strong>CFG Children and Youth Summer Camp Team</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from the CFG Children and Youth Summer Camp application system.</p>
            <p>If you have any questions, please contact us at info@childrenfoundationgambia.org</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send approval email to applicant
 */
export async function sendApprovalEmail(
  registration: Registration
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!registration.email) {
    console.error("[Email] No email address provided for registration", registration.id);
    return { success: false, error: "No email address found" };
  }

  const subject = "Congratulations! You Have Been Accepted for the CFG Children and Youth Summer Camp";
  const html = generateApprovalEmailHtml(registration);

  console.log(
    `[Email] Sending approval email to ${registration.email} for ${registration.full_name}`
  );
  return sendEmailViaResend(registration.email, subject, html);
}

/**
 * Send rejection email to applicant
 */
export async function sendRejectionEmail(
  registration: Registration
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!registration.email) {
    console.error("[Email] No email address provided for registration", registration.id);
    return { success: false, error: "No email address found" };
  }

  const subject = "CFG Children and Youth Summer Camp - Application Status Update";
  const html = generateRejectionEmailHtml(registration);

  console.log(
    `[Email] Sending rejection email to ${registration.email} for ${registration.full_name}`
  );
  return sendEmailViaResend(registration.email, subject, html);
}
