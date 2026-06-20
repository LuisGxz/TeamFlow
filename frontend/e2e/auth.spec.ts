import { expect, test } from '@playwright/test';
import { loginAs, openSprintBoard } from './helpers';

test.describe('Auth & RBAC', () => {
  test('owner signs in and can create boards', async ({ page }) => {
    await loginAs(page, 'Owner');
    await expect(page.getByRole('button', { name: 'New board' })).toBeVisible();
    // Owner belongs to two workspaces — the switcher proves multi-tenancy.
    await page.locator('[data-tour="workspace"]').click();
    await expect(page.getByText('Northwind Marketing')).toBeVisible();
  });

  test('viewer is read-only', async ({ page }) => {
    await loginAs(page, 'Viewer');
    // No create button for a viewer; a read-only badge is shown instead.
    await expect(page.getByRole('button', { name: 'New board' })).toHaveCount(0);
    await expect(page.getByText('Read-only role')).toBeVisible();

    await openSprintBoard(page);
    // No quick-add affordance on the board for a viewer.
    await expect(page.getByRole('button', { name: 'New card' })).toHaveCount(0);
  });

  test('invalid credentials are rejected', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('tf-tour-seen', '1'));
    await page.goto('/login');
    await page.getByPlaceholder('you@company.com').fill('owner@teamflow.app');
    await page.getByPlaceholder('••••••••').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Invalid email or password.')).toBeVisible();
  });
});
