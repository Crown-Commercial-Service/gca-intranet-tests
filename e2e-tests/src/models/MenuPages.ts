import Post from "./Post";

export default class MenuPages {
  static all(): Post[] {
    return [
      Post.aPage().withFixedTitle("About GCA").withStatus("publish"),
      Post.aPage().withFixedTitle("HR").withStatus("publish"),
      Post.aPage().withFixedTitle("Workplace & Travel").withStatus("publish"),
      Post.aPage().withFixedTitle("Business Processes").withStatus("publish"),
      Post.aPage().withFixedTitle("IT, Data & Security").withStatus("publish"),
      Post.aPage().withFixedTitle("GCA Community").withStatus("publish"),

      Post.aPage().withFixedTitle("Information security").withStatus("publish"),
      Post.aPage().withFixedTitle("IT support").withStatus("publish"),

      Post.aPage().withFixedTitle("Accessibility").withStatus("publish"),
      Post.aPage().withFixedTitle("Knowledge Centre").withStatus("publish"),
      Post.aPage()
        .withFixedTitle("Marketing and communications")
        .withStatus("publish"),
      Post.aPage().withFixedTitle("Change management").withStatus("publish"),
      Post.aPage().withFixedTitle("Digital and data").withStatus("publish"),
      Post.aPage().withFixedTitle("Finance").withStatus("publish"),
      Post.aPage()
        .withFixedTitle("Customers and suppliers")
        .withStatus("publish"),

      Post.aPage().withFixedTitle("All Blogs").withStatus("publish"),
      Post.aPage().withFixedTitle("All Work Updates").withStatus("publish"),
      Post.aPage().withFixedTitle("All Events").withStatus("publish"),
      Post.aPage().withFixedTitle("Staff network").withStatus("publish"),

      Post.aPage().withFixedTitle("Our Offices").withStatus("publish"),
      Post.aPage().withFixedTitle("Working from home").withStatus("publish"),
      Post.aPage().withFixedTitle("Travel and expenses").withStatus("publish"),
      Post.aPage().withFixedTitle("Health and safety").withStatus("publish"),
      Post.aPage().withFixedTitle("Workplace and travel").withStatus("publish"),

      Post.aPage().withFixedTitle("Pay and Pensions").withStatus("publish"),
      Post.aPage()
        .withFixedTitle("Performance Management")
        .withStatus("publish"),
      Post.aPage().withFixedTitle("Health and wellbeing").withStatus("publish"),
      Post.aPage()
        .withFixedTitle("Leave, absence and flexible working")
        .withStatus("publish"),

      Post.aPage().withFixedTitle("GCA Onboarding").withStatus("publish"),
      Post.aPage().withFixedTitle("Events").withStatus("publish"),
    ];
  }

  static menu() {
    return [
      {
        parent: "About GCA",
        children: ["GCA Onboarding", "Events", "Our Offices"],
      },
    //   {
    //     parent: "HR",
    //     children: [
    //       "Pay and Pensions",
    //       "Performance Management",
    //       "Health and wellbeing",
    //       "Leave, absence and flexible working",
    //     ],
    //   },
    //   {
    //     parent: "Workplace & Travel",
    //     children: [
    //       "Our Offices",
    //       "Working from home",
    //       "Travel and expenses",
    //       "Health and safety",
    //       "Workplace and travel",
    //     ],
    //   },
    //   {
    //     parent: "Business Processes",
    //     children: [
    //       "Accessibility",
    //       "Knowledge Centre",
    //       "Marketing and communications",
    //       "Change management",
    //       "Digital and data",
    //       "Finance",
    //       "Customers and suppliers",
    //     ],
    //   },
    //   {
    //     parent: "IT, Data & Security",
    //     children: ["Information security", "IT support"],
    //   },
    //   {
    //     parent: "GCA Community",
    //     children: [
    //       "All Blogs",
    //       "All Work Updates",
    //       "All Events",
    //       "Staff network",
    //     ],
    //   },
    ];
  }
}
