/* =====================================================================
   ⚙️  AILAA AYARLARI — SUPABASE BİLGİLERİNİ SADECE BURAYA GİR
   Bu dosyayı bir kez doldur, tüm sayfalar (giriş, ana sayfa, mağaza)
   otomatik olarak buradan okur. Başka yere yapıştırmana gerek yok.

   Supabase panelinde: üstteki "Connect" > "API Keys" bölümünden al.
   ===================================================================== */

window.AILAA_SUPABASE_URL = "https://wmnnoprfahkgxzbfmhxc.supabase.co"; // örn: https://wmnnoprfahkgxzbfmhxc.supabase.co
window.AILAA_SUPABASE_KEY = "sb_publishable_hJzsPW2cZfbSfBkrWCE3-Q_lKF5kXMp"; // sb_publishable_... ile başlar (ya da anon key)

// Moderasyon paneli (/admin) için: kendi kullanıcı ID'ni buraya yaz.
// Supabase > Authentication > Users > kendine tıkla > "User UID" değerini kopyala.
window.AILAA_ADMIN_UID = "f8f1eaa0-b720-44f4-a993-2d919b6d57cc";


/* =====================================================================
   🔗 WRENCH EMPIRE ↔ AILAA KÖPRÜSÜ  (buradan silme!)
   Oyunlar sandbox'lı iframe içinde çalışıyor (allow-scripts, same-origin
   yok) — bu güvenlik için doğru, ama sandbox'lı çerçevenin kendi
   localStorage'ı olmadığı için oyun kaydını tutamıyor. Bu köprü, oyunun
   kaydını SİTENİN kendi deposunda saklar ve oyun açılınca geri verir.
   Böylece "Devam Et" ve "Beni hatırla" kaybolmaz.

   config.js'e konuldu çünkü tüm sayfalar bunu zaten yüklüyor —
   store.html / index.html yeniden üretilse bile köprü hayatta kalır.
   ===================================================================== */
(function () {
  if (window.__weBridge) return;         // iki kez kurulmasın
  window.__weBridge = true;
  var PREFIX = 'we:';

  function dump() {
    var d = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) d[k.slice(PREFIX.length)] = localStorage.getItem(k);
      }
    } catch (e) {}
    return d;
  }
  function send(t, m) { try { t && t.postMessage(m, '*'); } catch (e) {} }

  window.addEventListener('message', function (ev) {
    var d = ev && ev.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'we-store-req')      send(ev.source, { type: 'we-store-data', data: dump() });
    else if (d.type === 'we-store-set' && d.key) { try { localStorage.setItem(PREFIX + d.key, d.value); } catch (e) {} }
    else if (d.type === 'we-store-del' && d.key) { try { localStorage.removeItem(PREFIX + d.key); } catch (e) {} }
  });

  /* Oyun açılır açılmaz kaydını gönder + site oturumunu devret */
  function feed(fr) {
    if (!fr || fr.__weFed) return;
    fr.__weFed = true;
    var push = function () {
      if (!fr.contentWindow) return;
      send(fr.contentWindow, { type: 'we-store-data', data: dump() });
      handOff(fr);
    };
    fr.addEventListener('load', push);
    push();
    setTimeout(push, 400);               // srcdoc ile yüklenenler için
  }
  function handOff(fr) {
    var db = window.__ailaaDb || window.dbClient || null;
    if (!db || !db.auth || !db.auth.getSession || !fr.contentWindow) return;
    db.auth.getSession().then(function (r) {
      var s = r && r.data && r.data.session;
      if (!s) return;
      send(fr.contentWindow, {
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
  try { new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true }); }
  catch (e) {}
})();
