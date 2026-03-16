import { test, expect } from "../../src/wp.fixtures";
import Event from "../../src/models/Events";
import dayjs from "dayjs";

test.describe("events", () => {
  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("events");
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("events");
  });

  test.skip("should display a single event", async ({
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

  test.skip(
    "should render a maximum of two events on the homepage",
    { tag: "@regression" },
    async ({ wp, homepage, wordpressLoginPage, eventEditorPage }) => {
      const events = [
        Event.anEvent()
          .withFixedTitle("Commercial Strategy Briefing")
          .withStartDate(dayjs().add(1, "day").format("DD-MM-YYYY"))
          .withEndDate(dayjs().add(2, "day").format("DD-MM-YYYY"))
          .withStatus("publish"),

        Event.anEvent()
          .withFixedTitle("Procurement Policy Update Session")
          .withStartDate(dayjs().add(3, "day").format("DD-MM-YYYY"))
          .withEndDate(dayjs().add(4, "day").format("DD-MM-YYYY"))
          .withStatus("publish"),

        Event.anEvent()
          .withFixedTitle("Supplier Engagement Workshop")
          .withStartDate(dayjs().add(5, "day").format("DD-MM-YYYY"))
          .withEndDate(dayjs().add(6, "day").format("DD-MM-YYYY"))
          .withStatus("publish"),

        Event.anEvent()
          .withFixedTitle("Working From Home")
          .withStartDate(dayjs().add(7, "day").format("DD-MM-YYYY"))
          .withEndDate(dayjs().add(8, "day").format("DD-MM-YYYY"))
          .withStatus("publish"),
      ];

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
      await homepage.goto();
      await expect(homepage.eventsRows).toHaveCount(3);
      await homepage.assertEventsOnHomepage(events.slice(0, 3));
    },
  );

  test.skip(
    "should truncate event title",
    { tag: "@regression" },
    async ({ wp, homepage, wordpressLoginPage, eventEditorPage }) => {
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
    },
  );

  test.skip(
    "should display no events where start date is in the past",
    { tag: "@regression" },
    async ({ wp, homepage, wordpressLoginPage, eventEditorPage }) => {
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
    },
  );

  test.skip(
    "should not show events when the start date is the current date",
    { tag: "@regression" },
    async ({ wp, wordpressLoginPage, eventEditorPage, homepage }) => {
      const event = Event.anEvent()
        .withFixedTitle("Current Date Event Start")
        .withCategory("Change management")
        .withEventLocation("In-person")
        .withStartDate(dayjs().format("DD-MM-YYYY"))
        .withEndDate(dayjs().add(2, "day").format("DD-MM-YYYY"))
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
    },
  );

  test.skip(
    "should not display events that have expired",
    { tag: "@regression" },
    async ({ wp, wordpressLoginPage, eventEditorPage, homepage }) => {
      const events = [
        Event.anEvent()
          .withFixedTitle("Commercial Strategy Briefing")
          .withCategory("Accessibility")
          .withEventLocation("Online")
          .withStartDate(dayjs().add(1, "day").format("DD-MM-YYYY"))
          .withEndDate(dayjs().add(2, "day").format("DD-MM-YYYY"))
          .withStatus("publish"),

        Event.anEvent()
          .withFixedTitle("Procurement Policy Update Session")
          .withCategory("Change management")
          .withEventLocation("In-person")
          .withStartDate(dayjs().add(3, "day").format("DD-MM-YYYY"))
          .withEndDate(dayjs().add(4, "day").format("DD-MM-YYYY"))
          .withStatus("publish"),

        Event.anEvent()
          .withFixedTitle("Supplier Engagement Workshop")
          .withCategory("Digital and data")
          .withEventLocation("Online")
          .withStartDate(dayjs().add(5, "day").format("DD-MM-YYYY"))
          .withEndDate(dayjs().add(6, "day").format("DD-MM-YYYY"))
          .withStatus("publish"),

        Event.anEvent()
          .withFixedTitle("Information Security Awareness Session")
          .withCategory("Information security")
          .withEventLocation("In-person")
          .withStartDate(dayjs().add(7, "day").format("DD-MM-YYYY"))
          .withEndDate(dayjs().add(8, "day").format("DD-MM-YYYY"))
          .withStatus("publish"),
      ];

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

      const updatedFirstEvent = Event.anEvent()
        .withFixedTitle(events[0].title)
        .withCategory(events[0].category!)
        .withEventLocation(events[0].eventLocation!)
        .withStartDate(dayjs().subtract(4, "day").format("DD-MM-YYYY"))
        .withEndDate(dayjs().subtract(2, "day").format("DD-MM-YYYY"))
        .withStatus("publish");

      await eventEditorPage.gotoEdit(eventIds[0]);
      await eventEditorPage.fillEventDetails(updatedFirstEvent);
      await eventEditorPage.selectCategory(updatedFirstEvent.category!);
      await eventEditorPage.selectEventLocation(
        updatedFirstEvent.eventLocation!,
      );
      await eventEditorPage.update();

      await homepage.goto();
      await homepage.assertEventOrder([
        events[1].title,
        events[2].title,
        events[3].title,
      ]);
    },
  );
});
