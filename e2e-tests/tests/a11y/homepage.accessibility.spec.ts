import { test } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";
import Event from "../../src/models/Events";
import MenuPages from "../../src/models/MenuPages";
import FooterPages from "../../src/models/FooterPages";
import HomepageCustomizationSet from "../../src/models/HomepageCustomizationSet";

test.describe("Accessibility - Homepage", () => {
  test.beforeEach(async ({ wp, runId }) => {
    await wp.posts.clearByRunId(runId);
    await wp.posts.clearByTypeAndAuthor("page");
    await wp.posts.clearByTypeAndAuthor("events");
  });

  test("Components on the homepage should have no serious or critical violations", async ({
    homepage,
    wp,
    runId,
    wordpressLoginPage,
    customizerPage,
    eventEditorPage,
  }) => {
    const contentType = Post.homepageSet(runId);
    const customizations = HomepageCustomizationSet.homepageSet(runId);
    const events = Event.homepageEvents();

    // Create homepage content
    await wp.posts.createMany(contentType.news);
    await wp.posts.createMany(contentType.workUpdates);
    await wp.posts.create(contentType.blog);

    // Create header and footer pages
    await wp.posts.createPages([...MenuPages.all(), ...FooterPages.all()]);

    // Log in to WordPress admin
    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    // Create homepage customizer content
    await customizerPage.goto();
    await customizerPage.openHomepageOptions();
    await customizerPage.page.waitForTimeout(1000);
    await customizerPage.updateTakeALook(customizations.takeALook);
    await customizerPage.updateQuickLinks(customizations.quickLinks);
    await customizerPage.publish();

    // Create event posts
    const eventIds = await wp.events.createMany(events);

    // Add event details in WordPress editor
    for (let index = 0; index < events.length; index++) {
      await eventEditorPage.gotoEdit(eventIds[index]);
      await eventEditorPage.fillEventDetails(events[index]);
      await eventEditorPage.selectCategory(events[index].category!);
      await eventEditorPage.selectEventLocation(events[index].eventLocation!);
      await eventEditorPage.update();
    }

    // Build homepage navigation menu
    await customizerPage.goto();
    await customizerPage.buildMenu(MenuPages.menu());
    await customizerPage.publish();

    // Build footer navigation menu
    await customizerPage.goto();
    await customizerPage.buildFooterMenu(FooterPages.menu());
    await customizerPage.publish();

    // Open homepage and submenu for accessibility scan
    await homepage.goto();
    await homepage.hoverParentLink("Parent Nav Link 1");

    // Run accessibility checks on homepage sections and navigation
    await homepage.checkAccessibilityFor([
      homepage.latestNewsSectionSelector,
      homepage.workUpdatesSectionSelector,
      homepage.blogsSectionSelector,
      homepage.takeALookColumnSelector,
      homepage.quickLinksSelector,
      homepage.eventsSectionSelector,
      homepage.primaryNavigationSelector,
      homepage.subMenuNavigation,
      homepage.footerSelector,
    ]);
  });
});
