import { test, expect } from "../../src/wp.fixtures";

test.describe("Team Contact Card taxonomy ACF API", { tag: "@smoke" }, () => {
  test("can update HR Directorate Team Contact Card via REST", async ({
    wp,
  }) => {
    const term = await wp.taxonomies.findTermBySlug(
      "responsible_team",
      "hr-directorate",
    );
    expect(term.id).toBeGreaterThan(0);

    const acfPayload = {
      header_icon: "group",
      card_title: "HR Directorate",
      card_description:
        "E2E smoke test: contact card updated via REST API.",
      contact_items: [
        {
          icon: "email",
          item_title: "Email HR",
          item_subtitle: "hr@example.com",
          item_link_url: "mailto:hr@example.com",
        },
        {
          icon: "phone",
          item_title: "Call HR",
          item_subtitle: "Ext. 4001",
          item_link_url: "",
        },
      ],
      footer_link_text: "View HR Staff Directory →",
      footer_link_url: "https://example.com/hr",
    };

    const updated = await wp.taxonomies.updateTermAcf(
      "responsible_team",
      term.id,
      acfPayload,
    );

    expect(updated.acf, "ACF must be exposed on the term response").toBeDefined();
    expect((updated.acf as any).card_title).toBe("HR Directorate");
    expect((updated.acf as any).card_description).toContain("smoke test");
    expect((updated.acf as any).contact_items).toHaveLength(2);
  });
});
