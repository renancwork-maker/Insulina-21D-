/* Link oficial do plano Premium R$ 67. Mantém parâmetros da campanha na saída. */
(function () {
  'use strict';
  var TARGET = 'https://pay.wiapy.com/v9cVKwDK5_GC';
  var KEY = 'clube_segredo_campanha_v1';
  var allowed = /^(utm_[a-z0-9_]+|gclid|gbraid|wbraid|fbclid|msclkid|ttclid)$/i;
  function read() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || '{}') || {}; }
    catch (_) { return {}; }
  }
  function capture() {
    var p = read();
    try {
      new URLSearchParams(window.location.search).forEach(function (value, key) {
        if (allowed.test(key) && value.length <= 500) p[key] = value;
      });
      sessionStorage.setItem(KEY, JSON.stringify(p));
    } catch (_) {}
    return p;
  }
  function buildUrl() {
    var url = new URL(TARGET);
    var params = capture();
    Object.keys(params).forEach(function (key) {
      if (allowed.test(key) && typeof params[key] === 'string' && !url.searchParams.has(key)) {
        url.searchParams.set(key, params[key]);
      }
    });
    return url.href;
  }
  function updateLinks() {
    document.querySelectorAll('a[data-clube-checkout]').forEach(function (link) {
      link.href = buildUrl();
    });
  }
  function open() { window.location.assign(buildUrl()); }
  window.ClubeCheckout = { open: open, url: buildUrl };
  capture();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updateLinks);
  else updateLinks();
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    var anchor = target.closest('a[data-clube-checkout]');
    if (anchor) anchor.href = buildUrl();
  }, true);
})();
