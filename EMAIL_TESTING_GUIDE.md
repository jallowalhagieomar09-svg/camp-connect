# Email System Testing Guide

## Quick Start Testing

### Prerequisites
- Admin access to the dashboard
- Test applicant email address that you can access
- RESEND_API_KEY configured in environment
- (Optional) WHATSAPP_GROUP_LINK configured for approval emails

## Step-by-Step Testing

### Test 1: Application Submission and Admin Dashboard Access

**Objective:** Verify the basic flow works

**Steps:**
1. Navigate to the application form at `/`
2. Fill out the complete registration form with:
   - Full Name: `Test Applicant` (or your test name)
   - Email: Use a test email you control (e.g., `test@gmail.com`)
   - All other required fields
3. Upload a payment receipt (any PDF/image file)
4. Submit the application
5. You should see a success message
6. Navigate to `/admin` (this is the protected admin dashboard)
7. If it's your first login, you'll be granted admin role automatically
8. Verify you see the "Registrations" dashboard with your test application listed as "pending"

**Expected Results:**
✓ Application form submits successfully  
✓ Registration appears in admin dashboard with "pending" status  
✓ Application shows correct entered name  
✓ Email address is correctly displayed in the admin table  

---

### Test 2: Approval Email Delivery

**Objective:** Test that emails are sent correctly when approving an applicant

**Steps:**
1. In the admin dashboard, find the "pending" application from Test 1
2. Verify all application details are visible in the table:
   - Participant name
   - Guardian information
   - Contact email
   - Payment receipt option
3. Click the **"Approve"** button (green button with checkmark icon)
4. You should see a toast notification at the top
5. Check your test email inbox (may take 30 seconds - 2 minutes)
6. The email should be from: `CFG Children and Youth Summer Camp <noreply@astaaxvrie.resend.app>`

**Expected Results:**
✓ Registration status changes to "approved" immediately in the table  
✓ Success toast appears: `"Status updated and approval email sent! ✅"`  
✓ Email arrives within 2 minutes  
✓ Email subject: `"Congratulations! You Have Been Accepted for the CFG Children and Youth Summer Camp"`  
✓ Email contains the test applicant's actual name  
✓ Email contains camp dates: "3rd to 11th September 2026"  
✓ Email contains venue: "Kwinella Senior Secondary School"  
✓ Email contains camp theme: "Empowering Youth for Peaceful Democratic Participation"  
✓ Email contains WhatsApp group link (if WHATSAPP_GROUP_LINK is configured)  
✓ Email has professional HTML formatting with CFG branding  

**Email Content Checklist:**
```
From: CFG Children and Youth Summer Camp <noreply@astaaxvrie.resend.app>
To: [Your test email]
Subject: Congratulations! You Have Been Accepted for the CFG Children and Youth Summer Camp

- Personalized greeting with your test name
- "Congratulations! 🎉" message
- Camp details with dates and venue
- WhatsApp group information or joining link
- Professional footer with contact info
- CFG branding and styling
```

---

### Test 3: Rejection Email Delivery

**Objective:** Test that rejection emails are sent correctly

**Steps:**
1. Create a second test application:
   - Navigate to `/` again
   - Use different email: `test2@gmail.com` (or another test email)
   - Full Name: `Rejected Applicant` (or another test name)
   - Complete all fields and upload receipt
   - Submit

2. Return to admin dashboard
3. Find the new "pending" application from this second test
4. Click the **"Reject"** button (red button with X icon)
5. You should see a toast notification at the top
6. Check the second test email inbox (may take 30 seconds - 2 minutes)

**Expected Results:**
✓ Registration status changes to "rejected" immediately  
✓ Success toast appears: `"Status updated and rejection email sent! ✅"`  
✓ Email arrives within 2 minutes  
✓ Email subject: `"CFG Children and Youth Summer Camp - Application Status Update"`  
✓ Email contains the applicant's actual name  
✓ Email has respectful, empathetic tone  
✓ Email thanks them for applying  
✓ Email explains decision clearly  
✓ Email encourages future applications  
✓ Email includes support contact email  
✓ Email has professional HTML formatting  

**Email Content Checklist:**
```
From: CFG Children and Youth Summer Camp <noreply@astaaxvrie.resend.app>
To: [Second test email]
Subject: CFG Children and Youth Summer Camp - Application Status Update

- Personalized greeting with applicant's name
- Thank you for applying
- "Regret to inform you" of unsuccessful application
- Explanation that many strong applications were received
- Encouragement to apply for future editions
- Offer to provide feedback
- Contact information: info@childrenfoundationgambia.org
- Professional footer with contact info
- CFG branding and styling
```

---

### Test 4: Email Failure Handling

**Objective:** Verify that database updates succeed even if email fails

**Steps:**
1. Create a third test application with an unusual but valid email format
   - Email: `test+unique@example.com` (or any valid format)
   - Full Name: `Failure Test User`

2. (Optional) Temporarily disable `RESEND_API_KEY` environment variable to simulate email service failure

3. In the admin dashboard, click "Approve" on this application

4. Expected behavior:
   - Status should still change to "approved" in the database
   - Toast may show warning about email not being sent
   - Refresh page - status should still be "approved" (confirming DB update succeeded)

**Expected Results:**
✓ Status changes to "approved" regardless of email status  
✓ Database reflects the change (persists on page refresh)  
✓ Toast shows appropriate message about email status  
✓ No error is thrown to the user  
✓ Error is logged to server console for debugging  

---

### Test 5: Status Tab Filtering

**Objective:** Verify dashboard filtering works correctly

**Steps:**
1. Ensure you have multiple test applications with different statuses:
   - At least 1 "pending"
   - At least 1 "approved"
   - At least 1 "rejected"

2. Test each tab:
   - Click "all" tab → should show all 3+ applications
   - Click "pending" tab → should show only pending
   - Click "approved" tab → should show only approved
   - Click "rejected" tab → should show only rejected

**Expected Results:**
✓ Each tab correctly filters the displayed applications  
✓ Stats cards at top update as you change tabs  
✓ Tab buttons highlight when selected  
✓ Smooth switching between tabs  

---

### Test 6: Receipt Viewing

**Objective:** Verify payment receipt downloads work

**Steps:**
1. In the admin dashboard, find an application with a receipt
2. Click the "View" button in the Receipt column
3. The receipt should open in a new browser tab

**Expected Results:**
✓ Receipt opens in new tab/window  
✓ Correct file is displayed (the one you uploaded)  
✓ Link is not accessible without authentication  

---

### Test 7: Registration Deletion

**Objective:** Verify delete functionality works

**Steps:**
1. Find a test application you want to delete
2. Click the trash icon (delete button) on the right
3. Confirm deletion in the popup
4. Application should disappear from the table
5. Refresh the page
6. Application should still be gone

**Expected Results:**
✓ Delete confirmation prompt appears  
✓ Application is removed from the table  
✓ Deletion persists after page refresh  
✓ Receipt file is also deleted from storage  

---

## Advanced Testing

### Test Email with Real Names and Emails

**Objective:** Test with realistic data

**Steps:**
1. Create test applications with realistic names that might have:
   - Special characters: `Müller`, `José`, `O'Brien`
   - Multiple spaces: `Jean Paul Martin`
   - Long names: `Muhammad Abdullah Mohammed Hassan`

2. Approve one application with each type of name

**Expected Results:**
✓ Email displays name correctly (no escaping issues)  
✓ Special characters render properly  
✓ No HTML injection or encoding errors  

---

### Test WhatsApp Link Functionality

**Objective:** Verify WhatsApp link is included in approval emails

**Prerequisites:**
- Set `WHATSAPP_GROUP_LINK` environment variable with a valid WhatsApp group link
- Example: `https://chat.whatsapp.com/xxxxx`

**Steps:**
1. Create a new test application
2. Approve it
3. Check the approval email
4. Look for the WhatsApp group link

**Expected Results:**
✓ Email contains the configured WhatsApp link  
✓ Link is clickable  
✓ Link opens WhatsApp group when clicked  
✓ Button text says "Join WhatsApp Group"  

**Without WhatsApp Link:**
- If `WHATSAPP_GROUP_LINK` is not set/empty
- Approval email should say: "Watch your email for the WhatsApp group link, which will be shared shortly"
- No button or link to WhatsApp should appear

---

### Test Multiple Rapid Operations

**Objective:** Ensure system handles rapid status changes

**Steps:**
1. Create 2-3 test applications
2. Rapidly click approve/reject buttons on different applications
3. Monitor that all operations complete successfully

**Expected Results:**
✓ All operations complete without conflicts  
✓ Database reflects all changes correctly  
✓ Each generates appropriate toast notification  
✓ All emails are sent (may queue briefly but all deliver)  

---

## Email Header Testing

Check the actual email headers received to verify Resend authentication:

**Steps:**
1. Open the approval/rejection email you received
2. View email source/headers (varies by email provider)
   - Gmail: Click menu → Show original
   - Outlook: File → Properties
   - Apple Mail: View → Message → All Headers

**Look for:**
```
From: CFG Children and Youth Summer Camp <noreply@astaaxvrie.resend.app>
Return-Path: bounces+xxxx@astaaxvrie.resend.app
Authentication-Results: ... dkim=pass ... spf=pass ...
Received: from astaaxvrie.resend.app ...
```

**Expected Results:**
✓ SPF pass: `spf=pass`  
✓ DKIM pass: `dkim=pass`  
✓ DMARC pass (if configured): `dmarc=pass`  
✓ From address matches verified domain  

---

## Troubleshooting During Testing

### Email Not Arriving

1. **Check spam/junk folder** - first emails sometimes go to spam
2. **Verify email address is correct** - typos in application form
3. **Check server logs** - look for `[Email]` prefixed log messages
4. **Verify RESEND_API_KEY** - ensure it's set in environment
5. **Check Resend dashboard** - https://resend.com/emails

### Email Has Wrong Content

1. **Refresh browser** - verify status in database matches display
2. **Check applicant name** - ensure it matches what was entered in form
3. **Check HTML rendering** - try different email clients
4. **Verify camp details** - dates and venue should be in FALLBACK_SETTINGS

### Status Not Updating

1. **Check user is admin** - first user auto-gets admin, others need manual role grant
2. **Check browser console** - look for JavaScript errors
3. **Check server logs** - look for database errors
4. **Refresh page** - if stuck loading, try refresh

### Toast Notifications Not Showing

1. **Check browser console** - look for toast/Sonner errors
2. **Verify JavaScript enabled** - required for toast UI
3. **Check for console errors** - may prevent toast from rendering

---

## Test Data Summary

### Test Application 1 - Approval Test
- **Name:** Test Applicant
- **Email:** test@gmail.com (or your test email)
- **Purpose:** Test approval email delivery
- **Expected Status:** approved
- **Expected Action:** Should receive approval email with WhatsApp link

### Test Application 2 - Rejection Test
- **Name:** Rejected Applicant  
- **Email:** test2@gmail.com (or second test email)
- **Purpose:** Test rejection email delivery
- **Expected Status:** rejected
- **Expected Action:** Should receive rejection email

### Test Application 3 - Failure Handling Test
- **Name:** Failure Test User
- **Email:** test+unique@example.com
- **Purpose:** Test email failure handling
- **Expected Status:** approved
- **Expected Action:** Status updates even if email fails

---

## Verification Checklist

Use this checklist to confirm everything works:

- [ ] Application form submits successfully
- [ ] Admin can see registered users in dashboard
- [ ] Approve button changes status to "approved"
- [ ] Approve sends email with correct recipient name
- [ ] Email contains all required content
- [ ] Email has proper formatting and branding
- [ ] Reject button changes status to "rejected"
- [ ] Reject sends email with respectful tone
- [ ] Email failures don't block database updates
- [ ] Status filtering works (all/pending/approved/rejected)
- [ ] Receipt viewing works
- [ ] Delete functionality works
- [ ] Toast notifications show correct messages
- [ ] Special character names display correctly in emails
- [ ] WhatsApp link appears in approval emails (when configured)

---

## Performance Notes

- **Email delivery time:** Usually 0-2 minutes
- **Database update:** Instant (< 100ms)
- **Dashboard refresh:** Automatic via React Query (no manual refresh needed)
- **Concurrent operations:** Should handle multiple simultaneous approvals

---

## Next Steps After Testing

If all tests pass:
1. Deploy to production
2. Configure RESEND_API_KEY in production environment
3. Configure WHATSAPP_GROUP_LINK with actual group link
4. Test with real applicants
5. Monitor Resend dashboard for email delivery

If issues found:
1. Check EMAIL_IMPLEMENTATION.md for detailed architecture
2. Review server logs: `[Email]` prefixed messages
3. Verify environment variables are set correctly
4. Check Resend documentation: https://resend.com/docs
