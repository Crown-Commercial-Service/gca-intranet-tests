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

  test("should create an event with a very long title for truncation testing", async ({
    wp,
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
  });

  test("should create an event with a start date in the past", async ({
    wp,
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
  });

  test("should create an event with a start date on the current date", async ({
    wp,
    wordpressLoginPage,
    eventEditorPage,
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
  });

  test("should create four future events and edit the first event to have past dates", async ({
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
  });
});
