@watchdog @cleanup
Feature: Content
  As a site administrator
  I want to create, edit, revise and delete content with UIkit Admin
  So that every content screen of the back office keeps working

  Scenario: A content type gets an image and tags through Field UI
    Given I am logged in as the Drupal administrator
     When I go to "/admin/structure/types/add"
      And I fill in "Name" with "qa-Fields"
     Then the element "#edit-type" should have the value "qa_fields"
      And the element "#edit-type" should be hidden
     When I click on the element ".vertical-tabs__menu-item a[href='#edit-workflow']"
     Then the element "#edit-workflow" should be visible
     When I press the button "Save and manage fields"
     Then the status messages should read "The content type qa-Fields has been added."
      And the current path should end with "/admin/structure/types/manage/qa_fields/fields"
     When I click "Create a new field"
      And I wait for ".ui-dialog a.field-option" to appear
      And I click on the element ".ui-dialog a.field-option[href*='/file_upload/']"
      And I wait for ".ui-dialog input[name='label']" to appear
      And I fill in the element ".ui-dialog input[name='label']" with "qa Photo"
     Then the element ".ui-dialog input[name='field_name']" should have the value "qa_photo"
     When I click on the element ".ui-dialog input[name='field_options_wrapper'][value='image']"
      And I press the button "Continue"
      And I wait for ".ui-dialog input[name='settings[alt_field_required]']" to appear
      And I press the button "Save"
     Then the status messages should read "Saved qa Photo configuration."
     When I click "Create a new field"
      And I wait for ".ui-dialog a.field-option" to appear
      And I click on the element ".ui-dialog a.field-option[href*='/reference/']"
      And I wait for ".ui-dialog input[name='label']" to appear
      And I fill in the element ".ui-dialog input[name='label']" with "qa Topics"
     Then the element ".ui-dialog input[name='field_name']" should have the value "qa_topics"
     When I click on the element ".ui-dialog input[name='field_options_wrapper'][value='field_ui:entity_reference:taxonomy_term']"
      And I press the button "Continue"
      And I wait for ".ui-dialog input[name='settings[handler_settings][target_bundles][tags]']" to appear
      And I select "-1" from "field_storage[subform][cardinality]"
     Then the element ".ui-dialog select[name='field_storage[subform][cardinality]']" should be visible
      And the element ".ui-dialog input[name='field_storage[subform][cardinality_number]']" should be hidden
     When I check ".ui-dialog input[name='settings[handler_settings][target_bundles][tags]']"
      And I wait for AJAX to finish
      And I check ".ui-dialog input[name='settings[handler_settings][auto_create]']"
      And I press the button "Save"
     Then the status messages should read "Saved qa Topics configuration."
      And I should see "field_qa_topics" in the "qa Topics" row
     When I go to "/admin/structure/types/manage/qa_fields/form-display"
      And I select "entity_reference_autocomplete_tags" from "fields[field_qa_topics][type]"
      And I wait for AJAX to finish
      And I press the button "Save"
     Then the status messages should read "Your settings have been saved."
     When I go to "/admin/structure/types/manage/qa_fields/delete"
      And I press the button "Delete"
     Then the status messages should read "The content type qa-Fields has been deleted."
      And no error should have been logged

  Scenario: Add a basic page with CKEditor 5, a menu link, an alias and an author
    Given the user "qa-author" exists
      And I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I click on the element ".uikit-admin-actions a[href$='/node/add'], a[href$='/node/add']"
      And I wait until the URL contains "/node/add"
      And I go to "/node/add/page"
      And I fill in "Title" with "qa-UIkit page one"
      And I press the rich text editor button "Paragraph"
      And I press the rich text editor button "Heading 2"
      And I type "qa heading" in the rich text editor "#edit-body-0-value"
      And I press the key "Enter"
      And I type "Plain words and " in the rich text editor "#edit-body-0-value"
      And I press the rich text editor button "Bold"
      And I type "bold words" on the keyboard
      And I press the rich text editor button "Bold"
      And I press the key "Enter"
      And I press the rich text editor button "Bulleted List"
      And I type "first item" on the keyboard
      And I press the key "Enter"
      And I press the rich text editor button "Link"
      And I link the selection in the rich text editor to "https://www.drupal.org"
     Then the rich text editor "#edit-body-0-value" should contain "<h2>qa heading</h2>"
      And the rich text editor "#edit-body-0-value" should contain "<strong>bold words</strong>"
      And the rich text editor "#edit-body-0-value" should contain "first item</li>"
      And the rich text editor "#edit-body-0-value" should contain "https://www.drupal.org"
     When I fill in "#edit-revision-log-0-value" with "qa first revision" by attr
      And I click on the element "#edit-menu summary"
      And I check "Provide a menu link"
     Then the element "#edit-menu-title" should have the value "qa-UIkit page one"
     When I click on the element "#edit-path-0 summary"
      And I fill in "#edit-path-0-alias" with "/qa-uikit-page-one" by attr
     Then "#edit-path-0 summary" should contain text "/qa-uikit-page-one"
     When I click on the element "#edit-author summary"
      And I pick "qa-author" from the autocomplete "#edit-uid-0-target-id"
      And I press the button "Save"
     Then the status messages should read "qa-UIkit page one has been created."
      And the current path should end with "/qa-uikit-page-one"
      And I should see "qa heading"
      And the element "a[href='https://www.drupal.org']" should exist
     When I go to "/admin/content"
     Then I should see "qa-author" in the "qa-UIkit page one" row
      And no error should have been logged

  Scenario: Add an article with an image, a summary, tags and a preview
    Given the article content type "qa_article" exists
      And I am logged in as the Drupal administrator
     When I go to "/node/add/qa_article"
      And I fill in "Title" with "qa-UIkit article"
      And I type "The body of the article." in the rich text editor "#edit-body-0-value"
      And I press the button "Edit summary"
      And I fill in "#edit-body-0-summary" with "qa summary" by attr
      And I attach the fixture "qa-image.png" to "input[name='files[field_qa_image_0]']"
      And I wait for "input[name='field_qa_image[0][alt]']" to appear
     Then the element "input[name='field_qa_image_0_remove_button']" should be visible
     When I fill in "field_qa_image[0][alt]" with "qa alternative text"
      And I fill in "field_qa_tags[target_id]" with "qa-drupal, qa-uikit"
      And I click on the element "#edit-options summary"
      And I check "Promoted to front page"
      And I check "Sticky at top of lists"
     Then "#edit-options summary" should contain text "Sticky at top of lists"
     When I press the button "Preview"
     Then I should see "Back to content editing"
      And the element "select[name='view_mode']" should exist
     When I follow "Back to content editing"
     Then the element "#edit-title-0-value" should have the value "qa-UIkit article"
      And the element "input[name='field_qa_image[0][alt]']" should have the value "qa alternative text"
     When I press the button "Save"
     Then the status messages should read "qa-UIkit article has been created."
      And the element "img[alt='qa alternative text']" should exist
      And the link "qa-uikit" with the href "/taxonomy/term/" should exist
      And no error should have been logged

  Scenario: Edit content, revert a revision and delete one
    Given the "page" content item "qa-UIkit revisions" exists
      And I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I fill in "Title" with "qa-UIkit revisions"
      And I click on the element "#edit-submit-content"
      And I click the operation "Edit" in the "qa-UIkit revisions" row
      And I wait until the page is loaded
      And I fill in "Title" with "qa-UIkit revisions v2"
      And I fill in "#edit-revision-log-0-value" with "qa second revision" by attr
      And I press the button "Save"
     Then the status messages should read "qa-UIkit revisions v2 has been updated."
     When I click the operation "Edit" in the "qa-UIkit revisions v2" row
      And I wait until the page is loaded
      And I click on the element ".uikit-admin-tabs a[href$='/revisions']"
      And I wait until the page is loaded
     Then I should see "qa second revision"
      And I should see "Current revision"
     When I click "Revert"
      And I wait until the page is loaded
     Then I should see "Are you sure you want to revert to the revision from"
     When I press the button "Revert"
     Then the status messages should read "has been reverted to the revision from"
     When I click the operation "Delete" in the "qa second revision" row
      And I wait for ".ui-dialog, form.node-revision-delete-confirm" to appear
      And I press the button "Delete"
     Then the status messages should read "has been deleted."
      And I should not see "qa second revision"
      And no error should have been logged

  Scenario: Delete a content item from its dialog
    Given the "page" content item "qa-UIkit delete me" exists
      And I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I fill in "Title" with "qa-UIkit delete me"
      And I click on the element "#edit-submit-content"
      And I click the operation "Delete" in the "qa-UIkit delete me" row
      And I wait for ".ui-dialog" to appear
     Then I should see "Are you sure you want to delete the content item qa-UIkit delete me?"
      And I should see "This action cannot be undone."
     When I press the button "Delete"
     Then the status messages should read "qa-UIkit delete me has been deleted."
      And I should not see "qa-UIkit delete me" in the "table" element
      And no error should have been logged

  Scenario: Filter, sort and empty the content overview
    Given the "page" content item "qa-filter alpha" exists
      And the "page" content item "qa-filter beta" exists
      And the unpublished "page" content item "qa-filter draft" exists
      And the "page" content item "qa-other item" exists
      And I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I fill in "Title" with "qa-filter"
      And I select "Published" from "status"
      And I click on the element "#edit-submit-content"
     Then I should see "qa-filter alpha"
      And I should see "qa-filter beta"
      And I should not see "qa-filter draft"
      And I should not see "qa-other item"
     When I click on the element "th a[href*='order=title']"
      And I wait until the URL contains "order=title"
     Then the element "th[aria-sort]" should exist
      And the page should not carry the HTMX page state
     When I fill in "Title" with "qa-filter nothing"
      And I click on the element "#edit-submit-content"
     Then I should see "No content available."
     When I press the button "Reset"
      And I wait until the page is loaded
     Then the field "title" should be empty
      And there should be no JavaScript errors
      And no error should have been logged

  Scenario: Run the bulk actions of the content overview
    Given the "page" content item "qa-bulk one" exists
      And the "page" content item "qa-bulk two" exists
      And I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I press the button "Apply to selected items"
     Then the status messages should read "No content selected."
     When I fill in "Title" with "qa-bulk"
      And I click on the element "#edit-submit-content"
      And I select the row "qa-bulk one"
      And I select the row "qa-bulk two"
      And I select "Unpublish content" from "action"
      And I press the button "Apply to selected items"
     Then the status messages should read "Unpublish content was applied to 2 items."
      And I should see "Unpublished" in the "qa-bulk one" row
      And the page should have its styles and its scripts
      And the page should not carry the HTMX page state
     When I select the row "qa-bulk one"
      And I select the row "qa-bulk two"
      And I select "Publish content" from "action"
      And I press the button "Apply to selected items"
     Then the status messages should read "Publish content was applied to 2 items."
     When I select the row "qa-bulk one"
      And I select "Make content sticky" from "action"
      And I press the button "Apply to selected items"
     Then the status messages should read "Make content sticky was applied to 1 item."
     When I select the row "qa-bulk one"
      And I select "Promote content to front page" from "action"
      And I press the button "Apply to selected items"
     Then the status messages should read "Promote content to front page was applied to 1 item."
     When I select the row "qa-bulk two"
      And I select "Save content" from "action"
      And I press the button "Apply to selected items"
     Then the status messages should read "Save content was applied to 1 item."
     When I select the row "qa-bulk one"
      And I select the row "qa-bulk two"
      And I select "Delete content" from "action"
      And I press the button "Apply to selected items"
     Then I should see "Are you sure you want to delete these content items?"
     When I press the button "Delete"
     Then the status messages should read "Deleted 2 content items."
      And no error should have been logged

  @comments
  Scenario: Post comments and moderate them in bulk
    Given the article content type "qa_article" exists
      And comments are open on the content type "qa_article"
      And the "qa_article" content item "qa-UIkit commented" exists
      And I am logged in as the Drupal administrator
     When I go to "/admin/content"
      And I fill in "Title" with "qa-UIkit commented"
      And I click on the element "#edit-submit-content"
      And I follow "qa-UIkit commented"
      And I wait until the page is loaded
      And I fill in "Subject" with "qa-first comment"
      And I type "A comment from the test." in the rich text editor "#edit-comment-body-0-value"
      And I press the button "Save"
     Then I should see "Your comment has been posted."
     When I go to "/admin/content/comment"
     Then the element "[class*='uikit-admin-tabs'] a[href$='/admin/content/comment/approval']" should exist
     When I select the row "qa-first comment"
      And I select "Unpublish comment" from "action"
      And I press the button "Apply to selected items"
     Then the status messages should read "Unpublish comment was applied to 1 item."
     When I click on the element "[class*='uikit-admin-tabs'] a[href$='/admin/content/comment/approval']"
      And I wait until the page is loaded
      And I select the row "qa-first comment"
      And I select "Publish comment" from "action"
      And I press the button "Apply to selected items"
     Then the status messages should read "Publish comment was applied to 1 item."
      And the page should have its styles and its scripts
     When I go to "/admin/content/comment"
      And I select the row "qa-first comment"
      And I select "Delete comment" from "action"
      And I press the button "Apply to selected items"
     Then I should see "Are you sure you want to delete this comment and all its children?"
     When I press the button "Delete"
     Then the status messages should read "Deleted 1 comment."
      And no error should have been logged
