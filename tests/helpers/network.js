const localOrigin = 'http://127.0.0.1:4173';
const metricsHostSuffix = '.workers.dev';
const metricsPath = '/api/realtime';

async function installNetworkMocks(page, mode = 'valid') {
  const blockedExternalHosts = new Set();
  let metricsRequests = 0;
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === localOrigin) {
      await route.continue();
      return;
    }

    if (url.hostname.endsWith(metricsHostSuffix) && url.pathname === metricsPath) {
      metricsRequests++;
      if (mode === 'failure') {
        await route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"fixture failure"}' });
        return;
      }
      const body = mode === 'invalid'
        ? { activeUsers: -1, screenPageViews: 24, windowMinutes: 30, updatedAt: '2026-01-01T00:00:00.000Z' }
        : { activeUsers: 7, screenPageViews: 24, windowMinutes: 30, updatedAt: '2026-01-01T00:00:00.000Z' };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      return;
    }

    blockedExternalHosts.add(url.hostname);
    await route.abort('blockedbyclient');
  });

  return {
    get metricsRequests() {
      return metricsRequests;
    },
    get blockedExternalHosts() {
      return [...blockedExternalHosts].sort();
    }
  };
}

module.exports = { installNetworkMocks };
