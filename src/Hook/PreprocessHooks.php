<?php

declare(strict_types=1);

namespace Drupal\uikit_admin\Hook;

use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\uikit_admin\Shell;

/**
 * Preprocess hooks for UIkit Admin.
 */
class PreprocessHooks {

  /**
   * The routes of the sign-in screens.
   */
  public const SIGN_IN_ROUTES = [
    'user.login',
    'user.pass',
    'user.register',
    'user.reset',
    'user.reset.form',
    'user.reset.login',
  ];

  /**
   * The layouts of the sign-in screens.
   */
  public const SIGN_IN_LAYOUTS = ['center', 'start', 'end', 'top', 'bottom', 'spotlight'];

  public function __construct(
    protected ThemeSettingsProvider $themeSettingsProvider,
    protected RouteMatchInterface $routeMatch,
  ) {}

  /**
   * Tells if the page is one of the sign-in screens.
   */
  protected function isSignIn(): bool {
    return \in_array($this->routeMatch->getRouteName(), self::SIGN_IN_ROUTES, TRUE);
  }

  /**
   * Implements hook_theme_suggestions_HOOK_alter() for page.
   *
   * The sign-in screens have a page of their own, without the rail and the
   * top bar.
   */
  #[Hook('theme_suggestions_page_alter')]
  public function themeSuggestionsPageAlter(array &$suggestions, array $variables): void {
    if ($this->isSignIn()) {
      $suggestions[] = 'page__uikit_admin_sign_in';
    }
  }

  /**
   * The shell of the back office.
   *
   * A theme carries no services of its own, so the shell is built when a page
   * asks for it.
   */
  protected function shell(): Shell {
    return Shell::create();
  }

  /**
   * Implements hook_preprocess_HOOK() for page.
   */
  #[Hook('preprocess_page')]
  public function preprocessPage(array &$variables): void {
    $variables['navbar_sticky'] = (bool) ($this->themeSettingsProvider->getSetting('navbar_sticky', 'uikit_admin') ?? TRUE);
    $variables['offcanvas_id'] = ThemeHooks::OFFCANVAS_ID;
    $shell = $this->shell();
    $site = $shell->site();
    $variables['site_name'] = $site['name'];
    $variables['site_slogan'] = $site['slogan'];
    $variables['#cache']['tags'][] = 'config:system.site';
    $variables['rail_sections'] = $shell->sections();
    $variables['rail_account'] = $shell->account();
    $variables['palette_items'] = $shell->paletteItems();
    $variables['#cache']['contexts'][] = 'user.permissions';
    $variables['#cache']['contexts'][] = 'route';

    if ($this->isSignIn()) {
      $variables['#cache']['tags'][] = 'config:uikit_admin.settings';
      $layout = $this->themeSettingsProvider->getSetting('sign_in_layout', 'uikit_admin') ?: 'center';
      $variables['sign_in_layout'] = \in_array($layout, self::SIGN_IN_LAYOUTS, TRUE) ? $layout : 'center';
      $variables['sign_in_message'] = (string) ($this->themeSettingsProvider->getSetting('sign_in_message', 'uikit_admin') ?? '');
      $use_default = $this->themeSettingsProvider->getSetting('logo.use_default', 'uikit_admin') ?? TRUE;
      $variables['sign_in_logo'] = $use_default ? '' : (string) ($this->themeSettingsProvider->getSetting('logo.url', 'uikit_admin') ?? '');
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for html.
   *
   * The settings of the theme reach the screens as attributes and custom
   * properties, so the color, the density and the color mode are one place.
   */
  #[Hook('preprocess_html')]
  public function preprocessHtml(array &$variables): void {
    $accent = $this->themeSettingsProvider->getSetting('accent_color', 'uikit_admin') ?: ThemeHooks::ACCENT_COLOR;
    $focus = $this->themeSettingsProvider->getSetting('focus_color', 'uikit_admin') ?: ThemeHooks::FOCUS_COLOR;
    $mode = $this->themeSettingsProvider->getSetting('color_mode', 'uikit_admin') ?: 'auto';
    $density = $this->themeSettingsProvider->getSetting('density', 'uikit_admin') ?: 'comfortable';

    $variables['html_attributes']->setAttribute('data-uikit-admin-density', $density);

    // The rail of this theme is the navigation of the back office: the sidebar
    // and the top bar of core's Navigation module would draw it a second time,
    // with their own headings ahead of the page's h1.
    unset($variables['page_top']['navigation'], $variables['page_top']['top_bar'], $variables['page_top']['toolbar']);
    if ($mode !== 'auto') {
      $variables['html_attributes']->setAttribute('data-theme', $mode);
    }
    $variables['#attached']['html_head'][] = [
      [
        '#tag' => 'style',
        '#value' => \sprintf(
          ':root{--uikit-admin-accent:%s;--uikit-admin-focus:%s;}',
          $this->safeColor($accent, ThemeHooks::ACCENT_COLOR),
          $this->safeColor($focus, ThemeHooks::FOCUS_COLOR),
        ),
      ],
      'uikit_admin_colors',
    ];
  }

  /**
   * Implements hook_preprocess_HOOK() for form.
   *
   * A content form keeps its meta next to the fields, the way the editors of
   * the other administration themes expect it.
   */
  #[Hook('preprocess_form')]
  public function preprocessForm(array &$variables): void {
    $variables['uikit_admin_sidebar'] = (bool) ($this->themeSettingsProvider->getSetting('edit_form_sidebar', 'uikit_admin') ?? TRUE);
  }

  /**
   * Only a hexadecimal color reaches the page.
   */
  protected function safeColor(?string $value, string $fallback): string {
    return \is_string($value) && \preg_match('/^#[0-9a-fA-F]{3,8}$/', $value) ? $value : $fallback;
  }

  /**
   * Implements hook_preprocess_HOOK() for menu_local_tasks.
   *
   * The tabs reach the component as plain values: a title, a url and whether
   * the tab is the active one.
   */
  #[Hook('preprocess_menu_local_tasks')]
  public function preprocessMenuLocalTasks(array &$variables): void {
    foreach (['primary', 'secondary'] as $level) {
      $variables['tabs'][$level] = $this->tabItems($variables[$level] ?? []);
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for links__dropbutton.
   *
   * A dropbutton is drawn the same way as the operations of a row.
   */
  #[Hook('preprocess_links__dropbutton')]
  public function preprocessLinksDropbutton(array &$variables): void {
    $this->preprocessLinksOperations($variables);
  }

  /**
   * Implements hook_preprocess_HOOK() for links__operations.
   *
   * The operations reach the component as plain values, so the dropdown can
   * keep the first one outside and the rest inside.
   */
  #[Hook('preprocess_links__operations')]
  public function preprocessLinksOperations(array &$variables): void {
    $items = [];
    foreach ($variables['links'] ?? [] as $item) {
      if (!isset($item['link'])) {
        continue;
      }
      $link = $item['link'];
      $items[] = [
        'title' => (string) ($link['#title'] ?? ''),
        'url' => isset($link['#url']) ? $link['#url']->toString() : '',
      ];
    }
    $variables['operations'] = $items;
  }

  /**
   * Turn the local task elements of core into plain component values.
   */
  protected function tabItems(array $tasks): array {
    $items = [];
    foreach ($tasks as $key => $task) {
      if (!\is_array($task) || !isset($task['#link'])) {
        continue;
      }
      $link = $task['#link'];
      $items[] = [
        'title' => (string) ($link['title'] ?? ''),
        'url' => isset($link['url']) ? $link['url']->toString() : '',
        'active' => !empty($task['#active']),
      ];
    }
    return $items;
  }

}
