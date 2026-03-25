import { test } from "../../src/wp.fixtures";
import Event from "../../src/models/Events";

test.describe("Accessibility - Events component", () => {
  let event: Event;
  let eventId: number;
  const category = "Accessibility";
  const eventLocation = "Online";

  test.beforeEach(async ({ wp, wordpressLoginPage, eventEditorPage }) => {
    await wp.posts.clearByTypeAndAuthor("events");

    event = Event.anEvent()
      .withFixedTitle("Accessibility Support Session")
      .withContent("Support session for colleagues on accessibility topics.")
      .withStartDate("10-06-2026")
      .withEndDate("11-06-2026")
      .withCategory(category)
      .withEventLocation(eventLocation)
      .withCtaLabel("Book Now")
      .withCtaDestination("www.example.com/booknow")
      .withMediaImage("img-2.jpg")
      .withStatus("publish")
      .build();

    eventId = await wp.events.create(event);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await eventEditorPage.gotoEdit(eventId);
    await eventEditorPage.fillEventDetails(event);
    await eventEditorPage.selectCategory(category);
    await eventEditorPage.selectEventLocation(eventLocation);
    await eventEditorPage.update();
  });

  test.afterAll(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("events");
  });

  test("event page should have no serious or critical accessibility violations", async ({
    eventPage,
  }) => {
    await eventPage.gotoById(eventId);
    await eventPage.checkAccessibilityFor([eventPage.eventSection]);
  });

  test("events list page should have no serious or critical accessibility violations", async ({
    wp,
    wordpressLoginPage,
    eventEditorPage,
    eventsListPage,
  }) => {
    await wp.posts.clearByTypeAndAuthor("events");

    const events = Event.manyEvents(11);
    const eventIds = await wp.events.createMany(events);

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    for (let index = 0; index < events.length; index++) {
      await eventEditorPage.gotoEdit(eventIds[index]);
      await eventEditorPage.fillEventDetails(events[index]);
      await eventEditorPage.selectCategory(events[index].category!);
      await eventEditorPage.selectEventLocation(events[index].eventLocation!);
      await eventEditorPage.update();
    }

    await eventsListPage.goto();
    await eventsListPage.checkAccessibilityFor([
      eventsListPage.eventsListSection,
    ]);
  });
});
