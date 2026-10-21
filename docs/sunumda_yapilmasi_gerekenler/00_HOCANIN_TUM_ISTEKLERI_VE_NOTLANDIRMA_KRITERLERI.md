# GustoGo — Yemek Sipariş ve Kurye Takip Sistemi
## Hocanın Tüm İstekleri, Notlandırma Kriterleri ve Değerlendirme Rehberi

Bu belge, **PHP Programlama – Tasarım ve Mimari (Hafta 3 / 4)** dersi kapsamında dersin öğretim üyesinin (hocanın) projeden ve sunumdan **birebir istediği tüm maddeleri**, **değerlendirme kriterlerini** ve **not kırma noktalarını** eksiksiz olarak içermektedir.

---

### 🎯 1. Hocanın Ana Beklentisi ve Dersin Amacı

Hoca bu aşamada çalışan tam bir frontend/backend yazılımından ziyade **doğru bir yazılım mimarisi kurgulanmasını**, **katmanların birbirinden izole edilmesini**, **tasarım desenlerinin doğru yerde kullanılmasını** ve **bu mimarinin sunumda 7 dakika içinde akademik/teknik bir dille savunulabilmesini** istemektedir.

> **Hocanın Temel Felsefesi:**  
> *"Kod yazmak kolaydır; önemli olan değişime dirençli, katmanları birbirine karışmayan, test edilebilir ve nesne yönelimli prensiplere (SOLID) uygun bir mimari kurmaktır."*

---

### 📌 Resmi Proje Şartnamesi (9. Yemek Sipariş ve Kurye Takip)

Dersin resmi şartname tablosu ve projedeki karşılıkları aşağıdadır:

| Alan | Resmi Şartname İçeriği | Projedeki Somut Karşılığı |
|---|---|---|
| **Zorluk** | 4 / 5 | İleri seviye durum makinesi ve optimizasyon |
| **Yapılacaklar** | Müşteri restoran menüsünden sipariş verir; restoran siparişi hazırlar; kurye atanır ve teslim eder. Üç rolün de kendi paneli vardır. | Müşteri, Restoran, Kurye ve Yönetici için 4 bağımsız panel (`public/index.html`) |
| **Çekirdek problem** | **Sipariş durum makinesi** (alındı ➔ hazırlanıyor ➔ hazır ➔ yolda ➔ teslim edildi; iptal) ve geçersiz geçişlerin engellenmesi (yolda olan sipariş "hazırlanıyor"a dönemez); **kurye atama algoritması:** müsait kuryeler arasından siparişe mesafe ve mevcut iş yüküne göre en uygun olanın seçilmesi. | `src/Service/OrderStateMachineService.php` (State Pattern), `src/Service/State/*`, `src/Service/CourierAssignmentService.php`, `src/Service/Courier/ScoreBasedAssignmentStrategy.php` |
| **Zorunlu özellikler** | 3 rol (müşteri, restoran, kurye) ve yönetici; en az 3 restoran ve toplam 10 ürün; sepet; her rolün paneli durum değişince otomatik yenilenir (AJAX); tahmini teslim süresi; sipariş geçmişi; restoranın günlük sipariş raporu. | 4 rol paneli; 7 restoran, 27 ürün; sepet; AJAX reaktif durum yenileme; dinamik tahmini süre (25-35 dk); geçmiş siparişler; `SqliteOrderRepository::getDailyReport()` |
| **PHP özellikleri** | State deseni, PHP 8.1 enum (sipariş durumu), mesafe hesabı (Haversine), AJAX, PDO ve transaction, JOIN, rol bazlı yetkilendirme. | - State Deseni (`App\Service\State`)<br>- Enum: `App\Enum\OrderStatus`<br>- Haversine: `App\Service\HaversineDistanceService`<br>- AJAX: `public/api.php`<br>- PDO & Transaction: `saveWithTransaction()`<br>- SQL JOIN: `getOrderWithDetails()`, `getCustomerOrdersWithJoin()`<br>- RBAC: `OrderController::changeStatus()` |
| **Asgari tablolar** | `users`, `restaurants`, `menu_items`, `orders`, `order_items`, `couriers`, `order_status_log` (en az 6 tablo) | 7 Tablolu ilişkisel şema (`database/schema.sql` ve `database/app.sqlite`) |
| **Kapsam sınırı** | Harita servisi, canlı konum takibi ve ödeme yok; konumlar sabit koordinat veya mahalle olarak tutulur. | Dış harita API veya ödeme gateway'i yoktur; Kadıköy, Beşiktaş vb. sabit mahalle koordinatları ve 2D şematik ızgara kullanılır. |
| **Sunumda kanıt** | 1. Geçersiz durum geçişinin reddi;<br>2. İki kurye arasında doğru seçimi gösteren birim testi;<br>3. Müşteri panelinin sayfa yenilemeden güncellenmesi. | Sunumda ve arayüzde tek tıkla çalıştırılan **3 Canlı Kanıt Merkezi** (`tests/CoreLogicTest.php`, `tests/verify_system.py`, UI Modal) |

---

* **Toplam Sunum Süresi:** 7 Dakika (Kesinlikle aşılmamalıdır!)
* **Soru - Cevap:** 3 - 5 Dakika
* **Ekip Rol Dağılımı (4 Kişi):**
  1. **Proje Yöneticisi (Mustafa Güreşir - @mustafaguresir):** 1,5 Dakika
  2. **Yazılım Mimarı:** 2,0 Dakika
  3. **Veritabanı ve Test Sorumlusu:** 2,0 Dakika
  4. **Arayüz ve Dokümantasyon Sorumlusu:** 1,5 Dakika
* **Kural:** Her grup üyesi kendi alanını anlatmalı, kimse diğerinin alanına müdahale etmemeli veya suskun kalmamalıdır.

---

### 📑 3. Hocanın İstediği 8 Zorunlu Bölüm (Tasarım Belgesi Kapsamı)

Hoca aşağıdaki 8 bölümün tasarım dokümanında ve sunumda eksiksiz yer almasını şart koşmaktadır:

#### Bölüm 1: Proje Vizyonu, Çekirdek Problem ve Kullanıcı Hikâyeleri
* **Proje Vizyonu:** Ne yapıyoruz? (Akıllı kurye dağıtımlı, durum makineli yemek sipariş platformu).
* **Çekirdek Problem:** Restoran yemeği "Hazır" yaptığında bölgedeki en uygun kuryenin Manhattan geometrisi ve anlık iş yüküyle seçilerek atanması.
* **4 Kullanıcı Rolü (RBAC):**
  1. `customer` (Müşteri)
  2. `restaurant` (Restoran / Mutfak Yetkilisi)
  3. `courier` (Kurye)
  4. `admin` (Sistem Yöneticisi)
* **3 Ana Kullanıcı Hikâyesi (User Story):**
  1. *Müşteri Hikâyesi:* Ürün seçme, sepet, adres koordinatı ve canlı 5 aşamalı sipariş takibi.
  2. *Restoran Hikâyesi:* Mutfak ekranında siparişi görme, "Hazırlanıyor" ve "Hazır" yapma, günlük ciro.
  3. *Kurye Hikâyesi:* Kendisine atanan siparişi teslim alma ("Yolda"), müşteriye teslim etme ("Teslim Edildi").

#### Bölüm 2: Katmanlı Mimari Şeması ve Katman Kuralları
* **Katman Sıralaması:**  
  `public/index.php (Front Controller) → Router → Controller → Service → Repository → Model/Database`
* **Katman Kuralları (Hocanın en çok kontrol edeceği yer!):**
  * Router iş kuralı veya SQL içermez.
  * Controller **kesinlikle SQL sorgusu yazmaz**, hesaplama yapmaz; sadece isteği doğrular, servisi çağırır, JSON veya View döner.
  * Service katmanı HTTP (`$_POST`, `$_GET`) ile ilgilenmez, saf iş mantığı ve algoritmaları çalıştırır.
  * Repository katmanı veritabanı sorgularını soyutlar; iş kuralı barındırmaz.
  * Model sınıfları sadece veri taşıyıcıdır (Entity), SQL çalıştırmaz.
* **Hocanın Zorunlu Kontrol Sorusu:**  
  *"Veritabanını SQLite'tan MySQL veya PostgreSQL'e geçirirsek hangi dosyalar değişir?"*  
  👉 **Cevap:** Yalnızca `src/Repository/` altındaki somut repository sınıfları (`SqliteOrderRepository.php` vb.) değişir. Controller, Service, Model sınıfları ve durum makinesi arayüzlere (`Interface`) bağımlı olduğu için tek satır kod bile değişmez.

#### Bölüm 3: Sınıf Diyagramı (Class Diagram - En Az 12 Sınıf)
* Sistemde **en az 12 adet sınıf ve arayüz** bulunmalıdır.
* Katman atlama kesinlikle yasaktır (Örn: Controller doğrudan Repository'ye bağlanamaz, araya Service girmelidir).
* Arayüzler (`OrderStateInterface`, `AssignmentStrategyInterface`, `OrderRepositoryInterface`, vb.) ve kalıtım/gerçekleme (`implements`, `extends`) okları doğru çizilmelidir.

#### Bölüm 4: Sıralama Diyagramı (Sequence Diagram - Çekirdek Akış)
* Çekirdek akışı göstermelidir: Restoran Şefi `POST /orders/mark-ready` isteği gönderir.
* `OrderStateMachineService` mevcut durumu kontrol eder.
* `CourierAssignmentService` en uygun kuryeyi hesaplar ($Puan = Mesafe + 2 \times AktifSipariş$).
* **Zorunlu 2 Hata Dalı (alt / else blokları):**
  1. *Geçersiz Durum Geçişi:* Örneğin sipariş `alındı` iken doğrudan `hazır` yapılmak istenirse `InvalidOrderTransitionException` fırlatılır (HTTP 400).
  2. *Müsait Kurye Bulunamaması:* Bölgede boş kurye yoksa `NoAvailableCourierException` fırlatılır, sipariş kuyrukta beklemeye alınır (HTTP 409 / Uyarı).
* Koşullu UPDATE (`updateStatusConditional`) ile veritabanına yansıtılır.

#### Bölüm 5: ER Diyagramı ve 3NF Normalizasyon Analizi
* **7 Tablo:** `users`, `restaurants`, `menu_items`, `orders`, `order_items`, `couriers`, `order_status_log`.
* **1NF:** Atomik sütunlar (siparişteki ürünler tek hücrede metin değil, `order_items` tablosunda ayrı satırlar).
* **2NF:** Kısmi bağımlılık yok, her satır kendi birincil anahtarına (`id`) tam fonksiyonel bağımlı.
* **3NF:** Geçişli bağımlılık yok (`orders` tablosunda kuryenin veya müşterinin adı, telefonu tutulmaz; sadece `courier_id` ve `customer_id` tutulur. Kurye konumu değiştiğinde sipariş tablosu bozulmaz).

#### Bölüm 6: Tasarım Desenleri (Design Patterns) ve Alternatifleri
Hoca desenlerin neden seçildiğini ve alternatiflerinin neden elendiğini mutlaka sorar:
1. **State Pattern (Durum Deseni):**
   * *Neden:* Sipariş adımları (`alındı → hazırlanıyor → hazır → yolda → teslim edildi`) ve iptal kuralını (`hazırlanıyor`dan sonra iptal yasaktır) nesne düzeyinde kapsüllemek.
   * *Alternatifi Neden Elendi:* Controller veya Serviste iç içe onlarca `switch-case` ve `if-else` yazmak kodu kırılgan ve spagetti yapar; yeni durum eklendiğinde mevcut kodları bozar (Open/Closed Principle ihlali).
2. **Strategy Pattern (Strateji Deseni):**
   * *Neden:* Kurye seçim formülünü ($Mesafe + 2 \times Aktif$) çalışma anında (runtime) veya simülasyonda bağımsız değiştirebilmek.
   * *Alternatifi Neden Elendi:* Algoritmayı servisin içine gömmek esnekliği yok eder; farklı atama politikaları (en yüksek puanlı kurye, sadece en yakın kurye) test edilemez.
3. **Repository Pattern (Veri Deposu Deseni):**
   * *Neden:* Veritabanı motorunu iş mantığından izole etmek, Mock nesnelerle kolay birim test yazabilmek.

#### Bölüm 7: Arayüz Taslakları (Wireframes) ve Sayfa Haritası
* **5 Adet Ekran Çizimi:**
  1. Müşteri Restoran Menüsü ve Sepet Ekranı
  2. Müşteri Canlı Sipariş Takip Ekranı (5 aşamalı stepper + iptal kuralı)
  3. Restoran Mutfak ve Sipariş Yönetim Ekranı (Hazırlanıyor / Hazır butonları, günlük ciro)
  4. Kurye Teslimat Paneli (Görevler, Manhattan mesafe dökümü, teslim onay butonu)
  5. Yönetici Kontrol Merkezi (30x30 şehir haritası, filo iş yükü, audit günlüğü)
* **Sayfa Haritası (Page Map):** Rol bazlı ekran akışını gösteren akış şeması.

#### Bölüm 8: Risk Matrisi, GitHub Backlog ve AI Günlüğü
* **En az 6 Risk:** Race Condition (eşzamanlı kurye kapma), geçersiz durum ihlali, hazırlanan yemeğin haksız iptali, müsait kurye kalmaması, AI mimari kural ihlali, AJAX sunucu yükü.
* **GitHub Projects:** Backlog, Bu Hafta, Devam Eden, İncelemede, Bitti sütunları.
* **Yapay Zekâ Kullanım Günlüğü:** Hangi araç kullanıldı, ne soruldu, alınan çıktı mimariye nasıl uyarlandı.

---

### ⚠️ 4. Hocanın En Çok Not Kırdığı Noktalar (Dikkat Edilmesi Gerekenler)

1. **Katman Atlama:** Controller'ın doğrudan Repository veya Model veritabanı metodunu çağırması. (Kesinlikle Service katmanı üzerinden geçmelidir).
2. **Süre Aşımı:** 7 dakikayı geçen grupların sözünün kesilmesi ve puan kırılması.
3. **"Neden Bu Deseni Seçtiniz?" Sorusuna Cevap Verememek:** "Daha havalı olduğu için" demek yerine "Open/Closed prensibi gereği, if-else bloklarını bertaraf etmek ve her durumun geçiş kurallarını kendi sınıfında kapsüllemek için" denmelidir.
4. **Veritabanında 3NF İhlali:** Sipariş tablosunda kurye adı veya restoran adresi saklamak.
5. **Diyagramlarda Hata Dalı Unutulması:** Sequence diyagramında yalnızca mutlu yolun (happy path) çizilip "hata olduğunda ne olur?" dallarının çizilmemesi.
