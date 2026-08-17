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
   🏠 SİTEDE BARINDIRILAN UYGULAMALAR
   Bir uygulamayı depoya (GitHub) kendi klasörüyle koyduysan, buraya
   ekle. Mağaza kartı o zaman çerçeve içinde değil, doğrudan kendi tam
   sayfa adresinde açar — böylece localStorage, pano, paylaşım, indirme
   ve yazdırma kısıtsız çalışır.

   Anahtar = projenin slug'ı (adres adı), değer = klasör yolu.

   ⚠️ ÖNEMLİ: Buraya SADECE kendi yazdığın / tam güvendiğin uygulamaları
   ekle. Bu klasörler ailaa.io ile aynı kökte çalışır, yani sitenin
   oturum bilgisine erişebilirler. Başkalarının yüklediği projeler
   çerçeveli oynatıcıda kalmalı.
   ===================================================================== */
window.AILAA_NATIVE_APPS = {
  "rustcheck": "/rustcheck/"
};
