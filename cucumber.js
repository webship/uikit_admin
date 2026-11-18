// The webship-js configuration of UIkit Admin, from the one `npx init-webship-js`
// writes (webship-js 2.0.12), with @webship-js/drupal-core-steps and the test
// accounts added. How to run it: tests/README.md.
//
// Environment:
// - LAUNCH_URL: the Drupal site with this theme as its administration theme.
// - DRUSH: the command that runs Drush for that site, used by the fixture steps
//   (default "drush", run from DRUPAL_PROJECT_DIR).
// - DRUPAL_PROJECT_DIR: the Drupal project directory of that site.
// - DRUPAL_ADMIN_*, DRUPAL_EDITOR_*, DRUPAL_AUTHENTICATED_*: the test accounts
//   (see users below).
// - CI_NODE_TOTAL, CI_NODE_INDEX: the parallel jobs of GitLab CI share out the features.

// A feature file, a scenario (file:line), a folder or a rerun file named on
// the command line of cucumber-js runs alone (cucumber-js 12 would add it to
// the paths below): `yarn test tests/features/01-01-01-shell.feature`.
const OPTIONS_WITH_A_VALUE = new Set([
  '-c',
  '--config',
  '-f',
  '--format',
  '--format-options',
  '--i18n-keywords',
  '-i',
  '--import',
  '-l',
  '--loader',
  '--language',
  '--name',
  '--order',
  '-p',
  '--profile',
  '--parallel',
  '--plugin',
  '--plugin-options',
  '-r',
  '--require',
  '--require-module',
  '--retry',
  '--retry-tag-filter',
  '--shard',
  '-t',
  '--tags',
  '--world-parameters',
]);

function commandLinePaths() {
  if (!/cucumber(-js|\.js)?$/.test(String(process.argv[1] || ''))) return [];
  const args = process.argv.slice(2);
  const paths = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith('-')) {
      if (OPTIONS_WITH_A_VALUE.has(args[i])) i += 1;
    } else {
      paths.push(args[i]);
    }
  }
  return paths;
}

const fs = require('fs');
const path = require('path');

// GitLab CI runs the suite in parallel jobs (parallel: N). The feature files
// are shared out so each job gets about the same number of scenarios, an
// example row of a Scenario Outline counting as one. Outside a parallel job
// the suite runs every feature file.
const featureDir = 'tests/features';
const shardTotal = Number(process.env.CI_NODE_TOTAL || 1);
const shardIndex = Number(process.env.CI_NODE_INDEX || 1);

function scenarioCount(file) {
  let count = 0;
  // -1 outside an Examples table; the header row of a table does not count.
  let rows = -1;
  fs.readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line) => {
      const text = line.trim();
      if (text.startsWith('Scenario:')) {
        count += 1;
        rows = -1;
      } else if (text.startsWith('Examples:')) {
        rows = 0;
      } else if (rows >= 0 && text.startsWith('|')) {
        count += rows > 0 ? 1 : 0;
        rows += 1;
      } else if (text !== '' && !text.startsWith('#')) {
        rows = -1;
      }
    });
  return count;
}

function shardPaths() {
  const shards = Array.from({ length: shardTotal }, () => ({
    count: 0,
    files: [],
  }));
  fs.readdirSync(featureDir)
    .filter((file) => file.endsWith('.feature'))
    .map((file) => path.join(featureDir, file))
    .map((file) => ({ file, count: scenarioCount(file) }))
    .sort((a, b) => b.count - a.count || a.file.localeCompare(b.file))
    .forEach(({ file, count }) => {
      const lightest = shards.reduce((a, b) => (b.count < a.count ? b : a));
      lightest.files.push(file);
      lightest.count += count;
    });
  return shards[shardIndex - 1].files;
}

function defaultPaths() {
  if (commandLinePaths().length) return [];
  return shardTotal > 1 ? shardPaths() : [`${featureDir}/**/*.feature`];
}

module.exports = {
  default: {
    timeout: 30000, // Overridden by webship-js's setDefaultTimeout (45s); raise it with WEBSHIP_STEP_TIMEOUT.
    requireModule: ['tsx/cjs'],
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js', // Webship-js core step definitions (auto HTML report on exit; disable: WEBSHIP_REPORT_DISABLE=1).
      'node_modules/@webship-js/drupal-core-steps/tests/step-definitions/**/*.js', // @webship-js/drupal-core-steps: the login by handle, access control, content, the site structure.
      'tests/step-definitions/**/*.js', // This project's own steps.
    ],
    // FEATURES=tests/features/a.feature,tests/features/b.feature runs a subset too.
    paths: process.env.FEATURES
      ? process.env.FEATURES.split(',')
      : defaultPaths(),
    format: [
      '@cucumber/pretty-formatter',
      'json:tests/reports/cucumber_report.json',
    ],
    formatOptions: {
      theme: {
        'feature keyword': ['bold', 'blue'],
        'feature name': ['blue', 'underline'],
        'feature description': ['blueBright'],
        'scenario keyword': ['bold', 'magenta'],
        'scenario name': ['magenta', 'underline'],
        'step keyword': ['bold', 'green'],
        'step text': ['greenBright', 'italic'],
      },
    },
    worldParameters: {
      launchUrl: process.env.LAUNCH_URL || 'http://localhost:8080',
      // A login form protected by a time limit (Honeypot) refuses a quick submit:
      // the login by handle waits this long (milliseconds) before it submits.
      // A Webship site protects its login form that way (2 seconds): 3000 by default;
      // DRUPAL_LOGIN_WAIT=0 on a site without that protection (CI's Standard site).
      loginWait: parseInt(process.env.DRUPAL_LOGIN_WAIT || '3000', 10),
      // "I wait out the form time limit" waits this long (milliseconds).
      formWait: parseInt(process.env.DRUPAL_FORM_WAIT || '5000', 10),
      // The accounts the features log in as, by handle. The site build creates
      // them (tests/README.md); the suite never creates or deletes accounts.
      // Credentials come from the environment: CHANGE_ME is a placeholder.
      users: {
        Webmaster: {
          username: process.env.DRUPAL_ADMIN_USER || 'webmaster',
          password: process.env.DRUPAL_ADMIN_PASS || 'CHANGE_ME',
          email: process.env.DRUPAL_ADMIN_MAIL || 'webmaster@example.test',
          isAdmin: true,
        },
        'Content editor': {
          username: process.env.DRUPAL_EDITOR_USER || 'content_editor_user',
          password: process.env.DRUPAL_EDITOR_PASS || 'CHANGE_ME',
          email:
            process.env.DRUPAL_EDITOR_MAIL ||
            'content_editor_user@example.test',
          roles: ['content_editor'],
        },
        'Authenticated user': {
          username:
            process.env.DRUPAL_AUTHENTICATED_USER || 'authenticated_user',
          password: process.env.DRUPAL_AUTHENTICATED_PASS || 'CHANGE_ME',
          email:
            process.env.DRUPAL_AUTHENTICATED_MAIL ||
            'authenticated_user@example.test',
          roles: [],
        },
      },
      minWaitTime: {
        page: 3000,
        before_scenario: 0,
        after_scenario: 0,
        before_step: 0,
        after_step: 0,
      },
      selectors: {
        css: {},
        xpath: {},
        filesPath: './tests/selectors/',
        files: [],
        // Named viewport sizes for the viewing-the-site and set-the-viewport
        // steps and the @mobile / @desktop tags (built in: xs..xxxl, mobile,
        // tablet, desktop). Without a desktop here, @desktop opens at the
        // breakpoint marked default: true.
        breakpoints: {
          xs: { width: 375, height: 667 },
          sm: { width: 576, height: 800 },
          md: { width: 768, height: 1024 },
          lg: { width: 992, height: 768 },
          xl: { width: 1200, height: 900, default: true },
          xxl: { width: 1400, height: 900 },
          xxxl: { width: 1920, height: 1080 },
        },
      },
      screenshot: {
        dir: './tests/screenshots',
        purge: false,
        onFailed: true,
        onEveryStep: false,
        alwaysFullscreen: false,
        failedPrefix: 'failed_',
        filenamePattern: '{datetime}.{feature_file}.feature_{step_line}.{ext}',
        filenamePatternFailed:
          '{failed_prefix}{datetime}.{feature_file}.feature_{step_line}.{ext}',
        infoTypes: '',
      },
      video: {
        mode: 'on-failure',
        dir: './tests/videos',
        size: { width: 1280, height: 720 },
        filenamePattern: '{datetime}.{feature_file}.{scenario}.{status}.{ext}',
      },
      javascript: {
        mode: 'warn',
        levels: ['error'],
        ignore: '',
        beforeScenario: false,
        afterScenario: true,
      },
    },
  },
};
