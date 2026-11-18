const { test, expect } = require('@playwright/test');
const { officialCareer, reapplicationCareer } = require('./fixtures/concurso.js');
const { openTestPage } = require('./helpers/page.js');

test.beforeEach(async ({ page }) => {
  await openTestPage(page);
});

test('pesquisa sem diferenciar acentos ou caixa e informa lista vazia', async ({ page }) => {
  await page.locator('#contest-career').selectOption({ label: officialCareer });
  await page.locator('#contest-search').fill('AGATA');
  await expect(page.locator('#contest-body tr')).toHaveCount(1);
  await expect(page.locator('#contest-body')).toContainText('Ágata Sousa');

  await page.locator('#contest-search').fill('nome inexistente');
  await expect(page.locator('#contest-count')).toHaveText('0 resultados');
  await expect(page.locator('#contest-body')).toContainText('Nenhum resultado encontrado.');
});

test('filtros PCD e Negro incluem candidatos PCD/Negro', async ({ page }) => {
  await page.locator('#contest-career').selectOption({ label: officialCareer });
  await page.locator('#contest-status').selectOption('Aprovado PCD');
  await expect(page.locator('#contest-body tr')).toHaveCount(2);
  await expect(page.locator('#contest-body')).toContainText('Caio PCD Negro');

  await page.locator('#contest-status').selectOption('Aprovado Negro');
  await expect(page.locator('#contest-body tr')).toHaveCount(2);
  await expect(page.locator('#contest-body')).toContainText('Caio PCD Negro');
});

test('ordena e pagina os resultados fictícios', async ({ page }) => {
  await page.locator('#contest-career').selectOption({ label: officialCareer });
  await page.locator('.competition-table thead th').nth(0).locator('button').click();
  await expect(page.locator('#contest-body tr').first().locator('td').first()).toHaveText('12º');

  await expect(page.locator('#contest-page')).toHaveText('Página 1 de 2');
  await page.locator('#contest-next').click();
  await expect(page.locator('#contest-page')).toHaveText('Página 2 de 2');
  await expect(page.locator('#contest-body tr')).toHaveCount(2);
});

test('não classifica na reaplicação quem não tem nota discursiva', async ({ page }) => {
  await page.locator('#contest-career').selectOption({ label: `${reapplicationCareer} — REAPLICAÇÃO` });
  const candidate = page.locator('#contest-body tr').filter({ hasText: 'Zélia sem discursiva' });
  await expect(candidate).toHaveCount(1);
  await expect(candidate.locator('td').nth(0)).toHaveText('—');
  await expect(candidate.locator('td').nth(4)).toHaveText('—');
  await expect(candidate.locator('td').nth(6)).toHaveText('—');
  await expect(page.locator('#contest-stage')).toContainText('não são classificação oficial');
});

test('compartilha a colocação em empate e projeta vagas com fixtures fictícias', async ({ page }) => {
  await page.locator('#contest-career').selectOption({ label: `${reapplicationCareer} — REAPLICAÇÃO` });
  for (const name of ['Ícaro com discursiva', 'Lara com empate']) {
    const candidate = page.locator('#contest-body tr').filter({ hasText: name });
    await expect(candidate.locator('td').first()).toHaveText('1º');
  }

  await page.locator('#contest-career').selectOption({ label: officialCareer });
  const eligibleCandidate = page.locator('#contest-body tr').filter({ hasText: 'Dora Reis' });
  await expect(eligibleCandidate).toHaveClass(/vacancy-edital/);
});
