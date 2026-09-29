/**
 * @file
 * The steps only the administration screens of this theme need.
 */

const assert = require('node:assert');
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const {
  Given,
  When,
  Then,
  Before,
  BeforeAll,
  BeforeStep,
  After,
  Status,
  // eslint-disable-next-line import/no-unresolved, import/no-extraneous-dependencies
} = require('@cucumber/cucumber');

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
 * Runs PHP on the site under test with Drush.
 *
 * The code is one shell word in single quotes, so it reaches Drush as it is
 * written, through ddev and through the drush-www wrapper of the CI.
 *
 * @param {string} code
 *   The PHP code, without the opening tag.
 *
 * @return {string}
 *   What the code printed.
 */
function drushPhp(code) {
  return drush(`php:eval '${code.replace(/'/g, "'\\''")}'`);
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
 * Throws an uncaught error on the page, to prove that the listeners of
 * webship-js catch it, so "there should be no JavaScript errors" fails on one.
 *
 * Example: When a script of the page throws "qa-probe"
 */
When(/^a script of the page throws "([^"]*)"$/, async function (message) {
  await this.page.evaluate((text) => {
    setTimeout(() => {
      throw new Error(text);
    });
  }, message);
});

/**
 * Waits for an error the page threw, then forgets it, so the error checks
 * that follow only see the errors of the theme.
 *
 * Example: Then the JavaScript error "qa-probe" should have been caught
 */
Then(
  /^the JavaScript error "([^"]*)" should have been caught$/,
  async function (message) {
    const caught = (error) =>
      error.type === 'pageerror' && error.message.includes(message);
    const deadline = Date.now() + 5000;
    while (!(this._jsErrors || []).some(caught) && Date.now() < deadline) {
      // eslint-disable-next-line no-await-in-loop
      await this.page.waitForTimeout(100);
    }
    assert.ok(
      (this._jsErrors || []).some(caught),
      `The page threw "${message}" and nothing caught it.`,
    );
    this._jsErrors = this._jsErrors.filter((error) => !caught(error));
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
    if (process.env.DRUPAL_SKIP_FIXTURES) {
      return;
    }
    drushPhp(`
      if (!\\Drupal\\node\\Entity\\NodeType::load("${type}")) {
        $type = \\Drupal\\node\\Entity\\NodeType::create(["type" => "${type}", "name" => ucfirst("${type}")]);
        $type->save();
        node_add_body_field($type);
      }
    `);
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
 * Waits for a full page load in another theme: the page of this theme is
 * gone, not swapped.
 *
 * Example: Then the page should have left the theme in a full load
 */
Then(/^the page should have left the theme in a full load$/, async function () {
  await this.page.waitForFunction(
    () =>
      document.readyState === 'complete' &&
      window.uikitAdminMarker !== 'not-reloaded' &&
      !document.documentElement.hasAttribute('data-uikit-admin-density'),
    null,
    { timeout: 15000 },
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

/**
 * Clears every cache, so the next page is rendered cold.
 *
 * Example: Given the caches are cleared
 */
Given(/^the caches are cleared$/, { timeout: 120000 }, function () {
  drush('cache:rebuild');
});

/**
 * The settings of this theme a scenario changed, restored after it.
 */
const changedSettings = {};

/**
 * Whether the settings of this theme were stored before the scenario: a site
 * that installed the theme before it shipped them has none.
 */
let settingsStored = null;

/**
 * Example: Given the UIkit Admin setting "accent_color" is "#c0392b"
 */
Given(
  /^the UIkit Admin setting "([^"]*)" is "([^"]*)"$/,
  { timeout: 120000 },
  function (key, value) {
    if (settingsStored === null) {
      settingsStored =
        drushPhp(
          'print \\Drupal::config("uikit_admin.settings")->isNew() ? 0 : 1;',
        ) === '1';
    }
    if (settingsStored && !(key in changedSettings)) {
      changedSettings[key] = drush(
        `config:get uikit_admin.settings ${key} --format=string`,
      );
    }
    drush(`config:set uikit_admin.settings ${key} '${value}' -y`);
  },
);

After({ tags: '@settings', timeout: 120000 }, function () {
  if (settingsStored === false) {
    drush('config:delete uikit_admin.settings -y');
  }
  Object.entries(changedSettings).forEach(([key, value]) => {
    drush(`config:set uikit_admin.settings ${key} '${value}' -y`);
    delete changedSettings[key];
  });
  settingsStored = null;
});

/**
 * The content items a scenario created, deleted after it.
 */
let createdNodes = [];

/**
 * Makes sure a listing has more than one page.
 *
 * Example: Given there are at least 51 content items
 */
Given(
  /^there are at least (\d+) content items$/,
  { timeout: 120000 },
  function (count) {
    const ids = drushPhp(`
      $type = array_key_first(\\Drupal\\node\\Entity\\NodeType::loadMultiple());
      $count = \\Drupal::entityQuery("node")->accessCheck(FALSE)->count()->execute();
      $ids = [];
      for ($i = $count; $i < ${Number(count)}; $i++) {
        $node = \\Drupal\\node\\Entity\\Node::create(["type" => $type, "title" => "qa-pager " . $i]);
        $node->save();
        $ids[] = $node->id();
      }
      print implode(",", $ids);
    `);
    createdNodes = ids ? ids.split(',') : [];
  },
);

After({ tags: '@pager', timeout: 120000 }, function () {
  if (createdNodes.length) {
    drushPhp(`
      $storage = \\Drupal::entityTypeManager()->getStorage("node");
      $storage->delete($storage->loadMultiple([${createdNodes.map(Number).join(',')}]));
    `);
  }
  createdNodes = [];
});

/**
 * The messages of a page: the alerts of this theme, and the messages of the
 * front-end theme, printed its own way.
 */
const MESSAGES = '.uk-alert, [data-drupal-messages] [role]';

/**
 * The steps that may load a new page or print new messages.
 */
const TRIGGER_STEP = /^(I |we )*(press|click|submit|follow|reload)\b/;

/**
 * Marks the messages on the page before a step that may replace them, so a
 * status message step reads the messages of the next page only, never a
 * message the page showed before a save.
 */
BeforeStep(async function (scope) {
  if (!this.page || !TRIGGER_STEP.test(scope.pickleStep?.text || '')) {
    return;
  }
  await this.page
    .evaluate((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        element.setAttribute('data-uikit-admin-seen', '');
      });
    }, MESSAGES)
    .catch(() => {
      // The page is being replaced already: its messages go with it.
    });
});

/**
 * Waits for a message the last action printed: on the page it loaded, or
 * in the dialog or the listing it updated. A message the page showed before
 * the action does not count.
 *
 * Example: Then the status messages should read "Caches cleared."
 */
Then(
  /^the status messages should read "([^"]*)"$/,
  { timeout: 60000 },
  async function (text) {
    const alert = this.page
      .locator(`:is(${MESSAGES}):not([data-uikit-admin-seen])`, {
        hasText: text,
      })
      .first();
    await alert.waitFor({ state: 'visible', timeout: 45000 });
    await this.page.waitForLoadState('load');
  },
);

/**
 * The page keeps the page state of HTMX out of its URL, its links and its
 * forms: a full page load with it would miss every library.
 *
 * Example: Then the page should not carry the HTMX page state
 */
Then(/^the page should not carry the HTMX page state$/, async function () {
  const found = await this.page.evaluate(() => ({
    url: window.location.href.includes('ajax_page_state'),
    markup: document
      .querySelector('[data-off-canvas-main-canvas]')
      .outerHTML.includes('ajax_page_state'),
  }));
  assert.deepStrictEqual(found, { url: false, markup: false });
});

/**
 * Example: Then the page should have its styles and its scripts
 */
Then(/^the page should have its styles and its scripts$/, async function () {
  await this.page.waitForLoadState('load');
  const state = await this.page.evaluate(() => ({
    styles: document.querySelectorAll('link[rel="stylesheet"]').length > 0,
    drupal: typeof window.Drupal === 'object',
    uikit: typeof window.UIkit === 'function',
  }));
  assert.deepStrictEqual(state, { styles: true, drupal: true, uikit: true });
});

/**
 * Submits a form with a full page load and waits for the next page.
 *
 * Example: When I submit the form with the button "#edit-submit"
 */
When(
  /^(I |we )*submit the form with the button "([^"]*)"$/,
  async function (pronoun, selector) {
    await Promise.all([
      this.page.waitForNavigation({ timeout: 30000 }),
      this.page.locator(selector).first().click(),
    ]);
    await this.page.waitForLoadState('load');
  },
);

/**
 * Reads a computed style of an element or of one of its pseudo elements.
 *
 * @param {import('playwright').Page} page
 *   The page.
 * @param {string} selector
 *   The element.
 * @param {string} property
 *   The CSS property.
 * @param {string} pseudo
 *   The pseudo element, like "::after", or an empty string.
 *
 * @return {Promise<string>}
 *   The computed value.
 */
function computedStyle(page, selector, property, pseudo) {
  return page
    .locator(selector)
    .first()
    .evaluate(
      (element, [name, after]) =>
        getComputedStyle(element, after || null).getPropertyValue(name),
      [property, pseudo],
    );
}

/**
 * Example: Then the style "color" of the element "em.placeholder" should not be "rgb(240, 80, 110)"
 */
Then(
  /^the style "([^"]*)" of the element "([^"]*)" should (not )?be "([^"]*)"$/,
  async function (property, selector, not, value) {
    const actual = await computedStyle(this.page, selector, property, '');
    if (not) {
      assert.notStrictEqual(actual, value, `${selector} ${property}`);
    } else {
      assert.strictEqual(actual, value, `${selector} ${property}`);
    }
  },
);

/**
 * Example: Then the style "content" of the pseudo element "::after" of "label.form-required" should be "\"*\""
 */
Then(
  /^the style "([^"]*)" of the pseudo element "([^"]*)" of "([^"]*)" should be "(.*)"$/,
  async function (property, pseudo, selector, value) {
    const actual = await computedStyle(this.page, selector, property, pseudo);
    assert.strictEqual(actual, value.replace(/\\"/g, '"'), selector);
  },
);

/**
 * Example: Then the element "#edit-type" should have the value "qa_type"
 */
Then(
  /^the element "([^"]*)" should have the value "([^"]*)"$/,
  async function (selector, value) {
    await this.page.waitForFunction(
      ([sel, expected]) => document.querySelector(sel)?.value === expected,
      [selector, value],
      { timeout: 15000 },
    );
  },
);

/**
 * Example: Then the element "#edit-type" should be hidden
 */
Then(/^the element "([^"]*)" should be hidden$/, async function (selector) {
  await this.page
    .locator(selector)
    .first()
    .waitFor({ state: 'hidden', timeout: 15000 });
});

/**
 * Example: Then the element "thead th" should stay in view after scrolling 1500 pixels
 */
Then(
  /^the element "([^"]*)" should stay in view after scrolling (\d+) pixels$/,
  async function (selector, pixels) {
    await this.page.evaluate((y) => window.scrollTo(0, y), Number(pixels));
    await this.page.waitForTimeout(300);
    const top = await this.page
      .locator(selector)
      .first()
      .evaluate((element) => element.getBoundingClientRect().top);
    assert.ok(top >= 0, `${selector} scrolled out of view (top ${top}).`);
  },
);

/**
 * Example: Then the tabs should read "Settings, Manage fields"
 */
Then(/^the tabs should read "([^"]*)"$/, async function (list) {
  const tabs = await this.page.$$eval('.uikit-admin-tabs a', (links) =>
    links.map((link) => link.textContent.trim()),
  );
  assert.deepStrictEqual(tabs.join(', '), list);
});

/**
 * Example: Then the focus should be on the element ".uikit-admin-topbar__search"
 */
Then(
  /^the focus should be on the element "([^"]*)"$/,
  async function (selector) {
    await this.page.waitForFunction(
      (sel) => document.activeElement?.matches(sel),
      selector,
      { timeout: 5000 },
    );
  },
);

/**
 * Example: Then the current path should end with "/admin/content"
 */
Then(/^the current path should end with "([^"]*)"$/, async function (path) {
  await this.page.waitForFunction(
    (expected) => window.location.pathname.endsWith(expected),
    path,
    { timeout: 15000 },
  );
});

/**
 * The configuration the back-office scenarios change, restored after a
 * scenario that failed before it could put it back itself.
 */
const watchedConfig = [
  'system.site',
  'system.theme',
  'system.performance',
  'system.logging',
  'system.file',
  'system.image.gd',
  'system.date',
  'system.cron',
  'automated_cron.settings',
  'user.settings',
  'views.settings',
  'update.settings',
  'uikit_admin.settings',
];

/**
 * The modules and themes a scenario may install, uninstalled after a
 * scenario that failed before it could uninstall them itself.
 */
const optionalExtensions = {
  modules: ['telephone', 'content_moderation', 'workflows', 'comment'],
  themes: ['stark'],
};

/**
 * The state of the site before the suite ran.
 */
let initialState = null;

/**
 * Reads what the cleanup needs to put back.
 *
 * @return {object}
 *   The watched configuration, the installed extensions and the maintenance
 *   mode.
 */
function readSiteState() {
  const names = Buffer.from(JSON.stringify(watchedConfig)).toString('base64');
  return JSON.parse(
    drushPhp(`
      $config = [];
      foreach (json_decode(base64_decode("${names}")) as $name) {
        $config[$name] = \\Drupal::config($name)->getRawData();
      }
      print json_encode([
        "config" => $config,
        "modules" => array_keys(\\Drupal::moduleHandler()->getModuleList()),
        "themes" => array_keys(\\Drupal::service("theme_handler")->listInfo()),
        "maintenance" => (bool) \\Drupal::state()->get("system.maintenance_mode"),
      ]);
    `),
  );
}

/**
 * Deletes everything a scenario made: content and config named "qa-" or
 * "qa_", and, unless only the content is asked for, the extensions and the
 * configuration it changed.
 *
 * The scenarios clean up after themselves through the screens; this is the
 * safety net that keeps the suite re-runnable after one of them failed.
 *
 * @param {boolean} contentOnly
 *   TRUE to delete the content and the configuration entities only.
 */
function cleanUpSite(contentOnly = false) {
  drushPhp(`
    $etm = \\Drupal::entityTypeManager();
    $content = [
      "comment" => "subject",
      "node" => "title",
      "block_content" => "info",
      "taxonomy_term" => "name",
      "menu_link_content" => "title",
      "user" => "name",
      "path_alias" => "alias",
    ];
    foreach ($content as $type => $field) {
      if (!$etm->hasDefinition($type)) {
        continue;
      }
      $storage = $etm->getStorage($type);
      $prefix = $type === "path_alias" ? "/qa-" : "qa-";
      $ids = $storage->getQuery()->accessCheck(FALSE)->condition($field, $prefix, "STARTS_WITH")->execute();
      if ($ids) {
        $storage->delete($storage->loadMultiple($ids));
      }
    }
    foreach ($etm->getDefinitions() as $id => $definition) {
      if (!$definition instanceof \\Drupal\\Core\\Config\\Entity\\ConfigEntityTypeInterface) {
        continue;
      }
      foreach ($etm->getStorage($id)->loadMultiple() as $entity) {
        if (preg_match("/(^|[._])qa[_-]/", (string) $entity->id())) {
          try {
            $etm->getStorage($id)->load($entity->id())?->delete();
          }
          catch (\\Throwable $e) {
          }
        }
      }
    }
    field_purge_batch(1000);
  `);
  if (contentOnly || !initialState) {
    return;
  }
  const current = readSiteState();
  const modules = optionalExtensions.modules.filter(
    (name) =>
      current.modules.includes(name) && !initialState.modules.includes(name),
  );
  if (modules.length) {
    drush(`pm:uninstall ${modules.join(' ')} -y`);
  }
  const themes = optionalExtensions.themes.filter(
    (name) =>
      current.themes.includes(name) && !initialState.themes.includes(name),
  );
  const config = Buffer.from(JSON.stringify(initialState.config)).toString(
    'base64',
  );
  drushPhp(`
    foreach (json_decode(base64_decode("${config}"), TRUE) as $name => $data) {
      if ($data && \\Drupal::config($name)->getRawData() != $data) {
        \\Drupal::configFactory()->getEditable($name)->setData($data)->save();
      }
    }
    \\Drupal::state()->set("system.maintenance_mode", ${initialState.maintenance ? 'TRUE' : 'FALSE'});
  `);
  if (themes.length) {
    drush(`theme:uninstall ${themes.join(' ')} -y`);
  }
  drush('cache:rebuild');
}

BeforeAll({ timeout: 180000 }, function () {
  initialState = readSiteState();
  cleanUpSite();
});

After({ tags: '@cleanup', timeout: 180000 }, function (scope) {
  cleanUpSite(scope.result?.status === Status.PASSED);
});

/**
 * Records the last entry of the database log when a scenario starts: an
 * entry id, not a time, so an entry a previous scenario logged in the same
 * second never counts against this one.
 */
Before({ tags: '@watchdog', timeout: 60000 }, function () {
  this.uikitAdminLogSince = Number(
    drushPhp(`
      print \\Drupal::moduleHandler()->moduleExists("dblog")
        ? (int) \\Drupal::database()->query("SELECT MAX(wid) FROM {watchdog}")->fetchField()
        : 0;
    `) || 0,
  );
});

/**
 * Fails when the database log got an entry of the error level or worse
 * since the scenario started (the @watchdog tag records the start).
 *
 * Example: Then no error should have been logged
 */
Then(/^no error should have been logged$/, { timeout: 60000 }, function () {
  assert.ok(
    typeof this.uikitAdminLogSince === 'number',
    'Tag the scenario with @watchdog to watch the log.',
  );
  const errors = drushPhp(`
      if (!\\Drupal::moduleHandler()->moduleExists("dblog")) {
        return;
      }
      $rows = \\Drupal::database()->select("watchdog", "w")
        ->fields("w", ["type", "message", "variables"])
        ->condition("wid", ${this.uikitAdminLogSince}, ">")
        ->condition("severity", 3, "<=")
        ->execute();
      foreach ($rows as $row) {
        $variables = @unserialize((string) $row->variables, ["allowed_classes" => FALSE]);
        print $row->type . ": " . strip_tags(strtr((string) $row->message, is_array($variables) ? $variables : [])) . PHP_EOL;
      }
    `);
  assert.strictEqual(errors, '', `Errors were logged:\n${errors}`);
});

/**
 * Makes a content item with Drush, for the screens that edit one.
 *
 * Example: Given the "page" content item "qa-UIkit revisions" exists
 * Example: Given the unpublished "page" content item "qa-draft" exists
 */
Given(
  /^the (unpublished )?"([^"]*)" content item "([^"]*)" exists$/,
  { timeout: 60000 },
  function (unpublished, type, title) {
    drushPhp(`
      $type = \\Drupal\\node\\Entity\\NodeType::load("${type}") ? "${type}" : array_key_first(\\Drupal\\node\\Entity\\NodeType::loadMultiple());
      $node = \\Drupal\\node\\Entity\\Node::create([
        "type" => $type,
        "title" => "${title}",
        "body" => ["value" => "<p>${title}</p>", "format" => "basic_html"],
        "uid" => 1,
        "status" => ${unpublished ? 0 : 1},
      ]);
      $node->save();
    `);
  },
);

/**
 * Makes the article content type the content scenarios need: a body with a
 * summary, an image and free tagging, like the Article type of old.
 *
 * Example: Given the article content type "qa_article" exists
 */
Given(
  /^the article content type "([^"]*)" exists$/,
  { timeout: 60000 },
  function (type) {
    drushPhp(`
      if (\\Drupal\\node\\Entity\\NodeType::load("${type}")) {
        return;
      }
      $type = \\Drupal\\node\\Entity\\NodeType::create(["type" => "${type}", "name" => "qa-Article"]);
      $type->save();
      node_add_body_field($type);
      \\Drupal\\field\\Entity\\FieldStorageConfig::create([
        "field_name" => "field_qa_image",
        "entity_type" => "node",
        "type" => "image",
      ])->save();
      \\Drupal\\field\\Entity\\FieldConfig::create([
        "field_name" => "field_qa_image",
        "entity_type" => "node",
        "bundle" => "${type}",
        "label" => "Image",
      ])->save();
      \\Drupal\\field\\Entity\\FieldStorageConfig::create([
        "field_name" => "field_qa_tags",
        "entity_type" => "node",
        "type" => "entity_reference",
        "cardinality" => -1,
        "settings" => ["target_type" => "taxonomy_term"],
      ])->save();
      \\Drupal\\field\\Entity\\FieldConfig::create([
        "field_name" => "field_qa_tags",
        "entity_type" => "node",
        "bundle" => "${type}",
        "label" => "Tags",
        "settings" => [
          "handler" => "default:taxonomy_term",
          "handler_settings" => ["target_bundles" => ["tags" => "tags"], "auto_create" => TRUE],
        ],
      ])->save();
      $displays = \\Drupal::service("entity_display.repository");
      $displays->getFormDisplay("node", "${type}")
        ->setComponent("field_qa_image", ["type" => "image_image", "weight" => 2])
        ->setComponent("field_qa_tags", ["type" => "entity_reference_autocomplete_tags", "weight" => 3])
        ->setComponent("uid", ["type" => "entity_reference_autocomplete", "weight" => 5])
        ->setComponent("created", ["type" => "datetime_timestamp", "weight" => 6])
        ->setComponent("promote", ["type" => "boolean_checkbox", "weight" => 7, "settings" => ["display_label" => TRUE]])
        ->setComponent("sticky", ["type" => "boolean_checkbox", "weight" => 8, "settings" => ["display_label" => TRUE]])
        ->setComponent("path", ["type" => "path", "weight" => 9])
        ->setComponent("status", ["type" => "boolean_checkbox", "weight" => 10, "settings" => ["display_label" => TRUE]])
        ->save();
      $displays->getViewDisplay("node", "${type}")
        ->setComponent("field_qa_image", ["type" => "image", "weight" => 2])
        ->setComponent("field_qa_tags", ["type" => "entity_reference_label", "weight" => 3])
        ->save();
    `);
  },
);

/**
 * Makes a user account with Drush, for the screens that edit one.
 *
 * Example: Given the user "qa-editor" exists
 */
Given(/^the user "([^"]*)" exists$/, { timeout: 60000 }, function (name) {
  drushPhp(`
    if (!user_load_by_name("${name}")) {
      \\Drupal\\user\\Entity\\User::create([
        "name" => "${name}",
        "mail" => "${name}@example.com",
        "pass" => "Correct.Horse.42",
        "status" => 1,
      ])->save();
    }
  `);
});

/**
 * The modules a scenario installed, uninstalled after it.
 */
let scenarioModules = [];

/**
 * Installs the modules a scenario needs when the site does not have them,
 * like Layout Builder or Update, which a profile may leave out; the After
 * hook uninstalls the ones it installed.
 *
 * Example: Given the module "layout_builder" is installed
 * Example: Given the modules "update, layout_builder" are installed
 */
Given(
  /^the modules? "([^"]*)" (?:is|are) installed$/,
  { timeout: 180000 },
  function (list) {
    const modules = list.split(',').map((name) => name.trim());
    modules.forEach((name) => {
      assert.match(name, /^[a-z0-9_]+$/, `"${name}" is not a module name.`);
    });
    const installed = () =>
      drushPhp(
        'print implode(",", array_keys(\\Drupal::moduleHandler()->getModuleList()));',
      ).split(',');
    const before = installed();
    const missing = modules.filter((name) => !before.includes(name));
    if (missing.length) {
      drush(`pm:install ${missing.join(' ')} -y`);
      // The modules they brought along go too.
      const added = installed().filter((name) => !before.includes(name));
      scenarioModules = scenarioModules.concat(added);
    }
  },
);

After({ timeout: 180000 }, function () {
  if (scenarioModules.length) {
    drush(`pm:uninstall ${scenarioModules.reverse().join(' ')} -y`);
    drush('cache:rebuild');
  }
  scenarioModules = [];
});

/**
 * Whether the Comment module was installed before a comment scenario.
 */
let commentWasInstalled = null;

/**
 * Installs Comment and opens the comments of a content type.
 *
 * Example: Given comments are open on the content type "qa_article"
 */
Given(
  /^comments are open on the content type "([^"]*)"$/,
  { timeout: 120000 },
  function (type) {
    if (commentWasInstalled === null) {
      commentWasInstalled =
        drushPhp(
          'print (int) \\Drupal::moduleHandler()->moduleExists("comment");',
        ) === '1';
    }
    drush('pm:install comment -y');
    drushPhp(`
      if (!\\Drupal\\comment\\Entity\\CommentType::load("qa_comment")) {
        \\Drupal\\comment\\Entity\\CommentType::create([
          "id" => "qa_comment",
          "label" => "qa-Comments",
          "target_entity_type_id" => "node",
        ])->save();
      }
      \\Drupal::service("comment.manager")->addBodyField("qa_comment");
      if (!\\Drupal\\field\\Entity\\FieldStorageConfig::loadByName("node", "field_qa_comment")) {
        \\Drupal\\field\\Entity\\FieldStorageConfig::create([
          "field_name" => "field_qa_comment",
          "entity_type" => "node",
          "type" => "comment",
          "settings" => ["comment_type" => "qa_comment"],
        ])->save();
      }
      if (!\\Drupal\\field\\Entity\\FieldConfig::loadByName("node", "${type}", "field_qa_comment")) {
        \\Drupal\\field\\Entity\\FieldConfig::create([
          "field_name" => "field_qa_comment",
          "entity_type" => "node",
          "bundle" => "${type}",
          "label" => "Comments",
          "default_value" => [["status" => 2, "cid" => 0, "last_comment_timestamp" => 0, "last_comment_name" => "", "last_comment_uid" => 0, "comment_count" => 0]],
        ])->save();
        $displays = \\Drupal::service("entity_display.repository");
        $displays->getFormDisplay("node", "${type}")->setComponent("field_qa_comment", ["type" => "comment_default", "weight" => 20])->save();
        $displays->getViewDisplay("node", "${type}")->setComponent("field_qa_comment", ["type" => "comment_default", "weight" => 20, "label" => "above"])->save();
      }
    `);
  },
);

After({ tags: '@comments', timeout: 180000 }, function () {
  drushPhp(`
    $comments = \\Drupal::entityTypeManager()->getStorage("comment");
    $ids = $comments->getQuery()->accessCheck(FALSE)->condition("comment_type", "qa_comment")->execute();
    $comments->delete($comments->loadMultiple($ids));
    \\Drupal\\field\\Entity\\FieldStorageConfig::loadByName("node", "field_qa_comment")?->delete();
    \\Drupal\\comment\\Entity\\CommentType::load("qa_comment")?->delete();
    field_purge_batch(1000);
  `);
  if (commentWasInstalled === false) {
    drush('pm:uninstall comment -y');
  }
  commentWasInstalled = null;
});

/**
 * Types into the CKEditor 5 editor of a text area, like a person does.
 *
 * Example: When I type "Hello" in the rich text editor "#edit-body-0-value"
 */
When(
  /^(I |we )*type "([^"]*)" in the rich text editor "([^"]*)"$/,
  async function (pronoun, text, selector) {
    const editable = this.page
      .locator(`${selector} ~ .ck-editor .ck-editor__editable`)
      .first();
    await editable.waitFor({ state: 'visible', timeout: 15000 });
    // Keep typing where the caret is when the editor has the focus already.
    const focused = await editable.evaluate((element) =>
      element.contains(document.activeElement),
    );
    if (!focused) {
      await editable.click();
      await this.page.keyboard.press('Control+End');
    }
    await this.page.keyboard.type(text);
  },
);

/**
 * Types text into the element that has the focus.
 *
 * Example: When I type "first item" on the keyboard
 */
When(
  /^(I |we )*type "([^"]*)" on the keyboard$/,
  async function (pronoun, text) {
    await this.page.keyboard.type(text);
  },
);

/**
 * Presses a button of the CKEditor 5 toolbar, of one of its drop-downs or of
 * its balloon, by its label.
 *
 * Example: When I press the rich text editor button "Bold"
 */
When(
  /^(I |we )*press the rich text editor button "([^"]*)"$/,
  async function (pronoun, label) {
    const button = this.page
      .locator('.ck-button:visible')
      .filter({
        has: this.page.locator('.ck-button__label', {
          hasText: new RegExp(`^${label}$`),
        }),
      })
      .first();
    await button.click();
  },
);

/**
 * Fills the link balloon of CKEditor 5 and confirms it with Enter.
 *
 * Example: When I link the selection in the rich text editor to "https://example.com"
 */
When(
  /^(I |we )*link the selection in the rich text editor to "([^"]*)"$/,
  async function (pronoun, url) {
    // The balloon puts the focus in its URL field.
    const field = this.page
      .locator('.ck-balloon-panel_visible input.ck-input:focus')
      .first();
    await field.waitFor({ state: 'visible', timeout: 15000 });
    await field.fill(url);
    await field.press('Enter');
  },
);

/**
 * Example: Then the rich text editor "#edit-body-0-value" should contain "<strong>"
 */
Then(
  /^the rich text editor "([^"]*)" should contain "([^"]*)"$/,
  async function (selector, markup) {
    await this.page.waitForFunction(
      ([sel, expected]) => {
        const id = document
          .querySelector(sel)
          ?.getAttribute('data-ckeditor5-id');
        const editor = window.Drupal?.CKEditor5Instances?.get(id);
        return editor ? editor.getData().includes(expected) : false;
      },
      [selector, markup],
      { timeout: 15000 },
    );
  },
);

/**
 * Types a value key by key, for the fields that answer each key, and picks
 * the matching suggestion of the autocomplete.
 *
 * Example: When I pick "admin" from the autocomplete "#edit-uid-0-target-id"
 */
When(
  /^(I |we )*pick "([^"]*)" from the autocomplete "([^"]*)"$/,
  async function (pronoun, value, selector) {
    const field = this.page.locator(selector).first();
    await field.fill('');
    await field.pressSequentially(value, { delay: 50 });
    const item = this.page
      .locator('.ui-autocomplete:visible li')
      .filter({ hasText: value })
      .first();
    await item.waitFor({ state: 'visible', timeout: 15000 });
    await item.click();
  },
);

/**
 * Types a value key by key, for the fields that answer each key.
 *
 * Example: When I type "Y-m-d" into the element "#edit-date-format-pattern"
 */
When(
  /^(I |we )*type "([^"]*)" into the element "([^"]*)"$/,
  async function (pronoun, value, selector) {
    const field = this.page.locator(selector).first();
    await field.fill('');
    await field.pressSequentially(value, { delay: 30 });
  },
);

/**
 * Attaches a file of tests/fixtures to a file field.
 *
 * Example: When I attach the fixture "qa-image.png" to "input[name='files[field_qa_image_0]']"
 */
When(
  /^(I |we )*attach the fixture "([^"]*)" to "([^"]*)"$/,
  async function (pronoun, file, selector) {
    await this.page
      .locator(selector)
      .first()
      .setInputFiles(path.resolve(__dirname, '../fixtures', file));
  },
);

/**
 * Ticks or unticks the first checkbox of a table row: the row of a bulk form
 * or a table select, or the Enabled box of a menu link.
 *
 * Example: When I select the row "qa-bulk one"
 */
When(
  /^(I |we )*(select|unselect) the row "([^"]*)"$/,
  async function (pronoun, action, row) {
    const checkbox = this.page
      .locator('tbody tr')
      .filter({ hasText: row })
      .first()
      .locator('input[type="checkbox"]')
      .first();
    await (action === 'select' ? checkbox.check() : checkbox.uncheck());
  },
);

/**
 * Drags a row of a draggable table by its handle, with the mouse, like a
 * person does: a horizontal move changes its depth in a hierarchy.
 *
 * Example: When I drag the row "qa-Docs" 60 pixels to the right
 */
When(
  /^(I |we )*drag the row "([^"]*)" (\d+) pixels to the (right|left)$/,
  async function (pronoun, row, pixels, direction) {
    const handle = this.page
      .locator('tr.draggable')
      .filter({ hasText: row })
      .first()
      .locator('.tabledrag-handle')
      .first();
    const box = await handle.boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    const offset = Number(pixels) * (direction === 'right' ? 1 : -1);
    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.mouse.move(x + offset / 2, y, { steps: 5 });
    await this.page.mouse.move(x + offset, y, { steps: 5 });
    await this.page.mouse.up();
  },
);

/**
 * Clicks an operation of a table row, opening the drop-down of the other
 * operations when it is in there.
 *
 * Example: When I click the operation "Delete" in the "qa-UIkit page" row
 */
When(
  /^(I |we )*click the operation "([^"]*)" in the "([^"]*)" row$/,
  async function (pronoun, operation, row) {
    const tr = this.page.locator('tr').filter({ hasText: row }).first();
    const link = tr
      .locator('.uikit-admin-operations a, .dropbutton a')
      .filter({ hasText: new RegExp(`^\\s*${operation}\\b`) })
      .first();
    if (!(await link.isVisible())) {
      await tr.locator('button[aria-label="More operations"]').first().click();
      await link.waitFor({ state: 'visible', timeout: 15000 });
    }
    await link.click();
  },
);

/**
 * Compares the text of an element, its visually hidden parts included, with
 * the spaces collapsed.
 *
 * Example: Then the text of the element "#views-add-field" should be "Add fields"
 */
Then(
  /^the text of the element "([^"]*)" should be "([^"]*)"$/,
  async function (selector, text) {
    const element = this.page.locator(selector).first();
    await element.waitFor({ state: 'attached', timeout: 15000 });
    const actual = await element.evaluate((node) =>
      node.textContent.replace(/\s+/g, ' ').trim(),
    );
    assert.strictEqual(actual, text, selector);
  },
);

/**
 * Example: Then the element "#edit-id" should not exist
 */
Then(/^the element "([^"]*)" should not exist$/, async function (selector) {
  const count = await this.page.locator(selector).count();
  assert.strictEqual(count, 0, `"${selector}" matches ${count} elements.`);
});

/**
 * Presses the visible button with exactly this name: a submit button of a
 * form or a button of a dialog, never a link.
 *
 * Example: When I press the button "Save"
 */
When(/^(I |we )*press the button "([^"]*)"$/, async function (pronoun, name) {
  await this.page.getByRole('button', { name, exact: true }).first().click();
});

/**
 * Fills a field found by a CSS selector, spaces included.
 *
 * Example: When I fill in the element ".ui-dialog input[name='label']" with "qa Photo"
 */
When(
  /^(I |we )*fill in the element "([^"]*)" with "([^"]*)"$/,
  async function (pronoun, selector, value) {
    await this.page.locator(selector).first().fill(value);
  },
);

/**
 * Presses the primary button of the open dialog, whatever its label: Views
 * UI names it after the displays the change applies to.
 *
 * Example: When I press the primary button of the dialog
 */
When(
  /^(I |we )*press the primary button of the dialog$/,
  async function (pronoun) {
    await this.page
      .locator('.ui-dialog-buttonpane .button--primary:visible')
      .first()
      .click();
  },
);

/**
 * The configuration a scenario keeps a copy of, put back after it.
 */
const keptConfig = {};

/**
 * Keeps a copy of a configuration object, put back after the scenario, for
 * the settings forms the scenario saves.
 *
 * Example: Given the configuration "system.logging" is put back after the scenario
 */
Given(
  /^the configuration "([^"]*)" is put back after the scenario$/,
  { timeout: 60000 },
  function (name) {
    keptConfig[name] = drushPhp(
      `print base64_encode(json_encode(\\Drupal::config("${name}")->getRawData()));`,
    );
  },
);

After({ timeout: 120000 }, function () {
  const names = Object.keys(keptConfig);
  if (!names.length) {
    return;
  }
  names.forEach((name) => {
    drushPhp(`
      $data = json_decode(base64_decode("${keptConfig[name]}"), TRUE);
      if ($data) {
        \\Drupal::configFactory()->getEditable("${name}")->setData($data)->save();
      }
    `);
    delete keptConfig[name];
  });
  drush('cache:rebuild');
});

/**
 * Selects an option of a select of a table row, like its weight or its
 * parent, found by the end of its name.
 *
 * Example: When I select "-10" from the "weight" select of the "Desaturate" row
 */
When(
  /^(I |we )*select "([^"]*)" from the "([^"]*)" select of the "([^"]*)" row$/,
  async function (pronoun, value, name, row) {
    await this.page
      .locator('tr')
      .filter({ hasText: row })
      .first()
      .locator(`select[name$="[${name}]"]`)
      .first()
      .selectOption(value);
  },
);

/**
 * Shows the page in the light or the dark color scheme, as the system of the
 * person asks for it.
 *
 * Example: Given the color scheme is "dark"
 */
Given(/^the color scheme is "(light|dark)"$/, async function (scheme) {
  await this.page.emulateMedia({ colorScheme: scheme });
});

/**
 * Example: Then the page should not scroll sideways
 */
Then(/^the page should not scroll sideways$/, async function () {
  const overflow = await this.page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });
  assert.ok(overflow <= 0, `The page scrolls ${overflow}px sideways.`);
});

/**
 * Finds the elements that have no text and no control, image or frame.
 *
 * Example: Then no "[role='alert']" element should be empty
 */
Then(/^no "([^"]*)" element should be empty$/, async function (selector) {
  const empty = await this.page.evaluate(
    (sel) =>
      [...document.querySelectorAll(sel)]
        .filter(
          (element) =>
            element.textContent.trim() === '' &&
            !element.querySelector(
              'input, select, textarea, img, svg, button, iframe',
            ),
        )
        .map((element) => element.outerHTML.slice(0, 120)),
    selector,
  );
  assert.strictEqual(
    empty.length,
    0,
    `${empty.length} empty "${selector}":\n${empty.slice(0, 5).join('\n')}`,
  );
});

/**
 * Checks the target size of every visible element a selector finds, grown
 * by the hit area an absolute ::before draws around it (WCAG 2.5.5).
 *
 * Example: Then every visible ".uikit-admin-rail a" should offer a target of at least 44 by 44 pixels
 */
Then(
  /^every visible "([^"]*)" should offer a target of at least (\d+) by (\d+) pixels$/,
  async function (selector, width, height) {
    const result = await this.page.evaluate(
      ({ sel, minWidth, minHeight }) => {
        const measure = (element) => {
          const box = element.getBoundingClientRect();
          let w = box.width;
          let h = box.height;
          const before = window.getComputedStyle(element, '::before');
          if (before.content !== 'none' && before.position === 'absolute') {
            const px = (value) => parseFloat(value) || 0;
            w = Math.max(w, box.width - px(before.left) - px(before.right));
            h = Math.max(h, box.height - px(before.top) - px(before.bottom));
          }
          return [Math.round(w), Math.round(h)];
        };
        const found = [...document.querySelectorAll(sel)].filter((element) =>
          element.checkVisibility(),
        );
        return {
          count: found.length,
          small: found
            .map((element) => [element, measure(element)])
            .filter(([, [w, h]]) => w < minWidth || h < minHeight)
            .map(
              ([element, [w, h]]) =>
                `${element.tagName.toLowerCase()}.${element.className} "${element.textContent.trim().slice(0, 30)}" ${w}x${h}`,
            ),
        };
      },
      { sel: selector, minWidth: Number(width), minHeight: Number(height) },
    );
    assert.ok(result.count > 0, `No visible element matches "${selector}".`);
    assert.strictEqual(
      result.small.length,
      0,
      `Targets smaller than ${width}x${height}:\n${result.small.join('\n')}`,
    );
  },
);

/**
 * Example: Then the elements ".uikit-admin-topbar__title h1" and ".uikit-admin-topbar__search" should not overlap
 */
Then(
  /^the elements "([^"]*)" and "([^"]*)" should not overlap$/,
  async function (first, second) {
    const area = await this.page.evaluate(
      ([a, b]) => {
        const one = document.querySelector(a);
        const two = document.querySelector(b);
        if (!one || !two) {
          return null;
        }
        // The text of the first one, not its box, which may stretch.
        const range = document.createRange();
        range.selectNodeContents(one);
        const r1 = range.getBoundingClientRect();
        const r2 = two.getBoundingClientRect();
        const x = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
        const y = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
        return Math.max(0, x) * Math.max(0, y);
      },
      [first, second],
    );
    assert.notStrictEqual(area, null, `"${first}" or "${second}" is missing.`);
    assert.strictEqual(area, 0, `"${first}" covers ${area}px² of "${second}".`);
  },
);

/**
 * Example: Then the top of ".ck-sticky-panel__content" should be below the bottom of ".uikit-admin-header"
 */
Then(
  /^the top of "([^"]*)" should be below the bottom of "([^"]*)"$/,
  async function (lower, upper) {
    const [top, bottom] = await this.page.evaluate(
      ([a, b]) => [
        document.querySelector(a)?.getBoundingClientRect().top,
        document.querySelector(b)?.getBoundingClientRect().bottom,
      ],
      [lower, upper],
    );
    assert.ok(
      top !== undefined && bottom !== undefined,
      `"${lower}" or "${upper}" is missing.`,
    );
    assert.ok(
      top >= bottom - 1,
      `"${lower}" starts at ${top}px, under "${upper}" (bottom ${bottom}px).`,
    );
  },
);

/**
 * Presses Tab the given number of times, and fails when the focus lands
 * inside an element, like the closed rail.
 *
 * Example: Then the focus should not reach "nav.uikit-admin-rail" within 20 presses of Tab
 */
Then(
  /^the focus should not reach "([^"]*)" within (\d+) presses of Tab$/,
  async function (selector, presses) {
    await this.page.evaluate(() => {
      document.activeElement?.blur();
      window.scrollTo(0, 0);
    });
    for (let i = 1; i <= Number(presses); i++) {
      // eslint-disable-next-line no-await-in-loop
      await this.page.keyboard.press('Tab');
      // eslint-disable-next-line no-await-in-loop
      const inside = await this.page.evaluate(
        (sel) => !!document.activeElement?.closest(sel),
        selector,
      );
      assert.ok(!inside, `Tab ${i} put the focus inside "${selector}".`);
    }
  },
);

/**
 * Example: Then the focus should be inside the element "nav.uikit-admin-rail"
 */
Then(
  /^the focus should be inside the element "([^"]*)"$/,
  async function (selector) {
    await this.page.waitForFunction(
      (sel) => !!document.activeElement?.closest(sel),
      selector,
      { timeout: 5000 },
    );
  },
);

/**
 * Checks that nothing covers the element that has the focus.
 *
 * Example: Then the focused element should not be covered
 */
Then(/^the focused element should not be covered$/, async function () {
  const covered = await this.page.evaluate(() => {
    const element = document.activeElement;
    const box = element.getBoundingClientRect();
    if (!box.width || !box.height) {
      return ['it has no size'];
    }
    return [
      [0.5, 0.5],
      [0.1, 0.5],
      [0.9, 0.5],
      [0.5, 0.1],
      [0.5, 0.9],
    ]
      .map(([x, y]) => [box.left + box.width * x, box.top + box.height * y])
      .filter(([x, y]) => {
        const hit = document.elementFromPoint(x, y);
        return !(hit && (hit === element || element.contains(hit)));
      })
      .map(([x, y]) => `${Math.round(x)},${Math.round(y)}`);
  });
  assert.strictEqual(
    covered.length,
    0,
    `The focused element is covered at ${covered.join(' ')}.`,
  );
});

/**
 * Checks the focus ring of the element that has the focus (WCAG 2.4.13).
 *
 * Example: Then the focused element should have a 2px solid focus ring
 */
Then(
  /^the focused element should have a (\d+)px solid focus ring$/,
  async function (width) {
    const ring = await this.page.evaluate(() => {
      const style = window.getComputedStyle(document.activeElement);
      return {
        tag: document.activeElement.tagName.toLowerCase(),
        style: style.outlineStyle,
        width: parseFloat(style.outlineWidth) || 0,
      };
    });
    assert.strictEqual(ring.style, 'solid', `${ring.tag}: ${ring.style}`);
    assert.ok(
      ring.width >= Number(width),
      `${ring.tag}: the ring is ${ring.width}px`,
    );
  },
);

/**
 * Fills the CKEditor 5 editor of a text area with paragraphs, so the page is
 * long enough to scroll with the toolbar of the editor, and focuses it.
 *
 * Example: When I fill the rich text editor "#edit-body-0-value" with 60 paragraphs
 */
When(
  /^(I |we )*fill the rich text editor "([^"]*)" with (\d+) paragraphs$/,
  async function (pronoun, selector, count) {
    const editable = this.page
      .locator(`${selector} ~ .ck-editor .ck-editor__editable`)
      .first();
    await editable.waitFor({ state: 'visible', timeout: 15000 });
    await editable.evaluate((element, number) => {
      const paragraphs = Array.from(
        { length: number },
        (value, index) => `<p>Paragraph ${index + 1}</p>`,
      );
      element.ckeditorInstance.setData(paragraphs.join(''));
      // The toolbar of CKEditor sticks only while the editor has the focus.
      element.ckeditorInstance.editing.view.focus();
    }, Number(count));
  },
);

/**
 * Adds a message the way a script of Drupal does, with Drupal.Message.
 *
 * Example: When a script adds the "warning" message "A script warning."
 */
When(
  /^a script adds the "(status|warning|error)" message "([^"]*)"$/,
  async function (type, text) {
    await this.page.evaluate(
      ([kind, message]) => new Drupal.Message().add(message, { type: kind }),
      [type, text],
    );
  },
);

/**
 * Opens the form to add content of the Basic page type, or of the first type
 * with a body on a site that has no Basic page, like a site template.
 *
 * Example: When I go to a content form with a body
 */
When(
  /^(I |we )*go to a content form with a body$/,
  { timeout: 60000 },
  async function (pronoun) {
    const type = drushPhp(`
      $fields = \\Drupal::service("entity_field.manager");
      $types = array_keys(\\Drupal\\node\\Entity\\NodeType::loadMultiple());
      usort($types, fn ($a, $b) => ($b === "page") <=> ($a === "page"));
      foreach ($types as $id) {
        if (isset($fields->getFieldDefinitions("node", $id)["body"])) {
          print $id;
          break;
        }
      }
    `);
    assert.ok(type, 'No content type has a body field.');
    await this.page.goto(`${this.launchUrl}/node/add/${type}`);
  },
);

/**
 * Walks the first tab stops of the page with the keyboard and checks the
 * focus ring of each one (WCAG 2.4.13). The editing area of CKEditor draws
 * its own ring.
 *
 * Example: Then the first 25 tab stops should have a 2px solid focus ring
 */
Then(
  /^the first (\d+) tab stops should have a (\d+)px solid focus ring$/,
  async function (stops, width) {
    await this.page.evaluate(() => {
      document.activeElement?.blur();
      window.scrollTo(0, 0);
    });
    const faults = [];
    for (let i = 1; i <= Number(stops); i++) {
      // eslint-disable-next-line no-await-in-loop
      await this.page.keyboard.press('Tab');
      // eslint-disable-next-line no-await-in-loop
      const ring = await this.page.evaluate(() => {
        const element = document.activeElement;
        if (!element || element === document.body) {
          return null;
        }
        const style = window.getComputedStyle(element);
        return {
          name: `${element.tagName.toLowerCase()}.${element.className}`.slice(
            0,
            80,
          ),
          editor: element.classList.contains('ck-editor__editable'),
          style: style.outlineStyle,
          width: parseFloat(style.outlineWidth) || 0,
        };
      });
      if (
        ring &&
        !ring.editor &&
        (ring.style !== 'solid' || ring.width < Number(width))
      ) {
        faults.push(`Tab ${i}: ${ring.name} ${ring.width}px ${ring.style}`);
      }
    }
    assert.strictEqual(faults.length, 0, faults.join('\n'));
  },
);

/**
 * Waits for a batch to finish on the page it goes back to. A site with many
 * modules takes a while to check their updates.
 *
 * Example: When I wait up to 120 seconds until the path is "/admin/reports/updates"
 */
When(
  /^(I |we )*wait up to (\d+) seconds until the path is "([^"]*)"$/,
  { timeout: 300000 },
  async function (pronoun, seconds, path) {
    // The batch leaves the page first, unless it has done so already.
    await this.page
      .waitForFunction(
        (expected) => window.location.pathname !== expected,
        path,
        { timeout: 10000 },
      )
      .catch(() => {});
    await this.page.waitForFunction(
      (expected) => window.location.pathname === expected,
      path,
      { timeout: Number(seconds) * 1000 },
    );
    await this.page.waitForLoadState('load');
  },
);

/**
 * Compares the icons of the rail, the top bar and the palette with the ones
 * of the last release: they are part of how people find their way, so a
 * change of the theme never redraws them. An item the release did not know
 * may bring its own icon.
 *
 * Example: Then the icons of the shell should be the ones of the last release
 */
Then(
  /^the icons of the shell should be the ones of the last release$/,
  async function () {
    const expected = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../fixtures/shell-icons.json'),
        'utf8',
      ),
    );
    const found = await this.page.evaluate((controls) => {
      const markup = (element) =>
        element ? element.innerHTML.replace(/>\s+</g, '><').trim() : null;
      return {
        rail: [...document.querySelectorAll('.uikit-admin-rail__item')].map(
          (item) => ({
            path: new URL(item.href).pathname,
            icon: markup(item.querySelector('.uikit-admin-rail__icon')),
          }),
        ),
        controls: controls.map((selector) => {
          const svg = document.querySelector(`${selector} svg`);
          return { selector, icon: svg ? svg.outerHTML : null };
        }),
      };
    }, Object.keys(expected.controls));
    assert.ok(found.rail.length > 0, 'The rail has no item.');
    const faults = [];
    let compared = 0;
    found.rail.forEach(({ path: itemPath, icon }) => {
      // The site may live in a folder: the end of the path names the item.
      const known = Object.keys(expected.rail).find((key) =>
        itemPath.endsWith(key),
      );
      if (known) {
        compared += 1;
        if (icon !== expected.rail[known]) {
          faults.push(`${itemPath}: ${icon}`);
        }
      } else if (!icon || !icon.startsWith('<svg')) {
        faults.push(`${itemPath} has no icon`);
      }
    });
    found.controls.forEach(({ selector, icon }) => {
      if (icon !== expected.controls[selector]) {
        faults.push(`${selector}: ${icon}`);
      }
    });
    assert.ok(compared > 0, 'No item of the rail is one the release knew.');
    assert.strictEqual(
      faults.length,
      0,
      `Icons that differ from the release ${expected.release}:\n${faults.join('\n')}`,
    );
  },
);

/**
 * The scopes UI Skins stores the design tokens under.
 */
const TOKEN_SCOPES = {
  light: ':root',
  dark: ':root[data-theme="dark"]',
};

/**
 * Stores a design token the way UI Skins and the theme settings store it.
 * Put the settings back after the scenario with the "is put back" step.
 *
 * Example: Given the design token "uikit-admin-accent" is "#c0392b" in the light color mode
 */
Given(
  /^the design token "([a-z0-9-]+)" is "([^"]*)" in the (light|dark) color mode$/,
  { timeout: 60000 },
  function (token, value, mode) {
    const data = Buffer.from(
      JSON.stringify({ token, value, scope: TOKEN_SCOPES[mode] }),
    ).toString('base64');
    drushPhp(`
      $token = json_decode(base64_decode("${data}"), TRUE);
      $config = \\Drupal::configFactory()->getEditable("uikit_admin.settings");
      $variables = $config->get("third_party_settings.ui_skins.css_variables") ?: [];
      $variables[$token["token"]][$token["scope"]] = $token["value"];
      $config->set("third_party_settings.ui_skins.css_variables", $variables)->save();
    `);
  },
);

/**
 * Example: Then the design token "uikit-admin-accent" of the page should be "#c0392b"
 */
Then(
  /^the design token "([a-z0-9-]+)" of the page should be "([^"]*)"$/,
  async function (token, value) {
    const actual = await this.page.evaluate(
      (name) =>
        getComputedStyle(document.documentElement)
          .getPropertyValue(`--${name}`)
          .trim(),
      token,
    );
    assert.strictEqual(actual, value, `--${token}`);
  },
);

/**
 * Checks that the form of UI Skins offers a field for every design token
 * the theme declares, and for each of the scopes of the token.
 *
 * Example: Then every design token of the theme should have a field
 */
Then(
  /^every design token of the theme should have a field$/,
  async function () {
    const declared = fs.readFileSync(
      path.join(__dirname, '../../uikit_admin.ui_skins.css_variables.yml'),
      'utf8',
    );
    const tokens = [];
    declared.split('\n').forEach((line) => {
      const id = line.match(/^([a-z0-9-]+):$/);
      if (id) {
        tokens.push({ id: id[1], scopes: 0 });
      } else if (/^ {4}\S/.test(line) && tokens.length) {
        tokens[tokens.length - 1].scopes += 1;
      }
    });
    assert.ok(tokens.length > 0, 'The theme declares no design token.');
    const missing = await this.page.evaluate(
      (list) =>
        list
          .map(({ id, scopes }) => {
            const fields = document.querySelectorAll(
              `:is(input, select, textarea)[name*="[${id}][values_container]"][name*="[value]"]:not([type="hidden"])`,
            );
            // A color with a transparency has two fields for each scope.
            const rows = new Set(
              [...fields].map(
                (field) => field.name.match(/values_container\]\[(\d+)\]/)[1],
              ),
            );
            return rows.size >= scopes
              ? null
              : `${id}: ${rows.size} of ${scopes}`;
          })
          .filter(Boolean),
      tokens,
    );
    assert.strictEqual(
      missing.length,
      0,
      `Design tokens without a field:\n${missing.join('\n')}`,
    );
  },
);

/**
 * Adds an element to the page, for the classes of UIkit no screen of core
 * prints, like the icon button.
 *
 * Example: Given the page shows a specimen of the class "uk-icon-button"
 */
Given(
  /^the page shows a specimen of the class "([a-z0-9 -]+)"$/,
  async function (classes) {
    await this.page.evaluate((names) => {
      const specimen = document.createElement('a');
      specimen.href = '#';
      specimen.className = `${names} uikit-admin-specimen`;
      specimen.textContent = 'Specimen';
      document
        .querySelector('.uikit-admin-main .uk-container')
        .prepend(specimen);
    }, classes);
  },
);

/**
 * Hovers an element and measures the contrast of its text with what is
 * behind it (WCAG 1.4.6). The colors are painted on a canvas, so every
 * notation the browser computes is read the same way.
 *
 * Example: Then the hovered element ".uk-button-danger" should have a contrast of at least 7 to 1
 */
Then(
  /^the hovered element "([^"]*)" should have a contrast of at least ([\d.]+) to 1$/,
  async function (selector, ratio) {
    const element = this.page.locator(selector).first();
    await element.scrollIntoViewIfNeeded();
    await element.hover();
    // The transition of the button ends first.
    await this.page.waitForTimeout(400);
    const contrast = await element.evaluate((target) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      const paint = (color) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: a / 255 };
      };
      const over = (top, under) => ({
        r: top.r * top.a + under.r * (1 - top.a),
        g: top.g * top.a + under.g * (1 - top.a),
        b: top.b * top.a + under.b * (1 - top.a),
        a: 1,
      });
      // What is behind the text: the backgrounds from the element up.
      const layers = [];
      for (let node = target; node; node = node.parentElement) {
        const layer = paint(getComputedStyle(node).backgroundColor);
        if (layer.a > 0) {
          layers.push(layer);
        }
        if (layer.a === 1) {
          break;
        }
      }
      let background = { r: 255, g: 255, b: 255, a: 1 };
      layers.reverse().forEach((layer) => {
        background = over(layer, background);
      });
      const text = over(paint(getComputedStyle(target).color), background);
      const luminance = ({ r, g, b }) => {
        const [lr, lg, lb] = [r, g, b].map((channel) => {
          const value = channel / 255;
          return value <= 0.03928
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
      };
      const [light, dark] = [luminance(text), luminance(background)].sort(
        (a, b) => b - a,
      );
      return (light + 0.05) / (dark + 0.05);
    });
    assert.ok(
      contrast >= Number(ratio),
      `${selector}: ${contrast.toFixed(2)} to 1 when hovered.`,
    );
  },
);

/**
 * Makes an account with one role and the permissions the back office needs
 * to show it the administration theme. The name starts with "qa-", so the
 * cleanup deletes it.
 *
 * Example: Given the user "qa-editor" with the role "content_editor" exists
 */
Given(
  /^the user "(qa-[^"]*)" with the role "([a-z0-9_]+)" exists$/,
  { timeout: 60000 },
  function (name, role) {
    drushPhp(`
      if (!\\Drupal\\user\\Entity\\Role::load("${role}")) {
        \\Drupal\\user\\Entity\\Role::create(["id" => "${role}", "label" => "${role}"])->save();
      }
      $role = \\Drupal\\user\\Entity\\Role::load("${role}");
      foreach (["access administration pages", "view the administration theme", "access content overview"] as $permission) {
        $role->grantPermission($permission);
      }
      $role->save();
      if (!user_load_by_name("${name}")) {
        $account = \\Drupal\\user\\Entity\\User::create(["name" => "${name}", "mail" => "${name}@example.com", "status" => 1]);
        $account->addRole("${role}");
        $account->save();
      }
    `);
  },
);

/**
 * Signs in as an account with a one-time link from Drush.
 *
 * Example: Given I am logged in as the user "qa-editor"
 */
Given(
  /^(I am |we are )?logged in as the user "([^"]*)"$/,
  { timeout: 60000 },
  async function (pronoun, name) {
    const link = drush(`user:login --name=${name} --no-browser`)
      .split('\n')
      .pop();
    await this.page.goto(`${this.launchUrl}${new URL(link).pathname}`);
    await this.page.waitForURL((url) => /\/user\/\d+/.test(url.pathname), {
      timeout: 30000,
    });
  },
);

/**
 * Example: Then the style "font-family" of the element "body" should start with "\"Atkinson Hyperlegible Next\""
 */
Then(
  /^the style "([^"]*)" of the element "([^"]*)" should (not )?start with "(.*)"$/,
  async function (property, selector, not, value) {
    const actual = await computedStyle(this.page, selector, property, '');
    const expected = value.replace(/\\"/g, '"');
    assert.strictEqual(
      actual.startsWith(expected),
      !not,
      `${selector} ${property} is "${actual}"`,
    );
  },
);

/**
 * Checks that the browser fetched a font file of the theme, with success.
 *
 * Example: Then the page should have loaded the font "atkinson-hyperlegible-next-latin-wght-normal.woff2" from the theme
 */
Then(
  /^the page should have loaded the font "([^"]*)" from the theme$/,
  async function (file) {
    await this.page.waitForFunction(
      (name) =>
        document.fonts.status === 'loaded' &&
        performance
          .getEntriesByType('resource')
          .some((entry) => entry.name.endsWith(name)),
      file,
      { timeout: 15000 },
    );
    const entry = await this.page.evaluate((name) => {
      const found = performance
        .getEntriesByType('resource')
        .find((item) => item.name.endsWith(name));
      return {
        path: new URL(found.name).pathname,
        status: found.responseStatus,
        size: found.decodedBodySize,
      };
    }, file);
    assert.ok(
      entry.path.includes('/uikit_admin/assets/fonts/'),
      `The font came from ${entry.path}.`,
    );
    assert.ok(
      entry.status === 200 || (entry.status === 0 && entry.size > 0),
      `The font answered ${entry.status} with ${entry.size} bytes.`,
    );
  },
);

/**
 * Measures how many characters a line of an element holds (WCAG 1.4.8): the
 * width of its text in its font, against the width of the element.
 *
 * Example: Then the element ".uikit-admin-form-item__description" should show at most 80 characters per line
 */
Then(
  /^the element "([^"]*)" should show at most (\d+) characters per line$/,
  async function (selector, limit) {
    const perLine = await this.page
      .locator(selector)
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element);
        const text = element.textContent.replace(/\s+/g, ' ').trim();
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const width = context.measureText(text).width;
        return (text.length * element.clientWidth) / Math.max(width, 1);
      });
    assert.ok(
      perLine <= Number(limit),
      `${selector} shows ${perLine.toFixed(1)} characters per line.`,
    );
  },
);

/**
 * Adds an element with a text to the main column, for the elements a screen
 * of core may not print, like inline code.
 *
 * Example: Given the page shows a specimen of the element "code"
 */
Given(
  /^the page shows a specimen of the element "([a-z]+)"$/,
  async function (tag) {
    await this.page.evaluate((name) => {
      const specimen = document.createElement(name);
      specimen.className = 'uikit-admin-specimen';
      specimen.textContent = 'Il1 O0 specimen';
      document
        .querySelector('.uikit-admin-main .uk-container')
        .prepend(specimen);
    }, tag);
  },
);
