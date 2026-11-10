# GustoGo — Aşama 2 İzlenebilirlik Matrisi (Traceability Matrix)

Bu belge, **Aşama 1** gereksinim ve tasarım belgelerinde tanımlanan kullanıcı hikâyeleri, işlevsel gereksinimler (FR) ve kabul kriterleri ile **Aşama 2** kapsamında yazılan birim ve entegrasyon testlerinin birebir eşleştirmesini içerir.

---

## 🎯 İzlenebilirlik Tablosu

| Gereksinim / Hikâye Kodu | Açıklama ve Kabul Kriteri | İlgili PHPUnit Test Metodu | Test Türü | Durum |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01 (US-1)** | Yeni sipariş oluşturulduğunda ilk durum mutlaka `alindi` olmalıdır. | `OrderStateMachineTest::testOrderStartsInReceivedState` | Olağan Akış | ✅ GEÇTİ |
| **FR-02 (US-1/US-2)** | Sıralı durum akışı (`alindi ➔ hazirlaniyor ➔ hazir ➔ yolda ➔ teslim_edildi`) adımları sırayla ilerletilebilmelidir. | `OrderStateMachineTest::testValidSequentialTransitionFlow` | Olağan Akış | ✅ GEÇTİ |
| **FR-03 (US-1)** | Sipariş mutfakta pişirilmeye başlanmadan önce (`alindi` aşamasında) müşteri tarafından iptal edilebilmelidir. | `OrderStateMachineTest::testOrderCanBeCancelledBeforePreparation` | Olağan Akış | ✅ GEÇTİ |
| **FR-04 (Çekirdek Kural)** | Hazırlanmaya başlanan (`hazirlaniyor`) bir sipariş **kesinlikle iptal edilemez**; `DomainException` fırlatılmalıdır. | `OrderStateMachineTest::testOrderCannotBeCancelledWhilePreparing` | **Sınır Durumu / İhlal** | ✅ GEÇTİ |
| **FR-05 (Çekirdek Kural)** | `yolda` durumundaki bir sipariş geriye mutfağa (`hazirlaniyor`) **kesinlikle dönemez**; geçersiz geçiş kilitlenmelidir. | `OrderStateMachineTest::testReverseTransitionFromOnWayToPreparingIsRejected` | **Sınır Durumu / İhlal** | ✅ GEÇTİ |
| **FR-06 (Kural Motoru)** | Sırasız durum atlamaları (örneğin `alindi` durumundan doğrudan `yolda` durumuna atlama) engellenmelidir. | `OrderStateMachineTest::testInvalidSkipTransitionThrowsException` | **Geçersiz Girdi** | ✅ GEÇTİ |
| **FR-07 (Çekirdek Algoritma)** | Restoran ile kurye arasındaki mesafe Haversine büyük daire küresel formülüyle hesaplanmalıdır (Hata payı < 0.1 km). | `CourierAssignmentStrategyTest::testHaversineDistanceCalculationIsAccurate` | Matematiksel Doğrulama | ✅ GEÇTİ |
| **FR-08 (Çekirdek Kural)** | Kurye atama formülü: $Puan = Mesafe + 2 \times AktifSipariş$. Uzak ama boşta olan kurye, yakın ama meşgul kuryeye tercih edilmelidir. | `CourierAssignmentStrategyTest::testLowerWorkloadCourierIsSelectedOverCloserBusyCourier` | **Çekirdek Problem** | ✅ GEÇTİ |
| **FR-09 (Sınır Durumu)** | Bölgede müsait kurye bulunmadığında sistem çökmemeli; kontrollü `RuntimeException` fırlatarak kuyruk oluşturmalıdır. | `CourierAssignmentStrategyTest::testEmptyCandidatesListThrowsException` | **Sınır Durumu** | ✅ GEÇTİ |
| **FR-10 (Optimizasyon)** | Eşit mesafedeki iki kurye arasında iş yükü az olan seçilmelidir. | `CourierAssignmentStrategyTest::testSameDistanceDifferentWorkloadSelectsIdleCourier` | Eşitlik Çözümü | ✅ GEÇTİ |
| **FR-11 (Aşama 2 Depolama)** | Kalıcı veriler `storage/*.json` dosyalarına `flock(LOCK_EX)` dosya kilidi ve geçici dosya (.tmp) atomik değişimiyle yazılmalıdır. | `JsonStorageFlockTest::testAtomicWriteAndReadWithFlock` | Depolama Güvenliği | ✅ GEÇTİ |
| **FR-12 (Veri Bütünlüğü)** | Bozuk JSON içeriğinde sistem veri bozulmasını engelleyip `RuntimeException` fırlatmalıdır. | `JsonStorageFlockTest::testCorruptedJsonThrowsRuntimeException` | **Sınır Durumu** | ✅ GEÇTİ |
| **FR-13 (Aşama 2 Güvenlik)** | Kullanıcı parolaları `password_hash` ile şifrelenmeli; giriş `password_verify` ile doğrulanmalıdır. | `SecurityAndAuthTest::testUserPasswordHashingAndVerification` | Güvenlik / Auth | ✅ GEÇTİ |
| **FR-14 (Sınır Durumu)** | 3 karakterden kısa kullanıcı adı ve 6 karakterden kısa parola girişleri sunucu tarafında reddedilmelidir. | `SecurityAndAuthTest::testShortPasswordOrUsernameThrowsException` | **Geçersiz Girdi** | ✅ GEÇTİ |
| **NFR-01 (IDOR Koruması)** | Müşteri A, form veya URL üzerindeki `order_id` değerini değiştirerek Müşteri B'nin siparişine erişememelidir. | `SecurityAndAuthTest::testIdorProtectionPreventsUnauthorizedOrderAccess` | **Güvenlik / IDOR** | ✅ GEÇTİ |
| **NFR-02 (RBAC Yetkilendirme)** | Yönetici (`admin`) rolü tüm siparişleri audit ve denetim amacıyla sorgulayabilmelidir. | `SecurityAndAuthTest::testAdminRoleCanAccessAnyOrder` | Yetki / RBAC | ✅ GEÇTİ |

---

## 🔬 Testleri Bozarak Doğrulama (Mutation Test Kontrolü)

Şartname yönergesinde belirtilen:  
> *"Testlerin gerçekten ilgili davranışı ölçtüğünü doğrulayın. Önemli bir kuralı geçici olarak bozduğunuzda ilgili testin başarısız olduğunu gösterin."*

kuralı gereğince iki kritik mutasyon senaryosu test edilmiştir:

1. **Mutasyon Deneyi 1 (İptal Kuralının Kasıtlı Bozulması):**
   - **Müdahale:** `PreparingState::canCancel()` metodu `return true;` yapılacak şekilde geçici olarak değiştirilmiştir.
   - **Sonuç:** `OrderStateMachineTest::testOrderCannotBeCancelledWhilePreparing` testi anında **FAIL (BAŞARISIZ)** olmuş, testin iptal kuralını gerçekten koruduğu kanıtlanmıştır.
   - **Düzeltme:** Kural eski haline (`return false;`) getirilerek test tekrar yeşile döndürülmüştür.

2. **Mutasyon Deneyi 2 (Kurye Puanlama Formülünün Bozulması):**
   - **Müdahale:** `ScoreBasedAssignmentStrategy::findBestCourier()` içinde $+ 2 \times Aktif$ çarpanı silinip sadece saf mesafeye ($Puan = Mesafe$) göre seçim yaptırılmıştır.
   - **Sonuç:** `CourierAssignmentStrategyTest::testLowerWorkloadCourierIsSelectedOverCloserBusyCourier` testi **FAIL** olmuş; çünkü meşgul ama yakın olan kurye seçilmiştir.
   - **Düzeltme:** Şartnamedeki $+ 2 \times Aktif$ çarpanı korunmuş ve testin formül hassasiyetini başarıyla ölçtüğü belgelenmiştir.
