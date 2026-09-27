Feature: HTMX navigation
  As a person who runs the site
  I want to move between the administration screens without full reloads
  So that the back office answers quickly and the rail stays in place

  Scenario: A rail link swaps the page and keeps the document
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
     Then the element "[data-off-canvas-main-canvas]" should have the attribute "hx-boost" set to "true"
     When I mark the current page
      And I click on the element ".uikit-admin-rail a[href$='/admin/people']"
     Then the page should have been swapped by HTMX
      And I should see "People"
      And the element ".uikit-admin-rail a.is-active[href$='/admin/people']" should exist

  Scenario: The exposed filters go through HTMX
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I mark the current page
      And I fill in "Title" with "about"
      And I click on the element "#edit-submit-content"
     Then the page should have been swapped by HTMX
      And the element "#edit-title" should exist

  Scenario: The palette works on a swapped page
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I mark the current page
      And I click on the element ".uikit-admin-rail a[href$='/admin/people']"
     Then the page should have been swapped by HTMX
     When I press the key "Control+k"
     Then the element ".uikit-admin-palette__dialog" should be visible

  Scenario: Forms that post and the builder screens keep full page loads
    Given I am logged in as the Drupal administrator
     When I go to "/admin/config/system/site-information"
     Then the element "form#system-site-information-settings" should have the attribute "hx-boost" set to "false"
      And the URL "/admin/structure/block" should be excluded from the HTMX navigation
      And the URL "/node/1/edit" should be excluded from the HTMX navigation
      And the URL "/node/add/page" should be excluded from the HTMX navigation
      And the URL "/admin/structure/types/manage/page/fields" should be excluded from the HTMX navigation
      And the URL "/admin/people" should not be excluded from the HTMX navigation

  Scenario: UIkit loads from the theme, not from a CDN
    Given I am logged in as the Drupal administrator
     When I go to "/admin/content"
     Then the page should load nothing from another host
