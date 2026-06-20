import { expect, test } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Guided demo layer', () => {
  test('the guided tour opens and advances through its steps', async ({ page }) => {
    await loginAs(page, 'Owner');

    await page.getByRole('button', { name: 'How to explore' }).first().click();
    await page.getByRole('button', { name: 'Start guided tour' }).click();

    // Step 1 (welcome) → advance to the workspace spotlight.
    await expect(page.getByText('Welcome to TeamFlow')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Switch workspaces')).toBeVisible();

    // Skip ends the tour.
    await page.getByRole('button', { name: 'Skip' }).click();
    await expect(page.getByText('Switch workspaces')).toHaveCount(0);
  });

  test('explore panel reflects role capabilities', async ({ page }) => {
    await loginAs(page, 'Viewer');
    await page.getByRole('button', { name: 'How to explore' }).first().click();

    const panel = page.locator('aside');
    await expect(panel.getByText('What your role can do')).toBeVisible();
    // A viewer can view but cannot manage members.
    await expect(panel.getByText('View boards, cards & comments')).toBeVisible();
    await expect(panel.getByText('Invite & manage members')).toBeVisible();
    // The cross-role hint lists the demo accounts.
    await expect(panel.getByText('owner@teamflow.app')).toBeVisible();
  });
});
