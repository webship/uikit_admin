@a11y @aaa
Feature: The administration screens meet WCAG 2.2 AAA
  As a person with low vision, or who uses the keyboard or a pointer with
  little precision
  I want the back office to have enhanced contrast, clear focus and large
  targets
  So that I can read and use every screen

  Scenario Outline: <path> passes the AAA check in the <scheme> scheme at <width> pixels
    Given I am logged in as the Drupal administrator
      And the color scheme is "<scheme>"
      And I set the viewport to <width> by 900
     When I go to "<path>"
     Then the page should pass an accessibility audit at level "AAA"
      And the page should not violate the accessibility rule "target-size"

    Examples:
      | path                                  | scheme | width |
      | /admin                                | light  | 1280  |
      | /admin/content                        | light  | 1280  |
      | /admin/people                         | light  | 1280  |
      | /admin/people/permissions             | light  | 1280  |
      | /admin/structure                      | light  | 1280  |
      | /admin/structure/views                | light  | 1280  |
      | /admin/structure/views/view/content   | light  | 1280  |
      | /admin/structure/block                | light  | 1280  |
      | /admin/config                         | light  | 1280  |
      | /admin/config/system/site-information | light  | 1280  |
      | /admin/appearance                     | light  | 1280  |
      | /admin/modules                        | light  | 1280  |
      | /admin/reports/status                 | light  | 1280  |
      | /admin/reports/dblog                  | light  | 1280  |
      | /admin                                | dark   | 1280  |
      | /admin/content                        | dark   | 1280  |
      | /admin/people                         | dark   | 1280  |
      | /admin/structure/views                | dark   | 1280  |
      | /admin/structure/views/view/content   | dark   | 1280  |
      | /admin/structure/block                | dark   | 1280  |
      | /admin/config/system/site-information | dark   | 1280  |
      | /admin/modules                        | dark   | 1280  |
      | /admin/reports/status                 | dark   | 1280  |
      | /admin/content                        | light  | 320   |
      | /admin/modules                        | light  | 320   |
      | /admin/reports/status                 | light  | 320   |
      | /admin/content                        | dark   | 320   |
      | /admin/modules                        | dark   | 320   |

  Scenario Outline: A content form passes the AAA check in the <scheme> scheme at <width> pixels
    Given the content type "page" exists
      And I am logged in as the Drupal administrator
      And the color scheme is "<scheme>"
      And I set the viewport to <width> by 900
     When I go to a content form with a body
     Then the page should pass an accessibility audit at level "AAA"
      And the page should not violate the accessibility rule "target-size"

    Examples:
      | scheme | width |
      | light  | 1280  |
      | dark   | 1280  |
      | light  | 320   |

  Scenario: The administration screens pass the full AAA check
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
     Then the page should pass the full accessibility check at level "AAA"

  Scenario Outline: The keyboard focus shows a solid ring in the <scheme> scheme
    Given the content type "page" exists
      And I am logged in as the Drupal administrator
      And the color scheme is "<scheme>"
     When I go to "/admin/content"
     Then the first 30 tab stops should have a 2px solid focus ring
     When I go to a content form with a body
     Then the first 30 tab stops should have a 2px solid focus ring

    Examples:
      | scheme |
      | light  |
      | dark   |

  Scenario: The rail, the top bar and the buttons offer 44 pixel targets
    Given the content type "page" exists
      And I am logged in as the Drupal administrator
      And I set the viewport to 1280 by 900
     When I go to "/admin/content"
     Then every visible ".uikit-admin-rail a, .uikit-admin-rail button" should offer a target of at least 44 by 44 pixels
      And every visible ".uikit-admin-topbar a, .uikit-admin-topbar button, .uikit-admin-topbar input" should offer a target of at least 44 by 44 pixels
      And every visible ".uikit-admin-main .uk-button, .uikit-admin-main input[type='submit']" should offer a target of at least 44 by 44 pixels
     When I go to a content form with a body
     Then every visible ".uikit-admin-main .uk-button, .uikit-admin-main input[type='submit']" should offer a target of at least 44 by 44 pixels

  Scenario: The top bar of a phone offers 44 pixel targets
    Given I am logged in as the Drupal administrator
      And I set the viewport to 390 by 800
     When I go to "/admin/content"
     Then every visible ".uikit-admin-topbar a, .uikit-admin-topbar button, .uikit-admin-topbar input" should offer a target of at least 44 by 44 pixels
