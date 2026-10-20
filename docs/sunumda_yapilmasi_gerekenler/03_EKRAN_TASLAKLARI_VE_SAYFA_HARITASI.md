# GustoGo — Yemek Sipariş ve Kurye Takip Sistemi
## 5 Adet Ekran Taslağı (Wireframes) ve Sunum Vurguları

Projemiz için hazırlanan ve sistem mimarisini kullanıcı deneyimine dönüştüren **5 adet detaylı ekran taslağı**, masaüstündeki `ekran_taslaklari/` klasöründe yer almaktadır.

Aşağıda her bir ekranın mimari bağlantısı ve sunumda vurgulanması gereken noktalar yer almaktadır:

---

### 📱 1. Müşteri Restoran Menüsü ve Sepet Ekranı
* **Dosya Adı:** `ekran_taslaklari/1_musteri_siparis_sepet.png`
* **İlgili Rol:** `customer` (Müşteri)
* **İçerdiği Bileşenler:**
  - Restoran seçimi ve kategori filtreleri (Kebap, Burger, Pizza, Sushi, Tatlı).
  - Menü kartları (Görseller, porsiyon açıklamaları, fiyatlar).
  - Dinamik sepet özeti (Ara toplam, indirim kuponu, Manhattan teslimat ücreti).
  - Teslimat koordinatı seçimi (Izgara üzerinde X, Y teslimat noktası belirleme).
* **🎯 Sunumda Ne Vurgulanacak?**  
  *"Müşteri sipariş verirken doğrudan teslimat yapacağı şehir ızgarası koordinatını seçer. Bu koordinat, ilerleyen adımda kurye Manhattan mesafesini hesaplamak için veritabanında `orders` tablosundaki `delivery_x` ve `delivery_y` alanlarına kaydedilir."*

---

### 🛵 2. Müşteri Canlı Sipariş Takip Ekranı
* **Dosya Adı:** `ekran_taslaklari/2_musteri_canli_siparis_takip.png`
* **İlgili Rol:** `customer` (Müşteri)
* **İçerdiği Bileşenler:**
  - **5 Aşamalı Görsel İlerleme Çizelgesi (Stepper):** `Alındı ➔ Hazırlanıyor ➔ Hazır ➔ Yolda ➔ Teslim Edildi`.
  - Tahmini teslimat süresi sayacı.
  - Atanan kuryenin adı, araç tipi ve canlı Manhattan mesafesi.
  - **Koşullu İptal Butonu:** Yalnızca sipariş `alındı` durumundayken aktiftir.
* **🎯 Sunumda Ne Vurgulanacak?**  
  *"Burada State tasarım desenimizin kullanıcı arayüzündeki yansımasını görüyoruz. Sipariş henüz 'Alındı' iken kırmızı renkli 'Siparişi İptal Et' butonu aktiftir. Ancak restoran yemeği mutfağa alıp durum 'Hazırlanıyor' olduğu anda bu buton kilitlenir ve müşteri siparişi iptal edemez."*

---

### 👨‍🍳 3. Restoran Sipariş Yönetim ve Mutfak Paneli
* **Dosya Adı:** `ekran_taslaklari/3_restoran_siparis_yonetimi.png`
* **İlgili Rol:** `restaurant` (Restoran / Mutfak Şefi)
* **İçerdiği Bileşenler:**
  - Gelen canlı sipariş kuyruğu (Sipariş ID, müşteri adı, ürün listesi ve adedi).
  - **İşlem Butonları:** Tek tıkla `[Hazırlanıyor]` ve `[Hazır]` durumuna geçirme.
  - Otomatik kurye atama bildirimi (Şef 'Hazır' dediği anda algoritmanın atadığı kurye ismi ekranda belirir).
  - Restoran günlük ciro, sipariş adedi ve popüler ürünler rapor kutusu.
* **🎯 Sunumda Ne Vurgulanacak?**  
  *"Restoran şefi mutfakta pişen sipariş için 'Hazır' butonuna bastığı an, arka planda Sıralama Diyagramımızdaki çekirdek akış tetiklenir: `OrderStateMachineService` durumu günceller, `CourierAssignmentService` en düşük skorlu kuryeyi atar ve mutfak paneline 'Kurye Ali Görevlendirildi' mesajı döner."*

---

### 📦 4. Kurye Teslimat ve Akıllı Rota Paneli
* **Dosya Adı:** `ekran_taslaklari/4_kurye_teslimat_paneli.png`
* **İlgili Rol:** `courier` (Kurye Portalı)
* **İçerdiği Bileşenler:**
  - Kuryenin anlık $(X, Y)$ konumu ve mevcut aktif sipariş sayısı.
  - Kendisine atanan sipariş kartı: Restoran alım koordinatı ve müşteri teslimat adresi.
  - **Puanlama Dökümü:** Kuryenin neden seçildiğini gösteren $Puan = Mesafe + (2 \times AktifSipariş)$ hesap kutusu.
  - Durum güncelleme butonları: `[Paketi Aldım (Yolda)]` ve `[Müşteriye Teslim Ettim]`.
* **🎯 Sunumda Ne Vurgulanacak?**  
  *"Bu panel projemizin çekirdek probleminin kurye tarafındaki çıktısıdır. Kurye sistemin kendisini hangi puanlama formülüyle atadığını görür. Paketi aldığında 'Yola Çıktım', teslim ettiğinde 'Teslim Ettim' butonuna basarak veritabanındaki aktif iş yükünü otomatik olarak 1 azaltır."*

---

### 🛡️ 5. Yönetici Kontrol Merkezi ve Filo İzleme Paneli
* **Dosya Adı:** `ekran_taslaklari/5_yonetici_rapor_kurye_izleme.png`
* **İlgili Rol:** `admin` (Sistem Yöneticisi)
* **İçerdiği Bileşenler:**
  - **30x30 Şehir Izgara Haritası:** Restoranlar (kırmızı simge), kuryeler (mavi simge) ve müşteri teslimat noktaları (yeşil simge).
  - Kurye filosu canlı iş yükü tablosu (Hangi kuryede kaç paket var, anlık durumu).
  - Sistem genel ciro, aktif sipariş sayısı ve teslimat başarı oranı grafiği.
  - **`order_status_log` Denetim Tarihçesi (Audit Trail):** Hangi siparişi kim, ne zaman, hangi durumdan hangi duruma geçirdi?
* **🎯 Sunumda Ne Vurgulanacak?**  
  *"Yönetici paneli tüm sistemin kuşbakışı kontrol merkezidir. Hem 30x30 ızgara üzerinde şehir trafiğini simüle eder, hem de veritabanındaki `order_status_log` tablosundan beslenerek sistemde kimin ne işlem yaptığını tam bir denetim günlüğü (audit trail) olarak kayıt altına alır."*
