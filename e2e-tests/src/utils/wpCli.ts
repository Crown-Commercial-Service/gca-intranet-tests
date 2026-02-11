import { execa } from "execa";

type WpResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export async function wp(
  args: string[],
  opts?: { timeoutMs?: number },
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

  const cmd = [
    "compose",
    "exec",
    "-T",
    "wordpress",
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
