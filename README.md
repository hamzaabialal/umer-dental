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
2. Add the environment variables from `.env.example` (set `APP_URL` to the live domain).
3. Deploy. Patient links and calendar subscriptions only work once the app is on a public URL.

## Website booking API

The clinic website's appointment form posts to `POST /api/public/bookings`. Each booking creates the patient
(or reuses them if the same name + phone already exists), adds an appointment marked **Website** in the calendar,
and sends Dr. Umar a WhatsApp alert with the details and a link to open it.

**Request** (JSON or form data):

| Field | Required | Example |
|---|---|---|
| `name` | yes | `Ali Khan` |
| `phone` | yes | `0300 1234567` |
| `branch` | yes | `Bahria` or `PWD` |
| `date` | yes | `2026-10-20` (today up to 90 days ahead) |
| `time` | yes | `17:30` (24-hour, clinic time) |
| `treatment` | no | `Dental Implant` |
| `message` | no | free text, up to 500 characters |
| `company` | no | hidden honeypot: leave empty; bots that fill it are silently ignored |

**Responses:** `201 {"ok":true,"appointment":{…},"calendarUrl":"…/a/<token>"}`. A repeated submit of the same booking
returns `200` with the same appointment. Errors return `{"ok":false,"error":"<message to show the patient>"}` with
`403` (site not allowed), `422` (invalid input) or `429` (more than 5 per hour per IP or 3 per day per phone).

**Access:** browsers must call from an origin listed in `BOOKING_ALLOWED_ORIGINS`. A server can call instead with
the header `X-Api-Key: <BOOKING_API_KEY>`.

**WhatsApp alerts** go to `NOTIFY_WHATSAPP_TO`. Set up one provider:

- **CallMeBot (free, 1 minute):** from Dr. Umar's WhatsApp, follow https://www.callmebot.com/blog/free-api-whatsapp-messages/
  (save their number and send the activation message). It replies with an API key. Put that key in `CALLMEBOT_APIKEY`.
- **Meta WhatsApp Cloud API (official):** create a utility template whose body uses `{{1}}` name, `{{2}}` phone,
  `{{3}}` branch, `{{4}}` date and time, `{{5}}` treatment, `{{6}}` message, `{{7}}` link. Once approved, set
  `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_TEMPLATE`. This takes priority over CallMeBot.

A failed alert never fails the booking; it is logged in the Vercel function logs.

## Notes

- Dates are stored as `YYYY-MM-DD` text in clinic time (Asia/Karachi); money is whole rupees.
- Historical invoices kept only a procedure summary, so each shows as a single line; historical patients have no
  age/gender/address until it's filled in on their next visit.
- Settings → upload the doctor's signature (PNG) so it prints above the signature line.
