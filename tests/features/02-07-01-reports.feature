@watchdog @cleanup
Feature: Reports and moving around the back office
  As a site administrator
  I want the reports, the palette and the HTMX navigation to work with UIkit Admin
  So that I can read the state of the site and reach any screen quickly

  Scenario: Read the status report and run cron from it
    Given I am logged in as the Drupal administrator
     When I go to "/admin/reports/status"
     Then the element "a.uikit-admin-status-counter[href='#checked']" should exist
      And the element "#checked" should exist
      And I should see "Drupal Version"
      And I should see "PHP"
     When I click on the element "a[href*='/admin/reports/status/run-cron']"
     Then the status messages should read "Cron ran successfully."
      And the current path should end with "/admin/reports/status"
      And no error should have been logged

  Scenario: Filter the recent log messages, read one and clear them
    Given I am on "/qa-no-such-page"
      And I am logged in as the Drupal administrator
     When I go to "/admin/reports/dblog"
      And I select "page not found" from ".js-form-item-type select"
      And I click on the element "input[id^='edit-submit']"
      And I wait until the page is loaded
     Then I should see "qa-no-such-page"
      And I should not see "Session opened for"
     When I press the button "Reset"
      And I wait until the page is loaded
     Then the element "select[name='type[]'] option:checked" should not exist
     When I click on the element "tr:has-text('qa-no-such-page') a[href*='/admin/reports/dblog/event/']"
      And I wait until the page is loaded
     Then I should see "page not found"
      And I should see "Severity"
      And I should see "Hostname"
     When I go to "/admin/reports/page-not-found"
     Then I should see "qa-no-such-page"
     When I go to "/admin/reports/access-denied"
     Then the element "table" should exist
     When I go to "/admin/reports/dblog/confirm"
     Then I should see "Are you sure you want to delete the recent logs?"
     When I press the button "Confirm"
     Then the status messages should read "Database log cleared."
      And I should see "No log messages available."
      And no error should have been logged

  Scenario: Read the field list and the Views plugins
    Given I am logged in as the Drupal administrator
     When I go to "/admin/reports/fields"
     Then I should see "body"
      And the element "a[href*='/admin/structure/types/manage/']" should exist
     When I click on the element "[class*='uikit-admin-tabs'] a[href$='/admin/reports/fields/views-fields']"
      And I wait until the page is loaded
     Then the element "table" should exist
     When I go to "/admin/reports/views-plugins"
     Then I should see "Used in"
      And no error should have been logged

  Scenario: Check the available updates and change their settings
    Given the module "update" is installed
      And the configuration "update.settings" is put back after the scenario
      And I am logged in as the Drupal administrator
     When I go to "/admin/reports/updates"
      And I click on the element "a[href*='/admin/reports/updates/check']"
      And I wait until the URL contains "/admin/reports/updates"
     Then the status messages should read "available update data"
      And the page should have its styles and its scripts
     When I click on the element "[class*='uikit-admin-tabs'] a[href$='/admin/reports/updates/settings']"
      And I wait until the page is loaded
      And I select radio button "7"
      And I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
     When I reload the page
     Then the radio button with value "7" should be selected

  Scenario: Reach screens from the command palette
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I press the key "Control+k"
     Then the element ".uikit-admin-palette__dialog" should be visible
      And the focus should be on the element "#uikit-admin-palette-input"
     When I type "permissions" in the palette
      And I press the key "Enter"
     Then the current path should end with "/admin/people/permissions"
     When I press the key "Control+k"
      And I type "image styles" in the palette
      And I press the key "Enter"
     Then the current path should end with "/admin/config/media/image-styles"
     When I press the key "Control+k"
      And I type "block layout" in the palette
      And I press the key "Enter"
     Then the current path should end with "/admin/structure/block"
     When I press the key "Control+k"
      And I type "cron" in the palette
      And I press the key "Escape"
     Then the element ".uikit-admin-palette__dialog" should not be displayed
      And no error should have been logged

  Scenario: Walk the rail with HTMX, go back and forward
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I mark the current page
      And I click on the element ".uikit-admin-rail a[href$='/admin/structure']"
     Then the page should have been swapped by HTMX
      And the element ".uikit-admin-rail a.is-active[href$='/admin/structure']" should exist
     When I click on the element ".uikit-admin-rail a[href$='/admin/appearance']"
     Then the page should have been swapped by HTMX
      And the element ".uikit-admin-rail a.is-active[href$='/admin/appearance']" should exist
     When I click on the element ".uikit-admin-rail a[href$='/admin/config']"
     Then the page should have been swapped by HTMX
      And the element ".uikit-admin-rail a.is-active[href$='/admin/config']" should exist
     When I click on the element ".uikit-admin-rail a[href$='/admin/reports']"
     Then the page should have been swapped by HTMX
      And the current path should end with "/admin/reports"
      And the page should not carry the HTMX page state
     When I go back
     Then the current path should end with "/admin/config"
     When I press the key "Control+k"
     Then the element ".uikit-admin-palette__dialog" should be visible
     When I press the key "Escape"
      And I move forward one page
     Then the current path should end with "/admin/reports"
      And there should be no JavaScript errors
      And no error should have been logged

  Scenario: The rail loads full pages when the HTMX navigation is off
    Given the configuration "uikit_admin.settings" is put back after the scenario
      And I am logged in as the Drupal administrator
     When I go to "/admin/appearance/settings/uikit_admin"
      And I uncheck "htmx_navigation"
      And I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
     When I go to "/admin/content"
     Then the element "[data-off-canvas-main-canvas][hx-boost='true']" should not exist
     When I mark the current page
      And I click on the element ".uikit-admin-rail a[href$='/admin/structure']"
      And I wait until the URL contains "/admin/structure"
     Then the page should have been fully loaded
     When I press the key "Control+k"
     Then the element ".uikit-admin-palette__dialog" should be visible
      And no error should have been logged
