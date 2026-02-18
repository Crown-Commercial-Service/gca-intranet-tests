import path from "path";
import dotenv from "dotenv";
import { execa } from "execa";
import { wp } from "./utils/wpCli";
import logger from "./utils/logger";

type CommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
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

function getSuiteLabel(): string {
  const suite = (process.env.PW_TEST_SUITE || "").toLowerCase();
  return suite === "a11y" ? "WordPress A11Y ['wcag2aa', 'wcag21aa'] tests" : "WordPress UI tests";
}

function didComposeReportMissingService(output: string): boolean {
  const text = output.toLowerCase();
  return (
    text.includes("no such service") ||
    (text.includes("service") && text.includes("not found"))
  );
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

  try {
    const result = await execa("docker", dockerArgs, {
      cwd: composeDirectory,
      timeout: 300_000,
    });

    return {
      exitCode: result.exitCode ?? 0,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
  } catch (error: unknown) {
    const execaError = error as any;

    return {
      exitCode: execaError?.exitCode ?? 1,
      stdout: execaError?.stdout ?? "",
      stderr: execaError?.stderr ?? execaError?.message ?? String(error),
    };
  }
}

async function ensureSingleStackReady(): Promise<void> {
  const serviceName = process.env.WP_SERVICE || "wordpress";

  const installedCheck = await wp(["core", "is-installed"], {
    service: serviceName,
  });

  if (installedCheck.exitCode !== 0) {
    throw new Error(
      `WP-CLI failed: ${installedCheck.stderr || installedCheck.stdout || "unknown error"}`,
    );
  }

  const themeName = process.env.WP_THEME || "gca-intranet";
  const activation = await wp(["theme", "activate", themeName], {
    service: serviceName,
  });

  if (activation.exitCode !== 0) {
    const details = (activation.stderr || activation.stdout || "").trim();
    throw new Error(
      `Unable to activate theme "${themeName}"` +
        (details ? `\n\nWP-CLI output:\n${details}` : ""),
    );
  }
}

export default async function globalSetup(): Promise<void> {
  loadEnvFiles();
  requireEnv("WP_DOCKER_CWD");

  logger.info(`Running ${getSuiteLabel()}`);

  const initServiceNames = ["init0", "init1", "init2", "init3"];
  const init0Result = await runParallelInit(initServiceNames[0]);

  if (init0Result.exitCode === 0) {
    for (const serviceName of initServiceNames.slice(1)) {
      const result = await runParallelInit(serviceName);

      if (result.exitCode !== 0) {
        throw new Error(
          `WP init failed for ${serviceName}: ${result.stderr || result.stdout || "unknown error"}`,
        );
      }
    }
    return;
  }

  const init0Output = `${init0Result.stderr}\n${init0Result.stdout}`.trim();
  if (!didComposeReportMissingService(init0Output)) {
    throw new Error(
      `WP init failed for init0: ${init0Output || "unknown error"}`,
    );
  }

  await ensureSingleStackReady();
}
