<?php
namespace App\Repository;

use App\Model\Order;
use App\Enum\OrderStatus;
use PDO;

final class SqliteOrderRepository implements OrderRepositoryInterface
{
    public function __construct(private PDO $pdo) {}

    public function save(Order $order): int
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO orders (customer_id, restaurant_id, courier_id, status, total_amount, delivery_x, delivery_y, estimated_delivery_time)
            VALUES (:customer_id, :restaurant_id, :courier_id, :status, :total_amount, :delivery_x, :delivery_y, :estimated_delivery_time)
        ");

        $stmt->execute([
            ':customer_id' => $order->customerId,
            ':restaurant_id' => $order->restaurantId,
            ':courier_id' => $order->courierId,
            ':status' => $order->status->value,
            ':total_amount' => $order->totalAmount,
            ':delivery_x' => $order->deliveryX,
            ':delivery_y' => $order->deliveryY,
            ':estimated_delivery_time' => $order->estimatedDeliveryTime
        ]);

        $orderId = (int) $this->pdo->lastInsertId();

        // Audit log kaydı
        $this->logStatusChange($orderId, null, $order->status->value, $order->customerId, 'Sipariş oluşturuldu');

        return $orderId;
    }

    /**
     * PDO Transaction Kullanımı (Şartname Gereksinimi: "PDO ve transaction")
     * Sipariş, sipariş kalemleri ve durum tarihçesi tek bir atomik transaction içinde kaydedilir.
     * Herhangi bir adımda hata olursa rollBack() ile veritabanı bütünlüğü korunur.
     */
    public function saveWithTransaction(Order $order, array $items = []): int
    {
        $this->pdo->beginTransaction();

        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO orders (customer_id, restaurant_id, courier_id, status, total_amount, delivery_x, delivery_y, estimated_delivery_time)
                VALUES (:customer_id, :restaurant_id, :courier_id, :status, :total_amount, :delivery_x, :delivery_y, :estimated_delivery_time)
            ");

            $stmt->execute([
                ':customer_id' => $order->customerId,
                ':restaurant_id' => $order->restaurantId,
                ':courier_id' => $order->courierId,
                ':status' => $order->status->value,
                ':total_amount' => $order->totalAmount,
                ':delivery_x' => $order->deliveryX,
                ':delivery_y' => $order->deliveryY,
                ':estimated_delivery_time' => $order->estimatedDeliveryTime
            ]);

            $orderId = (int) $this->pdo->lastInsertId();

            // Sipariş kalemlerini ekle (order_items junction tablosu)
            if (!empty($items)) {
                $itemStmt = $this->pdo->prepare("
                    INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal)
                    VALUES (:order_id, :menu_item_id, :quantity, :unit_price, :subtotal)
                ");

                foreach ($items as $item) {
                    $itemStmt->execute([
                        ':order_id' => $orderId,
                        ':menu_item_id' => $item['menu_item_id'],
                        ':quantity' => $item['quantity'],
                        ':unit_price' => $item['unit_price'],
                        ':subtotal' => $item['quantity'] * $item['unit_price']
                    ]);
                }
            }

            // Denetim günlüğüne kaydet (order_status_log)
            $this->logStatusChange($orderId, null, $order->status->value, $order->customerId, 'Sipariş ve ürünler atomik transaction ile oluşturuldu');

            $this->pdo->commit();
            return $orderId;
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    public function findById(int $id): ?Order
    {
        $stmt = $this->pdo->prepare("SELECT * FROM orders WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        return new Order(
            (int) $row['id'],
            (int) $row['customer_id'],
            (int) $row['restaurant_id'],
            $row['courier_id'] !== null ? (int) $row['courier_id'] : null,
            OrderStatus::from($row['status']),
            (float) $row['total_amount'],
            (int) $row['delivery_x'],
            (int) $row['delivery_y'],
            $row['estimated_delivery_time'],
            $row['created_at']
        );
    }

    /**
     * Çoklu Tablo JOIN Sorgusu (Şartname Gereksinimi: "JOIN")
     * orders, restaurants, users (müşteri ve kurye), couriers ve order_items tablolarını birleştirir.
     */
    public function getOrderWithDetails(int $id): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT 
                o.id AS order_id,
                o.status,
                o.total_amount,
                o.delivery_x,
                o.delivery_y,
                o.estimated_delivery_time,
                o.created_at,
                r.id AS restaurant_id,
                r.name AS restaurant_name,
                r.phone AS restaurant_phone,
                u.id AS customer_id,
                u.full_name AS customer_name,
                u.phone AS customer_phone,
                c.id AS courier_id,
                cu.full_name AS courier_name,
                c.vehicle_type AS courier_vehicle
            FROM orders o
            INNER JOIN restaurants r ON o.restaurant_id = r.id
            INNER JOIN users u ON o.customer_id = u.id
            LEFT JOIN couriers c ON o.courier_id = c.id
            LEFT JOIN users cu ON c.user_id = cu.id
            WHERE o.id = :id
            LIMIT 1
        ");

        $stmt->execute([':id' => $id]);
        $orderData = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$orderData) {
            return null;
        }

        // Sipariş kalemlerini JOIN ile getir
        $itemStmt = $this->pdo->prepare("
            SELECT 
                oi.id,
                oi.quantity,
                oi.unit_price,
                oi.subtotal,
                m.name AS item_name,
                m.category
            FROM order_items oi
            INNER JOIN menu_items m ON oi.menu_item_id = m.id
            WHERE oi.order_id = :order_id
        ");
        $itemStmt->execute([':order_id' => $id]);
        $orderData['items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

        return $orderData;
    }

    public function getCustomerOrdersWithJoin(int $customerId): array
    {
        $stmt = $this->pdo->prepare("
            SELECT 
                o.id AS order_id,
                o.status,
                o.total_amount,
                o.created_at,
                r.name AS restaurant_name,
                cu.full_name AS courier_name
            FROM orders o
            INNER JOIN restaurants r ON o.restaurant_id = r.id
            LEFT JOIN couriers c ON o.courier_id = c.id
            LEFT JOIN users cu ON c.user_id = cu.id
            WHERE o.customer_id = :customer_id
            ORDER BY o.id DESC
        ");
        $stmt->execute([':customer_id' => $customerId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getRestaurantOrdersWithJoin(int $restaurantId): array
    {
        $stmt = $this->pdo->prepare("
            SELECT 
                o.id AS order_id,
                o.status,
                o.total_amount,
                o.created_at,
                u.full_name AS customer_name,
                cu.full_name AS courier_name
            FROM orders o
            INNER JOIN users u ON o.customer_id = u.id
            LEFT JOIN couriers c ON o.courier_id = c.id
            LEFT JOIN users cu ON c.user_id = cu.id
            WHERE o.restaurant_id = :restaurant_id
            ORDER BY o.id DESC
        ");
        $stmt->execute([':restaurant_id' => $restaurantId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Koşullu UPDATE: Optimistic concurrency & durum makinesi güvencesi.
     * Sadece siparişin anlık durumu beklenilen durumsa güncelleme gerçekleşir.
     */
    public function updateStatusConditional(int $id, OrderStatus $currentStatus, OrderStatus $newStatus): bool
    {
        $stmt = $this->pdo->prepare("
            UPDATE orders 
            SET status = :new_status 
            WHERE id = :id AND status = :current_status
        ");

        $stmt->execute([
            ':new_status' => $newStatus->value,
            ':id' => $id,
            ':current_status' => $currentStatus->value
        ]);

        $success = $stmt->rowCount() > 0;

        if ($success) {
            $this->logStatusChange($id, $currentStatus->value, $newStatus->value, null, 'Durum geçişi başarılı');
        }

        return $success;
    }

    public function assignCourier(int $orderId, int $courierId): void
    {
        $stmt = $this->pdo->prepare("UPDATE orders SET courier_id = :courier_id WHERE id = :id");
        $stmt->execute([
            ':courier_id' => $courierId,
            ':id' => $orderId
        ]);
    }

    /**
     * Günlük Restoran Raporu (Ciro, Sipariş Adetleri, Teslim / İptal Oranları)
     */
    public function getDailyReport(int $restaurantId, string $date): array
    {
        $stmt = $this->pdo->prepare("
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status = 'teslim_edildi' THEN total_amount ELSE 0 END) as total_revenue,
                SUM(CASE WHEN status = 'teslim_edildi' THEN 1 ELSE 0 END) as delivered_count,
                SUM(CASE WHEN status = 'iptal' THEN 1 ELSE 0 END) as cancelled_count
            FROM orders
            WHERE restaurant_id = :restaurant_id 
              AND DATE(created_at) = DATE(:date)
        ");

        $stmt->execute([
            ':restaurant_id' => $restaurantId,
            ':date' => $date
        ]);

        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [
            'total_orders' => 0,
            'total_revenue' => 0.0,
            'delivered_count' => 0,
            'cancelled_count' => 0
        ];
    }

    private function logStatusChange(int $orderId, ?string $prevStatus, string $newStatus, ?int $userId, ?string $comment): void
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO order_status_log (order_id, previous_status, new_status, changed_by_user_id, comment)
            VALUES (:order_id, :prev, :new, :user_id, :comment)
        ");

        $stmt->execute([
            ':order_id' => $orderId,
            ':prev' => $prevStatus,
            ':new' => $newStatus,
            ':user_id' => $userId,
            ':comment' => $comment
        ]);
    }
}
