import path from "path";
import { execa } from "execa";
import type Post from "../models/Post";

export default class WpPosts {
  constructor(private wp: (args: string[]) => Promise<any>) {}

  async create(post: Post): Promise<number> {
    const res = await this.wp([
      "post",
      "create",
      "--porcelain",
      `--post_type=${post.type}`,
      `--post_title=${post.title}`,
      `--post_content=${post.content}`,
      `--post_status=${post.status}`,
    ]);

    if (res.exitCode !== 0) {
      throw new Error("Failed to create post");
    }

    const postId = Number(res.stdout.trim());

    // featured image
    if (post.featuredImagePath) {
      const cwd = process.env.WP_DOCKER_CWD;
      if (!cwd) throw new Error("WP_DOCKER_CWD not set");

      const fileName = path.basename(post.featuredImagePath);
      const containerPath = `/tmp/${fileName}`;

      // get wordpress container id
      const ps = await execa("docker", ["compose", "ps", "-q", "wordpress"], {
        cwd,
      });

      const containerId = ps.stdout.trim();
      if (!containerId) throw new Error("WordPress container not running");

      // copy local image into container
      const localPath = path.resolve(
        __dirname,
        "../../",
        post.featuredImagePath,
      );

      await execa(
        "docker",
        ["cp", localPath, `${containerId}:${containerPath}`],
        { cwd },
      );

      // import image in WP and set as featured
      const media = await this.wp([
        "media",
        "import",
        containerPath,
        "--porcelain",
      ]);
      if (media.exitCode !== 0) {
        throw new Error("Failed to import featured image");
      }

      const attachmentId = media.stdout.trim();

      await this.wp([
        "post",
        "meta",
        "update",
        String(postId),
        "_thumbnail_id",
        attachmentId,
      ]);
    }

    return postId;
  }

  async clearAll() {
    // delete posts
    const posts = await this.wp([
      "post",
      "list",
      "--post_type=post",
      "--format=ids",
    ]);

    const postIds = posts.stdout.trim();
    if (postIds) {
      await this.wp(["post", "delete", ...postIds.split(/\s+/), "--force"]);
    }

    // delete media
    const media = await this.wp([
      "post",
      "list",
      "--post_type=attachment",
      "--format=ids",
    ]);

    const mediaIds = media.stdout.trim();
    if (mediaIds) {
      await this.wp(["post", "delete", ...mediaIds.split(/\s+/), "--force"]);
    }
  }
}
