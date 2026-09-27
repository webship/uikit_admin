<?php

declare(strict_types=1);

namespace Drupal\uikit_admin\Hook;

use Drupal\Core\Access\AccessResultInterface;
use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\Render\Element;
use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\Core\Session\AccountInterface;
use Drupal\uikit_admin\Shell;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\DependencyInjection\ContainerInterface;

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
    protected AccountInterface $currentUser,
    // The services of optional modules, like Navigation, are looked up only
    // when they are installed.
    #[Autowire(service: 'service_container')]
    protected ContainerInterface $container,
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
    // The rail names the person signed in.
    $variables['#cache']['contexts'][] = 'user';
    $variables['#cache']['contexts'][] = 'route';
    $entity_tasks = $this->entityTasks();
    if ($entity_tasks) {
      $variables['page']['pre_content']['uikit_admin_entity_tasks'] = $entity_tasks;
    }

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
   * The tabs of a content entity, when the Navigation module took them.
   *
   * The Navigation module moves the View, Edit, Delete and Revisions tabs of
   * a content entity into its top bar and hides the local tasks block. This
   * theme draws its own bar instead, so it prints the tabs again.
   *
   * @see \Drupal\navigation\NavigationRenderer::removeLocalTasks()
   */
  protected function entityTasks(): array {
    $container = $this->container;
    if (!$container->has('navigation.renderer') || !$container->has('plugin.manager.top_bar_item')) {
      return [];
    }
    if (!$this->currentUser->hasPermission('access navigation')
      || !\array_key_exists('page_actions', $container->get('plugin.manager.top_bar_item')->getDefinitions())
      || !$container->get('navigation.renderer')->hasLocalTasks()) {
      return [];
    }
    $tasks = $container->get('plugin.manager.menu.local_task')->getLocalTasks((string) $this->routeMatch->getRouteName(), 0);
    $build = [
      '#theme' => 'menu_local_tasks',
      '#primary' => $tasks['tabs'],
      '#weight' => -100,
    ];
    CacheableMetadata::createFromObject($tasks['cacheability'])
      ->addCacheContexts(['user.permissions', 'route'])
      ->applyTo($build);
    return $build;
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
    // A color of the settings wins over the defaults of the stylesheet and
    // over the color mode: the style attribute of the root element comes
    // after every rule of the style sheets.
    $properties = [];
    $accent = $this->safeColor($accent, ThemeHooks::ACCENT_COLOR);
    if (strcasecmp($accent, ThemeHooks::ACCENT_COLOR) !== 0) {
      $properties[] = '--uikit-admin-accent:' . $accent;
      $properties[] = '--uikit-admin-accent-hover:color-mix(in srgb, ' . $accent . ' 82%, #000)';
      $properties[] = '--uikit-admin-on-accent:' . $this->onColor($accent);
    }
    $focus = $this->safeColor($focus, ThemeHooks::FOCUS_COLOR);
    if (strcasecmp($focus, ThemeHooks::FOCUS_COLOR) !== 0) {
      $properties[] = '--uikit-admin-focus:' . $focus;
    }
    if ($properties) {
      $variables['html_attributes']->setAttribute('style', implode(';', $properties));
    }
    $variables['#cache']['tags'][] = 'config:uikit_admin.settings';
  }

  /**
   * The text color that reads on a background color: white or near black.
   */
  protected function onColor(string $hex): string {
    $hex = ltrim($hex, '#');
    if (\strlen($hex) < 6) {
      $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
    }
    $channels = array_map(static function (string $pair): float {
      $value = hexdec($pair) / 255;
      return $value <= 0.03928 ? $value / 12.92 : (($value + 0.055) / 1.055) ** 2.4;
    }, str_split(substr($hex, 0, 6), 2));
    $luminance = 0.2126 * $channels[0] + 0.7152 * $channels[1] + 0.0722 * $channels[2];
    // The contrast with white against the contrast with #111.
    return (1.05 / ($luminance + 0.05)) >= (($luminance + 0.05) / 0.0555) ? '#fff' : '#111';
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
    // Forms that post keep their normal submission (form tokens, Drupal
    // AJAX); the GET forms, like the exposed filters, go through HTMX.
    $method = strtolower((string) ($variables['element']['#method'] ?? 'post'));
    if ($this->htmxNavigation() && $method !== 'get') {
      $variables['attributes']['hx-boost'] = 'false';
    }
  }

  /**
   * Tells if the HTMX navigation is on.
   */
  protected function htmxNavigation(): bool {
    return (bool) ($this->themeSettingsProvider->getSetting('htmx_navigation', 'uikit_admin') ?? TRUE);
  }

  /**
   * Implements hook_preprocess_HOOK() for off_canvas_page_wrapper.
   */
  #[Hook('preprocess_off_canvas_page_wrapper')]
  public function preprocessOffCanvasPageWrapper(array &$variables): void {
    $variables['htmx_navigation'] = $this->htmxNavigation();
    $variables['#cache']['tags'][] = 'config:uikit_admin.settings';
    if ($variables['htmx_navigation']) {
      $variables['#attached']['library'][] = 'uikit_admin/htmx';
    }
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
   * The operations reach the component as the links of core, so each one
   * keeps its attributes, its query and its title markup: the modal dialogs
   * (use-ajax, data-dialog-type), the Views UI AJAX links, the accessible
   * names and the CSRF tokens of the routes.
   */
  #[Hook('preprocess_links__operations')]
  public function preprocessLinksOperations(array &$variables): void {
    $items = [];
    foreach ($variables['links'] ?? [] as $item) {
      if (isset($item['link'])) {
        $items[] = ['link' => $item['link']];
      }
      elseif (!empty($item['text'])) {
        // A link without a URL prints as text, the way core prints it.
        $items[] = ['text' => $item['text']];
      }
    }
    $variables['operations'] = $items;
  }

  /**
   * Turn the local task elements of core into plain component values.
   *
   * The tabs follow their weight and their access, the way core renders them.
   */
  protected function tabItems(array $tasks): array {
    $items = [];
    foreach (Element::children($tasks, TRUE) as $key) {
      $task = $tasks[$key];
      if (!\is_array($task) || !isset($task['#link'])) {
        continue;
      }
      $access = $task['#access'] ?? TRUE;
      if ($access instanceof AccessResultInterface ? !$access->isAllowed() : !$access) {
        continue;
      }
      $link = $task['#link'];
      $items[] = [
        'title' => $link['title'] ?? '',
        'url' => isset($link['url']) ? $link['url']->toString() : '',
        'active' => !empty($task['#active']),
      ];
    }
    return $items;
  }

}
