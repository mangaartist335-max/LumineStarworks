# BuildBrief: App Store submission kit

Everything you paste into **App Store Connect**, plus the steps. Screenshots
are in [`screenshots/`](screenshots/): 7 images at **1320 × 2868**, the
6.9-inch iPhone size Apple asks for. Smaller iPhone sizes are generated from
them automatically.

---

## 1. Before you start (one time)

1. **Join the Apple Developer Program:** https://developer.apple.com/programs/enroll
   - Choose **Individual** ($99/year). Sign in with your Apple ID (two-factor authentication must be on).
   - Approval is often same-day but can take up to 48 hours.
2. **Make a demo account for Apple's reviewers.** On https://buildbrief-beta.vercel.app sign up with an email you control (for example a new Gmail), create one project, and build its app. Write down the email and password; they go in "App Review Information" below.
3. **Support email:** set `supportEmail` in `lib/site.ts` (website) so the Support and Privacy pages show it, and redeploy.

## 2. Build and upload (from Windows, no Mac needed)

Double-click **`publish-ios.cmd`** in `apps/mobile`. It runs the setup check, then:

| It asks | Answer |
| --- | --- |
| Log in to Expo | Your Expo account (xanex) |
| Create an EAS project for @…/buildbrief? | **Y** |
| Log in to your Apple account? | **Y**, then Apple ID, password and the 6-digit code from your phone |
| Generate a new Apple Distribution Certificate? | **Y** |
| Generate a new Apple Provisioning Profile? | **Y** |
| Set up Push Notifications? | **Y** |
| App Store Connect app name / SKU / language (first submit only) | `BuildBrief`, `buildbrief-ios`, English (U.S.) |

The cloud build takes about **15–25 minutes** (watch it at https://expo.dev). It then uploads to App Store Connect automatically. Apple needs about **10–30 minutes** to process the build.

**Tip:** install **TestFlight** on your iPhone. The build appears there for you to test the real app before you submit it for review.

## 3. App Store Connect: the listing

https://appstoreconnect.apple.com → **Apps → BuildBrief**

### App Information
- **Name** (30 max): `BuildBrief`
  If it's taken, try: `BuildBrief: Idea to App` or `BuildBrief – AI App Builder`
- **Subtitle** (30 max): `Turn ideas into real apps`
- **Category:** Primary **Developer Tools**, Secondary **Productivity**
- **Content rights:** "No, it does not contain, show, or access third-party content"

### Pricing and Availability
- **Price:** Free. Availability: all countries (or pick yours).

### Version page (1.0)
**Promotional text** (170 max, can be changed any time):
```
Describe any idea in your own words and get a full plan plus a working app you can play with, in minutes. No coding needed.
```

**Description:**
```
Turn any idea into a real app.

BuildBrief takes an idea you describe in your own words (an app, a website, a game, anything) and turns it into a complete plan and a working version you can try right away. No coding needed.

DESCRIBE IT
Type what you want to make, or start from one of 14 templates: SaaS Starter, Mobile App, AI Chatbot, E-commerce Store, Social Media, Productivity, Fitness, Finance Tracker, 2D Game, 3D Game, MMORPG, Educational App, Portfolio Website and Developer Tool. Add optional details like your experience level, budget, platforms and timeframe.

GET A COMPLETE PLAN
In about a minute, BuildBrief writes your blueprint: what it is, who it's for, the main features, ideas for later, every screen, how people will use it, and a step-by-step build checklist.

BUILD IT IN ONE TAP
Tap Build App and BuildBrief creates a working, playable version of your idea, with sound effects and sample content. Play it right on your phone, rebuild for a fresh take, or share it as a file.

TRACK EVERY STEP
Tick off tasks in your build checklist and watch your progress grow. Everything saves automatically.

FOR DEVELOPERS TOO
Every project also includes a recommended tech stack, architecture, database plan, API requirements, folder structure, testing and launch plans, plus a ready-to-paste AI coding prompt and CLAUDE.md / AGENTS.md files. Export as Markdown, text or JSON.

WORKS EVERYWHERE
Your projects sync between your phone and the BuildBrief website, so start on the bus and finish on your computer. Previously opened projects work offline.

MADE TO FEEL GOOD
Dark and light mode, adjustable text size, satisfying sounds with a volume control, gentle haptics and reduced-motion support.

Free to start: create up to 5 plans and 5 app builds every day.
```

**Keywords** (100 max, no spaces after commas):
```
app builder,ai,idea,no code,game maker,prototype,planner,mvp,blueprint,startup,developer,coding
```

- **Support URL:** `https://buildbrief-beta.vercel.app/support`
- **Marketing URL** (optional): `https://buildbrief-beta.vercel.app`
- **Copyright:** `2026 BuildBrief`
- **Screenshots → iPhone 6.9" Display:** upload the 7 images in `screenshots/`, in order.

### App Privacy (the "nutrition label")
**Privacy Policy URL:** `https://buildbrief-beta.vercel.app/privacy`

"Do you or your third-party partners collect data from this app?" → **Yes**

| Data type | Collected | Linked to the user | Used for tracking | Purpose |
| --- | --- | --- | --- | --- |
| Contact Info → **Email Address** | Yes | Yes | No | App Functionality |
| Contact Info → **Name** | Yes | Yes | No | App Functionality |
| User Content → **Other User Content** (ideas, plans, built apps) | Yes | Yes | No | App Functionality |
| Identifiers → **User ID** | Yes | Yes | No | App Functionality |
| Usage Data → **Product Interaction** (daily plan/build counts for limits) | Yes | Yes | No | App Functionality |

Everything else (location, contacts, health, financial info, browsing history, diagnostics, advertising data) is **not collected**. **No tracking.**

### Age Rating
Answer the questionnaire honestly. BuildBrief has no violence, mature, gambling, medical or contest content, and **no content is shared between users** (projects are private). Choose "No" for unrestricted web access: there's no web browser, and links from built apps open in the system browser.

### App Review Information
- **Sign-in required:** Yes. Enter your **demo account** email and password.
- **Contact:** your name, phone and email (Apple uses these only to reach you about the review).
- **Notes:**
```
BuildBrief turns a short text description of an app idea into a structured project plan, using Anthropic's Claude on our server (no AI keys are in the app).

How to test (demo account provided):
1. Sign in. The demo account already has a project with a plan and a built app.
2. Open the project to see its plan (Overview, Features, Tasks, Blueprint tabs). Tasks can be checked off and sync to our website.
3. "Build App" tab → "Open my app" plays the prototype that BuildBrief generated from the plan.
4. Create tab → pick a template → "Generate Blueprint" creates a new plan (about a minute; each account can make 5 plans and 5 app builds per day).

About "Build App": it generates a self-contained HTML/JavaScript prototype of the user's own idea. It is shown in a sandboxed WKWebView with no access to native APIs, the user's session or other users' content, and it does not change the app's own features (Guideline 4.7). Users can also export it as a file.

Account deletion: Settings → Delete account (permanently deletes the account and all data).
Sign-in is email/password only (no third-party login), so Sign in with Apple isn't required.
```

### Build and submit
1. In the **Build** section, click **+** and pick the uploaded build.
2. **Export compliance:** already answered in the app (standard HTTPS encryption only).
3. Click **Add for Review**, then **Submit to App Review**.

Review usually takes **1–3 days**. If Apple asks a question, reply in App Store Connect. Most first-time questions are about the demo account or what Build App does, and the notes above cover both.

---

## Later: Google Play
`eas build -p android --profile production` makes the Play Store bundle. New personal Play accounts must run a **closed test with 12+ testers for 14 days** before going public, so start that early. The first upload has to be done by hand in the Play Console.
