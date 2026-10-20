// Test mermaid diagrams with mermaid in node or validate mermaid syntax
const fs = require('fs');

const d1 = `flowchart TD
    Client["🌐 İstemci - Müşteri, Restoran, Kurye, Admin"]
    
    subgraph Layer1 ["1. İstemci ve Giriş Katmanı"]
        FC["public/index.php - Front Controller"]
        Router["Router - Rota ve HTTP Metodu Eşleme"]
    end

    subgraph Layer2 ["2. Denetleyici Controller Katmanı"]
        OC["OrderController"]
        RC["RestaurantController"]
        CC["CourierController"]
        AC["AuthController"]
    end

    subgraph Layer3 ["3. İş Mantığı ve Servis Katmanı"]
        OSM["OrderStateMachineService - State Pattern"]
        CAS["CourierAssignmentService - Manhattan Algoritması"]
        REP["ReportService - Ciro ve İstatistikler"]
        Strat["ScoreBasedAssignmentStrategy - Strategy Pattern"]
    end

    subgraph Layer4 ["4. Veri Erişim Repository Katmanı"]
        ORI["OrderRepositoryInterface"]
        SOR["SqliteOrderRepository - Koşullu UPDATE"]
        CRI["CourierRepositoryInterface"]
        SCR["SqliteCourierRepository"]
    end

    subgraph Layer5 ["5. Veri Varlıkları ve Veritabanı"]
        Models["Modeller: Order, OrderItem, Courier, Restaurant, User"]
        DB[("SQLite Veritabanı: database/app.sqlite - 7 Tablo")]
    end

    Client --> FC
    FC --> Router
    Router --> OC
    Router --> RC
    Router --> CC
    Router --> AC
    OC --> OSM
    RC --> OSM
    CC --> OSM
    OSM --> CAS
    CAS --> Strat
    OSM --> ORI
    CAS --> CRI
    ORI -.-> SOR
    CRI -.-> SCR
    SOR --> Models
    SCR --> Models
    SOR --> DB
    SCR --> DB`;

const d2 = `sequenceDiagram
    autonumber
    participant R as Restoran Şefi
    participant C as RestaurantController
    participant S as OrderStateMachineService
    participant CS as CourierAssignmentService
    participant CR as SqliteCourierRepository
    participant OR as SqliteOrderRepository

    R->>C: POST /orders/mark-ready (orderId 1042)
    C->>S: applyTransition(1042, HAZIR)
    S->>OR: findById(1042)
    OR-->>S: Order (Mevcut Durum HAZIRLANIYOR)
    
    S->>S: Durum geçişi geçerli mi?
    alt Hata Dalı 1 - Geçersiz Durum Geçişi
        S-->>C: Hata - InvalidOrderTransitionException
        C-->>R: 400 Bad Request
    else Başarılı Adım - Geçerli Durum Geçişi
        S->>CS: assignBestCourier(order)
        CS->>CR: findAvailableCouriers()
        CR-->>CS: Kurye Aday Listesi
        
        alt Hata Dalı 2 - Hiç Müsait Kurye Yoksa
            CS-->>S: Hata - NoAvailableCourierException
            S-->>C: 409 Conflict (Kurye Bekleniyor)
            C-->>R: 200 OK + Uyarı (Kurye Bekleniyor)
        else Uygun Kurye Bulundu
            CS->>CS: Puan = Mesafe + 2*AktifSiparis hesapla
            CS->>CS: En düşük puanlı Ali seçildi (Skor 6)
            CS-->>S: Kurye Ali seçildi (id 5)
            S->>OR: updateStatusConditional(1042, HAZIRLANIYOR, HAZIR)
            S->>OR: assignCourier(1042, courierId 5)
            OR-->>S: Koşullu UPDATE Başarılı
            S->>CR: incrementActiveOrders(5)
            S-->>C: Sipariş Hazır ve Kurye Atandı
            C-->>R: 200 OK (Sipariş Hazır ve Kurye Ali Yolda)
        end
    end`;

const d3 = `classDiagram
    class OrderController {
        +createOrder(cartData) void
        +transitionState(orderId, targetStatus) void
        +cancel(orderId) void
        +trackLive(orderId) void
    }

    class RestaurantController {
        +kitchenView() void
        +markReady(orderId) void
        +dailyReport(restaurantId) void
    }

    class CourierController {
        +myTasks() void
        +startDelivery(orderId) void
        +completeDelivery(orderId) void
    }

    class OrderStateMachineService {
        -orderRepo
        -courierService
        +canTransition(order, newStatus) bool
        +applyTransition(orderId, newStatus) Order
        +cancelOrder(orderId) bool
    }

    class CourierAssignmentService {
        -courierRepo
        -strategy
        +assignBestCourier(order) Courier
        +calculateManhattanDistance(x1, y1, x2, y2) int
    }

    class AssignmentStrategyInterface {
        <<interface>>
        +findBestCourier(candidates, r, targetX, targetY) Courier
    }

    class ScoreBasedAssignmentStrategy {
        +findBestCourier(candidates, r, targetX, targetY) Courier
    }

    class OrderStateInterface {
        <<interface>>
        +proceed(order, nextStatus) void
        +canCancel(order) bool
    }

    class ReceivedState {
        +proceed(order, nextStatus) void
        +canCancel(order) bool
    }

    class PreparingState {
        +proceed(order, nextStatus) void
        +canCancel(order) bool
    }

    class ReadyState {
        +proceed(order, nextStatus) void
        +canCancel(order) bool
    }

    class OnWayState {
        +proceed(order, nextStatus) void
        +canCancel(order) bool
    }

    class DeliveredState {
        +proceed(order, nextStatus) void
        +canCancel(order) bool
    }

    class OrderRepositoryInterface {
        <<interface>>
        +save(o) void
        +findById(id) Order
        +updateStatusConditional(id, oldStatus, newStatus) bool
        +assignCourier(orderId, courierId) void
    }

    class SqliteOrderRepository {
        -pdo
        +save(o) void
        +findById(id) Order
        +updateStatusConditional(id, oldStatus, newStatus) bool
    }

    class CourierRepositoryInterface {
        <<interface>>
        +findAvailableCouriers() array
        +incrementActiveOrders(courierId) void
    }

    class SqliteCourierRepository {
        -pdo
        +findAvailableCouriers() array
    }

    class Order {
        +int id
        +int customerId
        +int restaurantId
        +int courierId
        +string status
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
        +string status
    }

    OrderController ..> OrderStateMachineService
    RestaurantController ..> OrderStateMachineService
    CourierController ..> OrderStateMachineService
    OrderStateMachineService --> OrderRepositoryInterface
    OrderStateMachineService --> CourierAssignmentService
    OrderStateMachineService --> OrderStateInterface
    ReceivedState ..|> OrderStateInterface
    PreparingState ..|> OrderStateInterface
    ReadyState ..|> OrderStateInterface
    OnWayState ..|> OrderStateInterface
    DeliveredState ..|> OrderStateInterface
    CourierAssignmentService --> AssignmentStrategyInterface
    ScoreBasedAssignmentStrategy ..|> AssignmentStrategyInterface
    CourierAssignmentService --> CourierRepositoryInterface
    SqliteOrderRepository ..|> OrderRepositoryInterface
    SqliteCourierRepository ..|> CourierRepositoryInterface
    OrderRepositoryInterface ..> Order
    CourierRepositoryInterface ..> Courier`;

const d4 = `erDiagram
    USERS ||--o{ ORDERS : verir
    USERS ||--o{ COURIERS : profili
    RESTAURANTS ||--o{ MENU_ITEMS : sunar
    RESTAURANTS ||--o{ ORDERS : alir
    COURIERS ||--o{ ORDERS : tasir
    ORDERS ||--o{ ORDER_ITEMS : icerir
    MENU_ITEMS ||--o{ ORDER_ITEMS : satilir
    ORDERS ||--o{ ORDER_STATUS_LOG : tarihce

    USERS {
        int id PK
        string username
        string password_hash
        string full_name
        string phone
        string role
        datetime created_at
    }

    RESTAURANTS {
        int id PK
        int user_id FK
        string name
        int location_x
        int location_y
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
        string vehicle_type
        int current_x
        int current_y
        int active_orders_count
        string status
    }

    ORDERS {
        int id PK
        int customer_id FK
        int restaurant_id FK
        int courier_id FK
        string status
        decimal total_amount
        int delivery_x
        int delivery_y
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
    }`;

const d5 = `stateDiagram-v2
    [*] --> ALINDI : Musteri Siparis Verir
    ALINDI --> HAZIRLANIYOR : Restoran Mutfağa Alır
    ALINDI --> IPTAL : Musteri Iptal Eder
    
    HAZIRLANIYOR --> HAZIR : Restoran Paketi Tamamlar
    note right of HAZIRLANIYOR
        Bu asamadan sonra iptal kilitlenir
    end note
    
    HAZIR --> YOLDA : Kurye Paketi Alıp Yola Çıkar
    YOLDA --> TESLIM_EDILDI : Kurye Müşteriye Teslim Eder
    
    TESLIM_EDILDI --> [*]
    IPTAL --> [*]`;

console.log("All 5 diagrams defined cleanly.");
