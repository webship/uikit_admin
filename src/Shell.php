<?php

declare(strict_types=1);

namespace Drupal\uikit_admin;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Menu\MenuLinkTreeInterface;
use Drupal\Core\Menu\MenuTreeParameters;
use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\Core\Render\Markup;
use Drupal\Core\Url;
use Drupal\Core\Entity\EntityTypeManagerInterface;

/**
 * Builds the rail and the palette of the back office.
 */
class Shell {

  use StringTranslationTrait;

  /**
   * The icons of the rail, drawn inline so they take the color of the item.
   */
  protected const ICONS = [
    'system.admin_content' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/></svg>',
    'entity.media.collection' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16v12H4z"/><path d="M4 15l4-4 4 4 3-3 5 5"/></svg>',
    'system.admin_structure' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 4h6v6H5zM13 14h6v6h-6zM8 10v4h5"/></svg>',
    'system.themes_page' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4a8 8 0 100 16 3 3 0 002-5h2a4 4 0 004-4 7 7 0 00-8-7z"/></svg>',
    'system.modules_list' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 4h4v4h4V4h2v16H7z"/></svg>',
    'system.admin_config' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 7h14M5 12h14M5 17h14"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="8" cy="17" r="2"/></svg>',
    'entity.user.collection' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3"/><path d="M4 19a5 5 0 0110 0M16 11h5M18.5 8.5v5"/></svg>',
    'system.admin_reports' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 19V9M12 19V5M19 19v-7"/></svg>',
    'help.main' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 113 2.5v1.5M12 17h.01"/></svg>',
    // The items of other modules, which had no icon of their own.
    'webdashboard.default' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z"/></svg>',
    'announcements_feed.announcement' => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10v4h3l7 4V6l-7 4z"/><path d="M17.5 9a4 4 0 010 6"/></svg>',
  ];

  /**
   * How the sections of the rail are put together.
   */
  protected const SECTIONS = [
    'Create' => ['system.admin_content', 'entity.media.collection'],
    'Build' => ['system.admin_structure', 'system.themes_page', 'system.modules_list', 'system.admin_config'],
    'Run' => ['entity.user.collection', 'system.admin_reports', 'help.main'],
  ];

  public function __construct(
    protected MenuLinkTreeInterface $menuTree,
    protected RouteMatchInterface $routeMatch,
    protected AccountProxyInterface $currentUser,
    protected EntityTypeManagerInterface $entityTypeManager,
    protected ConfigFactoryInterface $configFactory,
  ) {}

  /**
   * The shell, built from the container.
   *
   * A theme carries no services of its own, so the shell takes what it needs
   * when a page asks for it.
   */
  public static function create(): static {
    return new static(
      \Drupal::service('menu.link_tree'),
      \Drupal::service('current_route_match'),
      \Drupal::service('current_user'),
      \Drupal::service('entity_type.manager'),
      \Drupal::service('config.factory'),
    );
  }

  /**
   * The name and slogan of the site, for the top of the rail.
   */
  public function site(): array {
    $site = $this->configFactory->get('system.site');
    return [
      'name' => (string) $site->get('name'),
      'slogan' => (string) $site->get('slogan'),
    ];
  }

  /**
   * The translated title of a section of the rail.
   */
  protected function sectionTitle(string $key): string {
    return (string) match ($key) {
      'Create' => $this->t('Create'),
      'Build' => $this->t('Build'),
      'Run' => $this->t('Run'),
      default => $this->t('More'),
    };
  }

  /**
   * The sections of the rail, with only the links this person may follow.
   */
  public function sections(): array {
    $links = $this->adminLinks();
    $sections = [];
    foreach (self::SECTIONS as $title => $routes) {
      $items = [];
      foreach ($routes as $route) {
        if (isset($links[$route])) {
          $items[] = $links[$route];
          unset($links[$route]);
        }
      }
      if ($items) {
        $sections[] = ['title' => $this->sectionTitle($title), 'items' => $items];
      }
    }
    // Anything the administration menu has that the sections do not name.
    if ($links) {
      $sections[] = ['title' => $this->t('More'), 'items' => \array_values($links)];
    }

    return $sections;
  }

  /**
   * The person signed in, for the foot of the rail.
   */
  public function account(): array {
    $name = $this->currentUser->getDisplayName();
    $parts = \preg_split('/[\s._-]+/', (string) $name) ?: [];
    $initials = '';
    foreach (\array_slice($parts, 0, 2) as $part) {
      $initials .= \mb_strtoupper(\mb_substr($part, 0, 1));
    }
    $roles = $this->currentUser->getRoles(TRUE);
    $role = $roles ? \ucfirst(\str_replace('_', ' ', \reset($roles))) : (string) $this->t('Member');

    return [
      'initials' => $initials ?: \mb_strtoupper(\mb_substr((string) $name, 0, 1)),
      'name' => $name,
      'role' => $role,
      'url' => Url::fromRoute('entity.user.canonical', ['user' => $this->currentUser->id()])->toString(),
      'logout_url' => Url::fromRoute('user.logout')->toString(),
    ];
  }

  /**
   * Everything the palette can jump to: the administration menu, in full.
   */
  public function paletteItems(): array {
    $parameters = new MenuTreeParameters();
    $parameters->setMaxDepth(5)->onlyEnabledLinks();
    $tree = $this->menuTree->load('admin', $parameters);
    $tree = $this->menuTree->transform($tree, [
      ['callable' => 'menu.default_tree_manipulators:checkAccess'],
      ['callable' => 'menu.default_tree_manipulators:generateIndexAndSort'],
    ]);

    $items = [];
    $this->flatten($tree, '', $items);

    return \array_merge($items, $this->extraDestinations());
  }

  /**
   * The screens people ask for that the administration menu does not carry.
   *
   * Permissions, roles and the status report are tabs, not menu links, so the
   * palette adds them by route when the person may open them.
   */
  protected function extraDestinations(): array {
    $routes = [
      'user.admin_permissions' => [$this->t('People'), $this->t('Permissions')],
      'entity.user_role.collection' => [$this->t('People'), $this->t('Roles')],
      'system.status' => [$this->t('Reports'), $this->t('Status report')],
      'dblog.overview' => [$this->t('Reports'), $this->t('Recent log messages')],
      'system.performance_settings' => [$this->t('Configuration'), $this->t('Performance')],
      'system.site_information_settings' => [$this->t('Configuration'), $this->t('Basic site settings')],
      'entity.block.collection' => [$this->t('Structure'), $this->t('Block layout')],
      'entity.node_type.collection' => [$this->t('Structure'), $this->t('Content types')],
      'entity.media_type.collection' => [$this->t('Structure'), $this->t('Media types')],
      'entity.menu.collection' => [$this->t('Structure'), $this->t('Menus')],
      'entity.taxonomy_vocabulary.collection' => [$this->t('Structure'), $this->t('Taxonomy')],
      'system.theme_settings' => [$this->t('Appearance'), $this->t('Theme settings')],
    ];

    $items = [];
    foreach ($routes as $route => [$group, $title]) {
      try {
        $url = Url::fromRoute($route);
        if (!$url->access($this->currentUser)) {
          continue;
        }
        $items[] = [
          'title' => (string) $title,
          'group' => (string) $group,
          'url' => $url->toString(),
        ];
      }
      catch (\Exception) {
        // The route does not exist on this site: skip it.
      }
    }

    return $items;
  }

  /**
   * The top level of the administration menu, keyed by route.
   */
  protected function adminLinks(): array {
    // The administration menu hangs under one root link: the sections of the
    // rail are that link's children.
    $parameters = new MenuTreeParameters();
    $parameters->setMaxDepth(2)->onlyEnabledLinks();
    $tree = $this->menuTree->load('admin', $parameters);
    $root = \reset($tree);
    if ($root && $root->subtree) {
      $tree = $root->subtree;
    }
    $tree = $this->menuTree->transform($tree, [
      ['callable' => 'menu.default_tree_manipulators:checkAccess'],
      ['callable' => 'menu.default_tree_manipulators:generateIndexAndSort'],
    ]);

    $current_path = Url::fromRouteMatch($this->routeMatch)->toString();
    $links = [];
    $best = NULL;
    $best_length = 0;
    foreach ($tree as $element) {
      $link = $element->link;
      $route = $link->getRouteName();
      $url = $link->getUrlObject();
      $links[$route] = [
        'title' => $link->getTitle(),
        'url' => $url->toString(),
        'icon' => Markup::create(self::ICONS[$route] ?? self::ICONS['system.admin_config']),
        'active' => FALSE,
        'count' => $route === 'system.admin_content' ? $this->contentCount() : NULL,
      ];
      // The longest link path the current page starts with is the section it
      // belongs to: /admin/content/media is Content, never Administration.
      $path = $links[$route]['url'];
      if (($current_path === $path || \str_starts_with($current_path, \rtrim($path, '/') . '/')) && \strlen($path) > $best_length) {
        $best = $route;
        $best_length = \strlen($path);
      }
    }
    if ($best !== NULL) {
      $links[$best]['active'] = TRUE;
    }

    return $links;
  }

  /**
   * How many content items the site has, for the badge on Content.
   */
  protected function contentCount(): ?int {
    if (!$this->entityTypeManager->hasDefinition('node')) {
      return NULL;
    }
    try {
      $count = $this->entityTypeManager->getStorage('node')->getQuery()
        ->accessCheck(TRUE)
        ->count()
        ->execute();
      return (int) $count ?: NULL;
    }
    catch (\Exception) {
      return NULL;
    }
  }

  /**
   * Walk the menu tree into a flat list of places to jump to.
   */
  protected function flatten(array $tree, string $trail, array &$items): void {
    foreach ($tree as $element) {
      if (!$element->access?->isAllowed()) {
        continue;
      }
      $link = $element->link;
      $title = $link->getTitle();
      $url = $link->getUrlObject();
      if ($url->isRouted()) {
        $items[] = [
          'title' => $title,
          'group' => $trail ?: (string) $this->t('Administration'),
          'url' => $url->toString(),
        ];
      }
      if ($element->subtree) {
        $this->flatten($element->subtree, $trail ? $trail . ' · ' . $title : $title, $items);
      }
    }
  }

}
