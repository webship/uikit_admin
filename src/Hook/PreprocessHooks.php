<?php

declare(strict_types=1);

namespace Drupal\uikit_admin\Hook;

use Drupal\Component\Utility\UrlHelper;
use Drupal\Core\Access\AccessResultInterface;
use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\Render\Element;
use Drupal\Core\Render\Markup;
use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\Core\Session\AccountInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\Core\Template\Attribute;
use Drupal\uikit_admin\Shell;
use Drupal\uikit_admin\Skin;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Preprocess hooks for UIkit Admin.
 */
class PreprocessHooks {

  use StringTranslationTrait;

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
    protected ModuleHandlerInterface $moduleHandler,
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
   * The settings of the theme reach the screens as attributes of the root
   * element, and the design tokens a site changed as a style element.
   */
  #[Hook('preprocess_html')]
  public function preprocessHtml(array &$variables): void {
    $mode = $this->themeSettingsProvider->getSetting('color_mode', 'uikit_admin') ?: 'auto';
    $density = $this->themeSettingsProvider->getSetting('density', 'uikit_admin') ?: 'comfortable';

    $variables['html_attributes']->setAttribute('data-uikit-admin-density', $density);
    // The Save row of a form sticks to the bottom of the screen only when the
    // setting asks for it.
    $sticky_actions = (bool) ($this->themeSettingsProvider->getSetting('sticky_actions', 'uikit_admin') ?? TRUE);
    $variables['html_attributes']->setAttribute('data-uikit-admin-sticky-actions', $sticky_actions ? 'on' : 'off');

    // The rail of this theme is the navigation of the back office: the sidebar
    // and the top bar of core's Navigation module would draw it a second time,
    // with their own headings ahead of the page's h1.
    unset($variables['page_top']['navigation'], $variables['page_top']['top_bar'], $variables['page_top']['toolbar']);
    if ($mode !== 'auto') {
      $variables['html_attributes']->setAttribute('data-theme', $mode);
    }
    // The design tokens a site changed are stored once, in the keys of UI
    // Skins. The module prints them when it is installed, for the light and
    // the dark color mode. The theme prints what is left: every value on a
    // site without UI Skins, and the values of the dark mode for a person
    // whose system asks for it. Like UI Skins, it prints them at the top of
    // the body, after every style sheet.
    $stored = $this->themeSettingsProvider->getSetting(Skin::KEY, 'uikit_admin');
    $css = Skin::css(\is_array($stored) ? $stored : [], !$this->moduleHandler->moduleExists('ui_skins'));
    if ($css !== '') {
      $variables['page_top']['uikit_admin_skin'] = [
        '#type' => 'html_tag',
        '#tag' => 'style',
        '#value' => Markup::create($css),
        '#attributes' => ['data-uikit-admin-skin' => TRUE],
      ];
    }
    $variables['#cache']['tags'][] = 'config:uikit_admin.settings';

    // A boosted link to a page another theme renders (the site name of the
    // rail, the account link, the View tab of a content item) loads that page
    // in full, in its own theme.
    $variables['#cache']['contexts'][] = 'headers:HX-Boosted';
    $full_load = $this->otherThemeUrl();
    if ($full_load !== NULL) {
      $variables['#attached']['http_header'][] = ['HX-Redirect', $full_load];
    }
  }

  /**
   * The URL to load in full when a boosted request belongs to another theme.
   *
   * Core renders the page of an HTMX request in the theme of the page the
   * request comes from (the page state it sends), not in the theme the page
   * has on a full load: a front end page would show in this theme, with the
   * rail and the top bar, and pass the check of htmx-navigation.js. The theme
   * negotiators are asked again without that page state: when they pick
   * another theme, HTMX loads the page in full (HX-Redirect), so the same URL
   * always shows the same theme.
   *
   * @return string|null
   *   The URL of the page without the page state, or NULL when the page
   *   belongs to this theme.
   */
  protected function otherThemeUrl(): ?string {
    if (!$this->htmxNavigation()) {
      return NULL;
    }
    $request = $this->container->get('request_stack')->getCurrentRequest();
    if (!$request || !$request->headers->has('HX-Boosted')) {
      return NULL;
    }
    $page_state = $request->attributes->get('ajax_page_state');
    if (empty($page_state['theme'])) {
      return NULL;
    }
    $request->attributes->remove('ajax_page_state');
    try {
      $theme = $this->container->get('theme.negotiator')->determineActiveTheme($this->routeMatch);
    }
    finally {
      $request->attributes->set('ajax_page_state', $page_state);
    }
    if (!$theme || $theme === $this->container->get('theme.manager')->getActiveTheme()->getName()) {
      return NULL;
    }
    $parsed = UrlHelper::parse($request->getRequestUri());
    unset($parsed['query']['ajax_page_state'], $parsed['query']['_wrapper_format']);
    $path = '/' . \ltrim($parsed['path'], '/');
    return UrlHelper::filterBadProtocol($path . ($parsed['query'] ? '?' . UrlHelper::buildQuery($parsed['query']) : ''));
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
   * Implements hook_preprocess_HOOK() for pager.
   *
   * The links of a pager load the next page with HTMX, also inside a form
   * that posts, like the bulk form of a listing.
   */
  #[Hook('preprocess_pager')]
  public function preprocessPager(array &$variables): void {
    $variables['uikit_admin_boost'] = $this->htmxNavigation();
    $variables['#cache']['tags'][] = 'config:uikit_admin.settings';
  }

  /**
   * Implements hook_preprocess_HOOK() for views_mini_pager.
   */
  #[Hook('preprocess_views_mini_pager')]
  public function preprocessViewsMiniPager(array &$variables): void {
    $this->preprocessPager($variables);
  }

  /**
   * Implements hook_preprocess_HOOK() for block.
   *
   * Core gives the help block the complementary role: a name tells it apart
   * from the other complementary landmarks of a page.
   */
  #[Hook('preprocess_block')]
  public function preprocessBlock(array &$variables): void {
    if (($variables['base_plugin_id'] ?? '') === 'help_block' && empty($variables['attributes']['aria-label'])) {
      $variables['attributes']['aria-label'] = $this->t('Help');
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for input.
   *
   * The filter of the Views listing has only a title and a placeholder: it
   * gets an accessible name.
   */
  #[Hook('preprocess_input')]
  public function preprocessInput(array &$variables): void {
    $classes = $variables['attributes']['class'] ?? [];
    if (\is_array($classes) && \in_array('views-filter-text', $classes, TRUE) && empty($variables['attributes']['aria-label'])) {
      $variables['attributes']['aria-label'] = $this->t('Filter by view name or description');
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for views_view_table.
   *
   * A column without a label, like the severity icon of the recent log
   * messages or the select-all box of a bulk form, gets a visually hidden one.
   */
  #[Hook('preprocess_views_view_table')]
  public function preprocessViewsViewTable(array &$variables): void {
    // A table of a bulk form sits in a form that posts, which turns HTMX
    // off for what it holds: its sort links turn it back on.
    $variables['uikit_admin_boost'] = $this->htmxNavigation();
    $view = $variables['view'] ?? NULL;
    foreach ($variables['header'] ?? [] as $key => $column) {
      if (!\is_array($column) || trim(strip_tags((string) ($column['content'] ?? ''))) !== '') {
        continue;
      }
      $attributes = $column['attributes'] ?? NULL;
      if ($attributes instanceof Attribute && $attributes->hasClass('select-all')) {
        $label = $this->t('Select all rows');
      }
      elseif ($view && $view->id() === 'watchdog' && $key === 'nothing') {
        $label = $this->t('Severity');
      }
      elseif ($view && isset($view->field[$key])) {
        $label = $view->field[$key]->adminLabel(TRUE);
      }
      else {
        continue;
      }
      $variables['header'][$key]['hidden_label'] = $label;
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for table.
   *
   * The select-all header of a table select gets a visually hidden label.
   */
  #[Hook('preprocess_table')]
  public function preprocessTable(array &$variables): void {
    foreach ($variables['header'] ?? [] as $key => $cell) {
      $attributes = $cell['attributes'] ?? NULL;
      if ($attributes instanceof Attribute && $attributes->hasClass('select-all') && trim(strip_tags((string) ($cell['content'] ?? ''))) === '') {
        $variables['header'][$key]['content'] = [
          '#markup' => '<span class="visually-hidden">' . $this->t('Select all rows') . '</span>',
        ];
      }
    }
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
