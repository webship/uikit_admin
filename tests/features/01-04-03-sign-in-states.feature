@sign-in @watchdog
Feature: The states of the sign-in screens
  As a person who signs in
  I want every screen to say what happened
  So that I know what to do next

  Scenario: A wrong password shows an error in the card
    Given UIkit Admin shows the sign-in screens with the "center" layout
     When I go to "/user/login"
      And I fill in "name" with "qa-nobody"
      And I fill in "pass" with "not the password"
      And I press the button "Log in"
     Then the element ".uikit-admin-sign-in__messages .uk-alert-danger" should be visible
      And I should see "Unrecognized username or password"
      And the element "#edit-name" should have the attribute "autocomplete" set to "username"
      And the element "#edit-pass" should have the attribute "autocomplete" set to "current-password"
      And the element "#edit-name[autofocus]" should not exist
      And the element ".uikit-admin-sign-in__forgot a" should be visible

  Scenario: A reset request goes back to the log in screen with a message
    Given UIkit Admin shows the sign-in screens with the "center" layout
     When I go to "/user/password"
     Then the element ".uikit-admin-sign-in--password" should exist
     When I fill in "name" with "qa-nobody@example.com"
      And I press the button "Send reset link"
     Then the current path should end with "/user/login"
      And the element ".uikit-admin-sign-in__messages .uk-alert" should be visible

  Scenario: An expired one-time link says so
    Given UIkit Admin shows the sign-in screens with the "center" layout
     When I go to "/user/reset/1/1/qa-expired-hash"
     Then the element ".uikit-admin-sign-in__messages .uk-alert" should be visible
      And the element ".uikit-admin-sign-in" should exist

  @cleanup
  Scenario: The log out confirmation is a sign-in screen
    Given UIkit Admin shows the sign-in screens with the "spotlight" layout
      And the user "qa-signin-editor" with the role "content_editor" exists
      And I am logged in as the user "qa-signin-editor"
     When I go to "/user/logout/confirm"
     Then the element ".uikit-admin-sign-in--logout" should exist
      And the element ".uikit-admin-rail" should not exist

  Scenario: Registration by an administrator only: no rail, a clear line
    Given UIkit Admin shows the sign-in screens with the "center" layout
      And the configuration "user.settings" is put back after the scenario
      And the configuration "user.settings" has "register" set to "admin_only"
     When I go to "/user/register"
     Then the element ".uikit-admin-sign-in--denied" should exist
      And the element ".uikit-admin-rail" should not exist
      And I should see "Accounts are created by an administrator."
