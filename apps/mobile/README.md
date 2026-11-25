# BuildBrief for iOS and Android

The native BuildBrief app: describe an idea, get a full blueprint, build a
working version of the app, and track the work, on your phone. It uses the
**same accounts, projects and AI** as the website, so anything you start on
your phone shows up on your computer and the other way round.

Built with Expo (SDK 58), Expo Router, TypeScript, Supabase, Reanimated,
Expo Haptics and Expo Audio. Every screen is native React Native: no
embedded website. The one web view plays an app you've *built*, and it runs
sandboxed with no access to BuildBrief's session.

## What's inside

| Area | What it does |
| --- | --- |
| **Home** | Greeting, quick idea box, overall progress, Continue building, recent projects, recommended templates, saved blueprints |
| **Projects** | Search, filters (Blueprints, Built apps, Completed, Archived), pull to refresh, long-press for Duplicate / Archive / Delete |
| **Create** | 11 categories, idea, audience, plus optional experience level, budget, platforms, timeframe, technology and extra notes → **Generate Blueprint** |
| **Templates** | 14 searchable templates (SaaS Starter, Mobile App, AI Chatbot, E-commerce, Social, Productivity, Fitness, Finance, 2D Game, 3D Game, MMORPG, Educational, Portfolio, Developer Tool); every field stays editable before generating |
| **Project workspace** | Overview (status, progress, editable summary), Build App, Features, Tasks (interactive checklist that autosaves), Blueprint (all sections, each copyable), Architecture, Dev (AI prompt, CLAUDE.md, AGENTS.md, build/testing/deployment plans), Export |
| **Build App** | Starts BuildBrief's app builder on the server, shows live progress from the real job status, then opens the playable app full-screen. Share it as a file or rebuild it |
| **Export** | Native share sheet for Markdown, plain text, JSON, the AI coding prompt, CLAUDE.md and AGENTS.md, plus copy / share-as-message |
| **Settings** | Name, theme (auto / light / dark), text size, motion (follow phone / reduced / full), sound on/off + volume + test, haptics, notifications, password reset, sign out, delete account |

Also: secure session storage (Keychain / Keystore), automatic token refresh,
offline copies of synced projects and blueprints, skeleton loading states,
push notifications when a blueprint or app finishes, deep links
(`buildbrief://project/<id>`), keyboard-aware forms, safe areas, Android
back button, screen-reader labels, and phone and tablet layouts.

## Setup

### 1. Server side (once)

The app talks to the same Supabase project and Vercel deployment as the
website. In the Supabase SQL Editor, run the root repo's
`supabase/migrations/0005_mobile_app.sql`. It adds the archive and task
columns, the push-token column, and the `delete_my_account()` function. It
only adds things; existing data is untouched.

Also make sure the website (with this repo's latest code) is deployed, since
the app calls its `/api/projects/*` routes.

### 2. Configure the app

```bash
cd apps/mobile
cp .env.example .env
```

Fill in `.env` with the same Supabase URL and publishable key as the website,
and the website's address. These are public values; **no secret keys go in
the app.**

### 3. Run it

**Windows, the easy way:** double-click **`start-buildbrief.cmd`** in this
folder. It checks your setup, installs everything the first time, and
starts the app with a QR code. Scan the QR code with **Expo Go** on your
phone, and keep the window open while you use the app.

**Any computer, from a terminal in `apps/mobile`:**

```bash
npm run setup     # checks everything and installs packages (npm ci) if needed
npm run tunnel    # start + QR code that works on any network
# or: npm start   # same, but your phone must be on the same Wi-Fi
```

Push notifications need a development build (below); everything else works
in Expo Go.

### If something goes wrong

Run `npm run check`. It tells you, in plain words, what's wrong and how to
fix it: Node.js version, an Expo version that was changed, missing packages,
or a `.env` with a missing or wrong key.

> **Never run `npm audit fix --force` in this folder.** npm suggests it
> after installs, but for Expo apps it downgrades Expo to an old version and
> the app stops starting (`Package subpath './src/lib/TerminalReporter' is not
> defined by "exports"`). If that already happened, download a fresh copy of
> the project, copy your `.env` into `apps/mobile`, and start again. The
> audit warnings are about build tools on your computer, not the app itself;
> `.npmrc` hides the summary so nobody gets tempted. Run `npm audit` if you
> want to see it.

## Testing

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint (expo config)
npx expo export --platform ios --platform android   # proves both bundles build
```

Manual checklist on a device:

1. Sign up, sign out, sign in, then "Forgot password" (the email link opens the website's reset page).
2. Create from a template, then watch the blueprint progress; a notification arrives on a dev build.
3. Open the workspace: tick tasks, then pull to refresh on another device and see them synced.
4. Build App, then open the app, restart it and share it.
5. Export each format through the share sheet.
6. Turn on airplane mode: projects and blueprints you've opened still load.
7. Settings: switch theme, text size, motion, volume and haptics, then delete a test account.

## Builds and releases (EAS)

`eas.json` has three profiles:

| Profile | Use | Output |
| --- | --- | --- |
| `development` | Day-to-day testing with a dev client (needed for push notifications) | Internal install |
| `preview` | Share a test build with friends | Android **APK**, internal iOS build |
| `production` | App Store / Google Play | iOS build for TestFlight, Android App Bundle |

```bash
npm install -g eas-cli
eas login
eas init                 # links an EAS project and fills extra.eas.projectId (needed for push)
eas build --profile preview --platform android    # an installable APK
eas build --profile production --platform ios     # then: eas submit -p ios  (TestFlight)
eas build --profile production --platform android # then: eas submit -p android
```

App identifiers: iOS `com.buildbrief.app`, Android `com.buildbrief.app`
(change them in `app.json` before your first store upload if you want
different ones). Versions come from `version` in `app.json`; build numbers
auto-increment on production builds.

### Store checklist

- Apple Developer Program ($99/year) and a Google Play Console account ($25 one-time).
- Store listing: name, subtitle ("From idea to application"), description, screenshots (phone and tablet), and the icon in `assets/icon.png`.
- **Privacy details:**
  - Collected: email address and name (account), plus user content (project ideas, blueprints, built apps).
  - Used only to provide the app's features. Not used for tracking or advertising. Not sold or shared.
  - Users can delete their account and all data in Settings.
  - Push tokens are stored only to send "your blueprint/app is ready" notifications.
- Permissions: notifications only (asked the first time you sign in). No camera, microphone, location or contacts. Android's only declared permission is internet access.
- Export compliance: `ITSAppUsesNonExemptEncryption` is `false` (standard HTTPS only).
- Supabase's built-in email sender is very limited; set up custom SMTP in Supabase before launch so sign-up and reset emails arrive.

## Project layout

```
app/                    Screens (Expo Router)
  _layout.tsx           Providers, signed-in/out routing, splash, notifications
  (auth)/               Welcome, sign in, sign up, forgot password
  (tabs)/               Home, Projects, Create, Templates, Settings + custom tab bar
  project/[id]/         Workspace and full-screen app player
src/
  components/           UI kit (Button, Card, Chip, Sheet, ProgressBar, Skeleton…) + workspace tabs
  lib/                  Supabase client, API client, data layer, cache, settings, sounds/haptics, polling, templates
  shared/               Types, Markdown export and audio booster shared with the website
  theme/                Light/dark palettes and theme provider
assets/                 Icons, splash, and generated sound effects
scripts/generate-sounds.mjs
```
