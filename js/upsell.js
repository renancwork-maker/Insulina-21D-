/* Upsell: liberar condição e checkout apenas ao alcançar 5:46 na reprodução real da VTurb. */
(function () {
  'use strict';
  var UNLOCK_AT_SECONDS = 5 * 60 + 46; // 346 segundos.
  var CHECKOUT_BASE = 'https://pay.wiapy.com/v9cVKwDK5_GC';
  var STORAGE_KEY = 'clube_segredo_campanha_v1';
  var allowed = /^(utm_[a-z0-9_]+|gclid|gbraid|wbraid|fbclid|msclkid|ttclid)$/i;
  var player = document.getElementById('vid-6af27fccd779234bdafabda7');
  var section = document.getElementById('oferta-revelada');
  var pending = document.getElementById('pending-message');
  var checkout = document.getElementById('checkout-link');
  var unlocked = false;
  if (!player || !section || !checkout) return;

  function savedParams() {
    var params = {};
    try { params = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch (error) {}
    try {
      new URLSearchParams(window.location.search).forEach(function (value, key) {
        if (allowed.test(key) && value.length <= 500) params[key] = value;
      });
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    } catch (error) {}
    return params;
  }
  function getCheckoutUrl() {
    var url = new URL(CHECKOUT_BASE);
    var params = savedParams();
    Object.keys(params).forEach(function (key) {
      if (allowed.test(key) && typeof params[key] === 'string' && !url.searchParams.has(key)) {
        url.searchParams.set(key, params[key]);
      }
    });
    // Inclui identificadores de conversão VTurb, quando oferecidos pela API do player.
    if (typeof player.urlUpdater === 'function') {
      try { return player.urlUpdater(url.toString()); } catch (error) {}
    }
    return url.toString();
  }
  function revealOffer() {
    if (unlocked) return;
    unlocked = true;
    checkout.href = getCheckoutUrl();
    checkout.addEventListener('click', function () { checkout.href = getCheckoutUrl(); });
    section.hidden = false;
    if (pending) pending.hidden = true;
    section.setAttribute('data-unlocked-at', String(UNLOCK_AT_SECONDS));
  }
  // Antes da liberação, não há href de checkout na página.
  savedParams();
  // Assinar antes do carregamento do player para não perder eventos de inicialização.
  player.addEventListener('player:ready', function () {
    // Método oficial VTurb: tempo do vídeo, não um cronômetro da página.
    if (typeof player.onTime === 'function') {
      try { player.onTime(UNLOCK_AT_SECONDS, revealOffer, { once: true }); } catch (error) {}
    }
    // Em retomadas onde o player já inicia depois do ponto de oferta.
    if (typeof player.currentTime === 'number' && player.currentTime >= UNLOCK_AT_SECONDS) revealOffer();
  });
  // Fallback documentado, quando o SmartPlayer emitir progresso da reprodução com áudio.
  // Não escutamos smartautoplay:timeupdate: preview silencioso não deve desbloquear a oferta.
  player.addEventListener('video:timeupdate', function (event) {
    var seconds = event && event.detail && Number(event.detail.time);
    if (Number.isFinite(seconds) && seconds >= UNLOCK_AT_SECONDS) revealOffer();
  });
})();
