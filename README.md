# GustoGo — Yemek Sipariş ve Kurye Takip Sistemi
## Aşama 2: Veritabanısız Çalışan Prototip

Modern, akıllı, katmanlı mimariye sahip ve **Aşama 2 (Veritabanısız Çalışan Prototip)** şartnamesine %100 uyumlu PHP web prototipi.

Bu proje; bir veritabanı sunucusuna (MySQL/SQLite) bağlanmadan çalışmakta, tüm kalıcı verilerini `storage/` klasöründeki JSON dosyalarında `flock(LOCK_EX)` dosya kilidi ve geçici dosya (.tmp) atomik değişimiyle güvenle saklamaktadır.

---

## 📌 Aşama 2 Şartname Kriterleri ve Projedeki Karşılıkları

| Şartname Kriteri | Gereksinim | GustoGo Prototipindeki Karşılığı |
|---|---|---|
| **PHP Sürümü** | PHP 8.2 veya üzeri | PHP 8.2+ Typed Properties, Enums (`OrderStatus`, `CourierStatus`, `UserRole`) |
| **Paket Yönetimi & Standartlar** | Composer, PSR-4 otomatik yükleme, PSR-12, namespace | `composer.json`, `App\` namespace, PSR-4 |
| **Framework Yasağı** | Laravel/Symfony yok, saf PHP | Saf PHP ile sıfırdan geliştirildi |
| **Giriş Noktası & Katmanlar** | Tek giriş noktası (Front Controller), Router, Controller, Service, Repository, View ayrımı | `public/index.php`, `src/Controller`, `src/Service`, `src/Repository` |
| **Veri Saklama (Aşama 2)** | MySQL/SQLite YOK; `storage/` altındaki JSON dosyaları | `storage/users.json`, `restaurants.json`, `menu_items.json`, `couriers.json`, `orders.json` |
| **Dosya Kilidi (`flock`)** | Eşzamanlı yazma ihtimaline karşı `flock(LOCK_EX)` ve `.tmp` atomik dosya değişimi | `src/Storage/JsonStorageHelper.php` |
| **Başlangıç Verisi (Seeder)** | `bin/seed.php` CLI başlangıç veri yükleme betiği | `bin/seed.php` (10 kullanıcı, 7 restoran, 24 ürün, 4 kurye, 4 sipariş) |
| **Auth & Güvenlik** | Kayıt, giriş, çıkış (`password_hash`), POST-Redirect-GET (PRG), flash mesajlar, IDOR engeli | `AuthService.php`, `public/index.php` (`/login`, `/register`, `/logout`) |
| **Çekirdek Problem** | Sipariş durum makinesi (State Pattern) ve Haversine kurye puanlama optimizasyonu | `OrderStateMachineService.php`, `ScoreBasedAssignmentStrategy.php` |
| **Birim Testler (PHPUnit)** | `vendor/bin/phpunit`, en az 10 test, InMemory sahte repository, sınır durumları | 14 Adet PHPUnit Birim Testi (`tests/Unit/*`), `InMemoryOrderRepository` |
| **Zorunlu Dokümanlar** | `docs/izlenebilirlik.md`, `docs/ai-gunlugu.md`, `docs/surec-raporu.md` | `docs/` altında eksiksiz mevcut |

---

## 🚀 Hızlı Kurulum ve Çalıştırma Adımları

Projeyi daha önce kurmamış bir kişi temiz bir klasörde aşağıdaki adımları izleyerek uygulamayı hemen çalıştırabilir:

### 1. Bağımlılıkları Yükleme
```bash
composer install
```

### 2. JSON Başlangıç Verilerini Yükleme (Seed)
Aşama 2 şartnamesi gereğince prototipin dolu verilerle başlayabilmesi için seeder betiğini çalıştırın:
```bash
php bin/seed.php
```
*Bu komut `storage/` klasörünü ve içindeki `users.json`, `restaurants.json`, `menu_items.json`, `couriers.json`, `orders.json` dosyalarını otomatik olarak oluşturur.*

### 3. PHP Dahili Web Sunucusunu Başlatma
```bash
php -S localhost:8000 -t public
```
Tarayıcınızda açın:  
👉 **`http://localhost:8000`**

* Alternatif Giriş Sayfası (PRG Flow & Form Doğrulama):  
  👉 **`http://localhost:8000/login`**

---

## 🧪 PHPUnit Testlerini Çalıştırma

Aşama 2 çekirdek problem, sınır durumları ve güvenlik kurallarını doğrulayan 14 birim testini çalıştırmak için:

```bash
# Standart PHPUnit komutu:
vendor/bin/phpunit

# veya Composer kısayolu:
composer test

# veya Bağımsız Test Koşucu:
php tests/run_tests.php
```

Python doğrulama testini çalıştırmak için:
```bash
python tests/verify_system.py
```

---

## 👥 Demo Kullanıcı Hesapları (`password_hash`)

Tüm kullanıcıların başlangıç parolası: `hash123`

| Rol | Kullanıcı Adı | Parola | Yetki Kapsamı |
| :--- | :--- | :--- | :--- |
| **Müşteri** | `ahmet_musteri` | `hash123` | Menü inceleme, sepet, sipariş oluşturma, canlı takip, hazırlık öncesi iptal |
| **Restoran** | `restoran_lezzet` | `hash123` | Mutfak ekranı, siparişi hazırlama ("Hazırlanıyor"), paketleme ("Hazır"), ciro raporu |
| **Kurye** | `kurye_ali` | `hash123` | Atanan siparişi teslim alma ("Yolda"), müşteriye teslim etme ("Teslim Edildi") |
| **Yönetici** | `admin_mustafa` | `hash123` | Tüm kurye filosu, iş yükü denetimi ve IDOR muafiyeti |

---

## 📁 Proje Dizin Yapısı

```text
yemek-kurye-sistemi/
├── bin/
│   └── seed.php                        # JSON başlangıç veri yükleme CLI betiği
├── composer.json                       # PSR-4 otomatik yükleme ve PHPUnit ayarları
├── phpunit.xml                         # PHPUnit test süiti yapılandırması
├── docs/
│   ├── izlenebilirlik.md               # Gereksinim - Test eşleştirme matrisi
│   ├── ai-gunlugu.md                   # Yapay zekâ kullanım günlüğü (Hata vakası dahil)
│   ├── surec-raporu.md                 # 2-4 sayfalık resmi Aşama 2 süreç raporu
│   ├── tasarim.md                      # Aşama 1 8 bölümlük tasarım dokümanı
│   └── srs.md                          # Yazılım gereksinim şartnamesi
├── storage/                            # Aşama 2 JSON Veritabanı Klasörü
│   ├── users.json                      # Kullanıcılar ve password_hash
│   ├── restaurants.json                # Restoranlar ve koordinatlar
│   ├── menu_items.json                 # Menü yemekleri ve fiyatlar
│   ├── couriers.json                   # Kuryeler, konumlar ve iş yükleri
│   └── orders.json                     # Siparişler ve detay kalemleri
├── src/
│   ├── Storage/
│   │   └── JsonStorageHelper.php       # flock(LOCK_EX) ve .tmp atomik yazım yardımcısı
│   ├── Enum/                           # PHP 8.2+ Enumlar (OrderStatus, CourierStatus, UserRole)
│   ├── Model/                          # Saf Varlıklar (Order, User, Courier, Restaurant, MenuItem)
│   ├── Service/
│   │   ├── OrderStateMachineService.php# Durum makinesi çekirdek kural motoru
│   │   ├── CourierAssignmentService.php# Haversine mesafe ve puanlama servisi
│   │   ├── AuthService.php             # password_hash, login, register, IDOR sahiplik kontrolü
│   │   └── State/                      # State Pattern durum sınıfları (Received, Preparing...)
│   └── Repository/
│       ├── *RepositoryInterface.php    # Bağımsız Repository arayüzleri
│       ├── Json/                       # Aşama 2 JSON Repository sınıfları
│       └── InMemory/                   # Testler için sahte bellek içi repository sınıfları
├── public/
│   ├── index.php                       # Front Controller (Router, PRG, Flash Mesajlar)
│   ├── index.html                      # Canlı interaktif SPA paneli
│   ├── api.php                         # AJAX / JSON REST uç noktaları
│   ├── css/ & js/                      # Arayüz stilleri ve reaktif takip betikleri
└── tests/
    ├── Unit/                           # PHPUnit Test Sınıfları (14 Test)
    │   ├── OrderStateMachineTest.php
    │   ├── CourierAssignmentStrategyTest.php
    │   ├── SecurityAndAuthTest.php
    │   └── JsonStorageFlockTest.php
    ├── run_tests.php                   # Standalone test koşucu
    └── verify_system.py                # Sistem doğrulama betiği
```

---

## 📑 Teslim Edilen Zorunlu Dokümanlar

1. **İzlenebilirlik Matrisi:** [`docs/izlenebilirlik.md`](docs/izlenebilirlik.md)  
   *Aşama 1 gereksinimleri (FR/User Story) ile 14 PHPUnit testinin eşleşmesi ve mutasyon test sonuçları.*
2. **Yapay Zekâ Günlüğü:** [`docs/ai-gunlugu.md`](docs/ai-gunlugu.md)  
   *AI'ın SQLite önerdiği hatanın nasıl yakalanıp JSON mimarisine dönüştürüldüğünün somut kaydı.*
3. **Süreç Raporu:** [`docs/surec-raporu.md`](docs/surec-raporu.md)  
   *Hocanın istediği 9 alt başlıklı eksiksiz akademik süreç ve Aşama 3 MySQL geçiş analizi.*
