@watchdog
Feature: Operations and dialogs
  As a site administrator
  I want the operations of a row and the dialogs of core to behave as core made them
  So that deleting, placing and configuring stay in a dialog I can read

  Scenario: An operation keeps its dialog and its accessible name
    Given I am logged in as the Drupal administrator
     When I go to "/admin/people/roles"
     Then the element ".uikit-admin-operations a" with the attribute "data-dialog-type" and the value "modal" should exist
      And the element ".uikit-admin-operations a.use-ajax" with the attribute "aria-label" and the value containing "Delete" should exist
      And no error should have been logged

  @cleanup
  Scenario: A delete dialog is readable
    Given the "page" content item "qa-UIkit dialog" exists
      And I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I fill in "Title" with "qa-UIkit dialog"
      And I click on the element "#edit-submit-content"
      And I click on the element "tr:has-text('qa-UIkit dialog') .uikit-admin-operations button[aria-label='More operations']"
      And I click on the element "tr:has-text('qa-UIkit dialog') .uikit-admin-operations a.use-ajax[href*='/delete']"
      And I wait for ".ui-dialog" to appear
     Then the current path should end with "/admin/content"
      And ".ui-dialog" should contain text "Are you sure you want to delete the content item qa-UIkit dialog?"
      And the style "background-color" of the element ".ui-dialog-buttonpane .uk-button-primary" should not be "rgb(237, 237, 237)"
      And the style "white-space" of the element ".ui-dialog-title" should be "normal"
      And no error should have been logged

  Scenario: The Views UI actions keep their text and their dialogs
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/views/view/content"
     Then I should not see "<span"
      And the text of the element "#views-add-field" should be "Add fields"
      And the text of the element "#views-rearrange-field" should be "Rearrange fields"
      And the element "#views-add-field > span.visually-hidden" should exist
      And the element "#views-add-field.views-ajax-link" should exist
     When I click on the element "#views-add-field"
      And I wait for ".ui-dialog" to appear
     Then the current path should end with "/admin/structure/views/view/content"
      And no error should have been logged

  Scenario: The operations read their title, not "Array"
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/types/manage/page/display"
     Then I should not see "Array"
      And the text of the element ".uikit-admin-operations a[href$='/display/default']" should be "Manage (Default)"
      And the element ".uikit-admin-operations a[href$='/display/default'] > span.visually-hidden" should exist
      And no error should have been logged

  Scenario: Place block keeps the region in the dialog
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/block/list/olivero"
      And I click on the element "a[href*='/admin/structure/block/library/olivero?region=footer_top']"
      And I wait for ".ui-dialog a.use-ajax[href*='region=footer_top']" to appear
      And I click on the element ".ui-dialog a.use-ajax[href*='/system_powered_by_block/olivero?region=footer_top']"
      And I wait for ".ui-dialog select[name='region']" to appear
     Then the element ".ui-dialog select[name='region']" should have the value "footer_top"
      And the element ".ui-dialog .machine-name-value" should be visible
      And no error should have been logged
