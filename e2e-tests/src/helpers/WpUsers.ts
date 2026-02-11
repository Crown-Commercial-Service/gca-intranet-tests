import type User from "../models/User";

export type WpRunner = (args: string[]) => Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}>;

type UserLike = Pick<User, "username" | "password" | "email" | "role">;

export default class WpUsers {
  private readonly wp: WpRunner;

  constructor(wp: WpRunner) {
    this.wp = wp;
  }

  async exists(username: string): Promise<boolean> {
    const res = await this.wp(["user", "get", username, "--field=ID"]);
    return res.exitCode === 0 && !!res.stdout.trim();
  }

  async create(user: UserLike): Promise<void> {
    const exists = await this.exists(user.username);
    if (exists) throw new Error(`User "${user.username}" already exists`);

    await this.wp([
      "user",
      "create",
      user.username,
      user.email,
      `--role=${user.role}`,
      `--user_pass=${user.password}`,
    ]);
  }

  async updatePassword(user: UserLike): Promise<void> {
    const exists = await this.exists(user.username);
    if (!exists) throw new Error(`User "${user.username}" does not exist`);

    await this.wp([
      "user",
      "update",
      user.username,
      `--user_pass=${user.password}`,
    ]);
  }

  async upsert(user: UserLike): Promise<void> {
    const exists = await this.exists(user.username);

    if (exists) {
      await this.wp([
        "user",
        "update",
        user.username,
        `--user_pass=${user.password}`,
      ]);

      await this.wp(["user", "set-role", user.username, user.role]);
      return;
    }

    await this.wp([
      "user",
      "create",
      user.username,
      user.email,
      `--role=${user.role}`,
      `--user_pass=${user.password}`,
    ]);
  }
}
