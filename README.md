# side-projects

A home for small standalone web tools and experiments. Each project lives in
its own subfolder and is served from a path-based URL, so adding a new project
is just adding a new folder — no extra configuration.

## Structure

```
/                 → landing page linking to each project
/vent/            → "Vent or Seal?" dew-point tool (installable PWA)
/mileslip/        → "Mile·Slip" daily work-code mileage tracker
```

## Projects

### Vent or Seal? — `/vent/`
Compares indoor vs. outdoor dew point to tell you whether outdoor air is dry
enough to ventilate, or whether you should keep the house sealed.

- Plain HTML/CSS/JS, no build step, no dependencies.
- Live weather via [Open-Meteo](https://open-meteo.com/) (keyless, CORS-enabled).
- Installable PWA with offline support: a service worker (scoped to `/vent/`)
  caches the app shell so the tool opens offline and shows the last fetched
  reading. Live weather still requires a connection; fetch failures degrade
  gracefully to manual entry.

### Mile·Slip — `/mileslip/`
A daily mileage logger for field work. Pick the codes worked that day, assign a
town to each driving code, and it builds the route between job sites and tallies
miles. Per-leg distances are entered once and reused as the saved audit number.
Produces a copyable daily slip of codes and route.

- Plain HTML/CSS/JS, no build step, no dependencies.
- All data is kept locally in `localStorage` (nothing leaves the device).

## Deploy (Netlify, git-based)

1. Connect this repo to a Netlify site: **Add new site → Import an existing
   project → GitHub → this repo.**
2. Build command: *(none)*. Publish directory: **repo root** (`.`).
3. Every push to `main` auto-deploys.

URLs are path-based, e.g. `https://<site>.netlify.app/vent/`.

## Adding a new project

1. Create a new top-level folder (e.g. `/foo/`) with its own `index.html`.
2. If it's a PWA, scope its service worker and manifest to that folder and use
   relative asset paths (see `/vent/` for a working example).
3. Add a link to it on the root `index.html`.
4. Commit and push — Netlify deploys it at `/foo/`.
