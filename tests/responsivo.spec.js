const { test, expect } = require('@playwright/test');
const { openTestPage } = require('./helpers/page.js');

test('mantém simulação e memória acessíveis em viewport de celular', async ({ page }) => {
  test.skip(page.viewportSize()?.width !== 375, 'Executado apenas no projeto móvel.');
  await openTestPage(page);
  await expect(page.locator('.result-card')).toHaveCount(3);
  await expect(page.locator('#memoria')).toBeVisible();
  const firstValue = await page.locator('.card-value strong').first().textContent();
  await page.locator('#time').selectOption('1');
  await expect(page.locator('.card-value strong').first()).not.toHaveText(firstValue);

  await page.locator('#tab-staff').click();
  const tableScroll = page.locator('#panel-staff .table-scroll').first();
  const canScroll = await tableScroll.evaluate(element => {
    const canScrollHorizontally = element.scrollWidth > element.clientWidth;
    element.scrollLeft = element.scrollWidth;
    return canScrollHorizontally && element.scrollLeft > 0;
  });
  expect(canScroll).toBe(true);
});
