# NutriPeer masaüstü dönüşüm projesi

Bu proje mevcut NutriPeer arayüzünü Tauri 2 masaüstü kabuğuna taşımak için başlangıç noktasıdır. Aynı kaynak Windows ve macOS'ta yerel pencere içinde çalışır; kullanıcıdan ayrıca Chrome/Edge veya Python başlatması istemez.

## Veri sınırı

- Danışanlar, randevular, diyetler, ölçümler ve yerel kullanıcılar cihazın uygulama WebView alanında kalır. Bunlar ortak kütüphane sunucusuna gönderilmez.
- Eski uygulamadan JSON yedeği alıp yeni uygulamadaki **Yedekten geri yükle** seçeneğiyle aynı cihaza aktarın. İçe aktarma başlamadan önce uygulama mevcut çalışma alanını ayrıca JSON yedeği olarak indirir; bu dosyayı saklayın. Bu dışa/içe aktarma adımı eski tarayıcı profilinden otomatik veri taşıma yerine kullanılır.
- Ortak besin/değişim/yemek verisi Supabase üzerinden yayınlanacak şekilde eski arayüzde başlatılmıştır. `desktop-web/Kurulum-Ortak-Kutuphane.sql` moderasyon kurallarını içerir. Canlı eşitleme için uygulama sahibinin Supabase projesi, herkese açık URL ve `anon` anahtarı gerekir; `service_role` anahtarı masaüstü uygulamasına konmamalıdır. İlk yönetici hesabı oluşturulduktan sonra SQL dosyasının sonundaki adımla yönetici olarak tanımlanmalıdır.
- Masaüstü sürümünde giriş, ortak kütüphane için de kullanılan Supabase hesabıyla yapılır. Her hesap için danışan verileri cihazda ayrı bir yerel çalışma alanında tutulur. Aynı bilgisayarda ikinci bir hesaba geçildiğinde ilk hesabın danışan kayıtları açılmaz. E-posta/hesap kimliği ve ortak katalog işlemleri sunucuyu kullanır; danışan, diyet, randevu, ölçüm verileri gönderilmez.
- Eski aynı-cihaz `nutripeer.v1` kayıt deposu varsa ilk hesap girişinde bu kayıtları yalnızca o hesaba aktarmak isteyip istemediğin sorulur; eski depo aktarım sırasında değiştirilmez. Önceki tarayıcı uygulamasının verisi farklı tarayıcı profili/origin altında ise eski uygulamadan JSON yedeği alıp girişten sonra **Yedekten geri yükle** ile aktar. Yedek yüklerken mevcut hesap kimliği korunur.

Masaüstü derlemesinde ortak katalog ayarlarını her kullanıcıya elle girdirmemek için Vite derleme ayarları `NUTRIPEER_SUPABASE_URL` ve `NUTRIPEER_SUPABASE_ANON_KEY` değerlerini `window.NUTRIPEER_COMMUNITY_CONFIG` olarak ekler. Sahip `.env.example` dosyasını `.env.local` adıyla kopyalayıp proje URL'sini ve publishable/anon anahtarını kendi ortamında doldurabilir. Vite, service-role/secret anahtarı gibi görünen değerleri reddeder. Bu yapılandırma uygulama paketinde görünür olacağından yalnızca herkese açık istemci anahtarı kullanılmalıdır. Paketli uygulamada kullanıcılar bağlantıyı değiştiremez; kayıt ve katkılar mevcut Supabase hesap/onay akışını kullanır.

## Geliştirme ortamı

Tauri'nin resmi Windows araç zinciri Rust, Node.js LTS, Microsoft C++ Build Tools ve WebView2 gerektirir. macOS paketi Xcode/Command Line Tools ile macOS üzerinde derlenmelidir. Gereksinimler: https://v2.tauri.app/start/prerequisites/

Bağımlılıkları kurduktan sonra bu klasörde:

```powershell
npm install
npm run tauri dev
```

Ortak katalog ve merkezi hesapla yerel geliştirme için `.env.example` dosyasını `.env.local` olarak kopyala ve değerleri doldur. Bu değerler olmadan `tauri dev` eski cihaz-yerel giriş akışını açar. Dağıtım derlemesi eksik ayarları reddeder.

Windows kurulum paketi:

```powershell
npm run tauri build -- --bundles nsis
```

macOS DMG paketi Mac üzerinde:

```sh
npm run tauri build -- --bundles dmg
```

## Güncelleme ve imza durumu

Uygulama içi güncelleme düğmesi ve Tauri updater eklentisi eklendi. Güvenli güncelleme imzası için `npx tauri signer generate -w <anahtar-dosyasi>` ile üretilecek özel anahtar yalnızca sahibinde/CI gizlisinde kalmalı; karşılık gelen açık anahtar `src-tauri/tauri.conf.json` içine yazılmalı ve imzalı release JSON/paketleri HTTPS üzerinden yayımlanmalıdır. Özel anahtarı kaynak ZIP'ine, Git deposuna veya uygulamanın içine koymayın. `TAURI_SIGNING_PRIVATE_KEY` ve varsa `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` yalnızca derleme ortamında gizli değişken olarak tanımlanmalıdır. Şu an açık anahtar ve GitHub endpoint'inde yer tutucular var; production derlemesi bunlar değiştirilmeden başlamaz.

GitHub Actions için `.github/workflows/release.yml`, Windows x64, macOS Apple silicon ve macOS Intel kurulumlarını taslak sürüm olarak üretmek üzere yapılandırılmıştır. Güncelleme adresi `arzuozkhoc/nutripeer-desktop` deposunu kullanır. İmzalı yayın için önce Tauri updater anahtarı üretip **yalnızca açık anahtarı** `tauri.conf.json` içine koy. Ardından GitHub Actions Secrets içine `NUTRIPEER_SUPABASE_URL`, `NUTRIPEER_SUPABASE_ANON_KEY`, `TAURI_SIGNING_PRIVATE_KEY`, isteğe bağlı `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, `NUTRIPEER_WINDOWS_CERTIFICATE`, `NUTRIPEER_WINDOWS_CERTIFICATE_PASSWORD`, `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `KEYCHAIN_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` değerlerini ekle. Workflow, `tauri.conf.json` sürümüyle eşleşen `v*` etiketi geldiğinde taslak release oluşturur; release'i yayımlamadan önce paketleri incele. Depo hazır, fakat bu Secrets ve imza ayarları henüz eklenmediği için dağıtım derlemesi çalıştırılmadı.

Windows ve macOS imza/noter onayı hesap ve sertifika sahibinin kimlik bilgileriyle yapılır. Mac dağıtımı Apple Developer ID ile imzalanıp notarize edilmelidir. Bu klasör imzasız geliştirme kaynağıdır, indirilebilir onaylı uygulama değildir.

## Mevcut doğrulama sınırı

`.github/workflows/verify-desktop.yml` Windows ve macOS üzerinde başarılı oldu; gerçek Tauri ikilileri derlendi. `.github/workflows/preview-installers.yml` ücretsiz imzasız Windows NSIS ve Apple silicon Mac DMG deneme paketleri oluşturup Actions artifact olarak yükler. Bu paketler 14 gün saklanır. İmzasız oldukları için Windows SmartScreen ve macOS Gatekeeper uyarısı verebilir. Önizleme derlemesi Supabase bağlantısı olmadan çalıştığından hesap ve ortak kütüphane eşitlemesi etkin değildir; Tauri updater paketleri de bu test sürümünde oluşturulmaz.

CI derlemesi uygulama penceresini elle açıp danışan iş akışlarını uçtan uca doğrulamaz. Canlı Supabase hesabı/kataloğu, imzalama anahtarları, Windows/macOS imza ve noterleme bilgileri henüz yapılandırılmadı. Bu nedenle mevcut dosyalar geliştirme/test önizlemesidir; imzalı ve üretim için onaylanmış yayın değildir.

