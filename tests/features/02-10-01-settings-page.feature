@watchdog
Feature: The settings page of the theme
  As a site administrator
  I want the settings of the theme in clear sections, with pictures of the choices
  So that I see what a choice does before I save it

  Scenario: The settings sit in sections with visual pickers and a sticky Save
    Given I am logged in as the Drupal administrator
      And I set the viewport to 1280 by 800
     When I go to "/admin/appearance/settings/uikit_admin"
     Then the element "form.uikit-admin-settings" should exist
      And I should see "Appearance"
      And I should see "Typography"
      And I should see "Navigation"
      And I should see "Editing"
      And I should see "Sign-in screens"
      And I should see "Accessibility"
      And the element "fieldset.uikit-admin-picker .uikit-admin-picker__thumb--mode-dark" should be visible
      And the element "fieldset.uikit-admin-picker .uikit-admin-picker__thumb--density-compact" should be visible
      And the element "fieldset.uikit-admin-picker .uikit-admin-picker__thumb--font-atkinson" should be visible
      And the element "fieldset.uikit-admin-picker .uikit-admin-picker__thumb--sign-in-spotlight" should be visible
      And the style "position" of the element "form.uikit-admin-settings > .form-actions" should be "sticky"
      And every visible "fieldset.uikit-admin-picker .uikit-admin-form-item" should offer a target of at least 44 by 44 pixels
      And no error should have been logged

  Scenario: A choice made with the pictures is saved
    Given the configuration "uikit_admin.settings" is put back after the scenario
      And I am logged in as the Drupal administrator
     When I go to "/admin/appearance/settings/uikit_admin"
      And I click on the element ".uikit-admin-picker__thumb--density-compact"
      And I click on the element ".uikit-admin-picker__thumb--sign-in-end"
      And I click on the element ".uikit-admin-picker__thumb--font-system"
      And I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
      And the element "input[name='density'][value='compact']:checked" should exist
      And the element "input[name='sign_in_layout'][value='end']:checked" should exist
      And the element "html[data-uikit-admin-density='compact'][data-uikit-admin-font='system']" should exist
      And no error should have been logged

  Scenario Outline: The settings page passes the AAA check in the <scheme> scheme
    Given I am logged in as the Drupal administrator
      And the color scheme is "<scheme>"
     When I go to "/admin/appearance/settings/uikit_admin"
     Then the page should pass an accessibility audit at level "AAA"
      And the page should not violate the accessibility rule "target-size"
      And the first 20 tab stops should have a 2px solid focus ring

    Examples:
      | scheme |
      | light  |
      | dark   |
