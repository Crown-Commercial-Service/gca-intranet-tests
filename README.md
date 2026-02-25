# GCA Intranet – Playwright E2E Tests

End‑to‑end Playwright test suite for the GCA Intranet WordPress application.

---

## Installation

## pre-req
Assuming your on a mac and have brew installed, run the following to install node

```bash
brew install nvm

mkdir -p ~/.nvm

echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/opt/homebrew/opt/nvm/etc/bash_completion.d/nvm"' >> ~/.zshrc

source ~/.zshrc

nvm install --lts

nvm alias default node

node -v

npm -v

nvm use default

node -v

npm -v
```

```bash
npm install
npx playwright install
```

---

## Running tests

### Run all WordPress UI tests
```bash
npm run test
```

### Run accessibility tests only
```bash
npm run test:a11y
```

### Run tests headed
```bash
npm run test:headed
```

### Show HTML report
```bash
npm run test:report
```

---

## Environment setup

Create `.env.local` in this repo:

```env
PW_BASE_URL=http://localhost:8080
WP_DOCKER_CWD=/absolute/path/to/gca-intranet
WP_THEME=gca-intranet
```

If running parallel Docker stacks:

```bash
PARALLEL_LOCAL=true npm run test
```

---

## Config overview

### `playwright.config.ts`
- Runs WordPress UI tests
- Ignores `tests/a11y`
- Uses global WP setup

### `playwright.a11y.config.ts`
- Runs only accessibility tests
- Shares base config
- Sets `PW_A11Y_RUN=true`

---

## WordPress CLI seeding

Tests seed content using WP‑CLI via Docker:

- Create posts
- Upload featured images
- Activate theme
- Reset data between runs

Key env vars:
- `WP_DOCKER_CWD` → path to WordPress repo
- `WP_SERVICE` → docker service (auto‑handled)
- `WP_THEME` → theme to activate

---

## Folder structure

```
e2e-tests/
│
├─ tests/
│   ├─ a11y/
│   └─ *.spec.ts
│
├─ src/
│   ├─ helpers/
│   ├─ pages/
│   ├─ utils/
│   └─ global-setup-wp.ts
│
├─ playwright.config.ts
├─ playwright.a11y.config.ts
└─ .env.local
```

---

## Reporting

After tests run:

```bash
npm run test:report
```

Artifacts:
- `playwright-report/`
- `test-results/`
- videos/screenshots on failure

---

## Notes

- Tests run against local Docker WordPress
- Global setup ensures WP is installed and theme active
- Each worker gets isolated data via runId
- Featured images copied into container automatically
