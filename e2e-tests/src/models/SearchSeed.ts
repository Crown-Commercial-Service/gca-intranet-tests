import Post from "../../src/models/Post";

type SearchSeed = {
  keyword: string;
  pages: Post[];
  news: Post[];
  blogs: Post[];
  workUpdates: Post[];
  unrelated: Post[];
};

export function createSearchSeed(keyword: string): SearchSeed {
  return {
    keyword,

    pages: [
      Post.aPage()
        .withFixedTitle(`${keyword} Policy Hub`)
        .withContent(
          `${keyword} guidance, policy, templates and support for teams across GCA.`,
        )
        .withStatus("publish"),

      Post.aPage()
        .withFixedTitle(`${keyword} Training and Guidance`)
        .withContent(
          `Training materials and reference content for ${keyword} activity across directorates.`,
        )
        .withStatus("publish"),
    ],

    news: [
      Post.aPost()
        .withType("news")
        .withFixedTitle(`${keyword} Transformation Update`)
        .withParagraphMaxChars(120)
        .withContent(
          `Latest ${keyword} transformation progress and delivery milestones across GCA.`,
        )
        .withStatus("publish")
        .withFeaturedImage("featured.jpg"),

      Post.aPost()
        .withType("news")
        .withFixedTitle(`${keyword} Digital Delivery Milestone`)
        .withParagraphMaxChars(120)
        .withContent(
          `The latest ${keyword} delivery milestone and implementation update.`,
        )
        .withStatus("publish")
        .withFeaturedImage("featured.jpg"),
    ],

    blogs: [
      Post.aPost()
        .withType("blogs")
        .withFixedTitle(
          `How ${keyword.toLowerCase()} teams improve supplier onboarding`,
        )
        .withParagraphMaxChars(120)
        .withContent(
          `A blog covering how ${keyword.toLowerCase()} teams can improve supplier onboarding and collaboration.`,
        )
        .withStatus("publish")
        .withFeaturedImage("featured.jpg"),

      Post.aPost()
        .withType("blogs")
        .withFixedTitle(`${keyword} lessons from digital transformation`)
        .withParagraphMaxChars(120)
        .withContent(
          `Lessons learned from recent ${keyword.toLowerCase()} transformation work across the organisation.`,
        )
        .withStatus("publish")
        .withFeaturedImage("featured.jpg"),
    ],

    workUpdates: [
      Post.aPost()
        .withType("work_updates")
        .withFixedTitle(`${keyword} workflow improvement`)
        .withParagraphMaxChars(120)
        .withContent(
          `A work update on ${keyword.toLowerCase()} workflow changes and delivery improvements.`,
        )
        .withStatus("publish"),

      Post.aPost()
        .withType("work_updates")
        .withFixedTitle(`${keyword} governance progress`)
        .withParagraphMaxChars(120)
        .withContent(
          `Progress update on ${keyword.toLowerCase()} governance and assurance activity.`,
        )
        .withStatus("publish"),
    ],

    unrelated: [
      Post.aPage()
        .withFixedTitle("HR onboarding guide")
        .withContent("Guidance for HR onboarding and induction.")
        .withStatus("publish"),

      Post.aPost()
        .withType("news")
        .withFixedTitle("Accessibility support article")
        .withParagraphMaxChars(120)
        .withContent("Accessibility support and inclusive design update.")
        .withStatus("publish")
        .withFeaturedImage("featured.jpg"),

      Post.aPost()
        .withType("blogs")
        .withFixedTitle("Finance budget reminder")
        .withParagraphMaxChars(120)
        .withContent("Finance budget reminder for Q4 planning.")
        .withStatus("publish")
        .withFeaturedImage("featured.jpg"),
    ],
  };
}
