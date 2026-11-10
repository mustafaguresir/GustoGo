<?php
declare(strict_types=1);

namespace App\Repository\Json;

use App\Model\Order;
use App\Model\OrderItem;
use App\Enum\OrderStatus;
use App\Repository\OrderRepositoryInterface;
use App\Storage\JsonStorageHelper;

final class JsonOrderRepository implements OrderRepositoryInterface
{
    private string $filePath;
    private string $restaurantsFile;
    private string $usersFile;
    private string $couriersFile;

    public function __construct(
        ?string $filePath = null,
        ?string $restaurantsFile = null,
        ?string $usersFile = null,
        ?string $couriersFile = null
    ) {
        $base = dirname(__DIR__, 3) . '/storage/';
        $this->filePath = $filePath ?? $base . 'orders.json';
        $this->restaurantsFile = $restaurantsFile ?? $base . 'restaurants.json';
        $this->usersFile = $usersFile ?? $base . 'users.json';
        $this->couriersFile = $couriersFile ?? $base . 'couriers.json';
    }

    public function save(Order $order): int
    {
        return $this->saveWithTransaction($order, $order->items);
    }

    /**
     * JSON tabanlı atomik işlem:
     * flock(LOCK_EX) ve temp dosya rename mekanizması ile transaction güvenliği sağlanır.
     */
    public function saveWithTransaction(Order $order, array $items = []): int
    {
        $records = JsonStorageHelper::read($this->filePath);
        $maxId = 0;
        $foundIndex = -1;

        foreach ($records as $index => $row) {
            $id = (int)$row['id'];
            if ($id > $maxId) {
                $maxId = $id;
            }
            if ($order->id > 0 && $id === $order->id) {
                $foundIndex = $index;
            }
        }

        if ($order->id <= 0) {
            $order->id = $maxId + 1;
        }

        if (!empty($items)) {
            $order->items = $items;
        }

        $data = $order->toArray();
        if ($foundIndex >= 0) {
            $records[$foundIndex] = $data;
        } else {
            $records[] = $data;
        }

        JsonStorageHelper::write($this->filePath, $records);
        return $order->id;
    }

    public function findById(int $id): ?Order
    {
        $records = JsonStorageHelper::read($this->filePath);
        foreach ($records as $row) {
            if ((int)$row['id'] === $id) {
                return Order::fromArray($row);
            }
        }
        return null;
    }

    public function getOrderWithDetails(int $id): ?array
    {
        $order = $this->findById($id);
        if ($order === null) {
            return null;
        }

        $restaurants = JsonStorageHelper::read($this->restaurantsFile);
        $users = JsonStorageHelper::read($this->usersFile);
        $couriers = JsonStorageHelper::read($this->couriersFile);

        $restaurantName = 'Bilinmeyen Restoran';
        foreach ($restaurants as $r) {
            if ((int)$r['id'] === $order->restaurantId) {
                $restaurantName = (string)$r['name'];
                break;
            }
        }

        $customerName = 'Bilinmeyen Müşteri';
        $customerPhone = '';
        foreach ($users as $u) {
            if ((int)$u['id'] === $order->customerId) {
                $customerName = (string)$u['full_name'];
                $customerPhone = (string)($u['phone'] ?? '');
                break;
            }
        }

        $courierName = null;
        $courierPhone = null;
        if ($order->courierId !== null) {
            foreach ($couriers as $c) {
                if ((int)$c['id'] === $order->courierId) {
                    $courierName = (string)$c['name'];
                    break;
                }
            }
        }

        return [
            'id' => $order->id,
            'status' => $order->status->value,
            'total_amount' => $order->totalAmount,
            'delivery_latitude' => $order->deliveryLatitude,
            'delivery_longitude' => $order->deliveryLongitude,
            'estimated_delivery_time' => $order->estimatedDeliveryTime,
            'created_at' => $order->createdAt,
            'customer_name' => $customerName,
            'customer_phone' => $customerPhone,
            'restaurant_name' => $restaurantName,
            'courier_name' => $courierName,
            'items' => array_map(fn(OrderItem $i) => $i->toArray(), $order->items)
        ];
    }

    public function getCustomerOrdersWithJoin(int $customerId): array
    {
        $records = JsonStorageHelper::read($this->filePath);
        $result = [];
        foreach ($records as $row) {
            if ((int)$row['customer_id'] === $customerId) {
                $details = $this->getOrderWithDetails((int)$row['id']);
                if ($details !== null) {
                    $result[] = $details;
                }
            }
        }
        return $result;
    }

    public function getRestaurantOrdersWithJoin(int $restaurantId): array
    {
        $records = JsonStorageHelper::read($this->filePath);
        $result = [];
        foreach ($records as $row) {
            if ((int)$row['restaurant_id'] === $restaurantId) {
                $details = $this->getOrderWithDetails((int)$row['id']);
                if ($details !== null) {
                    $result[] = $details;
                }
            }
        }
        return $result;
    }

    public function updateStatusConditional(int $id, OrderStatus $currentStatus, OrderStatus $newStatus): bool
    {
        $records = JsonStorageHelper::read($this->filePath);
        $updated = false;

        foreach ($records as &$row) {
            if ((int)$row['id'] === $id) {
                if ($row['status'] === $currentStatus->value) {
                    $row['status'] = $newStatus->value;
                    $updated = true;
                }
                break;
            }
        }

        if ($updated) {
            JsonStorageHelper::write($this->filePath, $records);
        }

        return $updated;
    }

    public function assignCourier(int $orderId, int $courierId): void
    {
        $records = JsonStorageHelper::read($this->filePath);
        foreach ($records as &$row) {
            if ((int)$row['id'] === $orderId) {
                $row['courier_id'] = $courierId;
                break;
            }
        }
        JsonStorageHelper::write($this->filePath, $records);
    }

    public function getDailyReport(int $restaurantId, string $date): array
    {
        $records = JsonStorageHelper::read($this->filePath);
        $count = 0;
        $totalRevenue = 0.0;

        foreach ($records as $row) {
            if ((int)$row['restaurant_id'] === $restaurantId) {
                $createdAt = (string)($row['created_at'] ?? '');
                if (str_starts_with($createdAt, $date)) {
                    $count++;
                    $totalRevenue += (float)$row['total_amount'];
                }
            }
        }

        return [
            'date' => $date,
            'total_orders' => $count,
            'total_revenue' => $totalRevenue
        ];
    }
}
