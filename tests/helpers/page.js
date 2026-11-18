const { installSiteFixtures } = require('./fixtures.js');
const { installNetworkMocks } = require('./network.js');

async function openTestPage(page, { metrics = 'valid' } = {}) {
  const network = await installNetworkMocks(page, metrics);
  const fixtures = await installSiteFixtures(page);
  await page.goto('/');
  fixtures.assertServed();
  return { network };
}

module.exports = { openTestPage };
