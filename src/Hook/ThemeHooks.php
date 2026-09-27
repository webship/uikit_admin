<?php

declare(strict_types=1);

namespace Drupal\uikit_admin\Hook;

use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\StringTranslation\StringTranslationTrait;

/**
 * Library, theme settings and page hooks for UIkit Admin.
 */
class ThemeHooks {

  use StringTranslationTrait;

  /**
   * The UIkit version this theme is built against.
   */
  public const string UIKIT_VERSION = '3.25.22';

  /**
   * The ID of the offcanvas printing the "Offcanvas" region.
   */
  public const string OFFCANVAS_ID = 'uikit-admin-offcanvas';

  /**
   * The color of the links, the primary buttons and the active states.
   */
  public const string ACCENT_COLOR = '#0a5fa8';

  /**
   * The color of the ring around the element the keyboard is on.
   */
  public const string FOCUS_COLOR = '#1f7ad4';

  public function __construct(
    protected ThemeSettingsProvider $themeSettingsProvider,
  ) {}

  /**
   * Implements hook_library_info_alter().
   *
   * Serves the UIkit framework from web/libraries when the theme setting asks
   * for it, so a site may run without the CDN.
   */
  #[Hook('library_info_alter')]
  public function libraryInfoAlter(array &$libraries, string $extension): void {
    if ($extension !== 'uikit_admin') {
      return;
    }
    $source = $this->themeSettingsProvider->getSetting('uikit_source', 'uikit_admin');
    if ($source === 'local' && isset($libraries['uikit.local'])) {
      $libraries['uikit'] = $libraries['uikit.local'];
    }
  }

  /**
   * Implements hook_form_system_theme_settings_alter().
   */
  #[Hook('form_system_theme_settings_alter')]
  public function themeSettingsAlter(array &$form, FormStateInterface $form_state): void {
    $form['uikit_admin'] = [
      '#type' => 'details',
      '#title' => $this->t('UIkit Admin'),
      '#open' => TRUE,
      '#weight' => -10,
    ];
    $form['uikit_admin']['uikit_source'] = [
      '#type' => 'radios',
      '#title' => $this->t('UIkit source'),
      '#default_value' => $this->themeSettingsProvider->getSetting('uikit_source', 'uikit_admin') ?? 'cdn',
      '#options' => [
        'cdn' => $this->t('From the CDN (jsDelivr)'),
        'local' => $this->t('From web/libraries/uikit'),
      ],
      '#description' => $this->t('UIkit @version is the version this theme is built against.', [
        '@version' => self::UIKIT_VERSION,
      ]),
    ];
    $form['uikit_admin']['navbar_sticky'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Keep the navbar at the top of the screen'),
      '#default_value' => (bool) ($this->themeSettingsProvider->getSetting('navbar_sticky', 'uikit_admin') ?? TRUE),
    ];

    $form['uikit_admin']['appearance'] = [
      '#type' => 'details',
      '#title' => $this->t('Appearance'),
      '#open' => TRUE,
    ];
    $form['uikit_admin']['appearance']['accent_color'] = [
      '#type' => 'color',
      '#title' => $this->t('Accent color'),
      '#description' => $this->t('The color of the links, the primary buttons and the active states.'),
      '#default_value' => $this->themeSettingsProvider->getSetting('accent_color', 'uikit_admin') ?? self::ACCENT_COLOR,
    ];
    $form['uikit_admin']['appearance']['focus_color'] = [
      '#type' => 'color',
      '#title' => $this->t('Focus color'),
      '#description' => $this->t('The ring around the element the keyboard is on.'),
      '#default_value' => $this->themeSettingsProvider->getSetting('focus_color', 'uikit_admin') ?? self::FOCUS_COLOR,
    ];
    $form['uikit_admin']['appearance']['color_mode'] = [
      '#type' => 'radios',
      '#title' => $this->t('Color mode'),
      '#default_value' => $this->themeSettingsProvider->getSetting('color_mode', 'uikit_admin') ?? 'auto',
      '#options' => [
        'auto' => $this->t('Follow the operating system'),
        'light' => $this->t('Light'),
        'dark' => $this->t('Dark'),
      ],
    ];
    $form['uikit_admin']['appearance']['density'] = [
      '#type' => 'radios',
      '#title' => $this->t('Density'),
      '#description' => $this->t('How much room the rows, the panels and the fields take.'),
      '#default_value' => $this->themeSettingsProvider->getSetting('density', 'uikit_admin') ?? 'comfortable',
      '#options' => [
        'comfortable' => $this->t('Comfortable'),
        'compact' => $this->t('Compact'),
      ],
    ];
    $form['uikit_admin']['appearance']['sticky_actions'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Keep the buttons of a form in reach'),
      '#description' => $this->t('The Save row stays at the bottom of the screen while the form scrolls.'),
      '#default_value' => (bool) ($this->themeSettingsProvider->getSetting('sticky_actions', 'uikit_admin') ?? TRUE),
    ];
    $form['uikit_admin']['appearance']['edit_form_sidebar'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Put the meta of a content form in a sidebar'),
      '#description' => $this->t('Authoring information, the revision log and the other advanced groups move next to the form.'),
      '#default_value' => (bool) ($this->themeSettingsProvider->getSetting('edit_form_sidebar', 'uikit_admin') ?? TRUE),
    ];
  }

}
