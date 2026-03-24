import TakeALook from "./TakeALook";
import QuickLinks from "./QuickLinks";

export type HomepageCustomizationSetProps = {
  takeALook: TakeALook;
  quickLinks: QuickLinks;
};

export default class HomepageCustomizationSet {
  readonly takeALook: TakeALook;
  readonly quickLinks: QuickLinks;

  constructor(props: HomepageCustomizationSetProps) {
    this.takeALook = props.takeALook;
    this.quickLinks = props.quickLinks;
  }

  static homepageSet(runId: string): HomepageCustomizationSet {
    const takeALook = TakeALook.aTakeALook().withLinkUrl(
      `https://example.com/${runId}`,
    );

    const quickLinks = QuickLinks.quickLinks()
      .withTitle(`Quick links ${runId}`)
      .withDescription(`Quick links description ${runId}`)
      .withLink1("Link 1", `https://example.com/link1-${runId}`)
      .withLink2("Link 2", `https://example.com/link2-${runId}`)
      .withLink3("Link 3", `https://example.com/link3-${runId}`);

    return new HomepageCustomizationSet({
      takeALook,
      quickLinks,
    });
  }

  static homepageSetStable(): HomepageCustomizationSet {
    const takeALook = TakeALook.aTakeALook()
      .withTitle("Take a look")
      .withDescription("Find out more about featured updates and support.")
      .withLinkText("Learn more")
      .withLinkUrl("https://example.com/stable");

    const quickLinks = QuickLinks.quickLinks()
      .withTitle("Quick links")
      .withDescription("Access commonly used tools and resources")
      .withLink1("Apply for leave", "https://intranet.gca.gov.uk/leave")
      .withLink2("HR policies", "https://intranet.gca.gov.uk/hr-policies")
      .withLink3("IT support", "https://intranet.gca.gov.uk/it-support");

    return new HomepageCustomizationSet({
      takeALook,
      quickLinks,
    });
  }
}
