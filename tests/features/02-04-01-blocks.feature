@watchdog @cleanup
Feature: Blocks
  As a site administrator
  I want to place, move and remove blocks and manage content blocks with UIkit Admin
  So that the block layout and the block library keep working

  Scenario: Place a block through the dialogs and configure it
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/block"
     Then the element "[class*='uikit-admin-tabs'] a[href$='/admin/structure/block/list/claro']" should exist
      And the element "a[href*='/admin/structure/block/demo/olivero']" should exist
     When I click on the element "a[href*='/admin/structure/block/library/olivero?region=footer_top']"
      And I wait for ".ui-dialog input[type='search']" to appear
      And I type "Powered" into the element ".ui-dialog input[type='search']"
     Then the element ".ui-dialog tr:has-text('Main navigation')" should be hidden
     When I click on the element ".ui-dialog a[href*='/system_powered_by_block/olivero?region=footer_top']"
      And I wait for ".ui-dialog input[name='settings[label]']" to appear
      And I fill in the element ".ui-dialog input[name='settings[label]']" with "qa-Powered"
      And I click on the element ".ui-dialog button[aria-label='Edit machine name']"
      And I fill in the element ".ui-dialog input[name='id']" with "qa_powered"
      And I check ".ui-dialog input[name='settings[label_display]']"
      And I click on the element ".ui-dialog .vertical-tabs__menu-item a[href*='visibility-user-role']"
      And I check ".ui-dialog input[name='visibility[user_role][roles][authenticated]']"
     Then ".ui-dialog .vertical-tabs__menu-item a[href*='visibility-user-role']" should contain text "Authenticated user"
      And the element ".ui-dialog select[name='region']" should have the value "footer_top"
     When I press the button "Save block"
     Then the status messages should read "The block configuration has been saved."
      And the element "tr.color-success:has-text('qa-Powered'), tr.js-block-placed:has-text('qa-Powered')" should exist
     When I go to "/"
     Then I should see "qa-Powered"
      And no error should have been logged

  Scenario: Move, disable, enable and remove a block
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/block/add/system_powered_by_block/olivero?region=footer_top"
      And I fill in "settings[label]" with "qa-Moved"
      And I press the button "Edit machine name"
      And I fill in "id" with "qa_moved"
      And I press the button "Save block"
     Then the status messages should read "The block configuration has been saved."
     When I press the button "Show row weights"
      And I select "sidebar" from "blocks[qa_moved][region]"
     Then I should see "You have unsaved changes."
     When I press the button "Save blocks"
     Then the status messages should read "The block settings have been updated."
     When I reload the page
     Then the element "select[name='blocks[qa_moved][region]']" should have the value "sidebar"
     When I press the button "Hide row weights"
      And I click the operation "Disable" in the "qa-Moved" row
     Then the status messages should read "The block settings have been updated."
      And I should see "qa-Moved (disabled)"
     When I click the operation "Enable" in the "qa-Moved" row
     Then the status messages should read "The block settings have been updated."
     When I click the operation "Remove" in the "qa-Moved" row
      And I wait for ".ui-dialog, form.block-delete-form" to appear
     Then I should see "Are you sure you want to remove the block qa-Moved from the Sidebar region?"
     When I press the button "Remove"
     Then the status messages should read "The block qa-Moved has been removed from the Sidebar region."
      And no error should have been logged

  Scenario: Add, edit and delete a content block and a block type
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content/block"
      And I mark the current page
      And I click on the element "[class*='uikit-admin-tabs'] a[href$='/admin/content']"
     Then the page should have been swapped by HTMX
     When I click on the element "[class*='uikit-admin-tabs'] a[href$='/admin/content/block']"
     Then the page should have been swapped by HTMX
      And the element "a[href*='/block/add']" should exist
     When I go to "/block/add/basic"
      And I fill in "Block description" with "qa-UIkit promo"
      And I type "The promotion text." in the rich text editor "#edit-body-0-value"
      And I press the button "Save"
     Then the status messages should read "Basic block qa-UIkit promo has been created."
     When I fill in "Block description" with "qa-UIkit"
      And I click on the element "input[id^='edit-submit-block-content']"
      And I click the operation "Edit" in the "qa-UIkit promo" row
      And I wait until the page is loaded
      And I fill in "Block description" with "qa-UIkit promo edited"
      And I press the button "Save"
     Then the status messages should read "Basic block qa-UIkit promo edited has been updated."
      And the page should not carry the HTMX page state
     When I click the operation "Delete" in the "qa-UIkit promo edited" row
      And I wait for ".ui-dialog" to appear
      And I press the button "Delete"
     Then the status messages should read "The content block qa-UIkit promo edited has been deleted."
     When I go to "/admin/structure/block-content"
      And I click on the element "a[href$='/admin/structure/block-content/add']"
      And I wait until the page is loaded
      And I fill in "Label" with "qa-Promo"
     Then the element "#edit-id" should have the value "qa_promo"
     When I press the button "Save"
     Then the status messages should read "Block type qa-Promo has been added."
      And I should see "qa-Promo"
     When I click the operation "Delete" in the "qa-Promo" row
      And I wait for ".ui-dialog" to appear
      And I press the button "Delete"
     Then the status messages should read "The block type qa-Promo has been deleted."
      And no error should have been logged
