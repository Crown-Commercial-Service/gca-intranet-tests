import Post from "../models/Post";

export type SearchSeed = {
  keyword: string;
  pages: Post[];
  news: Post[];
  blogs: Post[];
  workUpdates: Post[];
  unrelated: Post[];
};

export async function seedSearchData(wp: any, seed: SearchSeed) {
  const pageIds = await wp.posts.createPages(seed.pages);
  const newsIds = await wp.posts.createMany(seed.news);
  const blogIds = await wp.posts.createMany(seed.blogs);
  const workUpdateIds = await wp.posts.createMany(seed.workUpdates);
  const unrelatedIds = await wp.posts.createMany(seed.unrelated);

  return {
    pageIds,
    newsIds,
    blogIds,
    workUpdateIds,
    unrelatedIds,
  };
}