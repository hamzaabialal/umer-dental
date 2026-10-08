# Umar Dental & Implant Center — Clinic System

Next.js 16 + Neon Postgres web app replacing the old single-file HTML trial.

## What it does

- **Secure logins**: bcrypt-hashed passwords, signed httpOnly session cookie, 15-minute lockout after 5 failed attempts.
  Roles: **admin** (everything + Settings/users), **doctor** (all branches), **receptionist** (own branch only).
- **Phone-first patient lookup** on every form; new patients get the next MR number (`UDC-B-…` / `UDC-P-…`).
- **Invoices / receipts** in the branded A4 layout: tooth/area, cash and card/online split, discount, pending amount,
  Google-review QR, doctor signature. Print / Save PDF, or send the patient a WhatsApp link (`/i/<token>`).
  Numbering continues from the old system (`UDC-INV-00754` onward). Later payments can be added to pending invoices.
- **Prescriptions** in the matching A4 layout with diagnosis, treatment done, medicine table and advice
  (common dental medicines auto-fill dose/instructions). WhatsApp link: `/r/<token>`.
- **Appointments**: week calendar; each booking generates a confirmation card. The WhatsApp confirmation contains a link
  (`/a/<token>`) where the patient taps **Add to Google Calendar / Apple Calendar (.ics) / Outlook**, with reminders
  1 day and 2 hours before. Staff can subscribe to a personal calendar feed under **My Account**.
- Dashboard, OPD visits, expenses, 6-month recalls with WhatsApp reminders, rate list, user management.

## Setup

```bash
cp .env.example .env.local      # fill in DATABASE_URL and SESSION_SECRET
npm install
node --env-file=.env.local scripts/migrate.mjs     # create tables (safe to re-run)
node --env-file=.env.local scripts/seed.mjs        # one-time import from ../Umar_Dental_Clinic_Management_FINAL_SEP2026.html
npm run dev
```

The seed prints the first passwords for `drumar` (admin), `bahria` and `pwd` once. Change them under **My Account**.

## Deploy (Vercel)

1. Push this folder to a private GitHub repo and import it in Vercel.
2. Add the three environment variables from `.env.example` (set `APP_URL` to the live domain).
3. Deploy. Patient links and calendar subscriptions only work once the app is on a public URL.

## Notes

- Dates are stored as `YYYY-MM-DD` text in clinic time (Asia/Karachi); money is whole rupees.
- Historical invoices kept only a procedure summary, so each shows as a single line; historical patients have no
  age/gender/address until it's filled in on their next visit.
- Settings → upload the doctor's signature (PNG) so it prints above the signature line.
