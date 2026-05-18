import { test } from "../../src/wp.fixtures";
import Event from "../../src/models/Events";
import dayjs from "dayjs";

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

  test("event with start and end date and only start time", async ({
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

  test("event with start and end date and only end time", async ({
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

  test("event with start date and end time", async ({
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

test.describe("Event upcoming and past views", () => {
  test.beforeEach(async ({ wp, wordpressLoginPage }) => {
    await wp.posts.clearByTypeAndAuthor("events");
    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("events");
  });

  test(
    "event with future start and end date appears on the Upcoming Events tab",
    { tag: "@regression" },
    async ({ wp, eventEditorPage, eventsListPage, runId }) => {
      const event = Event.anEvent()
        .withFixedTitle(`Upcoming Event ${runId}`)
        .withParagraphMaxChars(120)
        .withStartInDays(30)
        .withEndInDays(31)
        .withStatus("publish")
        .build();

      const eventId = await wp.events.create(event);

      await eventEditorPage.gotoEdit(eventId);
      await eventEditorPage.fillEventDetails(event);
      await eventEditorPage.update();

      await eventsListPage.gotoEventsList();
      await eventsListPage.assertPostVisible(event.title);
    },
  );

  test(
    "event with past start and end date appears on the Past Events tab",
    { tag: "@regression" },
    async ({ wp, eventEditorPage, eventsListPage, runId }) => {
      const event = Event.anEvent()
        .withFixedTitle(`Past Event ${runId}`)
        .withParagraphMaxChars(120)
        .withStartInDays(-2)
        .withEndInDays(-1)
        .withStatus("publish")
        .build();

      const eventId = await wp.events.create(event);

      await eventEditorPage.gotoEdit(eventId);
      await eventEditorPage.fillEventDetails(event);
      await eventEditorPage.update();

      await eventsListPage.gotoPastEventsList();
      await eventsListPage.assertPostVisible(event.title);

      await eventsListPage.gotoEventsList();
      await eventsListPage.assertPostNotVisible(event.title);
    },
  );

  test(
    "past events spanning different months are grouped under their month heading",
    { tag: "@regression" },
    async ({ wp, eventEditorPage, eventsListPage, runId }) => {
      const recentPastEvent = Event.anEvent()
        .withFixedTitle(`Recent Past ${runId}`)
        .withParagraphMaxChars(120)
        .withStartInDays(-1)
        .withEndInDays(-1)
        .withStatus("publish")
        .build();

      const earlierPastEvent = Event.anEvent()
        .withFixedTitle(`Earlier Past ${runId}`)
        .withParagraphMaxChars(120)
        .withStartInDays(-20)
        .withEndInDays(-20)
        .withStatus("publish")
        .build();

      const recentMonth = dayjs().subtract(1, "day").format("MMMM YYYY");
      const earlierMonth = dayjs().subtract(20, "day").format("MMMM YYYY");

      const recentId = await wp.events.create(recentPastEvent);
      await eventEditorPage.gotoEdit(recentId);
      await eventEditorPage.fillEventDetails(recentPastEvent);
      await eventEditorPage.update();

      const earlierId = await wp.events.create(earlierPastEvent);
      await eventEditorPage.gotoEdit(earlierId);
      await eventEditorPage.fillEventDetails(earlierPastEvent);
      await eventEditorPage.update();

      await eventsListPage.gotoPastEventsList();

      await eventsListPage.assertMonthHeadingVisible(recentMonth);
      await eventsListPage.assertMonthHeadingVisible(earlierMonth);
      await eventsListPage.assertEventUnderMonthHeading(
        recentPastEvent.title,
        recentMonth,
      );
      await eventsListPage.assertEventUnderMonthHeading(
        earlierPastEvent.title,
        earlierMonth,
      );
    },
  );

  test(
    "event with past start and future end date appears on Upcoming under the end month",
    { tag: "@regression" },
    async ({ wp, eventEditorPage, eventsListPage, runId }) => {
      const event = Event.anEvent()
        .withFixedTitle(`Spanning Event ${runId}`)
        .withParagraphMaxChars(120)
        .withStartInDays(-20)
        .withEndInDays(5)
        .withStatus("publish")
        .build();

      const endMonth = dayjs().add(5, "day").format("MMMM YYYY");

      const eventId = await wp.events.create(event);
      await eventEditorPage.gotoEdit(eventId);
      await eventEditorPage.fillEventDetails(event);
      await eventEditorPage.update();

      await eventsListPage.gotoEventsList();
      await eventsListPage.assertPostVisible(event.title);
      await eventsListPage.assertEventUnderMonthHeading(event.title, endMonth);
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
