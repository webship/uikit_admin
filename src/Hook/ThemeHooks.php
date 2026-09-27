<?php

declare(strict_types=1);

namespace Drupal\uikit_admin\Hook;

use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\uikit_admin\LinkButton;

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

    $form['uikit_admin']['sign_in'] = [
      '#type' => 'details',
      '#title' => $this->t('Sign-in screens'),
      '#description' => $this->t('The log in, password reset and registration screens, when this theme shows them.'),
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

}
