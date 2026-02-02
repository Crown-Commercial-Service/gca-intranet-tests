import { expect,test as base } from '@playwright/test';
import { HomePage } from '../src/pages/HomePage';

type UiFixtures = {
  homePage: HomePage;
};

export const test = base.extend<UiFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

});

export { expect };
