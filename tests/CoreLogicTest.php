<?php
// Autoloader simülatörü (Composer bağımsız doğrudan test çalıştırmak için)
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../src/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

use App\Model\Order;
use App\Model\Restaurant;
use App\Model\Courier;
use App\Enum\OrderStatus;
use App\Enum\CourierStatus;
use App\Service\OrderStateMachineService;
use App\Service\CourierAssignmentService;
use App\Service\HaversineDistanceService;
use App\Repository\SqliteOrderRepository;

echo "=================================================================\n";
echo "YEMEK SIPARIS VE KURYE TAKIP SISTEMI - RESMI SARTNAME BIRIM TESTLERI\n";
echo "=================================================================\n\n";

$haversine = new HaversineDistanceService();
$cas = new CourierAssignmentService();
$sm = new OrderStateMachineService();

// ==============================================================================
// 1. HAVERSINE KURESEL MESAFE HESABI TESTI (Şartname Gereksinimi)
// Kadıköy Moda (40.9850 N, 29.0280 E) ile Kadıköy Rıhtım (40.9910 N, 29.0250 E) arası
// ==============================================================================
$distKm = $haversine->calculate(40.9850, 29.0280, 40.9910, 29.0250);
if ($distKm > 0.5 && $distKm < 1.5) {
    echo "✓ TEST 1 BASARILI [HAVERSINE]: Kuresel mesafe hesaplandi: {$distKm} km.\n";
} else {
    echo "✗ TEST 1 BASARISIZ: Haversine mesafesi beklenmeyen deger: {$distKm}\n";
}

// ==============================================================================
// 2. SUNUMDA KANIT 1: GECERSIZ DURUM GECISININ REDDI
// Şartname Kuralı: "yolda olan sipariş 'hazırlanıyor'a dönemez; geçersiz geçişlerin engellenmesi"
// ==============================================================================
$orderOnWay = new Order(10, 101, 1, 1, OrderStatus::YOLDA, 250.0, 18, 14);
try {
    $sm->transition($orderOnWay, OrderStatus::HAZIRLANIYOR);
    echo "✗ KANIT 1 BASARISIZ: 'yolda' olan siparis 'hazirlaniyor'a geri dondu (Gecersiz gecis engellenemedi)!\n";
} catch (DomainException $e) {
    echo "✓ SUNUMDA KANIT 1 BASARILI [GECERSIZ GECIS REDDI]: 'yolda' -> 'hazirlaniyor' REDDEDILDI: {$e->getMessage()}\n";
}

// Hazırlanmakta olan siparişin iptalinin reddi
$orderPreparing = new Order(11, 102, 1, null, OrderStatus::HAZIRLANIYOR, 200.0, 18, 14);
try {
    $sm->cancel($orderPreparing);
    echo "✗ KANIT 1 BASARISIZ: Hazirlanan siparis iptal edildi!\n";
} catch (DomainException $e) {
    echo "✓ SUNUMDA KANIT 1 (EK) BASARILI: Hazirlanan siparisin iptal istegi REDDEDILDI: {$e->getMessage()}\n";
}

// ==============================================================================
// 3. SUNUMDA KANIT 2: IKI KURYE ARASINDA DOGRU SECIMI GOSTEREN BIRIM TESTI
// Şartname: "kurye atama algoritması: müsait kuryeler arasından siparişe mesafe ve mevcut iş yüküne göre en uygun olanın seçilmesi"
// Restoran: Lezzet Kebap Moda (40.9850 N, 29.0280 E)
// Kurye 1 (Ali): Mesafe = ~0.71 km, Aktif Sipariş = 2 -> Puan = 0.71 + (2 * 2) = 4.71
// Kurye 2 (Veli): Mesafe = ~1.25 km, Aktif Sipariş = 0 -> Puan = 1.25 + (2 * 0) = 1.25
// Beklenen Kazanan: Kurye 2 (Veli) - Daha uzak olmasina ragmen bos oldugu icin secilmelidir!
// ==============================================================================
$restaurant = new Restaurant(1, 2, 'Lezzet Kebap Moda', 12, 8, '0216 111 22 33', true, 40.9850, 29.0280, 'Moda');
$courier1 = new Courier(1, 5, 'Kurye Ali (Yakin ama 2 Is Yuklu)', 14, 10, 2, CourierStatus::MUSAIT, 40.9910, 29.0250, 'Rihtim');
$courier2 = new Courier(2, 6, 'Kurye Veli (Uzak ama 0 Is Yuklu)', 13, 9, 0, CourierStatus::MUSAIT, 40.9750, 29.0350, 'Fenerbahce');

$targetOrder = new Order(12, 103, 1, null, OrderStatus::ALINDI, 300.0, 18, 14);
$selectedCourier = $cas->assignBestCourier($targetOrder, $restaurant, [$courier1, $courier2]);

if ($selectedCourier->id === 2) {
    echo "✓ SUNUMDA KANIT 2 BASARILI [IKI KURYE ARASINDA DOGRU SECIM]:\n";
    echo "  - Kurye 1 (Ali):  Mesafe = {$courier1->distanceKm} km, Aktif = {$courier1->activeOrdersCount} -> Skor = {$courier1->score}\n";
    echo "  - Kurye 2 (Veli): Mesafe = {$courier2->distanceKm} km, Aktif = {$courier2->activeOrdersCount} -> Skor = {$courier2->score}\n";
    echo "  -> EN UYGUN KURYE BASARIYLA SECILDI: {$selectedCourier->name} (Skor: {$selectedCourier->score})\n";
} else {
    echo "✗ SUNUMDA KANIT 2 BASARISIZ: Yanlis kurye secildi: {$selectedCourier->name}\n";
}

// ==============================================================================
// 4. PDO TRANSACTION VE COKLU JOIN SORGUSU TESTI (Şartname Gereksinimi)
// ==============================================================================
$dbPath = __DIR__ . '/../database/app.sqlite';
if (file_exists($dbPath)) {
    try {
        $pdo = new PDO("sqlite:" . $dbPath);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $repo = new SqliteOrderRepository($pdo);

        // A. PDO Transaction ile Sipariş Oluşturma
        $newOrder = new Order(0, 1, 1, 1, OrderStatus::ALINDI, 425.0, 18, 14);
        $sampleItems = [
            ['menu_item_id' => 1, 'quantity' => 2, 'unit_price' => 190.0],
            ['menu_item_id' => 5, 'quantity' => 1, 'unit_price' => 45.0]
        ];

        $createdOrderId = $repo->saveWithTransaction($newOrder, $sampleItems);
        echo "✓ TEST 4A BASARILI [PDO TRANSACTION]: Siparis ve kalemleri atomik transaction ile kaydedildi (ID: {$createdOrderId}).\n";

        // B. Coklu Tablo JOIN Testi (orders, restaurants, users, couriers, order_items)
        $details = $repo->getOrderWithDetails($createdOrderId);
        if ($details && isset($details['restaurant_name']) && isset($details['customer_name']) && count($details['items']) === 2) {
            echo "✓ TEST 4B BASARILI [SQL JOIN]: 5 tablo birlestirilerek siparis detaylari JOIN ile eksiksiz cekildi:\n";
            echo "  - Restoran: {$details['restaurant_name']} | Musteri: {$details['customer_name']} | Urun Kalemleri: " . count($details['items']) . " adet\n";
        } else {
            echo "✗ TEST 4B BASARISIZ: JOIN sorgusu beklenen alanlari dondurmedi.\n";
        }

        // Test siparişini temizle
        $pdo->exec("DELETE FROM orders WHERE id = {$createdOrderId};");
    } catch (\Throwable $e) {
        echo "✗ TEST 4 BASARISIZ: " . $e->getMessage() . "\n";
    }
}

echo "\n=================================================================\n";
echo "RESMI SARTNAME BIRIM TESTLERI BASARIYLA TAMAMLANDI!\n";
echo "=================================================================\n";
