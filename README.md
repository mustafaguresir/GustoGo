# GustoGo — Yemek Sipariş ve Kurye Takip Sistemi

Modern, akıllı ve katmanlı mimariye sahip **Yemek Sipariş ve Kurye Takip Sistemi**.

Bu proje; **Resmi Proje Şartnamesi (9. Yemek Sipariş ve Kurye Takip)** kriterlerine birebir uygun olarak **State Tasarım Deseni**, **PHP 8.1+ Enumlar**, **Haversine Küresel Mesafe Hesabı**, **Akıllı Kurye Puanlama Algoritması**, **PDO ve Transaction Güvencesi**, **Çoklu SQL JOIN Sorguları** ve **Rol Tabanlı Yetkilendirme (RBAC)** prensipleriyle eksiksiz geliştirilmiştir.

---

## 📋 Resmi Proje Şartnamesi (9. Yemek Sipariş ve Kurye Takip)

| Alan | Resmi Şartname Kriteri | Projedeki Somut Karşılığı |
|---|---|---|
| **Zorluk** | 4 / 5 | İleri seviye durum makinesi ve optimizasyon |
| **Yapılacaklar** | Müşteri restoran menüsünden sipariş verir; restoran siparişi hazırlar; kurye atanır ve teslim eder. Üç rolün de kendi paneli vardır. | Müşteri, Restoran, Kurye ve Yönetici için 4 bağımsız panel (`public/index.html`) |
| **Çekirdek problem** | **Sipariş durum makinesi** (alındı ➔ hazırlanıyor ➔ hazır ➔ yolda ➔ teslim edildi; iptal) ve geçersiz geçişlerin engellenmesi (yolda olan sipariş "hazırlanıyor"a dönemez); **kurye atama algoritması:** müsait kuryeler arasından siparişe mesafe ve mevcut iş yüküne göre en uygun olanın seçilmesi. | `OrderStateMachineService` (State Pattern), `ScoreBasedAssignmentStrategy` |
| **Zorunlu özellikler** | 3 rol (müşteri, restoran, kurye) ve yönetici; en az 3 restoran ve toplam 10 ürün; sepet; her rolün paneli durum değişince otomatik yenilenir (AJAX); tahmini teslim süresi; sipariş geçmişi; restoranın günlük sipariş raporu. | 4 rol paneli; 7 restoran, 27 ürün; sepet; AJAX reaktif yenileme; dinamik tahmini teslim süresi; `getDailyReport()` |
| **PHP özellikleri** | State deseni, PHP 8.1 enum (sipariş durumu), mesafe hesabı (Haversine), AJAX, PDO ve transaction, JOIN, rol bazlı yetkilendirme. | - State Deseni (`App\Service\State`)<br>- Enum: `App\Enum\OrderStatus`<br>- Haversine: `App\Service\HaversineDistanceService`<br>- AJAX API: `public/api.php`<br>- PDO Transaction: `saveWithTransaction()`<br>- SQL JOIN: `getOrderWithDetails()`<br>- RBAC: `OrderController::changeStatus()` |
| **Asgari tablolar** | `users`, `restaurants`, `menu_items`, `orders`, `order_items`, `couriers`, `order_status_log` (en az 6 tablo) | 7 Tablolu 3NF SQLite Şeması (`database/schema.sql` ve `database/app.sqlite`) |
| **Kapsam sınırı** | Harita servisi, canlı konum takibi ve ödeme yok; konumlar sabit koordinat veya mahalle olarak tutulur. | Kadıköy, Beşiktaş vb. sabit mahalle koordinatları ve 2D şematik ızgara. |
| **Sunumda kanıt** | 1. Geçersiz durum geçişinin reddi;<br>2. İki kurye arasında doğru seçimi gösteren birim testi;<br>3. Müşteri panelinin sayfa yenilemeden güncellenmesi. | Arayüzde ve sunum rehberinde tek tıkla çalıştırılan **3 Canlı Kanıt Merkezi** (`tests/verify_system.py`, `public/api.php`) |

---

## 🚀 Proje Öne Çıkan Özellikleri

1. **4 Farklı Rol Paneli (Rol Yetkilendirme):**
   - 🛍️ **Müşteri (Customer):** 7 restoran, 27 leziz yemek, dinamik sepet, canlı 5 aşamalı sipariş takip stepper'ı, sipariş geçmişi ve iptal yönetimi.
   - 👨‍🍳 **Satıcı / Restoran (Restaurant):** Tüm 7 restoran için ayrı ayrı mutfak sipariş kuyruğu, siparişi mutfağa alma ("Hazırlanıyor"), paketleme ("Hazır"), menü fiyat listesi ve günlük ciro raporu.
   - 🛵 **Kurye (Courier):** 4 farklı kurye için aktif teslimat görevi, restoran alım ve müşteri teslimat koordinatları, paketi teslim alma ("Yolda"), müşteriye teslim etme ("Teslim Edildi") ve Haversine skorlama dökümü.
   - 🛡️ **Yönetici (Admin):** Tüm kurye filosu ve canlı iş yükü analizi, sistem siparişleri ve `order_status_log` denetim günlüğü (audit trail).

2. **Sipariş Durum Makinesi (State Pattern):**
   - Geçerli Sıra: `alındı` ➔ `hazırlanıyor` ➔ `hazır` ➔ `yolda` ➔ `teslim edildi`
   - **İptal Kuralı:** İptal işlemi **yalnızca "hazırlanıyor" aşamasından önce** (sadece `alındı` durumunda) gerçekleştirilebilir. Mutfakta pişirilmeye başlanan veya kuryeye verilen siparişler iptal edilemez.

3. **Akıllı Kurye Atama Algoritması (Haversine Formülü):**
   - **Mesafe Formülü:** $d = 2R \arcsin\left(\sqrt{\sin^2(\Delta\text{lat}/2) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2(\Delta\text{lon}/2)}\right)$ ($R = 6371$ km)
   - **Kurye Puanı:** $\text{Puan} = \text{Mesafe (km)} + (2 \times \text{AktifSipariş})$
   - **Kriter:** Bölgedeki en düşük puana sahip müsait kurye seçilerek siparişe atanır.

4. **Hocanın İstediği 3 Canlı Kanıt Merkezi:**
   - Web arayüzünün üst menüsündeki **"🎓 3 Zorunlu Kanıt"** butonu ile jüriye tek tıkla canlı kanıt gösterilebilir.

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
Sistem gereksinimlerini, Haversine formülünü, kurye puanlamasını, PDO transaction ve 3 kanıtı test etmek için:

```bash
python tests/verify_system.py
```

*Çıktı Örneği:*
```
======================================================================
YEMEK SIPARIS VE KURYE TAKIP SISTEMI - RESMI SARTNAME DOGRULAMA TESTI
======================================================================
[OK] TEST 1: Haversine kuresel mesafe formulu dogrulandi: Kadikoy Moda - Rihtim arasi 0.71 km.
[OK] SUNUMDA KANIT 1 BASARILI: 'yolda' olan siparisin 'hazirlaniyor'a veya 'iptal'e donusu KESINLIKLE REDDEDILDI.
[OK] SUNUMDA KANIT 2 BASARILI: Iki kurye arasinda dogru secim yapildi:
     - Kurye 1 (Ali):  0.71 km, 2 aktif siparis -> Skor: 4.71
     - Kurye 2 (Veli): 1.26 km, 0 aktif siparis -> Skor: 1.26
     -> KAZANAN: Kurye Veli (Uzak / Bosta) (Daha uzak olmasina ragmen is yuku bos oldugu icin secildi!)
[OK] TEST 4: Asgari 7 tablo eksiksiz mevcut: users, restaurants, menu_items, orders, order_items, couriers, order_status_log
[OK] TEST 5: En az 3 restoran ve 10 urun sarti karsilandi (7 restoran, 27 urun mevcut).
[OK] TEST 6: PDO Transaction ve 4 tablolu JOIN sorgusu dogrulandi:
     Siparis #1 | Durum: alindi | Tutar: 320.0 TL | Restoran: Lezzet Kebap Salonu | Musteri: Ahmet Yılmaz

======================================================================
TUM RESMI SARTNAME KRITERLERI VE SUNUM KANITLARI BASARIYLA DOGRULANDI!
======================================================================
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
