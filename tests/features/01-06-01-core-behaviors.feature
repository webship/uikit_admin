@watchdog
Feature: The behaviors of core on the forms of the theme
  As a site administrator
  I want the messages, the machine names and the dynamic fields of core to work
  So that every form of the back office gives feedback and fills itself in

  Scenario: The suite catches the JavaScript errors of a page
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And a script of the page throws "qa-uikit-admin-probe"
     Then the JavaScript error "qa-uikit-admin-probe" should have been caught
      And there should be no JavaScript errors
      And no error should have been logged

  Scenario: A status message shows its text
    Given I am logged in as the Drupal administrator
     When I go to "/admin/config/development/performance"
      And I submit the form with the button "#edit-clear"
     Then the status messages should read "Caches cleared."
      And the element ".uk-alert[role='status']" should exist
      And no error should have been logged

  @cleanup
  Scenario: An error message shows its text and marks the field
    Given the user "qa-taken" exists
      And I am logged in as the Drupal administrator
     When I go to "/admin/people/create"
      And I fill in "#edit-mail" with "uikit-admin-duplicate@example.com" by attr
      And I fill in "#edit-name" with "qa-taken" by attr
      And I fill in "#edit-pass-pass1" with "Correct.Horse.42" by attr
      And I fill in "#edit-pass-pass2" with "Correct.Horse.42" by attr
      And I submit the form with the button "#edit-submit"
     Then the status messages should read "is already taken"
      And the element ".uk-alert[role='alert']" should exist
      And the element "input[name='name'].uk-form-danger" should exist
      And no error should have been logged

  Scenario: The form elements keep the wrapper classes of core
    Given I am logged in as the Drupal administrator
     When I go to "/admin/people/roles/add"
     Then the element ".js-form-item.form-item.js-form-type-textfield.js-form-item-label" should exist
      And the style "content" of the pseudo element "::after" of "label.form-required" should be "\"*\""
      And no error should have been logged

  Scenario: A machine name is generated from the name
    Given I am logged in as the Drupal administrator
     When I go to "/admin/people/roles/add"
      And I fill in "#edit-label" with "UIkit Reviewer" by attr
     Then the element "#edit-id" should have the value "uikit_reviewer"
      And the element "#edit-id" should be hidden
      And the element ".machine-name-value" should be visible
      And no error should have been logged

  Scenario: The password confirmation tells if the passwords match
    Given I am logged in as the Drupal administrator
     When I go to "/admin/people/create"
      And I fill in "#edit-pass-pass1" with "Correct.Horse.42" by attr
      And I fill in "#edit-pass-pass2" with "Correct.Horse.4" by attr
     Then ".password-confirm-message" should contain text "no"
     When I fill in "#edit-pass-pass2" with "Correct.Horse.42" by attr
     Then ".password-confirm-message" should contain text "yes"
      And there should be no JavaScript errors
      And no error should have been logged

  Scenario: The states of a field hide only the field
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/types/manage/page/fields/node.page.body"
      And I select "-1" from "field_storage[subform][cardinality]"
     Then the element "select[name='field_storage[subform][cardinality]']" should be visible
      And the element "input[name='field_storage[subform][cardinality_number]']" should be hidden
      And no error should have been logged

  Scenario: The vertical tab summaries follow the checkboxes
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/types/manage/page"
      And I click on the element ".vertical-tabs__menu-item a[href='#edit-workflow']"
     Then ".vertical-tabs__menu-item a[href='#edit-workflow'] .vertical-tabs__menu-item-summary" should contain text "Published"
      And the style "list-style-type" of the element ".vertical-tabs__menu" should be "none"
      And the element ".vertical-tabs__pane > summary" should be hidden
      And no error should have been logged

  Scenario: The meta of a content form sums itself up
    Given I am logged in as the Drupal administrator
     When I go to "/node/add/page"
      And I fill in "#edit-title-0-value" with "UIkit summary check" by attr
      And I click on the element "#edit-menu summary"
      And I check "Provide a menu link"
     Then the element "#edit-menu-title" should have the value "UIkit summary check"
      And "#edit-menu summary" should contain text "UIkit summary check"
      And no error should have been logged
