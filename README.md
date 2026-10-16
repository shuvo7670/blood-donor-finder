# রক্তবন্ধু — Blood Donor Finder

A mobile-first Next.js app for finding blood donors near a location on a map.

## Features

- **Find donors near you** (`/find`): search from your GPS location, a listed area, or a point you tap on the map.
  - Filter by radius (2–50 km or any distance) and by blood group.
  - "Compatible groups" shows every donor group the patient can receive, e.g. B+ → B+, B−, O+, O−.
  - "Available now" hides donors whose last donation was under 120 days ago or who switched themselves off.
  - Results are sorted nearest first, and the map and list stay in sync.
  - Each donor has Call, WhatsApp and directions buttons. The URL can be shared.
- **Emergency requests** (`/requests`): post a request with blood group, number of bags, hospital location and how urgent it is.
  - Requests are sorted by urgency.
  - "Find nearby donors" opens a search around the hospital.
  - A request can be marked as fulfilled.
- **Donor registration** (`/register`): sign up with your location picked on the map or by GPS. The server validates the form and rejects duplicate phone numbers.
- **Eligibility check** (`/eligibility`): checks age, weight, the gap since the last donation and health questions. Includes a blood-group compatibility chart and donation tips.
- **Home page**: live statistics, a chart of donors by group, the most urgent requests and a quick search.
- Bengali interface, bottom tab bar on phones, and a web manifest so the app can be installed.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

On first run, `data/db.json` is created from the seed: 172 demo donors in 24 areas of 11 cities, and 6 requests. `npm run db:reset` deletes it and starts over.

### Google Maps

Without a key the app uses OpenStreetMap, which is free and needs no key. To use Google Maps instead:

```bash
cp .env.example .env.local
# put a key with "Maps JavaScript API" enabled into NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/donors?lat&lng&radius&group&compatible=1&eligible=1&q` | Encode `+` in the group as `%2B` |
| POST | `/api/donors` | Register a donor |
| GET | `/api/donors/:id` | One donor |
| GET | `/api/requests?status=open\|all&group&lat&lng` | List requests |
| POST | `/api/requests` | Post a new request |
| PATCH | `/api/requests/:id` | `{ "status": "fulfilled" }` |
| GET | `/api/stats` | Counts for the home page |

## Before going to production

- `src/lib/db.ts` is a JSON-file store. Replace it with a database such as PostgreSQL/PostGIS or MongoDB; serverless hosting has no writable disk.
- There is no login, so anyone can mark a request as fulfilled. Add phone OTP verification and spam protection.
- GPS only works over HTTPS or on `localhost`.
