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
}
