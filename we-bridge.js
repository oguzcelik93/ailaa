/* ============================================================================
   Wrench Empire ↔ Ailaa köprüsü  (we-bridge.js)
   ----------------------------------------------------------------------------
   NE İŞE YARAR
   Oyun sitede iframe içinde çalıştığı için tarayıcı, oyunun kaydını sekme
   kapanınca silebiliyor. Bu script oyunun kaydını SİTENİN kendi deposunda
   (birinci taraf) tutar; oyun açıldığında geri verir. Böylece "Devam Et",
   "Beni hatırla" ve garaj kaydı kaybolmaz.

   NASIL KURULUR  (tek satır)
   Oyunu iframe ile açan sayfaya — yani ailaa.io/store sayfasına — şunu ekle:

       <script src="/we-bridge.js"></script>

   Bu kadar. Hangi iframe olduğunu bulmasına gerek yok, mesajı kim
   gönderdiyse ona cevap verir. Sayfa sonradan iframe açsa da çalışır.

   İSTEĞE BAĞLI — site üyeliğiyle otomatik giriş
   Sayfanda supabase istemcisi global olarak duruyorsa (window.supabase),
   köprü oyuncunun oturumunu da oyuna aktarır. Yoksa bu kısım sessizce atlanır.
   ========================================================================== */
(function () {
  var PREFIX = 'we:';

  function dump() {
    var data = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) data[k.slice(PREFIX.length)] = localStorage.getItem(k);
      }
    } catch (e) {}
    return data;
  }

  function send(target, msg) {
    try { target && target.postMessage(msg, '*'); } catch (e) {}
  }

  window.addEventListener('message', function (ev) {
    var d = ev && ev.data;
    if (!d || typeof d !== 'object') return;

    if (d.type === 'we-store-req') {
      send(ev.source, { type: 'we-store-data', data: dump() });

    } else if (d.type === 'we-store-set' && d.key) {
      try { localStorage.setItem(PREFIX + d.key, d.value); } catch (e) {}

    } else if (d.type === 'we-store-del' && d.key) {
      try { localStorage.removeItem(PREFIX + d.key); } catch (e) {}
    }
  });

  /* Oyun yüklenir yüklenmez kaydını göndermek için: sayfadaki iframe'lere
     load anında bir kez veri yolla (oyun ayrıca kendisi de isteyecek). */
  function feed(frame) {
    if (!frame || frame.__weFed) return;
    frame.__weFed = true;
    frame.addEventListener('load', function () {
      send(frame.contentWindow, { type: 'we-store-data', data: dump() });
      handOff(frame);
    });
    if (frame.contentWindow) {
      send(frame.contentWindow, { type: 'we-store-data', data: dump() });
      handOff(frame);
    }
  }

  /* --- isteğe bağlı: site oturumunu oyuna devret --- */
  function handOff(frame) {
    var sb = window.supabase;
    if (!sb || !sb.auth || !sb.auth.getSession || !frame.contentWindow) return;
    sb.auth.getSession().then(function (r) {
      var s = r && r.data && r.data.session;
      if (!s) return;
      send(frame.contentWindow, {
        type: 'ailaa-auth',
        access_token: s.access_token,
        refresh_token: s.refresh_token,
        email: (s.user && s.user.email) || null
      });
    }).catch(function () {});
  }

  function scan() { Array.prototype.forEach.call(document.querySelectorAll('iframe'), feed); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();

  /* sonradan açılan iframe'leri de yakala (oyun bir modalda açılıyorsa) */
  try {
    new MutationObserver(function () { scan(); })
      .observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
})();
