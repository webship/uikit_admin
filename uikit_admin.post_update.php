<?php

/**
 * @file
 * Post update functions for UIkit Admin.
 */

declare(strict_types=1);

/**
 * Move the status messages out of the top bar, into their own region.
 */
function uikit_admin_post_update_move_messages_block(): void {
  if (!\Drupal::moduleHandler()->moduleExists('block')) {
    return;
  }
  $blocks = \Drupal::entityTypeManager()->getStorage('block')->loadByProperties([
    'theme' => 'uikit_admin',
    'plugin' => 'system_messages_block',
    'region' => 'highlighted',
  ]);
  foreach ($blocks as $block) {
    $block->setRegion('messages')->save();
  }
}

/**
 * Store the theme settings with the types of their new schema.
 */
function uikit_admin_post_update_settings_schema_types(): void {
  $config = \Drupal::configFactory()->getEditable('uikit_admin.settings');
  if (!$config->isNew()) {
    // Saving casts every value to the type its schema declares.
    $config->save();
  }
}

/**
 * Move the stored default accent color to its WCAG AAA value.
 */
function uikit_admin_post_update_accent_color_aaa(): void {
  $config = \Drupal::configFactory()->getEditable('uikit_admin.settings');
  if (strcasecmp((string) $config->get('accent_color'), '#0a5fa8') === 0) {
    $config->set('accent_color', '#08508a')->save();
  }
}

/**
 * Rename the UI Skins color mode stored for UIkit Admin.
 *
 * The color modes now carry the theme name, so they no longer replace the
 * ones of UI Suite UIkit.
 */
function uikit_admin_post_update_ui_skins_color_mode_ids(): void {
  $config = \Drupal::configFactory()->getEditable('uikit_admin.settings');
  $theme = $config->get('third_party_settings.ui_skins.theme');
  if (\in_array($theme, ['light', 'dark'], TRUE)) {
    $config->set('third_party_settings.ui_skins.theme', 'uikit_admin_' . $theme)->save();
  }
}
