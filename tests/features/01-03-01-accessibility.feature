@a11y
Feature: Accessibility of the administration screens
  As a person who uses a screen reader or the keyboard
  I want the back office to follow the accessibility standards
  So that I can run the site

  Scenario Outline: <name> passes the accessibility checks
    Given the content type "page" exists
      And I am logged in as the Drupal administrator
     When I go to "<path>"
     Then the page should have a title
      And the page should declare a language
      And the page should have a main landmark
      And the page should have exactly one h1
      And the heading hierarchy should be valid
      And every image should have an alt attribute
      And every form field should have an accessible label
      And every link should have an accessible name
      And every button should have an accessible name
      And every ARIA role should be valid
      And every ARIA reference should resolve
      And no element should have a positive tabindex
      And user zoom should be allowed
      And the page should have no critical accessibility violations
      And the page should have no serious accessibility violations

    Examples:
      | path                                    | name                        |
      | /admin                                  | the administration index    |
      | /admin/content                          | the content list            |
      | /admin/structure                        | the structure index         |
      | /admin/config                           | the configuration index     |
      | /admin/people                           | the people list             |
      | /admin/people/permissions               | the permissions form        |
      | /admin/appearance                       | the appearance page         |
      | /admin/modules                          | the module list             |
      | /admin/reports/status                   | the status report           |
      | /admin/config/system/site-information   | a configuration form        |
      | /node/add/page                          | a content form              |

  Scenario: The keyboard reaches the content of an administration screen
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I press the key "Tab"
     Then the focused element should match "a, button, input, [tabindex]"
      And the page should have a skip link

  Scenario: The palette is reachable and labelled
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I press the key "Control+k"
     Then the element "[role='dialog'][aria-modal='true']" should exist
      And the page should have no serious accessibility violations
