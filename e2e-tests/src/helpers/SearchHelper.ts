import Post from "../models/Post";

export type SearchSeed = {
  keyword: string;
  pages: Post[];
  news: Post[];
  blogs: Post[];
  workUpdates: Post[];
  unrelated: Post[];
};

export async function seedSearchData(wp: any, seed: SearchSeed): Promise<void> {
  await wp.posts.createPages(seed.pages);
  await wp.posts.createMany(seed.news);
  await wp.posts.createMany(seed.blogs);
  await wp.posts.createMany(seed.workUpdates);
  await wp.posts.createMany(seed.unrelated);
}
