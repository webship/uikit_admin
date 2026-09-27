@watchdog
Feature: The parts of core drawn by the theme
  As a site administrator
  I want the pagers, the tables, the tabs and the buttons of core to look like the theme
  So that no screen of the back office falls back to bare markup

  @pager
  Scenario: A pager is a UIkit pagination
    Given there are at least 51 content items
      And I am logged in as the Drupal administrator
     When I go to "/admin/content"
     Then the element "ul.uk-pagination.js-pager__items" should exist
      And the element "ul.uk-pagination .uk-active" should exist
      And the element "table.sticky-header thead th" should stay in view after scrolling 1500 pixels
      And no error should have been logged

  Scenario: A search field has a border
    Given I am logged in as the Drupal administrator
     When I go to "/admin/modules"
     Then the style "border-top-style" of the element "input.table-filter-text" should be "solid"
      And no error should have been logged

  Scenario: A link core draws as a button is a UIkit button
    Given I am logged in as the Drupal administrator
     When I go to "/user/1/cancel"
     Then the element "a.dialog-cancel.uk-button" should exist
      And no error should have been logged

  Scenario: The placeholders keep the color of their text
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/types/manage/page/fields/node.page.body"
     Then the style "color" of the element "em.placeholder" should not be "rgb(240, 80, 110)"
      And no error should have been logged

  Scenario: The status report counters link to their group
    Given I am logged in as the Drupal administrator
     When I go to "/admin/reports/status"
     Then the element "a.uikit-admin-status-counter[href='#checked']" should exist
      And no error should have been logged

  Scenario: The tabs follow their weight
    Given I am logged in as the Drupal administrator
     When I go to "/admin/config/people/accounts"
     Then the tabs should read "Settings, Manage fields, Manage form display, Manage display"
      And no error should have been logged

  @cleanup
  Scenario: A content form keeps the tabs of its content
    Given the "page" content item "qa-UIkit tabs" exists
      And I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I fill in "Title" with "qa-UIkit tabs"
      And I click on the element "#edit-submit-content"
      And I click on the element "tr:has-text('qa-UIkit tabs') .uikit-admin-operations > a[href*='/edit']"
      And I wait until the page is loaded
     Then the element "#edit-title-0-value" should have the value "qa-UIkit tabs"
      And the element ".uikit-admin-tabs a[href*='/revisions']" should exist
      And the element ".uikit-admin-tabs a[href$='/delete']" should exist
      And no error should have been logged

  Scenario: The settings of the theme stay on its own form
    Given I am logged in as the Drupal administrator
     When I go to "/admin/appearance/settings"
     Then the element "input[name='htmx_navigation']" should not be displayed
     When I go to "/admin/appearance/settings/uikit_admin"
     Then the element "input[name='htmx_navigation']" should exist
      And no error should have been logged

  @settings
  Scenario: The accent color of the settings reaches the page
    Given the UIkit Admin setting "accent_color" is "#c0392b"
      And I am logged in as the Drupal administrator
     When I go to "/admin/content"
     Then the style "background-color" of the element ".uk-button-primary" should be "rgb(192, 57, 43)"
      And no error should have been logged

  Scenario: Closing the palette gives the focus back
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I click on the element ".uikit-admin-topbar__search"
     Then the element ".uikit-admin-palette__dialog" should be visible
     When I press the key "Escape"
     Then the focus should be on the element ".uikit-admin-topbar__search"
      And no error should have been logged
