import { Page, Locator, expect } from "@playwright/test";
import BasePage from "./BasePage";

type IntroMediaPosition = "image_right" | "image_left";

export default class ContentPage extends BasePage {
  readonly pageComponentsBox: Locator;
  readonly addComponentButton: Locator;
  readonly textComponentOption: Locator;
  readonly introComponentOption: Locator;
  readonly pageComponentValues: Locator;
  readonly textComponents: Locator;
  readonly introComponents: Locator;

  constructor(page: Page, baseUrl?: string) {
    super(page, baseUrl);

    this.pageComponentsBox = this.page
      .locator(".postbox")
      .filter({ hasText: "Page components" });

    this.addComponentButton = this.pageComponentsBox.getByRole("link", {
      name: "Add component",
    });

    this.textComponentOption = this.page.locator(
      '.tmpl-popup a[data-layout="text_text"]',
    );

    this.introComponentOption = this.page.locator(
      '.tmpl-popup a[data-layout="intro_intro"]',
    );

    this.pageComponentValues = this.pageComponentsBox.locator(
      ".acf-flexible-content .values",
    );

    this.textComponents = this.pageComponentValues.locator(
      '.layout[data-layout="text_text"]',
    );

    this.introComponents = this.pageComponentValues.locator(
      '.layout[data-layout="intro_intro"]',
    );
  }

  async addTextComponent(content: string): Promise<void> {
    await this.pageComponentsBox.scrollIntoViewIfNeeded();
    await expect(this.addComponentButton).toBeVisible();
    await this.addComponentButton.click();

    await expect(this.textComponentOption).toBeVisible();
    await this.textComponentOption.click();

    const textComponent = this.textComponents.last();
    const contentInput = textComponent.getByLabel("Content");

    await expect(textComponent).toBeVisible();
    await expect(contentInput).toBeVisible();
    await contentInput.fill(content);
  }

  async addIntroAndDescriptionWithMediaComponent(params: {
    heading: string;
    content: string;
    imageFileName: string;
    imageCaption?: string;
    mediaPosition?: IntroMediaPosition;
  }): Promise<void> {
    const {
      heading,
      content,
      imageFileName,
      imageCaption,
      mediaPosition = "image_right",
    } = params;

    await this.pageComponentsBox.scrollIntoViewIfNeeded();
    await expect(this.addComponentButton).toBeVisible();
    await this.addComponentButton.click();

    await expect(this.introComponentOption).toBeVisible();
    await this.introComponentOption.click();

    const introComponent = this.introComponents.last();

    await expect(introComponent).toBeVisible();

    const headingInput = introComponent.getByLabel("Heading").first();
    await expect(headingInput).toBeVisible();
    await headingInput.fill(heading);

    await this.fillWysiwygInContainer(
      introComponent.locator('[data-name="intro_intro_content"]'),
      content,
    );

    const addMediaButton = introComponent
      .locator('[data-name="intro_intro_media"]')
      .locator('.acf-actions [data-name="add-layout"]');

    await expect(addMediaButton).toBeVisible();
    await addMediaButton.click();

    const imageOption = this.page.locator(
      '.tmpl-popup a[data-layout="image_image"]',
    );
    await expect(imageOption).toBeVisible();
    await imageOption.click();

    const imageLayout = introComponent
      .locator(
        '[data-name="intro_intro_media"] .values .layout[data-layout="image_image"]',
      )
      .last();

    await expect(imageLayout).toBeVisible();

    const addImageButton = imageLayout.getByRole("link", { name: "Add Image" });
    await expect(addImageButton).toBeVisible();
    await addImageButton.click();

    await expect(this.mediaModal).toBeVisible();
    await expect(this.uploadFilesTab).toBeVisible();
    await this.uploadFilesTab.click();

    await expect(this.mediaFileInput).toBeAttached();
    await this.mediaFileInput.setInputFiles(`assets/images/${imageFileName}`);

    await expect(this.selectMediaButton).toBeEnabled({ timeout: 15000 });
    await this.selectMediaButton.click();

    if (imageCaption) {
      await this.fillWysiwygInContainer(
        imageLayout.locator('[data-name="image_image_caption"]'),
        imageCaption,
      );
    }

    const mediaPositionRadio = introComponent.locator(
      `input[type="radio"][value="${mediaPosition}"]`,
    );
    await expect(mediaPositionRadio).toBeVisible();
    await mediaPositionRadio.check();
  }

  private async fillWysiwygInContainer(
    container: Locator,
    content: string,
  ): Promise<void> {
    const textarea = container.locator("textarea.wp-editor-area").last();

    await expect(textarea).toBeAttached();

    const editorId = await textarea.getAttribute("id");
    expect(editorId).toBeTruthy();

    await this.page.evaluate(
      ({ id, value }) => {
        const anyWindow = window as typeof window & {
          tinymce?: {
            get: (
              editorId: string,
            ) => { setContent: (html: string) => void } | null;
          };
          jQuery?: (selector: string) => {
            val: (nextValue: string) => unknown;
            trigger: (eventName: string) => unknown;
          };
        };

        const editor = anyWindow.tinymce?.get(id);
        if (editor) {
          editor.setContent(value);
          return;
        }

        const textareaEl = document.getElementById(
          id,
        ) as HTMLTextAreaElement | null;
        if (textareaEl) {
          textareaEl.value = value;
          textareaEl.dispatchEvent(new Event("input", { bubbles: true }));
          textareaEl.dispatchEvent(new Event("change", { bubbles: true }));
        }

        anyWindow.jQuery?.(`#${id}`).val(value).trigger("change");
      },
      { id: editorId!, value: content },
    );
  }
}
