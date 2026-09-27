@sign-in @a11y
Feature: The sign-in screens
  As a person who works on the site
  I want a clear sign-in screen that carries the site's name
  So that I know where I am before I type my password

  Scenario Outline: The <layout> layout signs in and passes the accessibility checks
    Given UIkit Admin shows the sign-in screens with the "<layout>" layout
     When I go to "/user/login"
     Then the element ".uikit-admin-sign-in--<layout>" should exist
      And the element "#edit-name" should be visible
      And the element "#edit-pass" should be visible
      And the page should have a main landmark
      And the page should have exactly one h1
      And every form field should have an accessible label
      And every link should have an accessible name
      And the page should have no critical accessibility violations
      And the page should have no serious accessibility violations

    Examples:
      | layout    |
      | center    |
      | start     |
      | end       |
      | top       |
      | bottom    |
      | spotlight |

  Scenario: The password reset screen uses the same layout
    Given UIkit Admin shows the sign-in screens with the "spotlight" layout
     When I go to "/user/password"
     Then the element ".uikit-admin-sign-in--spotlight" should exist
      And the element "#edit-name" should be visible
      And the page should have no serious accessibility violations
