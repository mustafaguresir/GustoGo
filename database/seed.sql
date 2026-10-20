-- SQLite Tohum Verileri (GustoGo - 7 Restoran, 27 Ürün, Kuryeler ve Kullanıcılar)
PRAGMA foreign_keys = ON;

-- 1. Kullanıcılar
INSERT OR IGNORE INTO users (id, username, password_hash, full_name, phone, role) VALUES
(1, 'ahmet_musteri', 'hash123', 'Ahmet Yılmaz', '05551112233', 'customer'),
(2, 'lezzet_restoran', 'hash123', 'Lezzet Kebap Yetkilisi', '05552223344', 'restaurant'),
(3, 'burger_restoran', 'hash123', 'Burger Lab Yetkilisi', '05553334455', 'restaurant'),
(4, 'pizza_restoran', 'hash123', 'Pizza Roma Yetkilisi', '05554445566', 'restaurant'),
(5, 'sushi_restoran', 'hash123', 'Sushico Express Yetkilisi', '05555551122', 'restaurant'),
(6, 'tatli_restoran', 'hash123', 'Tatlı Dünyası Yetkilisi', '05556662233', 'restaurant'),
(7, 'tavuk_restoran', 'hash123', 'Tavuk Dünyası Yetkilisi', '05557773344', 'restaurant'),
(8, 'balik_restoran', 'hash123', 'Deniz Balık Yetkilisi', '05558884455', 'restaurant'),
(9, 'kurye_ali', 'hash123', 'Ali Kaya (Kurye)', '05555556677', 'courier'),
(10, 'kurye_veli', 'hash123', 'Veli Demir (Kurye)', '05556667788', 'courier'),
(11, 'kurye_can', 'hash123', 'Can Yıldız (Kurye)', '05556667799', 'courier'),
(12, 'kurye_mehmet', 'hash123', 'Mehmet Arslan (Kurye)', '05556667700', 'courier'),
(13, 'admin_yonetici', 'hash123', 'Mustafa Nuri (Yönetici)', '05557778899', 'admin');

-- 2. Restoranlar (Izgara Koordinatları X, Y)
INSERT OR REPLACE INTO restaurants (id, user_id, name, location_x, location_y, phone) VALUES
(1, 2, 'Lezzet Kebap Salonu', 12, 8, '0212 555 1001'),
(2, 3, 'Burger Lab', 25, 30, '0212 555 1002'),
(3, 4, 'Pizza Roma', 8, 19, '0212 555 1003'),
(4, 5, 'Sushico Express', 15, 22, '0212 555 1004'),
(5, 6, 'Tatlı Dünyası', 10, 14, '0212 555 1005'),
(6, 7, 'Tavuk Dünyası', 20, 5, '0212 555 1006'),
(7, 8, 'Deniz Balık Lokantası', 5, 28, '0212 555 1007');

-- 3. Menü Ürünleri (Toplam 27 Ürün)
INSERT OR REPLACE INTO menu_items (id, restaurant_id, name, description, price, category) VALUES
-- Lezzet Kebap
(1, 1, 'Adana Zırh Dürüm', 'Zırh kıyması, köz biber, domates, sumaklı soğan', 190.00, 'Kebap'),
(2, 1, 'Urfa Kebap Porsiyon', 'Acısız zırh eti, bulgur pilavı, köz sebze', 240.00, 'Kebap'),
(3, 1, 'Fındık Lahmacun (3 Adet)', 'Taş fırında çıtır hamur, taze kıymalı harç', 135.00, 'Kebap'),
(4, 1, 'İskender Kebap', 'Dana et, tereyağlı pide, domates sosu ve yoğurt', 290.00, 'Kebap'),
(5, 1, 'Köpüklü Yayık Ayran', '300ml doğal manda-inek sütü karışımı', 35.00, 'İçecek'),

-- Burger Lab
(6, 2, 'Smash Cheeseburger', '140gr dana köfte, çifte cheddar, karamelize soğan', 250.00, 'Burger'),
(7, 2, 'BBQ Bacon Burger', 'Çıtır dana bacon, BBQ sos, cheddar, soğan halkası', 280.00, 'Burger'),
(8, 2, 'Truffle Parmesan Fries', 'Trüf yağı, rendelenmiş parmesan, cajun baharatı', 95.00, 'Yan Ürün'),
(9, 2, 'Nane Limonata', '330ml taze sıkım ev yapımı limonata', 50.00, 'İçecek'),

-- Pizza Roma
(10, 3, 'Margherita Pizza', 'San Marzano domates, manda mozzarella, fesleğen', 230.00, 'Pizza'),
(11, 3, 'Pepperoni Pizza', 'İtalyan sucuk, kekik, bol mozzarella', 280.00, 'Pizza'),
(12, 3, '4 Mevsim Pizza', 'Mantar, zeytin, biber, sucuk ve mozzarella', 265.00, 'Pizza'),
(13, 3, 'İtalyan Tiramisu', 'Mascarpone peyniri, espresso, kedi dili bisküvi', 120.00, 'Tatlı'),

-- Sushico Express
(14, 4, 'California Roll (8 Parça)', 'Yengeç, avokado, salatalık, tobiko kaplamalı', 310.00, 'Sushi'),
(15, 4, 'Somon Teriyaki Bowl', 'Izgara somon, buharda pirinç, edamame, teriyaki', 360.00, 'Sushi'),
(16, 4, 'Çıtır Tavuk Noodle', 'Wok tavada sebzeler, kızarmış tavuk, susam', 220.00, 'Noodle'),
(17, 4, 'Ebi Tempura (6 Adet)', 'Çıtır hamurlu karides tempura, tatlı biber sosu', 290.00, 'Deniz Ürünü'),

-- Tatlı Dünyası
(18, 5, 'Belçika Waffle', 'Çilek, muz, fındık, sıcak Belçika çikolatası', 175.00, 'Tatlı'),
(19, 5, 'San Sebastian Cheesecake', 'Karamelize yanık üst tabaka, akışkan krema dolgu', 140.00, 'Tatlı'),
(20, 5, 'Buzlu Karamel Macchiato', 'Espresso, soğuk süt, vanilya, karamel şurubu', 75.00, 'İçecek'),
(21, 5, 'Çikolatalı Profiterol', 'Choux hamur, vanilyalı krema, sıcak çikolata', 110.00, 'Tatlı'),

-- Tavuk Dünyası
(22, 6, 'Çıtır Tavuk Menü', '4 parça çıtır tavuk, patates, sos ve içecek', 195.00, 'Tavuk'),
(23, 6, 'Izgara Tavuk Wrap', 'Izgara tavuk, marul, domates, sarı mustard sos', 150.00, 'Tavuk'),
(24, 6, 'Tavuk Kanat (10 Adet)', 'Acılı/sade sos seçenekli, ranch dip sos ile', 180.00, 'Tavuk'),

-- Deniz Balık Lokantası
(25, 7, 'Lüfer Izgara', 'Taze günün lüferi, zeytinyağlı, limon ve roka', 380.00, 'Balık'),
(26, 7, 'Karides Güveç', 'Tereyağlı sarımsaklı sos, ekmek ile servis', 320.00, 'Deniz Ürünü'),
(27, 7, 'Levrek Buğulama', 'Buharda pişirilmiş, taze sebzeler ve limon', 340.00, 'Balık');

-- 4. Kuryeler (Canlı Konum ve İş Yükü)
INSERT OR REPLACE INTO couriers (id, user_id, vehicle_type, current_x, current_y, active_orders_count, status) VALUES
(1, 9, 'Motor', 14, 10, 1, 'musait'),
(2, 10, 'Motor', 30, 28, 0, 'musait'),
(3, 11, 'E-Bisiklet', 8, 16, 0, 'musait'),
(4, 12, 'Scooter', 22, 18, 0, 'musait');
