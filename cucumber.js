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

const paths = shardTotal > 1 ? shardPaths() : [`${featureDir}/**/*.feature`];

module.exports = {
  default: {
    timeout: 60000,
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',
      'tests/step-definitions/**/*.js',
    ],
    paths,
    format: ['progress-bar', 'json:tests/reports/cucumber_report.json'],
    worldParameters: {
      launchUrl: process.env.LAUNCH_URL || 'http://localhost',
      minWaitTime: {
        page: 3000,
        before_scenario: 0,
        after_scenario: 0,
        before_step: 0,
        after_step: 0,
      },
      screenshot: {
        dir: './tests/screenshots',
        onFailed: true,
        onEveryStep: false,
      },
    },
  },
};
