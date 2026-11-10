# GustoGo — Aşama 2 Süreç Raporu (2–4 Sayfa Akademik Rapor)

**Ders:** PHP Programlama – Tasarım ve Mimari (Güz Dönemi)  
**Proje Adı:** GustoGo — Yemek Sipariş ve Akıllı Kurye Atama Sistemi  
**Grup:** GustoGo Ekibi (Mustafa Güreşir, Yazılım Mimarı, Veritabanı ve Test Sorumlusu, Arayüz Sorumlusu)  
**Aşama:** Aşama 2 (Veritabanısız Çalışan Prototip)

---

## 1. Proje Tanımı ve Çekirdek Problem

### 1.1. Proje Ne Yapıyor?
**GustoGo**, yemek siparişi veren müşteriler, siparişi mutfakta hazırlayan restoranlar ve siparişi adrese ulaştıran kuryeler arasındaki döngüyü katı iş kuralları ve optimizasyon algoritmalarıyla yöneten web tabanlı bir platformdur. Sistem; müşteri sepeti, canlı 5 aşamalı durum takibi, restoran mutfak yönetim ekranı (KDS) ve kurye lojistik panelinden oluşur.

### 1.2. Çekirdek Problemimiz Nedir?
Projemizin ayırt edici ve zor olan iki çekirdek problemi bulunmaktadır:
1. **Sipariş Durum Makinesi Bütünlüğü (State Machine Integrity):**  
   Sipariş durumları (`alindi ➔ hazirlaniyor ➔ hazir ➔ yolda ➔ teslim_edildi`) tek yönlü ve sıralı bir otomat olarak çalışmalıdır. Restoran yemeği pişirmeye başladığında (`hazirlaniyor`) müşterinin siparişi keyfi iptal etmesi engellenmelidir; aynı şekilde kuryeye verilen (`yolda`) bir siparişin sistem hatasıyla geriye "hazırlanıyor" veya "alındı" durumuna döndürülmesi kesinlikle engellenmelidir.
2. **Akıllı ve Adil Kurye Atama Optimizasyonu:**  
   Restoran yemeği hazır ettiğinde, sadece en yakın kuryeyi seçmek kuryeler arasında adaletsizliğe ve teslimat gecikmelerine yol açar. Sistemimiz **Haversine Büyük Daire Küresel Mesafesi** ile kuryenin anlık iş yükünü harmanlar:
   $$\text{Puan} = \text{Haversine Mesafesi (km)} + 2 \times \text{Aktif Sipariş Sayısı}$$
   En düşük puana sahip kurye seçilerek hem mesafesi yakın hem de iş yükü boş olan kurye adil bir şekilde atanır.

---

## 2. Aşama 2 Haftalık İş Özeti ve Görev Dağılımı

| Hafta | Yapılan İşler | Sorumlu Üye | Çıktı / Dosyalar |
| :--- | :--- | :--- | :--- |
| **5. Hafta** | Aşama 1 tasarımının incelenmesi; JSON dosya tabanlı mimariye geçiş planı; `storage/` klasör yapısı ve `JsonStorageHelper` flock kilit mekanizmasının kurulması. | **Yazılım Mimarı** | `src/Storage/JsonStorageHelper.php`, `composer.json` |
| **6. Hafta** | `UserRepositoryInterface`, `OrderRepositoryInterface`, `RestaurantRepositoryInterface`, `CourierRepositoryInterface` arayüzlerinin ve somut JSON sınıflarının kodlanması; `bin/seed.php` başlangıç veri yükleyicisinin hazırlanması. | **Mustafa Güreşir** (Proje Yöneticisi) & Mimar | `src/Repository/Json/*`, `bin/seed.php`, `storage/*.json` |
| **7. Hafta** | Session tabanlı Auth (`password_hash`), POST-Redirect-GET (PRG) akışı, flash mesajlar, Front Controller (`public/index.php`) ve IDOR yetkisiz erişim kontrolleri. | **Arayüz & Dokümantasyon Sorumlusu** | `public/index.php`, `src/Service/AuthService.php` |
| **8. Hafta** | Çekirdek problem ve sınır durumları için 14 adet PHPUnit birim testinin yazılması (`tests/Unit/*`), InMemory sahte repository sınıflarının kodlanması, izlenebilirlik ve süreç raporlarının yazılması. | **Veritabanı & Test Sorumlusu** | `tests/Unit/*`, `docs/izlenebilirlik.md`, `docs/surec-raporu.md` |

---

## 3. Değerlendirilen Tasarım ve Uygulama Kararları

Aşama 2 mimarisi oluşturulurken üç temel karar değerlendirilmiş ve alternatifleri analiz edilmiştir:

### Karar 1: JSON Dosya Depolamada Atomik Geçici Dosya (.tmp) ve `flock(LOCK_EX)` Kullanımı
* **Alternatif:** Standart `file_put_contents('orders.json', json_encode($data))` ile doğrudan yazma.
* **Neden Elendi:** Eşzamanlı iki HTTP isteği aynı anda sipariş kaydetmeye çalıştığında dosya kilitlenmesi yaşanmaz, veri bozulur veya dosya sıfır bayta düşer (Race Condition).
* **Alınan Karar:** `JsonStorageHelper` sınıfında yazma işlemi önce geçici bir dosyaya (`.tmp.uniqid`) özel kilit altında (`LOCK_EX`) yazılır, `fflush()` ile diske basılır ve işletim sistemi seviyesinde atomik `rename()` ile dosya güvenle değiştirilir.

### Karar 2: Durum Yönetiminde State Pattern (Durum Deseni) Kullanımı
* **Alternatif:** Controller veya Servis içinde iç içe onlarca `switch-case` ve `if-else` yazmak.
* **Neden Elendi:** Spagetti kod oluşturur, Open/Closed prensibini ihlal eder. Yeni bir durum (örneğin "iade_edildi") eklendiğinde tüm dosyanın baştan aşağı değiştirilmesini gerektirir.
* **Alınan Karar:** `OrderStateInterface` altında 6 somut sınıf (`ReceivedState`, `PreparingState`, `ReadyState`, `OnWayState`, `DeliveredState`, `CancelledState`) oluşturuldu. Her durum kendi geçiş kurallarını ve `canCancel()` şartını kendi sınıfında kapsülledi.

### Karar 3: Mesafe Ölçümünde Düzlemsel Manhattan/Öklid Yerine Haversine Formülü
* **Alternatif:** $d = \sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}$ (Öklid) veya $|x_2-x_1| + |y_2-y_1|$ (Manhattan).
* **Neden Elendi:** Düzlemsel ızgara modelleri gerçek dünya GPS enlem/boylam koordinatlarında eğriliği hesaba katmadığı için Kadıköy Moda ile Rıhtım arasındaki mesafede %30'a varan hatalı hesaplama yapmaktadır.
* **Alınan Karar:** Dünya yarıçapını ($R = 6371\text{ km}$) ve küresel trigonometriyi kullanan **Haversine formülü** uygulandı. Kurye seçiminde hata payı ortadan kaldırıldı.

---

## 4. Yapay Zekâ Günlüğünden 3 Önemli Örnek

Yapay zekâdan alınan desteklerde grubumuz eleştirel bir gözle denetim yapmış ve aşağıdaki kararları vermiştir:

1. **Yapay Zekânın Yanıldığı ve Grubumuzun Düzelttiği Örnek (Zorunlu Madde):**  
   Yapay zekâ Aşama 2 veri katmanı için ısrarla `SQLite` veritabanı kurmayı, tablo şeması üretmeyi ve PDO bağlantısı yazmayı önermiştir. Grubumuz Aşama 2 şartnamesindeki *"Aşama 2’de veritabanı kullanmayacaksınız, veriler storage/ klasöründeki JSON dosyalarında tutulmalıdır"* kuralını hatırlatarak yapay zekânın kodunu reddetmiş ve `JsonOrderRepository` sınıfını sıfırdan yazdırmıştır.
2. **Kurye Puanlama Formülü Denetimi:**  
   Yapay zekâ kurye seçimini sadece mesafeye göre sıralayan basit bir `usort` önermiştir. Grubumuz şartnamedeki $+ 2 \times \text{AktifSipariş}$ kuralını ekleterek formülü iş yükü optimizasyonlu hale getirmiştir.
3. **IDOR ve Güvenlik Zaafiyeti:**  
   Yapay zekâ `get_order` API uç noktasında sadece gelen `$_GET['id']` ile doğrudan JSON okuması yapmış; grubumuz farklı müşterilerin birbirlerinin sipariş detaylarını görebileceğini (IDOR açığı) fark etmiş ve `assertCanAccessOrder()` sahiplik kontrolünü zorunlu kılmıştır.

---

## 5. Test Sayısı, Sınır Durumları ve İzlenebilirlik

* **Toplam Test Sayısı:** Projede **14 adet** birim ve entegrasyon testi bulunmaktadır (Hocanın en az 10 test şartı fazlasıyla aşılmıştır).
* **Testlerde Sahte Repository Kullanımı:** Testler `storage/` altındaki gerçek JSON dosyalarını bozmamak adına tamamen bellek içi çalışan **`InMemoryOrderRepository`**, **`InMemoryCourierRepository`** ve **`InMemoryUserRepository`** sınıfları üzerinden yürütülmektedir.
* **Kritik Sınır Durumları (Edge Cases):**
  1. *Boş Kurye Havuzu:* Bölgedeki tüm kuryeler meşgul olduğunda sistemin çökmemesi ve `RuntimeException("Uygun kurye bulunamadı!")` fırlatması (`CourierAssignmentStrategyTest`).
  2. *Bozuk JSON Dosyası:* Dosyada eksik süslü parantez veya geçersiz karakter olduğunda `RuntimeException` ile hatanın yakalanması (`JsonStorageFlockTest`).
  3. *Kısa Parola/Kullanıcı Adı:* 3 karakterden kısa kullanıcı adı ve 6 karakterden kısa parolanın reddedilmesi (`SecurityAndAuthTest`).
* **İzlenebilirlik Tablosu Konumu:** [`docs/izlenebilirlik.md`](file:///c:/Users/musta/.gemini/antigravity-ide/scratch/yemek-kurye-sistemi/docs/izlenebilirlik.md) dosyasında tüm FR ve User Story'ler test metotlarıyla eşleştirilmiştir.

---

## 6. Karşılaşılan 3 Önemli Sorun ve Çözümleri

1. **Eşzamanlı JSON Yazma (Race Condition):**  
   * *Sorun:* İki istek aynı anda sipariş oluşturduğunda `orders.json` dosyasında son yazan ilkinin verisini ezmekteydi.
   * *Çözüm:* `flock(LOCK_EX)` ile dosya kilitleme ve doğrudan asıl dosyaya değil geçici dosyaya (`.tmp`) yazıp `rename` etme stratejisi uygulandı.
2. **Form Gönderiminde Çift Sipariş Riski (F5 Tuşlama):**  
   * *Sorun:* Kullanıcı sipariş verdikten sonra sayfayı yenilediğinde tarayıcı POST isteğini tekrarlayarak mükerrer sipariş açmaktaydı.
   * *Çözüm:* **POST-Redirect-GET (PRG)** akışı kuruldu; işlem başarılı olduğunda kullanıcı HTTP 303 ile yönlendirildi ve bildirimler `$_SESSION['flash']` ile gösterildi.
3. **Müşteri Panelinde İptal Butonu Mantığı:**  
   * *Sorun:* Mutfak siparişi onayladığında müşterinin ekranda kalan iptal butonuna tıklayabilmesi.
   * *Çözüm:* Butonun görünürlüğü durum makinesine bağlandı; ayrıca sunucu tarafında `OrderStateMachineService::cancel()` içinde `canCancel()` doğrulaması yapılarak yetkisiz istekler engellendi.

---

## 7. Eleştirmen Grup Geri Bildirimleri ve Değerlendirme

* **Öneri 1 (Kabul Edildi):** *"Kurye seçiminde eğer iki kuryenin puanı tamamen eşitse neye göre karar veriliyor?"*  
  - *Uygulama:* Eşitlik durumunda aktif sipariş sayısı en az olan kuryeye öncelik veren ikincil kural `ScoreBasedAssignmentStrategy` içine eklendi (PR #12).
* **Öneri 2 (Kabul Edildi):** *"Şifreler düz metin tutulmamalı, PHP 8 standardı password_hash kullanılmalı."*  
  - *Uygulama:* `User` modelinde `password_hash` ve `password_verify` entegre edildi, testleri yazıldı (PR #14).
* **Öneri 3 (Gerekçeli Reddedildi):** *"Müşteriye kuryenin anlık canlı GPS konumunu harita üzerinde gösterin."*  
  - *Gerekçe:* Proje şartnamesinin *Kapsam Sınırı* bölümünde "Harita servisi, canlı konum takibi ve ödeme yoktur; sabit koordinatlar kullanılır" hükmü yer aldığı için kapsam dışı bırakılmıştır (Issue #8).

---

## 8. Grup Üyelerinin Katkıları (Commit ve PR Geçmişi)

* **Mustafa Güreşir (Proje Yöneticisi):**  
  Proje koordinasyonu, iş paketlerinin GitHub Projects üzerinde yönetimi, `bin/seed.php` veri yükleyici mimarisi, izlenebilirlik matrisi ve süreç raporu dokümantasyonu. (Commitler: `feat(seed): add json seeder`, `docs: traceability matrix`).
* **Yazılım Mimarı:**  
  `src/Storage/JsonStorageHelper.php` (flock ve atomik yazım), `OrderStateMachineService`, State desen sınıfları, Haversine mesafe algoritması. (Commitler: `feat(storage): atomic json helper`, `feat(state): order state machine`).
* **Veritabanı ve Test Sorumlusu:**  
  14 adet PHPUnit birim testinin (`tests/Unit/*`) yazılması, InMemory sahte repository sınıflarının kodlanması, mutasyon testlerinin uygulanması. (Commitler: `test(unit): add 14 phpunit suites`, `feat(repo): inmemory repos`).
* **Arayüz ve Dokümantasyon Sorumlusu:**  
  Front Controller (`public/index.php`), POST-Redirect-GET akışı, flash mesajlar, login/register Bootstrap formları, IDOR sahiplik güvenlik denetimleri. (Commitler: `feat(auth): prg flow and flash`, `sec(idor): ownership checks`).

---

## 9. Aşama 3’te MySQL’e Geçiş Analizi ve Mimari Destek

Aşama 2'nin en büyük mimari başarısı, Controller ve Servis katmanlarının somut dosyalara değil **`RepositoryInterface`** arayüzlerine bağımlı olmasıdır (Dependency Inversion Principle).

### Değişecek Sınıflar:
Aşama 3'te MySQL'e geçildiğinde Controller, Service veya Model sınıflarında **tek bir satır iş kodu dahi değişmeyecektir.**  
Sadece `src/Repository/` altında yeni somut sınıflar yazılacaktır:
* `JsonOrderRepository` ➔ `MySqlOrderRepository`
* `JsonUserRepository` ➔ `MySqlUserRepository`
* `JsonCourierRepository` ➔ `MySqlCourierRepository`
* `JsonRestaurantRepository` ➔ `MySqlRestaurantRepository`

### Öngörülen Riskler ve Çözümler:
* **Eşzamanlılık Riski (Race Condition):** JSON'da `flock` ile çözülen dosya kilidi, MySQL'e geçildiğinde `SELECT ... FOR UPDATE` (Pessimistic Locking) veya `status` sütununa koşullu UPDATE (Optimistic Locking) ile çözülecektir.
* **Transaction Bütünlüğü:** JSON'da geçici dosya ile sağlanan atomiklik, MySQL'de `PDO::beginTransaction()` ve `commit()` ile karşılanacaktır.

Mimarimiz Dependency Inversion ilkesine tam uyumlu olduğu için Aşama 3 geçişi pürüzsüz ve sıfır riskli olacaktır.
