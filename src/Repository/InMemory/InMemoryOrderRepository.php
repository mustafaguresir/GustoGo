<?php
declare(strict_types=1);

namespace App\Repository\InMemory;

use App\Model\Order;
use App\Model\OrderItem;
use App\Enum\OrderStatus;
use App\Repository\OrderRepositoryInterface;

final class InMemoryOrderRepository implements OrderRepositoryInterface
{
    /** @var array<int, Order> */
    public array $orders = [];
    private int $autoIncrementId = 1;

    public function save(Order $order): int
    {
        if ($order->id <= 0) {
            $order->id = $this->autoIncrementId++;
        }
        $this->orders[$order->id] = $order;
        return $order->id;
    }

    public function saveWithTransaction(Order $order, array $items = []): int
    {
        if (!empty($items)) {
            $order->items = $items;
        }
        return $this->save($order);
    }

    public function findById(int $id): ?Order
    {
        return $this->orders[$id] ?? null;
    }

    public function getOrderWithDetails(int $id): ?array
    {
        $order = $this->findById($id);
        if ($order === null) {
            return null;
        }

        return [
            'id' => $order->id,
            'status' => $order->status->value,
            'total_amount' => $order->totalAmount,
            'delivery_latitude' => $order->deliveryLatitude,
            'delivery_longitude' => $order->deliveryLongitude,
            'estimated_delivery_time' => $order->estimatedDeliveryTime,
            'created_at' => $order->createdAt,
            'customer_name' => 'Test Müşteri',
            'restaurant_name' => 'Test Restoran',
            'courier_name' => $order->courierId !== null ? 'Test Kurye' : null,
            'items' => array_map(fn(OrderItem $i) => $i->toArray(), $order->items)
        ];
    }

    public function getCustomerOrdersWithJoin(int $customerId): array
    {
        $result = [];
        foreach ($this->orders as $order) {
            if ($order->customerId === $customerId) {
                $result[] = $this->getOrderWithDetails($order->id);
            }
        }
        return $result;
    }

    public function getRestaurantOrdersWithJoin(int $restaurantId): array
    {
        $result = [];
        foreach ($this->orders as $order) {
            if ($order->restaurantId === $restaurantId) {
                $result[] = $this->getOrderWithDetails($order->id);
            }
        }
        return $result;
    }

    public function updateStatusConditional(int $id, OrderStatus $currentStatus, OrderStatus $newStatus): bool
    {
        $order = $this->findById($id);
        if ($order === null) {
            return false;
        }

        if ($order->status === $currentStatus) {
            $order->status = $newStatus;
            $this->orders[$id] = $order;
            return true;
        }

        return false;
    }

    public function assignCourier(int $orderId, int $courierId): void
    {
        $order = $this->findById($orderId);
        if ($order !== null) {
            $order->courierId = $courierId;
            $this->orders[$orderId] = $order;
        }
    }

    public function getDailyReport(int $restaurantId, string $date): array
    {
        $count = 0;
        $totalRevenue = 0.0;
        foreach ($this->orders as $order) {
            if ($order->restaurantId === $restaurantId) {
                $count++;
                $totalRevenue += $order->totalAmount;
            }
        }
        return [
            'date' => $date,
            'total_orders' => $count,
            'total_revenue' => $totalRevenue
        ];
    }
}
