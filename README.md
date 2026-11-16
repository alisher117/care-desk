# Care Desk

A one-way support desk: people submit requests through an in-app widget, operators work them in a dashboard. Each request becomes a numbered ticket with a category, priority, assignee, due date, notes and a status that moves through open, pending, resolved and closed. Status changes need a comment, which is emailed to the requester.

Next.js 15 (App Router), React 19, Tailwind v4, PostgreSQL.

> **This shell has no authentication.** Every visitor is the same requester, and anyone who opens `/desk` is an operator with admin rights. Keep it on a trusted network until you replace [`src/care-desk/host/identity-adapter.ts`](src/care-desk/host/identity-adapter.ts).

## Quick start

```bash
npm install
cp .env.example .env.local      # set CARE_DESK_DATABASE_URL to an empty database
npm run migrate                 # creates the schema, no data
npm run dev
```

- `http://localhost:3000/en` is a placeholder host page with the widget.
- `http://localhost:3000/en/desk` is the operator dashboard.

| Command | What it does |
| --- | --- |
| `npm run migrate` | Applies pending SQL migrations, once each. `npm run migrate -- status` only lists them. |
| `npm run build` | Production build. This is the gate; `tsc` alone is not enough. |
| `npm test` | Vitest unit tests. |
| `npm run lint` | ESLint, including the import boundary below. |
| `npm run email:preview` | Writes every notification email to `email-preview-*.html`. |

The database starts with the schema and six seed categories (IT and Finance visible in the widget). There are no tickets, operators or users. The first request to the dashboard creates the operator row for the dev operator.

## Layout

```
src/
  care-desk/
    core/      domain, state machine, services, repositories, SQL migrations
    config/    name, branding, locales, English labels, locale files
    web/       widget, dashboard, API client (React, no host knowledge)
    host/      everything specific to the app the desk is mounted in
  app/
    [locale]/page.tsx                 placeholder page that mounts the widget
    [locale]/desk/[[...slug]]/        dashboard page
    api/care-desk/                    route handlers
scripts/
  migrate.mjs, email-preview.mts
```

**The one rule:** `core/`, `web/` and `config/` never import from the host app or from `host/`. Only routes and pages import `host/`. ESLint enforces it (`no-restricted-imports` in `eslint.config.mjs`). This is what keeps the desk liftable into another app.

## Where to plug things in

| To change | Edit | Notes |
| --- | --- | --- |
| Name, colour, font, logo, locales | `config/config.ts` | The colour drives the dashboard, widget and emails. |
| Who the user is (auth) | `host/identity-adapter.ts` | Implement `IdentityAdapter` against your session. Return `null` to deny. `moderator: true` is the admin flag: it can assign tickets and manage categories. |
| Denied responses, login redirect | `host/route-guards.ts`, `web/routes.ts` | Answer 401 with `reason: "session_idle"` or `"session_ended"` and set `LOGIN_PATH`; the dashboard then redirects to it. |
| Sign-out button | `app/[locale]/desk/[[...slug]]/page.tsx` | Pass `onSignOut` to `<CareDeskDashboard>`; the menu item appears when it is set. |
| Operator list, operator contacts | `host/operator-directory.ts` | Care Desk stores only the host user id. Look up email, locale and "still has access" in your user store. |
| Account page fields | `host/operator-profile.ts` | Phone, department, position, last sign-in are empty until you fill them. |
| Requester details on a ticket | `Requester.profile` in the identity adapter | Any key/value pairs; they are snapshotted onto the ticket. `phone` is also copied to the contact column. |
| UI translations | `config/locales/*.json`, `host/labels.ts` | English in `config/labels.ts` is the source of truth. A missing or broken value falls back to English. |
| Email wording | `host/email-copy.ts` | English and Russian. Other locales get English. |
| Email delivery | `SMTP_*` in `.env.local` | Without `SMTP_HOST`, emails are logged and skipped. |
| Dashboard URL | `web/routes.ts` + move the page folder | Default `/desk`. |

## Mounting the widget in another app

```tsx
import CareDeskWidget from "@/care-desk/web/widget/CareDeskWidget";
import { getWidgetLabels } from "@/care-desk/host/labels";

<CareDeskWidget labels={await getWidgetLabels(locale)} />
```

The host's global CSS must define the `widget-*`, `fade-in` and `float` animations (and the `brand` colour token for the dashboard); copy them from `src/app/globals.css`.

To open the widget from your own button: `openCareDeskWidget()` from `@/care-desk/web/widget/open`.

## Database

Migrations live in `src/care-desk/core/db/migrations/` and all tables are prefixed `care_`, so the desk can share a database with another app. `npm run migrate` records what it applied in `care_schema_migrations`. If the tables already exist without that record (schema applied by hand), it stops instead of re-running from the start.

To add a migration, add the next numbered `.sql` file with its own `begin; ... commit;`.

## Known gaps

- No authentication, users or operator management (granting and revoking operator access). All three belong in `host/`.
- Russian and Kazakh UI strings are drafts and need a native review, Kazakh especially.
- Emails go out in the desk's default locale; tickets do not record the requester's language.
- Due dates in emails and the day boundaries of metrics/export use the server's time zone.
# care-desk
