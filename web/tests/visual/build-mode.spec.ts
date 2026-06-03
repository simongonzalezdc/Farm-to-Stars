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

async function chooseCivilization(page: Page) {
  const modal = page.locator('#civilizationChoiceModal');
  const teotihuacan = page.locator('[data-civilization-id="teotihuacan"]');
  try {
    await teotihuacan.waitFor({ state: 'visible', timeout: 5_000 });
    await teotihuacan.click();
    await expect(modal).toBeHidden({ timeout: 5_000 });
  } catch {
    if (await modal.isVisible()) {
      await teotihuacan.click({ force: true });
      await expect(modal).toBeHidden({ timeout: 5_000 });
    }
  }
}

async function setGameLoop(page: Page, active: boolean) {
  await page.evaluate((shouldRun) => {
    const loop = (window as any).__farmToStarsGame?.loop;
    if (shouldRun) {
      loop?.wake?.();
    } else {
      loop?.sleep?.();
    }
  }, active);
}

test.describe('build mode baseline', () => {
  test('captures placement ghost states for baseline comparison', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('farm-to-stars-tutorial-completed', 'true');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await chooseCivilization(page);

    const buildButtons = page.locator('#buildOptions button');
    await expect(buildButtons.first()).toBeVisible({ timeout: 15_000 });
    await buildButtons.first().click();

    await moveCursorToCanvas(page, 0.55, 0.58);
    await page.waitForTimeout(250);
    await setGameLoop(page, false);

    const mask = [page.locator('.hud')];

    await expect(page).toHaveScreenshot('placement-valid.png', {
      animations: 'disabled',
      mask,
      maxDiffPixels: 1000
    });

    await setGameLoop(page, true);
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(220);
    await setGameLoop(page, false);
    await expect(page).toHaveScreenshot('placement-rotated.png', {
      animations: 'disabled',
      mask,
      maxDiffPixels: 1000
    });

    await setGameLoop(page, true);
    await moveCursorToCanvas(page, 0.08, 0.12);
    await page.waitForTimeout(240);
    await setGameLoop(page, false);
    await expect(page).toHaveScreenshot('placement-out-of-bounds.png', {
      animations: 'disabled',
      mask,
      maxDiffPixels: 1000
    });

    await page.keyboard.press('Escape');
  });
});
