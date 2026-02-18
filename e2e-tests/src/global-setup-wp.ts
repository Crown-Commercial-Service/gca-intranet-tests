import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

if (!process.env.WP_DOCKER_CWD) {
  throw new Error("WP_DOCKER_CWD not set (VS Code did not load .env.local)");
}

import { wp } from "./utils/wpCli";

export default async function globalSetup() {
  // fail fast if WP is not installed / container not reachable
  const installed = await wp(["core", "is-installed"]);
  if (installed.exitCode !== 0) {
    throw new Error(
      `WP-CLI failed: ${installed.stderr || installed.stdout || "unknown error"}`,
    );
  }

  // activate wp theme for local test runs
  const theme = process.env.WP_THEME || "gca-intranet";

  const activate = await wp(["theme", "activate", theme]);
  if (activate.exitCode !== 0) {
    throw new Error(`Unable to activate theme "${theme}"`);
  }
}
