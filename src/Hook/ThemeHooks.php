<?php

declare(strict_types=1);

namespace Drupal\uikit_admin\Hook;

use Drupal\Component\Utility\Html;
use Drupal\Core\Config\Config;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\Render\Markup;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\Core\Url;
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
    protected EntityTypeManagerInterface $entityTypeManager,
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
    $setting = fn (string $name) => $this->themeSettingsProvider->getSetting($name, 'uikit_admin');
    $form['#attributes']['class'][] = 'uikit-admin-settings';
    $form['#attached']['library'][] = 'uikit_admin/settings';

    // The sections of the page, each one a panel with a short introduction.
    $sections = [
      'appearance' => [
        $this->t('Appearance'),
        $this->t('The color mode, the colors and the room the screens take.'),
      ],
      'typography' => [
        $this->t('Typography'),
        $this->t('The font of the text, the titles and the code.'),
      ],
      'navigation' => [
        $this->t('Navigation'),
        $this->t('How pages load, and where the bar stays.'),
      ],
      'editing' => [
        $this->t('Editing'),
        $this->t('How the content forms are laid out.'),
      ],
      'sign_in' => [
        $this->t('Sign-in screens'),
        $this->t('The log in, registration and password screens. They use these settings only when the sign-in routes show in this theme: when it is also the default theme, or when a module such as Web Admin shows them in it. See the README of the theme.'),
      ],
      'accessibility' => [
        $this->t('Accessibility'),
        $this->t('The theme keeps WCAG 2.2 AAA: text at 7:1, targets of 44 pixels, a solid focus ring, and no motion when the system asks for less. The ring can take the color of the brand.'),
      ],
      'advanced' => [
        $this->t('Advanced'),
        $this->t('Every color, size and shape of the screens is a design token.'),
      ],
    ];
    $weight = -20;
    foreach ($sections as $key => [$title, $intro]) {
      $form['uikit_admin_' . $key] = [
        '#type' => 'details',
        '#title' => $title,
        '#open' => TRUE,
        '#weight' => $weight++,
        '#attributes' => ['class' => ['uikit-admin-settings__section']],
        'intro' => [
          '#type' => 'html_tag',
          '#tag' => 'p',
          '#value' => $intro,
          '#attributes' => ['class' => ['uikit-admin-settings__intro']],
          '#weight' => -100,
        ],
      ];
    }

    // Appearance.
    $form['uikit_admin_appearance']['color_mode'] = [
      '#type' => 'radios',
      '#title' => $this->t('Color mode'),
      '#default_value' => $setting('color_mode') ?? 'auto',
      '#options' => [
        'auto' => $this->pickerLabel('mode-auto', $this->t('Follow the system')),
        'light' => $this->pickerLabel('mode-light', $this->t('Light')),
        'dark' => $this->pickerLabel('mode-dark', $this->t('Dark')),
      ],
      '#attributes' => ['class' => ['uikit-admin-picker', 'uikit-admin-picker--thumbs']],
    ];
    // UI Skins offers the color modes of this theme as well: a second control
    // that the setting above would silently override. The setting above is
    // the one control, and it is stored for UI Skins too, so both agree. This
    // alter can run before the one of UI Skins (when another theme shows the
    // form): hide its control once the form is built, and add the submit
    // callbacks that store the colors.
    $form['#after_build'][] = [static::class, 'hideUiSkinsColorMode'];

    // The accent and the focus color are design tokens: they are stored once,
    // in the keys of UI Skins, for the light and for the dark color mode.
    $stored = $setting(Skin::KEY);
    $stored = \is_array($stored) ? $stored : [];
    $form['uikit_admin_appearance']['uikit_admin_skin'] = [
      '#type' => 'container',
      '#tree' => TRUE,
      '#attributes' => ['class' => ['uikit-admin-settings__colors']],
    ];
    $form['uikit_admin_appearance']['uikit_admin_skin']['accent'] = [
      '#type' => 'color',
      '#title' => $this->t('Accent color'),
      '#description' => $this->t('Links, primary buttons and the active item, in the light mode. Pick a dark color: it carries white text.'),
      '#default_value' => Skin::color($stored, 'accent'),
    ];
    $form['uikit_admin_appearance']['uikit_admin_skin']['accent_dark'] = [
      '#type' => 'color',
      '#title' => $this->t('Accent color, dark mode'),
      '#description' => $this->t('The same in the dark mode. Pick a light color: it sits on a dark page.'),
      '#default_value' => Skin::color($stored, 'accent_dark'),
    ];
    $form['uikit_admin_appearance']['density'] = [
      '#type' => 'radios',
      '#title' => $this->t('Density'),
      '#default_value' => $setting('density') ?? 'comfortable',
      '#options' => [
        'comfortable' => $this->pickerLabel('density-comfortable', $this->t('Comfortable'), $this->t('Room to breathe, 44 pixel rows.')),
        'compact' => $this->pickerLabel('density-compact', $this->t('Compact'), $this->t('More rows on the screen, for long days in the back office.')),
      ],
      '#attributes' => ['class' => ['uikit-admin-picker', 'uikit-admin-picker--thumbs']],
    ];

    // Typography.
    $form['uikit_admin_typography']['font_family'] = [
      '#type' => 'radios',
      '#title' => $this->t('Font'),
      '#default_value' => $setting('font_family') ?: 'atkinson',
      '#options' => [
        'atkinson' => $this->pickerLabel('font-atkinson', $this->t('Atkinson Hyperlegible'), $this->t('Served from the theme. It tells I, l and 1 apart, and O and 0.'), 'Il1 O0 Aa'),
        'system' => $this->pickerLabel('font-system', $this->t('The system font'), $this->t('The font of the operating system of each person.'), 'Il1 O0 Aa'),
      ],
      '#attributes' => ['class' => ['uikit-admin-picker', 'uikit-admin-picker--fonts']],
    ];

    // Navigation.
    $form['uikit_admin_navigation']['htmx_navigation'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Navigate with HTMX'),
      '#description' => $this->t('Links, pagers, sorting and filters load only the page, and the rail and the top bar stay in place. Forms that save and drag and drop screens keep full page loads.'),
      '#default_value' => (bool) ($setting('htmx_navigation') ?? TRUE),
    ];
    $form['uikit_admin_navigation']['navbar_sticky'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Keep the top bar at the top of the screen'),
      '#description' => $this->t('The bar with the title, the search and the actions stays in view while the page scrolls.'),
      '#default_value' => (bool) ($setting('navbar_sticky') ?? TRUE),
    ];

    // Editing.
    $form['uikit_admin_editing']['sticky_actions'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Keep the buttons of a form in reach'),
      '#description' => $this->t('The Save row stays at the bottom of the screen while a long form scrolls.'),
      '#default_value' => (bool) ($setting('sticky_actions') ?? TRUE),
    ];
    $form['uikit_admin_editing']['edit_form_sidebar'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Put the meta of a content form in a sidebar'),
      '#description' => $this->t('The authoring information, the revision log and the other groups sit next to the fields.'),
      '#default_value' => (bool) ($setting('edit_form_sidebar') ?? TRUE),
    ];

    // Sign-in screens.
    $layouts = [
      'center' => [$this->t('Centered'), $this->t('The form alone, the site name above it.')],
      'start' => [$this->t('Start'), $this->t('The form first, the brand panel next to it.')],
      'end' => [$this->t('End'), $this->t('The brand panel first, the form next to it.')],
      'top' => [$this->t('Top'), $this->t('A brand band above the form.')],
      'bottom' => [$this->t('Bottom'), $this->t('A brand band under the form.')],
      'spotlight' => [$this->t('Spotlight'), $this->t('A frosted card over the brand color.')],
    ];
    $options = [];
    foreach ($layouts as $key => [$title, $text]) {
      $options[$key] = $this->pickerLabel('sign-in-' . $key, $title, $text);
    }
    $form['uikit_admin_sign_in']['sign_in_layout'] = [
      '#type' => 'radios',
      '#title' => $this->t('Layout'),
      '#default_value' => $setting('sign_in_layout') ?? 'center',
      '#options' => $options,
      '#attributes' => ['class' => ['uikit-admin-picker', 'uikit-admin-picker--thumbs']],
    ];
    $form['uikit_admin_sign_in']['sign_in_message'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Message'),
      '#description' => $this->t('A sentence shown with the site name, like "The back office of the site."'),
      '#maxlength' => 160,
      '#default_value' => $setting('sign_in_message') ?? '',
    ];
    $form['uikit_admin_sign_in']['sign_in_header'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show the header of the site'),
      '#description' => $this->t('A slim bar with the site name and the main menu above the screen.'),
      '#default_value' => (bool) $setting('sign_in_header'),
    ];
    $form['uikit_admin_sign_in']['sign_in_footer'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show the footer of the site'),
      '#description' => $this->t('A bar with the footer menu under the screen.'),
      '#default_value' => (bool) $setting('sign_in_footer'),
    ];
    $form['uikit_admin_sign_in']['sign_in_logo'] = [
      '#type' => 'radios',
      '#title' => $this->t('Logo'),
      '#default_value' => $setting('sign_in_logo') ?: 'site',
      '#options' => [
        'site' => $this->t('The logo of the site, from its default theme'),
        'theme' => $this->t('The logo of this theme'),
        'none' => $this->t('No logo: the site name only'),
      ],
    ];
    $form['uikit_admin_sign_in']['sign_in_brand'] = [
      '#type' => 'radios',
      '#title' => $this->t('Brand'),
      '#default_value' => $setting('sign_in_brand') ?: 'logo_name',
      '#options' => [
        'logo_name' => $this->pickerLabel('brand-logo-name', $this->t('Logo and name'), $this->t('The logo, and the site name next to it.')),
        'logo' => $this->pickerLabel('brand-logo', $this->t('Logo only'), $this->t('For a logo that already carries the name. The name stays its text alternative.')),
        'name' => $this->pickerLabel('brand-name', $this->t('Name only'), $this->t('The site name, with no logo.')),
      ],
      '#attributes' => ['class' => ['uikit-admin-picker', 'uikit-admin-picker--thumbs']],
    ];
    $form['uikit_admin_sign_in']['sign_in_image'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Image of the brand panel'),
      '#description' => $this->t('A path on this site, like /sites/default/files/welcome.jpg, or a public:// file. It shows behind the brand panel of the Start, End, Top and Bottom layouts, under a dark layer that keeps the text readable.'),
      '#maxlength' => 512,
      '#default_value' => $setting('sign_in_image') ?? '',
    ];
    $form['uikit_admin_sign_in']['sign_in_image_credit'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Credit of the image'),
      '#description' => $this->t('Who made the image, like "Photo: NASA".'),
      '#maxlength' => 160,
      '#default_value' => $setting('sign_in_image_credit') ?? '',
    ];
    $form['uikit_admin_sign_in']['sign_in_help'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Help line'),
      '#description' => $this->t('A short line under the links, like "No account yet? Ask the webmaster."'),
      '#maxlength' => 160,
      '#default_value' => $setting('sign_in_help') ?? '',
    ];
    // A Display Builder page layout can draw the sign-in screens instead.
    $page_layouts = [];
    if ($this->entityTypeManager->hasDefinition('page_layout')) {
      foreach ($this->entityTypeManager->getStorage('page_layout')->loadMultiple() as $id => $layout) {
        $page_layouts[$id] = $layout->label();
      }
    }
    $current_layout = (string) ($setting('sign_in_page_layout') ?: '');
    $form_state->set('uikit_admin_sign_in_page_layout', $current_layout);
    $form['uikit_admin_sign_in']['sign_in_page_layout'] = [
      '#type' => 'select',
      '#title' => $this->t('Display Builder page layout'),
      '#description' => $this->t('A page layout that draws the sign-in screens in place of the layout above. Choosing one turns it on, and turns off the one chosen before.'),
      '#options' => $page_layouts,
      '#empty_option' => $this->t('- None: the layout above -'),
      '#default_value' => $current_layout,
      '#access' => (bool) $page_layouts,
    ];

    // Accessibility.
    $form['uikit_admin_accessibility']['uikit_admin_skin'] = [
      '#type' => 'container',
      '#tree' => TRUE,
      '#attributes' => ['class' => ['uikit-admin-settings__colors']],
    ];
    $form['uikit_admin_accessibility']['uikit_admin_skin']['focus'] = [
      '#type' => 'color',
      '#title' => $this->t('Focus color'),
      '#description' => $this->t('The ring around the element the keyboard is on, in the light mode. Keep 3:1 with the page.'),
      '#default_value' => Skin::color($stored, 'focus'),
    ];
    $form['uikit_admin_accessibility']['uikit_admin_skin']['focus_dark'] = [
      '#type' => 'color',
      '#title' => $this->t('Focus color, dark mode'),
      '#description' => $this->t('The same ring in the dark mode.'),
      '#default_value' => Skin::color($stored, 'focus_dark'),
    ];

    // Advanced.
    $links = [];
    foreach ([
      'ui_skins.css_variables.theme_settings' => $this->t('Change every design token with UI Skins'),
    ] as $route => $title) {
      try {
        $url = Url::fromRoute($route, ['theme' => 'uikit_admin']);
        if ($url->access()) {
          $links[] = ['#type' => 'link', '#title' => $title, '#url' => $url];
        }
      }
      catch (\Exception) {
        // The module is not installed.
      }
    }
    $form['uikit_admin_advanced']['links'] = [
      '#theme' => 'item_list',
      '#items' => $links,
      '#access' => (bool) $links,
    ];
    $form['uikit_admin_advanced']['tokens'] = [
      '#type' => 'html_tag',
      '#tag' => 'p',
      '#value' => $this->t('A recipe or an assistant can set them in the configuration of the theme, under third_party_settings.ui_skins.css_variables: the README lists them.'),
    ];

    // The settings of core come after the ones of the theme, in a panel.
    foreach (['theme_settings', 'logo', 'favicon'] as $key) {
      if (isset($form[$key])) {
        $form[$key]['#weight'] = ($form[$key]['#weight'] ?? 0) + 10;
      }
    }
  }

  /**
   * The label of an option of a visual picker.
   *
   * A thumbnail drawn with CSS, the name of the option and a short line. The
   * thumbnail is decoration: the name says it all.
   *
   * @param string $thumb
   *   The name of the thumbnail, a class suffix.
   * @param \Drupal\Core\StringTranslation\TranslatableMarkup $title
   *   The name of the option.
   * @param \Drupal\Core\StringTranslation\TranslatableMarkup|null $text
   *   A short line under the name.
   * @param string $specimen
   *   A text drawn in the thumbnail, for the fonts.
   */
  protected function pickerLabel(string $thumb, TranslatableMarkup $title, ?TranslatableMarkup $text = NULL, string $specimen = ''): Markup {
    $markup = '<span class="uikit-admin-picker__thumb uikit-admin-picker__thumb--' . Html::getClass($thumb) . '" aria-hidden="true">';
    $markup .= $specimen !== '' ? Html::escape($specimen) : '<span></span><span></span><span></span>';
    $markup .= '</span><span class="uikit-admin-picker__title">' . Html::escape((string) $title) . '</span>';
    if ($text !== NULL) {
      $markup .= '<span class="uikit-admin-picker__text">' . Html::escape((string) $text) . '</span>';
    }
    return Markup::create($markup);
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
    static::syncSignInPageLayout((string) $form_state->get('uikit_admin_sign_in_page_layout'), (string) $config->get('sign_in_page_layout'));
  }

  /**
   * Turns on the page layout chosen for the sign-in screens.
   *
   * The layout chosen before is turned off, so only one draws the screens.
   *
   * @param string $before
   *   The id of the layout chosen before, or an empty string.
   * @param string $now
   *   The id of the layout chosen now, or an empty string.
   */
  public static function syncSignInPageLayout(string $before, string $now): void {
    if ($before === $now || !\Drupal::entityTypeManager()->hasDefinition('page_layout')) {
      return;
    }
    $storage = \Drupal::entityTypeManager()->getStorage('page_layout');
    if ($before !== '' && ($layout = $storage->load($before))) {
      $layout->setStatus(FALSE)->save();
    }
    if ($now !== '' && ($layout = $storage->load($now))) {
      $layout->setStatus(TRUE)->save();
    }
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
