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

  test("event with start and end date and start and end time", async ({ //fix date
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

  test("event with start date and start time only", async ({ //fix date
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

  test("event with start and end date and only start time", async ({ //fix date
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

  test("event with start and end date and only end time", async ({ //fix date
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

  test("event with start date and end time", async ({ //fix date
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

test.describe("Event filtering", () => {
  test.beforeEach(async ({ wp, wordpressLoginPage }) => {
    await wp.posts.clearByTypeAndAuthor("events");
    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("events");
  });

  const upcomingEvent = (title: string, startInDays: number) =>
    Event.anEvent()
      .withFixedTitle(title)
      .withParagraphMaxChars(120)
      .withStartInDays(startInDays)
      .withEndInDays(startInDays + 1)
      .withStatus("publish")
      .build();

  test(
    "filters events by a single category",
    { tag: "@regression" },
    async ({ wp, eventEditorPage, eventsListPage, runId }) => {
      const hrEvent = upcomingEvent(`HR Event ${runId}`, 60);
      const securityEvent = upcomingEvent(`Security Event ${runId}`, 61);

      const hrId = await wp.events.create(hrEvent);
      const securityId = await wp.events.create(securityEvent);

      await eventEditorPage.gotoEdit(hrId);
      await eventEditorPage.selectCategory("HR");
      await eventEditorPage.fillEventDetails(hrEvent);
      await eventEditorPage.update();

      await eventEditorPage.gotoEdit(securityId);
      await eventEditorPage.selectCategory("Information security");
      await eventEditorPage.fillEventDetails(securityEvent);
      await eventEditorPage.update();

      await eventsListPage.gotoEventsList();
      await eventsListPage.assertPostVisible(hrEvent.title);
      await eventsListPage.assertPostVisible(securityEvent.title);

      await eventsListPage.applyCategoryFilter("hr");

      await eventsListPage.assertPostVisible(hrEvent.title);
      await eventsListPage.assertPostNotVisible(securityEvent.title);
    },
  );

  test(
    "filters events by multiple categories selected together",
    { tag: "@regression" },
    async ({ wp, eventEditorPage, eventsListPage, runId }) => {
      const hrEvent = upcomingEvent(`HR Event ${runId}`, 60);
      const securityEvent = upcomingEvent(`Security Event ${runId}`, 61);
      const workdayEvent = upcomingEvent(`Workday Event ${runId}`, 62);

      const hrId = await wp.events.create(hrEvent);
      const securityId = await wp.events.create(securityEvent);
      const workdayId = await wp.events.create(workdayEvent);

      await eventEditorPage.gotoEdit(hrId);
      await eventEditorPage.selectCategory("HR");
      await eventEditorPage.fillEventDetails(hrEvent);
      await eventEditorPage.update();

      await eventEditorPage.gotoEdit(securityId);
      await eventEditorPage.selectCategory("Information security");
      await eventEditorPage.fillEventDetails(securityEvent);
      await eventEditorPage.update();

      await eventEditorPage.gotoEdit(workdayId);
      await eventEditorPage.selectCategory("Workday");
      await eventEditorPage.fillEventDetails(workdayEvent);
      await eventEditorPage.update();

      await eventsListPage.gotoEventsList();
      await eventsListPage.applyCategoryFilter("hr");
      await eventsListPage.applyCategoryFilter("information-security");

      await eventsListPage.assertPostVisible(hrEvent.title);
      await eventsListPage.assertPostVisible(securityEvent.title);
      await eventsListPage.assertPostNotVisible(workdayEvent.title);
    },
  );

  test(
    "shows a category in the filter list when at least one event uses it",
    { tag: "@regression" },
    async ({ wp, eventEditorPage, eventsListPage, runId }) => {
      const event = upcomingEvent(`Filter Visibility ${runId}`, 60);
      const eventId = await wp.events.create(event);

      await eventEditorPage.gotoEdit(eventId);
      await eventEditorPage.selectCategory("HR");
      await eventEditorPage.fillEventDetails(event);
      await eventEditorPage.update();

      await eventsListPage.gotoEventsList();
      await eventsListPage.assertCategoryFilterAvailable("hr", "HR");
    },
  );

  test(
    "sorts events by newest first by default and reverses when oldest first is selected",
    { tag: "@regression" },
    async ({ wp, eventEditorPage, eventsListPage, runId }) => {
      const earlierEvent = upcomingEvent(`Earlier Event ${runId}`, 30);
      const laterEvent = upcomingEvent(`Later Event ${runId}`, 90);

      const earlierId = await wp.events.create(earlierEvent);
      const laterId = await wp.events.create(laterEvent);

      await eventEditorPage.gotoEdit(earlierId);
      await eventEditorPage.selectCategory("Workday");
      await eventEditorPage.fillEventDetails(earlierEvent);
      await eventEditorPage.update();

      await eventEditorPage.gotoEdit(laterId);
      await eventEditorPage.selectCategory("Workday");
      await eventEditorPage.fillEventDetails(laterEvent);
      await eventEditorPage.update();

      await eventsListPage.gotoEventsList();
      await eventsListPage.applyCategoryFilter("workday");

      await eventsListPage.assertPostBefore(
        laterEvent.title,
        earlierEvent.title,
      );

      await eventsListPage.selectSortOrder("oldest");
      await eventsListPage.assertPostBefore(
        earlierEvent.title,
        laterEvent.title,
      );
    },
  );
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
