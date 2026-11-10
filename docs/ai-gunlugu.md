# GustoGo — Yapay Zekâ Kullanım Günlüğü (AI Log)

Bu belge, **GustoGo** projesinin geliştirilmesi sırasında yapay zekâ (Claude, ChatGPT, Antigravity) araçlarının nasıl bir "teknik danışman ve denetçi" olarak kullanıldığını, verilen önerilerin grup tarafından nasıl incelendiğini, hangi önerilerin reddedildiğini ve **yapay zekânın yanıldığı somut hataların nasıl tespit edilip düzeltildiğini** kayıt altına almaktadır.

---

## 📌 Yapay Zekâ Kullanım Özeti Tablosu

| Tarih | Kullanılan Araç | İstek / Danışılan Konu | AI'ın Önerisi | Grubun İncelemesi ve Kararı | Sonuç |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **14.10.2026** | Claude 3.5 Sonnet | State Pattern UML ve Sınıf Hiyerarşisi | 5 durum sınıfı ve bir State arayüzü (`OrderStateInterface`). | Kod incelendi. `proceed()` metoduna ek olarak `canCancel()` kuralı da arayüze eklendi. | ✅ Kabul edildi ve geliştirildi. |
| **20.10.2026** | ChatGPT-4o | Mesafe ve Kurye Puanlama Formülü | 2D Kartezyen Öklid ($d = \sqrt{\Delta x^2 + \Delta y^2}$) mesafesi önerdi. | **Kısmen Reddedildi:** Şartnamede küresel koordinatlar ve Haversine formülü istendiği için formül Haversine trigonometrisiyle değiştirildi. | ⚠️ Düzeltilerek uyarlandı. |
| **21.10.2026** | Antigravity AI | **Aşama 2 Veri Saklama Mimarisi (KRİTİK HATA)** | Veritabanı tabloları kurmayı ve `PDO SQLite` ile sorgu çalıştırmayı önerdi. | **KESİNLİKLE REDDEDİLDİ:** Aşama 2 şartnamesinde veritabanı kesinlikle yasaktır; verilerin `storage/*.json` dosyalarında `flock` ile tutulması şarttır. | ❌ **Hata Yakalandı & Düzeltildi.** |
| **22.10.2026** | Claude 3.5 Sonnet | Eşzamanlı JSON Yazma Güvenliği | Standart `file_put_contents` fonksiyonunu doğrudan çağırmayı önerdi. | **Yetersiz Bulundu:** Eşzamanlı siparişlerde dosya bozulmasını önlemek için `flock(LOCK_EX)` ve `.tmp` dosyasından `rename` ile atomik yazım kurgulandı. | ⚠️ Güvenlik artırıldı. |
| **23.10.2026** | ChatGPT-4o | IDOR Yetki ve Sahiplik Kontrolü | Sadece kullanıcının oturum açıp açmadığını (`isset($_SESSION['user'])`) kontrol etmeyi önerdi. | **Yetersiz Bulundu:** URL'deki `order_id` parametresi değiştirilerek başkasının verisine erişilebileceği fark edildi; `assertCanAccessOrder` ile sahiplik denetimi eklendi. | ✅ Güvenlik açığı kapatıldı. |

---

## 🔍 Detaylı Vaka İncelemeleri

### Vaka 1 (Zorunlu Kriter: Yapay Zekânın Yanıldığı ve Grubun Düzelttiği Hata)

* **Problem / Danışılan Konu:** Aşama 2 için veri kalıcılığı ve sipariş kayıt mekanizmasının tasarlanması.
* **Yapay Zekânın Hatalı Önerisi:**  
  Yapay zekâ, kolaylık sağlamak adına projenin kök dizininde bir SQLite veritabanı oluşturmayı, `SqliteOrderRepository` sınıfı yazmayı ve verileri SQL `INSERT INTO orders ...` cümleleriyle saklamayı önerdi.
* **Grubumuzun Hatayı Fark Etmesi:**  
  Dersin Aşama 2 şartnamesi (Madde 2: *JSON ile Veri Saklama ve Repository Yapısı*) dikkatle incelendiğinde; **"Aşama 2’de MySQL veya başka bir veritabanı kullanmayacaksınız. Uygulamanızın kalıcı verileri storage/ gibi bir klasördeki JSON dosyalarında tutulmalıdır"** kuralı hatırlanmıştır. Yapay zekânın bu kuralı göz ardı ederek projeye veritabanı bağımlılığı soktuğu tespit edilmiştir.
* **Uygulanan Düzeltme:**  
  Yapay zekânın sunduğu SQL kodları projeden tamamen reddedilmiştir. Bunun yerine `OrderRepositoryInterface` arkasında çalışan, verileri `storage/orders.json` içinde tutan ve `flock` dosya kilidiyle atomik yazım yapan **`JsonOrderRepository`** sınıfı geliştirilmiştir. Bu sayede projenin şartnameye %100 uyumu korunmuş ve Aşama 3'e geçiş için sağlam bir soyutlama altyapısı kurulmuştur.

---

### Vaka 2: Eşzamanlı Yazma (Race Condition) ve Geçici Dosya (.tmp) Atomikliği

* **Problem:** İki müşteri aynı anda sipariş verdiğinde `orders.json` dosyasının bozulma riski.
* **Yapay Zekânın Önerisi:**  
  `file_put_contents('orders.json', json_encode($orders));`
* **Grubumuzun İncelemesi ve Kararı:**  
  Yapay zekânın bu önerisi eşzamanlı isteklerde "Race Condition" yaratmakta ve yazma esnasında elektrik/sunucu kesintisi olursa dosyanın 0 bayt (boş) kalmasına yol açmaktadır.
* **Düzeltme:**  
  Aşama 2 şartnamesinin 2. maddesinde belirtilen yönerge uygulanmış; veri önce geçici bir dosyaya (`orders.json.tmp.xxxx`) `flock(LOCK_EX)` ile yazılmış, ardından işletim sistemi seviyesinde atomik `rename()` komutuyla asıl dosyanın üzerine güvenle geçirilmiştir (`JsonStorageHelper`).

---

### Vaka 3: Mesafe Hesaplama Hassasiyeti (Kartezyen vs Haversine)

* **Problem:** Kurye ile restoran arasındaki mesafenin hesaplanması.
* **Yapay Zekânın Önerisi:**  
  Basit bir Pisagor/Öklid formülü ($d = \sqrt{\Delta x^2 + \Delta y^2}$) önerildi.
* **Grubumuzun Müdahalesi:**  
  Gerçek dünya koordinatlarında (Enlem/Boylam - Kadıköy Kadıköy Rıhtım: 40.9910° N, Moda: 40.9850° N) dünyanın küreselliği nedeniyle düzlemsel mesafenin hatalı sonuç vereceği belirlenmiştir. Yapay zekâya Haversine Büyük Daire Trigonometrik formülü ($d = 2R \cdot \arcsin(\dots)$) yazdırılmış, hata payı 50 metrenin altına indirilmiştir.
