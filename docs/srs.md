# GustoGo — Yazılım Gereksinim Şartnamesi (SRS)
## Software Requirements Specification — IEEE 830 Standardı

**Ders:** PHP Programlama – Tasarım ve Mimari (Hafta 3 / 4)  
**Proje Adı:** GustoGo (Food Delivery & Smart Courier Dispatch System)  
**Doküman Sürümü:** 1.0.0 (Resmi Şartname Uyumu)  
**Tarih:** 21 Ekim 2026  
**Grup:** Mustafa Güreşir (@mustafaguresir - Proje Yöneticisi), @mimar-uye (Yazılım Mimarı), @vt-test-uye (Veritabanı Sorumlusu), @ui-doc-uye (Arayüz Sorumlusu)

---

## 1. Giriş (Introduction)

### 1.1 Dokümanın Amacı
Bu Yazılım Gereksinim Şartnamesi (SRS), **GustoGo Yemek Sipariş ve Kurye Takip Sistemi**'nin fonksiyonel ve fonksiyonel olmayan tüm isterlerini, sistem aktörlerini, çekirdek durum makinesi kurallarını, Haversine küresel mesafe atama algoritmasını ve veritabanı kısıtlamalarını IEEE 830 standartlarına uygun olarak tanımlar.

### 1.2 Proje Kapsamı
GustoGo; Müşteri, Restoran, Kurye ve Yönetici olmak üzere 4 temel aktörün etkileşimde bulunduğu, sipariş aşamalarını katı bir **Durum Makinesi (State Machine)** ile yöneten, kurye atamasını küresel coğrafi mesafe (**Haversine formülü**) ve kurye iş yükü katsayısıyla optimize eden ilişkisel bir web platformudur.

### 1.3 Kapsam Sınırları (Constraints & Boundaries)
Dersin resmi şartnamesi uyarınca sistemin sınırları kesin olarak çizilmiştir:
- **Harita Servisi:** Canlı Google Maps API vb. ücretli dış harita servisleri kullanılmaz; İstanbul'un sabit mahalle koordinatları (Kadıköy Moda, Kadıköy Rıhtım, Fenerbahçe, Beşiktaş vb.) ve 30x30 şematik ızgara kullanılır.
- **Canlı GPS:** Kurye anlık GPS takibi yapılmaz; kurye koordinatları mahalle/ızgara konumları üzerinden tutulur.
- **Ödeme Altyapısı:** Gerçek banka sanal POS veya kart ödeme gateway entegrasyonu yoktur; simüle edilmiş sipariş tamamlama kullanılır.

---

## 2. Genel Sistem Tanımı (Overall Description)

### 2.1 Kullanıcı Rolleri ve Yetki Matrisi (RBAC)

| Rol Adı | Sistemdeki Karşılığı | Temel Yetkileri |
|---|---|---|
| **Müşteri (Customer)** | `role = 'customer'` | Restoran menülerini inceleme, sepete ürün ekleme, sipariş verme, siparişini sayfa yenilemeden canlı takip etme, hazırlanmadan önce iptal etme. |
| **Restoran (Restaurant)** | `role = 'restaurant'` | Gelen siparişleri görme, siparişi "Hazırlanıyor"a alma, paket hazır olunca "Hazır" durumuna getirme (otomatik kurye tetiklenir), günlük satış ve ciro raporunu izleme. |
| **Kurye (Courier)** | `role = 'courier'` | Üzerine atanan siparişleri listeleme, yola çıkınca "Yolda" durumuna getirme, teslim edince "Teslim Edildi" olarak onaylama, canlı iş yükünü izleme. |
| **Yönetici (Admin)** | `role = 'admin'` | Tüm restoran, kurye ve siparişleri izleme, kurye filosu iş yükü optimizasyonunu denetleme, `order_status_log` denetim tarihçesini inceleme. |

### 2.2 Mimari Tasarım Prensipleri
- **Katmanlı Mimari (Layered Architecture):** `Router → Controller → Service → Repository → Model/Database`.
- **Katman Atlaması Yasağı:** Controller asla doğrudan SQL yazamaz veya Repository ile konuşamaz; mutlaka Service katmanını çağırır.
- **Veri Yalıtımı:** SQLite'tan MySQL'e geçildiğinde yalnızca `src/Repository/` altındaki somut sınıflar değişir, iş kodu değişmez.

---

## 3. Fonksiyonel Gereksinimler (Functional Requirements - FR)

### 3.1 Sipariş Durum Makinesi (State Pattern)
* **FR-01 (Sıralı Durum Akışı):** Sipariş durumu yalnızca şu sırada ilerleyebilir:  
  $$\text{alındı} \longrightarrow \text{hazırlanıyor} \longrightarrow \text{hazır} \longrightarrow \text{yolda} \longrightarrow \text{teslim edildi}$$
* **FR-02 (Geçersiz Geçişlerin Kesin Reddi):** "Yolda" durumundaki bir sipariş geriye "hazırlanıyor" veya "alındı" durumuna alınamaz. Böyle bir istek geldiğinde sistem `InvalidOrderTransitionException` fırlatmalı ve HTTP `400 Bad Request` yanıtı vermelidir *(Sunum Kanıtı 1)*.
* **FR-03 (Koşullu İptal Yetkisi):** Müşteri yalnızca sipariş "alındı" aşamasındayken siparişi iptal edebilir. Restoran mutfakta yemeği "hazırlanıyor" aşamasına aldıktan sonra iptal butonu arayüzde kilitlenmeli, API üzerinden gelen istekler HTTP `400` ile reddedilmelidir.

### 3.2 Akıllı Kurye Atama Algoritması (Strategy Pattern & Haversine)
* **FR-04 (Haversine Küresel Mesafe Hesabı):** Dünya yarıçapı $R = 6371\text{ km}$ kabul edilerek restoran ile kurye arasındaki küresel büyük daire mesafesi `HaversineDistanceService` tarafından hesaplanmalıdır:
  $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
* **FR-05 (Ağırlıklı Kurye Puanlama Formülü):** Sistem müsait kuryeler arasından en uygun olanı şu formülle seçmelidir:
  $$\text{Puan} = \text{Mesafe (km)} + 2 \times \text{Aktif Sipariş Sayısı}$$
  *Kural:* En düşük puana sahip kurye seçilir.
* **FR-06 (Kurye Seçim Test Doğrulaması):** Yakında ama meşgul olan Kurye Ali ($0.71\text{ km}$, 2 sipariş $\rightarrow$ Puan: 4.71) yerine, daha uzakta ama boşta olan Kurye Veli ($1.26\text{ km}$, 0 sipariş $\rightarrow$ Puan: 1.26) seçilmelidir *(Sunum Kanıtı 2)*.
* **FR-07 (Müsait Kurye Yoksa Bekleme Kuyruğu):** Bölgede müsait kurye yoksa sistem `NoAvailableCourierException` fırlatmalı, sipariş hazır kuyruğunda bekletilmeli ve HTTP `409 Conflict` dönmelidir.

### 3.3 Veritabanı ve Atomik İşlemler (Repository & Unit of Work)
* **FR-08 (Asgari 7 Tablo):** Sistem ilişkisel 3NF şemasında en az 7 tablo barındırmalıdır: `users`, `restaurants`, `menu_items`, `orders`, `order_items`, `couriers`, `order_status_log`.
* **FR-09 (PDO Transaction Bütünlüğü):** Sipariş kaydı oluşturulurken `orders`, `order_items` ve `order_status_log` tablolarına yazma işlemi PDO `beginTransaction()`, `commit()` ve `rollBack()` bloğu içinde atomik olarak gerçekleştirilmelidir (`saveWithTransaction`).
* **FR-10 (Çoklu SQL JOIN):** Sipariş detayları; sipariş, müşteri, restoran, kurye ve menü kalemleri olmak üzere 5 tablo `JOIN` edilerek tek seferde çekilmelidir (`getOrderWithDetails`).
* **FR-11 (Eşzamanlı Kurye Seçimi Koruması):** İki siparişin aynı kuryeyi aynı anda kapmasını önlemek için kurye atamasında koşullu SQL UPDATE kullanılmalıdır:
  `UPDATE couriers SET active_orders_count = active_orders_count + 1 WHERE id = :id AND status = 'musait'`.

### 3.4 Kullanıcı Arayüzü ve Canlı Senkronizasyon (AJAX)
* **FR-12 (Sayfa Yenilemesiz Canlı Takip):** Müşteri canlı sipariş takip paneli, restoran durum güncellediğinde F5 yapılmaksızın 3 saniyelik AJAX polling ile anlık olarak güncellenmelidir *(Sunum Kanıtı 3)*.
* **FR-13 (Restoran Günlük Satış Raporu):** Restoran mutfak panelinde o gün teslim edilen siparişlerin toplam adedi ve toplam cirosu dinamik olarak raporlanmalıdır (`getDailySummary`).
* **FR-14 (Kota Gereksinimi):** Sistem en az 3 restoran ve toplamda en az 10 ürün içermelidir (Projemizde 7 restoran ve 27 ürün aktiftir).

---

## 4. Fonksiyonel Olmayan Gereksinimler (Non-Functional Requirements - NFR)

| Kod | Kategori | Gereksinim Açıklaması |
|---|---|---|
| **NFR-01** | **Performans** | AJAX durum sorgulamaları ve API yanıtları yerel veritabanında 200 ms altında yanıt vermelidir. Sık sorgulanan `status` sütunlarında indeks bulunmalıdır. |
| **NFR-02** | **Güvenlik** | Kullanıcı şifreleri veritabanında `password_hash` ile tutulmalı, SQL Enjeksiyonuna karşı tüm sorgularda PDO Prepared Statements kullanılmalıdır. |
| **NFR-03** | **Veri Bütünlüğü** | Veritabanında 3NF uygulanmalı, `orders` tablosunda kurye adı/koordinatı saklanmamalıdır (Foreign Key ve Cascade kuralları aktif olmalıdır). |
| **NFR-04** | **Taşınabilirlik** | Kod tabanı PSR-4 otomatik yükleme standardına uymalı, hiçbir dosyada `require_once` spagettisi bulunmamalıdır. |
| **NFR-05** | **Kullanılabilirlik** | Arayüz modern renk paleti, koyu/açık tema desteği, termal durum göstergeleri ve mobil uyumlu responsive ızgara yapısına sahip olmalıdır. |

---

## 5. Şartnamede İstenen 3 Zorunlu Kanıt Matrisi

| Kanıt No | Resmi Şartname Kriteri | Sistemdeki Teknik Çözüm | Otomatik Test Dosyası |
|:---:|---|---|---|
| **Kanıt 1** | Geçersiz durum geçişinin reddi (Yolda $\rightarrow$ Hazırlanıyor engeli) | `OnWayState` ve `OrderStateMachineService` HTTP 400 döner. | `tests/verify_system.py::test_proof_1` |
| **Kanıt 2** | İki kurye arasında doğru seçimi gösteren birim testi | Haversine + iş yükü formülüyle Kurye Veli (Puan: 1.26) seçilir. | `tests/verify_system.py::test_proof_2` |
| **Kanıt 3** | Müşteri panelinin sayfa yenilemeden güncellenmesi | `public/js/state.js` ve AJAX polling mekanizması. | Canlı Web Arayüzü & Playwright Testi |

---

## 6. Risk Tablosu ve Önlem Planı

| Risk No | Risk Tanımı | Olasılık | Etki | Teknik Önlem Planı |
|:---:|---|:---:|:---:|---|
| **R-1** | **Race Condition (Kurye Çakışması):** İki siparişin aynı anda aynı kuryeye atanması | Yüksek | Yüksek | Koşullu SQL `UPDATE couriers SET active_orders_count = active_orders_count + 1 WHERE id = :id AND status = 'musait'` ve PDO Transaction. |
| **R-2** | **Durum İhlali:** Yetkisiz sırayla durum atlatma isteği gönderilmesi | Yüksek | Yüksek | State Deseni ile `InvalidOrderTransitionException` fırlatılması ve HTTP 400 yanıtı. |
| **R-3** | **Erken/Geç İptal Riski:** Mutfak yemeği pişirirken müşterinin siparişi iptal etmesi | Orta | Yüksek | `PreparingState` aşamasından itibaren iptal yetkisinin hem arayüzde hem API'de kilitlenmesi. |
| **R-4** | **Kurye Havuzunun Tükenmesi:** Yoğun saatte müsait kurye kalmaması | Orta | Yüksek | Siparişin hazır kuyruğunda bekletilmesi (`409 Conflict`), ilk teslimatla birlikte otomatik tetiklenmesi. |
| **R-5** | **Mimari İhlal (Katman Atlama):** Controller içine SQL yazılması veya Serviste HTML üretilmesi | Yüksek | Orta | Katman sorumluluk tablosunun uygulanması ve Interface soyutlaması. |
| **R-6** | **AJAX Sunucu Yükü:** Sık sorguların SQLite veritabanını kilitlemesi | Orta | Orta | Polling aralığının 3-5 saniyeye çekilmesi ve sadece hafif durum kontrolü yapılması. |
