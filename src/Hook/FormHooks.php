<?php

declare(strict_types=1);

namespace Drupal\uikit_admin\Hook;

use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\Hook\Attribute\Hook;

/**
 * Form hooks for UIkit Admin.
 */
class FormHooks {

  public function __construct(
    protected ThemeSettingsProvider $themeSettingsProvider,
  ) {}

  /**
   * Implements hook_form_alter() for a content form.
   *
   * The fields stay in the main column and the meta of the content moves to
   * the sidebar, the way the administration themes of core lay a content form
   * out. The vertical tabs become plain containers, so each group reads as its
   * own panel in the sidebar.
   */
  #[Hook('form_node_form_alter')]
  public function formNodeFormAlter(array &$form): void {
    if (!$this->sidebarEnabled()) {
      return;
    }
    $form['#theme'] = ['node_edit_form'];
    $this->ensureAdvancedSettings($form);
  }

  /**
   * Implements hook_form_alter() for a media form.
   */
  #[Hook('form_media_form_alter')]
  public function formMediaFormAlter(array &$form): void {
    if (!$this->sidebarEnabled()) {
      return;
    }
    $this->ensureAdvancedSettings($form);
  }

  /**
   * Whether the meta of a content form belongs in a sidebar.
   */
  protected function sidebarEnabled(): bool {
    return (bool) ($this->themeSettingsProvider->getSetting('edit_form_sidebar', 'uikit_admin') ?? TRUE);
  }

  /**
   * Turn the vertical tabs of a content form into panels.
   */
  protected function ensureAdvancedSettings(array &$form): void {
    if (isset($form['advanced'])) {
      $form['advanced']['#type'] = 'container';
    }
    if (isset($form['meta'])) {
      $form['meta']['#type'] = 'container';
      $form['meta']['#access'] = TRUE;
    }
    if (isset($form['revision_information'])) {
      $form['revision_information']['#type'] = 'container';
      $form['revision_information']['#group'] = 'meta';
    }
  }

}
