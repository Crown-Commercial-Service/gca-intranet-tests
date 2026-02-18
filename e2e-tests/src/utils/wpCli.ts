import { execa } from "execa";

type WpResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

function isParallelLocal() {
  return process.env.PARALLEL_LOCAL === "true";
}

function composeBaseArgs(cwd: string): string[] {
  // IMPORTANT:
  // When running parallel local, all WP containers were started with:
  //   -f docker-compose.parallel.local.yml
  // So any exec must include the same -f or Compose will look at the default file
  // and you'll get: service "wordpress" is not running
  const args = ["compose"];

  const envFile = process.env.WP_ENV_FILE || ".env";
  args.push("--env-file", envFile);

  if (isParallelLocal()) {
    args.push("-f", "docker-compose.parallel.local.yml");
  }

  return args;
}

export async function wp(
  args: string[],
  opts?: { timeoutMs?: number; service?: string },
): Promise<WpResult> {
  const timeout = opts?.timeoutMs ?? 120_000;
  const cwd = process.env.WP_DOCKER_CWD as string | undefined;

  if (!cwd) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: "WP_DOCKER_CWD env var not set",
    };
  }

  // In parallel local runs, caller should pass wordpress0..wordpress3
  // Single-stack default remains "wordpress"
  const service = opts?.service ?? process.env.WP_SERVICE ?? "wordpress";

  const cmd = [
    ...composeBaseArgs(cwd),
    "exec",
    "-T",
    service,
    "wp",
    ...args,
    "--allow-root",
  ];

  try {
    const res = await execa("docker", cmd, { cwd, timeout });

    return {
      exitCode: res.exitCode ?? 0,
      stdout: res.stdout ?? "",
      stderr: res.stderr ?? "",
    };
  } catch (err: unknown) {
    const e = err as any;
    return {
      exitCode: e?.exitCode ?? 1,
      stdout: e?.stdout ?? "",
      stderr: e?.stderr ?? e?.message ?? String(e),
    };
  }
}
