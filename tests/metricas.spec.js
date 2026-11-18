const { test, expect } = require('@playwright/test');
const { openTestPage } = require('./helpers/page.js');

test('exibe métricas controladas e bloqueia serviços externos', async ({ page }) => {
  const { network } = await openTestPage(page);
  await expect(page.locator('#realtime-metrics')).toHaveAttribute('data-state', 'available');
  await expect(page.locator('#realtime-metrics-value')).toHaveText(
    '7 usuários ativos · 24 visualizações nos últimos 30 minutos'
  );
  expect(network.metricsRequests).toBeGreaterThan(0);
  expect(network.blockedExternalHosts.length).toBeGreaterThan(0);
});

for (const mode of ['failure', 'invalid']) {
  test(`informa indisponibilidade para métricas ${mode === 'failure' ? 'com falha' : 'inválidas'}`, async ({ page }) => {
    await openTestPage(page, { metrics: mode });
    await expect(page.locator('#realtime-metrics')).toHaveAttribute('data-state', 'unavailable');
    await expect(page.locator('#realtime-metrics-value')).toHaveText('Contagem temporariamente indisponível');
  });
}
