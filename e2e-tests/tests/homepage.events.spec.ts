import { test } from "../src/wp.fixtures";
import Event from "../src/models/Events";

test.describe("events", () => {
  // test.beforeEach(async ({ wp }) => {
  //   await wp.posts.clearByType("event");
  // });

  test("should display a single event", async ({
    wp,
    homepage,
    wordpressLoginPage,
    eventEditorPage,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle("Commercial Strategy Workshop")
      .withContent("A session covering the latest commercial strategy updates.")
      // .withCategory('Community')
      .withStartDate("2026-03-18 00:00:00")
      .withEndDate("2026-03-21 00:00:00")
      .withCtaLabel("Book your place")
      .withCtaDestination("https://example.com/book-your-place")
      .withStatus("publish");

    const eventId = await wp.events.create(event);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.selectCategory(event.category!);
    await eventEditorPage.selectEventLocation(event.eventLocation!);
    await eventEditorPage.update();

    await homepage.goto();
    // await homepage.assertEventOnHomepage(event);
  });
});
