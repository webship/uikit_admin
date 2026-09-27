<?php

declare(strict_types=1);

namespace Drupal\uikit_admin;

use Drupal\Core\Security\TrustedCallbackInterface;

/**
 * Draws the links core styles as buttons with the UIkit button classes.
 *
 * Core marks a link that looks like a button with the "button" class and its
 * modifiers: "Cancel account", the "Cancel" of a confirmation form, "Delete"
 * next to "Save". They get the UIkit button of the same kind.
 */
final class LinkButton implements TrustedCallbackInterface {

  /**
   * The modifiers of core and the UIkit class of each.
   */
  private const MODIFIERS = [
    'button--primary' => 'uk-button-primary',
    'button--danger' => 'uk-button-danger',
    'button--small' => 'uk-button-small',
  ];

  /**
   * {@inheritdoc}
   */
  public static function trustedCallbacks(): array {
    return ['preRenderLink'];
  }

  /**
   * Pre-render callback for the link element.
   */
  public static function preRenderLink(array $element): array {
    foreach (['#attributes', '#options'] as $key) {
      $classes = $key === '#attributes'
        ? ($element['#attributes']['class'] ?? [])
        : ($element['#options']['attributes']['class'] ?? []);
      if (\is_string($classes)) {
        $classes = explode(' ', $classes);
      }
      if (!\is_array($classes) || !\in_array('button', $classes, TRUE)) {
        continue;
      }
      $added = ['uk-button'];
      foreach (self::MODIFIERS as $modifier => $class) {
        if (\in_array($modifier, $classes, TRUE)) {
          $added[] = $class;
        }
      }
      $styled = array_filter($classes, static fn ($class): bool => \is_string($class) && preg_match('/^uk-button-(primary|danger|default|secondary|text|link)$/', $class) === 1);
      if (!$styled && \count(array_intersect($added, ['uk-button-primary', 'uk-button-danger'])) === 0) {
        $added[] = 'uk-button-default';
      }
      $classes = array_values(array_unique(array_merge($classes, $added)));
      if ($key === '#attributes') {
        $element['#attributes']['class'] = $classes;
      }
      else {
        $element['#options']['attributes']['class'] = $classes;
      }
    }
    return $element;
  }

}
