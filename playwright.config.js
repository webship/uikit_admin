/**
 * @file
 * The browser webship-js drives for this theme.
 */
const browser = process.env.BROWSER || 'chromium';

module.exports = {
  browser,
  launchOptions: {
    headless: true,
    slowMo: 0,
    args:
      browser === 'chromium'
        ? [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--ignore-certificate-errors',
          ]
        : [],
  },
  contextOptions: {
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 },
  },
};
