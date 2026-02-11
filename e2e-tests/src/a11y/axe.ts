import { Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

export type AxeImpact = 'minor' | 'moderate' | 'serious' | 'critical';

export type A11yRunOptions = {
  /**
   * Axe tags to include. Defaults to common WCAG tags.
   */
  tags?: string[];

  /**
   * CSS selectors to exclude from scanning (useful for known-bad widgets, cookie banners, etc.).
   */
  exclude?: string[];

  /**
   * Disable rules by id.
   */
  disableRules?: string[];

  /**
   * Best-effort settling after navigation (networkidle can hang on long-polling sites).
   */
  settleAfterGoto?: boolean;
};

const DEFAULT_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

export async function runA11yScan(page: Page, opts: A11yRunOptions = {}) {
  const { tags = DEFAULT_TAGS, exclude = [], disableRules = [], settleAfterGoto = true } = opts;

  if (settleAfterGoto) {
    await page.waitForLoadState('networkidle').catch(() => {});
  }

  let builder = new AxeBuilder({ page }).withTags(tags);

  for (const selector of exclude) {
    builder = builder.exclude(selector);
  }

  if (disableRules.length) {
    builder = builder.disableRules(disableRules);
  }

  return builder.analyze();
}

export function filterViolationsByImpact(
  results: Awaited<ReturnType<typeof runA11yScan>>,
  impacts: AxeImpact[]
) {
  const allowed = new Set(impacts);
  return results.violations.filter(v => (v.impact ? allowed.has(v.impact as AxeImpact) : false));
}
