<?php

declare(strict_types=1);

namespace Drupal\uikit_admin\Hook;

use Drupal\Core\Extension\ThemeExtensionList;
use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\File\FileUrlGeneratorInterface;
use Drupal\Core\Hook\Attribute\Hook;

/**
 * Page hooks for UIkit Admin.
 */
class PageHooks {

  /**
   * The font file every page needs first: the upright Latin text.
   */
  public const string FIRST_FONT = 'assets/fonts/atkinson-hyperlegible-next/atkinson-hyperlegible-next-latin-wght-normal.woff2';

  public function __construct(
    protected ThemeSettingsProvider $themeSettingsProvider,
    protected ThemeExtensionList $themeList,
    protected FileUrlGeneratorInterface $fileUrlGenerator,
  ) {}

  /**
   * Implements hook_page_attachments_alter().
   *
   * The browser fetches the first font file with the style sheets, not after
   * them, so the text shows in its font from the first paint. The other files
   * (italic, the extended Latin, Arabic, the code font) load only when a page
   * prints their characters.
   */
  #[Hook('page_attachments_alter')]
  public function pageAttachmentsAlter(array &$attachments): void {
    if (($this->themeSettingsProvider->getSetting('font_family', 'uikit_admin') ?: 'atkinson') !== 'atkinson') {
      return;
    }
    $path = $this->themeList->getPath('uikit_admin') . '/' . self::FIRST_FONT;
    $attachments['#attached']['html_head_link'][] = [
      [
        'rel' => 'preload',
        'as' => 'font',
        'type' => 'font/woff2',
        // A font is fetched in CORS mode even from the same site: without the
        // attribute the browser fetches it twice.
        'crossorigin' => 'anonymous',
        'href' => $this->fileUrlGenerator->generateString($path),
      ],
      FALSE,
    ];
    $attachments['#cache']['tags'][] = 'config:uikit_admin.settings';
  }

}
