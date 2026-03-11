import { test } from "../src/wp.fixtures";
import Event from "../src/models/Events";
import dayjs from "dayjs";

test.describe("events", () => {
  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByType("events");
    // await wp.posts.clearByTypeAndAuthor("events");
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

    await homepage.assertEventOnHomepage(event);
  });

  test("should create three events with different future dates", async ({
    wp,
    wordpressLoginPage,
    eventEditorPage,
  }) => {
    const events = [
      Event.anEvent()
        .withFixedTitle("Commercial Strategy Briefing")
        .withCategory("Accessibility")
        .withEventLocation("Online")
        .withStartDate(dayjs().add(1, "day").format("DD-MM-YYYY") + " 12:00 am")
        .withEndDate(dayjs().add(2, "day").format("DD-MM-YYYY") + " 12:00 am")
        .withStatus("publish"),

      Event.anEvent()
        .withFixedTitle("Procurement Policy Update Session")
        .withCategory("Change management")
        .withEventLocation("In-person")
        .withStartDate(dayjs().add(3, "day").format("DD-MM-YYYY") + " 12:00 am")
        .withEndDate(dayjs().add(4, "day").format("DD-MM-YYYY") + " 12:00 am")
        .withStatus("publish"),

      Event.anEvent()
        .withFixedTitle("Supplier Engagement Workshop")
        .withCategory("Digital and data")
        .withEventLocation("Online")
        .withStartDate(dayjs().add(5, "day").format("DD-MM-YYYY") + " 12:00 am")
        .withEndDate(dayjs().add(6, "day").format("DD-MM-YYYY") + " 12:00 am")
        .withStatus("publish"),
    ];

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    for (const event of events) {
      const eventId = await wp.events.create(event);

      await eventEditorPage.gotoEdit(eventId);
      await eventEditorPage.fillEventDetails(event);
      await eventEditorPage.selectCategory(event.category!);
      await eventEditorPage.selectEventLocation(event.eventLocation!);
      await eventEditorPage.update();
    }
  });
});
