import { test } from "../../src/wp.fixtures";

// These tests depend on a real staff member existing on QA that have been imported from Data warehouse (currently "Chris Morris",
// directorate "Digital and Data Services", role "Software Developer", manager "Floyd Boss").
// If that account is deleted, seed a replacement staff member in the QA DB with the same
// profile data (job title, manager, directorate/team) and update the expected values below.
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
    const role = "Software Developer";
    const manager = "Reports to: Floyd Boss";

    await staffDirectory.search("Chris Morris");

    await staffDirectory.assertResultCount(1);
    await staffDirectory.assertStaffCard(name, role, manager);

    await staffDirectory.openStaffProfile(name);

    await staffProfile.expectUrlToContain("/profile/chris.morris/");
    await staffProfile.assertStaffDetails(name, role);
  });

  test("can filter staff by team and view their profile", async ({
    staffDirectory,
    staffProfile,
  }) => {
    const name = "chris morris";
    const role = "Software Developer";
    const manager = "Reports to: Floyd Boss";

    await staffDirectory.selectDirectorate("Digital and Data Services");
    await staffDirectory.selectTeam(
      "Digital and Data Services (Dev Gupta (Inherited))",
    );

    await staffDirectory.assertStaffCard(name, role, manager);

    await staffDirectory.openStaffProfile(name);

    await staffProfile.expectUrlToContain("/profile/chris.morris/");
    await staffProfile.assertStaffDetails(name, role);
  });
});
