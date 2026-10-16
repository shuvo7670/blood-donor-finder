# রক্তবন্ধু — Blood Donor Finder

A mobile-first Next.js app for finding blood donors near a location on a map. It has an approval workflow and an admin panel.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

The database is SQLite, using Node's built-in `node:sqlite` (Node 22.13 or newer), so there is nothing extra to install. On first run, `data/app.db` is created and filled with demo data:

- 172 donors, 6 of them waiting for approval
- 6 requests, 2 of them waiting for approval
- 2 reports and 8 blood banks

`npm run db:reset` deletes the database. Stop the dev server first, because it keeps the file open.

### Demo logins

| Who | Where | Login |
| --- | --- | --- |
| Admin | `/admin` | `admin` / `admin123` (must be changed on first login; set your own with `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `.env.local`) |
| Demo donor | `/me` | Any seeded donor's phone number (shown after "নম্বর দেখুন" on `/find`), PIN `1234` |

### Google Maps

Without a key the app uses OpenStreetMap. To use Google Maps, put a key with "Maps JavaScript API" enabled into `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`. See `.env.example`.

## Features

### Public

- **Find donors** (`/find`): search by GPS, a listed area or a point tapped on the map.
  - Filter by radius, blood group, compatible groups and "available now".
  - Phone numbers are masked; "নম্বর দেখুন" reveals one at a time, rate-limited per IP.
  - Call, WhatsApp, directions and report buttons on each donor.
- **Emergency requests** (`/requests`): posting a request gives a **private manage link**.
  - The requester uses it to see who responded and to mark the request fulfilled or closed.
  - Donors and guests can reply "আমি দিতে পারব" (I can give).
- **Blood banks** (`/blood-banks`): blood banks and volunteer organisations on a map, nearest first.
- **Eligibility check** (`/eligibility`): age, weight, donation gap and health questions, plus a compatibility chart.

### Donor account (`/me`)

Donors sign in with their phone number and PIN. From the account page they can:

- See their approval status, and the reason if they were rejected or suspended.
- Turn availability on or off.
- Log donations. The last donation date and the next eligible date update on their own.
- See open requests within 30 km that their blood group can serve, and respond to them.
- Edit their profile, change their PIN, or delete their account.

### Admin panel (`/admin`)

| Page | Who | What it does |
| --- | --- | --- |
| Dashboard | All staff | Approval queue counts, statistics, recent activity |
| Donors | All staff | Approve, reject (with reason), suspend, reinstate, verified badge; full details, reports and history. Admins can delete |
| Requests | All staff | Approve and publish, reject, fulfil, close, reopen; see responses. Admins can delete |
| Reports | All staff | Resolve or dismiss user reports, and act on the reported donor or request directly |
| Blood banks | All staff | Add and edit entries, hide or show them on the public page |
| Staff | Admins | Add moderators and admins, change roles, deactivate, reset passwords |
| Settings | Admins | Auto-approve switches, home-page announcement |
| Activity log | Admins | Who approved, rejected or changed what, and when |

### Approval rules

- **New donors** stay hidden from search until approved. This can be switched to auto-approve in Settings.
- **New requests** wait for approval before going public. Requests from logged-in approved donors are published immediately. This can also be switched to auto-approve.
- **Suspended or rejected donors** disappear from search and see the reason on their profile.

## Security

- PINs and passwords are hashed with scrypt. Sessions are httpOnly cookies backed by a session table.
- Request manage links carry a random token; only its sha256 hash is stored.
- Rate limits apply to logins, PIN changes, number reveals, registrations, posts and reports.
- Staff must change a default or reset password before anything else works.
- At least one active admin must always remain.
- Every moderation action is written to the activity log.

## Before going to production

- Rate limits live in process memory. With several servers, move them to Redis.
- SQLite is fine on a single server (a VPS). For serverless hosting, move to PostgreSQL.
- Add phone OTP for donor registration and PIN reset (today an admin has to reset a forgotten PIN).
- GPS only works over HTTPS or on `localhost`.
