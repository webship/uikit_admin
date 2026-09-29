<?php

declare(strict_types=1);

namespace Drupal\uikit_admin\Hook;

use Drupal\Core\Config\Config;
use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\uikit_admin\LinkButton;
use Drupal\uikit_admin\Skin;

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

  public function __construct(
    protected ThemeSettingsProvider $themeSettingsProvider,
  ) {}

  /**
   * Implements hook_element_info_alter().
   *
   * The links core draws as buttons get the UIkit button classes.
   */
  #[Hook('element_info_alter')]
  public function elementInfoAlter(array &$info): void {
    // Before the pre-render callback of core, which turns the link into its
    // markup.
    if (isset($info['link'])) {
      array_unshift($info['link']['#pre_render'], [LinkButton::class, 'preRenderLink']);
    }
  }

  /**
   * Implements hook_form_system_theme_settings_alter().
   */
  #[Hook('form_system_theme_settings_alter')]
  public function themeSettingsAlter(array &$form, FormStateInterface $form_state): void {
    // The hook runs for every theme settings form while this theme is the
    // administration theme: only the form of this theme gets its settings.
    if (($form['config_key']['#value'] ?? NULL) !== 'uikit_admin.settings') {
      return;
    }
    $form['uikit_admin'] = [
      '#type' => 'details',
      '#title' => $this->t('UIkit Admin'),
      '#open' => TRUE,
      '#weight' => -10,
    ];
    $form['uikit_admin']['htmx_navigation'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Navigate with HTMX'),
      '#description' => $this->t('Links, pagers, sorting and filters load only the page, and the rail and the top bar stay in place. Edit, add and delete forms and the screens with drag and drop keep full page loads.'),
      '#default_value' => (bool) ($this->themeSettingsProvider->getSetting('htmx_navigation', 'uikit_admin') ?? TRUE),
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
    // The accent and the focus color are design tokens: they are stored once,
    // in the keys of UI Skins, for the light and for the dark color mode.
    $stored = $this->themeSettingsProvider->getSetting(Skin::KEY, 'uikit_admin');
    $stored = \is_array($stored) ? $stored : [];
    $form['uikit_admin']['appearance']['uikit_admin_skin'] = [
      '#type' => 'container',
      '#tree' => TRUE,
    ];
    $form['uikit_admin']['appearance']['uikit_admin_skin']['accent'] = [
      '#type' => 'color',
      '#title' => $this->t('Accent color'),
      '#description' => $this->t('The color of the links, the primary buttons and the active states, in the light color mode. Pick a dark color: it carries white text and sits on a light page.'),
      '#default_value' => Skin::color($stored, 'accent'),
    ];
    $form['uikit_admin']['appearance']['uikit_admin_skin']['accent_dark'] = [
      '#type' => 'color',
      '#title' => $this->t('Accent color, dark mode'),
      '#description' => $this->t('The same color in the dark color mode. Pick a light color: it sits on a dark page.'),
      '#default_value' => Skin::color($stored, 'accent_dark'),
    ];
    $form['uikit_admin']['appearance']['uikit_admin_skin']['focus'] = [
      '#type' => 'color',
      '#title' => $this->t('Focus color'),
      '#description' => $this->t('The ring around the element the keyboard is on, in the light color mode.'),
      '#default_value' => Skin::color($stored, 'focus'),
    ];
    $form['uikit_admin']['appearance']['uikit_admin_skin']['focus_dark'] = [
      '#type' => 'color',
      '#title' => $this->t('Focus color, dark mode'),
      '#description' => $this->t('The same ring in the dark color mode.'),
      '#default_value' => Skin::color($stored, 'focus_dark'),
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
    // UI Skins offers the color modes of this theme as well: a second control
    // that the setting above would silently override. The setting above is
    // the one control, and it is stored for UI Skins too, so both agree. This
    // alter can run before the one of UI Skins (when another theme shows the
    // form): hide its control once the form is built, and add the submit
    // callbacks that store the colors.
    $form['#after_build'][] = [static::class, 'hideUiSkinsColorMode'];
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

    $form['uikit_admin']['sign_in'] = [
      '#type' => 'details',
      '#title' => $this->t('Sign-in screens'),
      '#description' => $this->t('The log in, password reset and registration screens. Drupal shows them in the default theme of the site: these settings apply only when the sign-in routes use this theme, because it is also the default theme or because a module marks those routes as administration routes. See the README of the theme.'),
      '#open' => TRUE,
    ];
    $form['uikit_admin']['sign_in']['sign_in_layout'] = [
      '#type' => 'radios',
      '#title' => $this->t('Layout'),
      '#default_value' => $this->themeSettingsProvider->getSetting('sign_in_layout', 'uikit_admin') ?? 'center',
      '#options' => [
        'center' => $this->t('Centered: the form alone, the site name above it'),
        'start' => $this->t('Start: the form at the start, the brand panel next to it'),
        'end' => $this->t('End: the brand panel first, the form at the end'),
        'top' => $this->t('Top: a brand band above the form'),
        'bottom' => $this->t('Bottom: a brand band under the form'),
        'spotlight' => $this->t('Spotlight: a frosted card floating over the accent color'),
      ],
    ];
    $form['uikit_admin']['sign_in']['sign_in_message'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Message'),
      '#description' => $this->t('A sentence shown with the site name, like "The back office of the site."'),
      '#maxlength' => 160,
      '#default_value' => $this->themeSettingsProvider->getSetting('sign_in_message', 'uikit_admin') ?? '',
    ];
  }

  /**
   * Submit callback: keeps the colors out of the settings core saves.
   *
   * Core saves every value of the form as a setting of the theme. The colors
   * belong in the keys of UI Skins, so they leave the values before core
   * saves, and are stored after it.
   */
  public static function skinBeforeSave(array &$form, FormStateInterface $form_state): void {
    $colors = $form_state->getValue('uikit_admin_skin');
    $form_state->set('uikit_admin_skin', \is_array($colors) ? $colors : []);
    $form_state->unsetValue('uikit_admin_skin');
  }

  /**
   * Submit callback: stores the colors and the color mode for UI Skins.
   *
   * The "Follow the operating system" mode clears the color mode: the
   * stylesheet follows the system when the root element has no data-theme.
   */
  public static function skinAfterSave(array &$form, FormStateInterface $form_state): void {
    $config = \Drupal::configFactory()->getEditable('uikit_admin.settings');
    Skin::store($config, $form_state->get('uikit_admin_skin') ?: []);
    static::syncUiSkinsColorMode($config);
  }

  /**
   * After build callback: one control for each value.
   *
   * Hides the color mode control of UI Skins, and stores the colors and the
   * color mode for UI Skins once the settings are saved. Both are done here,
   * once the form is built: the theme settings form calls the alter of the
   * theme it shows (when another theme shows the form) before the form alter
   * of UI Skins, and before it adds its own submit handler, which saves the
   * settings.
   */
  public static function hideUiSkinsColorMode(array $form, FormStateInterface $form_state): array {
    if (isset($form['third_party_settings']['ui_skins']['theme'])) {
      $form['third_party_settings']['ui_skins']['theme']['#access'] = FALSE;
    }
    $form['#submit'] ??= [];
    $before = [static::class, 'skinBeforeSave'];
    if (!\in_array($before, $form['#submit'], TRUE)) {
      \array_unshift($form['#submit'], $before);
    }
    $after = [static::class, 'skinAfterSave'];
    if (!\in_array($after, $form['#submit'], TRUE)) {
      $form['#submit'][] = $after;
    }
    return $form;
  }

  /**
   * Stores the color mode of the theme settings as the UI Skins theme.
   *
   * @param \Drupal\Core\Config\Config $config
   *   The editable settings of the theme.
   */
  public static function syncUiSkinsColorMode(Config $config): void {
    $mode = $config->get('color_mode') ?: 'auto';
    if (\in_array($mode, ['light', 'dark'], TRUE)) {
      $config->set('third_party_settings.ui_skins.theme', 'uikit_admin_' . $mode);
    }
    else {
      $config->clear('third_party_settings.ui_skins.theme');
    }
    $config->save();
  }

}
