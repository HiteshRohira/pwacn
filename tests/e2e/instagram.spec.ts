import { expect, test } from '@playwright/test';

const url = 'http://127.0.0.1:4174/instagram';

test('feed scroll, double-tap like, and comment composer work', async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole('button', { name: 'Reels', exact: true })).toBeVisible();
  const photo = page.getByRole('button', {
    name: "Double tap to like olivia.june's photo",
  });
  await photo.tap();
  await photo.tap();
  await expect(page.getByRole('button', { name: 'Unlike post' })).toBeVisible();

  await page.locator('.ig-feed-scroll').evaluate((node) => node.scrollBy(0, 450));
  await expect
    .poll(() => page.locator('.ig-feed-scroll').evaluate((node) => node.scrollTop))
    .toBeGreaterThan(300);
  await page.getByRole('button', { name: "View comments on olivia.june's post" }).tap();
  await page.getByRole('textbox', { name: 'Add a comment' }).fill('Beautiful scene!');
  await page.getByRole('button', { name: 'Post', exact: true }).tap();
  await expect(page.getByText('Beautiful scene!')).toBeVisible();
  await page.getByRole('button', { name: 'Close comments' }).tap();
  await expect(page.getByRole('dialog', { name: 'Comments' })).toHaveCount(0);
});

test('reel paging hands playback to the visible video and pauses behind comments', async ({
  page,
}) => {
  await page.goto(url);
  await page.getByRole('button', { name: 'Reels', exact: true }).tap();
  const videos = page.locator('.ig-reel video');
  await expect
    .poll(() => videos.nth(0).evaluate((node: HTMLVideoElement) => node.paused))
    .toBe(false);
  await page.locator('[data-pwacn-vertical-pager]').evaluate((node) => {
    node.scrollBy({ top: node.clientHeight, behavior: 'instant' });
  });
  await expect(page.locator('[data-pwacn-page="1"]')).toHaveAttribute(
    'aria-hidden',
    'false',
  );
  await expect
    .poll(() => videos.nth(0).evaluate((node: HTMLVideoElement) => node.paused))
    .toBe(true);
  await expect
    .poll(() => videos.nth(1).evaluate((node: HTMLVideoElement) => node.paused))
    .toBe(false);
  await page.getByRole('button', { name: 'View reel comments' }).tap();
  await expect(page.getByRole('dialog', { name: 'Comments' })).toBeVisible();
  await expect
    .poll(() => videos.nth(1).evaluate((node: HTMLVideoElement) => node.paused))
    .toBe(true);
});

test('story viewer advances and returns to the feed', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('button', { name: "View olivia.june's story" }).tap();
  await expect(page.getByRole('region', { name: "olivia.june's story" })).toBeVisible();
  await page.getByRole('button', { name: 'Next story' }).tap();
  await expect(page.getByRole('region', { name: "noah.wanders's story" })).toBeVisible();
  await page.getByRole('button', { name: 'Close story' }).tap();
  await expect(
    page.getByRole('button', { name: "View olivia.june's story" }),
  ).toBeVisible();
});
