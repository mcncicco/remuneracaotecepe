const { test, expect } = require('@playwright/test');
const { openTestPage } = require('./helpers/page.js');

test.beforeEach(async ({ page }) => {
  await openTestPage(page);
});

test('exibe os valores iniciais e sincroniza a memória de cálculo', async ({ page }) => {
  await expect(page.locator('.card-value strong')).toHaveText([
    /23\.612,91/,
    /20\.939,73/,
    /16\.655,30/
  ]);
  await expect(page.locator('#breakdown-body tr.total td')).toHaveText([
    '23.612,91',
    '20.939,73',
    '16.655,30'
  ]);
});

test('atualiza o cenário e restaura os valores iniciais', async ({ page }) => {
  const values = page.locator('.card-value strong');
  const initialValues = await values.allTextContents();
  await page.locator('#time').selectOption('1');
  await expect(values.first()).not.toHaveText(initialValues[0]);
  await page.locator('#reset').click();
  await expect(values).toHaveText(initialValues);
  await expect(page.locator('#breakdown-body tr.total td')).toHaveText([
    '23.612,91',
    '20.939,73',
    '16.655,30'
  ]);
});
