# Shikkha Chat — Connected OS

Next.js 16 front end for the Shikkha Chat Connected OS: a public marketing site
plus a signed-in panel backed by a Frappe v16 / ERPNext v16 whitelist API
([`shikkha_os`](https://github.com/ioniccorporationbd/shikkha_os)).

## Getting started

```bash
npm install
cp .env.example .env.local     # set FRAPPE_BASE_URL
npm run dev                    # http://localhost:3000
```

### Environment

| Variable | Scope | Purpose |
|---|---|---|
| `FRAPPE_BASE_URL` | **server only** | Base URL of the ERP site, e.g. `https://dash.example.com`. Never prefix with `NEXT_PUBLIC_` — the browser must not talk to Frappe directly. |
| `FRAPPE_DEBUG_LOG` | **server only** | `1` (default) prints portal-side request logging on the Next.js server output — host, HTTP status and the ERP's exception type per failed call. `0` silences it. |

## Routes

| Route | Renders |
|---|---|
| `/` | Marketing site (sidebar + long-form content) |
| `/login` | Sign-in page |
| `/userDashboard` | Signed-in panel |
| `/api/auth/login` | `POST` → ERP `auth.login`, stores the ERP `sid` as an HttpOnly cookie |
| `/api/auth/logout` | `POST` → drops the ERP session, clears the cookie |
| `/api/auth/me` | `GET` → session probe (also the keep-alive) |
| `/api/dashboard/overview` | `GET` → dashboard payload |

`/`, `/login` and `/userDashboard` live in route groups (`(site)`, `(auth)`,
`(dashboard)`) so each can have its own shell: the marketing sidebar is not
rendered on the auth or dashboard routes, while the URL paths stay unchanged.

## How authentication works

The browser never receives credentials for the ERP and never calls Frappe
directly:

```
browser ──axios──▶ /api/auth/*  (Next route handler)  ──fetch──▶ ERP /api/method/shikkha_os.*
   ▲                    │
   └── HttpOnly cookie ─┘  (the ERP `sid`, scoped to this origin)
```

* **The `sid` never reaches JavaScript.** The route handler pulls it out of
  Frappe's `Set-Cookie` and re-issues it as an HttpOnly cookie on the portal
  origin, so it survives cross-origin setups too.
* **Frappe errors are normalised.** A `frappe.throw()` (HTTP 417) is rewritten
  to `200 { success: false, message }` so the UI shows the real backend message
  instead of "Request failed with status code 417". Genuine session failures
  keep their status (`401`).
* **`x-forwarded-host` is set to the ERP host**, never the portal host — Frappe
  resolves the *site* from that header, and getting it wrong makes every
  authenticated call arrive as Guest.
* `src/proxy.ts` (Next 16's rename of `middleware.ts`) redirects
  `/userDashboard` → `/login` when the cookie is absent. It is only a cheap
  gate: the page itself re-verifies against the ERP.

Sign-in is the **only** POST that carries a session-less request; every
authenticated call is a GET, because Frappe enforces a CSRF token on
cookie-authenticated non-GET requests that a stateless proxy cannot mint.

## Troubleshooting: `502 (Bad Gateway)` on sign-in

A 502 from `/api/auth/login` is never a portal bug: it means the ERP did not
answer with a usable response. The browser console shows only the status, so the
portal logs the cause on the **server** output and repeats it in the response
body:

```
[frappe] shikkha_os.api.v1.auth.login -> dash.example.com failed: host=dash.example.com status=500 excType=IndexError
[auth]   login rejected for someone@example.com: code=upstream_error status=502 message=...
```

| Server log | Cause | Fix |
|---|---|---|
| `status=500 excType=…` on *every* route, `/` included | The site itself is broken (bad vhost, failed migration, dead bench) | `tail -n 80 ~/frappe-bench/logs/web.error.log`, then `bench --site <site> migrate` and `bench restart` |
| `status=417 … App shikkha_os is not installed` | Hostname is a healthy Frappe site, but the app lives on another one | `bench --site <site> install-app shikkha_os` |
| `unreachable=true reason=ENOTFOUND` | Wrong hostname / DNS | Re-check `FRAPPE_BASE_URL` |
| `configured=false` | `FRAPPE_BASE_URL` is empty | Set it in `.env.local` |

One command walks the whole chain — configuration, DNS/TLS, the Frappe site, the
app and the login endpoint — and names the first failing link:

```bash
npm run check:erp                                   # uses FRAPPE_BASE_URL
npm run check:erp -- --base https://dash.example.com # test a candidate host
npm run check:erp -- --probe-login                  # also POST a fake sign-in
```

Two hostnames can point at the same server while only one is a working site, so
probe before assuming the code is at fault.

Failed sign-ins are also recorded **on the ERP**, in Error Log
(`shikkha_os: failed login`, and `shikkha_os: login server error` for unexpected
exceptions that carry the traceback). The record holds the account, the caller IP
and the User-Agent — never the password. Turn the failed-sign-in entries off per
site with:

```bash
bench --site <site> set-config shikkha_os_log_failed_logins 0
```

## UI notes

* The sign-in button sits in the sidebar immediately right of the logo, and
  swaps to the avatar + Dashboard chip once a session exists.
* Copy is bilingual (Bangla first). Components under `src/components/auth` and
  `src/components/dashboard` render their own labels from `src/lib/**/copy.ts`
  and opt out of the language provider's DOM walker via
  `data-no-translate="true"`.
* **Tailwind caveat:** this project ships unlayered reset rules
  (`a { color: inherit }`, `button, a, input, textarea, select { font: inherit }`)
  that outrank Tailwind's layered utilities. On `<a>`/`<button>`/`<input>` put
  colour/size/weight on an inner `<span>`, and pass icon sizes as the react-icons
  `size` prop — otherwise those utilities silently do nothing.

## Local development without a backend

`scripts/mock-frappe.mjs` is a dependency-free stub that speaks the same wire
contract (including Frappe's status codes), so the whole flow can be exercised
without a bench:

```bash
node scripts/mock-frappe.mjs                       # terminal 1
FRAPPE_BASE_URL=http://127.0.0.1:8787 npm run dev  # terminal 2
```

Sign in with `tamim@ioniccorporation.com` / `demo1234`. Never use it in
production.

## Scripts

```bash
npm run dev            # dev server (Turbopack)
npm run build          # production build
npm run start          # serve the production build
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npm run check:erp      # diagnose the portal -> ERP chain
```

> `next.config.ts` sets `typescript.ignoreBuildErrors: true`, so `npm run build`
> succeeds even when types are broken. **Always run `npx tsc --noEmit`** before
> pushing.
