@fonts
Feature: The fonts of the theme
  As a person who reads the back office all day
  I want a font that tells I, l and 1 apart, served from the site itself
  So that every screen reads the same on every machine, and nothing is fetched from elsewhere

  Scenario: The screens use the fonts of the theme, from the theme
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/types/manage/page/fields/node.page.body"
     Then the style "font-family" of the element "body" should start with "\"Atkinson Hyperlegible Next\""
      And the style "font-family" of the element "h1" should start with "\"Atkinson Hyperlegible Next\""
    Given the page shows a specimen of the element "code"
     Then the style "font-family" of the element "code.uikit-admin-specimen" should start with "\"Atkinson Hyperlegible Mono\""
      And the page should have loaded the font "atkinson-hyperlegible-next-latin-wght-normal.woff2" from the theme
      And the page should load nothing from another host
      And the element "link[rel='preload'][as='font'][crossorigin]" should exist

  Scenario: A line of help text stays under 80 characters on a wide screen
    Given I am logged in as the Drupal administrator
      And I set the viewport to 1440 by 900
     When I go to "/admin/config/system/site-information"
     Then the element ".uikit-admin-form-item__description" should show at most 80 characters per line

  Scenario: The font of the system is a setting
    Given the configuration "uikit_admin.settings" is put back after the scenario
      And the UIkit Admin setting "font_family" is "system"
      And I am logged in as the Drupal administrator
     When I go to "/admin/content"
     Then the element "html[data-uikit-admin-font='system']" should exist
      And the style "font-family" of the element "body" should not start with "\"Atkinson Hyperlegible Next\""
      And the element "link[rel='preload'][as='font']" should not exist

  Scenario: A family typed in UI Skins replaces the font
    Given the configuration "uikit_admin.settings" is put back after the scenario
      And the design token "uikit-admin-heading-font-family" is "Georgia, serif" in the light color mode
      And I am logged in as the Drupal administrator
     When I go to "/admin/content"
     Then the style "font-family" of the element "h1" should start with "Georgia"
      And the style "font-family" of the element "body" should start with "\"Atkinson Hyperlegible Next\""
