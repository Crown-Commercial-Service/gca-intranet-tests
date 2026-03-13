import { test, expect } from "../src/wp.fixtures";
import Event from "../src/models/Events";
import dayjs from "dayjs";

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

    await expect(homepage.eventsRows).toHaveCount(1);

    await homepage.assertEventOnHomepage(event);
  });

  test("should render a maximum of two events on the homepage", { tag: '@regression' }, async ({
    wp,
    homepage,
    wordpressLoginPage,
    eventEditorPage,
  }) => {
    const events = [
      Event.anEvent()
        .withFixedTitle("Commercial Strategy Briefing")
        .withStartDate(dayjs().add(1, "day").format("DD-MM-YYYY") + " 12:00 am")
        .withEndDate(dayjs().add(2, "day").format("DD-MM-YYYY") + " 12:00 am")
        .withStatus("publish"),

      Event.anEvent()
        .withFixedTitle("Procurement Policy Update Session")
        .withStartDate(dayjs().add(3, "day").format("DD-MM-YYYY") + " 12:00 am")
        .withEndDate(dayjs().add(4, "day").format("DD-MM-YYYY") + " 12:00 am")
        .withStatus("publish"),

      Event.anEvent()
        .withFixedTitle("Supplier Engagement Workshop")
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

    await homepage.goto();
    await expect(homepage.eventsRows).toHaveCount(3);
    await expect(
      homepage.eventsRows.nth(0).getByTestId("events-link"),
    ).toHaveText(events[0].title);
    await expect(
      homepage.eventsRows.nth(1).getByTestId("events-link"),
    ).toHaveText(events[1].title);
    await expect(
      homepage.eventsRows.nth(2).getByTestId("events-link"),
    ).toHaveText(events[2].title);
  });

  test("should truncate event title", { tag: '@regression' },  async ({
    wp,
    homepage,
    wordpressLoginPage,
    eventEditorPage,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle(
        "Commercial Strategy and Procurement Transformation Programme Briefing for Government Commercial Function Staff",
      )
      .withStatus("publish");

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    const eventId = await wp.events.create(event);

    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.selectCategory(event.category!);
    await eventEditorPage.selectEventLocation(event.eventLocation!);
    await eventEditorPage.update();

    await homepage.goto();

    await homepage.assertEventTitleIsTruncated(event);
  });

  test("should display no events where start date is in the past", { tag: '@regression' }, async ({
    wp,
    homepage,
    wordpressLoginPage,
    eventEditorPage,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle("Past Event Start Date")
      .withCategory("Accessibility")
      .withEventLocation("Online")
      .withStartDate(
        dayjs().subtract(2, "day").format("DD-MM-YYYY") + " 12:00 am",
      )
      .withEndDate(dayjs().add(1, "day").format("DD-MM-YYYY") + " 12:00 am")
      .withStatus("publish");

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    const eventId = await wp.events.create(event);

    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.selectCategory(event.category!);
    await eventEditorPage.selectEventLocation(event.eventLocation!);
    await eventEditorPage.update();

    await homepage.goto();

    await expect(homepage.eventsRows).toHaveCount(0);
  });

  test("should not show events when the start date is the current date", { tag: '@regression' }, async ({
    wp,
    wordpressLoginPage,
    eventEditorPage,
    homepage,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle("Current Date Event Start")
      .withCategory("Change management")
      .withEventLocation("In-person")
      .withStartDate(dayjs().format("DD-MM-YYYY") + " 12:00 am")
      .withEndDate(dayjs().add(2, "day").format("DD-MM-YYYY") + " 12:00 am")
      .withStatus("publish");

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    const eventId = await wp.events.create(event);

    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.selectCategory(event.category!);
    await eventEditorPage.selectEventLocation(event.eventLocation!);
    await eventEditorPage.update();
    await expect(homepage.eventsRows).toHaveCount(0);
  });

  test("should not display events that have expired", { tag: '@regression' }, async ({
    wp,
    wordpressLoginPage,
    eventEditorPage,
    homepage,
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

      Event.anEvent()
        .withFixedTitle("Information Security Awareness Session")
        .withCategory("Information security")
        .withEventLocation("In-person")
        .withStartDate(dayjs().add(7, "day").format("DD-MM-YYYY") + " 12:00 am")
        .withEndDate(dayjs().add(8, "day").format("DD-MM-YYYY") + " 12:00 am")
        .withStatus("publish"),
    ];

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    const eventIds: number[] = [];

    for (const event of events) {
      const eventId = await wp.events.create(event);
      eventIds.push(eventId);

      await eventEditorPage.gotoEdit(eventId);
      await eventEditorPage.fillEventDetails(event);
      await eventEditorPage.selectCategory(event.category!);
      await eventEditorPage.selectEventLocation(event.eventLocation!);
      await eventEditorPage.update();
    }

    const updatedFirstEvent = Event.anEvent()
      .withFixedTitle(events[0].title)
      .withCategory(events[0].category!)
      .withEventLocation(events[0].eventLocation!)
      .withStartDate(
        dayjs().subtract(4, "day").format("DD-MM-YYYY") + " 12:00 am",
      )
      .withEndDate(
        dayjs().subtract(2, "day").format("DD-MM-YYYY") + " 12:00 am",
      )
      .withStatus("publish");

    await eventEditorPage.gotoEdit(eventIds[0]);
    await eventEditorPage.fillEventDetails(updatedFirstEvent);
    await eventEditorPage.selectCategory(updatedFirstEvent.category!);
    await eventEditorPage.selectEventLocation(updatedFirstEvent.eventLocation!);
    await eventEditorPage.update();
    await homepage.goto();
    await homepage.assertEventOrder([
      events[1].title,
      events[2].title,
      events[3].title,
    ]);
  });
});
