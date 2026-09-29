<?php

declare(strict_types=1);

namespace Drupal\uikit_admin\Hook;

use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\Render\Element;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\Core\Url;

/**
 * Form hooks for UIkit Admin.
 */
class FormHooks {

  use StringTranslationTrait;

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
   * Implements hook_form_alter().
   *
   * The CSS variables form of UI Skins puts the panel of each category inside
   * its vertical tabs element. Without the Field Group module, which makes
   * the vertical tabs element itself the holder of its panels, the panels
   * come before the holder core adds, are marked as printed when they render
   * in place, and the holder then prints nothing. The panels get a weight, so
   * the holder renders first and every design token shows.
   */
  #[Hook('form_alter')]
  public function formAlter(array &$form, FormStateInterface $form_state, string $form_id): void {
    if ($form_id !== 'ui_skins.css_variables.theme_settings' || !isset($form['ui_skins_css_variables'])) {
      return;
    }
    foreach (Element::children($form['ui_skins_css_variables']) as $key) {
      $panel = &$form['ui_skins_css_variables'][$key];
      if (($panel['#type'] ?? '') === 'details' && isset($panel['#group'])) {
        $panel['#weight'] = 1;
      }
    }
  }

  /**
   * Implements hook_form_FORM_ID_alter() for user_login_form.
   *
   * The keyboard starts at the skip link, not in the name field; the name
   * field needs no help text, and the way to reset a password sits under the
   * password.
   */
  #[Hook('form_user_login_form_alter')]
  public function formUserLoginFormAlter(array &$form): void {
    if (isset($form['name'])) {
      unset($form['name']['#description'], $form['name']['#attributes']['autofocus']);
      $form['name']['#attributes']['autocomplete'] = 'username';
    }
    if (isset($form['pass'])) {
      unset($form['pass']['#description']);
      $form['pass']['#attributes']['autocomplete'] = 'current-password';
      $url = Url::fromRoute('user.pass');
      if ($url->access()) {
        $form['pass']['#suffix'] = '<p class="uikit-admin-sign-in__forgot"><a href="' . $url->toString() . '">' . $this->t('Forgot your password?') . '</a></p>';
      }
    }
  }

  /**
   * Implements hook_form_FORM_ID_alter() for user_pass.
   *
   * The button says what happens, and the person goes back to the log in
   * screen, where the message says to check the mail.
   */
  #[Hook('form_user_pass_alter')]
  public function formUserPassAlter(array &$form): void {
    if (isset($form['actions']['submit'])) {
      $form['actions']['submit']['#value'] = $this->t('Send reset link');
    }
    if (isset($form['name'])) {
      unset($form['name']['#attributes']['autofocus']);
      $form['name']['#attributes']['autocomplete'] = 'username';
    }
    $form['#submit'][] = [static::class, 'userPassRedirect'];
  }

  /**
   * Submit callback: back to the log in screen after a reset request.
   */
  public static function userPassRedirect(array &$form, FormStateInterface $form_state): void {
    $form_state->setRedirect('user.login');
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
