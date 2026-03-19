import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.qa" });

type WpPost = {
  id: number;
  link: string;
  slug: string;
  status: string;
  type: string;
  title?: {
    rendered?: string;
  };
};

type ContentType = {
  name: string;
  endpoint: string;
};

type QaUrl = {
  contentType: string;
  id: number;
  title: string;
  slug: string;
  url: string;
};

const baseUrl = process.env.PW_BASE_URL!;

const contentTypes: ContentType[] = [
  { name: "pages", endpoint: "pages" },
  { name: "news", endpoint: "news" },
  { name: "blogs", endpoint: "blogs" },
  { name: "work_updates", endpoint: "work_updates" },
  { name: "events", endpoint: "events" },
];

/**
 * Get one page of published items for a single WordPress content type.
 */
async function fetchPostsPage(
  endpoint: string,
  page: number,
): Promise<WpPost[]> {
  const url = new URL(`/wp-json/wp/v2/${endpoint}`, baseUrl);

  url.searchParams.set("status", "publish");
  url.searchParams.set("per_page", "100");
  url.searchParams.set("page", String(page));
  url.searchParams.set("_fields", "id,link,slug,status,type,title");

  const response = await fetch(url.toString());
  const body = await response.json();

  return body as WpPost[];
}

/**
 * Get all published items for one content type by paging through the API.
 */
async function fetchAllPostsForType(type: ContentType): Promise<QaUrl[]> {
  const results: QaUrl[] = [];
  let page = 1;

  while (true) {
    const posts = await fetchPostsPage(type.endpoint, page);

    if (!posts.length) {
      break;
    }

    for (const post of posts) {
      results.push({
        contentType: type.name,
        id: post.id,
        title: post.title?.rendered?.trim() ?? "",
        slug: post.slug,
        url: post.link,
      });
    }

    page += 1;
  }

  return results;
}

/**
 * Save the collected URLs so they can be used by the link checker later.
 */
async function saveResults(urls: QaUrl[]): Promise<void> {
  const outputDir = path.resolve("test-results", "link-check");
  await fs.mkdir(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, "qa-urls.json");
  const csvPath = path.join(outputDir, "qa-urls.csv");

  await fs.writeFile(jsonPath, JSON.stringify(urls, null, 2), "utf8");

  const csv = [
    "contentType,id,title,slug,url",
    ...urls.map((item) =>
      [
        wrapCsv(item.contentType),
        wrapCsv(String(item.id)),
        wrapCsv(item.title),
        wrapCsv(item.slug),
        wrapCsv(item.url),
      ].join(","),
    ),
  ].join("\n");

  await fs.writeFile(csvPath, csv, "utf8");

  console.log(`Saved ${jsonPath}`);
  console.log(`Saved ${csvPath}`);
}

/**
 * Wrap a value safely for CSV output.
 */
function wrapCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * Collect all QA URLs for the content types we care about.
 */
async function main(): Promise<void> {
  const allUrls: QaUrl[] = [];

  for (const type of contentTypes) {
    const urls = await fetchAllPostsForType(type);
    console.log(`${type.name}: ${urls.length}`);
    allUrls.push(...urls);
  }

  console.log(`Total URLs: ${allUrls.length}`);

  await saveResults(allUrls);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
