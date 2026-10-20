/**
 * GustoGo — Mock Veri Modeli ve İlk Veriler
 * Restoranlar, Menü Öğeleri, Kuryeler, Kategoriler ve Kuponlar
 */

const DEFAULT_RESTAURANTS = [
    {
        id: 1,
        name: "Lezzet Kebap Salonu",
        cat: "Kebap",
        emoji: "🔥",
        x: 12,
        y: 8,
        lat: 40.9850,
        lon: 29.0280,
        neighborhood: "Moda, Kadıköy",
        rating: "4.9",
        time: "25-35",
        promo: "Ücretsiz Teslimat",
        cover: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80",
        phone: "0216 444 10 01"
    },
    {
        id: 2,
        name: "Burger Lab",
        cat: "Burger",
        emoji: "🍔",
        x: 25,
        y: 30,
        lat: 41.0430,
        lon: 29.0060,
        neighborhood: "Sinanpaşa, Beşiktaş",
        rating: "4.8",
        time: "20-30",
        promo: "%15 İndirim",
        cover: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
        phone: "0212 555 20 02"
    },
    {
        id: 3,
        name: "Pizza Roma",
        cat: "Pizza",
        emoji: "🍕",
        x: 8,
        y: 19,
        lat: 40.9910,
        lon: 29.0250,
        neighborhood: "Çarşı, Kadıköy",
        rating: "4.7",
        time: "30-40",
        promo: "Gel-Al İndirimi",
        cover: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
        phone: "0216 333 30 03"
    },
    {
        id: 4,
        name: "Sushico Express",
        cat: "Sushi",
        emoji: "🥢",
        x: 15,
        y: 22,
        lat: 41.0580,
        lon: 28.9800,
        neighborhood: "Bomonti, Şişli",
        rating: "4.9",
        time: "35-45",
        promo: "Yeni Açıldı",
        cover: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
        phone: "0212 222 40 04"
    },
    {
        id: 5,
        name: "Tatlı Dünyası",
        cat: "Tatlı",
        emoji: "🍰",
        x: 10,
        y: 14,
        lat: 40.9750,
        lon: 29.0350,
        neighborhood: "Fenerbahçe, Kadıköy",
        rating: "4.8",
        time: "15-25",
        promo: "Popüler",
        cover: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80",
        phone: "0216 777 50 05"
    },
    {
        id: 6,
        name: "Tavuk Dünyası",
        cat: "Tavuk",
        emoji: "🍗",
        x: 20,
        y: 5,
        lat: 41.0260,
        lon: 29.0160,
        neighborhood: "Merkez, Üsküdar",
        rating: "4.6",
        time: "20-30",
        promo: "Özel Menü",
        cover: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=80",
        phone: "0212 888 60 06"
    },
    {
        id: 7,
        name: "Deniz Balık Lokantası",
        cat: "Balık",
        emoji: "🐟",
        x: 5,
        y: 28,
        lat: 40.9630,
        lon: 29.0620,
        neighborhood: "Caddebostan Sahil, Kadıköy",
        rating: "4.7",
        time: "30-45",
        promo: "Günün Balığı",
        cover: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80",
        phone: "0216 999 70 07"
    }
];

const DEFAULT_MENU_ITEMS = [
    {id: 1, rId: 1, name: "Adana Zırh Dürüm", desc: "Zırh kıyması, köz biber, domates, sumaklı soğan", price: 190, tag: "Popüler", available: true, img: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80"},
    {id: 2, rId: 1, name: "Urfa Kebap Porsiyon", desc: "Acısız zırh eti, bulgur pilavı, köz sebze", price: 240, tag: "Şef Seçimi", available: true, img: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80"},
    {id: 3, rId: 1, name: "Fındık Lahmacun (3 Adet)", desc: "Taş fırında çıtır hamur, taze kıymalı harç", price: 135, tag: "Çıtır", available: true, img: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80"},
    {id: 4, rId: 1, name: "İskender Kebap", desc: "Dana et, tereyağlı pide, domates sosu ve yoğurt", price: 290, tag: "Klasik", available: true, img: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80"},
    {id: 5, rId: 1, name: "Köpüklü Yayık Ayran", desc: "300ml doğal manda-inek sütü karışımı", price: 35, tag: "Doğal", available: true, img: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80"},
    
    {id: 6, rId: 2, name: "Smash Cheeseburger", desc: "140gr dana köfte, çifte cheddar, karamelize soğan", price: 250, tag: "Çok Satan", available: true, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"},
    {id: 7, rId: 2, name: "BBQ Bacon Burger", desc: "Çıtır dana bacon, BBQ sos, cheddar, soğan halkası", price: 280, tag: "Yeni", available: true, img: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80"},
    {id: 8, rId: 2, name: "Truffle Parmesan Fries", desc: "Trüf yağı, rendelenmiş parmesan, cajun baharatı", price: 95, tag: "Yan Ürün", available: true, img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80"},
    {id: 9, rId: 2, name: "Nane Limonata", desc: "330ml taze sıkım ev yapımı limonata", price: 50, tag: "Serinletici", available: true, img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80"},
    
    {id: 10, rId: 3, name: "Margherita Pizza", desc: "San Marzano domates, manda mozzarella, fesleğen", price: 230, tag: "Klasik", available: true, img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"},
    {id: 11, rId: 3, name: "Pepperoni Pizza", desc: "İtalyan sucuk, kekik, bol mozzarella", price: 280, tag: "Baharatlı", available: true, img: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=600&q=80"},
    {id: 12, rId: 3, name: "4 Mevsim Pizza", desc: "Mantar, zeytin, biber, sucuk ve mozzarella", price: 265, tag: "Favori", available: true, img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80"},
    {id: 13, rId: 3, name: "İtalyan Tiramisu", desc: "Mascarpone peyniri, espresso, kedi dili bisküvi", price: 120, tag: "Tatlı", available: true, img: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80"},
    
    {id: 14, rId: 4, name: "California Roll (8 Parça)", desc: "Yengeç, avokado, salatalık, tobiko kaplamalı", price: 310, tag: "Sushi", available: true, img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80"},
    {id: 15, rId: 4, name: "Somon Teriyaki Bowl", desc: "Izgara somon, buharda pirinç, edamame, teriyaki", price: 360, tag: "Sağlıklı", available: true, img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"},
    {id: 16, rId: 4, name: "Çıtır Tavuk Noodle", desc: "Wok tavada sebzeler, kızarmış tavuk, susam", price: 220, tag: "Noodle", available: true, img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80"},
    {id: 17, rId: 4, name: "Ebi Tempura (6 Adet)", desc: "Çıtır hamurlu karides tempura, tatlı biber sosu", price: 290, tag: "Deniz Ürünü", available: true, img: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=600&q=80"},
    
    {id: 18, rId: 5, name: "Belçika Waffle", desc: "Çilek, muz, fındık, sıcak Belçika çikolatası", price: 175, tag: "Tatlı", available: true, img: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80"},
    {id: 19, rId: 5, name: "San Sebastian Cheesecake", desc: "Karamelize yanık üst tabaka, akışkan krema dolgu", price: 140, tag: "Favori", available: true, img: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80"},
    {id: 20, rId: 5, name: "Buzlu Karamel Macchiato", desc: "Espresso, soğuk süt, vanilya, karamel şurubu", price: 75, tag: "Kahve", available: true, img: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80"},
    {id: 21, rId: 5, name: "Çikolatalı Profiterol", desc: "Choux hamur, vanilyalı krema, sıcak çikolata", price: 110, tag: "Premium", available: true, img: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&w=600&q=80"},
    
    {id: 22, rId: 6, name: "Çıtır Tavuk Menü", desc: "4 parça çıtır tavuk, patates, sos ve içecek", price: 195, tag: "Menü", available: true, img: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=600&q=80"},
    {id: 23, rId: 6, name: "Izgara Tavuk Wrap", desc: "Izgara tavuk, marul, domates, sarı mustard sos", price: 150, tag: "Sağlıklı", available: true, img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80"},
    {id: 24, rId: 6, name: "Tavuk Kanat (10 Adet)", desc: "Acılı/sade sos seçenekli, ranch dip sos ile", price: 180, tag: "Popüler", available: true, img: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=600&q=80"},
    
    {id: 25, rId: 7, name: "Lüfer Izgara", desc: "Taze günün lüferi, zeytinyağlı, limon ve roka", price: 380, tag: "Günün Balığı", available: true, img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80"},
    {id: 26, rId: 7, name: "Karides Güveç", desc: "Tereyağlı sarımsaklı sos, ekmek ile servis", price: 320, tag: "Özel", available: true, img: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80"},
    {id: 27, rId: 7, name: "Levrek Buğulama", desc: "Buharda pişirilmiş, taze sebzeler ve limon", price: 340, tag: "Sağlıklı", available: true, img: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80"}
];

const DEFAULT_COURIERS = [
    {id: 1, name: "Ali Kaya", vehicle: "Motor 🏍️", x: 14, y: 10, lat: 40.9910, lon: 29.0250, neighborhood: "Rıhtım, Kadıköy", active: 1, earnings: 185, tips: 45, phone: "0532 111 22 33"},
    {id: 2, name: "Veli Demir", vehicle: "Motor 🏍️", x: 30, y: 28, lat: 40.9750, lon: 29.0350, neighborhood: "Fenerbahçe, Kadıköy", active: 0, earnings: 120, tips: 30, phone: "0533 222 33 44"},
    {id: 3, name: "Can Yıldız", vehicle: "E-Bisiklet 🚲", x: 8, y: 16, lat: 40.9880, lon: 29.0310, neighborhood: "Bahariye, Kadıköy", active: 0, earnings: 90, tips: 20, phone: "0534 333 44 55"},
    {id: 4, name: "Mehmet Arslan", vehicle: "Scooter 🛵", x: 22, y: 18, lat: 41.0410, lon: 29.0020, neighborhood: "Akaretler, Beşiktaş", active: 0, earnings: 140, tips: 35, phone: "0535 444 55 66"}
];

const CATEGORIES = [
    {emoji: "🍽️", name: "Hepsi", f: null},
    {emoji: "🔥", name: "Kebap", f: "Kebap"},
    {emoji: "🍔", name: "Burger", f: "Burger"},
    {emoji: "🍕", name: "Pizza", f: "Pizza"},
    {emoji: "🥢", name: "Sushi", f: "Sushi"},
    {emoji: "🍗", name: "Tavuk", f: "Tavuk"},
    {emoji: "🐟", name: "Balık", f: "Balık"},
    {emoji: "🍰", name: "Tatlı", f: "Tatlı"}
];

const FLASH_DEALS = [
    {id: 6, oldPrice: 250, newPrice: 199, discount: "%20 İNDİRİM"},
    {id: 1, oldPrice: 190, newPrice: 149, discount: "%22 İNDİRİM"},
    {id: 10, oldPrice: 230, newPrice: 179, discount: "%22 İNDİRİM"},
    {id: 18, oldPrice: 175, newPrice: 129, discount: "%26 İNDİRİM"}
];

const POPULAR_SHOWCASE_IDS = [1, 6, 10, 14, 19, 22];

const PROMO_COUPONS = [
    {code: "GUSTO30", desc: "İlk siparişe özel %30 İndirim", discountType: "percent", val: 0.30, minOrder: 100},
    {code: "PIZZA50", desc: "180 ₺ üzeri lezzetlerde 50 ₺ anında indirim", discountType: "fixed", val: 50.0, minOrder: 180},
    {code: "BURGERFEST", desc: "Tüm burgerlerde 35 ₺ net indirim", discountType: "fixed", val: 35.0, minOrder: 150},
    {code: "HEMEN10", desc: "Her siparişte 10 ₺ anında indirim", discountType: "fixed", val: 10.0, minOrder: 80}
];

const INITIAL_ADDRESSES = [
    {id: 1, title: "Evim (Moda)", desc: "Moda Cad. No:14/2 Kadıköy", x: 18, y: 14, lat: 40.9840, lon: 29.0270, neighborhood: "Moda, Kadıköy", isDefault: true},
    {id: 2, title: "İş Yerim (Maslak)", desc: "Büyükdere Cad. Maslak Plaza No:28", x: 28, y: 25, lat: 41.1100, lon: 29.0200, neighborhood: "Maslak, Sarıyer", isDefault: false},
    {id: 3, title: "Sahil / Yazlık", desc: "Caddebostan Sahil Yolu No:8", x: 22, y: 10, lat: 40.9630, lon: 29.0620, neighborhood: "Caddebostan Sahil", isDefault: false}
];

// Trendyol & Yemeksepeti Akıllı Teslimat Talimatları
const DELIVERY_INSTRUCTIONS = [
    {id: "baby", label: "👶 Zile Basma, Bebek Uyuyor", text: "Lütfen zile basmayın, bebeğimiz uyuyor. Kapıyı tıklatabilirsiniz."},
    {id: "hang", label: "🚪 Kapıya As & Zile Bas", text: "Siparişi kapı koluna asıp zile bir kez basın ve ayrılabilirsiniz."},
    {id: "sec", label: "🏢 Güvenliğe / Danışmaya Bırak", text: "Site girişindeki danışma/güvenlik masasına bırakabilirsiniz."},
    {id: "call", label: "📞 Gelince Telefonla Ara", text: "Adrese vardığınızda lütfen cep telefonumdan arayın."}
];

// Kırılımlı Değerlendirme Etiketleri
const RATING_TAGS = [
    "🔥 Sıcacık Geldi",
    "⚡ Süper Hızlı",
    "🍲 Doyurucu Porsiyon",
    "🌿 Özenli & Hijyenik Paket",
    "🛵 Kibar Kurye",
    "💯 Eksiksiz Menü"
];

// Şanslı Gusto Çarkı Dilimleri
const WHEEL_SLICES = [
    {text: "25 GustoPuan", type: "points", value: 25, color: "#FA4A0C", textColor: "#fff"},
    {text: "%20 İndirim", type: "coupon", code: "GELAL20", value: 20, color: "#2F8EFF", textColor: "#fff"},
    {text: "0 ₺ Teslimat", type: "coupon", code: "FREEDEL", value: 0, color: "#0BBF80", textColor: "#fff"},
    {text: "50 GustoPuan", type: "points", value: 50, color: "#D97706", textColor: "#fff"},
    {text: "30 ₺ İndirim", type: "coupon", code: "LEZZET30", value: 30, color: "#9B5CF6", textColor: "#fff"},
    {text: "100 GustoPuan", type: "points", value: 100, color: "#E02020", textColor: "#fff"}
];

// Yol Üstü Fırsatı (Kurye rotasındaki ara duraklar)
const ADDON_DEALS = [
    {
        id: 101,
        rId: 6,
        restName: "Tatlı Dünyası",
        name: "San Sebastian Cheesecake",
        price: 140,
        originalPrice: 175,
        img: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=300&q=80",
        tag: "Yol Üstü • 0 ₺ Kurye"
    },
    {
        id: 102,
        rId: 4,
        restName: "Sushico Express",
        name: "Çıtır Karides Rulo",
        price: 165,
        originalPrice: 210,
        img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=300&q=80",
        tag: "Şefin Tavsiyesi • 0 ₺ Kurye"
    }
];
