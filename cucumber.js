module.exports = {
  default: {
    timeout: 60000,
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',
      'tests/step-definitions/**/*.js',
    ],
    paths: ['tests/features/**/*.feature'],
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
