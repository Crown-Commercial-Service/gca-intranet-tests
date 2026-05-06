import { test } from "../../src/wp.fixtures";

test.describe("Team Contact Card UI", { tag: "@regression" }, () => {
  test("HR Directorate contact card shows expected values when expanded", async ({
    contentPage,
  }) => {
    await contentPage.gotoPath("/hr/cshr-casework-service/");

    await contentPage.openContactCard();

    await contentPage.assertContactCardTitle("HR Directorate");
    await contentPage.assertContactCardDescription(
      "Short description shown below the heading",
    );
    await contentPage.assertContactCardItemCount(3);

    await contentPage.assertContactCardItem({
      title: "Email",
      subtitle: "hr-connect@gca.gov.uk",
    });
    await contentPage.assertContactCardItem({
      title: "Contact",
      subtitle: "08000000000",
    });
    await contentPage.assertContactCardItem({
      title: "Link",
      subtitle: "Example",
      href: "http://www.example.com",
    });
  });
});
