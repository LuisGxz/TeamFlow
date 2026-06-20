import { Page, expect } from '@playwright/test';

export type DemoRole = 'Owner' | 'Member' | 'Viewer';

/** Sign in via a demo-account button. Suppresses the auto-tour for deterministic runs. */
export async function loginAs(page: Page, role: DemoRole): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('tf-tour-seen', '1');
      localStorage.setItem('tf-lang', 'en');
    } catch {
      /* ignore */
    }
  });
  await page.goto('/login');
  await page.getByText(role, { exact: true }).first().click();
  await page.waitForURL('**/app/boards', { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'Boards' })).toBeVisible();
}

export async function openSprintBoard(page: Page): Promise<void> {
  await page.getByText('Sprint Board', { exact: true }).click();
  await page.waitForURL('**/app/boards/**', { timeout: 15_000 });
  await expect(page.locator('section').first()).toBeVisible();
}
