/**
 * Email service using Resend API
 * Server-side only - never expose API key to client
 * 
 * Uses the verified Resend domain: astaaxvrie.resend.app
 * From address: CFG Children and Youth Summer Camp <noreply@astaaxvrie.resend.app>
 */

import type { Registration } from "@/lib/camp";

// Email configuration using verified Resend domain
export const EMAIL_CONFIG = {
  fromEmail: "noreply@astaaxvrie.resend.app",
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
    console.log(`[Email] Message sent successfully. ID: ${data.id}`);
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
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Approved - CFG Summer Camp</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
          }
          .wrapper {
            background-color: #f5f5f5;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 0;
          }
          .content {
            padding: 40px 30px;
            background-color: #ffffff;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
          }
          .message {
            margin-bottom: 20px;
            line-height: 1.8;
            color: #555;
            font-size: 14px;
          }
          .message strong {
            color: #333;
          }
          .details {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 4px;
            margin: 25px 0;
            border-left: 4px solid #667eea;
          }
          .details p {
            margin: 0 0 10px 0;
            font-weight: 600;
            color: #333;
          }
          .details ul {
            margin: 10px 0;
            padding-left: 20px;
            list-style: none;
          }
          .details ul li {
            margin: 8px 0;
            padding-left: 20px;
            position: relative;
            color: #555;
            font-size: 14px;
          }
          .details ul li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #667eea;
            font-weight: bold;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
            font-weight: 600;
            font-size: 14px;
            transition: opacity 0.2s;
          }
          .cta-button:hover {
            opacity: 0.9;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #888;
          }
          .footer p {
            margin: 6px 0;
          }
          .signature {
            font-style: italic;
            margin-top: 30px;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations!</h1>
            </div>
            <div class="content">
              <p class="greeting">Dear ${fullName},</p>
              
              <p class="message">
                We are delighted to inform you that your application for the <strong>CFG Children and Youth Summer Camp</strong> has been <strong>ACCEPTED</strong>! 
              </p>
              
              <div class="details">
                <p>Camp Details:</p>
                <ul>
                  <li><strong>Dates:</strong> 3rd to 11th September 2026</li>
                  <li><strong>Venue:</strong> Kwinella Senior Secondary School</li>
                  <li><strong>Theme:</strong> Empowering Youth for Peaceful Democratic Participation</li>
                </ul>
              </div>
              
              <p class="message">
                We are excited to welcome you to this year's camp! As an accepted participant, you will be added to our official WhatsApp group where you'll receive important updates, announcements, schedules, and all essential camp information.
              </p>
              
              <p class="message">
                ${
                  whatsappLink
                    ? `<strong>Please join our WhatsApp group to stay updated:</strong><br><br><a href="${escapeHtml(whatsappLink)}" class="cta-button">Join WhatsApp Group</a><br><br>Join promptly to ensure you don't miss any important announcements as we prepare for the camp.`
                    : `<strong>WhatsApp Group Link:</strong><br>Watch your email for the WhatsApp group link, which will be shared with you shortly. Make sure to join to stay updated!`
                }
              </p>
              
              <p class="message">
                We look forward to an amazing camp experience with you!
              </p>
              
              <p class="signature">
                Warm regards,<br>
                <strong>CFG Children and Youth Summer Camp Team</strong>
              </p>
            </div>
            
            <div class="footer">
              <p>This is an automated message from the CFG Children and Youth Summer Camp application system.</p>
              <p>For questions, contact us at <strong>info@childrenfoundationgambia.org</strong></p>
            </div>
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
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Status - CFG Summer Camp</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
          }
          .wrapper {
            background-color: #f5f5f5;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 0;
          }
          .content {
            padding: 40px 30px;
            background-color: #ffffff;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
          }
          .message {
            margin-bottom: 20px;
            line-height: 1.8;
            color: #555;
            font-size: 14px;
          }
          .message strong {
            color: #333;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #888;
          }
          .footer p {
            margin: 6px 0;
          }
          .signature {
            font-style: italic;
            margin-top: 30px;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>Application Status Update</h1>
            </div>
            <div class="content">
              <p class="greeting">Dear ${fullName},</p>
              
              <p class="message">
                Thank you very much for your interest in the <strong>CFG Children and Youth Summer Camp</strong>. We truly appreciate the time and effort you invested in completing and submitting your application.
              </p>
              
              <p class="message">
                After careful review of all applications received, we regret to inform you that we are unable to offer you a place at this year's camp. Please know that this was a difficult decision, as we received many exceptionally strong applications from highly qualified candidates.
              </p>
              
              <p class="message">
                We strongly encourage you to apply again for future editions of the camp. Your demonstrated enthusiasm and interest in our programs are valued, and we sincerely hope to welcome you in the future. Each year brings new opportunities, and we would be delighted to consider your application again.
              </p>
              
              <p class="message">
                If you would like feedback on your application or have any questions, please do not hesitate to contact us at <strong>info@childrenfoundationgambia.org</strong>. We are here to help!
              </p>
              
              <p class="signature">
                Best regards,<br>
                <strong>CFG Children and Youth Summer Camp Team</strong>
              </p>
            </div>
            
            <div class="footer">
              <p>This is an automated message from the CFG Children and Youth Summer Camp application system.</p>
              <p>For questions, contact us at <strong>info@childrenfoundationgambia.org</strong></p>
            </div>
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
