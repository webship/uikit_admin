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
- **Accessible by default.** The muted text, the links, the buttons and the alerts all meet the
  WCAG AA contrast minimum, which the UIkit defaults do not.
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
  or compact density, a sticky Save row and the content form sidebar.
- **Sign-in screens**: the layout of the log in, password reset and registration screens, and a
  sentence shown with the site name.

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
screens, files, and the pages another theme renders.

## Sign-in screens

When this theme shows the sign-in screens, they get a page of their own: the form in a card, the
site name and logo in a brand panel, and no rail or top bar. Pick the layout in the theme settings:

- **Centered**: the form alone, the site name above it.
- **Start** and **End**: the form on one side of the screen, the brand panel on the other.
- **Top** and **Bottom**: a brand band above or under the form.
- **Spotlight**: a frosted card floating over the accent color.

The sign-in screens use the default theme of the site. A site where UIkit Admin is only the
administration theme shows them with UIkit Admin when a module marks the sign-in routes as
administration routes, as [Web Admin](https://www.drupal.org/project/webadmin) does.

## Tested with

- Drupal core, the standard profile, with UIkit Admin as the administration theme.
- The `website_starter` site template of the Webship stack.
