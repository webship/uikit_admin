@watchdog @cleanup
Feature: Views
  As a site administrator
  I want to build and manage views with UIkit Admin
  So that the wizard, the Views UI dialogs and the listing keep working

  Scenario: Create a view with a page and a block through the wizard
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/views"
      And I click on the element "a[href$='/admin/structure/views/add']"
      And I wait until the page is loaded
      And I fill in "View name" with "qa-UIkit listing"
     Then the element "#edit-id" should have the value "qa_uikit_listing"
      And the element ".machine-name-value" should be visible
     When I check "Description"
      And I fill in "description" with "qa description"
      And I select "Unsorted" from "show[sort]"
      And I wait for AJAX to finish
      And I check "Create a page"
     Then the element "input[name='page[path]']" should be visible
     When I fill in "page[path]" with "qa-uikit-listing"
      And I fill in "page[items_per_page]" with "5"
      And I check "Create a block"
      And I press the button "Save and edit"
     Then the status messages should read "The view qa-UIkit listing has been saved."
      And the current path should end with "/admin/structure/views/view/qa_uikit_listing"
     When I go to "/qa-uikit-listing"
     Then I should see "qa-UIkit listing"
      And no error should have been logged

  Scenario: Edit a view in the Views UI dialogs
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/views/add"
      And I fill in "View name" with "qa-UIkit edited"
      And I check "Create a page"
      And I fill in "page[path]" with "qa-uikit-edited"
      And I select "titles_linked" from "page[style][row_plugin]"
      And I wait for AJAX to finish
      And I check "Create a block"
      And I press the button "Save and edit"
     Then the status messages should read "The view qa-UIkit edited has been saved."
     When I click on the element "a[id^='views-add-field']"
      And I wait for ".ui-dialog input[name='override[controls][options_search]']" to appear
      And I type "Authored on" into the element ".ui-dialog input[name='override[controls][options_search]']"
      And I check ".ui-dialog input[name='name[node_field_data.created]']"
      And I press the primary button of the dialog
      And I wait for ".ui-dialog input[name='options[custom_label]']" to appear
      And I check ".ui-dialog input[name='options[custom_label]']"
      And I wait for ".ui-dialog input[name='options[label]']" to appear
      And I fill in the element ".ui-dialog input[name='options[label]']" with "qa published on"
      And I press the primary button of the dialog
      And I wait for ".ui-dialog" to disappear
     Then I should see "qa published on"
      And I should see "You have unsaved changes."
     When I click on the element "a[id^='views-add-filter']"
      And I wait for ".ui-dialog input[name='override[controls][options_search]']" to appear
      And I check ".ui-dialog input[name='name[node_field_data.promote]']"
      And I press the primary button of the dialog
      And I wait for ".ui-dialog input[name='options[value]']" to appear
      And I press the primary button of the dialog
      And I wait for ".ui-dialog" to disappear
     Then I should see "Promoted to front page"
     When I click on the element "a[id^='views-add-sort']"
      And I wait for ".ui-dialog input[name='override[controls][options_search]']" to appear
      And I check ".ui-dialog input[name='name[node_field_data.title]']"
      And I press the primary button of the dialog
      And I wait for ".ui-dialog input[name='options[order]']" to appear
      And I click on the element ".ui-dialog input[name='options[order]'][value='DESC']"
      And I press the primary button of the dialog
      And I wait for ".ui-dialog" to disappear
     Then I should see "(desc)"
     When I click on the element ".views-ui-display-tab-bucket:has([id^='views-rearrange-field']) button[aria-label='More operations']"
      And I click on the element "a[id^='views-rearrange-field']"
      And I wait for ".ui-dialog table" to appear
      And I press the button "Show row weights"
      And I fill in the element ".ui-dialog input[name='fields[created][weight]']" with "-10"
      And I press the primary button of the dialog
      And I wait for ".ui-dialog" to disappear
     Then I should see "You have unsaved changes."
     When I click on the element "a[id^='views-page-1-title']"
      And I wait for ".ui-dialog input[name='title']" to appear
      And I select "page_1" from ".ui-dialog select[name='override[dropdown]']"
      And I wait for AJAX to finish
      And I fill in the element ".ui-dialog input[name='title']" with "qa page title"
      And I press the button "Apply (this display)"
      And I wait for ".ui-dialog" to disappear
     Then I should see "qa page title"
     When I press the button "Update preview"
      And I wait for AJAX to finish
     Then the element ".view-preview-sql, #views-live-preview" should exist
     When I press the button "Save"
     Then the status messages should read "The view qa-UIkit edited has been saved."
     When I go to "/qa-uikit-edited"
     Then I should see "qa page title"
      And no error should have been logged

  Scenario: Disable, enable, duplicate and delete a view
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/views/add"
      And I fill in "View name" with "qa-UIkit managed"
      And I press the button "Save and edit"
     Then the status messages should read "The view qa-UIkit managed has been saved."
     When I go to "/admin/structure/views"
      And I type "qa-UIkit" into the element "input.views-filter-text"
     Then the element "tr:has(a[href$='/admin/structure/views/view/content'])" should be hidden
     When I click the operation "Disable" in the "qa-UIkit managed" row
      And I wait for AJAX to finish
     Then the element "table.disabled tr:has-text('qa-UIkit managed')" should exist
     When I reload the page
      And I click the operation "Enable" in the "qa-UIkit managed" row
      And I wait for AJAX to finish
     When I reload the page
     Then I click the operation "Duplicate" in the "qa-UIkit managed" row
      And I wait until the page is loaded
      And I fill in "View name" with "qa-UIkit managed copy"
     Then the element "#edit-id" should have the value "qa_uikit_managed_copy"
     When I press the button "Duplicate"
      And I wait until the URL contains "/admin/structure/views/view/qa_uikit_managed_copy"
      And I go to "/admin/structure/views"
      And I click the operation "Delete" in the "qa-UIkit managed copy" row
      And I wait for ".ui-dialog" to appear
     Then I should see "Are you sure you want to delete the view qa-UIkit managed copy?"
     When I press the button "Delete"
     Then the status messages should read "The view qa-UIkit managed copy has been deleted."
     When I click the operation "Delete" in the "qa-UIkit managed" row
      And I wait for ".ui-dialog" to appear
      And I press the button "Delete"
     Then the status messages should read "The view qa-UIkit managed has been deleted."
      And no error should have been logged

  Scenario: Change the Views UI settings and clear the Views cache
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/views"
      And I click on the element "[class*='uikit-admin-tabs'] a[href$='/admin/structure/views/settings']"
      And I wait until the page is loaded
      And I check "Always show the default display"
      And I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
     When I reload the page
     Then the checkbox "input[name='ui_show_default_display']" should be checked
     When I uncheck "Always show the default display"
      And I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
     When I click on the element "[class*='uikit-admin-tabs'] a[href$='/admin/structure/views/settings/advanced']"
      And I wait until the page is loaded
      And I press the button "Clear Views' cache"
     Then the status messages should read "The cache has been cleared."
      And the page should have its styles and its scripts
      And the page should not carry the HTMX page state
      And no error should have been logged
