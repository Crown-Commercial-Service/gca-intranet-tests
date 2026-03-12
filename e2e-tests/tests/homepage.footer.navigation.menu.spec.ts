import { test, expect } from "../src/wp.fixtures";
import FooterPages from "../src/models/FooterPages";

test.describe("footer navigation menu", () => {
  test.beforeEach(async ({ wp }) => {
    await wp.posts.clearByTypeAndAuthor("page");
  });

  test("can create footer links and navigate them", async ({
    wp,
    wordpressLoginPage,
    customizerPage,
    homepage,
  }) => {
    await wp.posts.createPages(FooterPages.all());

    await wordpressLoginPage.goto();
    await wordpressLoginPage.loginAsAdmin();

    await customizerPage.goto();
    await customizerPage.buildFooterMenu(FooterPages.menu());
    await customizerPage.publish();

    // await homepage.goto();
    // await homepage.assertFooterLinks(FooterPages.menu());

    // await homepage.selectFooterLink("Accessibility");
    // await expect(homepage.page).toHaveURL(/accessibility\/$/);

    // await homepage.goto();
    // await homepage.selectFooterLink("Cookie Setting & Policy");
    // await expect(homepage.page).toHaveURL(/cookie-setting-and-policy\/$/);

    // await homepage.goto();
    // await homepage.selectFooterLink("Privacy policy");
    // await expect(homepage.page).toHaveURL(
    //   "https://www.gov.uk/government/publications/crown-commercial-service-privacy-notice/employee-privacy-notice-for-crown-commercial-service",
    // );

    // await homepage.goto();
    // await homepage.selectFooterLink("GCA Website");
    // await expect(homepage.page).toHaveURL(
    //   "https://www.crowncommercial.gov.uk/",
    // );

    // await homepage.goto();
    // await homepage.selectFooterLink("Cabinet Office Intranet");
    // await expect(homepage.page).toHaveURL(
    //   "https://intranet.cabinetoffice.gov.uk/",
    // );

    // await homepage.goto();
    // await homepage.selectFooterLink("Submit Intranet Feedback");
    // await expect(homepage.page).toHaveURL(
    //   "https://docs.google.com/forms/d/e/1FAIpQLSdMEQFcyE-6LB5EMOX-Eq5WXfabHEEwe-7-Mwh4W0QB6Oo1Fw/viewform?usp=header",
    // );
  });
});
