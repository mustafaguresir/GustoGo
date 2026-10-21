# GustoGo — Yemek Sipariş ve Kurye Takip Sistemi
## Tüm Sistem Diyagramları, Mimari Çizimler ve Sunum Açıklamaları

Bu belgede projenin tüm **UML ve Mimari Diyagramları** (Mermaid formatında) ve her bir diyagramın sunumda nasıl anlatılacağına dair **30 saniyelik özet anlatım rehberleri** yer almaktadır.

---

### 1. 🏛️ Katmanlı Mimari Akış Şeması (Layered Architecture)

İsteklerin sistem içerisindeki tek yönlü akışını ve katmanlar arasındaki izolasyonu gösterir:

```mermaid
flowchart TD
    Client(["🌐 İstemci (Müşteri / Restoran / Kurye / Admin Tarayıcısı)"])
    
    subgraph Layer1 ["1. İstemci & Giriş Katmanı"]
        FC["public/index.php (Front Controller)"]
        Router["Router Katmanı (Rota ve HTTP Metodu Eşleme)"]
    end

    subgraph Layer2 ["2. Denetleyici (Controller) Katmanı"]
        OC["OrderController"]
        RC["RestaurantController"]
        CC["CourierController"]
        AC["AuthController"]
    end

    subgraph Layer3 ["3. İş Mantığı ve Servis (Service) Katmanı"]
        OSM["OrderStateMachineService (State Pattern)"]
        CAS["CourierAssignmentService (Haversine ve İş Yükü Algoritması)"]
        HDS["HaversineDistanceService (Büyük Daire Küresel Mesafe)"]
        REP["ReportService (Ciro ve İstatistikler)"]
        Strat["ScoreBasedAssignmentStrategy (Strategy Pattern)"]
    end

    subgraph Layer4 ["4. Veri Erişim (Repository) Katmanı"]
        ORI["OrderRepositoryInterface"]
        SOR["SqliteOrderRepository (Koşullu UPDATE)"]
        CRI["CourierRepositoryInterface"]
        SCR["SqliteCourierRepository"]
    end

    subgraph Layer5 ["5. Veri Varlıkları ve Veritabanı (Model & DB)"]
        Models["Modeller: Order, OrderItem, Courier, Restaurant, User"]
        DB[("SQLite Veritabanı: database/app.sqlite (7 Tablo)")]
    end

    Client -->|HTTP GET / POST| FC
    FC --> Router
    Router --> OC & RC & CC & AC
    OC & RC & CC --> OSM
    OSM --> CAS
    CAS --> Strat
    OSM --> ORI
    CAS --> CRI
    ORI -.->|implements| SOR
    CRI -.->|implements| SCR
    SOR & SCR --> Models
    SOR & SCR --> DB

    style Layer1 fill:#1a233a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style Layer2 fill:#1f2937,stroke:#10b981,stroke-width:2px,color:#fff
    style Layer3 fill:#312e81,stroke:#8b5cf6,stroke-width:2px,color:#fff
    style Layer4 fill:#3730a3,stroke:#ec4899,stroke-width:2px,color:#fff
    style Layer5 fill:#18181b,stroke:#f59e0b,stroke-width:2px,color:#fff
```

> **🎤 30 Saniyede Nasıl Anlatılır?**  
> *"Hocam, burada görüldüğü gibi Front Controller'dan giren istek Router üzerinden ilgili Controller'a gider. Controller kesinlikle SQL çalıştırmaz, sadece Service katmanını tetikler. Servis katmanı State ve Strategy desenlerini kullanarak Repository arayüzleriyle konuşur. Veritabanı değiştiğinde sadece en alttaki somut Repository değişir; iş kuralları etkilenmez."*

---

### 2. 🧩 Sınıf Diyagramı (Class Diagram - 15+ Sınıf)

```mermaid
classDiagram
    class OrderController {
        +createOrder(array cartData) void
        +transitionState(int orderId, string targetStatus) void
        +cancel(int orderId) void
        +trackLive(int orderId) void
    }

    class RestaurantController {
        +kitchenView() void
        +markReady(int orderId) void
        +dailyReport(int restaurantId) void
    }

    class CourierController {
        +myTasks() void
        +startDelivery(int orderId) void
        +completeDelivery(int orderId) void
    }

    class OrderStateMachineService {
        -OrderRepositoryInterface orderRepo
        -CourierAssignmentService courierService
        +canTransition(Order order, OrderStatus newStatus) bool
        +applyTransition(int orderId, OrderStatus newStatus) Order
        +cancelOrder(int orderId) bool
    }

    class CourierAssignmentService {
        -CourierRepositoryInterface courierRepo
        -AssignmentStrategyInterface strategy
        +assignBestCourier(Order order) Courier
        +calculateManhattanDistance(int x1, int y1, int x2, int y2) int
    }

    class HaversineDistanceService {
        +calculate(float lat1, float lon1, float lat2, float lon2) float
        +calculateFromGrid(int x1, int y1, int x2, int y2) float
    }

    class AssignmentStrategyInterface {
        <<interface>>
        +findBestCourier(array candidates, Restaurant r, int targetX, int targetY) Courier
    }

    class ScoreBasedAssignmentStrategy {
        -HaversineDistanceService haversine
        +findBestCourier(array candidates, Restaurant r, int targetX, int targetY) Courier
    }

    class OrderStateInterface {
        <<interface>>
        +proceed(Order order, OrderStatus nextStatus) void
        +canCancel(Order order) bool
    }

    class ReceivedState {
        +proceed(Order order, OrderStatus nextStatus) void
        +canCancel(Order order) bool
    }

    class PreparingState {
        +proceed(Order order, OrderStatus nextStatus) void
        +canCancel(Order order) bool
    }

    class ReadyState {
        +proceed(Order order, OrderStatus nextStatus) void
        +canCancel(Order order) bool
    }

    class OnWayState {
        +proceed(Order order, OrderStatus nextStatus) void
        +canCancel(Order order) bool
    }

    class DeliveredState {
        +proceed(Order order, OrderStatus nextStatus) void
        +canCancel(Order order) bool
    }

    class OrderRepositoryInterface {
        <<interface>>
        +save(Order o) int
        +saveWithTransaction(Order o, array items) int
        +findById(int id) Order
        +getOrderWithDetails(int id) array
        +updateStatusConditional(int id, OrderStatus oldStatus, OrderStatus newStatus) bool
        +assignCourier(int orderId, int courierId) void
    }

    class SqliteOrderRepository {
        -PDO pdo
        +save(Order o) int
        +saveWithTransaction(Order o, array items) int
        +findById(int id) Order
        +getOrderWithDetails(int id) array
        +updateStatusConditional(int id, OrderStatus oldStatus, OrderStatus newStatus) bool
    }

    class CourierRepositoryInterface {
        <<interface>>
        +findAvailableCouriers() array
        +incrementActiveOrders(int courierId) void
    }

    class SqliteCourierRepository {
        -PDO pdo
        +findAvailableCouriers() array
    }

    class Order {
        +int id
        +int customerId
        +int restaurantId
        +int courierId
        +OrderStatus status
        +float totalAmount
        +int deliveryX
        +int deliveryY
    }

    class Courier {
        +int id
        +string name
        +int currentX
        +int currentY
        +int activeOrdersCount
        +CourierStatus status
    }

    OrderController ..> OrderStateMachineService : calls
    RestaurantController ..> OrderStateMachineService : calls
    CourierController ..> OrderStateMachineService : calls
    OrderStateMachineService --> OrderRepositoryInterface : uses
    OrderStateMachineService --> CourierAssignmentService : uses
    OrderStateMachineService --> OrderStateInterface : uses State Pattern
    ReceivedState ..|> OrderStateInterface : implements
    PreparingState ..|> OrderStateInterface : implements
    ReadyState ..|> OrderStateInterface : implements
    OnWayState ..|> OrderStateInterface : implements
    DeliveredState ..|> OrderStateInterface : implements
    CourierAssignmentService --> AssignmentStrategyInterface : uses Strategy Pattern
    ScoreBasedAssignmentStrategy ..|> AssignmentStrategyInterface : implements
    CourierAssignmentService --> CourierRepositoryInterface : uses
    SqliteOrderRepository ..|> OrderRepositoryInterface : implements
    SqliteCourierRepository ..|> CourierRepositoryInterface : implements
    OrderRepositoryInterface ..> Order : returns
    CourierRepositoryInterface ..> Courier : returns
```

> **🎤 30 Saniyede Nasıl Anlatılır?**  
> *"Sınıf diyagramımızda kılavuzdaki en az 12 sınıf kuralını 18 sınıf ve arayüzle karşıladık. Dikkat edilirse Controller sınıfları hiçbir zaman Repository'ye doğrudan erişmez; tüm akış `OrderStateMachineService` ve `CourierAssignmentService` üzerinden yönetilir. State deseni ile 5 durum sınıfı, Strategy deseni ile de puanlama stratejisi arayüzler arkasında modellenmiştir."*

---

### 3. ⏱️ Sıralama Diyagramı (Sequence Diagram - Çekirdek Akış ve 2 Hata Dalı)

```mermaid
sequenceDiagram
    autonumber
    participant R as Restoran Şefi (Web Paneli)
    participant C as RestaurantController
    participant S as OrderStateMachineService
    participant CS as CourierAssignmentService
    participant CR as SqliteCourierRepository
    participant OR as SqliteOrderRepository

    R->>C: POST /orders/mark-ready (orderId: 1042)
    C->>S: applyTransition(1042, OrderStatus::HAZIR)
    S->>OR: findById(1042)
    OR-->>S: Order (Mevcut Durum: HAZIRLANIYOR)
    
    S->>S: Durum geçişi geçerli mi? (HAZIRLANIYOR -> HAZIR)
    alt Hata Dalı 1: Geçersiz Durum Geçişi
        S-->>C: throw InvalidOrderTransitionException("Geçersiz aşama geçişi!")
        C-->>R: 400 Bad Request: "Hata: Bu aşamadan doğrudan Hazır'a geçilemez!"
    else Başarılı Adım: Geçerli Durum Geçişi
        S->>CS: assignBestCourier(order)
        CS->>CR: findAvailableCouriers()
        CR-->>CS: array [Kurye1, Kurye2, Kurye3]
        
        alt Hata Dalı 2: Hiç Müsait Kurye Yoksa
            CS-->>S: throw NoAvailableCourierException("Bölgede müsait kurye yok!")
            S-->>C: 409 Conflict: "Sipariş hazır, kurye bekleniyor (Sırada)"
            C-->>R: 200 OK + Uyarı: "Sipariş hazır ancak uygun kurye bekleniyor"
        else Uygun Kurye Bulundu (Akıllı Atama)
            CS->>CS: Her kurye için Puan = ManhattanMesafe + 2 * AktifSipariş hesapla
            CS->>CS: En düşük puanlı Kurye Ali'yi seç (Puan: 6)
            CS-->>S: Seçilen Kurye Ali (id: 5)
            S->>OR: updateStatusConditional(1042, HAZIRLANIYOR, HAZIR)
            S->>OR: assignCourier(1042, courierId: 5)
            OR-->>S: Koşullu UPDATE Başarılı (1 satır etkilendi)
            S->>CR: incrementActiveOrders(5)
            S-->>C: Sipariş Hazırlandı ve Kurye Ali Görevlendirildi
            C-->>R: 200 OK (JSON {status: "HAZIR", courier: "Kurye Ali", distance: 4})
        end
    end
```

> **🎤 30 Saniyede Nasıl Anlatılır?**  
> *"Bu diyagram sistemimizin kalbidir. Restoran siparişi 'Hazır' yaptığında servis önce aşamayı doğrular; sıra dışı geçişlerde Hata Dalı 1 çalışıp HTTP 400 döner. Geçerliyse kurye servisi aranır; boş kurye yoksa Hata Dalı 2 ile sipariş kuyrukta bekletilir. Kurye bulunduğunda Manhattan formülüyle en düşük puanlı Ali seçilir ve koşullu UPDATE ile atomik olarak atanır."*

---

### 4. 🗄️ ER Diyagramı (Entity-Relationship - 7 Tablo)

```mermaid
erDiagram
    USERS ||--o{ ORDERS : "verir (1-N)"
    USERS ||--o{ COURIERS : "profili (1-1)"
    RESTAURANTS ||--o{ MENU_ITEMS : "sunar (1-N)"
    RESTAURANTS ||--o{ ORDERS : "alır (1-N)"
    COURIERS ||--o{ ORDERS : "taşır (1-N)"
    ORDERS ||--o{ ORDER_ITEMS : "içerir (1-N)"
    MENU_ITEMS ||--o{ ORDER_ITEMS : "satılır (1-N)"
    ORDERS ||--o{ ORDER_STATUS_LOG : "tarihçe (1-N)"

    USERS {
        int id PK
        string username "UK"
        string password_hash
        string full_name
        string phone
        string role "customer, restaurant, courier, admin"
        datetime created_at
    }

    RESTAURANTS {
        int id PK
        int user_id FK
        string name
        int location_x "Izgara X"
        int location_y "Izgara Y"
        string phone
        boolean is_active
    }

    MENU_ITEMS {
        int id PK
        int restaurant_id FK
        string name
        string description
        decimal price
        string category
        boolean is_available
    }

    COURIERS {
        int id PK
        int user_id FK
        string vehicle_type "Motor, Bisiklet, Scooter"
        int current_x "Canlı X"
        int current_y "Canlı Y"
        int active_orders_count "İş Yükü"
        string status "musait, mesgul, offline"
    }

    ORDERS {
        int id PK
        int customer_id FK
        int restaurant_id FK
        int courier_id FK "Null olabilir"
        string status "alindi, hazirlaniyor, hazir, yolda, teslim_edildi, iptal"
        decimal total_amount
        int delivery_x "Müşteri X"
        int delivery_y "Müşteri Y"
        datetime created_at
    }

    ORDER_ITEMS {
        int id PK
        int order_id FK
        int menu_item_id FK
        int quantity
        decimal unit_price
        decimal subtotal
    }

    ORDER_STATUS_LOG {
        int id PK
        int order_id FK
        string previous_status
        string new_status
        string changed_by_user_id FK
        string comment
        datetime created_at
    }
```

> **🎤 30 Saniyede Nasıl Anlatılır?**  
> *"Veritabanımız 7 ilişkisel tablodan oluşur. `order_items` tablosu sipariş ile menü arasındaki N-M ilişkiyi çözerek 1NF'yi sağlar. `orders` tablosunda kuryenin veya restoranın adresi, telefonu saklanmaz; yalnızca ID'leri tutularak geçişli bağımlılıklar engellenmiş ve tam 3NF normalizasyonu sağlanmıştır."*

---

### 5. 🔄 Durum Geçiş Makinesi Diyagramı (State Machine Flow)

```mermaid
stateDiagram-v2
    [*] --> ALINDI : Musteri Onaylar
    ALINDI --> HAZIRLANIYOR : Mutfaga Alindi
    ALINDI --> IPTAL : Musteri Iptal Etti
    
    HAZIRLANIYOR --> HAZIR : Paket Hazirlandi ve Kurye Atandi
    
    note right of HAZIRLANIYOR
        Bu asamadan sonra iptal kesinlikle yasaktir
    end note
    
    HAZIR --> YOLDA : Kurye Yola Cikti
    YOLDA --> TESLIM_EDILDI : Kurye Teslim Etti
    
    TESLIM_EDILDI --> [*]
    IPTAL --> [*]
```

> **🎤 30 Saniyede Nasıl Anlatılır?**  
> *"Sipariş yaşam döngümüz katı bir durum makinesidir. Görüldüğü üzere iptal oku yalnızca 'Alındı' aşamasından çıkar. Mutfakta pişmeye başlanan veya kuryeye verilen siparişlerde iptal oku yoktur; restoran ve kurye zarara uğratılamaz."*

---

### 6. 🗺️ Sayfa Haritası (Page Map)

```mermaid
flowchart LR
    G["🔑 Giriş / Login (Rol Seçimli)"] --> C["🛍️ Müşteri Portalı"]
    G --> R["👨‍🍳 Restoran Paneli"]
    G --> K["🛵 Kurye Paneli"]
    G --> A["🛡️ Yönetici Paneli"]

    C --> C1["Restoran Menü & Sepet"]
    C1 --> C2["Adres / Konum Seçimi"]
    C2 --> C3["Canlı Sipariş Takip (5 Aşama)"]
    C3 -.->|Sadece Alındı İken| C4["Siparişi İptal Et"]

    R --> R1["Mutfak Canlı Kuyruk"]
    R1 --> R2["'Hazırlanıyor' Butonu"]
    R2 --> R3["'Hazır' Butonu ➔ Kurye Atanır"]
    R --> R4["Günlük Ciro Raporu"]

    K --> K1["Aktif Teslimat Görevleri"]
    K1 --> K2["Manhattan Rotası Gösterimi"]
    K2 --> K3["'Yola Çıktım' Butonu"]
    K3 --> K4["'Teslim Ettim' Butonu"]

    A --> A1["30x30 Şehir Izgara Haritası"]
    A --> A2["Kurye Filosu İş Yükü İzleme"]
    A --> A3["Order Status Audit Log"]
```
