import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Life Quest P0 End-to-End Smoke Suite', () => {
  test('completes onboarding in <=60s, logs quests in <=3 taps, levels up by 2nd-3rd quest, persists state, imports seeds/ann.json, and grants 3-day return bonus', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Life Quest/);

    // 1. Onboarding Flow (<= 60s)
    const onboarding = page.getByTestId('onboarding-screen');
    await expect(onboarding).toBeVisible();

    await page.getByTestId('onboarding-name-input').fill('Ann');
    await page.getByTestId('onboarding-next-btn').click();

    await page.getByTestId('sprite-option-1').click();
    await page.getByTestId('onboarding-next-btn').click();

    await page.getByTestId('mood-option-exhausted').click();
    await page.getByTestId('onboarding-next-btn').click();

    await page.getByTestId('focus-option-mind').click();
    await page.getByTestId('onboarding-next-btn').click();

    await page.getByTestId('onboarding-finish-btn').click();
    await expect(onboarding).toBeHidden();

    // Verify Town canvas and HUD with 3 starter quests
    await expect(page.locator('canvas')).toBeVisible();
    const hudQuestBtn = page.getByTestId('hud-quest-log-btn');
    await expect(hudQuestBtn).toContainText('Quests (3)');
    await expect(page.getByTestId('hud-level')).toHaveText('LV.1');

    // 2. Complete 3 starter quests in <= 3 taps each (HUD -> Quest Log -> Done -> Continue)
    await hudQuestBtn.click();
    await expect(page.getByTestId('quest-log-modal')).toBeVisible();

    for (let i = 0; i < 3; i++) {
      const doneBtn = page.getByTestId('quest-done-btn').first();
      await doneBtn.click();

      const rewardModal = page.getByTestId('reward-modal');
      await expect(rewardModal).toBeVisible();
      await expect(page.getByTestId('reward-closing-nudge')).toBeVisible();
      await page.getByTestId('reward-continue-btn').click();
      await expect(rewardModal).toBeHidden();
    }

    // Close Quest Log and verify Level 2 reached within 2-3 quests
    await page.getByTestId('close-quest-log-btn').click();
    await expect(page.getByTestId('hud-level')).toHaveText('LV.2');

    // 3. Reload page to verify localStorage persistence
    await page.reload();
    await expect(page.getByTestId('hud-level')).toHaveText('LV.2');

    // 4. Open Inn and import seeds/ann.json without resetting progress
    await page.getByTestId('nav-inn-btn').click();
    await expect(page.getByTestId('inn-screen-modal')).toBeVisible();

    const annSeedPath = path.resolve(__dirname, '../../seeds/ann.json');
    await page.getByTestId('inn-import-file-input').setInputFiles(annSeedPath);

    await expect(page.getByTestId('inn-status-msg')).toContainText(
      "Ann's Adventures",
    );
    await page.getByTestId('close-inn-btn').click();

    // Verify Level 2 is preserved and new quest + chains are in Quest Log
    await expect(page.getByTestId('hud-level')).toHaveText('LV.2');
    await page.getByTestId('hud-quest-log-btn').click();
    await expect(page.getByTestId('quest-log-modal')).toContainText(
      "Master's study session (1 h)",
    );

    await page.getByTestId('tab-epics').click();
    await expect(page.getByTestId('quest-log-modal')).toContainText(
      'Road to Santiago',
    );
    await expect(page.getByTestId('quest-log-modal')).toContainText(
      'Get Promoted',
    );
    await page.getByTestId('close-quest-log-btn').click();

    // 5. Simulate being away for 3 days and returning -> verify Welcome-Back Bonus
    await page.evaluate(() => {
      const raw = localStorage.getItem('life-quest-save-v1');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000)
        .toISOString()
        .slice(0, 10);
      parsed.state.player.lastSeen = threeDaysAgo;
      delete parsed.state.returnBonusClaimedOn;
      localStorage.setItem('life-quest-save-v1', JSON.stringify(parsed));
    });

    await page.reload();
    const dialogBox = page.getByTestId('dialog-box');
    await expect(dialogBox).toBeVisible();
    await expect(dialogBox).toContainText(
      'You rested for 3 days. You feel refreshed!',
    );
  });
});
