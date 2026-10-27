# Putting the Connected Era online with Vercel

The repository holds three apps. Your existing Vercel project keeps deploying the one at the root, exactly as before. The Connected Era needs two more projects from the same repository:

| Vercel project | Root Directory | What it serves |
| --- | --- | --- |
| e.g. `connected-era` | `connected` | The Connected Desktop (the whole 2012 computer) |
| e.g. `connected-era-yal` | `yal` | YourAnimeList, shown inside the desktop's browser |

Everything Vercel needs is already in the repository: `connected/vercel.json` and `yal/vercel.json` set the framework, install and build commands. Each project also skips building when a push didn't change its folder. No keys or tokens are needed.

## Before you start

`connected/` and `yal/` live on the `claude/youranimelist-2013` branch (pull request #15). Vercel's import screen browses your default branch, so **merge pull request #15 into `main` first**. If you'd rather not merge yet, use [the command-line route](#without-merging-first) at the end.

## 1. Create the YourAnimeList project

1. In Vercel, choose **Add New → Project** and import the **LumineStarworks** repository.
2. Name it, for example `connected-era-yal`.
3. Next to **Root Directory**, click **Edit** and choose `yal`. The framework shows as Next.js.
4. Leave the environment variables empty for now and click **Deploy**.
5. When it's done, copy its address, for example `https://connected-era-yal.vercel.app`.

## 2. Create the desktop project

1. **Add New → Project** again, with the same repository.
2. Name it, for example `connected-era`.
3. Set **Root Directory** to `connected`.
4. Under **Environment Variables**, add:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_YAL_ORIGIN` | the YAL address from step 1, e.g. `https://connected-era-yal.vercel.app` |

5. Click **Deploy** and copy this address too, for example `https://connected-era.vercel.app`.

## 3. Let YourAnimeList appear inside the desktop

YAL only lets sites it knows show it in a frame.

1. Open the YAL project, then **Settings → Environment Variables**, and add:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_YAL_EMBED_ORIGINS` | the desktop address from step 2, e.g. `https://connected-era.vercel.app` |

2. Go to **Deployments**, open the menu on the latest one and choose **Redeploy**. The setting is applied at build time, so it needs a fresh build.

That's it! Open the desktop address, pick a name and a picture, and you're in. Typing `yal.connectedera.local` in the desktop's browser now shows the hosted YourAnimeList.

## Good to know

- **Saving.** The desktop keeps everything (files, mail, chats, settings) in each visitor's own browser, so every visitor gets their own computer. Nothing is stored on Vercel.
- **YourAnimeList accounts.** Out of the box, YAL keeps sign-ups, list updates and forum replies in a temporary folder on Vercel's servers, so they don't last. Browsing works perfectly. For lasting accounts, connect a Supabase project (see "Using Supabase" in `yal/README.md`). Then add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the YAL project and redeploy.
- **Logging in to YAL from inside the desktop.** Every `*.vercel.app` address counts as a separate website to browsers, and they don't keep another site's login inside a frame. On two `vercel.app` addresses you can browse YAL inside the desktop, and logging in works when YAL is opened in its own tab. For logins inside the desktop too, give both projects custom domains under one domain you own (for example `desktop.example.com` and `yal.example.com`; **Settings → Domains**). Then update both settings above to the new addresses and redeploy.
- **Preview deployments.** Previews get their own temporary addresses, which aren't on YAL's list. In a preview, the desktop's browser shows a friendly "isn't responding" note for YAL instead of the site. Everything else works normally.
- **Your existing project.** Nothing about it changes. It keeps building the app at the repository root.

## Without merging first

You can create both projects from your own computer with the Vercel command line, straight from the branch:

```bash
git checkout claude/youranimelist-2013
npm i -g vercel
vercel login

cd yal
vercel                      # answer the questions; this links and deploys the YAL project
vercel --prod               # note the address it prints

cd ../connected
vercel                      # links the desktop project
vercel env add NEXT_PUBLIC_YAL_ORIGIN production    # paste the YAL address
vercel --prod               # note the desktop address

cd ../yal
vercel env add NEXT_PUBLIC_YAL_EMBED_ORIGINS production   # paste the desktop address
vercel --prod               # rebuild YAL with it
```

Run each `vercel` command from inside its folder, so each project picks up its own `vercel.json`.
