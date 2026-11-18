const { test, expect } = require('@playwright/test');
const { openTestPage } = require('./helpers/page.js');

test.beforeEach(async ({ page }) => {
  await openTestPage(page);
});

test('filtra antes de agrupar e atualiza dimensões e totais', async ({ page }) => {
  await page.locator('#tab-staff').click();
  await page.locator('#positions-location').selectOption('Recife');
  await page.locator('#positions-group-role').check();

  await expect(page.locator('.positions-table thead th').nth(1)).toBeHidden();
  await expect(page.locator('#positions-total')).toHaveText('5 registros · 1 com campo estimado');
  await expect(page.locator('#positions-body tr')).toHaveCount(2);
});

test('mostra estado vazio e pagina resultados de lotação', async ({ page }) => {
  await page.locator('#tab-staff').click();
  await page.locator('#positions-location').selectOption('Recife');
  await page.locator('#positions-role').selectOption('Auditor');
  await page.locator('#positions-grade').selectOption('B');
  await expect(page.locator('#positions-body')).toContainText('Nenhum registro encontrado.');

  await page.locator('#positions-location').selectOption('');
  await page.locator('#positions-role').selectOption('');
  await page.locator('#positions-grade').selectOption('');
  await expect(page.locator('#positions-page')).toHaveText('Página 1 de 2');
  await page.locator('#positions-next').click();
  await expect(page.locator('#positions-page')).toHaveText('Página 2 de 2');
  await expect(page.locator('#positions-body tr')).toHaveCount(2);
});

test('agrupamento por cargo ignora o filtro correspondente e preserva totais', async ({ page }) => {
  await page.locator('#tab-positions').click();
  await page.locator('#functions-role').selectOption('Auditor');
  await page.locator('#functions-group-role').check();

  await expect(page.locator('.functions-table thead th').nth(1)).toBeHidden();
  await expect(page.locator('#functions-total')).toHaveText('9 registros');
  await expect(page.locator('#functions-body')).toContainText('TC-FGS-1');
  await expect(page.locator('#functions-body')).toContainText('TC-FGS-2');
});
