@watchdog @cleanup
Feature: Configuration
  As a site administrator
  I want to configure the site, its themes and its modules with UIkit Admin
  So that every configuration screen of the back office keeps working

  Scenario: Install, set as default and uninstall a theme
    Given the configuration "system.theme" is put back after the scenario
      And I am logged in as the Drupal administrator
     When I go to "/admin/appearance"
      And I click on the element "a[href*='/admin/appearance/install?theme=stark']"
     Then the status messages should read "The Stark theme has been installed."
     When I click on the element "a[href*='/admin/appearance/default?theme=stark']"
     Then the status messages should read "will show the selected Stark theme by default."
     When I click on the element "a[href*='/admin/appearance/default?theme=olivero']"
     Then the status messages should read "will show the selected Olivero theme by default."
     When I click on the element "a[href*='/admin/appearance/uninstall?theme=stark']"
      And I wait until the page is loaded
      And I press the button "Uninstall"
     Then the status messages should read "The Stark theme has been uninstalled."
     When I select "uikit_admin" from "admin_theme"
      And I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
      And no error should have been logged

  Scenario: Change the settings of UIkit Admin
    Given the configuration "uikit_admin.settings" is put back after the scenario
      And I am logged in as the Drupal administrator
     When I go to "/admin/appearance"
      And I click on the element "[class*='uikit-admin-tabs'] a[href$='/admin/appearance/settings']"
      And I wait until the page is loaded
      And I click on the element "[class*='uikit-admin-tabs'] a[href$='/admin/appearance/settings/uikit_admin']"
      And I wait until the page is loaded
     Then the element "input[name='htmx_navigation']" should exist
     When I select radio button "compact"
      And I fill in the color field "uikit_admin_skin[accent]" with the value "#c0392b"
      And I select radio button "start"
      And I fill in "sign_in_message" with "qa sign-in message"
      And I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
     When I reload the page
     Then the element "html[data-uikit-admin-density='compact']" should exist
      And the style "background-color" of the element ".uk-button-primary" should be "rgb(192, 57, 43)"
      And the element "input[name='sign_in_message'][value='qa sign-in message']" should exist
      And no error should have been logged

  Scenario: Install and uninstall modules
    Given I am logged in as the Drupal administrator
     When I go to "/admin/modules"
      And I type "Telephone" into the element "input.table-filter-text"
     Then the element "input[name='modules[telephone][enable]']" should be visible
      And the element "input[name='modules[node][enable]']" should be hidden
     When I check "modules[telephone][enable]"
      And I press the button "Install"
     Then the status messages should read "Module Telephone has been installed."
     When I type "Content Moderation" into the element "input.table-filter-text"
      And I check "modules[content_moderation][enable]"
      And I press the button "Install"
     Then I should see "Some required modules must be installed"
     When I press the button "Continue"
     Then the status messages should read "2 modules have been installed"
     When I click on the element "[class*='uikit-admin-tabs'] a[href$='/admin/modules/uninstall']"
      And I wait until the page is loaded
      And I type "Telephone" into the element "input.table-filter-text"
      And I check "uninstall[telephone]"
      And I type "Content Moderation" into the element "input.table-filter-text"
      And I check "uninstall[content_moderation]"
      And I press the button "Uninstall"
     Then I should see "The following modules will be completely uninstalled from your site"
     When I press the button "Uninstall"
     Then the status messages should read "The selected modules have been uninstalled."
     When I check "uninstall[workflows]"
      And I press the button "Uninstall"
      And I press the button "Uninstall"
     Then the status messages should read "The selected modules have been uninstalled."
      And no error should have been logged

  Scenario: Change the site information, run cron and use the maintenance mode
    Given the configuration "system.site" is put back after the scenario
      And the configuration "automated_cron.settings" is put back after the scenario
      And I am logged in as the Drupal administrator
     When I go to "/admin/config"
      And I mark the current page
      And I click on the element "a[href$='/admin/config/system/site-information']"
     Then the page should have been swapped by HTMX
      And the element "#edit-site-frontpage" should exist
     When I fill in "Slogan" with "qa slogan"
      And I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
      And the page should have its styles and its scripts
      And the page should not carry the HTMX page state
     When I reload the page
     Then the element "#edit-site-slogan" should have the value "qa slogan"
     When I fill in "site_frontpage" with "/qa-no-such-page"
      And I press the button "Save configuration"
     Then the status messages should read "is invalid or you do not have access to it."
      And the element "input[name='site_frontpage'].uk-form-danger" should exist
     When I go to "/admin/config/system/cron"
      And I press the button "Run cron"
     Then the status messages should read "Cron ran successfully."
     When I select "3600" from "interval"
      And I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
     When I go to "/admin/config/development/maintenance"
      And I check "Put site into maintenance mode"
      And I fill in "maintenance_mode_message" with "qa maintenance"
      And I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
     When I go to "/admin/config"
     Then the status messages should read "Operating in maintenance mode."
     When I go to "/admin/config/development/maintenance"
      And I uncheck "Put site into maintenance mode"
      And I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
      And no error should have been logged

  Scenario: Change the performance, development and logging settings
    Given the configuration "system.performance" is put back after the scenario
      And the configuration "system.logging" is put back after the scenario
      And I am logged in as the Drupal administrator
     When I go to "/admin/config/development/performance"
      And I press the button "Clear all caches"
     Then the status messages should read "Caches cleared."
     When I select "300" from "page_cache_maximum_age"
      And I uncheck "preprocess_css"
      And I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
     When I reload the page
     Then the element "select[name='page_cache_maximum_age']" should have the value "300"
     When I go to "/admin/config/development/settings"
      And I check "twig_development_mode"
     Then the element "input[name='twig_debug']" should be visible
     When I uncheck "twig_development_mode"
     Then the element "input[name='twig_debug']" should be hidden
     When I press the button "Save settings"
     Then the status messages should read "The settings have been saved."
     When I go to "/admin/config/development/logging"
      And I select radio button "some"
      And I select "10000" from "dblog_row_limit"
      And I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
     When I reload the page
     Then the radio button with value "some" should be selected
      And no error should have been logged

  Scenario: Change the file and image settings and build an image style
    Given the configuration "system.file" is put back after the scenario
      And the configuration "system.image.gd" is put back after the scenario
      And I am logged in as the Drupal administrator
     When I go to "/admin/config/media/file-system"
      And I select "86400" from "temporary_maximum_age"
      And I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
     When I go to "/admin/config/media/image-toolkit"
      And I fill in "gd[image_jpeg_quality]" with "80"
      And I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
     When I go to "/admin/config/media/image-styles"
      And I click on the element "a[href$='/admin/config/media/image-styles/add']"
      And I wait until the page is loaded
      And I fill in "Image style name" with "qa-Hero"
     Then the element "#edit-name" should have the value "qa_hero"
     When I press the button "Create new style"
     Then the status messages should read "Style qa-Hero was created."
     When I select "image_scale_and_crop" from "new"
      And I press the button "Add"
      And I wait until the page is loaded
      And I fill in "data[width]" with "1200"
      And I fill in "data[height]" with "600"
      And I press the button "Add effect"
     Then the status messages should read "The image effect was successfully applied."
     When I select "image_desaturate" from "new"
      And I press the button "Add"
     Then the status messages should read "The image effect was successfully applied."
     When I press the button "Show row weights"
      And I select "-10" from the "weight" select of the "Desaturate" row
      And I press the button "Save"
     Then the status messages should read "Changes to the style have been saved."
     When I go to "/admin/config/media/image-styles"
      And I click the operation "Delete" in the "qa-Hero" row
      And I wait for ".ui-dialog, form[class*='delete']" to appear
      And I press the button "Delete"
     Then the status messages should read "The image style qa-Hero has been deleted."
      And no error should have been logged

  Scenario: Order the text formats, change a toolbar and add a text format
    Given I am logged in as the Drupal administrator
     When I go to "/admin/config/content/formats"
      And I press the button "Show row weights"
      And I press the button "Save"
     Then the status messages should read "The text format ordering has been saved."
     When I press the button "Hide row weights"
      And I click the operation "Configure" in the "Basic HTML" row
      And I wait until the page is loaded
      And I press the key "ArrowDown" on the element ".ckeditor5-toolbar-available__buttons li[data-id='underline']"
     Then the element ".ckeditor5-toolbar-active__buttons li[data-id='underline']" should exist
     When I press the key "ArrowUp" on the element ".ckeditor5-toolbar-active__buttons li[data-id='underline']"
     Then the element ".ckeditor5-toolbar-available__buttons li[data-id='underline']" should exist
      And the element ".js-form-item-editor-settings-toolbar-items.visually-hidden" should exist
     When I click on the element ".vertical-tabs__menu-item a[href*='ckeditor5-sourceediting']"
     Then the element "textarea[name*='ckeditor5_sourceEditing']" should be visible
     When I press the button "Save configuration"
     Then the status messages should read "The text format Basic HTML has been updated."
     When I go to "/admin/config/content/formats/add"
      And I fill in "Name" with "qa-Format"
     Then the element "#edit-format" should have the value "qa_format"
     When I select "ckeditor5" from "editor[editor]"
      And I wait for ".ckeditor5-toolbar-available__buttons" to appear
      And I press the button "Save configuration"
     Then the status messages should read "Added text format qa-Format."
     When I click the operation "Disable" in the "qa-Format" row
      And I wait for ".ui-dialog, form[class*='disable']" to appear
     Then I should see "Are you sure you want to disable the text format qa-Format?"
     When I press the button "Disable"
     Then the status messages should read "Disabled text format qa-Format."
      And no error should have been logged

  Scenario: Change the regional settings and manage a date format
    Given the configuration "system.date" is put back after the scenario
      And I am logged in as the Drupal administrator
     When I go to "/admin/config/regional/settings"
      And I select "Saturday" from "date_first_day"
      And I press the button "Save configuration"
     Then the status messages should read "The configuration options have been saved."
     When I reload the page
     Then the element "select[name='date_first_day']" should have the value "6"
     When I go to "/admin/config/regional/date-time"
      And I click on the element "a[href$='/admin/config/regional/date-time/formats/add']"
      And I wait until the page is loaded
      And I fill in "Name" with "qa-UIkit short"
     Then the element "#edit-id" should have the value "qa_uikit_short"
     When I type "Y-m-d" into the element "#edit-date-format-pattern"
     Then "#edit-date-format-pattern--description, .form-item-date-format-pattern" should contain text "Displayed as"
     When I press the button "Add format"
     Then the status messages should read "Custom date format added."
     When I click the operation "Edit" in the "qa-UIkit short" row
      And I wait until the page is loaded
      And I fill in "date_format_pattern" with "Y-m-d H:i"
      And I press the button "Save format"
     Then the status messages should read "Custom date format updated."
     When I click the operation "Delete" in the "qa-UIkit short" row
      And I wait for ".ui-dialog, form[class*='delete']" to appear
      And I press the button "Delete"
     Then the status messages should read "The date format qa-UIkit short has been deleted."
      And no error should have been logged

  Scenario: Add, filter, edit and delete a URL alias
    Given the "page" content item "qa-Aliased" exists
      And I am logged in as the Drupal administrator
     When I go to "/admin/config/search/path"
      And I click on the element "a[href$='/admin/config/search/path/add']"
      And I wait until the page is loaded
      And I fill in "System path" with "/user/1"
      And I fill in "URL alias" with "/qa-uikit-alias"
      And I press the button "Save"
     Then the status messages should read "The alias has been saved."
     When I fill in "filter" with "qa-uikit"
      And I press the button "Filter"
      And I wait until the page is loaded
     Then I should see "/qa-uikit-alias"
     When I click on the element "th a[href*='order=Alias']"
      And I wait until the URL contains "order=Alias"
     Then the element "th[aria-sort]" should exist
     When I click the operation "Edit" in the "/qa-uikit-alias" row
      And I wait until the page is loaded
      And I fill in "URL alias" with "/qa-uikit-alias2"
      And I press the button "Save"
     Then the status messages should read "The alias has been saved."
     When I click the operation "Delete" in the "/qa-uikit-alias2" row
      And I wait for ".ui-dialog, form[class*='delete']" to appear
      And I press the button "Delete"
     Then the status messages should read "The URL alias /qa-uikit-alias2 has been deleted."
     When I press the button "Reset"
      And I wait until the page is loaded
     Then the element "input[name='filter']" should have the value ""
      And no error should have been logged
