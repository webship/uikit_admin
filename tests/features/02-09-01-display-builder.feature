@watchdog
Feature: Display Builder with UIkit Admin
  As a site builder
  I want a Display Builder profile made for the back office and a page layout for the sign-in screens
  So that I build with the components of this theme, never with the ones of a front theme

  Scenario: The profiles and the sign-in page layout come with Display Builder
    Given the modules "display_builder, display_builder_page_layout" are installed
     Then the configuration "display_builder.profile.uikit_admin" should exist
      And the configuration "display_builder.profile.uikit_admin_sign_in" should exist
      And the configuration "display_builder_page_layout.page_layout.uikit_admin_sign_in" should exist
      And the configuration "display_builder_page_layout.page_layout.uikit_admin_sign_in" should have "status" set to "false"
      And the component library of the profile "uikit_admin" should leave out "ui_suite_uikit, webtheme"
      And the component library of the profile "uikit_admin" should leave out the components "uikit_admin:admin_page, uikit_admin:sign_in"

  @sign-in
  Scenario: The sign-in page layout draws the log in screen once it is chosen
    Given the modules "display_builder, display_builder_page_layout" are installed
      And the configuration "uikit_admin.settings" is put back after the scenario
      And UIkit Admin shows the sign-in screens with the "center" layout
      And the sign-in page layout "uikit_admin_sign_in" is chosen
     When I go to "/user/login"
     Then the element ".uikit-admin-sign-in" should exist
      And the element ".uikit-admin-sign-in__site" should not exist
      And the element ".uikit-admin-sign-in__brand-inner > img" should exist
      And the page should pass an accessibility audit at level "AAA"
      And the element "#edit-name" should be visible
      And the page should have exactly one h1

  Scenario: The screens print their tables and indexes through the components
    Given I am logged in as the Drupal administrator
     When I go to "/admin/people/roles"
     Then the element ".uikit-admin-table-scroll > table.uk-table.uk-table-divider[data-component-id='uikit_admin:table']" should exist
      And the element ".uikit-admin-table-scroll > table > thead > tr > th" should exist
      And I should not see "<th"
     When I go to "/admin/modules"
     Then the element "table.uikit-admin-modules[data-component-id='uikit_admin:table']" should exist
      And the element "table.uikit-admin-modules > thead > tr > th" should exist
     When I go to "/admin/config"
     Then the element ".uikit-admin-index[data-component-id='uikit_admin:grid'] .uk-card" should exist
      And no error should have been logged
