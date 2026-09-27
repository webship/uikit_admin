@watchdog
Feature: The HTMX navigation keeps the pages whole
  As a site administrator
  I want a page reached through HTMX to behave like a page loaded in full
  So that its forms, its links and its blocks work and a reload stays styled

  Scenario: A form reached through HTMX posts to a clean URL
    Given I am logged in as the Drupal administrator
     When I go to "/admin/config"
      And I mark the current page
      And I click on the element "a[href$='/admin/config/system/site-information']"
     Then the page should have been swapped by HTMX
      And the page should not carry the HTMX page state
      And the element "form#system-site-information-settings" should have the attribute "action" set to "/admin/config/system/site-information"
     When I submit the form with the button "#edit-submit"
     Then the page should have its styles and its scripts
      And the status messages should read "The configuration options have been saved."
      And the page should not carry the HTMX page state
      And no error should have been logged

  Scenario: The exposed filters keep the links of the listing clean
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I mark the current page
      And I fill in "Title" with "a"
      And I click on the element "#edit-submit-content"
     Then the page should have been swapped by HTMX
      And the page should not carry the HTMX page state
      And no error should have been logged

  Scenario: The Reset of the filters loads the listing without loading its scripts twice
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I fill in "Title" with "a"
      And I click on the element "#edit-submit-content"
      And I wait for "#edit-reset" to appear
      And I click on the element "#edit-reset"
      And I wait until the page is loaded
     Then the page should have its styles and its scripts
      And the page should not carry the HTMX page state
      And there should be no JavaScript errors
      And no error should have been logged

  Scenario: A page swapped on a cold cache keeps its breadcrumb, tabs and actions
    Given the caches are cleared
      And I am logged in as the Drupal administrator
     When I go to "/admin/people"
      And I mark the current page
      And I click on the element ".uikit-admin-tabs a[href$='/admin/people/permissions']"
     Then the page should have been swapped by HTMX
      And the current path should end with "/admin/people/permissions"
      And the element ".uikit-admin-tabs a[href$='/admin/people/roles']" should exist
      And the element ".uk-breadcrumb a" should exist
      And "[data-off-canvas-main-canvas] [data-big-pipe-placeholder-id]" should have a count of 0
      And no error should have been logged

  Scenario: The Drupal AJAX links open their dialog, not a new page
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/types/manage/page/fields"
      And I mark the current page
      And I click on the element "a.use-ajax[href$='/fields/add-field']"
      And I wait for ".ui-dialog" to appear
     Then the current path should end with "/admin/structure/types/manage/page/fields"
      And no error should have been logged

  Scenario: Back reloads the page, and the palette still opens
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I mark the current page
      And I click on the element ".uikit-admin-rail a[href$='/admin/people']"
     Then the page should have been swapped by HTMX
     When I move backward one page
      And I wait until the page is loaded
     Then the current path should end with "/admin/content"
     When I press the key "Control+k"
     Then the element ".uikit-admin-palette__dialog" should be visible
      And there should be no JavaScript errors
      And no error should have been logged
