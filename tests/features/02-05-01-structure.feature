@watchdog @cleanup
Feature: Structure
  As a site administrator
  I want to shape content types, fields, displays, menus, vocabularies and display modes with UIkit Admin
  So that every structure screen of the back office keeps working

  Scenario: Add, edit and delete a content type
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/types"
      And I click on the element "a[href$='/admin/structure/types/add']"
      And I wait until the page is loaded
      And I fill in "Name" with "qa-Landing"
     Then the element "#edit-type" should have the value "qa_landing"
     When I fill in "Description" with "qa landing pages"
      And I click on the element ".vertical-tabs__menu-item a[href='#edit-submission']"
      And I fill in "Title field label" with "Headline"
      And I select radio button "#edit-preview-mode-2"
      And I click on the element ".vertical-tabs__menu-item a[href='#edit-workflow']"
      And I check "options[promote]"
      And I check "options[sticky]"
     Then ".vertical-tabs__menu-item a[href='#edit-workflow']" should contain text "Sticky at top of lists"
     When I click on the element ".vertical-tabs__menu-item a[href='#edit-display']"
      And I uncheck "display_submitted"
      And I click on the element ".vertical-tabs__menu-item a[href='#edit-menu']"
      And I check "menu_options[main]"
      And I press the button "Save"
     Then the status messages should read "The content type qa-Landing has been added."
     When I click the operation "Edit" in the "qa-Landing" row
      And I wait until the page is loaded
     Then the element "#edit-title-label" should have the value "Headline"
     When I fill in "Description" with "qa landing pages, edited"
      And I press the button "Save"
     Then the status messages should read "The content type qa-Landing has been updated."
     When I click the operation "Delete" in the "qa-Landing" row
      And I wait for ".ui-dialog, form[class*='delete']" to appear
     Then I should see "Are you sure you want to delete the content type qa-Landing?"
     When I press the button "Delete"
     Then the status messages should read "The content type qa-Landing has been deleted."
      And no error should have been logged

  Scenario: Add a field, re-use a field and delete it
    Given the article content type "qa_article" exists
      And I am logged in as the Drupal administrator
     When I go to "/admin/structure/types/manage/qa_article/fields"
      And I click "Create a new field"
      And I wait for ".ui-dialog a.field-option" to appear
      And I click on the element ".ui-dialog a.field-option[href*='/plain_text/']"
      And I wait for ".ui-dialog input[name='label']" to appear
      And I fill in the element ".ui-dialog input[name='label']" with "qa Subtitle"
     Then the element ".ui-dialog input[name='field_name']" should have the value "qa_subtitle"
     When I click on the element ".ui-dialog input[name='field_options_wrapper'][value='string']"
      And I press the button "Continue"
      And I wait for ".ui-dialog input[name='required']" to appear
      And I check ".ui-dialog input[name='required']"
      And I fill in the element ".ui-dialog textarea[name='description']" with "qa help text"
      And I fill in the element ".ui-dialog input[name='field_storage[subform][settings][max_length]']" with "200"
      And I press the button "Save"
     Then the status messages should read "Saved qa Subtitle configuration."
      And I should see "field_qa_subtitle" in the "qa Subtitle" row
     When I go to "/admin/structure/types/manage/page/fields"
      And I click "Re-use an existing field"
      And I wait for ".ui-dialog table" to appear
      And I click on the element ".ui-dialog tr:has-text('field_qa_subtitle') input[type='submit'], .ui-dialog tr:has-text('field_qa_subtitle') button"
      And I wait until the page is loaded
     Then the current path should end with "/admin/structure/types/manage/page/fields/node.page.field_qa_subtitle"
     When I press the button "Save settings"
     Then the status messages should read "Saved qa Subtitle configuration."
     When I click the operation "Delete" in the "qa Subtitle" row
      And I wait for ".ui-dialog, form[class*='delete']" to appear
      And I press the button "Delete"
     Then the status messages should read "The field qa Subtitle has been deleted from the"
     When I go to "/admin/structure/types/manage/qa_article/fields"
      And I click the operation "Delete" in the "qa Subtitle" row
      And I wait for ".ui-dialog, form[class*='delete']" to appear
      And I press the button "Delete"
     Then the status messages should read "The field qa Subtitle has been deleted from the qa-Article content type."
      And no error should have been logged

  Scenario: Change the form display with the widget settings and the row weights
    Given the article content type "qa_article" exists
      And I am logged in as the Drupal administrator
     When I go to "/admin/structure/types/manage/qa_article/form-display"
      And I press "field_qa_tags_settings_edit" by "name" attr
      And I wait for "input[name='fields[field_qa_tags][settings_edit_form][settings][placeholder]']" to appear
      And I fill in "fields[field_qa_tags][settings_edit_form][settings][placeholder]" with "qa tags placeholder"
      And I press the button "Update"
      And I wait for "input[name='fields[field_qa_tags][settings_edit_form][settings][placeholder]']" to disappear
     Then I should see "qa tags placeholder" in the "Tags" row
      And I should see "You have unsaved changes."
     When I press the button "Show row weights"
      And I select "hidden" from "fields[field_qa_image][region]"
      And I press the button "Save"
     Then the status messages should read "Your settings have been saved."
     When I reload the page
     Then the element "select[name='fields[field_qa_image][region]']" should have the value "hidden"
     When I press the button "Hide row weights"
      And I go to "/node/add/qa_article"
     Then the element "input[name='field_qa_tags[target_id]'][placeholder='qa tags placeholder']" should exist
      And the element "input[name='files[field_qa_image_0]']" should not exist
      And no error should have been logged

  Scenario: Change the manage display with the formatter settings
    Given the module "layout_builder" is installed
      And the article content type "qa_article" exists
      And I am logged in as the Drupal administrator
     When I go to "/admin/structure/types/manage/qa_article/display/default"
     Then the element "#edit-layout" should be visible
      And the element "input[name='layout[enabled]']" should exist
     When I select "inline" from "fields[field_qa_image][label]"
      And I press "field_qa_image_settings_edit" by "name" attr
      And I wait for "select[name='fields[field_qa_image][settings_edit_form][settings][image_style]']" to appear
      And I select "large" from "fields[field_qa_image][settings_edit_form][settings][image_style]"
      And I press the button "Update"
      And I wait for "select[name='fields[field_qa_image][settings_edit_form][settings][image_style]']" to disappear
     Then I should see "Image style: Large" in the "Image" row
     When I press the button "Save"
     Then the status messages should read "Your settings have been saved."
     When I reload the page
     Then the element "select[name='fields[field_qa_image][label]']" should have the value "inline"
      And no error should have been logged

  Scenario: Add a menu, add links, disable one and delete them
    Given the "page" content item "qa-About node" exists
      And I am logged in as the Drupal administrator
     When I go to "/admin/structure/menu"
      And I click on the element "a[href$='/admin/structure/menu/add']"
      And I wait until the page is loaded
      And I fill in "Title" with "qa-UIkit menu"
     Then the element "#edit-id" should have the value "qa-uikit-menu"
     When I press the button "Save"
     Then the status messages should read "Menu qa-UIkit menu has been added."
     When I go to "/admin/structure/menu/manage/main"
      And I click on the element "a[href*='/admin/structure/menu/manage/main/add']"
      And I wait until the page is loaded
      And I fill in "Menu link title" with "qa-Parent"
      And I fill in "link[0][uri]" with "<front>"
      And I check "Show as expanded"
      And I press the button "Save"
     Then the status messages should read "The menu link has been saved."
     When I go to "/admin/structure/menu/manage/main/add"
      And I fill in "Menu link title" with "qa-About"
      And I pick "qa-About node" from the autocomplete "#edit-link-0-uri"
      And I fill in "Description" with "qa about description"
      And I select "-- qa-Parent" from "menu_parent"
      And I press the button "Save"
     Then the status messages should read "The menu link has been saved."
     When I go to "/admin/structure/menu/manage/main"
     Then the element "tr.draggable:has-text('qa-About') .js-indentation" should exist
     When I unselect the row "qa-About"
      And I press the button "Save"
     Then the status messages should read "Menu Main navigation has been updated."
      And I should see "qa-About (disabled)"
     When I click the operation "Delete" in the "qa-About" row
      And I wait for ".ui-dialog, form[class*='delete']" to appear
      And I press the button "Delete"
     Then the status messages should read "The menu link qa-About has been deleted."
     When I click the operation "Delete" in the "qa-Parent" row
      And I wait for ".ui-dialog, form[class*='delete']" to appear
      And I press the button "Delete"
     Then the status messages should read "The menu link qa-Parent has been deleted."
     When I go to "/admin/structure/menu"
      And I click the operation "Delete" in the "qa-UIkit menu" row
      And I wait for ".ui-dialog, form[class*='delete']" to appear
      And I press the button "Delete"
     Then the status messages should read "The menu qa-UIkit menu has been deleted."
      And no error should have been logged

  Scenario: Add a vocabulary and terms, nest them and delete them
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/taxonomy"
      And I click on the element "a[href$='/admin/structure/taxonomy/add']"
      And I wait until the page is loaded
      And I fill in "Name" with "qa-Topics"
     Then the element "#edit-vid" should have the value "qa_topics"
     When I fill in "Description" with "qa topics"
      And I press the button "Save"
     Then the status messages should read "Created new vocabulary qa-Topics."
     When I go to "/admin/structure/taxonomy/manage/qa_topics/add"
      And I fill in "Name" with "qa-Design"
      And I type "About design." in the rich text editor "#edit-description-0-value"
      And I click on the element "#edit-relations summary"
      And I click on the element ".vertical-tabs__menu-item a[href^='#edit-path']"
      And I fill in "path[0][alias]" with "/qa-design"
      And I press the button "Save"
     Then the status messages should read "Created new term qa-Design."
     When I fill in "Name" with "qa-Docs"
      And I press the button "Save"
     Then the status messages should read "Created new term qa-Docs."
     When I go to "/admin/structure/taxonomy/manage/qa_topics/overview"
      And I drag the row "qa-Docs" 60 pixels to the right
     Then I should see "You have unsaved changes."
     When I press the button "Save"
     Then the status messages should read "The configuration options have been saved."
      And the element "tr.draggable:has-text('qa-Docs') .js-indentation" should exist
     When I press the button "Reset to alphabetical"
      And I wait until the page is loaded
     Then I should see "Are you sure you want to reset the vocabulary qa-Topics to alphabetical order?"
     When I press the button "Reset to alphabetical"
     Then the status messages should read "Reset vocabulary qa-Topics to alphabetical order."
     When I click the operation "Edit" in the "qa-Design" row
      And I wait until the page is loaded
      And I press the button "Save"
     Then the status messages should read "Updated term qa-Design."
     When I go to "/admin/structure/taxonomy/manage/qa_topics/overview"
      And I click the operation "Delete" in the "qa-Docs" row
      And I wait for ".ui-dialog, form[class*='delete']" to appear
      And I press the button "Delete"
     Then the status messages should read "Deleted term qa-Docs."
     When I go to "/admin/structure/taxonomy"
      And I click the operation "Delete" in the "qa-Topics" row
      And I wait for ".ui-dialog, form[class*='delete']" to appear
      And I press the button "Delete"
     Then the status messages should read "Deleted vocabulary qa-Topics."
      And no error should have been logged

  Scenario: Add and delete a view mode and a form mode
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/display-modes/view"
      And I click on the element "a[href$='/admin/structure/display-modes/view/add']"
      And I wait for ".ui-dialog a[href$='/admin/structure/display-modes/view/add/node']" to appear
      And I click on the element ".ui-dialog a[href$='/admin/structure/display-modes/view/add/node']"
      And I wait for "input[name='label']" to appear
      And I fill in "label" with "qa-Card"
     Then the element "input[name='id']" should have the value "qa_card"
     When I press the button "Save"
     Then the status messages should read "Saved the qa-Card view mode."
     When I click the operation "Delete" in the "qa-Card" row
      And I wait for ".ui-dialog, form[class*='delete']" to appear
      And I press the button "Delete"
     Then the status messages should read "The view mode qa-Card has been deleted."
     When I go to "/admin/structure/display-modes/form"
      And I click on the element "a[href$='/admin/structure/display-modes/form/add']"
      And I wait for ".ui-dialog a[href$='/admin/structure/display-modes/form/add/node']" to appear
      And I click on the element ".ui-dialog a[href$='/admin/structure/display-modes/form/add/node']"
      And I wait for "input[name='label']" to appear
      And I fill in "label" with "qa-Compact"
     Then the element "input[name='id']" should have the value "qa_compact"
     When I press the button "Save"
     Then the status messages should read "Saved the qa-Compact form mode."
     When I click the operation "Delete" in the "qa-Compact" row
      And I wait for ".ui-dialog, form[class*='delete']" to appear
      And I press the button "Delete"
     Then the status messages should read "The form mode qa-Compact has been deleted."
      And no error should have been logged
