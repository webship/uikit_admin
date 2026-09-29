Feature: The shell of the back office
  As a site administrator
  I want the rail, the bar and the palette on every administration screen
  So that I always know where I am and can reach anything

  Scenario: The rail carries the administration menu
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
     Then the element "nav.uikit-admin-rail" should exist
      And the element ".uikit-admin-rail__item.is-active" should exist
      And I should see "Content"
      And I should see "Structure"

  Scenario: The bar carries the page and its actions
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
     Then the element ".uikit-admin-topbar" should exist
      And the element ".uikit-admin-topbar__title h1" should exist
      And the element ".uikit-admin-topbar__search" should exist

  Scenario: The palette opens with the keyboard and filters
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I press the key "Control+k"
     Then the element ".uikit-admin-palette__dialog" should be visible
     When I type "permissions" in the palette
     Then I should see "Permissions"

  Scenario: The rail collapses and stays collapsed
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I click on the element "[data-uikit-admin-rail-toggle]"
     Then the element "html.uikit-admin-rail-collapsed" should exist
     When I go to "/admin/structure"
     Then the element "html.uikit-admin-rail-collapsed" should exist

  Scenario: The rail offers a visible way to log out
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
     Then the element ".uikit-admin-rail__logout" should be visible
      And I should see "Log out"
     When I click on the element ".uikit-admin-rail__logout"
     Then I should see "Log in"

  Scenario: The icons of the rail, the top bar and the palette stay the ones of the release
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
     Then the icons of the shell should be the ones of the last release
     When I go to "/admin/config"
     Then the icons of the shell should be the ones of the last release

  Scenario: The drawer of a phone keeps the labels of the rail
    Given I am logged in as the Drupal administrator
      And I set the viewport to 390 by 800
     When I go to "/admin/content"
      And I click on the element "[data-uikit-admin-rail-open]"
     Then the element ".uikit-admin-rail__label" should be visible
      And the style "position" of the element ".uikit-admin-rail__label" should not be "absolute"
      And the style "position" of the element ".uikit-admin-rail__logout-text" should not be "absolute"

  @cleanup
  Scenario: The rail shows only the places a person may open
    Given the user "qa-rail-editor" with the role "content_editor" exists
      And I am logged in as the user "qa-rail-editor"
     When I go to "/admin/content"
     Then the element "nav.uikit-admin-rail" should exist
      And I should not see "Inaccessible"
      And the element ".uikit-admin-rail__item.is-active" should exist
      And the icons of the shell should be the ones of the last release

  Scenario: The palette reaches the content and the media
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I press the key "Control+k"
      And I type "add content" in the palette
     Then I should see "Add content"
     When I type "media" in the palette
     Then I should see "Media"
