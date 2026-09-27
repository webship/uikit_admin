/**
 * @param Drupal
 * @param once
 * @param storage
 * @file
 * The rail and the palette of the back office.
 *
 * The rail keeps its width per person; the palette opens on Command-K or
 * Control-K, filters as you type and moves with the arrow keys.
 */
((Drupal, once, storage) => {
  const RAIL_KEY = 'uikit_admin.rail.collapsed';

  Drupal.behaviors.uikitAdminRail = {
    attach(context) {
      const rails = once(
        'uikit-admin-rail',
        '[data-uikit-admin-rail]',
        context,
      );
      rails.forEach((rail) => {
        const collapsed = storage.getItem(RAIL_KEY) === '1';
        document.documentElement.classList.toggle(
          'uikit-admin-rail-collapsed',
          collapsed,
        );

        const toggles = document.querySelectorAll(
          '[data-uikit-admin-rail-toggle], [data-uikit-admin-rail-open]',
        );
        toggles.forEach((toggle) => {
          toggle.addEventListener('click', () => {
            const isCollapsed = document.documentElement.classList.toggle(
              'uikit-admin-rail-collapsed',
            );
            storage.setItem(RAIL_KEY, isCollapsed ? '1' : '0');
            const inner = rail.querySelector('[data-uikit-admin-rail-toggle]');
            if (inner) {
              inner.setAttribute(
                'aria-expanded',
                isCollapsed ? 'false' : 'true',
              );
            }
          });
        });
      });
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

        const close = () => {
          palette.hidden = true;
          document.documentElement.classList.remove('uikit-admin-palette-open');
        };

        document
          .querySelectorAll('[data-uikit-admin-palette-open]')
          .forEach((button) => {
            button.addEventListener('click', open);
          });
        palette
          .querySelectorAll('[data-uikit-admin-palette-close]')
          .forEach((button) => {
            button.addEventListener('click', close);
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
              window.location.href = link.href;
            }
          }
        });

        document.addEventListener('keydown', (event) => {
          if (
            (event.metaKey || event.ctrlKey) &&
            event.key.toLowerCase() === 'k'
          ) {
            event.preventDefault();
            if (palette.hidden) {
              open();
            } else {
              close();
            }
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
      once(
        'uikit-admin-table-select',
        'th.select-all input[type="checkbox"], input.form-checkbox[title]:not([aria-label]):not([id])',
        context,
      ).forEach((box) => {
        if (!box.getAttribute('aria-label') && box.title) {
          box.setAttribute('aria-label', box.title);
        }
      });
    },
  };
})(Drupal, once, window.localStorage);
