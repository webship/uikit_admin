<?php

/**
 * @file
 * Post update functions for UIkit Admin.
 */

declare(strict_types=1);

use Drupal\uikit_admin\Hook\ThemeHooks;
use Drupal\uikit_admin\Skin;

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

/**
 * Make the color mode of the theme settings the one color mode control.
 *
 * A color mode picked in UI Skins becomes the color mode of the theme
 * settings, and the state colors saved in UI Skins move to their new ids.
 */
function uikit_admin_post_update_one_color_mode_control(): void {
  $config = \Drupal::configFactory()->getEditable('uikit_admin.settings');
  if ($config->isNew()) {
    return;
  }
  $theme = (string) $config->get('third_party_settings.ui_skins.theme');
  if (($config->get('color_mode') ?: 'auto') === 'auto' && \in_array($theme, ['uikit_admin_light', 'uikit_admin_dark'], TRUE)) {
    $config->set('color_mode', \substr($theme, \strlen('uikit_admin_')));
  }
  // The state colors of UI Skins carry the theme name now: the front theme
  // of the site declares the UIkit names too.
  $variables = $config->get('third_party_settings.ui_skins.css_variables');
  if (\is_array($variables)) {
    foreach (['success', 'warning', 'danger'] as $state) {
      if (isset($variables["uk-global-$state-background"])) {
        $variables["uikit-admin-$state"] ??= $variables["uk-global-$state-background"];
        unset($variables["uk-global-$state-background"]);
      }
    }
    $config->set('third_party_settings.ui_skins.css_variables', $variables);
  }
  ThemeHooks::syncUiSkinsColorMode($config);
}

/**
 * Give the theme settings a language code.
 *
 * The sign-in message is a translatable value: without a language code, the
 * theme settings form refuses to save once another form element (like the
 * ones of UI Skins) targets these settings.
 */
function uikit_admin_post_update_settings_langcode(): void {
  $config = \Drupal::configFactory()->getEditable('uikit_admin.settings');
  if (!$config->isNew() && !$config->get('langcode')) {
    $config->set('langcode', \Drupal::languageManager()->getDefaultLanguage()->getId())->save();
  }
}

/**
 * Move the accent and the focus color to the keys of UI Skins.
 *
 * The colors are stored once, in the keys UI Skins reads. A color of the
 * theme settings becomes the color of the light color mode: the dark color
 * mode keeps its own accent, which reads on a dark page.
 */
function uikit_admin_post_update_accent_to_ui_skins(): void {
  $config = \Drupal::configFactory()->getEditable('uikit_admin.settings');
  if ($config->isNew()) {
    return;
  }
  $colors = [];
  // The accent of the releases before 4.0.1 was never a choice.
  $accent = (string) $config->get('accent_color');
  if ($accent !== '' && \strcasecmp($accent, '#0a5fa8') !== 0) {
    $colors['accent'] = $accent;
  }
  $focus = (string) $config->get('focus_color');
  if ($focus !== '') {
    $colors['focus'] = $focus;
  }
  // A color saved in UI Skins wins: it is the one the screens showed last.
  $stored = $config->get(Skin::KEY);
  foreach (['accent' => 'uikit-admin-accent', 'focus' => 'uikit-admin-focus'] as $control => $variable) {
    if (isset($stored[$variable][Skin::LIGHT])) {
      unset($colors[$control]);
    }
  }
  Skin::store($config, $colors);
  $config->clear('accent_color')->clear('focus_color')->save();
}

/**
 * Set the font of the theme on the sites that had none.
 */
function uikit_admin_post_update_font_family(): void {
  $config = \Drupal::configFactory()->getEditable('uikit_admin.settings');
  if (!$config->isNew() && !$config->get('font_family')) {
    $config->set('font_family', 'atkinson')->save();
  }
}

/**
 * Set the new options of the sign-in screens on existing sites.
 */
function uikit_admin_post_update_sign_in_options(): void {
  $config = \Drupal::configFactory()->getEditable('uikit_admin.settings');
  if ($config->isNew()) {
    return;
  }
  $defaults = [
    'sign_in_header' => FALSE,
    'sign_in_footer' => FALSE,
    'sign_in_logo' => 'site',
    'sign_in_image' => '',
    'sign_in_image_credit' => '',
    'sign_in_help' => '',
    'sign_in_page_layout' => '',
  ];
  foreach ($defaults as $key => $value) {
    if ($config->get($key) === NULL) {
      $config->set($key, $value);
    }
  }
  $config->save();
}

/**
 * Keep the logo and the site name on the sign-in screens of existing sites.
 */
function uikit_admin_post_update_sign_in_brand(): void {
  $config = \Drupal::configFactory()->getEditable('uikit_admin.settings');
  if (!$config->isNew() && $config->get('sign_in_brand') === NULL) {
    $config->set('sign_in_brand', 'logo_name')->save();
  }
}
