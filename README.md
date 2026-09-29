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
- **Appearance**: the accent and focus colors of the light and the dark color mode, light, dark
  or the system's color mode, the font, comfortable or compact density, a sticky Save row and the
  content form sidebar. The color mode is the one control of the mode: it is stored for UI Skins too
  (`uikit_admin_light`, `uikit_admin_dark`), and the UI Skins select does not show on this form.
  UI Suite UIkit and Webtheme have the same setting. The colors are [design tokens](#design-tokens):
  the form stores them where UI Skins reads them.
- **Sign-in screens**: the layout of the log in, password reset and registration screens, and a
  sentence shown with the site name. They apply only when the sign-in routes use this theme: see
  [Sign-in screens](#sign-in-screens).

## Fonts

The theme serves its own fonts, so the screens read the same on every machine and nothing loads
from a font service:

| Role | Family | License |
|---|---|---|
| Text, interface and titles | [Atkinson Hyperlegible Next](https://github.com/googlefonts/atkinson-hyperlegible-next) 2.001 | SIL OFL 1.1 |
| Code | [Atkinson Hyperlegible Mono](https://github.com/googlefonts/atkinson-hyperlegible-next-mono) 2.001 | SIL OFL 1.1 |
| Arabic script | [Noto Sans Arabic](https://github.com/notofonts/arabic) 2.013 | SIL OFL 1.1 |

Both Atkinson families tell I, l and 1 apart, and O and 0. The files in `assets/fonts/` are
subsets, one per script (`googlefonts/atkinson-hyperlegible-next` at `7925f50f649b`,
`googlefonts/atkinson-hyperlegible-next-mono` at `154d50362016`), with the license of each family
next to its files: a page fetches only the files of the characters it prints, 34 kB for an English
page. The fallback faces are tuned to the same metrics, so the page does not move when a font
arrives. Running text stops at 32em, about 72 characters a line (WCAG 1.4.8).

The **Font** setting switches to the font of the system, and the UI Skins tokens of the
*Typography* group (`uikit-admin-font-family`, `uikit-admin-heading-font-family`,
`uikit-admin-code-font-family`, `uikit-admin-measure`) take any family.

## Design tokens

Every color, size and shape of the screens is a CSS custom property, a design token, defined in
`assets/css/admin.css`. [UI Skins](https://www.drupal.org/project/ui_skins) offers each one as a
setting at *Appearance > CSS variables > UIkit Admin*, with a description, its default and a field
for each scope:

| Group | Tokens (`--uikit-admin-…`) |
|---|---|
| Brand | `accent`, `accent-hover`, `on-accent`, `focus` |
| Surfaces | `canvas`, `surface`, `muted`, `muted-hover`, `border`, `border-control` |
| Text colors | `text`, `text-muted`, `emphasis`, `code`, `inverse` |
| States | `success`, `warning`, `danger`, `danger-hover`, `secondary`, `secondary-hover` |
| Alerts | `alert-primary`, `alert-success`, `alert-warning`, `alert-danger`, and the same with `-bg` |
| Shape | `radius`, `radius-control`, `radius-large`, `radius-pill`, `shadow`, `shadow-raised` |
| Size and room | `rail-width`, `rail-width-collapsed`, `header-height`, `control-height`, `control-small-height`, `choice-size`, `choice-height`, `font-size`, `line-height`, `title-size`, `space-row`, `space-field`, `space-card`, `space-card-small`, `space-card-large`, `space-head` |
| Typography | `font-family`, `heading-font-family`, `code-font-family`, `measure` |
| Focus | `focus-width`, `focus-offset` |

- **Scopes.** `:root` is the light color mode and every value without a mode. The colors have a
  second default for the dark color mode, `:root[data-theme="dark"]`, and the tokens of size and
  room a second one for the compact density, `:root[data-uikit-admin-density="compact"]`.
- **One stored value.** A changed token is stored once, in the settings of the theme, under
  `third_party_settings.ui_skins.css_variables`. The theme settings form, the UI Skins form and a
  recipe write the same keys:

  ```yaml
  third_party_settings:
    ui_skins:
      css_variables:
        uikit-admin-accent:
          ':root': '#7a1f5c'
          ':root[data-theme="dark"]': '#ffb3e0'
        uikit-admin-radius-control:
          ':root': '0'
  ```

- **Without UI Skins** the theme prints the stored values itself, so the same configuration works
  on a site that does not install the module.
- **Follow the operating system.** The values of the dark color mode also apply when the color
  mode follows the system and the system asks for the dark one.
- **What follows the accent.** The hover color and the text on the accent are derived from the
  accent in the style sheet: a site that changes only the accent gets both.
- **Keep the contrast.** The defaults reach WCAG 2.2 AAA: 7:1 for a text on its background, 3:1
  for the edge of a control, 44px for a target. The description of each token says what to keep.

## Display Builder

When [Display Builder](https://www.drupal.org/project/display_builder) is installed, the theme
adds, as optional configuration:

- `display_builder.profile.uikit_admin`: the profile for the back office, like a dashboard. Its
  component library leaves out the components of the front themes (UI Suite UIkit, Webtheme) and
  the shell of the back office (the page, the rail, the top bar, the palette, the sign-in screens
  and the form parts); the design tokens panel is on.
- `display_builder.profile.uikit_admin_sign_in`: the same for the sign-in screens, with the
  `sign_in` component and without the navigation components.
- `display_builder_page_layout.page_layout.uikit_admin_sign_in`: a page layout of the sign-in
  screens built with the `sign_in` component (the branding, the title, the messages, the form and
  the tabs), turned off. Choose it in the theme settings to turn it on. A recipe imports the three
  with `config: import: uikit_admin: [...]`, since a recipe does not install optional
  configuration.

The media library of core (the grid, its dialog and the widget of a content form) has the look of
the theme: cards that fill the row, the box on the picture, the media types on the side.

The screens of the back office are drawn by the components too: the tables and the module list
by `table`, `table_row` and `table_cell`, the pagers by `pagination`, the administration indexes
by `grid`, the content types to add by `card`, the messages by `alert`. The shell itself stays
a Twig page: Display Builder does not build the pages of administration routes.

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

Each screen has a layout of its own class (`--login`, `--register`, `--password`, `--reset`,
`--logout`, and `--denied` for an access denied page on a sign-in path), and the settings add:

- **Header and footer**: the site name with one level of the main menu above the screen, the
  footer menu under it. Never the rail or the top bar of the back office.
- **Logo**: the logo of the site (its default theme), the logo of this theme, or none.
- **Image and credit**: an image behind the brand panel of the Start, End, Top and Bottom layouts,
  under a dark layer that keeps the text at 7:1.
- **Help line**: a short line under the links.
- **Display Builder page layout**: a page layout that draws the screens instead; choosing one turns
  it on.

The messages show in the card (a wrong password, a sent link, an expired link), the password
fields read 16px, the show-password button of the View Password module is a 44px button inside
the field, and a reset request goes back to the log in screen.

On a stock site these screens never show: Drupal renders the sign-in routes in the default
theme of the site, not in the administration theme. The layouts above apply only when the
sign-in routes use UIkit Admin, which happens when:

- UIkit Admin is also the default theme of the site, or
- a module shows the sign-in routes in UIkit Admin: [Web Admin](https://www.drupal.org/project/webadmin)
  does with a theme negotiator, and keeps the Display Builder page layouts of the front theme out of
  them. A route subscriber of your own that marks the routes as administration routes
  (`_admin_route: TRUE`) works too.

The sign-in routes are `user.login`, `user.pass`, `user.register`, `user.reset`,
`user.reset.form`, `user.reset.login` and `user.logout.confirm`.

## Tested with

- Drupal core, the standard profile, with UIkit Admin as the administration theme.
- The `website_starter` site template of the Webship stack.
- UI Patterns 2 and UI Skins, which the tests install for the scenarios that
  need them: the CI gets them from the `require-dev` of `composer.json`.

The webship-js suite in `tests/` walks the back office in a browser, with
WCAG 2.2 AAA checks in the light and the dark color scheme
(`tests/features/03-02-01-wcag-aaa.feature`).
