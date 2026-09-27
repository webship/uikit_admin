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
