# UIkit Admin tests

The behavior tests of the UIkit Admin theme: Gherkin features run by
[webship-js](https://www.npmjs.com/package/webship-js) (Playwright and Cucumber)
with the Drupal steps of
[@webship-js/drupal-core-steps](https://www.npmjs.com/package/@webship-js/drupal-core-steps)
(the login by account handle). `cucumber.js` in the project root holds the
configuration. The features walk the back office with this theme as the
administration theme: the shell, the screens, the sign-in screens, the HTMX
navigation, content, people, views, blocks, structure, configuration, reports,
UI Skins, Display Builder and WCAG 2.2 AAA.

| Folder | What it holds |
| --- | --- |
| `features/` | the features (24 files, 219 scenarios) |
| `step-definitions/` | this project's own steps; the fixture steps make `qa-` content with Drush and a safety net removes it |
| `fixtures/` | an image and the icon list the scenarios use |
| `reports/`, `screenshots/`, `videos/` | what a run writes (not committed) |

## From nothing to a green run

### 1. A site of the Website project template in DDEV

The [Website](https://www.drupal.org/project/website) project template installs the Webship
site templates with UI Suite UIkit, UIkit Admin and Display Builder:

```bash
mkdir website && cd website
ddev config --project-type=drupal11 --docroot=web --php-version=8.4
ddev start
ddev composer create-project drupal/website:1.0.x-dev
ddev restart
```

### 2. The site, with the test accounts

The suite logs in as the accounts that `cucumber.js` lists in
`worldParameters.users`, and never creates or deletes an account: the site
build does. Choose three passwords, keep them in your environment, install the
site with Website Starter and the Webmaster account, add the other two, and the
Basic page content type the content scenarios edit:

```bash
export DRUPAL_ADMIN_PASS='…' DRUPAL_EDITOR_PASS='…' DRUPAL_AUTHENTICATED_PASS='…'
ddev drush site:install ../recipes/website_starter -y --account-name=webmaster --account-mail=webmaster@example.test --account-pass="$DRUPAL_ADMIN_PASS" --site-name="Website"
ddev drush user:create content_editor_user --mail=content_editor_user@example.test --password="$DRUPAL_EDITOR_PASS"
ddev drush user:role:add content_editor content_editor_user
ddev drush user:create authenticated_user --mail=authenticated_user@example.test --password="$DRUPAL_AUTHENTICATED_PASS"
ddev drush recipe core/recipes/page_content_type -y
curl -sk https://website.ddev.site/ | grep -oE '/sites/default/files/styles/[^" ,]+' | sed 's/&amp;/\&/g' | sort -u \
  | while read -r path; do curl -sk -o /dev/null "https://website.ddev.site$path"; done
```

The last command asks once for the images of the front page: a new site makes
each image style on its first request, and answers 503 to a request that comes
in while the same image is being made, which a scenario that counts the errors
of a page would see.

The people scenarios use these accounts by their default names
(`content_editor_user`, `authenticated_user`) and put back what they change.
CI builds a Standard site the same way, with passwords made for the job: see
the `webship-js-test` job in `.gitlab-ci.yml`, which shares the features out
between three parallel jobs.

### 3. Run the suite

From this project's folder, with Node.js 24 and Yarn 4 (through Corepack):

```bash
corepack enable
yarn install
npx playwright install chromium
export LAUNCH_URL=https://website.ddev.site
export NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"
export DRUSH="ddev drush" DRUPAL_PROJECT_DIR=~/website
export SLOW_MO=0
yarn test --tags "not @wip and not @standard-site and not @theme-optional-config and not @view-display-overview"
```

The fixture steps make content and change settings with Drush, and put them
back: `DRUSH` is the command that runs Drush for the site, `DRUPAL_PROJECT_DIR`
the folder it runs in. The forms of a Webship site have a time limit (Honeypot,
2 seconds): the login by handle waits `DRUPAL_LOGIN_WAIT` milliseconds before it
submits, 3000 by default (`DRUPAL_LOGIN_WAIT=0` on a site without it, as in
CI). `SLOW_MO=0` runs the browser at full speed. `NODE_EXTRA_CA_CERTS` lets
Node.js trust DDEV's HTTPS certificate.

`yarn test:dry` checks that every step resolves to one definition, without a browser.

The tag expression leaves out the scenarios that cannot pass on that site,
each for a reason its feature states:

- `@standard-site`: what a Standard site has and a Webship site does not: Olivero and its block regions, a site without Content Moderation or UI Skins, "page not found" in the log (Redirect 404 keeps them out); CI runs them (7 scenarios).
- `@theme-optional-config`: a site template installs the theme from a recipe, without its optional configuration (the Display Builder profiles and the sign-in page layout); a site that installs the theme itself runs them, CI too (2 scenarios).
- `@view-display-overview`: a defect of the theme: the Manage links of the view display overview of Drupal 11.4 have a render array as their title, which the theme casts to a string ("Array to string conversion"); left out in CI too until the theme reads that title (1 scenario).

### 4. What green looks like

```
209 scenarios (209 passed)
2483 steps (2483 passed)
```

The HTML report is written to `tests/reports/cucumber_report.html`. A failed
step leaves a screenshot in `tests/screenshots/` and a video in
`tests/videos/`. Every scenario puts back what it changes, and a safety net
removes the `qa-` content of a scenario that failed half way, so a second run
starts from the same site and is green too.

## Test users

The accounts as `cucumber.js` lists them in `worldParameters.users`. Each
value comes from the environment variable named below; `CHANGE_ME` stands for
the password you chose in step 2.

```json
{
  "Webmaster": { "username": "webmaster", "password": "CHANGE_ME", "email": "webmaster@example.test", "isAdmin": true },
  "Content editor": { "username": "content_editor_user", "password": "CHANGE_ME", "email": "content_editor_user@example.test", "roles": ["content_editor"] },
  "Authenticated user": { "username": "authenticated_user", "password": "CHANGE_ME", "email": "authenticated_user@example.test", "roles": [] }
}
```

| Handle | Variables | The account |
| --- | --- | --- |
| Webmaster | `DRUPAL_ADMIN_USER`, `DRUPAL_ADMIN_PASS`, `DRUPAL_ADMIN_MAIL` | the account the installer created |
| Content editor | `DRUPAL_EDITOR_USER`, `DRUPAL_EDITOR_PASS`, `DRUPAL_EDITOR_MAIL` | a user with the Content editor role |
| Authenticated user | `DRUPAL_AUTHENTICATED_USER`, `DRUPAL_AUTHENTICATED_PASS`, `DRUPAL_AUTHENTICATED_MAIL` | a user with no role; the people scenarios add a role to it, block it and put it back |
