import dayjs from "dayjs";
import { test } from "../../src/wp.fixtures";
import Post from "../../src/models/Post";
import Event from "../../src/models/Events";
import MenuPages from "../../src/models/MenuPages";
import HomepageCustomizationSet from "../../src/models/HomepageCustomizationSet";

test.describe("Accessibility - Homepage", () => {
  test.beforeEach(async ({ wp, runId }) => {
    await wp.posts.clearByRunId(runId);
    await wp.posts.clearByTypeAndAuthor("page");
    await wp.posts.clearByTypeAndAuthor("event");
  });

  test("Homepage components including events have no serious or critical violations", async ({
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

    await wp.posts.createMany(contentType.news);
    await wp.posts.createMany(contentType.workUpdates);
    await wp.posts.create(contentType.blog);
    await wp.posts.createPages(MenuPages.all());

    await wp.customizer.applyCustomization(customizations.takeALook);
    await wp.customizer.applyCustomization(customizations.quickLinks);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    const eventIds = await wp.events.createMany(events);

    for (let index = 0; index < events.length; index++) {
      await eventEditorPage.gotoEdit(eventIds[index]);
      await eventEditorPage.fillEventDetails(events[index]);
      await eventEditorPage.selectCategory(events[index].category!);
      await eventEditorPage.selectEventLocation(events[index].eventLocation!);
      await eventEditorPage.update();
    }

    await customizerPage.goto();
    await customizerPage.buildMenu(MenuPages.menu());
    await customizerPage.publish();

    await homepage.goto();
    await homepage.hoverParentLink("Parent Nav Link 1");

    await homepage.checkAccessibilityFor([
      homepage.latestNewsSectionSelector,
      homepage.workUpdatesSectionSelector,
      homepage.blogsSectionSelector,
      homepage.takeALookColumnSelector,
      homepage.quickLinksSelector,
      homepage.eventsSectionSelector,
      homepage.primaryNavigationSelector,
      homepage.subMenuNavigation,
    ]);
  });
});
