/**
 * @param Drupal
 * @param once
 * @file
 * The rail and the palette of the back office.
 *
 * The rail keeps its width per person; the palette opens on Command-K or
 * Control-K, filters as you type and moves with the arrow keys.
 */
((Drupal, once) => {
  const RAIL_KEY = 'uikit_admin.rail.collapsed';

  // Below this width the rail slides over the page. The class that collapses
  // the rail on a wide screen opens it on a narrow one.
  const narrow = window.matchMedia('(max-width: 960px)');
  const root = document.documentElement;
  const COLLAPSED = 'uikit-admin-rail-collapsed';

  // When the system asks for reduced motion, the drops, the offcanvas, the
  // accordions and the alerts of UIkit open and close without animating
  // (WCAG 2.3.3). The stylesheet stops the transitions of the theme itself.
  if (
    window.UIkit &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    const { UIkit } = window;
    UIkit.mixin({ data: { animation: false, duration: 0 } }, 'drop');
    UIkit.mixin({ data: { animation: false, duration: 0 } }, 'dropdown');
    UIkit.mixin({ data: { mode: 'none' } }, 'offcanvas');
    UIkit.mixin({ data: { animation: false, duration: 0 } }, 'accordion');
    UIkit.mixin({ data: { duration: 0 } }, 'alert');
  }

  const readCollapsed = () => {
    try {
      // Reading the storage throws when the browser blocks it.
      return window.localStorage.getItem(RAIL_KEY) === '1';
    } catch (e) {
      return false;
    }
  };

  const writeCollapsed = (collapsed) => {
    try {
      window.localStorage.setItem(RAIL_KEY, collapsed ? '1' : '0');
    } catch (e) {
      // The rail keeps its width for this page only.
    }
  };

  /**
   * Keeps a closed rail out of the tab order on a narrow screen.
   */
  const syncRail = () => {
    const rail = document.querySelector('[data-uikit-admin-rail]');
    if (!rail) {
      return;
    }
    const on = root.classList.contains(COLLAPSED);
    const open = narrow.matches ? on : !on;
    rail.inert = narrow.matches && !on;
    const inner = rail.querySelector('[data-uikit-admin-rail-toggle]');
    if (inner) {
      inner.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    document
      .querySelectorAll('[data-uikit-admin-rail-open]')
      .forEach((button) => {
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
  };

  const toggleRail = () => {
    const on = root.classList.toggle(COLLAPSED);
    if (!narrow.matches) {
      writeCollapsed(on);
      syncRail();
      return;
    }
    syncRail();
    // The focus follows the rail: into it when it opens, back to the button
    // of the bar when it closes.
    const target = on
      ? document.querySelector('[data-uikit-admin-rail-toggle]')
      : document.querySelector('[data-uikit-admin-rail-open]');
    if (target) {
      target.focus();
    }
  };

  Drupal.behaviors.uikitAdminRail = {
    attach() {
      once('uikit-admin-rail', 'html').forEach(() => {
        // The stored width is the one of a wide screen: on a narrow screen
        // the rail starts closed.
        root.classList.toggle(COLLAPSED, readCollapsed() && !narrow.matches);
        // One listener for the document: HTMX may swap the bar and the rail.
        document.addEventListener('click', (event) => {
          if (
            event.target.closest(
              '[data-uikit-admin-rail-toggle], [data-uikit-admin-rail-open]',
            )
          ) {
            toggleRail();
          }
        });
        document.addEventListener('keydown', (event) => {
          if (
            event.key === 'Escape' &&
            narrow.matches &&
            root.classList.contains(COLLAPSED)
          ) {
            toggleRail();
          }
        });
        narrow.addEventListener('change', () => {
          root.classList.toggle(COLLAPSED, readCollapsed() && !narrow.matches);
          syncRail();
        });
      });
      syncRail();
    },
  };

  Drupal.behaviors.uikitAdminPalette = {
    attach(context) {
      once(
        'uikit-admin-palette',
        '[data-uikit-admin-palette]',
        context,
      ).forEach((palette) => {
        const input = palette.querySelector('[data-uikit-admin-palette-input]');
        const items = Array.from(
          palette.querySelectorAll('[data-uikit-admin-palette-item]'),
        );
        const empty = palette.querySelector('[data-uikit-admin-palette-empty]');
        let active = 0;
        // The element the palette was opened from gets the focus back.
        let opener = null;

        const paint = () => {
          const shown = items.filter((item) => !item.hidden);
          items.forEach((item) => item.classList.remove('is-active'));
          if (shown[active]) {
            shown[active].classList.add('is-active');
            shown[active].scrollIntoView({ block: 'nearest' });
          }
          if (empty) {
            empty.hidden = shown.length > 0;
          }
        };

        const open = () => {
          opener =
            document.activeElement && document.activeElement !== document.body
              ? document.activeElement
              : null;
          palette.hidden = false;
          document.documentElement.classList.add('uikit-admin-palette-open');
          input.value = '';
          items.forEach((item) => {
            item.hidden = false;
          });
          active = 0;
          paint();
          input.focus();
        };

        const close = (restoreFocus = true) => {
          palette.hidden = true;
          document.documentElement.classList.remove('uikit-admin-palette-open');
          if (restoreFocus && opener && document.contains(opener)) {
            opener.focus();
          }
          opener = null;
        };

        document
          .querySelectorAll('[data-uikit-admin-palette-open]')
          .forEach((button) => {
            button.addEventListener('click', open);
          });
        palette
          .querySelectorAll('[data-uikit-admin-palette-close]')
          .forEach((button) => {
            button.addEventListener('click', () => close());
          });

        input.addEventListener('input', () => {
          const needle = input.value.trim().toLowerCase();
          items.forEach((item) => {
            item.hidden =
              needle !== '' && !item.dataset.search.includes(needle);
          });
          active = 0;
          paint();
        });

        palette.addEventListener('keydown', (event) => {
          const shown = items.filter((item) => !item.hidden);
          if (event.key === 'Escape') {
            event.preventDefault();
            close();
          } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            active = Math.min(active + 1, shown.length - 1);
            paint();
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            active = Math.max(active - 1, 0);
            paint();
          } else if (event.key === 'Enter') {
            const link = shown[active]
              ? shown[active].querySelector('a')
              : null;
            if (link) {
              event.preventDefault();
              // A click, so the HTMX navigation loads the page.
              link.click();
            }
          }
        });

        // A chosen destination closes the palette before the page changes.
        items.forEach((item) => {
          const link = item.querySelector('a');
          if (link) {
            link.addEventListener('click', () => close(false));
          }
        });

        // The shortcut acts on the palette of the current page: HTMX swaps
        // the page, and with it the palette.
        Drupal.uikitAdmin = Drupal.uikitAdmin || {};
        Drupal.uikitAdmin.togglePalette = () => {
          if (palette.hidden) {
            open();
          } else {
            close();
          }
        };
      });

      // One shortcut listener for the document, whatever page is swapped in.
      once('uikit-admin-palette-shortcut', 'html').forEach(() => {
        document.addEventListener('keydown', (event) => {
          if (
            (event.metaKey || event.ctrlKey) &&
            event.key.toLowerCase() === 'k' &&
            Drupal.uikitAdmin?.togglePalette
          ) {
            event.preventDefault();
            Drupal.uikitAdmin.togglePalette();
          }
        });
      });
    },
  };
  /**
   * The select-all box core adds to a table carries only a title: it gets the
   * same text as its name, so screen readers announce it.
   */
  Drupal.behaviors.uikitAdminTableSelect = {
    attach(context) {
      // After the other behaviors: the table select behavior of core adds the
      // box, in the preview of Views UI after this one has run.
      setTimeout(() => {
        once(
          'uikit-admin-table-select',
          'th.select-all input[type="checkbox"], input.form-checkbox[title]:not([aria-label]):not([id])',
          context,
        ).forEach((box) => {
          if (!box.getAttribute('aria-label') && box.title) {
            box.setAttribute('aria-label', box.title);
          }
        });
      }, 0);
    },
  };

  /**
   * A table wider than its box scrolls in it. A table that fits lets its box
   * overflow on a wide screen, so its sticky header follows the page. Only a
   * box that scrolls takes the keyboard focus (WCAG 2.1.1): a table that fits
   * adds no tab stop.
   */
  Drupal.behaviors.uikitAdminTableScroll = {
    attach(context) {
      const boxes = once(
        'uikit-admin-table-scroll',
        '.uikit-admin-table-scroll',
        context,
      );
      if (!boxes.length) {
        return;
      }
      if (!window.ResizeObserver) {
        boxes.forEach((box) => box.setAttribute('tabindex', '0'));
        return;
      }
      const measure = (box) => {
        const table = box.querySelector(':scope > table');
        const overflowing = !!table && table.offsetWidth > box.clientWidth + 1;
        box.classList.toggle('is-overflowing', overflowing);
        if (overflowing) {
          box.setAttribute('tabindex', '0');
        } else {
          box.removeAttribute('tabindex');
        }
      };
      const observer = new ResizeObserver((entries) => {
        entries.forEach(({ target }) => {
          const box = target.closest('.uikit-admin-table-scroll');
          if (box) {
            measure(box);
          }
        });
      });
      boxes.forEach((box) => {
        measure(box);
        observer.observe(box);
        const table = box.querySelector(':scope > table');
        if (table) {
          observer.observe(table);
        }
      });
    },
  };

  /**
   * The sticky bar displaces the top of the viewport: the toolbar of CKEditor
   * 5 and the dialogs stay under it. CKEditor 5 reads the offsets only when
   * they change, after the editor is created, so the first scroll sends them.
   */
  Drupal.behaviors.uikitAdminDisplace = {
    attach() {
      once('uikit-admin-displace', 'html').forEach(() => {
        window.addEventListener(
          'scroll',
          () => {
            if (Drupal.displace) {
              Drupal.displace();
            }
          },
          { once: true, passive: true },
        );
      });
    },
  };

  /**
   * The Coffee module adds its search box at the end of the page, outside any
   * landmark: it becomes a named search landmark.
   */
  Drupal.behaviors.uikitAdminCoffee = {
    attach() {
      // After the other behaviors, Coffee's among them, have run.
      setTimeout(() => {
        once('uikit-admin-coffee', '.coffee-form-wrapper').forEach(
          (wrapper) => {
            wrapper.setAttribute('role', 'search');
            wrapper.setAttribute('aria-label', Drupal.t('Coffee'));
          },
        );
      }, 0);
    },
  };
})(Drupal, once);
