import { expect, test, type Page } from '@playwright/test';

async function waitForScene(page: Page) {
  await page.waitForFunction(() => {
    const game =
      (window as unknown as { __farmToStarsGame?: { scene?: { keys?: Record<string, unknown> } } })
        .__farmToStarsGame ??
      (window as unknown as { Phaser?: { GAMES: Array<{ scene?: { keys?: Record<string, unknown> } }> } })
        .Phaser?.GAMES?.[0];
    if (!game) {
      return false;
    }
    const sceneManager = game?.scene;
    if (!sceneManager?.keys) {
      return false;
    }
    return Object.values(sceneManager.keys).some((scene) =>
      Boolean((scene as { tables?: unknown }).tables)
    );
  });
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

async function setSeason(page: Page, season: string, cycleIndex: number) {
  await page.evaluate(
    ([id, index]) => {
      const game =
        (window as any).__farmToStarsGame ??
        (Array.isArray((window as any).Phaser?.GAMES) ? (window as any).Phaser.GAMES[0] : null);
      if (!game) {
        throw new Error('Phaser game is not ready');
      }
      const scenes = game?.scene?.keys;
      const scene: any = scenes?.default ?? Object.values(scenes ?? {})[0];
      if (!scene) {
        throw new Error('IsoScene not initialized');
      }
      scene.state.season.active = id;
      scene.state.season.elapsed = 0;
      scene.state.season.cycle = index;
      scene.state.season.year = 2;
      if (typeof scene.syncSeasonState === 'function') {
        scene.syncSeasonState(true);
      } else if (scene.syncSeasonState) {
        scene.syncSeasonState = scene.syncSeasonState.bind(scene);
        scene.syncSeasonState(true);
      }
    },
    [season, cycleIndex]
  );
}

async function pauseGameLoop(page: Page) {
  await page.evaluate(() => {
    (window as any).__farmToStarsGame?.loop?.sleep?.();
  });
}

test.describe('season visual baselines', () => {
  test('captures each seasonal overlay for regression comparison', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('farm-to-stars-tutorial-completed', 'true');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await chooseCivilization(page);
    await waitForScene(page);

    const mask = [page.locator('.hud')];
    const seasons = ['spring', 'summer', 'autumn', 'winter'] as const;

    for (const [index, season] of seasons.entries()) {
      await setSeason(page, season, index);
      await pauseGameLoop(page);
      await page.waitForTimeout(250);
      await expect(page).toHaveScreenshot(`season-${season}.png`, {
        animations: 'disabled',
        mask,
        maxDiffPixels: 100
      });
    }
  });
});
