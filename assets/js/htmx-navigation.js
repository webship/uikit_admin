/**
 * @param Drupal
 * @param drupalSettings
 * @param htmx
 * @file
 * HTMX navigation for UIkit Admin.
 *
 * The page wrapper is boosted by HTMX (see off-canvas-page-wrapper.html.twig):
 * a link or a GET form loads the next page and swaps only the wrapper. Drupal
 * core (core/drupal.htmx) loads the new CSS and JavaScript, merges the
 * settings and attaches the behaviors.
 *
 * This file keeps full page loads for the screens HTMX must not handle, and
 * for the pages another theme renders; leaves the Drupal AJAX links (modal
 * dialogs, Views UI) to Drupal; closes the open UIkit overlays; and moves the
 * focus to the content and announces the new page.
 *
 * Core sends the ajax_page_state of the page in the query of every HTMX
 * request, so the server only returns the assets the page lacks. Drupal
 * builds form actions, pagers, sort links and destinations from the query of
 * the request: the swapped page drops those parameters again, or a later full
 * page load would believe every library is already loaded.
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

  /**
   * The BigPipe cookie that asks the server to render the placeholders in
   * the response itself.
   *
   * HTMX swaps only the page wrapper: the BigPipe replacements streamed at
   * the end of the body would be lost, and with them the breadcrumb, the tabs
   * and the actions of an uncached page.
   *
   * @see \Drupal\big_pipe\Render\Placeholder\BigPipeStrategy::NOJS_COOKIE
   */
  const bigPipeCookie = 'big_pipe_nojs';

  // No snapshot of a page is kept for the history: a page is made of assets
  // and behaviors HTMX cannot restore, so Back and Forward load it in full.
  htmx.config.historyCacheSize = 0;
  htmx.config.refreshOnHistoryMiss = true;

  Drupal.uikitAdmin = Drupal.uikitAdmin || {};

  /**
   * The assets of the last swapped page, loaded by Drupal core.
   */
  let assetsLoaded = Promise.resolve();

  /**
   * TRUE once a response is dropped for a full page load: its assets are not
   * loaded into the page that is left.
   */
  let leaving = false;
  const { addAssets } = Drupal.htmx;
  Drupal.htmx.addAssets = (data) => {
    if (leaving) {
      return Promise.resolve();
    }
    assetsLoaded = Promise.resolve(addAssets.call(Drupal.htmx, data)).catch(
      () => {},
    );
    return assetsLoaded;
  };

  /**
   * Removes the ajax_page_state parameters from a URL.
   *
   * @param {string} value
   *   A URL, absolute or relative.
   *
   * @return {string}
   *   The URL without the parameters, in the same form.
   */
  const cleanUrl = (value) => {
    if (!value || !value.includes('ajax_page_state')) {
      return value;
    }
    let url;
    try {
      url = new URL(value, window.location.href);
    } catch (e) {
      return value;
    }
    Array.from(url.searchParams.keys())
      .filter((key) => key.startsWith('ajax_page_state'))
      .forEach((key) => url.searchParams.delete(key));
    // A destination carries the query of the page it returns to.
    const destination = url.searchParams.get('destination');
    if (destination) {
      url.searchParams.set('destination', cleanUrl(destination));
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//')) {
      return url.href;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  };
  Drupal.uikitAdmin.cleanUrl = cleanUrl;

  /**
   * Removes the ajax_page_state parameters from every URL of a page.
   *
   * @param {string} html
   *   The HTML of the response.
   *
   * @return {string|null}
   *   The cleaned HTML, or NULL when nothing had to change.
   */
  const cleanResponse = (html) => {
    if (!html.includes('ajax_page_state')) {
      return null;
    }
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const found = doc.evaluate(
      "//@*[contains(., 'ajax_page_state')]",
      doc,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null,
    );
    for (let i = 0; i < found.snapshotLength; i++) {
      const attribute = found.snapshotItem(i);
      attribute.ownerElement.setAttribute(
        attribute.name,
        cleanUrl(attribute.value),
      );
    }
    return doc.documentElement.outerHTML;
  };

  /**
   * Leaves the page for a full page load.
   *
   * @param {string} url
   *   The URL to load.
   */
  const leave = (url) => {
    leaving = true;
    window.location.assign(cleanUrl(url));
  };

  /**
   * Tells if an element is handled by the Drupal AJAX system.
   *
   * @param {Element|null} element
   *   The element triggering the request.
   *
   * @return {boolean}
   *   TRUE for a link or a button Drupal AJAX listens to.
   */
  const isDrupalAjax = (element) =>
    Boolean(
      element &&
        Drupal.ajax?.instances?.some(
          (instance) => instance && instance.element === element,
        ),
    );

  /**
   * Tells if a response was built without the page state of the request.
   *
   * Core sends the page state in the query of every request. A redirect (the
   * Reset of the exposed filters) drops it, or writes its libraries out in
   * full where the server reads them compressed: the server then lists no
   * library as loaded, and the response would load every asset of the page a
   * second time.
   *
   * @param {string} url
   *   The URL of the response.
   *
   * @return {boolean}
   *   TRUE when the response was built without the page state.
   */
  const lostPageState = (url) => {
    let params;
    try {
      params = new URL(url).searchParams;
    } catch (e) {
      return false;
    }
    const libraries = params.get('ajax_page_state[libraries]');
    return !libraries || libraries.includes('/');
  };

  /**
   * Sets or removes the BigPipe cookie.
   *
   * @param {boolean} on
   *   TRUE to set it.
   */
  const setBigPipeCookie = (on) => {
    const path = drupalSettings.path?.baseUrl || '/';
    document.cookie = on
      ? `${bigPipeCookie}=1; path=${path}; SameSite=Lax`
      : `${bigPipeCookie}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
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
    // A link with a CSRF token changes the site (install a theme, disable a
    // view) and redirects: its status message belongs to a full page load.
    if (parsed.searchParams.has('token')) {
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
    // A link or a button of the Drupal AJAX system (a modal dialog, a Views
    // UI link): Drupal answers the click, HTMX leaves it alone.
    if (isDrupalAjax(detail.elt)) {
      event.preventDefault();
      if (window.UIkit) {
        document
          .querySelectorAll('.uk-drop.uk-open')
          .forEach((element) => window.UIkit.drop(element).hide(false));
      }
      return;
    }
    const url = detail.requestConfig?.path || detail.pathInfo?.requestPath;
    if (url && Drupal.uikitAdmin.isExcludedFromHtmx(url, detail.elt)) {
      event.preventDefault();
      leave(url);
      return;
    }
    // The placeholders are rendered in the response, see bigPipeCookie.
    setBigPipeCookie(true);
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

  htmx.on('htmx:afterRequest', ({ detail }) => {
    if (detail.boosted) {
      setBigPipeCookie(false);
    }
  });

  htmx.on('htmx:beforeSwap', (event) => {
    const { detail } = event;
    if (!detail.boosted || !detail.xhr) {
      return;
    }
    const responseUrl = detail.xhr.responseURL || '';
    // A page another theme renders (the front end) is loaded in full, so its
    // own styles apply. So is a redirect to a screen HTMX must not handle,
    // like a batch, and a redirect that carried the page state along: its
    // response was built for a page with no assets.
    if (
      !detail.xhr.responseText.includes(marker) ||
      (responseUrl && Drupal.uikitAdmin.isExcludedFromHtmx(responseUrl)) ||
      (responseUrl &&
        detail.requestConfig?.verb === 'get' &&
        lostPageState(responseUrl))
    ) {
      event.preventDefault();
      leave(responseUrl || detail.pathInfo.requestPath);
      return;
    }
    // The URLs of the page drop the page state of the request.
    const cleaned = cleanResponse(detail.serverResponse);
    if (cleaned !== null) {
      detail.serverResponse = cleaned;
    }
    if (drupalSettings.path?.currentQuery) {
      Object.keys(drupalSettings.path.currentQuery)
        .filter((key) => key.startsWith('ajax_page_state'))
        .forEach((key) => delete drupalSettings.path.currentQuery[key]);
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
