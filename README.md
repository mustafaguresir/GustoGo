# GustoGo — Yemek Sipariş ve Kurye Takip Sistemi

Modern, akıllı ve katmanlı mimariye sahip **Yemek Sipariş ve Kurye Takip Sistemi**.

Bu proje; **State Tasarım Deseni**, **PHP 8.1+ Enumlar**, **Manhattan Mesafe Izgarası**, **Akıllı Kurye Puanlama Algoritması**, **Koşullu UPDATE (Optimistic Concurrency)** ve **Rol Tabanlı Yetkilendirme (RBAC)** prensipleriyle eksiksiz olarak geliştirilmiştir.

---

## 🚀 Proje Öne Çıkan Özellikleri

1. **4 Farklı Rol Paneli (Rol Yetkilendirme):**
   - 🛍️ **Müşteri (Customer):** 7 restoran, 27 leziz yemek, dinamik sepet, canlı 5 aşamalı sipariş takip stepper'ı, sipariş geçmişi ve iptal yönetimi.
   - 👨‍🍳 **Satıcı / Restoran (Restaurant):** Tüm 7 restoran için ayrı ayrı mutfak sipariş kuyruğu, siparişi mutfağa alma ("Hazırlanıyor"), paketleme ("Hazır"), menü fiyat listesi ve günlük ciro raporu.
   - 🛵 **Kurye (Courier):** 4 farklı kurye için aktif teslimat görevi, restoran alım ve müşteri teslimat koordinatları, paketi teslim alma ("Yolda"), müşteriye teslim etme ("Teslim Edildi") ve Manhattan skorlama dökümü.
   - 🛡️ **Yönetici (Admin):** 30x30 şehir ızgara haritası, tüm kurye filosu ve canlı iş yükü analizi, sistem siparişleri ve `order_status_log` denetim günlüğü (audit trail).

2. **Sipariş Durum Makinesi (State Pattern):**
   - Geçerli Sıra: `alındı` ➔ `hazırlanıyor` ➔ `hazır` ➔ `yolda` ➔ `teslim edildi`
   - **İptal Kuralı:** İptal işlemi **yalnızca "hazırlanıyor" aşamasından önce** (sadece `alındı` durumunda) gerçekleştirilebilir. Mutfakta pişirilmeye başlanan veya kuryeye verilen siparişler iptal edilemez.

3. **Akıllı Kurye Atama Algoritması (Manhattan Geometrisi):**
   - **Mesafe Formülü:** $|x_1 - x_2| + |y_1 - y_2|$ (Izgara koordinatları üzerinde mutlak farklar toplamı)
   - **Kurye Puanı:** $\text{Puan} = \text{Mesafe} + (2 \times \text{AktifSipariş})$
   - **Kriter:** Bölgedeki en düşük puana sahip müsait kurye seçilerek siparişe atanır.

4. **Canlı 2D Şehir Izgara Haritası:**
   - HTML5 Canvas üzerinde 30x30 ızgara düzlemi.
   - Restoranlar (kırmızı), kuryeler (mavi) ve müşteri teslimat adresi (yeşil) canlı olarak çizilir.
   - Sipariş verildiğinde Kurye ➔ Restoran ➔ Müşteri rotası Manhattan ızgara çizgileriyle gösterilir.

5. **Modern Yemeksepeti / Getir Tasarım Dili:**
   - Tam genişlik hero banner & kategoriler (Kebap, Burger, Pizza, Sushi, Tavuk, Balık, Tatlı).
   - Gerçek yemek fotoğrafları, rozetler ("Popüler", "Şef Seçimi"), puanlar, hazırlık süreleri.
   - Karanlık (Dark) ve Aydınlık (Light) tema desteği (LocalStorage kalıcılığı).

---

## 🗄️ Veritabanı Mimarisi (7 Tablo)

SQLite veritabanı şeması (`database/schema.sql`):
1. `users` — Kullanıcı kimlik ve rol yetkilendirmeleri (`customer`, `restaurant`, `courier`, `admin`).
2. `restaurants` — Restoran adı, telefon ve $(X, Y)$ ızgara koordinatları.
3. `menu_items` — Yemek adı, kategori, açıklama, birim fiyat ve stok durumu.
4. `couriers` — Kurye adı, araç tipi (Motor, E-Bisiklet, Scooter), anlık $(X, Y)$ konumu ve aktif sipariş sayısı.
5. `orders` — Sipariş durumu (`status`), müşteri, restoran, atanan kurye, toplam tutar, teslimat koordinatları.
6. `order_items` — Siparişteki ürünler, adet ve ara toplamlar ($N-M$ junction tablosu).
7. `order_status_log` — Durum değişikliklerinin tarihçesi (önceki durum, yeni durum, değiştiren kullanıcı, zaman damgası).

---

## 💻 Nasıl Çalıştırılır?

### 1. Web Arayüzünü Başlatma (Frontend & Simülasyon)
Uygulama yerel HTTP sunucusu ile tarayıcıda doğrudan çalıştırılabilir:

```bash
# Proje kök dizininde yerel sunucu başlatın:
python -m http.server 8000 --directory public
```

Tarayıcınızda açın:
👉 **`http://localhost:8000`**

### 2. Doğrulama ve Algoritma Testlerini Çalıştırma
Sistem gereksinimlerini, Manhattan formülünü, kurye puanlamasını ve durum makinesini test etmek için:

```bash
python tests/verify_system.py
```

*Çıktı Örneği:*
```
=================================================================
YEMEK SIPARIS VE KURYE TAKIP SISTEMI - TEST VE DOGRULAMA
=================================================================
[OK] TEST 1 BASARILI: Manhattan mesafe dogru hesaplandi: |14-12| + |10-8| = 4 birim.
[OK] TEST 2 BASARILI: En dusuk skorlu kurye (Ali Kaya, Skor: 6) basariyla secildi.
[OK] TEST 3 BASARILI: Durum makinesi gecis kurallari ve 'hazirlaniyor'dan sonra iptal yasagi dogrulandi.
[OK] TEST 4 BASARILI: Veritabaninda 7 restoran, 27 menu urunu ve 4 kurye mevcut (Gereksinimler karsilandi).
[OK] TEST 5 BASARILI: Kosullu UPDATE ve order_status_log denetim kaydi dogrulandi.

=================================================================
TUM SISTEM VE IS MANTIGI TESTLERI EKSIKSIZ BASARILI!
=================================================================
```

---

## 🏛️ Dizin Yapısı

```
yemek-kurye-sistemi/
├── database/
│   ├── app.sqlite          # Canlı SQLite veritabanı (7 restoran, 27 ürün, 4 kurye)
│   ├── schema.sql          # 7 Tablolu DDL şeması ve indeksler
│   └── seed.sql            # Tohum verileri
├── public/
│   ├── index.html          # Modern SPA (4 Rol Paneli, 2D Izgara Haritası, Dark/Light Mode)
│   ├── css/
│   │   └── style.css       # Tasarım sistemi, cam efekti (glassmorphism), responsive layout
│   └── js/
│       ├── audio.js        # Web Audio API sentez ses motoru (Sıfır harici dosya)
│       ├── data.js         # Restoran, menü, kurye, kupon modelleri
│       ├── map.js          # Retina HiDPI 2D Manhattan ızgara haritası ve animasyon motoru
│       ├── state.js        # Reaktif durum, LocalStorage kalıcılığı ve State Pattern
│       └── app.js          # UI denetleyicisi, modal kontrolleri ve olay dinleyicileri
├── src/
│   ├── Controller/
│   │   └── OrderController.php
│   ├── Enum/
│   │   ├── OrderStatus.php # PHP 8.1+ Sipariş Durum Enum'u
│   │   ├── CourierStatus.php
│   │   └── UserRole.php
│   ├── Model/
│   │   ├── Order.php
│   │   ├── Restaurant.php
│   │   ├── Courier.php
│   │   └── MenuItem.php
│   ├── Repository/
│   │   ├── OrderRepositoryInterface.php
│   │   ├── CourierRepositoryInterface.php
│   │   ├── RestaurantRepositoryInterface.php
│   │   └── SqliteOrderRepository.php # Koşullu UPDATE & Audit Log
│   └── Service/
│       ├── CourierAssignmentService.php # Manhattan & Puan Algoritması
│       ├── OrderStateMachineService.php # Durum Makinesi
│       ├── Courier/
│       └── State/          # State Tasarım Deseni Sınıfları (6 Adet)
├── tests/
│   ├── CoreLogicTest.php   # PHP Birim Testleri
│   └── verify_system.py    # Otomatik Sistem Doğrulama Testi
├── docs/
│   └── tasarim.md          # Detaylı Tasarım ve Mimari Dokümanı
└── composer.json
```
