import { test, expect } from "../../src/wp.fixtures";
import Event from "../../src/models/Events";

test.describe("event builders", () => {
  test("event with only start date", async ({
    wp,
    wordpressLoginPage,
    eventEditorPage,
    eventsListPage,
    eventPage,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle("Event with only start date")
      .withStartDate("20-03-2026")
      .withStatus("publish");

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    const eventId = await wp.events.create(event);

    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.update();
    await eventPage.goto(eventId);
    await eventsListPage.goto();
  });

  test("event with start date and end date", async ({
    wp,
    wordpressLoginPage,
    eventEditorPage,
    eventsListPage,
    eventPage,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle("Event with start date and end date")
      .withStartDate("20-03-2026")
      .withEndDate("22-03-2026");

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    const eventId = await wp.events.create(event);

    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.update();
    await eventPage.goto(eventId);
    await eventsListPage.goto();
  });

  test("event with start and end date and start and end time", async ({
    wp,
    wordpressLoginPage,
    eventEditorPage,
    eventsListPage,
    eventPage,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle("Event with start and end date and start and end time")
      .withStartDate("20-03-2026")
      .withEndDate("22-03-2026")
      .withStartTime("09:30")
      .withEndTime("16:30");

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    const eventId = await wp.events.create(event);

    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.update();
    await eventPage.goto(eventId);
    await eventsListPage.goto();
  });

  test("event with start date and start time only", async ({
    wp,
    wordpressLoginPage,
    eventEditorPage,
    eventsListPage,
    eventPage,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle("Event with start date and start time only")
      .withStartDate("20-03-2026")
      .withStartTime("09:30");

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    const eventId = await wp.events.create(event);

    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.update();
    await eventPage.goto(eventId);
    await eventsListPage.goto();
  });

  test("event with start and end date and only start time", async ({
    wp,
    wordpressLoginPage,
    eventEditorPage,
    eventsListPage,
    eventPage,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle("Event with start and end date and only start time")
      .withStartDate("20-03-2026")
      .withEndDate("22-03-2026")
      .withStartTime("09:30");

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    const eventId = await wp.events.create(event);

    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.update();
    await eventPage.goto(eventId);
    await eventsListPage.goto();
  });

  test("event with start and end date and only end time", async ({
    wp,
    wordpressLoginPage,
    eventEditorPage,
    eventsListPage,
    eventPage,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle("Event with start and end date and only end time")
      .withStartDate("20-03-2026")
      .withEndDate("22-03-2026")
      .withEndTime("16:30");

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    const eventId = await wp.events.create(event);

    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.update();
    await eventPage.goto(eventId);
    await eventsListPage.goto();
  });

  test("event with start date and end time", async ({
    wp,
    wordpressLoginPage,
    eventEditorPage,
    eventsListPage,
    eventPage,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle("Event with start date and end time")
      .withStartDate("20-03-2026")
      .withEndTime("16:30");

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    const eventId = await wp.events.create(event);

    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.update();
    await eventPage.goto(eventId);
    await eventsListPage.goto();
  });
});
