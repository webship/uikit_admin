/**
 * @file
 * Compiles UIkit with the settings of UIkit Admin, and copies its scripts.
 *
 * Usage: yarn build:uikit
 */

const fs = require('node:fs');
const path = require('node:path');
// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
const less = require('less');

const root = path.dirname(__dirname);
const uikit = path.dirname(require.resolve('uikit/package.json'));
const { version } = JSON.parse(
  fs.readFileSync(path.join(uikit, 'package.json'), 'utf8'),
);
const vendor = path.join(root, 'assets/vendor/uikit');
const source = path.join(root, 'assets/less/uikit-admin.less');

/**
 * Writes the compiled CSS, with the images inlined as UIkit does.
 *
 * @param {string} css
 *   The CSS from the Less compiler.
 */
function write(css) {
  const inlined = css.replace(
    /url\(["']?\.\.\/\.\.\/images\/([^"')]+)["']?\)/g,
    (match, file) => {
      const svg = fs
        .readFileSync(path.join(uikit, 'src/images', file), 'utf8')
        .trim();
      return `url("data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}")`;
    },
  );
  fs.mkdirSync(path.join(vendor, 'css'), { recursive: true });
  fs.mkdirSync(path.join(vendor, 'js'), { recursive: true });
  fs.writeFileSync(
    path.join(vendor, 'css/uikit.css'),
    `/*! UIkit ${version} | https://www.getuikit.com | (c) 2014 - 2026 YOOtheme | MIT License */\n/* Compiled by UIkit Admin from assets/less/uikit-admin.less: run "yarn build:uikit". */\n${inlined}`,
  );
  ['uikit.min.js', 'uikit-icons.min.js'].forEach((file) => {
    fs.copyFileSync(
      path.join(uikit, 'dist/js', file),
      path.join(vendor, 'js', file),
    );
  });
  fs.copyFileSync(
    path.join(uikit, 'LICENSE.md'),
    path.join(vendor, 'LICENSE.md'),
  );
  process.stdout.write(`UIkit ${version} compiled into assets/vendor/uikit.\n`);
}

less
  .render(fs.readFileSync(source, 'utf8'), {
    filename: source,
    paths: [path.join(uikit, 'src/less')],
    math: 'always',
  })
  .then((output) => write(output.css))
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
