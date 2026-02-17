export type WpRunner = (args: string[]) => Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}>;

export default class WpThemes {
  constructor(private readonly wp: WpRunner) {}

  async activate(theme: string): Promise<void> {
    const res = await this.wp(["theme", "activate", theme]);

    if (res.exitCode !== 0) {
      throw new Error(`Unable to activate theme "${theme}"`);
    }
  }

  async active(): Promise<string> {
    const res = await this.wp([
      "theme",
      "list",
      "--status=active",
      "--field=name",
    ]);

    if (res.exitCode !== 0) {
      throw new Error("Unable to determine active theme");
    }

    return res.stdout.trim();
  }
}
