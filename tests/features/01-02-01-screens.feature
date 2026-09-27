Feature: The administration screens
  As a site administrator
  I want every screen drawn with the components of this theme
  So that the whole back office behaves the same way

  Scenario: A listing is a UIkit table with operations
    Given I am logged in as the Drupal administrator
     When I go to "/admin/people/roles"
     Then the element "table.uk-table" should exist
      And the element ".uikit-admin-operations .uk-button" should exist
      And I should not see "error has occurred"

  Scenario: An index page prints its panels as cards
    Given I am logged in as the Drupal administrator
     When I go to "/admin/config"
     Then the element ".uikit-admin-index .uk-card" should exist

  Scenario: A content form keeps its meta in the sidebar
    Given the content type "page" exists
      And I am logged in as the Drupal administrator
     When I go to "/node/add/page"
     Then the element ".uikit-admin-form-layout--with-sidebar" should exist
      And the element ".uikit-admin-form-layout__sidebar" should exist
      And the element ".form-actions" should exist

  Scenario: The status report prints its counters
    Given I am logged in as the Drupal administrator
     When I go to "/admin/reports/status"
     Then the element ".uikit-admin-status-report" should exist

  Scenario: The module list is a table, not nested buttons
    Given I am logged in as the Drupal administrator
     When I go to "/admin/modules"
     Then the element "table.uikit-admin-modules" should exist
