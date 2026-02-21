import { expect, test, type Page } from '@playwright/test';

async function waitForScene(page: Page) {
  await page.waitForFunction(() => {
    const phaser = (window as unknown as { Phaser?: { GAMES: any[] } }).Phaser;
    if (!phaser || !Array.isArray(phaser.GAMES) || phaser.GAMES.length === 0) {
      return false;
    }
    const game = phaser.GAMES[0];
    const sceneManager = game?.scene;
    if (!sceneManager?.keys) {
      return false;
    }
    return Object.values(sceneManager.keys).some((scene: any) => scene?.tables);
  });
}

async function setSeason(page: Page, season: string, cycleIndex: number) {
  await page.evaluate(
    ([id, index]) => {
      const phaser = (window as any).Phaser;
      if (!phaser || !Array.isArray(phaser.GAMES) || phaser.GAMES.length === 0) {
        throw new Error('Phaser game is not ready');
      }
      const game = phaser.GAMES[0];
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

test.describe('season visual baselines', () => {
  test('captures each seasonal overlay for regression comparison', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await waitForScene(page);

    const mask = [page.locator('.hud')];
    const seasons = ['spring', 'summer', 'autumn', 'winter'] as const;

    for (const [index, season] of seasons.entries()) {
      await setSeason(page, season, index);
      await page.waitForTimeout(250);
      await expect(page).toHaveScreenshot(`season-${season}.png`, {
        animations: 'disabled',
        mask
      });
    }
  });
});
