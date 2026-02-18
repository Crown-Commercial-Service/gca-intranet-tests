type WpResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type WpRunner = (args: string[]) => Promise<WpResult>;

function formatWpCliError(message: string, result: WpResult): Error {
  const details = (result.stderr || result.stdout || "").trim();
  return new Error(message + (details ? `\n\nWP-CLI output:\n${details}` : ""));
}

export default class WpThemes {
  constructor(private readonly wp: WpRunner) {}

  async activate(theme: string): Promise<void> {
    const result = await this.wp(["theme", "activate", theme]);

    if (result.exitCode !== 0) {
      throw formatWpCliError(`Unable to activate theme "${theme}"`, result);
    }
  }

  async active(): Promise<string> {
    const result = await this.wp([
      "theme",
      "list",
      "--status=active",
      "--field=name",
    ]);

    if (result.exitCode !== 0) {
      throw formatWpCliError("Unable to determine active theme", result);
    }

    return result.stdout.trim();
  }
}
