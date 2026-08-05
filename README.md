# Camp Connect

Build a clean, modern, mobile-first registration website for the CFG Summer Camp.

I will upload the CFG logo and the official camp flyer. Use the flyer as the design reference. Match the colors, typography, and overall branding. Do not redesign the logo or change any information from the flyer.

The website should have two parts:

1. Public Landing Page

2. Simple Admin Dashboard

PUBLIC LANDING PAGE

Include the following sections:

- Hero section with the camp title, dates, venue, and a "Register Now" button

- About the camp

- Camp activities

- Camp fee and payment instructions

- Frequently Asked Questions

- Contact information

- Footer

Use the information from the flyer wherever possible.

REGISTRATION FORM

Create a simple registration form with these fields:

- Full Name

- Date of Birth

- Gender

- School

- Parent/Guardian Name

- Parent/Guardian Phone Number

- Email Address

- Home Address

- Emergency Contact

- Upload Proof of Payment (Image or PDF)

After submitting the form:

- Save the registration in the database.

- Upload the payment receipt to storage.

- Set the participant's status to "Pending Approval."

- Show a success message telling the participant that their registration is awaiting verification.

ADMIN DASHBOARD

Create a password-protected admin dashboard.

The dashboard should display:

- Total registrations

- Pending registrations

- Approved registrations

Display all participants in a table with:

- Name

- Phone Number

- Email

- Registration Date

- Status

When an admin clicks on a participant, show all submitted information along with the uploaded payment receipt.

Provide three buttons:

- Approve

- Reject

- Delete

APPROVAL

When a participant is approved:

- Change their status to Approved.

- Automatically send an email confirming their registration.

- Include a button that links to the official WhatsApp group.

The email should congratulate them, confirm that their registration has been approved, and invite them to join the WhatsApp group.

SETTINGS

Create a simple Settings page where the admin can update:

- Camp name

- Camp dates

- Venue

- Camp fee

- WhatsApp group link

- Contact phone number

- Contact email

The public website should update automatically whenever these settings are changed.

DESIGN

The design should be clean, colorful, professional, and friendly for parents and students.

Use rounded cards, modern fonts, subtle animations, and make the entire website fully responsive.

Keep the project simple, easy to maintain, and avoid unnecessary complexity. Focus on a smooth registration experience and a straightforward admin approval workflow.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/43a8e232-b0c4-44c1-b294-cc99d47e3634).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
