@watchdog @cleanup
Feature: People
  As a site administrator
  I want to manage the accounts, the roles and the permissions with UIkit Admin
  So that every people screen of the back office keeps working

  Scenario: Add a user account and refuse a taken name
    Given I am logged in as the Drupal administrator
     When I go to "/admin/people"
      And I mark the current page
      And I click on the element "a[href$='/admin/people/create']"
     Then the page should have been swapped by HTMX
     When I fill in "Email address" with "qa-editor1@example.com"
      And I fill in "Username" with "qa-editor1"
      And I fill in "#edit-pass-pass1" with "Correct.Horse.42" by attr
      And I fill in "#edit-pass-pass2" with "Correct.Horse.42" by attr
     Then ".password-confirm-message" should contain text "yes"
     When I select radio button "#edit-status-1"
      And I check "Content editor"
     Then the element "details#edit-timezone[open]" should exist
     When I select "Europe/London" from "timezone"
      And I press the button "Create new account"
     Then the status messages should read "Created a new user account for qa-editor1. No email has been sent."
      And the page should have its styles and its scripts
      And the page should not carry the HTMX page state
     When I go to "/admin/people/create"
      And I fill in "Email address" with "qa-editor1-again@example.com"
      And I fill in "Username" with "qa-editor1"
      And I fill in "#edit-pass-pass1" with "Correct.Horse.42" by attr
      And I fill in "#edit-pass-pass2" with "Correct.Horse.42" by attr
      And I press the button "Create new account"
     Then the status messages should read "The username qa-editor1 is already taken."
      And the element "input[name='name'].uk-form-danger" should exist
      And there should be no JavaScript errors
      And no error should have been logged

  Scenario: Edit a user account
    Given the user "qa-edited" exists
      And I am logged in as the Drupal administrator
     When I go to "/admin/people"
      And I fill in "Name or email contains" with "qa-edited"
      And I click on the element "#edit-submit-user-admin-people"
      And I click the operation "Edit" in the "qa-edited" row
      And I wait until the page is loaded
      And I fill in "Email address" with "qa-edited-changed@example.com"
      And I check "Content editor"
      And I press the button "Save"
     Then the status messages should read "The changes have been saved."
     When I click the operation "Edit" in the "qa-edited" row
      And I wait until the page is loaded
     Then the element "#edit-mail" should have the value "qa-edited-changed@example.com"
      And the checkbox "#edit-roles-content-editor" should be checked
      And the element "a#edit-delete.uk-button-danger" should exist
     When I click on the element "a#edit-delete"
      And I wait until the page is loaded
     Then I should see "Disable the account and keep its content."
      And the element "input[name='user_cancel_method']" should exist
      And no error should have been logged

  Scenario: Filter and sort the people list
    Given the user "qa-listed-a" exists
      And the user "qa-listed-b" exists
      And I am logged in as the Drupal administrator
     When I go to "/admin/people"
      And I fill in "Name or email contains" with "qa-listed"
      And I select "Active" from "status"
      And I click on the element "#edit-submit-user-admin-people"
     Then I should see "qa-listed-a"
      And I should see "qa-listed-b"
     When I click on the element "th a[href*='order=name']"
      And I wait until the URL contains "order=name"
     Then the element "th[aria-sort]" should exist
      And the element "#edit-user" should have the value "qa-listed"
      And the page should not carry the HTMX page state
     When I select "Content editor" from "role"
      And I click on the element "#edit-submit-user-admin-people"
     Then I should see "No people available."
     When I press the button "Reset"
      And I wait until the page is loaded
     Then the element "#edit-user" should have the value ""
      And no error should have been logged

  Scenario: Add and remove a role, block, unblock and cancel accounts in bulk
    Given the user "qa-bulk-user" exists
      And I am logged in as the Drupal administrator
     When I go to "/admin/people"
      And I fill in "Name or email contains" with "qa-bulk-user"
      And I click on the element "#edit-submit-user-admin-people"
      And I select the row "qa-bulk-user"
      And I select "Add the Content editor role to the selected user(s)" from "action"
      And I press the button "Apply to selected items"
     Then the status messages should read "Add the Content editor role to the selected user(s) was applied to 1 item."
      And I should see "Content editor" in the "qa-bulk-user" row
     When I select the row "qa-bulk-user"
      And I select "Remove the Content editor role from the selected user(s)" from "action"
      And I press the button "Apply to selected items"
     Then the status messages should read "Remove the Content editor role from the selected user(s) was applied to 1 item."
     When I select the row "qa-bulk-user"
      And I select "Block the selected user(s)" from "action"
      And I press the button "Apply to selected items"
     Then the status messages should read "Block the selected user(s) was applied to 1 item."
      And I should see "Blocked" in the "qa-bulk-user" row
     When I select the row "qa-bulk-user"
      And I select "Unblock the selected user(s)" from "action"
      And I press the button "Apply to selected items"
     Then the status messages should read "Unblock the selected user(s) was applied to 1 item."
      And I should see "Active" in the "qa-bulk-user" row
     When I select the row "qa-bulk-user"
      And I select "Cancel the selected user account(s)" from "action"
      And I press the button "Apply to selected items"
     Then I should see "Are you sure you want to cancel these user accounts?"
     When I select radio button "user_cancel_delete"
      And I press the button "Confirm"
     Then the status messages should read "Account qa-bulk-user has been deleted."
      And no error should have been logged

  Scenario: Add, reorder, rename and delete a role
    Given I am logged in as the Drupal administrator
     When I go to "/admin/people/roles"
      And I click on the element "a[href$='/admin/people/roles/add']"
      And I wait until the page is loaded
      And I fill in "Role name" with "qa-Reviewer"
     Then the element "#edit-id" should have the value "qa_reviewer"
      And the element ".machine-name-value" should be visible
     When I press the button "Save"
     Then the status messages should read "Role qa-Reviewer has been added."
     When I press the button "Show row weights"
      And I select "-10" from "entities[qa_reviewer][weight]"
      And I press the button "Save"
     Then the status messages should read "The role settings have been updated."
     When I reload the page
     Then the element "select[name='entities[qa_reviewer][weight]']" should have the value "-10"
     When I press the button "Hide row weights"
      And I click the operation "Edit" in the "qa-Reviewer" row
      And I wait until the page is loaded
      And I fill in "Role name" with "qa-Reviewer renamed"
      And I press the button "Save"
     Then the status messages should read "Role qa-Reviewer renamed has been updated."
     When I click the operation "Delete" in the "qa-Reviewer renamed" row
      And I wait for ".ui-dialog" to appear
     Then I should see "Are you sure you want to delete the role qa-Reviewer renamed?"
     When I press the button "Delete"
     Then the status messages should read "The role qa-Reviewer renamed has been deleted."
      And no error should have been logged

  Scenario: Grant and revoke a permission on every permissions screen
    Given I am logged in as the Drupal administrator
     When I go to "/admin/people/permissions"
      And I type "Page: Create new content" into the element "#edit-text"
     Then the element "tr:has-text('Page: Create new content')" should be visible
      And the element "tr:has-text('Administer blocks')" should be hidden
     When I check "content_editor[create page content]"
      And I press the button "Save permissions"
     Then the status messages should read "The changes have been saved."
     When I go to "/admin/people/roles"
      And I click the operation "Edit permissions" in the "Content editor" row
      And I wait until the page is loaded
     Then the checkbox "input[name='content_editor[create page content]']" should be checked
     When I uncheck "content_editor[create page content]"
      And I press the button "Save permissions"
     Then the status messages should read "The changes have been saved."
     When I go to "/admin/people/permissions/module/node"
     Then the checkbox "input[name='content_editor[create page content]']" should not be checked
     When I press the button "Save permissions"
     Then the status messages should read "The changes have been saved."
      And no error should have been logged

  Scenario: Change the account settings and put them back
    Given I am logged in as the Drupal administrator
     When I go to "/admin/config/people"
      And I click on the element "a[href$='/admin/config/people/accounts']"
      And I wait until the page is loaded
     Then the tabs should read "Settings, Manage fields, Manage form display, Manage display"
     When I select radio button "visitors_admin_approval"
      And I click on the element ".vertical-tabs__menu-item a[href='#edit-email-activated']"
     Then the element "#edit-email-activated" should be visible
     When I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
      And the page should have its styles and its scripts
      And the page should not carry the HTMX page state
     When I reload the page
     Then the radio button with value "visitors_admin_approval" should be selected
     When I select radio button "admin_only"
      And I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
      And no error should have been logged
