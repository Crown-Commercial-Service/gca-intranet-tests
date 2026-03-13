import Post from "./Post";

type FooterMenuItem = {
  label: string;
  type: "page" | "custom";
  url?: string;
};

export default class FooterPages {
  static all(): Post[] {
    return [
      Post.aPage().withFixedTitle("Accessibility1").withStatus("publish"),
      Post.aPage()
        .withFixedTitle("Cookie Setting & Policy1")
        .withStatus("publish"),
    ];
  }

  static menu(): FooterMenuItem[] {
    return [
      {
        label: "Accessibility1",
        type: "page",
      },
      {
        label: "Cookie Setting & Policy1",
        type: "page",
      },
      {
        label: "Privacy policy",
        type: "custom",
        url: "https://www.gov.uk/government/publications/crown-commercial-service-privacy-notice/employee-privacy-notice-for-crown-commercial-service",
      },
      {
        label: "GCA Website",
        type: "custom",
        url: "https://www.crowncommercial.gov.uk/",
      },
      {
        label: "Cabinet Office Intranet",
        type: "custom",
        url: "https://intranet.cabinetoffice.gov.uk/",
      },
      {
        label: "Submit Intranet Feedback",
        type: "custom",
        url: "https://docs.google.com/forms/d/e/1FAIpQLSdMEQFcyE-6LB5EMOX-Eq5WXfabHEEwe-7-Mwh4W0QB6Oo1Fw/viewform?usp=header",
      },
    ];
  }
}
