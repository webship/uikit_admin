@regressions
Feature: The fixes of UIkit Admin 4.0.1
  As a site administrator
  I want the fixed parts of the back office to stay fixed
  So that no release brings them back

  @ui_patterns
  Scenario: Empty slots render nothing when UI Patterns is installed
    Given the module "ui_patterns" is installed
      And the content type "page" exists
      And I am logged in as the Drupal administrator
     When I go to "/admin/content"
     Then no "aside" element should be empty
      And no "footer.uikit-admin-footer" element should be empty
      And no "[role='alert']" element should be empty
      And no ".uikit-admin-form-item__description" element should be empty
     When I go to "/admin/config/system/site-information"
     Then no "aside" element should be empty
      And no "[role='alert']" element should be empty
      And no ".uikit-admin-form-item__description" element should be empty
     When I go to a content form with a body
     Then no "aside" element should be empty
      And no "footer.uikit-admin-footer" element should be empty
      And no "[role='alert']" element should be empty
      And no ".uikit-admin-form-item .field-prefix, .uikit-admin-form-item .field-suffix" element should be empty

  @ui_patterns
  Scenario: The batch page, which has no regions, renders with UI Patterns
    Given the modules "update, ui_patterns" are installed
      And I am logged in as the Drupal administrator
     When I go to "/admin/reports/updates"
      And I click on the element "a[href*='/admin/reports/updates/check']"
      And I wait up to 180 seconds until the path is "/admin/reports/updates"
     Then the status messages should read "available update data"
      And no "aside" element should be empty
      And no "[role='alert']" element should be empty

  Scenario Outline: The table of <name> scrolls inside its region on a phone
    Given I am logged in as the Drupal administrator
      And I set the viewport to <width> by 800
     When I go to "<path>"
     Then the element "table" should exist
      And the page should not scroll sideways

    Examples:
      | path                        | name              | width |
      | /admin/content              | the content list  | 390   |
      | /admin/people               | the people list   | 390   |
      | /admin/structure/views      | the views listing | 390   |
      | /admin/reports/dblog        | the recent log    | 390   |
      | /admin/modules              | the module list   | 390   |
      | /admin/content              | the content list  | 320   |
      | /admin/people               | the people list   | 320   |
      | /admin/structure/views      | the views listing | 320   |
      | /admin/reports/dblog        | the recent log    | 320   |
      | /admin/modules              | the module list   | 320   |

  Scenario: The top bar fits a phone
    Given I am logged in as the Drupal administrator
      And I set the viewport to 390 by 800
     When I go to "/admin/content"
     Then every visible ".uikit-admin-topbar__rail-toggle" should offer a target of at least 44 by 44 pixels
      And every visible ".uikit-admin-topbar__search" should offer a target of at least 44 by 44 pixels
      And the elements ".uikit-admin-topbar__title h1" and ".uikit-admin-topbar__search" should not overlap
      And the page should not scroll sideways

  Scenario: The closed rail of a phone stays out of the tab order
    Given I am logged in as the Drupal administrator
      And I set the viewport to 390 by 800
     When I go to "/admin/content"
     Then the focus should not reach ".uikit-admin-rail" within 12 presses of Tab
     When I click on the element ".uikit-admin-topbar__rail-toggle"
     Then the element "[data-uikit-admin-rail-open]" should have the attribute "aria-expanded" set to "true"
      And the focus should be inside the element ".uikit-admin-rail"
     When I press the key "Escape"
     Then the focus should be on the element "[data-uikit-admin-rail-open]"
      And the element ".uikit-admin-rail" should have the attribute "inert" set to ""

  Scenario Outline: The skip link shows above the rail on <path>
    Given the content type "page" exists
      And I am logged in as the Drupal administrator
      And I set the viewport to 1280 by 700
     When I go to "<path>"
      And I press the key "Tab"
     Then the focus should be on the element "a[href='#main-content']"
      And the focused element should not be covered

    Examples:
      | path                      |
      | /admin/content            |
      | /admin/people/permissions |

  Scenario: A server message shows in the content, not in the top bar
    Given I am logged in as the Drupal administrator
     When I go to "/admin/config/development/performance"
      And I submit the form with the button "#edit-clear"
     Then the status messages should read "Caches cleared."
      And the element ".uikit-admin-main .uk-alert" should exist
      And the element ".uikit-admin-header .uk-alert" should not exist

  Scenario: A message of a script is a UIkit alert in the content
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And a script adds the "warning" message "A script warning."
     Then the element ".uikit-admin-main [data-drupal-message-type='warning'].uk-alert-warning" should exist
      And the element "[data-drupal-message-type='warning'] .uk-alert-close" should exist
      And the element "[data-drupal-message-type='warning']" should have the attribute "role" set to "status"
      And the element ".uikit-admin-header [data-drupal-message-type]" should not exist
     When a script adds the "error" message "A script error."
     Then the element "[data-drupal-message-type='error']" should have the attribute "role" set to "alert"

  Scenario: The toolbar of the rich text editor sticks under the top bar
    Given the content type "page" exists
      And I am logged in as the Drupal administrator
      And I set the viewport to 1280 by 700
     When I go to a content form with a body
      And I fill the rich text editor "[data-drupal-selector='edit-body-0-value']" with 60 paragraphs
      And I scroll down 900
     Then the element ".ck-sticky-panel__content_sticky" should be visible
      And the top of ".ck-sticky-panel__content" should be below the bottom of ".uikit-admin-header"

  @settings
  Scenario: The setting keeps the buttons of a form in reach, or not
    Given the content type "page" exists
      And the UIkit Admin setting "sticky_actions" is "1"
      And I am logged in as the Drupal administrator
      And I set the viewport to 1280 by 700
     When I go to a content form with a body
     Then the element "html" should have the attribute "data-uikit-admin-sticky-actions" set to "on"
      And the style "position" of the element ".uikit-admin-main .form-actions" should be "sticky"
    Given the UIkit Admin setting "sticky_actions" is "0"
     When I go to a content form with a body
     Then the element "html" should have the attribute "data-uikit-admin-sticky-actions" set to "off"
      And the style "position" of the element ".uikit-admin-main .form-actions" should not be "sticky"
