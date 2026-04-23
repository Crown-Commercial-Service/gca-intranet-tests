import { test } from "../../src/wp.fixtures";
import Event from "../../src/models/Events";

test.describe("Event Component", { tag: "@regression" }, () => {
  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("events");
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("events");
  });

  test("event with only start date", async ({
    wp,
    wordpressLoginPage,
    eventEditorPage,
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

    await eventPage.gotoById(eventId);
    await eventPage.assertDateAndTime(event);
  });

  test("event with start date and end date", async ({
    wp,
    wordpressLoginPage,
    eventEditorPage,
    eventPage,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle("Event with start date and end date")
      .withStartDate("20-03-2026")
      .withEndDate("22-03-2026")
      .withStatus("publish");

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    const eventId = await wp.events.create(event);

    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.update();

    await eventPage.gotoById(eventId);
    await eventPage.assertDateAndTime(event);
  });

  test.skip("event with start and end date and start and end time", async ({ //fix date
    wp,
    wordpressLoginPage,
    eventEditorPage,
    eventPage,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle("Event with start and end date and start and end time")
      .withStartDate("20-03-2026")
      .withEndDate("22-03-2026")
      .withStartTime("09:30")
      .withEndTime("16:30")
      .withStatus("publish");

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    const eventId = await wp.events.create(event);

    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.update();

    await eventPage.gotoById(eventId);
    await eventPage.assertDateAndTime(event);
  });

  test.skip("event with start date and start time only", async ({ //fix date
    wp,
    wordpressLoginPage,
    eventEditorPage,
    eventPage,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle("Event with start date and start time only")
      .withStartDate("20-03-2026")
      .withStartTime("09:30")
      .withStatus("publish");

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    const eventId = await wp.events.create(event);

    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.update();

    await eventPage.gotoById(eventId);
    await eventPage.assertDateAndTime(event);
  });

  test.skip("event with start and end date and only start time", async ({ //fix date
    wp,
    wordpressLoginPage,
    eventEditorPage,
    eventPage,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle("Event with start and end date and only start time")
      .withStartDate("20-03-2026")
      .withEndDate("22-03-2026")
      .withStartTime("09:30")
      .withStatus("publish");

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    const eventId = await wp.events.create(event);

    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.update();

    await eventPage.gotoById(eventId);
    await eventPage.assertDateAndTime(event);
  });

  test.skip("event with start and end date and only end time", async ({ //fix date
    wp,
    wordpressLoginPage,
    eventEditorPage,
    eventPage,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle("Event with start and end date and only end time")
      .withStartDate("20-03-2026")
      .withEndDate("22-03-2026")
      .withEndTime("16:30")
      .withStatus("publish");

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    const eventId = await wp.events.create(event);

    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.update();

    await eventPage.gotoById(eventId);
    await eventPage.assertDateAndTime(event);
  });

  test.skip("event with start date and end time", async ({ //fix date
    wp,
    wordpressLoginPage,
    eventEditorPage,
    eventPage,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle("Event with start date and end time")
      .withStartDate("20-03-2026")
      .withEndTime("16:30")
      .withStatus("publish");

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    const eventId = await wp.events.create(event);

    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.update();

    await eventPage.gotoById(eventId);
    await eventPage.assertDateAndTime(event);
  });
});

test.describe("Event Component", { tag: "@regression" }, () => {
  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("events");
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("events");
  });

  test("can create a Two column template", async ({
    wp,
    wordpressLoginPage,
    eventEditorPage,
    eventPage,
    runId,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle(`Event[1] - ${runId}`)
      .withParagraphMaxChars(180)
      .withStartDate("20-03-2026")
      .withEndDate("22-03-2026")
      .withStatus("publish");

    const eventId = await wp.events.create(event);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();
    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.selectColumnTemplate("Layout - 2 column");
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.update();
    await eventPage.gotoById(eventId);
    await eventPage.assertTwoColumnTemplateIsApplied();
  });

  test("can create a One column template", async ({
    wp,
    wordpressLoginPage,
    eventEditorPage,
    eventPage,
    runId,
  }) => {
    const event = Event.anEvent()
      .withFixedTitle(`Event[2] - ${runId}`)
      .withParagraphMaxChars(180)
      .withStartDate("20-03-2026")
      .withEndDate("22-03-2026")
      .withStatus("publish");

    const eventId = await wp.events.create(event);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();
    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.selectColumnTemplate("Layout - 1 column");
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.update();
    await eventPage.gotoById(eventId);
    await eventPage.assertOneColumnTemplateIsApplied();
  });
});
