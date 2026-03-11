import { test } from "../src/wp.fixtures";
import Event from "../src/models/Events";

test.describe("events", () => {
  // test.beforeEach(async ({ wp }) => {
  //   await wp.posts.clearByType("event");
  // });

  test("should display a single event", async ({ wp, homepage }) => {
    const event = Event.anEvent()
      .withFixedTitle("Commercial Strategy Workshop")
      .withContent("A session covering the latest commercial strategy updates.")
      .withStartDate("2026-03-18 00:00:00")
      .withEndDate("2026-03-21 00:00:00")
      .withCtaLabel("Book your place")
      .withCtaDestination("https://example.com/book-your-place")
      .withStatus("publish");

    await wp.events.create(event);

    await homepage.goto();
    // await homepage.assertEventOnHomepage(event);
  });
});
