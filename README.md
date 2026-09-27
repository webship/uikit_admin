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
- **UIkit from the CDN or from your own libraries folder**, chosen in the theme settings.
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

- **UIkit source**: the CDN (jsDelivr) or `web/libraries/uikit`.
- **Sticky navbar**: keep the navbar at the top of the screen.

## Tested with

- Drupal core, the standard profile, with UIkit Admin as the administration theme.
- The `website_starter` site template of the Webship stack.
