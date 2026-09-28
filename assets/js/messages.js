/**
 * @file
 * The messages Drupal.Message adds on the page, drawn as the UIkit alerts of
 * the status messages template.
 *
 * @see templates/misc/status-messages.html.twig
 * @see components/alert/alert.twig
 */
((Drupal) => {
  const VARIANTS = {
    status: 'success',
    warning: 'warning',
    error: 'danger',
    info: 'primary',
  };

  /**
   * Themes a message as a UIkit alert.
   *
   * @param {object} message
   *   The message object.
   * @param {string} message.text
   *   The message text, which may hold markup.
   * @param {object} options
   *   The message options.
   * @param {string} options.type
   *   The message type: status, warning, error or info.
   * @param {string} options.id
   *   The message ID.
   *
   * @return {HTMLElement}
   *   The alert.
   */
  Drupal.theme.message = ({ text }, { type, id }) => {
    const labels = Drupal.Message.getMessageTypeLabels();
    const alert = document.createElement('div');
    alert.className = `uk-alert uk-alert-${VARIANTS[type] || 'primary'} messages messages--${type}`;
    alert.setAttribute('uk-alert', '');
    // Only an error interrupts the screen reader.
    alert.setAttribute('role', type === 'error' ? 'alert' : 'status');
    alert.setAttribute('data-drupal-message-id', id);
    alert.setAttribute('data-drupal-message-type', type);
    if (labels[type]) {
      alert.setAttribute('aria-label', labels[type]);
    }
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'uk-alert-close';
    close.setAttribute('uk-close', '');
    close.setAttribute('aria-label', Drupal.t('Close'));
    const body = document.createElement('div');
    body.innerHTML = text;
    alert.append(close, body);
    return alert;
  };
})(Drupal);
