import { test } from "../src/wp.fixtures";
import Event from "../src/models/Events";

test.describe("events", () => {
  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("events");
  });

  test("should display a single event", async ({
    wp,
    homepage,
    wordpressLoginPage,
    eventEditorPage,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle("Commercial Strategy Workshop")
      .withContent("A session covering the latest commercial strategy updates.")
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
    await homepage.assertEventOnHomepage(event); //lets have a function that now checks this card. then we can write another scenarion to check when there are multiple events
  });
});
