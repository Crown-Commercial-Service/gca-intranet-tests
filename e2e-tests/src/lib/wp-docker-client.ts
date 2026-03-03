import { execa } from "execa";
import {
  isParallelLocal,
  isParallelWordpressService,
  isInitService,
} from "../utils/wp-utils";

/**
 * Resolves the correct WordPress service name based on environment config.
 */
export function resolveWordpressServiceName(): string {
  const configuredService = (process.env.WP_SERVICE || "").trim();
  if (configuredService) {
    return isInitService(configuredService)
      ? configuredService.replace(/^init/, "wordpress")
      : configuredService;
  }

  // Default service name for standard docker-compose
  return "wordpress";
}

/**
 * Constructs the base arguments for docker compose commands.
 */
export function resolveComposeArgsForService(serviceName: string): string[] {
  const envFile = (process.env.WP_ENV_FILE || ".env").trim();
  const args = ["compose", "--env-file", envFile];

  const composeFilesRaw = (process.env.WP_COMPOSE_FILE || "").trim();
  if (composeFilesRaw) {
    const files = composeFilesRaw
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    for (const file of files) {
      args.push("-f", file);
    }
    return args;
  }

  // Backwards-compatible logic for parallel stacks
  const mustUseParallelCompose =
    isParallelLocal() || isParallelWordpressService(serviceName);

  if (mustUseParallelCompose) {
    args.push("-f", "docker-compose.parallel.local.yml");
  }

  return args;
}

/**
 * Gets the specific Container ID for a given service via docker compose ps.
 */
export async function getComposeContainerId(
  serviceName: string,
  dockerCwd: string,
): Promise<string> {
  const args = [
    ...resolveComposeArgsForService(serviceName),
    "ps",
    "-q",
    serviceName,
  ];

  const result = await execa("docker", args, {
    cwd: dockerCwd,
    timeout: 60_000,
  });

  return (result.stdout || "").trim();
}

/**
 * Logic to determine which driver to use based on env variables.
 */
export function wpDriver(): "docker" | "remote" {
  const driver = (process.env.WP_DRIVER || "").toLowerCase().trim();
  if (driver === "remote") return "remote";
  if (driver === "docker") return "docker";

  if (process.env.WP_REMOTE === "true") return "remote";

  const hasBaseUrl = Boolean((process.env.PW_BASE_URL || "").trim());
  const hasDockerCwd = Boolean((process.env.WP_DOCKER_CWD || "").trim());

  // If we have a URL but no local Docker path, assume remote.
  return hasBaseUrl && !hasDockerCwd ? "remote" : "docker";
}
