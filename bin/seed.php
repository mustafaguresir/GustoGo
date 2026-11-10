<?php
declare(strict_types=1);

/**
 * GustoGo — Aşama 2 JSON Veri Tohumlama (Seeder) Betiği
 * Kullanım: php bin/seed.php
 */

require_once __DIR__ . '/../src/Storage/JsonStorageHelper.php';
require_once __DIR__ . '/../src/Enum/UserRole.php';
require_once __DIR__ . '/../src/Enum/OrderStatus.php';
require_once __DIR__ . '/../src/Enum/CourierStatus.php';

use App\Storage\JsonStorageHelper;

$storageDir = dirname(__DIR__) . '/storage';
if (!is_dir($storageDir)) {
    mkdir($storageDir, 0777, true);
}

echo "==============================================================\n";
echo "GustoGo Aşama 2: JSON Veritabanısız Veri Yükleyici (Seeder)\n";
echo "==============================================================\n";

// 1. KULLANICILAR (users.json)
$users = [
    [
        'id' => 1,
        'username' => 'ahmet_musteri',
        'password_hash' => password_hash('hash123', PASSWORD_DEFAULT),
        'full_name' => 'Ahmet Yılmaz (Müşteri)',
        'phone' => '05551112233',
        'role' => 'customer',
        'created_at' => '2026-10-20 10:00:00'
    ],
    [
        'id' => 2,
        'username' => 'ayse_musteri',
        'password_hash' => password_hash('hash123', PASSWORD_DEFAULT),
        'full_name' => 'Ayşe Kaya (Müşteri)',
        'phone' => '05552223344',
        'role' => 'customer',
        'created_at' => '2026-10-20 10:05:00'
    ],
    [
        'id' => 3,
        'username' => 'mehmet_musteri',
        'password_hash' => password_hash('hash123', PASSWORD_DEFAULT),
        'full_name' => 'Mehmet Çelik (Müşteri)',
        'phone' => '05553334455',
        'role' => 'customer',
        'created_at' => '2026-10-20 10:10:00'
    ],
    [
        'id' => 4,
        'username' => 'restoran_lezzet',
        'password_hash' => password_hash('hash123', PASSWORD_DEFAULT),
        'full_name' => 'Lezzet Kebap Yetkilisi',
        'phone' => '02163334455',
        'role' => 'restaurant',
        'created_at' => '2026-10-20 09:00:00'
    ],
    [
        'id' => 5,
        'username' => 'restoran_burger',
        'password_hash' => password_hash('hash123', PASSWORD_DEFAULT),
        'full_name' => 'Gusto Burger Şefi',
        'phone' => '02164445566',
        'role' => 'restaurant',
        'created_at' => '2026-10-20 09:10:00'
    ],
    [
        'id' => 6,
        'username' => 'restoran_pizza',
        'password_hash' => password_hash('hash123', PASSWORD_DEFAULT),
        'full_name' => 'Bella Pizza Yetkilisi',
        'phone' => '02165556677',
        'role' => 'restaurant',
        'created_at' => '2026-10-20 09:20:00'
    ],
    [
        'id' => 7,
        'username' => 'kurye_ali',
        'password_hash' => password_hash('hash123', PASSWORD_DEFAULT),
        'full_name' => 'Ali Kurye (Kadıköy Rıhtım)',
        'phone' => '05554445566',
        'role' => 'courier',
        'created_at' => '2026-10-20 08:30:00'
    ],
    [
        'id' => 8,
        'username' => 'kurye_veli',
        'password_hash' => password_hash('hash123', PASSWORD_DEFAULT),
        'full_name' => 'Veli Kurye (Fenerbahçe)',
        'phone' => '05555556677',
        'role' => 'courier',
        'created_at' => '2026-10-20 08:35:00'
    ],
    [
        'id' => 9,
        'username' => 'kurye_can',
        'password_hash' => password_hash('hash123', PASSWORD_DEFAULT),
        'full_name' => 'Can Kurye (Moda)',
        'phone' => '05556667788',
        'role' => 'courier',
        'created_at' => '2026-10-20 08:40:00'
    ],
    [
        'id' => 10,
        'username' => 'admin_mustafa',
        'password_hash' => password_hash('hash123', PASSWORD_DEFAULT),
        'full_name' => 'Mustafa Güreşir (Yönetici)',
        'phone' => '05557778899',
        'role' => 'admin',
        'created_at' => '2026-10-20 08:00:00'
    ]
];
JsonStorageHelper::write($storageDir . '/users.json', $users);
echo "[OK] 10 Kullanıcı başarıyla 'storage/users.json' dosyasına kaydedildi.\n";

// 2. RESTORANLAR (restaurants.json)
$restaurants = [
    [
        'id' => 1,
        'user_id' => 4,
        'name' => 'Moda Lezzet Kebap',
        'location_x' => 10,
        'location_y' => 15,
        'latitude' => 40.9850,
        'longitude' => 29.0280,
        'neighborhood' => 'Kadıköy Moda',
        'phone' => '02163334455',
        'is_active' => true
    ],
    [
        'id' => 2,
        'user_id' => 5,
        'name' => 'Gusto Burger & Fries',
        'location_x' => 12,
        'location_y' => 14,
        'latitude' => 40.9880,
        'longitude' => 29.0295,
        'neighborhood' => 'Bahariye',
        'phone' => '02164445566',
        'is_active' => true
    ],
    [
        'id' => 3,
        'user_id' => 6,
        'name' => 'Bella Napoli Pizza',
        'location_x' => 15,
        'location_y' => 20,
        'latitude' => 40.9910,
        'longitude' => 29.0250,
        'neighborhood' => 'Kadıköy Rıhtım',
        'phone' => '02165556677',
        'is_active' => true
    ],
    [
        'id' => 4,
        'user_id' => 4,
        'name' => 'Saray Dürüm Evi',
        'location_x' => 8,
        'location_y' => 12,
        'latitude' => 40.9820,
        'longitude' => 29.0310,
        'neighborhood' => 'Moda Sahil',
        'phone' => '02163338899',
        'is_active' => true
    ],
    [
        'id' => 5,
        'user_id' => 5,
        'name' => 'Yeşil Vadi Ev Yemekleri',
        'location_x' => 14,
        'location_y' => 18,
        'latitude' => 40.9895,
        'longitude' => 29.0270,
        'neighborhood' => 'Caferağa',
        'phone' => '02164449900',
        'is_active' => true
    ],
    [
        'id' => 6,
        'user_id' => 6,
        'name' => 'Wok & Sushi Express',
        'location_x' => 18,
        'location_y' => 22,
        'latitude' => 40.9930,
        'longitude' => 29.0220,
        'neighborhood' => 'Hasanpaşa',
        'phone' => '02165551122',
        'is_active' => true
    ],
    [
        'id' => 7,
        'user_id' => 4,
        'name' => 'Tatlı Kaşığı Patisserie',
        'location_x' => 11,
        'location_y' => 16,
        'latitude' => 40.9865,
        'longitude' => 29.0300,
        'neighborhood' => 'Moda Caddesi',
        'phone' => '02163332211',
        'is_active' => true
    ]
];
JsonStorageHelper::write($storageDir . '/restaurants.json', $restaurants);
echo "[OK] 7 Restoran başarıyla 'storage/restaurants.json' dosyasına kaydedildi.\n";

// 3. MENÜ ÜRÜNLERİ (menu_items.json)
$menuItems = [
    ['id' => 1, 'restaurant_id' => 1, 'name' => 'Adana Kebap Dürüm', 'description' => 'Zırh kıyması, közlenmiş biber ve domates', 'price' => 195.0, 'category' => 'Kebap', 'is_available' => true],
    ['id' => 2, 'restaurant_id' => 1, 'name' => 'Urfa Kebap Porsiyon', 'description' => 'Acısız zırh kıyması, bulgur pilavı ve sumaklı soğan', 'price' => 260.0, 'category' => 'Kebap', 'is_available' => true],
    ['id' => 3, 'restaurant_id' => 1, 'name' => 'Künefe', 'description' => 'Hatay peynirli, tereyağlı çıtır künefe', 'price' => 130.0, 'category' => 'Tatlı', 'is_available' => true],
    ['id' => 4, 'restaurant_id' => 1, 'name' => 'Yayık Ayranı', 'description' => 'Köpüklü taze yayık ayranı 300ml', 'price' => 35.0, 'category' => 'İçecek', 'is_available' => true],

    ['id' => 5, 'restaurant_id' => 2, 'name' => 'Gusto Smash Burger', 'description' => '140g dana döş köfte, cheddar, karamelize soğan', 'price' => 240.0, 'category' => 'Burger', 'is_available' => true],
    ['id' => 6, 'restaurant_id' => 2, 'name' => 'Truffle Mayo Burger', 'description' => 'Trüf mayonez, mantar, cheddar, füme et', 'price' => 275.0, 'category' => 'Burger', 'is_available' => true],
    ['id' => 7, 'restaurant_id' => 2, 'name' => 'Baharatlı Patates Kızartması', 'description' => 'Cajun baharatlı çıtır parmak patates', 'price' => 75.0, 'category' => 'Yan Ürün', 'is_available' => true],
    ['id' => 8, 'restaurant_id' => 2, 'name' => 'Kutu Kola', 'description' => '330ml kutu', 'price' => 45.0, 'category' => 'İçecek', 'is_available' => true],

    ['id' => 9, 'restaurant_id' => 3, 'name' => 'Pizza Margherita', 'description' => 'San Marzano domates sosu, manda mozzarella, taze fesleğen', 'price' => 250.0, 'category' => 'Pizza', 'is_available' => true],
    ['id' => 10, 'restaurant_id' => 3, 'name' => 'Quattro Formaggi', 'description' => 'Mozzarella, gorgonzola, parmesan, ricotta', 'price' => 295.0, 'category' => 'Pizza', 'is_available' => true],
    ['id' => 11, 'restaurant_id' => 3, 'name' => 'Pepperoni Passion', 'description' => 'İtalyan dana pepperoni, bol mozzarella', 'price' => 310.0, 'category' => 'Pizza', 'is_available' => true],
    ['id' => 12, 'restaurant_id' => 3, 'name' => 'Tiramisu Klasik', 'description' => 'Mascarpone ve espresso ile taze hazırlanmış', 'price' => 140.0, 'category' => 'Tatlı', 'is_available' => true],

    ['id' => 13, 'restaurant_id' => 4, 'name' => 'Kuzu Şiş Dürüm', 'description' => 'Marine edilmiş kuzu şiş', 'price' => 230.0, 'category' => 'Dürüm', 'is_available' => true],
    ['id' => 14, 'restaurant_id' => 4, 'name' => 'Tavuk Döner Dürüm', 'description' => 'Özel soslu Hatay usulü döner', 'price' => 140.0, 'category' => 'Dürüm', 'is_available' => true],
    ['id' => 15, 'restaurant_id' => 4, 'name' => 'Şalgam Suyu 330ml', 'description' => 'Acılı veya acısız Adana şalgamı', 'price' => 35.0, 'category' => 'İçecek', 'is_available' => true],

    ['id' => 16, 'restaurant_id' => 5, 'name' => 'Kuru Fasulye & Pilav Menü', 'description' => 'İspir kuru fasulyesi, tereyağlı pirinç pilavı', 'price' => 180.0, 'category' => 'Ev Yemeği', 'is_available' => true],
    ['id' => 17, 'restaurant_id' => 5, 'name' => 'Karnıyarık', 'description' => 'Kıymalı patlıcan karnıyarık', 'price' => 170.0, 'category' => 'Ev Yemeği', 'is_available' => true],
    ['id' => 18, 'restaurant_id' => 5, 'name' => 'Mercimek Çorbası', 'description' => 'Limon ve tereyağ soslu süzme mercimek', 'price' => 80.0, 'category' => 'Çorba', 'is_available' => true],

    ['id' => 19, 'restaurant_id' => 6, 'name' => 'California Roll (8 Parça)', 'description' => 'Yengeç, avokado, salatalık, tobiko', 'price' => 290.0, 'category' => 'Sushi', 'is_available' => true],
    ['id' => 20, 'restaurant_id' => 6, 'name' => 'Tavuklu Noodle', 'description' => 'Sebzeli ve teriyaki soslu wok noodle', 'price' => 210.0, 'category' => 'Wok', 'is_available' => true],
    ['id' => 21, 'restaurant_id' => 6, 'name' => 'Tatlı Ekşi Soslu Tavuk', 'description' => 'Biber, ananas ve çıtır tavuk parçaları', 'price' => 240.0, 'category' => 'Ana Yemek', 'is_available' => true],

    ['id' => 22, 'restaurant_id' => 7, 'name' => 'San Sebastian Cheesecake', 'description' => 'Karamelize üst yüzey, akışkan çikolata sosu ile', 'price' => 160.0, 'category' => 'Tatlı', 'is_available' => true],
    ['id' => 23, 'restaurant_id' => 7, 'name' => 'Profiterol Porsiyon', 'description' => 'Hakiki çikolata soslu mini şu hamurları', 'price' => 135.0, 'category' => 'Tatlı', 'is_available' => true],
    ['id' => 24, 'restaurant_id' => 7, 'name' => 'Filtre Kahve', 'description' => 'Taze çekilmiş Guatemala çekirdeği', 'price' => 70.0, 'category' => 'Kahve', 'is_available' => true]
];
JsonStorageHelper::write($storageDir . '/menu_items.json', $menuItems);
echo "[OK] 24 Menü Ürünü başarıyla 'storage/menu_items.json' dosyasına kaydedildi.\n";

// 4. KURYELER (couriers.json)
$couriers = [
    [
        'id' => 1,
        'user_id' => 7,
        'name' => 'Ali Kurye (Kadıköy Rıhtım)',
        'current_x' => 15,
        'current_y' => 20,
        'latitude' => 40.9910,
        'longitude' => 29.0250,
        'neighborhood' => 'Kadıköy Rıhtım',
        'active_orders_count' => 2, // İş yükü dolu (Simülasyon için)
        'status' => 'musait'
    ],
    [
        'id' => 2,
        'user_id' => 8,
        'name' => 'Veli Kurye (Fenerbahçe)',
        'current_x' => 8,
        'current_y' => 10,
        'latitude' => 40.9760,
        'longitude' => 29.0380,
        'neighborhood' => 'Fenerbahçe',
        'active_orders_count' => 0, // Boşta (Uzak olsa da formülle seçilecek)
        'status' => 'musait'
    ],
    [
        'id' => 3,
        'user_id' => 9,
        'name' => 'Can Kurye (Moda)',
        'current_x' => 10,
        'current_y' => 15,
        'latitude' => 40.9850,
        'longitude' => 29.0280,
        'neighborhood' => 'Moda Caddesi',
        'active_orders_count' => 1,
        'status' => 'musait'
    ],
    [
        'id' => 4,
        'user_id' => 7,
        'name' => 'Mehmet Kurye (Göztepe)',
        'current_x' => 20,
        'current_y' => 25,
        'latitude' => 40.9820,
        'longitude' => 29.0550,
        'neighborhood' => 'Göztepe Parkı',
        'active_orders_count' => 0,
        'status' => 'mesgul'
    ]
];
JsonStorageHelper::write($storageDir . '/couriers.json', $couriers);
echo "[OK] 4 Kurye başarıyla 'storage/couriers.json' dosyasına kaydedildi.\n";

// 5. BAŞLANGIÇ SİPARİŞLERİ (orders.json)
$orders = [
    [
        'id' => 1,
        'customer_id' => 1,
        'restaurant_id' => 1,
        'courier_id' => 2,
        'status' => 'alindi',
        'total_amount' => 390.0,
        'delivery_latitude' => 40.9860,
        'delivery_longitude' => 29.0290,
        'estimated_delivery_time' => '30 dk',
        'created_at' => date('Y-m-d H:i:s', strtotime('-15 minutes')),
        'items' => [
            ['id' => 1, 'order_id' => 1, 'menu_item_id' => 1, 'name' => 'Adana Kebap Dürüm', 'quantity' => 2, 'unit_price' => 195.0, 'subtotal' => 390.0]
        ]
    ],
    [
        'id' => 2,
        'customer_id' => 2,
        'restaurant_id' => 2,
        'courier_id' => null,
        'status' => 'hazirlaniyor',
        'total_amount' => 320.0,
        'delivery_latitude' => 40.9890,
        'delivery_longitude' => 29.0270,
        'estimated_delivery_time' => '25 dk',
        'created_at' => date('Y-m-d H:i:s', strtotime('-10 minutes')),
        'items' => [
            ['id' => 2, 'order_id' => 2, 'menu_item_id' => 5, 'name' => 'Gusto Smash Burger', 'quantity' => 1, 'unit_price' => 240.0, 'subtotal' => 240.0],
            ['id' => 3, 'order_id' => 2, 'menu_item_id' => 7, 'name' => 'Baharatlı Patates Kızartması', 'quantity' => 1, 'unit_price' => 75.0, 'subtotal' => 75.0]
        ]
    ],
    [
        'id' => 3,
        'customer_id' => 1,
        'restaurant_id' => 3,
        'courier_id' => 1,
        'status' => 'yolda',
        'total_amount' => 295.0,
        'delivery_latitude' => 40.9850,
        'delivery_longitude' => 29.0280,
        'estimated_delivery_time' => '10 dk',
        'created_at' => date('Y-m-d H:i:s', strtotime('-30 minutes')),
        'items' => [
            ['id' => 4, 'order_id' => 3, 'menu_item_id' => 10, 'name' => 'Quattro Formaggi', 'quantity' => 1, 'unit_price' => 295.0, 'subtotal' => 295.0]
        ]
    ],
    [
        'id' => 4,
        'customer_id' => 3,
        'restaurant_id' => 1,
        'courier_id' => 3,
        'status' => 'teslim_edildi',
        'total_amount' => 520.0,
        'delivery_latitude' => 40.9840,
        'delivery_longitude' => 29.0300,
        'estimated_delivery_time' => 'Tamamlandı',
        'created_at' => date('Y-m-d H:i:s', strtotime('-120 minutes')),
        'items' => [
            ['id' => 5, 'order_id' => 4, 'menu_item_id' => 2, 'name' => 'Urfa Kebap Porsiyon', 'quantity' => 2, 'unit_price' => 260.0, 'subtotal' => 520.0]
        ]
    ]
];
JsonStorageHelper::write($storageDir . '/orders.json', $orders);
echo "[OK] 4 Sipariş başarıyla 'storage/orders.json' dosyasına kaydedildi.\n";

echo "==============================================================\n";
echo "AŞAMA 2 TOHUMLAMA (SEED) BAŞARIYLA TAMAMLANDI!\n";
echo "Tüm veriler 'storage/' altındaki JSON dosyalarında hazır.\n";
echo "==============================================================\n";
