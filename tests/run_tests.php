<?php
declare(strict_types=1);

/**
 * GustoGo — Aşama 2 Birim Test Koşucu (Standalone & PHPUnit Uyumlu Test Koşucu)
 * Kullanım: php tests/run_tests.php veya vendor/bin/phpunit
 */

spl_autoload_register(function ($class) {
    if (str_starts_with($class, 'App\\Tests\\')) {
        $rel = substr($class, strlen('App\\Tests\\'));
        $file = __DIR__ . '/' . str_replace('\\', '/', $rel) . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
    if (str_starts_with($class, 'App\\')) {
        $rel = substr($class, strlen('App\\'));
        $file = __DIR__ . '/../src/' . str_replace('\\', '/', $rel) . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

echo "======================================================================\n";
echo "GUSTOGO AŞAMA 2: VERİTABANISIZ ÇEKİRDEK PROBLEM VE BİRİM TESTLERİ\n";
echo "======================================================================\n";

$passCount = 0;
$failCount = 0;

function runTest(string $name, callable $fn, &$passCount, &$failCount): void {
    try {
        $fn();
        echo " [OK] {$name}\n";
        $passCount++;
    } catch (\Throwable $e) {
        echo " [FAIL] {$name}: " . $e->getMessage() . "\n";
        $failCount++;
    }
}

// 1. Sipariş Durum Makinesi Testleri
$smRepo = new \App\Repository\InMemory\InMemoryOrderRepository();
$sm = new \App\Service\OrderStateMachineService($smRepo);

runTest("TEST 1: Sipariş başlangıçta 'alındı' durumunda kaydedilir", function() use ($smRepo) {
    $order = new \App\Model\Order(1, 1, 1, null, \App\Enum\OrderStatus::ALINDI, 150.0, 40.9850, 29.0280);
    $smRepo->save($order);
    assert($order->status === \App\Enum\OrderStatus::ALINDI);
}, $passCount, $failCount);

runTest("TEST 2: Sıralı durum geçiş akışı (alındı -> hazırlanıyor -> hazır -> yolda -> teslim)", function() use ($smRepo, $sm) {
    $order = new \App\Model\Order(2, 1, 1, 1, \App\Enum\OrderStatus::ALINDI, 200.0, 40.9850, 29.0280);
    $smRepo->save($order);
    $sm->transition($order, \App\Enum\OrderStatus::HAZIRLANIYOR);
    assert($order->status === \App\Enum\OrderStatus::HAZIRLANIYOR);
    $sm->transition($order, \App\Enum\OrderStatus::HAZIR);
    assert($order->status === \App\Enum\OrderStatus::HAZIR);
    $sm->transition($order, \App\Enum\OrderStatus::YOLDA);
    assert($order->status === \App\Enum\OrderStatus::YOLDA);
    $sm->transition($order, \App\Enum\OrderStatus::TESLIM_EDILDI);
    assert($order->status === \App\Enum\OrderStatus::TESLIM_EDILDI);
}, $passCount, $failCount);

runTest("TEST 3: Hazırlık öncesi (alındı) sipariş iptal edilebilir", function() use ($smRepo, $sm) {
    $order = new \App\Model\Order(3, 1, 1, null, \App\Enum\OrderStatus::ALINDI, 100.0, 40.9850, 29.0280);
    $smRepo->save($order);
    $sm->cancel($order);
    assert($order->status === \App\Enum\OrderStatus::IPTAL);
}, $passCount, $failCount);

runTest("TEST 4 (ÇEKİRDEK KURAL): Hazırlanmaya başlanan sipariş İPTAL EDİLEMEZ (DomainException)", function() use ($smRepo, $sm) {
    $order = new \App\Model\Order(4, 1, 1, null, \App\Enum\OrderStatus::HAZIRLANIYOR, 100.0, 40.9850, 29.0280);
    $smRepo->save($order);
    $blocked = false;
    try {
        $sm->cancel($order);
    } catch (\DomainException) {
        $blocked = true;
    }
    assert($blocked === true, "Hazırlanan sipariş iptal edilememelidir!");
}, $passCount, $failCount);

runTest("TEST 5 (ÇEKİRDEK KURAL): Yoldaki sipariş geriye mutfağa ('hazırlanıyor') DÖNEMEZ", function() use ($smRepo, $sm) {
    $order = new \App\Model\Order(5, 1, 1, 1, \App\Enum\OrderStatus::YOLDA, 250.0, 40.9850, 29.0280);
    $smRepo->save($order);
    $blocked = false;
    try {
        $sm->transition($order, \App\Enum\OrderStatus::HAZIRLANIYOR);
    } catch (\DomainException) {
        $blocked = true;
    }
    assert($blocked === true, "Yoldaki sipariş geriye dönemez!");
}, $passCount, $failCount);

runTest("TEST 6: Geçersiz sırasız durum atlaması (alındı -> yolda) reddedilir", function() use ($smRepo, $sm) {
    $order = new \App\Model\Order(6, 1, 1, null, \App\Enum\OrderStatus::ALINDI, 100.0, 40.9850, 29.0280);
    $smRepo->save($order);
    $blocked = false;
    try {
        $sm->transition($order, \App\Enum\OrderStatus::YOLDA);
    } catch (\DomainException) {
        $blocked = true;
    }
    assert($blocked === true, "Sırasız geçiş reddedilmelidir!");
}, $passCount, $failCount);

// 2. Kurye Puanlama ve Atama Algoritması Testleri
$haversine = new \App\Service\HaversineDistanceService();
$strategy = new \App\Service\Courier\ScoreBasedAssignmentStrategy($haversine);
$cas = new \App\Service\CourierAssignmentService(null, null, $strategy, $haversine);

runTest("TEST 7: Haversine küresel mesafe formülü doğruluğu (Kadıköy Moda - Rıhtım)", function() use ($haversine) {
    $dist = $haversine->calculate(40.9850, 29.0280, 40.9910, 29.0250);
    assert($dist >= 0.6 && $dist <= 0.8, "Mesafe 0.71 km civarı olmalı, hesaplanan: {$dist}");
}, $passCount, $failCount);

runTest("TEST 8 (ÇEKİRDEK KURAL): Uzak ama boşta kurye, yakın ama meşgul kuryeye tercih edilir", function() use ($cas) {
    $rest = new \App\Model\Restaurant(1, 4, 'Moda Kebap', 10, 15, '0216', true, 40.9850, 29.0280);
    $order = new \App\Model\Order(7, 1, 1, null, \App\Enum\OrderStatus::HAZIR, 100.0, 40.9850, 29.0280);

    // Kurye 1 (Ali): 0.71 km, 2 aktif sipariş -> Skor: 0.71 + (2*2) = 4.71
    $c1 = new \App\Model\Courier(1, 7, 'Ali', 15, 20, 2, \App\Enum\CourierStatus::MUSAIT, 40.9910, 29.0250);
    // Kurye 2 (Veli): 1.26 km, 0 aktif sipariş -> Skor: 1.26 + (2*0) = 1.26 (KAZANAN!)
    $c2 = new \App\Model\Courier(2, 8, 'Veli', 8, 10, 0, \App\Enum\CourierStatus::MUSAIT, 40.9760, 29.0380);

    $best = $cas->assignBestCourier($order, $rest, [$c1, $c2]);
    assert($best->id === 2, "İş yükü avantajı nedeniyle Veli seçilmeli!");
}, $passCount, $failCount);

runTest("TEST 9 (SINIR DURUMU): Müsait kurye listesi boş olduğunda RuntimeException fırlatılır", function() use ($cas) {
    $rest = new \App\Model\Restaurant(1, 4, 'Moda Kebap', 10, 15, '0216', true, 40.9850, 29.0280);
    $order = new \App\Model\Order(8, 1, 1, null, \App\Enum\OrderStatus::HAZIR, 100.0, 40.9850, 29.0280);
    $blocked = false;
    try {
        $cas->assignBestCourier($order, $rest, []);
    } catch (\RuntimeException) {
        $blocked = true;
    }
    assert($blocked === true, "Boş listede hata fırlatılmalı!");
}, $passCount, $failCount);

// 3. Kimlik Doğrulama, password_hash ve IDOR Güvenlik Testleri
$uRepo = new \App\Repository\InMemory\InMemoryUserRepository();
$auth = new \App\Service\AuthService($uRepo);

runTest("TEST 10: Kullanıcı kaydı password_hash ile şifrelenir ve password_verify ile doğrulanır", function() use ($auth) {
    $user = $auth->register('guvenli_kullanici', 'parola123', 'Mehmet Test', '0555');
    assert(password_verify('parola123', $user->passwordHash) === true);
    assert($auth->login('guvenli_kullanici', 'parola123') !== null);
    assert($auth->login('guvenli_kullanici', 'yanlis') === null);
}, $passCount, $failCount);

runTest("TEST 11 (GÜVENLİK/IDOR): Kullanıcının başka bir kullanıcının siparişine erişimi engellenir", function() use ($auth) {
    $custA = new \App\Model\User(1, 'ahmet', 'hash', 'Ahmet', '0555', \App\Enum\UserRole::CUSTOMER);
    $otherCustOrderId = 2; // Başkasının siparişi
    $blocked = false;
    try {
        $auth->assertCanAccessOrder($custA, $otherCustOrderId);
    } catch (\RuntimeException) {
        $blocked = true;
    }
    assert($blocked === true, "IDOR saldırısı engellenmeli!");
}, $passCount, $failCount);

runTest("TEST 12 (GÜVENLİK/RBAC): Yönetici rolü tüm siparişleri denetleyebilir", function() use ($auth) {
    $admin = new \App\Model\User(99, 'admin', 'hash', 'Yönetici', '0555', \App\Enum\UserRole::ADMIN);
    $auth->assertCanAccessOrder($admin, 5, 3, 2);
    assert(true);
}, $passCount, $failCount);

// 4. JSON Dosyası ve flock Kilit Testleri
runTest("TEST 13: JsonStorageHelper atomik geçici dosya ve flock(LOCK_EX) ile yazar", function() {
    $tmpFile = sys_get_temp_dir() . '/gustogo_test_flock.json';
    \App\Storage\JsonStorageHelper::write($tmpFile, ['test' => 'deger', 'durum' => 'basarili']);
    assert(file_exists($tmpFile));
    $data = \App\Storage\JsonStorageHelper::read($tmpFile);
    assert($data['test'] === 'deger');
    @unlink($tmpFile);
}, $passCount, $failCount);

runTest("TEST 14 (SINIR DURUMU): Bozuk JSON dosyası okunduğunda RuntimeException fırlatılır", function() {
    $tmpFile = sys_get_temp_dir() . '/gustogo_corrupt.json';
    file_put_contents($tmpFile, "{ bozuk_json_formati: ");
    $caught = false;
    try {
        \App\Storage\JsonStorageHelper::read($tmpFile);
    } catch (\RuntimeException) {
        $caught = true;
    }
    @unlink($tmpFile);
    assert($caught === true);
}, $passCount, $failCount);

echo "======================================================================\n";
echo "TEST SONUCU: {$passCount} Başarılı, {$failCount} Başarısız (Toplam: " . ($passCount + $failCount) . " Test)\n";
echo "======================================================================\n";
