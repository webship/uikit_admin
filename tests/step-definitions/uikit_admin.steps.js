/**
 * @file
 * The steps only the administration screens of this theme need.
 */

const assert = require('node:assert');
const { execSync } = require('node:child_process');
// eslint-disable-next-line import/no-unresolved, import/no-extraneous-dependencies
const { Given, When, Then, After } = require('@cucumber/cucumber');

const DRUSH = process.env.DRUSH || 'drush';
const PROJECT_DIR = process.env.DRUPAL_PROJECT_DIR || process.cwd();

/**
 * Runs a Drush command on the site under test.
 * @param command
 */
function drush(command) {
  return execSync(`${DRUSH} ${command}`, {
    cwd: PROJECT_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

/**
 * Signs in as user 1 with a one-time link, so no password is needed.
 *
 * Example: Given I am logged in as the Drupal administrator
 */
Given(
  /^(I am |we are )?logged in as the Drupal administrator$/,
  { timeout: 60000 },
  async function (pronoun) {
    const user = process.env.DRUPAL_ADMIN_USER;
    const password = process.env.DRUPAL_ADMIN_PASSWORD;

    // A name and a password sign in through the form, so every scenario of a
    // run may sign in again. Without them, a one-time link from Drush does it.
    if (user && password) {
      await this.page.goto(`${this.launchUrl}/user/login`);
      await this.page.fill('#edit-name', user);
      await this.page.fill('#edit-pass', password);
      await Promise.all([
        this.page.waitForURL((url) => !url.pathname.endsWith('/user/login'), {
          timeout: 30000,
        }),
        this.page.click('#edit-submit'),
      ]);
      return;
    }

    const link =
      process.env.DRUPAL_LOGIN_URL ||
      drush('user:login --no-browser').split('\n').pop();
    await this.page.goto(`${this.launchUrl}${new URL(link).pathname}`);
    await this.page.waitForURL((url) => /\/user\/\d+/.test(url.pathname), {
      timeout: 30000,
    });
  },
);

/**
 * Example: Then the element ".uikit-admin-rail" should exist
 */
Then(/^the element "([^"]*)" should exist$/, async function (selector) {
  const count = await this.page.locator(selector).count();
  assert.ok(count > 0, `No element matches "${selector}".`);
});

/**
 * Example: Then the element ".uikit-admin-palette__dialog" should be visible
 */
Then(/^the element "([^"]*)" should be visible$/, async function (selector) {
  await this.page
    .locator(selector)
    .first()
    .waitFor({ state: 'visible', timeout: 15000 });
});

/**
 * Makes sure a content type exists, so a content form can be tested on any
 * site, the standard profile or a site template.
 *
 * Example: Given the content type "page" exists
 */
Given(
  /^the content type "([^"]*)" exists$/,
  { timeout: 60000 },
  function (type) {
    const code = `if (!\\Drupal\\node\\Entity\\NodeType::load('${type}')) { \\Drupal\\node\\Entity\\NodeType::create(['type' => '${type}', 'name' => ucfirst('${type}')])->save(); node_add_body_field(\\Drupal\\node\\Entity\\NodeType::load('${type}')); }`;
    if (process.env.DRUPAL_SKIP_FIXTURES) {
      return;
    }
    drush(`php:eval "${code}"`);
  },
);

/**
 * Example: When I type "permissions" in the palette
 */
When(
  /^(I |we )*type "([^"]*)" in the palette$/,
  async function (pronoun, value) {
    const field = this.page.locator('#uikit-admin-palette-input');
    await field.waitFor({ state: 'visible', timeout: 15000 });
    await field.fill(value);
  },
);

/**
 * The default theme before a sign-in scenario, restored after it.
 */
let previousDefaultTheme = null;

/**
 * Shows the sign-in screens with this theme and one of its layouts.
 *
 * The sign-in screens use the default theme, so the scenario makes UIkit
 * Admin the default theme; the After hook puts the previous one back.
 *
 * Example: Given UIkit Admin shows the sign-in screens with the "spotlight" layout
 */
Given(
  /^UIkit Admin shows the sign-in screens with the "([^"]*)" layout$/,
  { timeout: 120000 },
  function (layout) {
    if (previousDefaultTheme === null) {
      previousDefaultTheme = drush(
        'config:get system.theme default --format=string',
      );
    }
    drush('config:set system.theme default uikit_admin -y');
    drush(`config:set uikit_admin.settings sign_in_layout ${layout} -y`);
    drush('cache:rebuild');
  },
);

After({ tags: '@sign-in', timeout: 120000 }, function () {
  if (previousDefaultTheme && previousDefaultTheme !== 'uikit_admin') {
    drush(`config:set system.theme default ${previousDefaultTheme} -y`);
    drush('cache:rebuild');
  }
  previousDefaultTheme = null;
});

/**
 * Marks the current document, to tell an HTMX swap from a full page load.
 *
 * Example: When I mark the current page
 */
When(/^(I |we )*mark the current page$/, async function (pronoun) {
  await this.page.evaluate(() => {
    window.uikitAdminMarker = 'not-reloaded';
  });
});

/**
 * Waits for the swapped page: its behaviors are attached once its assets
 * are loaded.
 *
 * Example: Then the page should have been swapped by HTMX
 */
Then(/^the page should have been swapped by HTMX$/, async function () {
  await this.page.waitForFunction(
    () =>
      window.uikitAdminMarker === 'not-reloaded' &&
      document.querySelector(
        '[data-off-canvas-main-canvas][data-uikit-admin-loaded] [data-uikit-admin-palette][data-once]',
      ),
    null,
    { timeout: 15000 },
  );
});

/**
 * Example: Then the page should have been fully loaded
 */
Then(/^the page should have been fully loaded$/, async function () {
  await this.page.waitForLoadState('load');
  const marker = await this.page.evaluate(() => window.uikitAdminMarker);
  assert.notStrictEqual(
    marker,
    'not-reloaded',
    'The page was swapped by HTMX.',
  );
});

/**
 * Example: Then the URL "/admin/content" should not be excluded from the HTMX navigation
 */
Then(
  /^the URL "([^"]*)" should (not )?be excluded from the HTMX navigation$/,
  async function (url, not) {
    await this.page.waitForFunction(
      () => typeof window.Drupal?.uikitAdmin?.isExcludedFromHtmx === 'function',
      null,
      { timeout: 15000 },
    );
    const excluded = await this.page.evaluate(
      (path) => window.Drupal.uikitAdmin.isExcludedFromHtmx(path),
      url,
    );
    assert.strictEqual(excluded, !not, `"${url}" exclusion is ${excluded}.`);
  },
);

/**
 * Example: Then the page should load nothing from another host
 */
Then(/^the page should load nothing from another host$/, async function () {
  const hosts = await this.page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => new URL(entry.name).origin)
      .filter((origin) => origin !== window.location.origin),
  );
  assert.deepStrictEqual(hosts, [], `Loaded from: ${hosts.join(', ')}`);
});

/**
 * Example: Then the element "form#user-form" should have the attribute "hx-boost" set to "false"
 */
Then(
  /^the element "([^"]*)" should have the attribute "([^"]*)" set to "([^"]*)"$/,
  async function (selector, attribute, value) {
    const actual = await this.page
      .locator(selector)
      .first()
      .getAttribute(attribute);
    assert.strictEqual(actual, value, `${selector} ${attribute}="${actual}"`);
  },
);
