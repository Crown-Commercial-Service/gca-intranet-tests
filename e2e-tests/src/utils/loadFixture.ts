import fs from "fs";
import path from "path";

export type ProdPostFixture = {
  title: string;
  contentHtml: string;
  excerptHtml: string;
  featuredMediaId?: number;
  categories?: number[];
};

export function loadFixture(
  relativePathFromProjectRoot: string,
): ProdPostFixture {
  const absolutePath = path.resolve(process.cwd(), relativePathFromProjectRoot);
  const raw = fs.readFileSync(absolutePath, "utf-8");

  const parsed = JSON.parse(raw);
  const prodPost = Array.isArray(parsed) ? parsed[0] : parsed;

  const title = String(prodPost?.title?.rendered ?? "").trim();
  const contentHtml = String(prodPost?.content?.rendered ?? "").trim();
  const excerptHtml = String(prodPost?.excerpt?.rendered ?? "").trim();

  if (!title)
    throw new Error(
      `Fixture missing title.rendered: ${relativePathFromProjectRoot}`,
    );
  if (!contentHtml)
    throw new Error(
      `Fixture missing content.rendered: ${relativePathFromProjectRoot}`,
    );

  return {
    title,
    contentHtml,
    excerptHtml,
    featuredMediaId:
      typeof prodPost?.featured_media === "number"
        ? prodPost.featured_media
        : undefined,
    categories: Array.isArray(prodPost?.categories)
      ? prodPost.categories
      : undefined,
  };
}
