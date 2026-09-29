# UIkit Admin

The administration theme built with [UIkit](https://getuikit.com), where every part of the
administration screens is a single directory component.

UIkit Admin stands on its own: it has no base theme, it does not extend the UIkit theme and it
does not extend UI Suite UIkit. It works on plain Drupal core the way the core administration
theme does, and it works on a site built with the Webship site templates.

It follows the logic of the [UI Suite initiative](https://www.drupal.org/project/ui_suite) and
makes use of its smart parts, most of which have now moved into Drupal core: components are core
single directory components, and the look is driven by CSS custom properties that UI Skins and
UI Styles can change on top of the core style and token APIs.

## What it gives you

- **Components, not template soup.** The navbar, the page shell, the tabs, the actions, the
  operations, the panels of an administration index, the status report, the form elements and
  the tables are single directory components. A template only picks the component and hands it
  its values.
- **No base theme.** Everything the screens need is in this theme, so an update of another
  theme cannot change the administration.
- **UIkit compiled into the theme** with its colors: nothing loads from a CDN.
- **HTMX navigation** with Drupal core HTMX: links, pagers, sorting and filters swap the page, and the rail and the top bar stay.
- **Accessible by default.** The text, the muted text, the links, the primary and danger buttons
  and the alerts reach the WCAG AAA contrast of 7:1 in the light and the dark mode, and the
  edges of the fields reach 3:1. One solid focus ring marks the keyboard everywhere, the
  controls are 44px high, and nothing animates when the system asks for reduced motion.
- **A dark color mode** that follows the operating system.

## Install

```bash
composer require drupal/uikit_admin
drush theme:enable uikit_admin
drush config:set system.theme admin uikit_admin
```

The theme places its own blocks (page title, breadcrumb, tabs, actions, messages, help) when it
is installed.

## The components

| Group | Components |
|---|---|
| Layout | admin_page, section, container, grid, grid_2_columns, grid_3_columns, grid_4_columns |
| Administration | admin_block, admin_task_list, status_report, status_counter |
| Navigation | navbar, navbar_nav, navbar_item, navbar_toggle, offcanvas, nav, breadcrumb, local_tasks, local_actions, operations, subnav, tab, pagination |
| Form | form_element, search |
| Feedback | alert, badge, label, progress, spinner, tooltip, modal, close |
| Data | table, table_row, table_cell, list, description_list, card, tile, accordion, switcher |

Every component carries its own `*.component.yml` with typed props and described slots, so the
Display Builder and the AI component agents can read them.

## Theme settings

- **Navigate with HTMX**: on by default; turn it off for full page loads everywhere.
- **Sticky navbar**: keep the navbar at the top of the screen.
- **Appearance**: the accent and focus colors, light, dark or the system's color mode, comfortable
  or compact density, a sticky Save row and the content form sidebar. The color mode is the one
  control of the mode: it is stored for UI Skins too (`uikit_admin_light`, `uikit_admin_dark`), and
  the UI Skins select does not show on this form. UI Suite UIkit and Webtheme have the same setting.
- **Sign-in screens**: the layout of the log in, password reset and registration screens, and a
  sentence shown with the site name. They apply only when the sign-in routes use this theme: see
  [Sign-in screens](#sign-in-screens).

## Next to a front theme

UIkit Admin runs next to a UIkit front theme (UI Suite UIkit, Webtheme) on the same site, and
nothing of one reaches the pages of the other:

- The UI Skins ids carry the theme name: the color modes (`uikit_admin_light`, `uikit_admin_dark`)
  and the design tokens (`uikit-admin-*`, the states included: `uikit-admin-success`,
  `uikit-admin-warning`, `uikit-admin-danger`). A front theme declares the UIkit names
  (`uk-global-*`) under its own name too.
- Drupal core loads the CKEditor 5 styles of the default theme only: `assets/css/ckeditor5.css`
  applies when UIkit Admin is also the default theme. Otherwise the editor shows the styles of the
  front theme, which keeps them at WCAG AAA.
- The small links and the close buttons of the messages are 44 by 44 pixels (WCAG 2.5.5), like in
  the front themes. The *Compact* density keeps 32px choices, the WCAG 2.5.8 minimum and more.

## UIkit, compiled into the theme

UIkit ships in `assets/vendor/uikit`: the CSS compiled from the UIkit Less sources with the
colors, type and radius of this theme (`assets/less/uikit-admin.less`), and the UIkit JavaScript
and icons. Nothing loads from a CDN. After changing the Less file, rebuild the CSS:

```shell
yarn install
yarn build:uikit
```

## HTMX navigation

The page wrapper is boosted with Drupal core HTMX: a link, a pager, a table sort or an exposed
filter loads the next page and swaps the page only, so the rail, its collapsed state and the
document stay. Drupal core loads the new assets and settings; the theme attaches the behaviors,
moves the focus to the content and announces the new page.

Full page loads stay for the forms that post (edit, add, delete, settings), the screens with drag
and drop or builders (block layout, menus, field UI, Views UI, Display Builder), batch and update
screens, files, and the pages another theme renders. Drupal renders an HTMX request in the theme
of the page it comes from, so the theme asks the theme negotiators again: a link to the front end
(the site name, the account link, the View tab) answers with `HX-Redirect` and loads in full, in
the front theme.

## Sign-in screens

When this theme shows the sign-in screens, they get a page of their own: the form in a card, the
site name and logo in a brand panel, and no rail or top bar. Pick the layout in the theme settings:

- **Centered**: the form alone, the site name above it.
- **Start** and **End**: the form on one side of the screen, the brand panel on the other.
- **Top** and **Bottom**: a brand band above or under the form.
- **Spotlight**: a frosted card floating over the accent color.

On a stock site these screens never show: Drupal renders the sign-in routes in the default
theme of the site, not in the administration theme. The layouts above apply only when the
sign-in routes use UIkit Admin, which happens when:

- UIkit Admin is also the default theme of the site, or
- a module shows the sign-in routes in UIkit Admin: [Web Admin](https://www.drupal.org/project/webadmin)
  does with a theme negotiator, and keeps the Display Builder page layouts of the front theme out of
  them. A route subscriber of your own that marks the routes as administration routes
  (`_admin_route: TRUE`) works too.

The sign-in routes are `user.login`, `user.pass`, `user.register`, `user.reset`,
`user.reset.form` and `user.reset.login`.

## Tested with

- Drupal core, the standard profile, with UIkit Admin as the administration theme.
- The `website_starter` site template of the Webship stack.
- UI Patterns 2, which the tests install for the scenarios that need it: the
  CI gets it from the `require-dev` of `composer.json`.

The webship-js suite in `tests/` walks the back office in a browser, with
WCAG 2.2 AAA checks in the light and the dark color scheme
(`tests/features/03-02-01-wcag-aaa.feature`).
