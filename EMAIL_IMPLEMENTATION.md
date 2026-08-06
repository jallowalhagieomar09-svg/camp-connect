# Email Notifications Implementation

## Overview

The CFG Children and Youth Summer Camp application system now includes automated email notifications using **Resend** as the email service provider. Emails are sent automatically when admins approve or reject applications through the admin dashboard.

## Architecture

### Email Service (`src/lib/email.server.ts`)

This is a server-side only module that handles all email operations. It is **never exposed to the frontend** to keep the Resend API key secure.

**Key Features:**
- Reusable email service with support for multiple email templates
- HTML-based branded email templates with CFG branding
- Graceful error handling that doesn't block database operations
- Server-side only execution (uses `.server.ts` naming convention)

### Verified Resend Configuration

- **Domain:** `astaaxvrie.resend.app` (verified)
- **From Email:** `noreply@astaaxvrie.resend.app`
- **From Name:** `CFG Children and Youth Summer Camp`
- **API Key:** Stored securely as environment secret `RESEND_API_KEY`

## Email Types

### 1. Approval Email

**Trigger:** Admin clicks "Approve" button on a registration in the admin dashboard

**Process:**
1. Registration status is updated to `"approved"` in the database
2. Applicant's full name is dynamically retrieved from the `full_name` field
3. Approval email is sent via Resend (asynchronously)
4. If email fails, database update still succeeds (no blocking)

**Email Content:**
- Subject: `Congratulations! You Have Been Accepted for the CFG Children and Youth Summer Camp`
- Dynamic greeting with applicant's name
- Camp details (dates, venue, theme)
- WhatsApp group link (if configured via `WHATSAPP_GROUP_LINK` environment variable)
- Professional, branded HTML template

**Example:**
```
From: CFG Children and Youth Summer Camp <noreply@astaaxvrie.resend.app>
To: applicant@email.com
Subject: Congratulations! You Have Been Accepted for the CFG Children and Youth Summer Camp

Dear [Full Name],

Congratulations! We are delighted to inform you that your application 
for the CFG Children and Youth Summer Camp has been ACCEPTED!

Camp Details:
✓ Dates: 3rd to 11th September 2026
✓ Venue: Kwinella Senior Secondary School
✓ Theme: Empowering Youth for Peaceful Democratic Participation

[WhatsApp Group Join Link or waiting message]

Warm regards,
CFG Children and Youth Summer Camp Team
```

### 2. Rejection Email

**Trigger:** Admin clicks "Reject" button on a registration in the admin dashboard

**Process:**
1. Registration status is updated to `"rejected"` in the database
2. Rejection email is sent via Resend (asynchronously)
3. If email fails, database update still succeeds (no blocking)

**Email Content:**
- Subject: `CFG Children and Youth Summer Camp - Application Status Update`
- Professional, respectful tone
- Thanks for applying
- Encourages reapplication for future editions
- Offers feedback contact option

**Example:**
```
From: CFG Children and Youth Summer Camp <noreply@astaaxvrie.resend.app>
To: applicant@email.com
Subject: CFG Children and Youth Summer Camp - Application Status Update

Dear [Full Name],

Thank you for your interest in the CFG Children and Youth Summer Camp. 
We appreciate you taking the time to complete and submit your application.

After careful review, we regret to inform you that we are unable to offer 
you a place at this year's camp. This was a difficult decision, as we 
received many exceptionally strong applications.

We encourage you to apply again for future editions of the camp. Your 
enthusiasm is valued, and we hope to welcome you in the future.

For feedback on your application, contact us at 
info@childrenfoundationgambia.org

Best regards,
CFG Children and Youth Summer Camp Team
```

## Implementation Details

### Admin Functions (`src/lib/admin.functions.ts`)

The `setRegistrationStatus` function orchestrates the email sending:

```typescript
export const setRegistrationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "approved" | "rejected" | "pending" }) => data)
  .handler(async ({ data, context }) => {
    // 1. Update database first
    const { data: row, error } = await context.supabase
      .from("registrations")
      .update({ status: data.status, reviewed_at: new Date().toISOString() })
      .eq("id", data.id)
      .select("*")
      .maybeSingle();
    
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Registration not found");

    // 2. Send email asynchronously (doesn't block database update)
    let emailSent = false;
    try {
      const { sendApprovalEmail, sendRejectionEmail } = await import("@/lib/email.server");
      
      if (data.status === "approved") {
        const result = await sendApprovalEmail(row);
        emailSent = result.success;
        if (!result.success) {
          console.warn(`Approval email failed for registration ${row.id}: ${result.error}`);
        }
      } else if (data.status === "rejected") {
        const result = await sendRejectionEmail(row);
        emailSent = result.success;
        if (!result.success) {
          console.warn(`Rejection email failed for registration ${row.id}: ${result.error}`);
        }
      }
    } catch (emailError) {
      // Log error but don't throw - database update was successful
      console.error("Email notification error:", emailError);
    }

    return { registration: row, emailSent };
  });
```

### Admin Dashboard UI (`src/routes/_authenticated/admin.index.tsx`)

The dashboard provides feedback about email status:

**Success Toast (Email Sent):**
```
"Status updated and approval email sent! ✅"
```

**Warning Toast (Email Not Sent):**
```
"Status updated to approved. Email delivery will activate once verified. ⚠️"
Description: "Database updated successfully, but email not sent yet."
```

**Enhanced UI Features:**
- Improved button labels with icons (✓ for approve, ✗ for reject)
- Tooltips explaining that emails will be sent
- Color-coded status badges
- Clear feedback about email delivery status

## Configuration

### Environment Variables

Set these environment variables in your deployment:

```bash
# Resend API Key (stored securely as environment secret)
RESEND_API_KEY=re_xxx...

# Optional: WhatsApp Group Link for approved participants
WHATSAPP_GROUP_LINK=https://chat.whatsapp.com/xxx...
```

**Note:** `RESEND_API_KEY` should **never** be committed to version control. It's stored securely as an environment secret.

## Testing Checklist

- [ ] Applicant submits application via registration form
- [ ] Applicant uploads proof of payment
- [ ] Admin navigates to admin dashboard (approves admin role for first user)
- [ ] Admin views list of pending registrations
- [ ] Admin clicks "Approve" on a registration
  - [ ] Registration status changes to "approved" in the database
  - [ ] Success toast appears with email confirmation message
  - [ ] Applicant receives approval email at their registered email address
  - [ ] Email contains applicant's actual entered name
  - [ ] Email contains camp dates (3rd to 11th September 2026)
  - [ ] Email contains venue (Kwinella Senior Secondary School)
  - [ ] Email includes WhatsApp group link (if configured)
- [ ] Admin clicks "Reject" on a different registration
  - [ ] Registration status changes to "rejected" in the database
  - [ ] Success toast appears with email confirmation message
  - [ ] Applicant receives rejection email at their registered email address
  - [ ] Email contains applicant's actual entered name
  - [ ] Email has respectful tone
  - [ ] Email encourages future applications
- [ ] Test with disabled Resend API to verify graceful error handling
  - [ ] Status update succeeds even if email fails
  - [ ] Warning toast appears explaining email delivery status
  - [ ] Error is logged to console for debugging

## Email Templates

Both email templates are designed with:

- **CFG Branding:** Purple gradient header (`#667eea` to `#764ba2`)
- **Responsive Design:** Works on mobile, tablet, and desktop
- **Professional Layout:** Clean spacing and typography
- **Accessibility:** Proper semantic HTML, readable fonts
- **Branded Footer:** Contact information and automatic disclaimer

### Template Features

- Dynamic name insertion (escaped for security)
- Conditional WhatsApp link (shows if configured, otherwise shows waiting message)
- Camp details clearly highlighted
- Call-to-action buttons for approval emails
- Contact information for support

## Security Considerations

1. **API Key Protection:**
   - `RESEND_API_KEY` is stored as an environment secret
   - Never committed to version control
   - Only accessed in server-side code (`.server.ts` files)

2. **HTML Escaping:**
   - Applicant names are HTML-escaped before inserting into email templates
   - Prevents potential injection attacks

3. **Database Priority:**
   - Database updates complete before email sends
   - Email failures never block or undo database updates
   - Email errors are logged but don't throw exceptions

4. **Frontend Security:**
   - Email service is completely server-side
   - Frontend never has access to API key or Resend endpoints
   - All email operations are hidden from client code

## Future Enhancements

The email service is designed to be extensible for:

1. **Application Received Confirmation**
   - Sent when applicant first submits application
   - Confirms receipt and provides reference number

2. **Payment Verification Updates**
   - Sent when payment receipt is verified by admin
   - Confirms payment acceptance

3. **Reminder Emails**
   - Pre-camp reminders for accepted participants
   - Camp preparation information

4. **Camp Announcements**
   - Schedule updates
   - Important announcements before camp starts

### Adding New Email Templates

To add a new email template:

1. Create a new `generateXxxEmailHtml()` function in `src/lib/email.server.ts`
2. Create a new `sendXxxEmail()` export function
3. Call the send function from appropriate server handler
4. Return `{ success, messageId?, error? }` for consistent error handling

```typescript
function generateNewEmailHtml(registration: Registration): string {
  // Build HTML template with registration data
  return `<!DOCTYPE html>...`;
}

export async function sendNewEmail(
  registration: Registration
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!registration.email) {
    return { success: false, error: "No email address found" };
  }
  
  const subject = "Email Subject Here";
  const html = generateNewEmailHtml(registration);
  
  return sendEmailViaResend(registration.email, subject, html);
}
```

## Troubleshooting

### Emails Not Sending

1. **Check if RESEND_API_KEY is configured:**
   ```bash
   echo $RESEND_API_KEY  # Should not be empty
   ```

2. **Check server logs:**
   ```
   [Email] Sending approval email to applicant@email.com for John Doe
   [Email] Message sent successfully. ID: ...
   ```

3. **Verify email address is correct:**
   - Database should have valid email in `registrations.email` field

4. **Check Resend dashboard:**
   - Log in to https://resend.com
   - Verify domain is authenticated
   - Check email activity log

### Email Not Updating Database Status

1. **Check admin authentication:**
   - Ensure user has admin role
   - Check `user_roles` table for admin entry

2. **Check database permissions:**
   - Ensure authenticated user can update registrations table

3. **Check server logs for errors:**
   - Database update errors will be thrown and caught

## Additional Resources

- **Resend Documentation:** https://resend.com/docs
- **Email Best Practices:** https://resend.com/blog
- **HTML Email Guide:** https://www.campaignmonitor.com/guides/
