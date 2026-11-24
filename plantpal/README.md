# PlantPal 🪴

A small, friendly Expo app that reminds you when to water your houseplants.

Add each plant with a photo and how often it needs water. The home screen shows
which plants need attention, a morning reminder names any thirsty ones, and a
tap on **Watered** resets the timer. Everything is stored on the device, with no
accounts and no server.

## Run it

```bash
cd plantpal
npm install
npx expo start
```

Then scan the QR code with **Expo Go** on your phone (iOS or Android), or press
`a` / `i` for an Android emulator or iOS simulator.

Local reminders work in Expo Go. For the most reliable notification behaviour
(and before publishing), make a development build:
`npx expo run:android` / `npx expo run:ios`, or `npx eas-cli@latest build --profile development`.

## How it works

| Piece | Where |
| --- | --- |
| Screens: Home, Add, Detail, Edit | `src/screens/` |
| Navigation (native stack) | `src/navigation/` |
| SQLite schema and migrations | `src/services/database.ts` |
| Add / edit / delete / water | `src/services/plantService.ts` |
| Morning reminders | `src/services/notificationService.ts` |
| Saving picked photos | `src/services/photoStorage.ts` |
| Status and date maths | `src/utils/dateHelper.ts` |

### Status rules

- **Overdue**: it's been at least *interval* days since the last watering.
- **Due Today**: it will be overdue tomorrow.
- **Watered**: everything else. A new plant counts as watered on the day it's added.

### Reminders

A scheduled notification's text is fixed when it's scheduled, so PlantPal
schedules the next 7 mornings (9:00 local time) one by one, each naming the
plants that will be overdue that day. The schedule is rebuilt whenever a plant
is added, edited, watered or deleted, and whenever the app opens. Mornings with
nothing overdue get no notification. Tapping a reminder opens the home screen.
Change the time with `REMINDER_HOUR` / `REMINDER_MINUTE`.

### Database

- `plants`: id, name, watering_interval_days, photo_uri, created_at, last_watered_date
- `watering_log`: id, plant_id → plants.id (cascade delete), watered_date, created_at

Dates the user cares about (`last_watered_date`, `watered_date`) are stored as
local `YYYY-MM-DD` strings so "today" always means the user's today.

## Checks

```bash
npx tsc --noEmit
npx eslint .
```
