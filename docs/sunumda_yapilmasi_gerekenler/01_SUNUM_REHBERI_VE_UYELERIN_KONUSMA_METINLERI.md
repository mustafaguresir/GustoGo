# GustoGo — Yemek Sipariş ve Kurye Takip Sistemi
## Sunum Rehberi, Dakika Dakika Konuşma Metinleri ve Soru-Cevap Taktikleri

> ⏱️ **Kritik Kural:** Toplam sunum süresi **7 Dakika (420 Saniye)** ile sınırlıdır. Bu süreyi aşmamak için aşağıdaki metinleri prova ederek birebir uygulayınız.

---

### 🎙️ 1. ÜYE: PROJE YÖNETİCİSİ (Mustafa Güreşir - @mustafaguresir)
* **Süre:** 1,5 Dakika (00:00 – 01:30)
* **Sorumlu Olduğu Alanlar:** Proje Vizyonu, Çekirdek Problem, Kullanıcı Rolleri ve 3 Ana Kullanıcı Hikâyesi.

#### 📢 Konuşma Metni:
> *"Sayın Hocam ve değerli arkadaşlar, merhabalar.  
> Ben Mustafa Güreşir, GustoGo projesinin proje yöneticisiyim.  
> 
> Bugün sizlere, katmanlı mimari ve modern tasarım desenleriyle geliştirdiğimiz **Yemek Sipariş ve Akıllı Kurye Takip Sistemi**mizi sunacağız.
> 
> **Vizyonumuz:** Yemek siparişi sürecinde yaşanan gecikmeleri, sipariş iptallerindeki restoran mağduriyetlerini ve kuryeler arasındaki dengesiz iş dağılımını matematiksel ve mimari kurallarla çözmektir.
> 
> **Çekirdek Problemimiz:** Restoran siparişi hazırladığında; kuryenin restorana mesafesi ile üzerindeki mevcut iş yükünü birlikte ele alarak en optimum kuryeyi adil bir şekilde atamaktır. Şartname gereğince mesafeyi küresel koordinatlar üzerinde **Haversine Formülü** ile hesaplıyoruz. Kurye seçim formülümüz: **Puan = Haversine Mesafesi (km) + 2 × Aktif Sipariş İş Yükü**.
> 
> Sistemimizde **Rol Tabanlı Yetkilendirme (RBAC)** ile 4 ana rol tanımladık:
> 1. **Müşteri:** Sepet oluşturur, adresini seçer ve canlı 5 aşamalı sipariş takibi yapar.
> 2. **Restoran:** Mutfak kuyruğunu yönetir, siparişi hazırlar ve günlük cirosunu takip eder.
> 3. **Kurye:** Üzerine atanan paketi teslim alır, rotayı izler ve teslim eder.
> 4. **Yönetici:** Tüm kurye filosunu, şehir ızgarasını ve denetim loglarını canlı izler.
> 
> **3 Ana Hikâyemiz:** Müşteri siparişi verir (Alındı) ➔ Restoran mutfağa alır (Hazırlanıyor) — *bu andan sonra iptal kesinlikle kilitlenir* — ➔ Restoran 'Hazır' dediği an otomatik kurye atanır (Yolda) ➔ Kurye paketi teslim eder (Teslim Edildi).
> 
> Şimdi sistemimizin katmanlı mimarisini ve nesne yönelimli tasarım desenlerini anlatmak üzere sözü Yazılım Mimarımıza devrediyorum."*

---

### 🏛️ 2. ÜYE: YAZILIM MİMARI
* **Süre:** 2,0 Dakika (01:30 – 03:30)
* **Sorumlu Olduğu Alanlar:** Katmanlı Mimari Şeması, Katman Kuralları, Kontrol Sorusu, Sınıf Diyagramı (12+ Sınıf), State ve Strategy Desenleri ve Alternatifleri.

#### 📢 Konuşma Metni:
> *"Merhabalar Hocam, ben grubun Yazılım Mimarısı.  
> 
> Sistemimizin omurgasını, katı kurallara bağlı **Katmanlı Mimari (Layered Architecture)** prensibi oluşturmaktadır.
> İstek akışımız:  
> `public/index.php (Front Controller) ➔ Router ➔ Controller ➔ Service ➔ Repository ➔ Model/Database` şeklindedir.
> 
> **Katman Sorumluluk İlkelerimiz:**
> - Controller katmanımız **asla ve asla SQL sorgusu yazmaz**, hesaplama yapmaz. Yalnızca gelen HTTP isteğini doğrular, iş servisini tetikler ve yanıt döner.
> - Service katmanımız iş kurallarımızı, algoritmamızı ve durum makinesini barındırır.
> - Repository katmanımız veritabanı işlemlerini soyutlar.
> - Model katmanımız ise saf veri taşıyıcı (Entity) sınıflarıdır.
> 
> **Hocam, kılavuzdaki kontrol sorusuna değinmek gerekirse:**  
> *'Yarın SQLite yerine PostgreSQL veya MySQL'e geçersek hangi dosyalar değişir?'*  
> Sadece ve sadece `src/Repository/` altındaki somut sınıflarımız değişir. Controller, Service ve durum makinemiz `OrderRepositoryInterface` arayüzüne bağımlı olduğu için mimarimizdeki tek bir satır iş kodu bile değişmez.
> 
> **Sınıf Diyagramımız:**  
> Kılavuz gereği 12'den fazla sınıf modelledik. Controller, Service, Repository ve State sınıflarımız arasındaki bağımlılık yönleri kesinlikle yukarıdan aşağıyadır; katman atlama yasaktır.
> 
> **Neden Tasarım Desenleri Kullandık?**
> 1. **State Deseni:** Siparişin `alındı ➔ hazırlanıyor ➔ hazır ➔ yolda ➔ teslim edildi` akışını yönetir. Alternatif olarak iç içe `switch-case` veya `if-else` yazabilirdik; fakat bu kod spagettiye döner ve yeni bir durum eklenemezdi. State deseni ile her durum kendi geçiş kuralını ve iptal kısıtını kendi içinde kapsülledi (Encapsulation).
> 2. **Strategy Deseni:** Kurye atama algoritmasını `AssignmentStrategyInterface` arkasına aldık. Böylece çalışma anında veya simülasyon testlerinde mesafeye dayalı, puan odaklı veya farklı bir atama stratejisini sisteme tek satırda enjekte edebiliyoruz.
> 
> Şimdi çekirdek akışımızın sıralama diyagramını ve veritabanı mimarisini aktarmak üzere sözü Veritabanı ve Test Sorumlumuza bırakıyorum."*

---

### 🗄️ 3. ÜYE: VERİTABANI VE TEST SORUMLUSU
* **Süre:** 2,0 Dakika (03:30 – 05:30)
* **Sorumlu Olduğu Alanlar:** Sıralama Diyagramı, PDO Transaction, Çoklu JOIN, 3NF Normalizasyon Analizi ve Hocanın İstediği 3 Zorunlu Kanıt.

#### 📢 Konuşma Metni:
> *"Merhabalar Hocam, ben projenin Veritabanı ve Test Sorumlusuyum.  
> 
> **Sıralama Diyagramımız (Sequence Diagram):**  
> Projemizin en kritik senaryosu; restoranın mutfakta siparişi `HAZIR` butonuna basması anıdır:
> 1. `RestaurantController` isteği alır ve `OrderStateMachineService`'e iletir.
> 2. Servis mevcut durumun `HAZIRLANIYOR` olduğunu doğrular.
>    * **Hata Dalı 1:** Eğer sipariş sırasız bir durumda ise (örneğin henüz `ALINDI` aşamasındaysa) `InvalidOrderTransitionException` fırlatılır ve işlem HTTP 400 ile engellenir.
> 3. Durum geçerliyse, `CourierAssignmentService` bölgedeki müsait kuryeleri çeker.
>    * **Hata Dalı 2:** Eğer bölgede hiç boş kurye yoksa `NoAvailableCourierException` fırlatılır, sipariş kuyrukta bekletilir ve restorana uyarı verilir.
> 4. Başarılı dalda: Haversine mesafesi ve iş yüküyle en düşük skora sahip kurye seçilir.
> 5. Koşullu UPDATE (`updateStatusConditional`) ile durum veritabanında atomik olarak `HAZIR` yapılır, kurye atanır ve kuryenin iş yükü 1 artırılır.
> 
> **Veritabanı, PDO Transaction ve Çoklu JOIN Analizimiz:**  
> Sistemimizde 7 ilişkisel tablo bulunmaktadır:
> - **PDO Transaction:** Sipariş oluştururken; `orders`, `order_items` ve `order_status_log` tabloları tek bir atomik transaction içinde işlenir (`saveWithTransaction`). Hata durumunda rollBack yapılarak veri tutarlılığı güvenceye alınır.
> - **Çoklu JOIN Sorguları:** `getOrderWithDetails` metodumuzda `orders`, `restaurants`, `users`, `couriers` ve `order_items` olmak üzere 5 tablo `INNER JOIN` ve `LEFT JOIN` ile tek sorguda birleştirilir.
> - **3NF:** Geçişli bağımlılıklar tamamen engellenmiştir. `orders` tablosunda kuryenin veya restoranın adresi, telefonu tutulmaz; yalnızca ID'leri tutulur.
> 
> **HOCANIN ŞARTNAMEDE İSTEDİĞİ 3 ZORUNLU KANIT:**  
> Canlı sunumumuzda 3 kritik kanıtı hocamızın huzurunda sergiliyoruz:  
> 1. **Geçersiz Durum Geçişinin Reddi:** 'Yolda' olan bir sipariş 'hazırlanıyor'a veya 'iptal'e çekilmeye çalışıldığında sistem HTTP 400 ile işlemi reddetmekte ve veritabanını korumaktadır.  
> 2. **İki Kurye Arasında Doğru Seçim Birim Testi:** Kurye 1 (Ali - 0.71 km, 2 aktif sipariş, Skor: 4.71) daha yakın olmasına rağmen, Kurye 2 (Veli - 1.26 km, 0 aktif sipariş, Skor: 1.26) iş yükü boş olduğu için algoritma tarafından başarıyla seçilmektedir.  
> 3. **Müşteri Panelinin Sayfa Yenilemeden Güncellenmesi:** Restoran mutfakta durumu 'Hazırlanıyor' yaptığı anda, müşteri paneli F5 yapılmadan AJAX senkronizasyonuyla anında güncellenmektedir.
> 
> Şimdi arayüz taslaklarımızı ve risk matrisimizi sunmak üzere sözü Arayüz ve Dokümantasyon Sorumlumuza bırakıyorum."*

---

### 🎨 4. ÜYE: ARAYÜZ VE DOKÜMANTASYON SORUMLUSU
* **Süre:** 1,5 Dakika (05:30 – 07:00)
* **Sorumlu Olduğu Alanlar:** 5 Adet Ekran Taslağı (Wireframes), Sayfa Haritası, Risk Matrisi, GitHub Backlog ve AI Günlüğü.

#### 📢 Konuşma Metni:
> *"Merhabalar Hocam, ben Arayüz ve Dokümantasyon Sorumlusuyum.  
> 
> Sistemimizin sayfa haritasını rol bazlı ve ayrık olarak kurguladık. Kullanıcı yetkisine göre 5 temel ekran taslağı hazırladık:
> 
> 1. **Müşteri Menü ve Sepet Ekranı:** Restoran menüsü, kategori filtreleme, dinamik sepet hesabı ve teslimat koordinat seçimi.
> 2. **Canlı Takip Ekranı:** 5 aşamalı görsel durum çizelgesi. Sipariş henüz 'alındı' durumundayken iptal butonu aktiftir; 'hazırlanıyor'a geçtiğinde iptal kilitlenir.
> 3. **Restoran Mutfak Paneli:** Canlı kuyruk; şef tek tıkla 'Hazırlanıyor' ve 'Hazır' butonlarını tetikler. Ayrıca günlük satış ve ciro özetini görür.
> 4. **Kurye Görev Paneli:** Üzerine düşen siparişin restoran ve müşteri konumlarını Manhattan rotası olarak görür; 'Yola Çıktım' ve 'Teslim Ettim' durumlarını günceller.
> 5. **Yönetici Kontrol Merkezi:** 30x30 şehir ızgara haritasında kuryelerin anlık konumlarını, aktif teslimat sayılarını ve `order_status_log` denetim tarihçesini izler.
> 
> **Risk Matrisimizden 2 Kritik Madde:**
> - **Race Condition Riski:** İki siparişin aynı anda aynı kuryeye atanması riskini, veritabanında koşullu `UPDATE couriers SET active_orders_count = active_orders_count + 1 WHERE id = :id AND status = 'musait'` sorgusu ve Transaction ile engelledik.
> - **Erken İptal Riski:** Mutfak masrafını korumak için, 'Hazırlanıyor' durumundaki bir siparişin iptal isteği API düzeyinde HTTP 400 ile engellenmektedir.
> 
> **GitHub Proje Yönetimi ve AI Günlüğü:**  
> Projemizi GitHub Projects üzerinde 5 sütunlu Kanban panosu ile yönettik. Yapay zekâ araçlarını ise mimari ihlalleri denetlemek ve 3NF normalizasyon formüllerini doğrulamak amacıyla kullandık ve bunu belgemizde kayıt altına aldık.
> 
> Bizi dinlediğiniz için teşekkür ederiz. Sorularınızı yanıtlamaktan memnuniyet duyarız."*

---

### 🧠 5. HOCANIN SORABİLECEĞİ 10 TUZAK SORU VE NOKTA ATIŞI CEVAPLAR

| # | Hocanın Sorabileceği Soru | Verilecek Kusursuz Cevap |
| :-: | :--- | :--- |
| **1** | *"Controller'ın içine neden doğrudan SQL sorgusu yazmadınız, ne fark eder?"* | *"Hocam, Separation of Concerns (Sorumlulukların Ayrılması) prensibi gereği. Controller sadece HTTP istek/yanıt döngüsünü yönetir. SQL yazılırsa Controller veritabanı motoruna sıkı sıkıya bağlanır, birim test (Unit Test) yazılamaz ve iş mantığı Controller'a sızar."* |
| **2** | *"Veritabanını SQLite'tan MySQL'e geçirirsek ne değişir?"* | *"Yalnızca `src/Repository/` altındaki somut repository sınıfları (`SqliteOrderRepository.php` vb.) değişir. Controller, Service ve State sınıfları `OrderRepositoryInterface`'e bağımlı olduğu için tek satır kod değişmez."* |
| **3** | *"Neden State Tasarım Deseni kullandınız? `switch-case` ile yapılamaz mıydı?"* | *"Hocam, `switch-case` ile yapılabilirdi ancak bu Open/Closed prensibini ihlal ederdi. Yeni bir durum (örneğin 'İade Edildi') geldiğinde mevcut tüm `switch` bloklarını değiştirmek gerekirdi. State deseni sayesinde her durum kendi geçiş kuralını ve iptal kısıtını kendi içinde kapsüller."* |
| **4** | *"Neden Öklid (Kuş uçuşu) mesafesi değil de Manhattan mesafesi kullandınız?"* | *"Hocam, kuryeler binaların üzerinden uçarak gidemez. Şehir sokakları dikey ve yatay ızgara (Manhattan Grid) düzenindedir. Bu nedenle sokak mesafesini en gerçekçi simüle eden metrik $\|x_1 - x_2\| + \|y_1 - y_2\|$ Manhattan formülüdür."* |
| **5** | *"Kurye puanlama formülündeki $2 \times AktifSipariş$ ne işe yarıyor?"* | *"Hocam, sadece mesafeye baksaydık en yakındaki kuryeye 5 sipariş birden yığılır, kurye tıkanırdı. Aktif sipariş katsayısı bir 'ceza puanı' (workload penalty) ekleyerek iş yükünü filodaki diğer müsait kuryelere adil şekilde dağıtır."* |
| **6** | *"Veritabanınız gerçekten 3NF'ye uygun mu? Bir örnek verin."* | *"Evet Hocam. Örneğin `orders` tablosunda kuryenin adı, telefonu veya restoranın koordinatları saklanmaz. Sadece `courier_id` ve `restaurant_id` tutulur. Böylece kurye adını veya koordinatını güncellediğinde sipariş kayıtlarında güncelleme anomalisi yaşanmaz."* |
| **7** | *"İki sipariş aynı anda 'Hazır' olursa ikisi de aynı kuryeyi seçerse ne olur (Race Condition)?"* | *"Repository katmanında Koşullu UPDATE (`UPDATE couriers ... WHERE id = :id AND active_orders_count = :old_count`) ve Transaction kullanıyoruz. İlk sipariş kuryeyi aldığında kuryenin iş yükü artar; ikinci istek koşul tutmadığı için başarısız olur ve algoritma bir sonraki en iyi kuryeyi seçer."* |
| **8** | *"Müşteri yemeği yoldayken iptal etmeye çalışırsa sistem nasıl tepki verir?"* | *"State deseni gereği `OnWayState` sınıfında `canCancel()` metodu `false` döner. Servis `DomainException` fırlatır, Controller müşteriye HTTP 400 döner ve işlem veritabanına yansıtılmaz."* |
| **9** | *"Bölgede hiç müsait kurye yoksa sipariş kaybolur mu?"* | *"Hayır Hocam. Sıralama diyagramımızın 2. hata dalında gösterdiğimiz gibi sistem `NoAvailableCourierException` fırlatır. Sipariş `HAZIR` durumunda bekleme kuyruğunda kalır ve ilk kurye boşa çıktığı an tetiklenen olayla atanır."* |
| **10**| *"Yapay zekâyı bu projede nasıl kullandınız?"* | *"Hocam yapay zekâyı kod yazdırmak için değil; mimari kurallarımızı denetletmek, katman ihlali olup olmadığını kontrol etmek ve 3NF normalizasyon tablolarını doğrulamak için bir danışman olarak kullandık ve AI günlüğümüzde belgeledik."* |
