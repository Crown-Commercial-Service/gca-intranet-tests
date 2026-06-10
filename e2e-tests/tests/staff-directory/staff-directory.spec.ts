import { test } from "../../src/wp.fixtures";

// These tests depend on a real staff member existing on QA that has been imported from the Data warehouse
// (currently "Chris Morris", team "Digital and Data Services (Dev Gupta (Inherited))").
// The imported profile only returns name, team and email - there is no job title or manager.
// If that account is deleted, seed a replacement staff member in the QA DB with the same
// profile data and update the expected values below.
test.describe("staff directory", { tag: "@regression" }, () => {
  test.beforeEach(async ({ staffDirectory }) => {
    await staffDirectory.goto();
  });

  test("shows an empty-state message when no filter is applied", async ({
    staffDirectory,
  }) => {
    await staffDirectory.assertEmptyMessage();
  });

  test("can search for a staff member and view their profile", async ({
    staffDirectory,
    staffProfile,
  }) => {
    const name = "chris morris";
    const team = "Digital and Data Services (Dev Gupta (Inherited))";
    const manager = "Floyd Boss"

    await staffDirectory.search("Chris Morris");

    await staffDirectory.assertResultCount(1);
    await staffDirectory.assertStaffCard(name, undefined, manager);

    await staffDirectory.openStaffProfile(name);

    await staffProfile.expectUrlToContain("/profile/chris.morris/");
    await staffProfile.assertStaffDetails(name, team);
  });

  test("can filter staff by team and view their profile", async ({
    staffDirectory,
    staffProfile,
  }) => {
    const name = "chris morris";
    const team = "Digital and Data Services (Dev Gupta (Inherited))";
    const manager = "Floyd Boss"

    await staffDirectory.selectDirectorate("Digital and Data Services");
    await staffDirectory.selectTeam(
      "Digital and Data Services (Dev Gupta (Inherited))",
    );

    await staffDirectory.assertStaffCard(name, undefined, manager);

    await staffDirectory.openStaffProfile(name);

    await staffProfile.expectUrlToContain("/profile/chris.morris/");
    await staffProfile.assertStaffDetails(name, team);
  });
});
