import path from "path";
import dotenv from "dotenv";
import { execa } from "execa";
import { wp } from "./utils/wpCli";
import logger from "./utils/logger";

type CommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
};

function loadEnvFiles(): void {
  dotenv.config({
    path: path.resolve(__dirname, "../.env.local"),
    quiet: true,
    override: false,
  });

  dotenv.config({
    path: path.resolve(__dirname, "../.env"),
    quiet: true,
    override: false,
  });
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function setupDebugEnabled(): boolean {
  return process.env.PW_SETUP_DEBUG === "true";
}

/**
 * WP_DRIVER controls how we setup/seed:
 * - "docker"  => local/CI docker compose + wp-cli init + theme/plugin activation (default)
 * - "remote"  => QA/hosted; do NOT run docker or activate theme/plugins
 */
function wpDriver(): "docker" | "remote" {
  const raw = (process.env.WP_DRIVER || "docker").toLowerCase().trim();
  return raw === "remote" ? "remote" : "docker";
}

function getRequiredPlugins(): string[] {
  const raw = process.env.WP_PLUGINS;
  if (!raw) return ["gca-custom"];

  return raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

function logCommandOutput(
  output: CommandResult,
  opts: { isFailure: boolean },
): void {
  if (!setupDebugEnabled()) return;

  if (output.stdout) logger.info(output.stdout);

  if (!output.stderr) return;
  if (opts.isFailure) logger.error(output.stderr);
  else logger.info(output.stderr);
}

async function runParallelInit(serviceName: string): Promise<CommandResult> {
  const composeDirectory = requireEnv("WP_DOCKER_CWD");

  const dockerArgs = [
    "compose",
    "--env-file",
    ".env",
    "-f",
    "docker-compose.parallel.local.yml",
    "run",
    "--rm",
    serviceName,
    "/bin/sh",
    "-lc",
    "/usr/local/bin/wp-init.sh",
  ];

  const start = Date.now();
  logger.info(`[setup] Initialising ${serviceName}...`);

  try {
    const result = await execa("docker", dockerArgs, {
      cwd: composeDirectory,
      timeout: 300_000,
    });

    const output: CommandResult = {
      exitCode: result.exitCode ?? 0,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      durationMs: Date.now() - start,
    };

    logger.info(
      `[setup] ${serviceName} completed (exit=${output.exitCode}, ${(
        output.durationMs / 1000
      ).toFixed(1)}s)`,
    );

    logCommandOutput(output, { isFailure: false });
    return output;
  } catch (error: any) {
    const output: CommandResult = {
      exitCode: error?.exitCode ?? 1,
      stdout: error?.stdout ?? "",
      stderr: error?.stderr ?? error?.message ?? "",
      durationMs: Date.now() - start,
    };

    logger.error(
      `[setup] ${serviceName} failed (exit=${output.exitCode}, ${(
        output.durationMs / 1000
      ).toFixed(1)}s)`,
    );

    logCommandOutput(output, { isFailure: true });
    return output;
  }
}

async function ensureThemeActive(serviceName: string): Promise<void> {
  const themeName = process.env.WP_THEME || "gca-intranet";

  const statusCheck = await wp(["theme", "is-active", themeName], {
    service: serviceName,
  });

  if (statusCheck.exitCode === 0) {
    logger.info(
      `[setup] Theme "${themeName}" already active on ${serviceName}`,
    );
    return;
  }

  logger.info(`[setup] Activating theme "${themeName}" on ${serviceName}`);

  const activation = await wp(["theme", "activate", themeName], {
    service: serviceName,
  });

  if (activation.exitCode !== 0) {
    throw new Error(
      `Unable to activate theme "${themeName}" on ${serviceName}`,
    );
  }

  logger.info(`[setup] Theme "${themeName}" activated on ${serviceName}`);
}

async function ensurePluginsActive(serviceName: string): Promise<void> {
  const plugins = getRequiredPlugins();

  for (const plugin of plugins) {
    const statusCheck = await wp(["plugin", "is-active", plugin], {
      service: serviceName,
    });

    if (statusCheck.exitCode === 0) {
      logger.info(
        `[setup] Plugin "${plugin}" already active on ${serviceName}`,
      );
      continue;
    }

    logger.info(`[setup] Activating plugin "${plugin}" on ${serviceName}`);

    const activation = await wp(["plugin", "activate", plugin], {
      service: serviceName,
    });

    if (activation.exitCode !== 0) {
      throw new Error(
        `Unable to activate plugin "${plugin}" on ${serviceName}`,
      );
    }

    logger.info(`[setup] Plugin "${plugin}" activated on ${serviceName}`);
  }
}

function resolveBaseUrl(): string {
  return (
    process.env.PW_BASE_URL ||
    process.env.BASE_URL ||
    process.env.WP_BASE_URL ||
    "http://localhost:8080"
  );
}

async function pingUrl(url: string): Promise<void> {
  try {
    const res = await execa("curl", ["-fsS", "-o", "/dev/null", url], {
      timeout: 60_000,
    });
    if ((res.exitCode ?? 0) === 0) return;
  } catch (e: any) {
    throw new Error(
      `[setup] Remote target not reachable: ${url}\n` +
        (e?.stderr || e?.stdout || e?.message || ""),
    );
  }
}

async function remoteSetup(): Promise<void> {
  const baseUrl = resolveBaseUrl().replace(/\/+$/, "");
  logger.info(
    `[setup] WP_DRIVER=remote: skipping docker init + theme/plugin activation`,
  );
  logger.info(`[setup] Target: ${baseUrl}`);

  await pingUrl(`${baseUrl}/wp-login.php`);

  // Optional: warn if seeding creds are missing
  const user = process.env.WP_ADMIN_USER || process.env.QA_WP_ADMIN_USER;
  const pass =
    process.env.WP_ADMIN_PASSWORD ||
    process.env.WP_ADMIN_APP_PASSWORD ||
    process.env.QA_WP_ADMIN_PASSWORD ||
    process.env.QA_WP_ADMIN_APP_PASSWORD;

  if (!user || !pass) {
    logger.info(
      `[setup] Note: WP admin credentials not set (WP_ADMIN_USER + WP_ADMIN_PASSWORD/WP_ADMIN_APP_PASSWORD). ` +
        `That's fine if your QA run doesn't seed via API.`,
    );
  }

  logger.info(`Global setup complete. Starting WordPress UI tests...`);
}

export default async function globalSetup(): Promise<void> {
  loadEnvFiles();

  logger.info(`[setup] Starting WordPress global setup...`);

  // QA / hosted (no docker)
  if (wpDriver() === "remote") {
    await remoteSetup();
    return;
  }

  // Local/CI docker mode
  requireEnv("WP_DOCKER_CWD");

  const initServices = ["init0", "init1", "init2", "init3"];
  const init0 = await runParallelInit(initServices[0]);

  if (init0.exitCode === 0) {
    for (const service of initServices.slice(1)) {
      const result = await runParallelInit(service);
      if (result.exitCode !== 0) {
        throw new Error(`WP init failed for ${service}`);
      }
    }

    const wordpressServices = [
      "wordpress0",
      "wordpress1",
      "wordpress2",
      "wordpress3",
    ];

    for (const service of wordpressServices) {
      await ensureThemeActive(service);
      await ensurePluginsActive(service);
    }

    logger.info(`Global setup complete. Starting WordPress UI tests...`);
    return;
  }

  logger.info(
    `[setup] Parallel services not detected, using single-stack mode`,
  );

  const serviceName = process.env.WP_SERVICE || "wordpress";
  await ensureThemeActive(serviceName);
  await ensurePluginsActive(serviceName);

  logger.info(`Global setup complete. Starting WordPress UI tests...`);
}
