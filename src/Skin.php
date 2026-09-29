<?php

declare(strict_types=1);

namespace Drupal\uikit_admin;

use Drupal\Core\Config\Config;

/**
 * The design tokens a site changed, as UI Skins stores them.
 *
 * The values live once, in the UI Skins keys of the theme settings
 * (third_party_settings.ui_skins.css_variables): the theme settings form, the
 * UI Skins form and a recipe all write the same keys. UI Skins prints them
 * when it is installed; the theme prints them itself when it is not.
 */
class Skin {

  /**
   * The key of the stored values in the settings of the theme.
   */
  public const string KEY = 'third_party_settings.ui_skins.css_variables';

  /**
   * The scope of the light color mode, and of every value without a mode.
   */
  public const string LIGHT = ':root';

  /**
   * The scope of the dark color mode.
   */
  public const string DARK = ':root[data-theme="dark"]';

  /**
   * The colors of the theme settings form: variable, scope and default.
   */
  public const array COLORS = [
    'accent' => ['uikit-admin-accent', self::LIGHT, '#08508a'],
    'accent_dark' => ['uikit-admin-accent', self::DARK, '#8cbcff'],
    'focus' => ['uikit-admin-focus', self::LIGHT, '#1f7ad4'],
    'focus_dark' => ['uikit-admin-focus', self::DARK, '#8cbcff'],
  ];

  /**
   * The color of a control of the theme settings form.
   *
   * @param array $variables
   *   The stored values, keyed by variable and by scope.
   * @param string $control
   *   A key of self::COLORS.
   *
   * @return string
   *   The stored color, or the default of the theme.
   */
  public static function color(array $variables, string $control): string {
    [$variable, $scope, $default] = self::COLORS[$control];
    $value = $variables[$variable][$scope] ?? NULL;
    return \is_string($value) && \preg_match('/^#[0-9a-fA-F]{6}$/', $value) ? \strtolower($value) : $default;
  }

  /**
   * Stores the colors of the theme settings form.
   *
   * A default is not stored: the stylesheet carries it.
   *
   * @param \Drupal\Core\Config\Config $config
   *   The editable settings of the theme. The caller saves them.
   * @param array $colors
   *   The colors, keyed like self::COLORS.
   */
  public static function store(Config $config, array $colors): void {
    $variables = $config->get(self::KEY);
    $variables = \is_array($variables) ? $variables : [];
    foreach (self::COLORS as $control => [$variable, $scope, $default]) {
      $value = $colors[$control] ?? NULL;
      if (!\is_string($value) || !\preg_match('/^#[0-9a-fA-F]{6}$/', $value)) {
        continue;
      }
      if (\strcasecmp($value, $default) === 0) {
        unset($variables[$variable][$scope]);
      }
      else {
        $variables[$variable][$scope] = \strtolower($value);
      }
    }
    $variables = \array_filter($variables);
    if ($variables) {
      $config->set(self::KEY, $variables);
    }
    else {
      $config->clear(self::KEY);
    }
  }

  /**
   * The style sheet that applies the stored values.
   *
   * @param array $variables
   *   The stored values, keyed by variable and by scope.
   * @param bool $every_scope
   *   TRUE to print every scope, when UI Skins is not there to do it. FALSE
   *   to print only what UI Skins cannot: the values of the dark color mode
   *   for a person whose system asks for it.
   *
   * @return string
   *   The CSS, or an empty string when nothing is stored.
   */
  public static function css(array $variables, bool $every_scope): string {
    $scopes = [];
    foreach ($variables as $id => $values) {
      $name = '--' . \strtr((string) $id, ['_' => '-']);
      if (!\is_array($values) || !\preg_match('/^--[a-zA-Z0-9-]+$/', $name)) {
        continue;
      }
      foreach ($values as $scope => $value) {
        // The scopes of UI Skins keep a percent sign in place of a dot.
        $scope = \str_replace('%', '.', (string) $scope);
        if (!\is_scalar($value) || !self::safe($scope) || !self::safe((string) $value)) {
          continue;
        }
        $scopes[$scope][] = $name . ':' . $value . ';';
      }
    }
    $css = '';
    if ($every_scope) {
      foreach ($scopes as $scope => $declarations) {
        $css .= $scope . '{' . \implode('', $declarations) . '}';
      }
    }
    // The stylesheet follows the system when the root element has no
    // data-theme: the values of the dark mode follow it too.
    if (!empty($scopes[self::DARK])) {
      $css .= '@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){' . \implode('', $scopes[self::DARK]) . '}}';
    }
    return $css;
  }

  /**
   * Tells if a scope or a value can be printed in a style element.
   */
  protected static function safe(string $text): bool {
    return $text !== '' && !\preg_match('/[<>{};\\\\]/', $text);
  }

}
