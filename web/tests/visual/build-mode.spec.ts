import { expect, test, type Page } from '@playwright/test';

async function moveCursorToCanvas(page: Page, ratioX: number, ratioY: number) {
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Unable to locate game canvas for screenshot capture.');
  }
  const targetX = box.x + box.width * ratioX;
  const targetY = box.y + box.height * ratioY;
  await page.mouse.move(targetX, targetY);
}

test.describe('build mode baseline', () => {
  test('captures placement ghost states for baseline comparison', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const buildButtons = page.locator('#buildOptions button');
    await expect(buildButtons.first()).toBeVisible({ timeout: 15_000 });
    await buildButtons.first().click();

    await moveCursorToCanvas(page, 0.55, 0.58);
    await page.waitForTimeout(250);

    const mask = [page.locator('.hud')];

    await expect(page).toHaveScreenshot('placement-valid.png', {
      animations: 'disabled',
      mask
    });

    await page.keyboard.press('KeyE');
    await page.waitForTimeout(220);
    await expect(page).toHaveScreenshot('placement-rotated.png', {
      animations: 'disabled',
      mask
    });

    await moveCursorToCanvas(page, 0.08, 0.12);
    await page.waitForTimeout(240);
    await expect(page).toHaveScreenshot('placement-out-of-bounds.png', {
      animations: 'disabled',
      mask
    });

    await page.keyboard.press('Escape');
  });
});
