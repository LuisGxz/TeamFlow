import { expect, test } from '@playwright/test';
import { loginAs, openSprintBoard } from './helpers';

test.describe('Kanban', () => {
  test('add a card, open it, comment, and move via the panel', async ({ page }) => {
    await loginAs(page, 'Owner');
    await openSprintBoard(page);

    const title = `E2E card ${Date.now() % 100000}`;

    // Quick-add into the first column.
    const firstColumn = page.locator('section').first();
    await firstColumn.getByRole('button', { name: 'New card' }).click();
    await page.locator('textarea[name="draft"]').fill(title);
    await page.getByRole('button', { name: 'Add card', exact: true }).click();
    await expect(firstColumn.getByText(title)).toBeVisible();

    // Open the new card's detail panel.
    await firstColumn.getByText(title).click();
    const panel = page.locator('aside');
    await expect(panel).toBeVisible();

    // Add a comment.
    await panel.locator('textarea[name="newComment"]').fill('Looks good from E2E.');
    await panel.getByRole('button', { name: 'Comment', exact: true }).click();
    await expect(panel.getByText('Looks good from E2E.')).toBeVisible();

    // Move it to Done via the status menu → it becomes completed.
    await panel.getByRole('button').filter({ hasText: /Backlog|To do|In progress|In review|Done/ }).first().click();
    await page.getByRole('menuitem', { name: 'Done' }).first().click();
    // Both the status pill and the "completed" badge now read Done.
    await expect(panel.getByText('Done').first()).toBeVisible();
  });

  test('list view groups cards by status', async ({ page }) => {
    await loginAs(page, 'Owner');
    await openSprintBoard(page);
    await page.getByRole('button', { name: 'List', exact: true }).click();
    await expect(page.getByText('In progress')).toBeVisible();
    await expect(page.getByText('Done', { exact: true })).toBeVisible();
  });
});
