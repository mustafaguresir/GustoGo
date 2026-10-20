<?php
namespace App\Repository;

use App\Model\Order;
use App\Enum\OrderStatus;

interface OrderRepositoryInterface
{
    public function save(Order $order): int;
    public function saveWithTransaction(Order $order, array $items = []): int;
    public function findById(int $id): ?Order;
    public function getOrderWithDetails(int $id): ?array;
    public function getCustomerOrdersWithJoin(int $customerId): array;
    public function getRestaurantOrdersWithJoin(int $restaurantId): array;
    public function updateStatusConditional(int $id, OrderStatus $currentStatus, OrderStatus $newStatus): bool;
    public function assignCourier(int $orderId, int $courierId): void;
    public function getDailyReport(int $restaurantId, string $date): array;
}
