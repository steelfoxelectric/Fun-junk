# Releasing "Vent or Seal?"

No build step. Deploy = commit to `main` and push; Netlify redeploys in ~30–60s.

## Cutting a release

Bump the version in **three places**, keeping them identical:

1. `index.html` → `const APP_VERSION` (e.g. `'v1.4.0'`)
2. `index.html` → `const BUILD_DATE` (today, `YYYY-MM-DD`)
3. `service-worker.js` → `const VERSION` (match `APP_VERSION`)

Then commit + push to `main`.

Versioning: bump the **minor** for new features (scanner, history, etc.),
the **patch** for fixes/tweaks. The footer shows `APP_VERSION · BUILD_DATE`.

## Why the service-worker version matters

The SW cache name is `ventseal-shell-${VERSION}`. Bumping it gives each
release a fresh offline shell and makes the `activate` handler delete the
previous cache. Navigations are network-first, so online users get updates
immediately; the version bump is what refreshes the **offline** copy.

## After deploying

- Confirm Netlify deployed, then load https://fun-junk.netlify.app/vent/ and
  check the footer shows the new version + date.
- On phone: fully close and reopen the installed app once so the new service
  worker activates.
