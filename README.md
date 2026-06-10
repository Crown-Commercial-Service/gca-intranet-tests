# GCA Intranet – Playwright E2E Tests

End‑to‑end Playwright test suite for the GCA Intranet WordPress application.

The suite runs **against the deployed QA environment** — it does not need a local WordPress
instance or Docker. It covers functional UI journeys, accessibility (axe), visual regression,
and link/redirect checks, and produces both **Playwright HTML** and **Allure** reports plus a
standalone **axe accessibility report**.

> **Where to run commands:** every command in this guide is run from the **`e2e-tests/`** folder,
> not the repository root.
>
> ```bash
> cd e2e-tests
> ```

---

## 1. Prerequisites — install nvm and Node

We use [nvm](https://github.com/nvm-sh/nvm) to manage the Node.js version. Install it with the
official curl command (macOS / Linux):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

Then **close and reopen your terminal** (or reload your shell config) so the `nvm` command is
available:

```bash
source ~/.zshrc   # or: source ~/.bashrc
```

Confirm nvm is installed:

```bash
command -v nvm   # should print: nvm
```

Install and use the latest LTS version of Node, and set it as your default:

```bash
nvm install --lts
nvm alias default 'lts/*'
nvm use --lts

node -v   # confirm Node is available
npm -v    # confirm npm is available
```

---

## 2. Install dependencies and Playwright

From the **`e2e-tests/`** folder:

```bash
cd e2e-tests

# Install project dependencies
npm install

# Install the Playwright browsers (Chromium) and OS dependencies
npx playwright install --with-deps
```

> `npm install` installs the test framework and helpers. `npx playwright install` downloads the
> browser binaries Playwright drives — this is a separate, required step. `--with-deps` also
> installs any missing system libraries the browsers need (safe to keep on macOS).

---

## 3. Environment setup

Tests read connection details and credentials from environment files in `e2e-tests/`. These files
are **git‑ignored** (they contain secrets) — copy the example and fill in real values.

```bash
cp .env.example .env.qa
```

`.env.example` shows the required keys:

```env
PW_BASE_URL=https://qa.intranet.gca.gov.uk

WP_API_USER=your-admin-username
WP_API_PASSWORD=your-application-password   # WordPress "Application Password"

WP_ADMIN_USERNAME=pw-e2e-test
WP_ADMIN_PASSWORD=password
```

| Variable          | Purpose                                                            |
| ----------------- | ------------------------------------------------------------------ |
| `PW_BASE_URL`     | Base URL of the environment under test (e.g. QA or Dev).           |
| `WP_API_USER`     | WordPress admin username used for the REST API.                    |
| `WP_API_PASSWORD` | WordPress **Application Password** for that user.                  |
| `WP_ADMIN_USERNAME` | Test account used to log into the WordPress front end.           |
| `WP_ADMIN_PASSWORD` | Password for the test account.                                   |

Create one file per environment you target:

- **`.env.qa`** → QA environment (used by all `*:qa` scripts)
- **`.env.dev`** → Dev environment (used by all `*:dev` scripts)

> 🔒 **Never commit `.env.qa` / `.env.dev`.** They hold live credentials and are already covered by
> `.gitignore`. Ask the team lead for the current QA/Dev credentials during handover.

---

## 4. Running tests

All test scripts are defined in `package.json` and are run with `npm run <script>`. Each one
automatically cleans previous Allure results first (`clean:allure`).

### Functional / regression tests

```bash
# QA environment — runs the @regression suite (single worker)
npm run test:qa

# Dev environment — runs the @regression suite (single worker)
npm run test:dev
```

### Accessibility (a11y) tests

Accessibility tests live in `tests/a11y/` and use [`@axe-core/playwright`](https://www.npmjs.com/package/@axe-core/playwright).
They run via the dedicated `playwright.a11y.config.ts` config.

```bash
# Run the full a11y suite against QA
npm run test:a11y:qa

# Run the full a11y suite against Dev
npm run test:a11y:dev

# Run only the homepage a11y spec against QA
npm run test:homepage:a11y:qa

# Headed / interactive UI mode (uses .env)
npm run test:a11y:headed
npm run test:a11y:ui
```

### Visual regression tests

These compare rendered pages against committed baseline snapshots in `tests/visual-regression/`.

```bash
# Run visual checks
npm run test:visual:qa
npm run test:visual:dev

# Update / regenerate the baseline snapshots (only when changes are expected)
npm run test:visual:qa:update
npm run test:visual:dev:update
```

> ⚠️ Run the `:update` variants **only** when a visual change is intentional. They overwrite the
> committed baselines — review the resulting diff before committing.

### Link & redirect checks

Utility scripts (in `scripts/`) for crawling and validating links/redirects:

```bash
npm run links:collect:qa     # collect URLs from QA
npm run check:urls:qa        # check those URLs resolve
npm run check:url:redirects  # validate expected redirects
```

---

## 5. Reports

There are **three** reporting systems. The Playwright config (`playwright.config.ts`) emits the
`list`, `html`, and `allure-playwright` reporters on every run.

### A. Playwright HTML report

Generated automatically into `playwright-report/` on every run.

```bash
npm run report   # opens the Playwright HTML report
```

### B. Allure report

Richer historical reporting. Results are written to `allure-results/` during the run; generate and
open the HTML report with:

```bash
npm run report:allure   # generate ./allure-report and open it in the browser
```

To build and **publish** an Allure report to a shareable surge.sh URL (timestamped):

```bash
npm run deploy:allure
```

### C. Accessibility (axe) report

After running the a11y suite, individual axe JSON results are merged into a single HTML report
(via `scripts/merge-axe-reports.ts`) at `test-results/axe/index.html`.

```bash
# Open the merged axe HTML report locally (macOS, Chrome)
npm run report:a11y

# Merge + publish the axe report to a shareable surge.sh URL (timestamped)
npm run deploy:a11y
```

### Cleaning report artifacts

```bash
npm run clean:reports   # remove allure-results, allure-report, playwright-report, test-results
npm run clean:allure    # remove allure-results + allure-report only
```

> Report folders (`playwright-report/`, `test-results/`, `allure-results/`, `allure-report/`) are
> git‑ignored and are regenerated on each run.

---

## 6. Config overview

### `playwright.config.ts`
- Functional / regression UI tests.
- `testDir: "tests"`, **ignores** anything under `tests/a11y/`.
- Reporters: `list`, `html` (→ `playwright-report/`), `allure-playwright` (→ `allure-results/`).
- Captures **trace on first retry**, **screenshot on failure**, **video on failure**.
- Default browser project: `desktop-chromium`.

### `playwright.a11y.config.ts`
- Accessibility tests only.
- Extends the base config but sets `testDir: "tests/a11y"` and clears `testIgnore`.

---

## 7. Fixtures, data seeding & authentication

This suite uses Playwright **fixtures** to do the heavy lifting so individual specs stay short.
The central file is **`src/wp.fixtures.ts`**, which extends Playwright's built‑in `test` with custom
fixtures and re‑exports `test` and `expect`. **All specs import `test`/`expect` from this file**
(not directly from `@playwright/test`), which is what makes the helpers below automatically
available in every test.

```ts
import { test, expect } from "../../src/wp.fixtures";

test("homepage shows the latest news", async ({ wp, homepage }) => {
  await wp.posts.create(newsPost);   // seed content via the API
  await homepage.goto();             // browser is already logged in
  // ...assertions
});
```

### Available fixtures

| Fixture | What you get | Used for |
| ------- | ------------ | -------- |
| `wp` | `{ posts, users, themes, events, customizer, ... }` | Seeding & cleaning **data** in WordPress (no browser) |
| `auth` | `{ loginAs(user) }` | Logging in as a **specific** user through the UI |
| Page objects (`homepage`, `blog`, `staffDirectory`, `eventPage`, …) | A ready‑to‑use Page Object | The pages under test — some auto‑login first |
| `runId` | `run-<workerIndex>-<timestamp>` | A unique tag per run, used for test data isolation & cleanup |

A spec just lists the fixtures it needs as function arguments — Playwright builds them on demand.

### Seeding content — "posting data via WP" (`wp.posts`)

Instead of clicking through the WordPress admin UI to author content, tests create it directly
through `wp.posts` (a `WpPosts` instance in `src/helpers/WpPosts.ts`):

```ts
const id  = await wp.posts.create(post);        // one post → returns its new ID
const ids = await wp.posts.createMany([a, b]);  // many posts in parallel
```

Content is created over the WordPress **REST API** against the QA environment. Each post is an
HTTP `POST` to `{PW_BASE_URL}/wp-json/wp/v2/{posts|pages|news|blogs|...}` (via
`src/lib/wp-rest-client.ts`), authenticated with an Application Password (see the credentials
table below). Featured images are uploaded to `/wp/v2/media` and categories/templates are
resolved as needed.

**Cleanup:** every run is stamped with a unique `runId`. Helpers like `clearByRunId()` and
`clearByType()` then find and delete that run's content (`DELETE …?force=true`), so the QA
environment doesn't accumulate test data.

### Authentication — why you don't have to log in manually

There are **two** auth paths, for two different needs:

**A. Silent session login (the default for QA runs).**
The page fixtures that need an authenticated browser (e.g. `homepage`, `staffDirectory`) call
`loginToQaWordpress(page)` before handing the page to the test. Rather than typing into the login
form, it logs in over HTTP:

```ts
await page.request.get(`${baseUrl}/gcawebadmin`);    // prime the WP test cookie
await page.request.post(`${baseUrl}/gcawebadmin`, {  // POST the login form fields
  form: { log: username, pwd: password, "wp-submit": "Log In", ... },
});
```

Because `page.request` **shares the browser context's cookie jar**, the `wordpress_logged_in_*`
cookies returned by that POST are stored on the context. So when the test later calls
`page.goto(...)`, the browser is **already authenticated** — no login screen, no form filling.
This uses `WP_ADMIN_USERNAME` / `WP_ADMIN_PASSWORD` and the site's custom login slug `/gcawebadmin`.

**B. UI‑driven login for a specific user (the `auth` fixture).**
When a test genuinely needs the login journey or a different user (e.g. permission tests under
`tests/user-permissons/`), use `auth.loginAs(...)`, which clears cookies, opens `/gcawebadmin`,
and types into the real form (via `src/pages/WordpressLoginPage.ts`):

```ts
await auth.loginAs({ username, password });
```

### Two credential sets (important!)

These are **different accounts** and are easy to confuse:

| Env vars | Used by | Auth style |
| -------- | ------- | ---------- |
| `WP_API_USER` / `WP_API_PASSWORD` (an **Application Password**) | REST API — `wp.posts` seeding & cleanup | HTTP `Basic` header |
| `WP_ADMIN_USERNAME` / `WP_ADMIN_PASSWORD` | Browser session — silent auto‑login & `auth.loginAs` | WP login form → cookies |

Both live in your `.env.qa` / `.env.dev` file (see [Environment setup](#3-environment-setup)).

---

## 8. Folder structure

```
e2e-tests/
│
├─ tests/                     # specs grouped by area
│   ├─ a11y/                  # accessibility (axe) specs
│   ├─ visual-regression/     # visual snapshot specs
│   ├─ homepage/  blogs/  events/  latest-news/ ...
│   └─ data/                  # shared test data / fixtures
│
├─ src/                       # framework code
│   ├─ a11y/                  # axe setup, assertions, report helpers
│   ├─ pages/                 # Page Object Models
│   ├─ models/                # data models
│   ├─ helpers/  utils/  lib/ # shared utilities
│   ├─ assertions/            # custom assertions
│   └─ wp.fixtures.ts         # Playwright fixtures (WordPress auth/API)
│
├─ scripts/                   # standalone tooling
│   ├─ merge-axe-reports.ts   # merges axe JSON → single HTML report
│   ├─ check-urls.ts
│   └─ check-redirects.ts
│
├─ playwright.config.ts
├─ playwright.a11y.config.ts
├─ .env.example               # template — copy to .env.qa / .env.dev
└─ package.json
```

---

## 9. Quick start

```bash
# 1. Install nvm + Node (one-time)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.zshrc
nvm install --lts && nvm use --lts

# 2. Install the project (from the e2e-tests folder)
cd e2e-tests
npm install
npx playwright install --with-deps

# 3. Configure credentials
cp .env.example .env.qa     # then fill in real QA credentials

# 4. Run tests
npm run test:qa             # functional / regression
npm run test:a11y:qa        # accessibility

# 5. View reports
npm run report              # Playwright HTML
npm run report:allure       # Allure
npm run report:a11y         # axe accessibility report
```
