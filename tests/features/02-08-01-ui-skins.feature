@watchdog
Feature: The design tokens, with and without UI Skins
  As a site builder
  I want every color, size and shape of the back office to be a setting
  So that I restyle it through configuration, with no style sheet of my own

  Scenario: Every design token has a field in the UI Skins form
    Given the module "ui_skins" is installed
      And I am logged in as the Drupal administrator
     When I go to "/admin/appearance/css-variables/uikit_admin"
     Then every design token of the theme should have a field
      And I should see "Corner radius of the panels"
      And I should see "The corners of the panels, the tables and the dialogs."
      And no error should have been logged

  Scenario: A token saved in the UI Skins form reaches the page
    Given the configuration "uikit_admin.settings" is put back after the scenario
      And the module "ui_skins" is installed
      And I am logged in as the Drupal administrator
     When I go to "/admin/appearance/css-variables/uikit_admin"
      And I click on the element ".vertical-tabs__menu-item:has-text('Brand') a"
      And I fill in the field "input[name='ui_skins_css_variables[brand][uikit-admin-accent][values_container][0][value]']" with "#7a1f5c"
      And I click on the element ".vertical-tabs__menu-item:has-text('Shape') a"
      And I fill in the field "input[name='ui_skins_css_variables[shape][uikit-admin-radius-control][values_container][0][value]']" with "0"
      And I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
     When I go to "/admin/content"
     Then the style "background-color" of the element ".uk-button-primary" should be "rgb(122, 31, 92)"
      And the style "border-top-left-radius" of the element ".uk-button-primary" should be "0px"
      And no error should have been logged

  Scenario Outline: The accent of the dark mode applies when <case>
    Given the configuration "uikit_admin.settings" is put back after the scenario
      And the module "ui_skins" is installed
      And the design token "uikit-admin-accent" is "#ffb86b" in the dark color mode
      And the UIkit Admin setting "color_mode" is "<mode>"
      And the color scheme is "<scheme>"
      And I am logged in as the Drupal administrator
     When I go to "/admin/content"
     Then the style "background-color" of the element ".uk-button-primary" should be "<color>"
      And no error should have been logged

    Examples:
      | case                              | mode  | scheme | color              |
      | the settings ask for the dark one | dark  | light  | rgb(255, 184, 107) |
      | the system asks for the dark one  | auto  | dark   | rgb(255, 184, 107) |
      | the system asks for the light one | auto  | light  | rgb(8, 80, 138)    |
      | the settings ask for the light one | light | dark   | rgb(8, 80, 138)    |

  Scenario: A custom accent of the light mode leaves the dark mode readable
    Given the configuration "uikit_admin.settings" is put back after the scenario
      And the design token "uikit-admin-accent" is "#7a1f5c" in the light color mode
      And the color scheme is "dark"
      And I am logged in as the Drupal administrator
     When I go to "/admin/content"
     Then the style "background-color" of the element ".uk-button-primary" should be "rgb(140, 188, 255)"
      And the page should pass an accessibility audit at level "AAA"

  Scenario: The theme prints the tokens itself on a site without UI Skins
    Given the configuration "uikit_admin.settings" is put back after the scenario
      And the design token "uikit-admin-accent" is "#7a1f5c" in the light color mode
      And the design token "uikit-admin-radius" is "0" in the light color mode
      And I am logged in as the Drupal administrator
     When I go to "/admin/content"
     Then the element "style[data-uikit-admin-skin]" should exist
      And the style "background-color" of the element ".uk-button-primary" should be "rgb(122, 31, 92)"
      And the style "border-top-left-radius" of the element ".uk-table" should be "0px"
      And the page should pass an accessibility audit at level "AAA"
      And no error should have been logged

  Scenario Outline: The text on the accent follows the accent
    Given the configuration "uikit_admin.settings" is put back after the scenario
      And the design token "uikit-admin-accent" is "<accent>" in the light color mode
      And I am logged in as the Drupal administrator
     When I go to "/admin/content"
     Then the hovered element ".uk-button-primary" should have a contrast of at least 7 to 1
      And the style "color" of the element ".uk-button-primary" should be "<text>"

    Examples:
      | accent  | text                     |
      | #123b2a | color(srgb-linear 1 1 1) |
      | #ffd166 | color(srgb-linear 0 0 0) |

  Scenario: The compact density only gives the tokens other values
    Given the configuration "uikit_admin.settings" is put back after the scenario
      And the UIkit Admin setting "density" is "compact"
      And I am logged in as the Drupal administrator
     When I go to "/admin/content"
     Then the design token "uikit-admin-space-row" of the page should be "7px 12px"
      And the style "padding-top" of the element ".uk-table td" should be "7px"
      And the style "font-size" of the element "body" should be "14px"

  Scenario: The emphasis of a text keeps the color of the text
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/types/manage/page/fields/node.page.body"
     Then the style "color" of the element "em.placeholder" should not be "rgb(158, 18, 49)"
      And the style "color" of the element "em.placeholder" should not be "rgb(240, 80, 110)"
