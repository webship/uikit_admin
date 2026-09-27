/**
 * @file
 * HTMX navigation for UIkit Admin.
 *
 * The page wrapper is boosted by HTMX (see off-canvas-page-wrapper.html.twig):
 * a link or a GET form loads the next page and swaps only the wrapper. Drupal
 * core (core/drupal.htmx) loads the new CSS and JavaScript, merges the
 * settings and attaches the behaviors.
 *
 * This file keeps full page loads for the screens HTMX must not handle, and
 * for the pages another theme renders; closes the open UIkit overlays; and
 * moves the focus to the content and announces the new page.
 */
((Drupal, drupalSettings, htmx) => {
  /**
   * Paths always loaded with a full page load: forms that change content,
   * screens with drag and drop or builders, and files.
   */
  const excludedPaths = [
    /^\/user\/logout/,
    /^\/batch/,
    /^\/update\.php/,
    /^\/node\/add/,
    /\/(edit|delete|delete-multiple|revisions|translations|layout|clone)(\/|$)/,
    /\/display-builder(\/|$)/,
    /^\/admin\/structure\/block(\/|$)/,
    /^\/admin\/structure\/views\/view\//,
    /^\/admin\/structure\/menu\/manage\//,
    /^\/admin\/structure\/taxonomy\/manage\/[^/]+\/overview/,
    /\/(fields|form-display|display)(\/|$)/,
    /^\/admin\/config\/development\/configuration/,
    /^\/admin\/reports\/updates\/(install|update)/,
    /^\/(core|modules|themes|profiles|sites|system\/files)\//,
    /\.[a-z0-9]{2,5}$/i,
  ];

  /**
   * The attribute every page of this theme carries, see preprocess_html.
   */
  const marker = 'data-uikit-admin-density';

  Drupal.uikitAdmin = Drupal.uikitAdmin || {};

  /**
   * The assets of the last swapped page, loaded by Drupal core.
   */
  let assetsLoaded = Promise.resolve();
  const { addAssets } = Drupal.htmx;
  Drupal.htmx.addAssets = (data) => {
    assetsLoaded = Promise.resolve(addAssets.call(Drupal.htmx, data)).catch(
      () => {},
    );
    return assetsLoaded;
  };

  /**
   * Tells if a URL must be loaded without HTMX.
   *
   * @param {string} url
   *   The requested URL.
   * @param {Element|null} element
   *   The element triggering the request.
   *
   * @return {boolean}
   *   TRUE for a full page load.
   */
  Drupal.uikitAdmin.isExcludedFromHtmx = (url, element = null) => {
    const parsed = new URL(url, window.location.href);
    if (parsed.origin !== window.location.origin) {
      return true;
    }
    let path = parsed.pathname;
    const base = drupalSettings.path?.baseUrl || '/';
    if (base !== '/' && path.startsWith(base)) {
      path = `/${path.substring(base.length)}`;
    }
    if (excludedPaths.some((pattern) => pattern.test(path))) {
      return true;
    }
    return Boolean(
      element?.closest(
        '.use-ajax, [data-dialog-type], [target], [download], [data-contextual-id], .contextual, [hx-boost="false"]',
      ),
    );
  };

  // A full page load for the excluded URLs.
  htmx.on('htmx:beforeRequest', (event) => {
    const { detail } = event;
    if (!detail.boosted) {
      return;
    }
    const url = detail.requestConfig?.path || detail.pathInfo?.requestPath;
    if (url && Drupal.uikitAdmin.isExcludedFromHtmx(url, detail.elt)) {
      event.preventDefault();
      window.location.assign(url);
      return;
    }
    // Close the palette and the UIkit overlays: the offcanvas rail, modals,
    // dropdowns.
    document.documentElement.classList.remove('uikit-admin-palette-open');
    if (window.UIkit) {
      document
        .querySelectorAll('.uk-offcanvas.uk-open')
        .forEach((element) => window.UIkit.offcanvas(element).hide());
      document
        .querySelectorAll('.uk-modal.uk-open')
        .forEach((element) => window.UIkit.modal(element).hide());
      document
        .querySelectorAll('.uk-drop.uk-open')
        .forEach((element) => window.UIkit.drop(element).hide(false));
    }
  });

  // A page another theme renders (the front end) is loaded in full, so its
  // own styles apply.
  htmx.on('htmx:beforeSwap', (event) => {
    const { detail } = event;
    if (!detail.boosted || !detail.xhr) {
      return;
    }
    if (!detail.xhr.responseText.includes(marker)) {
      event.preventDefault();
      window.location.assign(
        detail.xhr.responseURL || detail.pathInfo.requestPath,
      );
    }
  });

  // The new page wrapper is in the document. HTMX fires the events of the
  // swap on the replaced wrapper, which has left the document, so core does
  // not reach the new one: attach the behaviors once its assets are loaded,
  // then move the focus to the content and announce the new page.
  // The first page is attached by Drupal on page load.
  const firstWrapper = document.querySelector('[data-off-canvas-main-canvas]');
  htmx.on('htmx:load', ({ detail }) => {
    const wrapper = detail.elt;
    if (
      wrapper === firstWrapper ||
      !wrapper.matches?.('[data-off-canvas-main-canvas]') ||
      wrapper.dataset.uikitAdminLoaded
    ) {
      return;
    }
    wrapper.dataset.uikitAdminLoaded = 'true';
    assetsLoaded.then(() => {
      Drupal.attachBehaviors(wrapper, drupalSettings);
      const target =
        document.getElementById('main-content') ||
        document.querySelector('main, [role="main"]');
      if (target) {
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
        }
        target.focus({ preventScroll: true });
      }
      Drupal.announce(document.title);
    });
  });
})(Drupal, drupalSettings, htmx);
